import base64
import hashlib
from cryptography.fernet import Fernet
from django.conf import settings


def _get_fernet():
    # Derive a 32-byte urlsafe base64 key from the Django SECRET_KEY
    raw = settings.SECRET_KEY.encode('utf-8')
    digest = hashlib.sha256(raw).digest()
    key = base64.urlsafe_b64encode(digest)
    return Fernet(key)


def encrypt_bytes(data: bytes) -> bytes:
    """Encrypt raw bytes and return the token (bytes).

    Uses Fernet (AES-128 in CBC with HMAC) for simplicity and correct
    authenticated encryption semantics. The returned token contains
    all metadata required for decryption.
    """
    f = _get_fernet()
    return f.encrypt(data)


def decrypt_bytes(token: bytes) -> bytes:
    """Decrypt a token previously produced by encrypt_bytes and return raw bytes."""
    f = _get_fernet()
    return f.decrypt(token)
