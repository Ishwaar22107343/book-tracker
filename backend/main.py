import os
from dotenv import load_dotenv

load_dotenv()

from fastapi import FastAPI, Depends, HTTPException, Header, status
from fastapi.middleware.cors import CORSMiddleware
from typing import Optional
from auth import verify_jwt
from crud import (
    create_book, 
    get_user_books, 
    delete_book, 
    update_book_status, 
    get_book_by_id,
    generate_book_summary
)
from models import BookCreate, BookUpdate, BookResponse, MessageResponse, SummaryResponse

app = FastAPI(title="Book Tracker API")

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

def get_current_user(authorization: str = Header(...)) -> str:
    """Extract and verify JWT from Authorization header."""
    try:
        scheme, token = authorization.split(" ")
        if scheme.lower() != "bearer":
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid authentication scheme"
            )
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid authorization header format"
        )
   
    payload = verify_jwt(token)
    return payload["sub"]

@app.get("/")
def root():
    """Health check endpoint."""
    return {"status": "ok", "service": "Book Tracker API"}

@app.post("/books", response_model=BookResponse, status_code=status.HTTP_201_CREATED)
def create_book_endpoint(
    book: BookCreate,
    user_id: str = Depends(get_current_user)
):
    """Create a new book for the authenticated user."""
    try:
        result = create_book(
            user_id=user_id,
            title=book.title,
            author=book.author,
            status=book.status
        )
        return result
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to create book: {str(e)}"
        )

@app.get("/books", response_model=list[BookResponse])
def list_books_endpoint(
    status_filter: Optional[str] = None,
    user_id: str = Depends(get_current_user)
):
    """List all books for the authenticated user."""
    try:
        books = get_user_books(user_id, status=status_filter)
        return books
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to fetch books: {str(e)}"
        )

@app.delete("/books/{book_id}", response_model=MessageResponse)
def delete_book_endpoint(
    book_id: str,
    user_id: str = Depends(get_current_user)
):
    """Delete a book if it belongs to the authenticated user."""
    try:
        deleted = delete_book(book_id, user_id)
        if not deleted:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Book not found or unauthorized"
            )
        return {"message": "Book deleted successfully"}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to delete book: {str(e)}"
        )

@app.patch("/books/{book_id}", response_model=BookResponse)
def update_book_endpoint(
    book_id: str,
    book_update: BookUpdate,
    user_id: str = Depends(get_current_user)
):
    """Update a book's status if it belongs to the authenticated user."""
    try:
        result = update_book_status(book_id, user_id, book_update.status)
        return result
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(e)
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to update book: {str(e)}"
        )

@app.get("/books/{book_id}/summary", response_model=SummaryResponse)
def get_book_summary_endpoint(
    book_id: str,
    user_id: str = Depends(get_current_user)
):
    """Generate an AI-powered summary for a specific book."""
    try:
        # Verify the book belongs to the user
        book = get_book_by_id(book_id, user_id)
        if not book:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Book not found or unauthorized"
            )
        
        # Generate summary
        summary = generate_book_summary(book["title"], book["author"])
        
        return {
            "book_id": book_id,
            "title": book["title"],
            "author": book["author"],
            "summary": summary
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to generate summary: {str(e)}"
        )

if __name__ == "__main__":
    import uvicorn
    port = int(os.getenv("PORT", 8000))
    uvicorn.run(app, host="0.0.0.0", port=port)