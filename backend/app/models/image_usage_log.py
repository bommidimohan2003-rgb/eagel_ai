from typing import Optional
from sqlalchemy import Float, ForeignKey, Integer, String
from sqlalchemy.orm import Mapped, mapped_column
from app.db.base import Base, TimestampMixin, generate_uuid


class ImageUsageLog(Base, TimestampMixin):
    __tablename__ = "image_usage_logs"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=generate_uuid)
    user_id: Mapped[str] = mapped_column(String(36), ForeignKey("users.id", ondelete="CASCADE"), index=True, nullable=False)
    image_id: Mapped[Optional[str]] = mapped_column(String(36), ForeignKey("generated_images.id", ondelete="SET NULL"), index=True, nullable=True)

    provider: Mapped[str] = mapped_column(String(50), nullable=False)
    model: Mapped[str] = mapped_column(String(100), nullable=False)
    resolution: Mapped[str] = mapped_column(String(50), default="1024x1024", nullable=False)
    number_of_images: Mapped[int] = mapped_column(Integer, default=1, nullable=False)
    generation_time_ms: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    estimated_cost: Mapped[float] = mapped_column(Float, default=0.0, nullable=False)
