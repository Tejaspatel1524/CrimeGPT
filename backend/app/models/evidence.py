from enum import Enum


class FileType(str, Enum):
    jpg = "jpg"
    jpeg = "jpeg"
    png = "png"
    pdf = "pdf"
    txt = "txt"


ALLOWED_EXTENSIONS = {ft.value for ft in FileType}
ALLOWED_MIME_TYPES = {
    "image/jpeg", "image/png", "application/pdf", "text/plain"
}
