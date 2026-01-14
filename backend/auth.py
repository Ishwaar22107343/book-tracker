import os
import requests
from jose import jwt, JWTError
from fastapi import HTTPException, status
from functools import lru_cache

SUPABASE_URL = os.getenv("SUPABASE_URL")

@lru_cache()
def get_jwks():
    """Fetch JWKS from Supabase (cached)"""
    jwks_url = f"{SUPABASE_URL}/auth/v1/.well-known/jwks.json"
    try:
        response = requests.get(jwks_url, timeout=5)
        response.raise_for_status()
        return response.json()
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to fetch authentication keys"
        )

def verify_jwt(token: str) -> dict:
    """
    Verify Supabase JWT token using JWKS.
    Supports ES256, HS256, and other algorithms.
    """
    try:
        # Get the key ID and algorithm from token header
        unverified_header = jwt.get_unverified_header(token)
        kid = unverified_header.get('kid')
        alg = unverified_header.get('alg')
       
        # Get JWKS from Supabase
        jwks = get_jwks()
       
        # Find the matching key
        key = None
        for k in jwks.get('keys', []):
            if k.get('kid') == kid:
                key = k
                break
       
        if not key:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Unable to find matching key"
            )
       
        # Verify token with the public key
        payload = jwt.decode(
            token,
            key,
            algorithms=[alg],
            options={"verify_aud": False}
        )
       
        user_id = payload.get("sub")
        if not user_id:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid token: missing user ID"
            )
       
        return payload
       
    except JWTError as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Invalid token: {str(e)}"
        )
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token verification failed"
        )