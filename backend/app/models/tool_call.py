from typing import TYPE_CHECKING, Any, Dict, Optional
from sqlalchemy import Float, ForeignKey, JSON, String
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.db.base import Base, TimestampMixin, generate_uuid

if TYPE_CHECKING:
    from app.models.message import Message


class ToolCall(Base, TimestampMixin):
    __tablename__ = "tool_calls"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=generate_uuid)
    message_id: Mapped[str] = mapped_column(String(36), ForeignKey("messages.id", ondelete="CASCADE"), index=True, nullable=False)
    
    tool_name: Mapped[str] = mapped_column(String(100), nullable=False)
    arguments: Mapped[Dict[str, Any]] = mapped_column(JSON, nullable=False)
    result: Mapped[Optional[Dict[str, Any]]] = mapped_column(JSON, nullable=True)
    status: Mapped[str] = mapped_column(String(30), default="success", nullable=False)  # "pending", "success", "failed"
    duration_ms: Mapped[Optional[float]] = mapped_column(Float, nullable=True)

    # Relationships
    message: Mapped["Message"] = relationship("Message", back_populates="tool_calls")
