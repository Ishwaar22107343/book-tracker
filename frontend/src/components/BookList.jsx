import { useState } from 'react'
import { api } from '../api/backendApi'

export default function BookList({ books, onBookDeleted, onBookUpdated }) {
  const [deletingId, setDeletingId] = useState(null)
  const [updatingId, setUpdatingId] = useState(null)
  const [loadingSummary, setLoadingSummary] = useState(null)
  const [summaries, setSummaries] = useState({})
  const [error, setError] = useState('')

  const handleDelete = async (bookId) => {
    if (!confirm('Are you sure you want to delete this book?')) return

    setError('')
    setDeletingId(bookId)

    try {
      await api.deleteBook(bookId)
      if (onBookDeleted) {
        onBookDeleted(bookId)
      }
    } catch (err) {
      setError(err.message || 'Failed to delete book')
    } finally {
      setDeletingId(null)
    }
  }

  const handleStatusChange = async (bookId, newStatus) => {
    setError('')
    setUpdatingId(bookId)

    try {
      const updatedBook = await api.updateBookStatus(bookId, newStatus)
      if (onBookUpdated) {
        onBookUpdated(updatedBook)
      }
    } catch (err) {
      setError(err.message || 'Failed to update book status')
    } finally {
      setUpdatingId(null)
    }
  }

  const handleGetSummary = async (bookId) => {
    setError('')
    setLoadingSummary(bookId)

    try {
      const summaryData = await api.getBookSummary(bookId)
      setSummaries(prev => ({
        ...prev,
        [bookId]: summaryData.summary
      }))
    } catch (err) {
      setError(err.message || 'Failed to generate summary')
    } finally {
      setLoadingSummary(null)
    }
  }

  const toggleSummary = (bookId) => {
    if (summaries[bookId]) {
      // Close summary
      setSummaries(prev => {
        const newSummaries = { ...prev }
        delete newSummaries[bookId]
        return newSummaries
      })
    } else {
      // Load summary
      handleGetSummary(bookId)
    }
  }

  if (books.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow p-8 text-center">
        <p className="text-gray-500">No books yet. Add your first book to get started!</p>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-lg shadow">
      <div className="px-6 py-4 border-b border-gray-200">
        <h2 className="text-xl font-semibold text-gray-900">Your Books ({books.length})</h2>
      </div>

      {error && (
        <div className="mx-6 mt-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      )}

      <ul className="divide-y divide-gray-200">
        {books.map((book) => (
          <li key={book.id} className="px-6 py-4 hover:bg-gray-50 transition">
            <div className="flex items-start justify-between">
              <div className="flex-1 min-w-0">
                <h3 className="text-lg font-medium text-gray-900 truncate">{book.title}</h3>
                <p className="text-sm text-gray-600 mt-1">by {book.author}</p>
                <div className="mt-2 flex items-center gap-3">
                  <select
                    value={book.status}
                    onChange={(e) => handleStatusChange(book.id, e.target.value)}
                    disabled={updatingId === book.id}
                    className="text-xs px-2 py-1 border border-gray-300 rounded focus:ring-2 focus:ring-indigo-500 focus:border-transparent disabled:opacity-50"
                  >
                    <option value="reading">Reading</option>
                    <option value="completed">Completed</option>
                    <option value="wishlist">Wishlist</option>
                  </select>
                  <span className="text-xs text-gray-500">
                    {new Date(book.created_at).toLocaleDateString()}
                  </span>
                </div>

                {/* AI Summary Button */}
                <button
                  onClick={() => toggleSummary(book.id)}
                  disabled={loadingSummary === book.id}
                  className="mt-3 text-xs text-indigo-600 hover:text-indigo-800 font-medium disabled:opacity-50 flex items-center gap-1"
                >
                  {loadingSummary === book.id ? (
                    <>
                      <svg className="animate-spin h-3 w-3" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Generating...
                    </>
                  ) : summaries[book.id] ? (
                    <>✕ Hide Summary</>
                  ) : (
                    <>✨ Get AI Summary</>
                  )}
                </button>

                {/* Summary Display */}
                {summaries[book.id] && (
                  <div className="mt-3 p-4 bg-indigo-50 border border-indigo-200 rounded-lg">
                    <h4 className="text-sm font-semibold text-indigo-900 mb-2">AI Summary</h4>
                    <p className="text-sm text-gray-700 whitespace-pre-line leading-relaxed">
                      {summaries[book.id]}
                    </p>
                  </div>
                )}
              </div>

              <button
                onClick={() => handleDelete(book.id)}
                disabled={deletingId === book.id}
                className="ml-4 text-red-600 hover:text-red-800 text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed transition"
              >
                {deletingId === book.id ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </li>
        ))}
      </ul>
    </div>
  )
}