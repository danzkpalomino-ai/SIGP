import { create } from 'zustand'

export const useAuthStore = create((set) => ({
  user: null,
  token: null,
  company: null,
  puntoVenta: null,
  companies: [],
  isAuthenticated: false,

  login: (user, token, companies) => {
    sessionStorage.setItem('token', token)
    sessionStorage.setItem('user', JSON.stringify(user))
    set({ user, token, companies: companies || [], isAuthenticated: true })
  },

  setCompany: (company) => {
    sessionStorage.setItem('company', JSON.stringify(company))
    set({ company })
  },

  setPuntoVenta: (pv) => {
    sessionStorage.setItem('puntoVenta', pv)
    set({ puntoVenta: pv })
  },

  logout: () => {
    sessionStorage.clear()
    set({ user: null, token: null, company: null, puntoVenta: null, companies: [], isAuthenticated: false })
  },

  hydrate: () => {
    try {
      const token = sessionStorage.getItem('token')
      const user = JSON.parse(sessionStorage.getItem('user') || 'null')
      const company = JSON.parse(sessionStorage.getItem('company') || 'null')
      const puntoVenta = sessionStorage.getItem('puntoVenta')
      if (token && user) set({ user, token, company, puntoVenta, isAuthenticated: true })
    } catch {}
  }
}))
