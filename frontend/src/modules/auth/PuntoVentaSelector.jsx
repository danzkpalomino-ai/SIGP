import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { MapPin } from 'lucide-react'
import { useAuthStore } from '../../app/store/authStore'

export default function PuntoVentaSelector() {
  const navigate = useNavigate()
  const { company, setPuntoVenta } = useAuthStore()
  const [pv, setPv] = useState('')
  const [existingPuntos, setExistingPuntos] = useState([])
  const [showInput, setShowInput] = useState(true)

  useEffect(() => {
    const stored = sessionStorage.getItem('puntosVenta_' + company?._id)
    if (stored) try { setExistingPuntos(JSON.parse(stored)) } catch {}
  }, [company])

  const handleSubmit = (val) => {
    const v = val.trim().toUpperCase()
    if (!v) return
    const list = existingPuntos.includes(v) ? existingPuntos : [...existingPuntos, v]
    sessionStorage.setItem('puntosVenta_' + company?._id, JSON.stringify(list))
    setPuntoVenta(v)
    navigate('/ventas')
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

        {!showInput && false ? null : (
          <div>
            <div className="space-y-1.5 mb-4">
              <label className="text-[10px] font-bold uppercase tracking-wider" style={{ color: '#8A8A8A' }}>NOMBRE DEL PUNTO</label>
              <input className="w-full px-3 py-2.5 rounded-lg text-[13px] outline-none transition-all"
                style={{ background: '#1A1A1D', border: '1px solid #2A2A2E', color: '#E0E0E0' }}
                placeholder="Ej: CAJA PRINCIPAL, CAJA 2, BARRA..."
                value={pv} onChange={e => setPv(e.target.value.toUpperCase())}
                onKeyDown={e => e.key === 'Enter' && handleSubmit(pv)} autoFocus />
            </div>
            {existingPuntos.length > 0 && (
              <div className="mb-4">
                <p className="text-[9px] font-bold uppercase tracking-wider mb-2" style={{ color: '#5A5A5A' }}>PUNTOS ANTERIORES</p>
                <div className="space-y-1">
                  {existingPuntos.map(ep => (
                    <button key={ep} onClick={() => handleSubmit(ep)}
                      className="w-full p-2.5 rounded-lg text-left text-[12px] font-bold transition-all hover:border-[#F56B13]"
                      style={{ background: '#121214', border: '1px solid #2A2A2E', color: '#E0E0E0' }}>
                      <MapPin size={13} className="inline mr-2" style={{ color: '#F56B13' }} />{ep}
                    </button>
                  ))}
                </div>
              </div>
            )}
            <button onClick={() => handleSubmit(pv)} disabled={!pv.trim()}
              className="w-full py-2.5 rounded-lg text-white text-[10px] font-bold uppercase tracking-wider disabled:opacity-40 transition-all"
              style={{ background: 'linear-gradient(135deg, #F56B13, #C44D00)' }}>
              {pv.trim() ? `USAR "${pv.trim().toUpperCase()}"` : 'INGRESA UN NOMBRE'}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
