import { create } from 'zustand'

export const useUIStore = create((set) => ({
  sidebarCollapsed: false,
  activeModule: 'ventas',
  notifications: [],

  toggleSidebar: () => set(s => ({ sidebarCollapsed: !s.sidebarCollapsed })),

  setActiveModule: (module) => set({ activeModule: module }),

  addNotification: (n) => set(s => ({
    notifications: [...s.notifications, { id: Date.now(), ...n }]
  })),

  removeNotification: (id) => set(s => ({
    notifications: s.notifications.filter(n => n.id !== id)
  }))
}))
