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
  getByCode: (code) => api.get(`/products/code/${code}`),
  getModulos: () => api.get('/products/modulos')
}

export const salesApi = {
  create: (data) => api.post('/sales', data),
  getAll: (params) => api.get('/sales', { params }),
  getToday: () => api.get('/sales/today')
}

export const purchasesApi = {
  create: (data) => api.post('/purchases', data),
  getAll: (params) => api.get('/purchases', { params })
}

export const contactsApi = {
  getAll: (params) => api.get('/contacts', { params }),
  create: (data) => api.post('/contacts', data),
  getByDni: (dni) => api.get(`/contacts/dni/${dni}`)
}

export default api
