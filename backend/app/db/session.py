import asyncio
import os
from typing import AsyncGenerator
from urllib.parse import urlparse
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine
from app.core.config import settings
from app.core.logging import logger

db_url = settings.DATABASE_URL

# Normalize cloud PostgreSQL / MySQL URLs for async drivers (e.g. Supabase, Neon, Railway)
if db_url.startswith("postgres://"):
    db_url = db_url.replace("postgres://", "postgresql+asyncpg://", 1)
elif db_url.startswith("postgresql://") and not db_url.startswith("postgresql+asyncpg://"):
    db_url = db_url.replace("postgresql://", "postgresql+asyncpg://", 1)
elif db_url.startswith("mysql://") and not db_url.startswith("mysql+aiomysql://"):
    db_url = db_url.replace("mysql://", "mysql+aiomysql://", 1)

# When deployed on Vercel without an external DB, localhost MySQL is unreachable. Fallback to /tmp/nemotron.db
if os.environ.get("VERCEL") and ("localhost" in db_url or "127.0.0.1" in db_url):
    db_url = "sqlite+aiosqlite:////tmp/nemotron.db"
    logger.info("Vercel deployment detected with local DB URL: falling back to /tmp/nemotron.db SQLite engine.")

connect_args = {}
if db_url.startswith("sqlite"):
    connect_args["check_same_thread"] = False
elif "postgresql" in db_url:
    # Ensure SSL is handled smoothly for cloud PostgreSQL like Supabase/Neon
    connect_args["server_settings"] = {"application_name": "eagle_ai"}

engine = create_async_engine(
    db_url,
    echo=False,
    future=True,
    connect_args=connect_args,
    pool_pre_ping=True,
    pool_recycle=3600,
)

AsyncSessionLocal = async_sessionmaker(
    bind=engine,
    class_=AsyncSession,
    expire_on_commit=False,
    autocommit=False,
    autoflush=False,
)

_db_initialized = False
_init_lock = asyncio.Lock()


async def init_db_if_needed():
    """
    Ensures database is accessible and all schema tables exist.
    """
    global _db_initialized
    if _db_initialized:
        return

    async with _init_lock:
        if _db_initialized:
            return

        if "mysql" in db_url:
            try:
                parsed = urlparse(db_url)
                db_name = parsed.path.lstrip("/")
                if db_name:
                    base_url = db_url.replace(f"/{db_name}", "")
                    temp_engine = create_async_engine(base_url, isolation_level="AUTOCOMMIT")
                    async with temp_engine.connect() as conn:
                        await conn.execute(text(f"CREATE DATABASE IF NOT EXISTS `{db_name}` DEFAULT CHARACTER SET utf8mb4;"))
                    await temp_engine.dispose()
                    logger.info(f"Verified / created MySQL database `{db_name}`.")
            except Exception as e:
                logger.warning(f"Could not auto-create MySQL database: {e}")

        # Create all tables if they don't exist
        try:
            from app.db.base import Base
            # Import models to register them on Base.metadata
            import app.models  # noqa: F401

            async with engine.begin() as conn:
                await conn.run_sync(Base.metadata.create_all)
            logger.info("Database schema tables verified/created successfully.")
            _db_initialized = True
        except Exception as e:
            logger.warning(f"Database initialization warning: {e}")


async def get_db() -> AsyncGenerator[AsyncSession, None]:
    if not _db_initialized:
        await init_db_if_needed()

    async with AsyncSessionLocal() as session:
        try:
            yield session
        except Exception:
            await session.rollback()
            raise
        finally:
            await session.close()
