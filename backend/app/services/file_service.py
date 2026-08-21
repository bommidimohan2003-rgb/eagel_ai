import io
import os
import uuid
from typing import List, Optional
from fastapi import UploadFile
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.config import settings
from app.core.exceptions import FileProcessingError, NotFoundError, AuthorizationError
from app.core.logging import logger
from app.models.file import File

# Optional parsers
try:
    import pypdf
except ImportError:
    pypdf = None

try:
    import docx
except ImportError:
    docx = None


class FileService:
    @staticmethod
    def _extract_text(file_bytes: bytes, file_type: str) -> str:
        text = ""
        file_type = file_type.lower().strip(".")

        if file_type in ["txt", "md", "csv", "json", "py", "js", "ts", "html", "css", "yaml", "yml"]:
            try:
                text = file_bytes.decode("utf-8", errors="replace")
            except Exception as e:
                logger.warning(f"Error decoding plain text file: {e}")
                text = file_bytes.decode("latin-1", errors="replace")

        elif file_type == "pdf":
            if pypdf is None:
                raise FileProcessingError("PDF processing library (pypdf) is not installed")
            try:
                reader = pypdf.PdfReader(io.BytesIO(file_bytes))
                pages = [page.extract_text() or "" for page in reader.pages]
                text = "\n\n".join(pages)
            except Exception as e:
                logger.error(f"Failed to extract PDF text: {e}")
                raise FileProcessingError(f"Failed to parse PDF document: {str(e)}")

        elif file_type in ["docx", "doc"]:
            if docx is None:
                raise FileProcessingError("DOCX processing library (python-docx) is not installed")
            try:
                doc = docx.Document(io.BytesIO(file_bytes))
                paragraphs = [p.text for p in doc.paragraphs if p.text]
                text = "\n".join(paragraphs)
            except Exception as e:
                logger.error(f"Failed to extract DOCX text: {e}")
                raise FileProcessingError(f"Failed to parse DOCX document: {str(e)}")

        else:
            # Fallback best-effort text extraction
            try:
                text = file_bytes.decode("utf-8", errors="ignore")
            except Exception:
                text = ""

        return text.strip()

    @staticmethod
    async def upload_and_process_file(
        db: AsyncSession,
        upload_file: UploadFile,
        user_id: str,
        conversation_id: Optional[str] = None,
    ) -> File:
        filename = upload_file.filename or "unknown_file"
        ext = os.path.splitext(filename)[1].lower().strip(".")
        
        contents = await upload_file.read()
        file_size = len(contents)

        if file_size > settings.MAX_FILE_SIZE_BYTES:
            raise FileProcessingError(
                f"File exceeds maximum allowed size of {settings.MAX_FILE_SIZE_BYTES // (1024 * 1024)} MB"
            )

        # Save to disk
        unique_filename = f"{uuid.uuid4()}_{filename}"
        storage_path = os.path.join(settings.UPLOAD_DIR, unique_filename)
        with open(storage_path, "wb") as f:
            f.write(contents)

        # Extract text
        try:
            extracted_text = FileService._extract_text(contents, ext)
            status = "processed"
        except Exception as e:
            logger.warning(f"File text extraction issue: {e}")
            extracted_text = ""
            status = "error"

        file_record = File(
            user_id=user_id,
            conversation_id=conversation_id,
            filename=unique_filename,
            original_filename=filename,
            file_type=ext or "unknown",
            file_size=file_size,
            storage_path=storage_path,
            extracted_text=extracted_text,
            status=status,
        )

        db.add(file_record)
        await db.commit()
        await db.refresh(file_record)
        return file_record

    @staticmethod
    async def get_files(
        db: AsyncSession,
        user_id: str,
        conversation_id: Optional[str] = None,
    ) -> List[File]:
        query = select(File).where(File.user_id == user_id)
        if conversation_id:
            query = query.where(File.conversation_id == conversation_id)
        
        result = await db.execute(query.order_by(File.created_at.desc()))
        return list(result.scalars().all())

    @staticmethod
    async def delete_file(
        db: AsyncSession,
        file_id: str,
        user_id: str,
    ) -> None:
        stmt = select(File).where(File.id == file_id)
        result = await db.execute(stmt)
        file_record = result.scalar_one_or_none()

        if not file_record:
            raise NotFoundError("File")
        if file_record.user_id != user_id:
            raise AuthorizationError("You do not own this file")

        if os.path.exists(file_record.storage_path):
            try:
                os.remove(file_record.storage_path)
            except OSError as e:
                logger.warning(f"Could not remove local file: {e}")

        await db.delete(file_record)
        await db.commit()
