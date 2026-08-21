from datetime import datetime
from typing import Optional
from pydantic import BaseModel, ConfigDict, Field


class MemoryBase(BaseModel):
    category: str = Field(default="preference", description="preference, fact, project, instruction")
    content: str
    importance: int = Field(default=1, ge=1, le=5)


class MemoryCreate(MemoryBase):
    pass


class MemoryUpdate(BaseModel):
    category: Optional[str] = None
    content: Optional[str] = None
    importance: Optional[int] = Field(default=None, ge=1, le=5)


class MemoryResponse(MemoryBase):
    id: str
    user_id: str
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)
