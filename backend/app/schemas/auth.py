from pydantic import BaseModel
from typing import Optional

class Token(BaseModel):
    access_token: str
    token_type: str

class TokenData(BaseModel):
    email: str | None = None
    role: str | None = None

class GoogleLoginRequest(BaseModel):
    token: str
    admin_id: Optional[str] = None # For student registration
