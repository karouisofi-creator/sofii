import { createContext, useContext, useState, useEffect } from 'react'

const AuthContext = createContext(null)

const ROLES = {
  USER: 'user',
  ADMIN: 'admin'
}

const API_BASE = '/api'

function getStoredUser() {
  try {
    const raw = localStorage.getItem('dataflow_user')
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

async function apiFetch(url, options = {}) {
  const token = localStorage.getItem('dataflow_token')
  const headers = {
    'Content-Type': 'application/json',
    ...(token && { Authorization: `Bearer ${token}` }),
    ...options.headers,
  }
  const res = await fetch(`${API_BASE}${url}`, { ...options, headers })
  if (res.status === 401) {
    localStorage.removeItem('dataflow_token')
    localStorage.removeItem('dataflow_user')
    throw new Error('Session expirée')
  }
  return res
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => getStoredUser())
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    const token = localStorage.getItem('dataflow_token')
    if (!token) {
      setLoading(false)
      return
    }

    const cachedUser = getStoredUser()
    if (cachedUser) {
      setUser(cachedUser)
      setLoading(false)
    } else {
      setLoading(true)
    }

    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 4000)

    apiFetch('/auth/me', { signal: controller.signal })
      .then((res) => res.json())
      .then((data) => {
        setUser(data)
        localStorage.setItem('dataflow_user', JSON.stringify(data))
      })
      .catch(() => {
        if (!cachedUser) {
          localStorage.removeItem('dataflow_token')
          localStorage.removeItem('dataflow_user')
          setUser(null)
        }
      })
      .finally(() => {
        clearTimeout(timeoutId)
        setLoading(false)
      })

    return () => {
      clearTimeout(timeoutId)
      controller.abort()
    }
  }, [])

  const login = async (email, password) => {
    const res = await apiFetch('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    })

    if (!res.ok) {
      const data = await res.json().catch(() => ({}))
      throw new Error(data.error || 'Erreur de connexion')
    }

    const { token, user: userData } = await res.json()
    localStorage.setItem('dataflow_token', token)
    localStorage.setItem('dataflow_user', JSON.stringify(userData))
    setUser(userData)
    return userData
  }

  const logout = () => {
    setUser(null)
    localStorage.removeItem('dataflow_token')
    localStorage.removeItem('dataflow_user')
  }

  const updateUser = (userData) => {
    setUser(userData)
    if (userData) localStorage.setItem('dataflow_user', JSON.stringify(userData))
  }

  const isAdmin = () => user?.role === ROLES.ADMIN

  const value = {
    user,
    loading,
    login,
    logout,
    updateUser,
    isAdmin,
    isAuthenticated: !!user,
    ROLES,
    apiFetch,
  }
  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider')
  }
  return context
}
