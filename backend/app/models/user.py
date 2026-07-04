from enum import Enum


class UserRole(str, Enum):
    admin = "admin"
    investigator = "investigator"
    viewer = "viewer"


# Role permission map
ROLE_PERMISSIONS = {
    UserRole.admin: {
        "cases", "evidence", "ocr", "extract-entities",
        "fraud", "report", "users", "settings",
    },
    UserRole.investigator: {
        "cases", "evidence", "ocr", "extract-entities",
        "fraud", "report",
    },
    UserRole.viewer: {
        "cases", "evidence", "report",  # read-only access
    },
}
