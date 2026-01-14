import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase, signOut } from '../api/supabaseClient'
import { api } from '../api/backendApi'
import BookForm from '../components/BookForm'
import BookList from '../components/BookList'

export default function Dashboard() {
  const [books, setBooks] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [filter, setFilter] = useState(null)
  const [user, setUser] = useState(null)
  const navigate = useNavigate()

  useEffect(() => {
    checkAuth()
  }, [])

  useEffect(() => {
    if (user) {
      loadBooks()
    }
  }, [user, filter])

  const checkAuth = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession()
     
      if (!session) {
        navigate('/login')
        return
      }

      setUser(session.user)
    } catch (err) {
      console.error('Auth check failed:', err)
      navigate('/login')
    }
  }

  const loadBooks = async () => {
    setLoading(true)
    setError('')

    try {
      const data = await api.getBooks(filter)
      setBooks(data)
    } catch (err) {
      setError(err.message || 'Failed to load books')
      if (err.status === 401) {
        navigate('/login')
      }
    } finally {
      setLoading(false)
    }
  }

  const handleBookAdded = (newBook) => {
    setBooks([newBook, ...books])
  }

  const handleBookDeleted = (bookId) => {
    setBooks(books.filter(book => book.id !== bookId))
  }

  const handleBookUpdated = (updatedBook) => {
    setBooks(books.map(book =>
      book.id === updatedBook.id ? updatedBook : book
    ))
  }

  const handleLogout = async () => {
    try {
      await signOut()
      navigate('/login')
    } catch (err) {
      console.error('Logout failed:', err)
    }
  }

  const stats = {
    total: books.length,
    reading: books.filter(b => b.status === 'reading').length,
    completed: books.filter(b => b.status === 'completed').length,
    wishlist: books.filter(b => b.status === 'wishlist').length,
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Book Tracker</h1>
              {user && (
                <p className="text-sm text-gray-600 mt-1">{user.email}</p>
              )}
            </div>
            <button
              onClick={handleLogout}
              className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-100 rounded-md transition"
            >
              Sign Out
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white rounded-lg shadow p-4">
            <p className="text-sm text-gray-600">Total Books</p>
            <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
          </div>
          <div className="bg-blue-50 rounded-lg shadow p-4">
            <p className="text-sm text-blue-600">Reading</p>
            <p className="text-2xl font-bold text-blue-900">{stats.reading}</p>
          </div>
          <div className="bg-green-50 rounded-lg shadow p-4">
            <p className="text-sm text-green-600">Completed</p>
            <p className="text-2xl font-bold text-green-900">{stats.completed}</p>
          </div>
          <div className="bg-yellow-50 rounded-lg shadow p-4">
            <p className="text-sm text-yellow-600">Wishlist</p>
            <p className="text-2xl font-bold text-yellow-900">{stats.wishlist}</p>
          </div>
        </div>

        {/* Filter */}
        <div className="mb-6">
          <label className="text-sm font-medium text-gray-700 mr-3">Filter:</label>
          <div className="inline-flex gap-2">
            <button
              onClick={() => setFilter(null)}
              className={`px-4 py-2 text-sm rounded-md transition ${
                filter === null
                  ? 'bg-indigo-600 text-white'
                  : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
              }`}
            >
              All
            </button>
            <button
              onClick={() => setFilter('reading')}
              className={`px-4 py-2 text-sm rounded-md transition ${
                filter === 'reading'
                  ? 'bg-indigo-600 text-white'
                  : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
              }`}
            >
              Reading
            </button>
            <button
              onClick={() => setFilter('completed')}
              className={`px-4 py-2 text-sm rounded-md transition ${
                filter === 'completed'
                  ? 'bg-indigo-600 text-white'
                  : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
              }`}
            >
              Completed
            </button>
            <button
              onClick={() => setFilter('wishlist')}
              className={`px-4 py-2 text-sm rounded-md transition ${
                filter === 'wishlist'
                  ? 'bg-indigo-600 text-white'
                  : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
              }`}
            >
              Wishlist
            </button>
          </div>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-6">
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Add Book Form */}
          <div className="lg:col-span-1">
            <BookForm onBookAdded={handleBookAdded} />
          </div>

          {/* Book List */}
          <div className="lg:col-span-2">
            {loading ? (
              <div className="bg-white rounded-lg shadow p-8 text-center">
                <p className="text-gray-500">Loading books...</p>
              </div>
            ) : (
              <BookList
                books={books}
                onBookDeleted={handleBookDeleted}
                onBookUpdated={handleBookUpdated}
              />
            )}
          </div>
        </div>
      </main>
    </div>
  )
}