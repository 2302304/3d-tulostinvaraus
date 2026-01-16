import axios from 'axios'
import { useAuthStore } from '../stores/authStore'

const api = axios.create({
  baseURL: '/api',
  headers: {
    'Content-Type': 'application/json',
  },
})

// Request interceptor - lisää token
api.interceptors.request.use(
  (config) => {
    const token = useAuthStore.getState().accessToken
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => Promise.reject(error)
)

// Response interceptor - käsittele virheet ja token refresh
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config

    // Jos 401 ja ei ole jo yritetty refreshata
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true

      const refreshToken = useAuthStore.getState().refreshToken

      if (refreshToken) {
        try {
          const response = await axios.post('/api/auth/refresh', { refreshToken })
          const { accessToken } = response.data.data

          useAuthStore.getState().updateToken(accessToken)
          originalRequest.headers.Authorization = `Bearer ${accessToken}`

          return api(originalRequest)
        } catch {
          // Refresh epäonnistui - kirjaudu ulos
          useAuthStore.getState().logout()
        }
      }
    }

    return Promise.reject(error)
  }
)

export default api

// Auth API
export const authApi = {
  login: (email: string, password: string) =>
    api.post('/auth/login', { email, password }),

  register: (data: { email: string; password: string; firstName: string; lastName: string }) =>
    api.post('/auth/register', data),

  refresh: (refreshToken: string) =>
    api.post('/auth/refresh', { refreshToken }),
}

// Printers API
export const printersApi = {
  getAll: () => api.get('/printers'),
  getById: (id: string) => api.get(`/printers/${id}`),
  getReservations: (id: string, startDate?: string, endDate?: string) =>
    api.get(`/printers/${id}/reservations`, { params: { startDate, endDate } }),
  create: (data: { name: string; description?: string; location?: string }) =>
    api.post('/printers', data),
  update: (id: string, data: { name?: string; description?: string; location?: string; status?: string }) =>
    api.patch(`/printers/${id}`, data),
  delete: (id: string) => api.delete(`/printers/${id}`),
}

// Reservations API
export const reservationsApi = {
  getAll: (params?: { printerId?: string; startDate?: string; endDate?: string; userId?: string; status?: string }) =>
    api.get('/reservations', { params }),
  getById: (id: string) => api.get(`/reservations/${id}`),
  create: (data: { printerId: string; startTime: string; endTime: string; description?: string }) =>
    api.post('/reservations', data),
  update: (id: string, data: { startTime?: string; endTime?: string; description?: string }) =>
    api.patch(`/reservations/${id}`, data),
  cancel: (id: string) => api.post(`/reservations/${id}/cancel`),
  delete: (id: string) => api.delete(`/reservations/${id}`),
}

// Users API
export const usersApi = {
  getAll: () => api.get('/users'),
  getMe: () => api.get('/users/me'),
  getMyReservations: () => api.get('/users/me/reservations'),
  updateRole: (id: string, role: string) =>
    api.patch(`/users/${id}/role`, { role }),
  setActive: (id: string, isActive: boolean) =>
    api.patch(`/users/${id}/active`, { isActive }),
}
