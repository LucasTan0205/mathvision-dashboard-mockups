import os
from fastapi import Header, HTTPException, Security
from fastapi.security.api_key import APIKeyHeader

API_KEY_NAME = "X-API-Key"
api_key_header = APIKeyHeader(name=API_KEY_NAME, auto_error=False)


async def verify_api_key(api_key: str = Security(api_key_header)) -> str:
    expected = os.environ.get("MATHVISION_API_KEY", "")
    if not api_key or api_key != expected:
        raise HTTPException(status_code=401, detail="unauthorized")
    return api_key
