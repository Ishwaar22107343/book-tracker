from pydantic import BaseModel, Field
from typing import Literal, Optional
from datetime import datetime

class BookCreate(BaseModel):
    title: str = Field(..., min_length=1, max_length=500)
    author: str = Field(..., min_length=1, max_length=200)
    status: Literal["reading", "completed", "wishlist"]

class BookUpdate(BaseModel):
    status: Literal["reading", "completed", "wishlist"]

class BookResponse(BaseModel):
    id: str
    user_id: str
    title: str
    author: str
    status: str
    created_at: datetime

class MessageResponse(BaseModel):
    message: str

class SummaryResponse(BaseModel):
    book_id: str
    title: str
    author: str
    summary: str