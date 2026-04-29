import random
import string

SLUG_CHARS = string.ascii_letters + string.digits
MAX_RETRIES = 3


def generate_slug(length: int = 6) -> str:
    return "".join(random.choices(SLUG_CHARS, k=length))
