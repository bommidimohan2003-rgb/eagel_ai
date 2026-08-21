from fastapi import APIRouter, Depends
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.config import settings
from app.db.session import get_db
from app.providers.nvidia import NVIDIAProvider

router = APIRouter(tags=["Health & Observability"])
nvidia_provider = NVIDIAProvider()


@router.get("/health")
async def health_check(db: AsyncSession = Depends(get_db)):
    # 1. Check Database
    db_status = "healthy"
    try:
        await db.execute(text("SELECT 1"))
    except Exception as e:
        db_status = f"unhealthy: {str(e)}"

    # 2. Check NVIDIA Provider
    ai_status = "ready"
    if not settings.NVIDIA_API_KEY or settings.NVIDIA_API_KEY == "your-nvidia-api-key-here":
        ai_status = "key_not_set"
    else:
        is_healthy = await nvidia_provider.health_check()
        ai_status = "connected" if is_healthy else "unreachable"

    return {
        "status": "healthy" if db_status == "healthy" else "degraded",
        "database": db_status,
        "ai_provider": {
            "provider": "nvidia",
            "model": settings.NVIDIA_MODEL,
            "status": ai_status,
        },
        "environment": settings.ENVIRONMENT,
    }
