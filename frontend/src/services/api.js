import axios from 'axios'

const API = 'http://localhost:3006/api'

const api = axios.create({ baseURL: API })

api.interceptors.request.use(config => {
  const token = sessionStorage.getItem('token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

export const productsApi = {
  getAll: (params) => api.get('/products', { params }),
  create: (data) => api.post('/products', data),
  update: (id, data) => api.put(`/products/${id}`, data),
  delete: (id) => api.delete(`/products/${id}`),
  getByCode: (code) => api.get(`/products/code/${code}`),
  getModulos: () => api.get('/products/modulos')
}

export const salesApi = {
  create: (data) => api.post('/sales', data),
  getAll: (params) => api.get('/sales', { params }),
  getToday: () => api.get('/sales/today'),
  getStats: (params) => api.get('/sales/stats', { params }),
  getSummary: () => api.get('/sales/summary'),
  getByProduct: (params) => api.get('/sales/by-product', { params }),
  getStatusBreakdown: (params) => api.get('/sales/status-breakdown', { params }),
  getHourly: (params) => api.get('/sales/hourly', { params }),
  update: (id, data) => api.put(`/sales/${id}`, data)
}

export const purchasesApi = {
  create: (data) => api.post('/purchases', data),
  getAll: (params) => api.get('/purchases', { params }),
  update: (id, data) => api.put(`/purchases/${id}`, data),
  delete: (id) => api.delete(`/purchases/${id}`)
}

export const companiesApi = {
  getAll: () => api.get('/companies'),
  create: (data) => api.post('/companies', data),
  update: (id, data) => api.put(`/companies/${id}`, data),
  delete: (id) => api.delete(`/companies/${id}`)
}

export const contactsApi = {
  getAll: (params) => api.get('/contacts', { params }),
  create: (data) => api.post('/contacts', data),
  update: (id, data) => api.put(`/contacts/${id}`, data),
  delete: (id) => api.delete(`/contacts/${id}`),
  getByDni: (dni) => api.get(`/contacts/dni/${dni}`)
}

export const cashRegisterApi = {
  openShift: (data) => api.post('/cash-register/shift/open', data),
  closeShift: (id, data) => api.post(`/cash-register/shift/${id}/close`, data),
  getCurrent: (params) => api.get('/cash-register/shift/current', { params }),
  addMovement: (id, data) => api.post(`/cash-register/shift/${id}/movement`, data),
  getHistory: (params) => api.get('/cash-register/shift/history', { params }),
  getSummary: (id) => api.get(`/cash-register/shift/${id}/summary`),
}

export const syncApi = {
  exportSales: (data) => api.post('/sync/sales/export', data),
  getPendingCount: () => api.get('/sync/sales/pending-count'),
  toggleAuto: (data) => api.post('/sync/sales/toggle-auto', data),
  getAutoStatus: () => api.get('/sync/sales/auto-status'),
  getImportPreview: (params) => api.get('/sync/import/preview', { params }),
  confirmImport: (data) => api.post('/sync/import/confirm', data),
  getImportContactsPreview: (params) => api.get('/sync/import/contacts-preview', { params }),
  confirmImportContacts: (data) => api.post('/sync/import/contacts-confirm', data),
}

export const reportsApi = {
  getDashboard: () => api.get('/reports/dashboard'),
  getHistory: (params) => api.get('/reports/history', { params }),
  getSummary: (params) => api.get('/reports/summary', { params }),
}

export const puntosVentaApi = {
  getAll: () => api.get('/companies/puntos-venta'),
  create: (data) => api.post('/companies/puntos-venta', data),
  delete: (id) => api.delete(`/companies/puntos-venta/${id}`),
}

export const quotationsApi = {
  create: (data) => api.post('/sales/quotations', data),
  getAll: (params) => api.get('/sales/quotations', { params }),
  convertToSale: (id, data) => api.put(`/sales/quotations/${id}/convert`, data)
}

export default api
