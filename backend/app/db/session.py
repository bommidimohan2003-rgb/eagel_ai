import os
from typing import AsyncGenerator
from urllib.parse import urlparse
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine
from app.core.config import settings
from app.core.logging import logger

db_url = settings.DATABASE_URL

# When deployed on Vercel, localhost MySQL is unreachable. Fallback to /tmp/nemotron.db
if os.environ.get("VERCEL") and ("localhost" in db_url or "127.0.0.1" in db_url):
    db_url = "sqlite+aiosqlite:////tmp/nemotron.db"
    logger.info("Vercel deployment detected with local DB URL: falling back to /tmp/nemotron.db SQLite engine.")

connect_args = {}
if db_url.startswith("sqlite"):
    connect_args["check_same_thread"] = False

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


async def init_db_if_needed():
    """
    Ensures MySQL / SQLite database is accessible and tables exist.
    If database does not exist in MySQL, attempts to create it automatically.
    """
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
            logger.warning(f"Could not auto-create MySQL database (might already exist or server not ready): {e}")

    # Create all tables if they don't exist
    try:
        from app.db.base import Base
        async with engine.begin() as conn:
            await conn.run_sync(Base.metadata.create_all)
        logger.info("Database schema tables verified/created successfully.")
    except Exception as e:
        logger.warning(f"Could not auto-create schema tables: {e}")


async def get_db() -> AsyncGenerator[AsyncSession, None]:
    async with AsyncSessionLocal() as session:
        try:
            yield session
        except Exception:
            await session.rollback()
            raise
        finally:
            await session.close()
