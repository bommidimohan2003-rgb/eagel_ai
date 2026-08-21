from datetime import datetime
from typing import Optional
from pydantic import BaseModel, ConfigDict


class FileResponse(BaseModel):
    id: str
    user_id: str
    conversation_id: Optional[str] = None
    filename: str
    original_filename: str
    file_type: str
    file_size: int
    status: str
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class FileDetailResponse(FileResponse):
    extracted_text_preview: Optional[str] = None
