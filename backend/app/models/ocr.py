from enum import Enum

OCR_SUPPORTED_EXTENSIONS = {"jpg", "jpeg", "png", "pdf"}


class OCRStatus(str, Enum):
    processed = "processed"
    failed = "failed"
