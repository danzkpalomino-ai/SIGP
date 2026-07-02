export const formatCurrency = (value) => {
  return 'S/ ' + Number(value || 0).toFixed(2)
}

export const formatDate = (date) => {
  if (!date) return '—'
  return new Date(date).toLocaleDateString('es-PE')
}

export const formatTime = (date) => {
  if (!date) return '—'
  return new Date(date).toLocaleTimeString('es-PE')
}

export const formatDateTime = (date) => {
  if (!date) return '—'
  return new Date(date).toLocaleString('es-PE')
}

export const timeAgo = (date) => {
  if (!date) return 'Sin actividad'
  const diff = Date.now() - new Date(date).getTime()
  const h = Math.floor(diff / 3600000)
  if (h < 1) return 'Minutos'
  if (h < 24) return `${h}h`
  const d = Math.floor(h / 24)
  return d < 30 ? `${d}d` : `${Math.floor(d / 30)}m`
}
