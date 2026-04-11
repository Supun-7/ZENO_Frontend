import { create } from 'zustand'
import { api } from '../api'

const useAuth = create((set, get) => ({
  user:    null,
  profile: null,
  token:   localStorage.getItem('studyos_token') || null,
  loading: true,

  // Called on app startup - checks if token is still valid
  init: async () => {
    const token = localStorage.getItem('studyos_token')
    if (!token) {
      set({ loading: false })
      return
    }
    try {
      const data = await api.auth.me()
      set({ user: { id: data.userId, email: data.email }, profile: data.profile, loading: false })
    } catch {
      localStorage.removeItem('studyos_token')
      set({ token: null, loading: false })
    }
  },

  login: async (email, password) => {
    const data = await api.auth.login({ email, password })
    localStorage.setItem('studyos_token', data.token)
    set({ token: data.token, user: { id: data.userId, email: data.email }, profile: data.profile })
  },

  signup: async (email, password, profileData) => {
    const data = await api.auth.signup({ email, password, ...profileData })
    localStorage.setItem('studyos_token', data.token)
    set({ token: data.token, user: { id: data.userId, email: data.email } })
  },

  logout: () => {
    localStorage.removeItem('studyos_token')
    set({ user: null, profile: null, token: null })
  },

  updateProfile: async (updates) => {
    const data = await api.auth.updateProfile(updates)
    set({ profile: data })
  }
}))

export default useAuth
