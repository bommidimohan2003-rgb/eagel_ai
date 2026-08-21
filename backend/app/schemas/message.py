from datetime import datetime
from typing import Any, Dict, List, Optional
from pydantic import BaseModel, ConfigDict


class MessageBase(BaseModel):
    role: str  # "system", "user", "assistant", "tool"
    content: str
    model: Optional[str] = None


class MessageCreate(MessageBase):
    conversation_id: str
    token_usage: Optional[Dict[str, Any]] = None
    extra_metadata: Optional[Dict[str, Any]] = None


class MessageResponse(MessageBase):
    id: str
    conversation_id: str
    token_usage: Optional[Dict[str, Any]] = None
    extra_metadata: Optional[Dict[str, Any]] = None
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)
