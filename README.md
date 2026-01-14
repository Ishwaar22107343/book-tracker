**Book Tracker**
A full-stack book tracking application with AI-powered book summaries. Track your reading list, organize books by status, and get intelligent summaries using AI.

**Features**
User authentication with Supabase
Add, edit, and delete books
Filter books by status (Reading, Completed, Wishlist)
AI-powered book summaries (OpenAI with Groq fallback)
Responsive design with Tailwind CSS
Fast and modern tech stack

**Tech Stack (Frontend)**
React 18
Vite
Tailwind CSS
React Router
Supabase Auth

**Backend**
FastAPI (Python)
Supabase (PostgreSQL)
OpenAI API / Groq API
JWT Authentication

**Live Demo**
Frontend: Deployed on Vercel
Backend: Deployed on Render

**Installation (Prerequisites)**
Node.js 16+
Python 3.8+
Supabase account
OpenAI API key (optional) or Groq API key

**Backend Setup**
```
cd backend
python -m venv venv
venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env
python main.py
```

**Frontend Setup**
```
cd frontend
npm install
cp .env.example .env
npm run dev
```

**Environmental Variables**
*Backend(.env)*
```
SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
SUPABASE_JWT_SECRET=your_jwt_secret
OPENAI_API_KEY=your_openai_api_key
GROQ_API_KEY=your_groq_api_key
PORT=8000
```

*Frontend(.env)*
```
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_anon_key
VITE_API_URL=http://localhost:8000
```

**Database Schema**
```
CREATE TABLE books (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    title VARCHAR(500) NOT NULL,
    author VARCHAR(200) NOT NULL,
    status VARCHAR(20) NOT NULL CHECK (status IN ('reading', 'completed', 'wishlist')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_books_user_id ON books(user_id);
CREATE INDEX idx_books_status ON books(status);
```