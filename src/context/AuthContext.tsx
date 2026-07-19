import { createContext, useState, useEffect, ReactNode, useContext } from "react"

type User = { id: string; email: string } | null

type AuthContextType = {
  user: User
  token: string | null
  isLoading: boolean
  login: (email: string, password: string) => Promise<void>
  register: (email: string, password: string) => Promise<void>
  logout: () => void
}

export const AuthContext = createContext<AuthContextType>({
  user: null,
  token: null,
  isLoading: true,
  login: async () => {},
  register: async () => {},
  logout: () => {},
})

export const useAuth = () => useContext(AuthContext)

const API_BASE = import.meta.env.VITE_API_URL || ""

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User>(null)
  const [token, setToken] = useState<string | null>(() => localStorage.getItem("auth_token"))
  const [isLoading, setIsLoading] = useState(true)

  // On mount, try to restore session from stored token
  useEffect(() => {
    const stored = localStorage.getItem("auth_token")
    if (stored) {
      fetch(`${API_BASE}/api/auth/me`, {
        headers: { Authorization: `Bearer ${stored}` },
      })
        .then((r) => (r.ok ? r.json() : Promise.reject()))
        .then((data) => {
          setUser(data.user)
          setToken(stored)
        })
        .catch(() => {
          localStorage.removeItem("auth_token")
          setToken(null)
        })
        .finally(() => setIsLoading(false))
    } else {
      setIsLoading(false)
    }
  }, [])

  const login = async (email: string, password: string) => {
    const resp = await fetch(`${API_BASE}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    })
    if (!resp.ok) {
      const err = await resp.json().catch(() => ({ error: "Login failed" }))
      throw new Error(err.error || "Login failed")
    }
    const data = await resp.json()
    localStorage.setItem("auth_token", data.token)
    setToken(data.token)
    setUser(data.user)
  }

  const register = async (email: string, password: string) => {
    const resp = await fetch(`${API_BASE}/api/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    })
    if (!resp.ok) {
      const err = await resp.json().catch(() => ({ error: "Registration failed" }))
      throw new Error(err.error || "Registration failed")
    }
    const data = await resp.json()
    localStorage.setItem("auth_token", data.token)
    setToken(data.token)
    setUser(data.user)
  }

  const logout = () => {
    localStorage.removeItem("auth_token")
    setUser(null)
    setToken(null)
  }

  return (
    <AuthContext.Provider value={{ user, token, isLoading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  )
}
