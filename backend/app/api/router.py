from fastapi import APIRouter
from app.api.v1.auth import router as auth_router
from app.api.v1.chat import router as chat_router
from app.api.v1.conversations import router as conversations_router
from app.api.v1.files import router as files_router
from app.api.v1.health import router as health_router
from app.api.v1.images import router as images_router
from app.api.v1.memory import router as memory_router
from app.api.v1.settings import router as settings_router
from app.api.v1.users import router as users_router

api_router = APIRouter()

api_router.include_router(health_router)
api_router.include_router(auth_router)
api_router.include_router(users_router)
api_router.include_router(conversations_router)
api_router.include_router(chat_router)
api_router.include_router(images_router)
api_router.include_router(memory_router)
api_router.include_router(files_router)
api_router.include_router(settings_router)
