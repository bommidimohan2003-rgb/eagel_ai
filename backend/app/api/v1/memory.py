from typing import List, Optional
from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.ext.asyncio import AsyncSession
from app.api.v1.auth import get_current_user
from app.db.session import get_db
from app.models.user import User
from app.schemas.memory import MemoryCreate, MemoryResponse, MemoryUpdate
from app.services.memory_service import MemoryService

router = APIRouter(prefix="/memory", tags=["Long-Term Memory"])


@router.get("", response_model=List[MemoryResponse])
async def get_memories(
    category: Optional[str] = Query(None, description="Filter by category"),
    limit: int = Query(50, ge=1, le=100),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    return await MemoryService.get_memories(
        db=db,
        user_id=current_user.id,
        category=category,
        limit=limit,
    )


@router.post("", response_model=MemoryResponse, status_code=status.HTTP_201_CREATED)
async def create_memory(
    data: MemoryCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    return await MemoryService.create_memory(
        db=db,
        user_id=current_user.id,
        content=data.content,
        category=data.category,
        importance=data.importance,
    )


@router.patch("/{memory_id}", response_model=MemoryResponse)
async def update_memory(
    memory_id: str,
    data: MemoryUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    return await MemoryService.update_memory(
        db=db,
        memory_id=memory_id,
        user_id=current_user.id,
        content=data.content,
        category=data.category,
        importance=data.importance,
    )


@router.delete("/{memory_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_memory(
    memory_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    await MemoryService.delete_memory(
        db=db,
        memory_id=memory_id,
        user_id=current_user.id,
    )
    return None


@router.delete("/actions/clear-all", status_code=status.HTTP_200_OK)
async def clear_all_memories(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    deleted_count = await MemoryService.clear_all_memories(
        db=db,
        user_id=current_user.id,
    )
    return {"success": True, "deleted_count": deleted_count}
