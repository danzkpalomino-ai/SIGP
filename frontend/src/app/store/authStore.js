import { create } from 'zustand'

export const useAuthStore = create((set) => ({
  user: null,
  token: null,
  company: null,
  puntoVenta: null,
  puntoVentaId: null,
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

  setPuntoVenta: (pv, pvId) => {
    sessionStorage.setItem('puntoVenta', pv)
    if (pvId) sessionStorage.setItem('puntoVentaId', pvId)
    set({ puntoVenta: pv, puntoVentaId: pvId || null })
  },

  logout: () => {
    sessionStorage.clear()
    set({ user: null, token: null, company: null, puntoVenta: null, puntoVentaId: null, companies: [], isAuthenticated: false })
  },

  hydrate: () => {
    try {
      const token = sessionStorage.getItem('token')
      const user = JSON.parse(sessionStorage.getItem('user') || 'null')
      const company = JSON.parse(sessionStorage.getItem('company') || 'null')
      const puntoVenta = sessionStorage.getItem('puntoVenta')
      const puntoVentaId = sessionStorage.getItem('puntoVentaId')
      if (token && user) set({ user, token, company, puntoVenta, puntoVentaId, isAuthenticated: true })
    } catch {}
  }
}))
