ALLOWED = ["png", "jpeg", "jpg"]


def is_allowed_file(filename: str) -> bool:
    for a in ALLOWED:
        if filename.endswith("." + a):
            return True
    return False
