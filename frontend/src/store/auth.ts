import { create } from 'zustand'

interface User {
  id: string
  email: string
  full_name: string
  role: string
  agency_id: string
}

interface AuthState {
  user: User | null
  token: string | null
  isAuthenticated: boolean
  login: (token: string, user: User) => void
  logout: () => void
  setUser: (user: User) => void
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  token: localStorage.getItem('auth_token'),
  isAuthenticated: !!localStorage.getItem('auth_token'),
  login: (token: string, user: User) => {
    localStorage.setItem('auth_token', token)
    set({ token, user, isAuthenticated: true })
  },
  logout: () => {
    localStorage.removeItem('auth_token')
    set({ token: null, user: null, isAuthenticated: false })
  },
  setUser: (user: User) => set({ user }),
}))
