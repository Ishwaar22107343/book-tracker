import os
import requests
from typing import List, Optional

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_SERVICE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY")
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")
GROQ_API_KEY = os.getenv("GROQ_API_KEY")

if not SUPABASE_URL or not SUPABASE_SERVICE_KEY:
    raise ValueError("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in environment")

HEADERS = {
    "apikey": SUPABASE_SERVICE_KEY,
    "Authorization": f"Bearer {SUPABASE_SERVICE_KEY}",
    "Content-Type": "application/json",
    "Prefer": "return=representation"
}

BASE_URL = f"{SUPABASE_URL}/rest/v1"

def create_book(user_id: str, title: str, author: str, status: str) -> dict:
    """Insert a new book for the user."""
    url = f"{BASE_URL}/books"
    payload = {
        "user_id": user_id,
        "title": title,
        "author": author,
        "status": status
    }
   
    response = requests.post(url, json=payload, headers=HEADERS)
    response.raise_for_status()
    return response.json()[0]

def get_user_books(user_id: str, status: Optional[str] = None) -> List[dict]:
    """Fetch all books for a specific user, optionally filtered by status."""
    url = f"{BASE_URL}/books?user_id=eq.{user_id}&select=*&order=created_at.desc"
   
    if status:
        url += f"&status=eq.{status}"
   
    response = requests.get(url, headers=HEADERS)
    response.raise_for_status()
    return response.json()

def delete_book(book_id: str, user_id: str) -> bool:
    """Delete a book if it belongs to the user."""
    url = f"{BASE_URL}/books?id=eq.{book_id}&user_id=eq.{user_id}"
   
    response = requests.delete(url, headers=HEADERS)
    response.raise_for_status()
    return response.status_code == 204 or response.status_code == 200

def update_book_status(book_id: str, user_id: str, new_status: str) -> dict:
    """Update book status if it belongs to the user."""
    url = f"{BASE_URL}/books?id=eq.{book_id}&user_id=eq.{user_id}"
    payload = {"status": new_status}
   
    response = requests.patch(url, json=payload, headers=HEADERS)
    response.raise_for_status()
   
    result = response.json()
    if not result:
        raise ValueError("Book not found or unauthorized")
   
    return result[0]

def get_book_by_id(book_id: str, user_id: str) -> Optional[dict]:
    """Get a specific book if it belongs to the user."""
    url = f"{BASE_URL}/books?id=eq.{book_id}&user_id=eq.{user_id}&select=*"
   
    response = requests.get(url, headers=HEADERS)
    response.raise_for_status()
   
    result = response.json()
    return result[0] if result else None

def generate_book_summary(title: str, author: str) -> str:
    """
    Generate an AI-powered summary of a book.
    Tries OpenAI first, falls back to Groq (free) if OpenAI fails.
    Returns a concise summary including plot overview, themes, and key takeaways.
    """
    prompt = f"""Please provide a concise summary of the book "{title}" by {author}. 
    
Include:
1. A brief plot overview (2-3 sentences)
2. Main themes (2-3 key themes)
3. Notable aspects or why it's significant

Keep the response under 200 words and make it informative for someone deciding whether to read the book."""

    # Try OpenAI first
    if OPENAI_API_KEY:
        try:
            response = requests.post(
                "https://api.openai.com/v1/chat/completions",
                headers={
                    "Authorization": f"Bearer {OPENAI_API_KEY}",
                    "Content-Type": "application/json"
                },
                json={
                    "model": "gpt-3.5-turbo",
                    "messages": [
                        {
                            "role": "user",
                            "content": prompt
                        }
                    ],
                    "max_tokens": 500,
                    "temperature": 0.7
                },
                timeout=30
            )
            response.raise_for_status()
            
            data = response.json()
            summary = data["choices"][0]["message"]["content"]
            return summary
            
        except requests.exceptions.RequestException as e:
            print(f"OpenAI failed: {str(e)}, falling back to Groq...")
    
    # Fallback to Groq (free alternative)
    if GROQ_API_KEY:
        try:
            response = requests.post(
                "https://api.groq.com/openai/v1/chat/completions",
                headers={
                    "Authorization": f"Bearer {GROQ_API_KEY}",
                    "Content-Type": "application/json"
                },
                json={
                    "model": "llama-3.3-70b-versatile",
                    "messages": [
                        {
                            "role": "user",
                            "content": prompt
                        }
                    ],
                    "max_tokens": 500,
                    "temperature": 0.7
                },
                timeout=30
            )
            response.raise_for_status()
            
            data = response.json()
            summary = data["choices"][0]["message"]["content"]
            return summary
            
        except requests.exceptions.RequestException as e:
            raise Exception(f"Failed to generate summary with Groq: {str(e)}")
    
    # If neither API key is configured
    raise ValueError("No AI API key configured. Please set OPENAI_API_KEY or GROQ_API_KEY in environment variables.")