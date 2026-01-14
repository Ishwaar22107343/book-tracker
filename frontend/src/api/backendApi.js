import { getToken } from './supabaseClient'

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'

class ApiError extends Error {
  constructor(message, status) {
    super(message)
    this.status = status
    this.name = 'ApiError'
  }
}

async function fetchWithAuth(endpoint, options = {}) {
  const token = await getToken()
 
  if (!token) {
    throw new ApiError('Not authenticated', 401)
  }

  const headers = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`,
    ...options.headers,
  }

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers,
  })

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}))
    throw new ApiError(
      errorData.detail || `Request failed with status ${response.status}`,
      response.status
    )
  }

  return response.json()
}

export const api = {
  getBooks: async (statusFilter = null) => {
    const query = statusFilter ? `?status_filter=${statusFilter}` : ''
    return fetchWithAuth(`/books${query}`)
  },

  createBook: async (bookData) => {
    return fetchWithAuth('/books', {
      method: 'POST',
      body: JSON.stringify(bookData),
    })
  },

  deleteBook: async (bookId) => {
    return fetchWithAuth(`/books/${bookId}`, {
      method: 'DELETE',
    })
  },

  updateBookStatus: async (bookId, status) => {
    return fetchWithAuth(`/books/${bookId}`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    })
  },

  getBookSummary: async (bookId) => {
    return fetchWithAuth(`/books/${bookId}/summary`)
  },
}

export { ApiError }