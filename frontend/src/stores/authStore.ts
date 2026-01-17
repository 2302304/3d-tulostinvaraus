import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { queryClient } from '../main'

export type Role = 'STUDENT' | 'STAFF' | 'ADMIN'

export interface User {
  id: string
  email: string
  firstName: string
  lastName: string
  role: Role
}

interface AuthState {
  user: User | null
  accessToken: string | null
  refreshToken: string | null
  isAuthenticated: boolean
  login: (user: User, accessToken: string, refreshToken: string) => void
  logout: () => void
  updateToken: (accessToken: string) => void
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      accessToken: null,
      refreshToken: null,
      isAuthenticated: false,

      login: (user, accessToken, refreshToken) => {
        // Tyhjennä edellisen käyttäjän cache kirjautuessa
        queryClient.clear()
        set({
          user,
          accessToken,
          refreshToken,
          isAuthenticated: true,
        })
      },

      logout: () => {
        // Tyhjennä query cache kun käyttäjä kirjautuu ulos
        queryClient.clear()
        set({
          user: null,
          accessToken: null,
          refreshToken: null,
          isAuthenticated: false,
        })
      },

      updateToken: (accessToken) =>
        set({ accessToken }),
    }),
    {
      name: 'auth-storage',
    }
  )
)
