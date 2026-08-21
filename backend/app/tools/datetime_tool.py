from datetime import datetime, timezone
from typing import Any, Dict
import zoneinfo
from app.tools.base import BaseTool


class DateTimeTool(BaseTool):
    @property
    def name(self) -> str:
        return "get_current_datetime"

    @property
    def description(self) -> str:
        return "Returns the current date, time, day of the week, and timezone information."

    @property
    def parameters(self) -> Dict[str, Any]:
        return {
            "type": "object",
            "properties": {
                "timezone": {
                    "type": "string",
                    "description": "Optional IANA timezone name (e.g. 'UTC', 'America/New_York', 'Europe/London', 'Asia/Kolkata'). Defaults to UTC.",
                }
            },
        }

    async def execute(self, timezone_name: str = "UTC", **kwargs: Any) -> Dict[str, Any]:
        try:
            tz = zoneinfo.ZoneInfo(timezone_name or "UTC")
            now = datetime.now(tz)
        except Exception:
            tz = timezone.utc
            now = datetime.now(tz)
            timezone_name = "UTC (fallback)"

        return {
            "success": True,
            "iso_timestamp": now.isoformat(),
            "formatted": now.strftime("%A, %B %d, %Y %I:%M:%S %p %Z"),
            "timezone": timezone_name,
            "year": now.year,
            "month": now.strftime("%B"),
            "day": now.day,
            "day_of_week": now.strftime("%A"),
        }
