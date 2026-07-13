import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { MapPin, Plus, X, CheckCircle, AlertCircle } from 'lucide-react'
import { useAuthStore } from '../../app/store/authStore'
import { puntosVentaApi } from '../../services/api'

export default function PuntoVentaSelector() {
  const navigate = useNavigate()
  const { company, setPuntoVenta } = useAuthStore()
  const [puntos, setPuntos] = useState([])
  const [loading, setLoading] = useState(true)
  const [showCreate, setShowCreate] = useState(false)
  const [newNombre, setNewNombre] = useState('')
  const [creating, setCreating] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => { loadPuntos() }, [company])

  const loadPuntos = async () => {
    setLoading(true)
    try {
      const res = await puntosVentaApi.getAll()
      setPuntos(res.data || [])
    } catch (err) {
      const stored = sessionStorage.getItem('puntosVenta_' + company?._id)
      if (stored) try { setPuntos(JSON.parse(stored).map(n => ({ nombre: n }))) } catch {}
    } finally { setLoading(false) }
  }

  const handleSelect = (pv) => {
    setPuntoVenta(pv.nombre || pv, pv._id || null)
    navigate('/ventas')
  }

  const handleCreate = async () => {
    if (!newNombre.trim()) return
    setCreating(true)
    setError('')
    try {
      const res = await puntosVentaApi.create({ nombre: newNombre.trim() })
      setPuntos(prev => [...prev, res.data].sort((a,b) => a.nombre.localeCompare(b.nombre)))
      setShowCreate(false)
      setNewNombre('')
      handleSelect(res.data)
    } catch (err) {
      setError(err.response?.data?.message || err.message)
    } finally { setCreating(false) }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4" style={{ background: '#0A0A0B' }}>
      <div className="w-full max-w-sm">
        <div className="text-center mb-6">
          <div className="w-14 h-14 rounded-xl flex items-center justify-center mx-auto mb-3" style={{ background: 'linear-gradient(135deg, #F56B13, #C44D00)' }}>
            <MapPin size={24} className="text-white" />
          </div>
          <h1 className="text-base font-black text-white uppercase tracking-wider">Punto de Venta</h1>
          <p className="text-[10px] mt-1" style={{ color: '#5A5A5A' }}>{company?.name || 'Empresa'} &mdash; Selecciona tu punto</p>
        </div>

        {error && (
          <div className="p-2.5 rounded-lg flex items-center gap-2 mb-4 text-[10px]" style={{ background: 'rgba(239,68,68,0.1)', color: '#EF4444' }}>
            <AlertCircle size={12} /> {error}
          </div>
        )}

        {loading ? (
          <div className="space-y-2">
            {[1,2,3].map(i => <div key={i} className="h-12 rounded-lg animate-pulse" style={{ background: '#1A1A1D' }} />)}
          </div>
        ) : (
          <>
            <div className="space-y-1.5 mb-4">
              {puntos.map(p => (
                <button key={p._id || p.nombre} onClick={() => handleSelect(p)}
                  className="w-full p-3 rounded-lg text-left text-[12px] font-bold transition-all hover:border-[#F56B13] flex items-center gap-3"
                  style={{ background: '#121214', border: '1px solid #2A2A2E', color: '#E0E0E0' }}>
                  <MapPin size={14} style={{ color: '#F56B13' }} />
                  <span>{p.nombre}</span>
                  <CheckCircle size={14} className="ml-auto" style={{ color: '#3A3A3A' }} />
                </button>
              ))}
            </div>

            {showCreate ? (
              <div className="glass-card p-4 rounded-xl mb-4">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-[11px] font-black text-white uppercase tracking-wider">NUEVO PUNTO</h3>
                  <button onClick={() => setShowCreate(false)} className="btn-relief p-1 rounded-lg"><X size={13} style={{ color: '#5A5A5A' }} /></button>
                </div>
                <input className="w-full px-3 py-2 rounded-lg text-[13px] outline-none mb-3"
                  style={{ background: '#1A1A1D', border: '1px solid #2A2A2E', color: '#E0E0E0' }}
                  placeholder="NOMBRE DEL NUEVO PUNTO"
                  value={newNombre} onChange={e => setNewNombre(e.target.value.toUpperCase())}
                  onKeyDown={e => e.key === 'Enter' && handleCreate()} autoFocus />
                <button onClick={handleCreate} disabled={!newNombre.trim() || creating}
                  className="w-full py-2 rounded-lg text-[10px] font-bold uppercase tracking-wider text-white disabled:opacity-40 flex items-center justify-center gap-1.5"
                  style={{ background: 'linear-gradient(135deg, #F56B13, #C44D00)' }}>
                  <Plus size={13} /> {creating ? 'CREANDO...' : 'CREAR PUNTO'}
                </button>
              </div>
            ) : (
              <button onClick={() => setShowCreate(true)}
                className="w-full py-2.5 rounded-lg text-[10px] font-bold uppercase tracking-wider flex items-center justify-center gap-1.5 btn-relief-outline mb-4">
                <Plus size={13} /> NUEVO PUNTO DE VENTA
              </button>
            )}
          </>
        )}
      </div>
    </div>
  )
}
