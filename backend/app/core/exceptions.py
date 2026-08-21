from typing import Any, Optional


class AppException(Exception):
    def __init__(
        self,
        code: str,
        message: str,
        status_code: int = 400,
        details: Optional[Any] = None,
    ):
        self.code = code
        self.message = message
        self.status_code = status_code
        self.details = details
        super().__init__(self.message)


class AuthenticationError(AppException):
    def __init__(self, message: str = "Invalid credentials", details: Optional[Any] = None):
        super().__init__(code="AUTHENTICATION_FAILED", message=message, status_code=401, details=details)


class AuthorizationError(AppException):
    def __init__(self, message: str = "Permission denied", details: Optional[Any] = None):
        super().__init__(code="PERMISSION_DENIED", message=message, status_code=403, details=details)


class NotFoundError(AppException):
    def __init__(self, resource: str = "Resource", details: Optional[Any] = None):
        super().__init__(code="NOT_FOUND", message=f"{resource} not found", status_code=404, details=details)


class AIProviderError(AppException):
    def __init__(self, message: str = "AI Provider error", details: Optional[Any] = None):
        super().__init__(code="AI_PROVIDER_ERROR", message=message, status_code=502, details=details)


class RateLimitExceededError(AppException):
    def __init__(self, message: str = "Rate limit exceeded. Please wait.", details: Optional[Any] = None):
        super().__init__(code="RATE_LIMIT_EXCEEDED", message=message, status_code=429, details=details)


class FileProcessingError(AppException):
    def __init__(self, message: str = "File processing failed", details: Optional[Any] = None):
        super().__init__(code="FILE_PROCESSING_ERROR", message=message, status_code=422, details=details)
