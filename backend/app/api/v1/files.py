from typing import List, Optional
from fastapi import APIRouter, Depends, File as FastAPIFile, Query, UploadFile, status
from sqlalchemy.ext.asyncio import AsyncSession
from app.api.v1.auth import get_current_user
from app.db.session import get_db
from app.models.user import User
from app.schemas.file import FileResponse
from app.services.file_service import FileService

router = APIRouter(prefix="/files", tags=["Files"])


@router.post("/upload", response_model=FileResponse, status_code=status.HTTP_201_CREATED)
async def upload_file(
    file: UploadFile = FastAPIFile(...),
    conversation_id: Optional[str] = Query(None),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    return await FileService.upload_and_process_file(
        db=db,
        upload_file=file,
        user_id=current_user.id,
        conversation_id=conversation_id,
    )


@router.get("", response_model=List[FileResponse])
async def list_files(
    conversation_id: Optional[str] = Query(None),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    return await FileService.get_files(
        db=db,
        user_id=current_user.id,
        conversation_id=conversation_id,
    )


@router.delete("/{file_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_file(
    file_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    await FileService.delete_file(
        db=db,
        file_id=file_id,
        user_id=current_user.id,
    )
    return None
