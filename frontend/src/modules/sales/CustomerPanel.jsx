import { useState } from 'react'
import { User } from 'lucide-react'
import { contactsApi } from '../../services/api'

export default function CustomerPanel({ clients, onSelect, clienteNombre, clienteDni, setClienteNombre, setClienteDni }) {
  const [suggestions, setSuggestions] = useState([])

  const handleSearch = (val) => {
    setClienteNombre(val.toUpperCase())
    if (val.length < 2) { setSuggestions([]); return }
    const matches = clients.filter(c => c.razon_social?.toLowerCase().includes(val.toLowerCase()) || c.ruc_dni?.includes(val))
    setSuggestions(matches.slice(0, 5))
  }

  const selectClient = (c) => {
    setClienteNombre(c.razon_social)
    setClienteDni(c.ruc_dni)
    setSuggestions([])
    onSelect?.(c)
  }

  const buscarPorDni = async (dni) => {
    if (dni.length < 8) return
    try {
      const res = await contactsApi.getByDni(dni)
      if (res.data) { setClienteNombre(res.data.razon_social); setClienteDni(res.data.ruc_dni) }
    } catch {}
  }

  return (
    <div className="p-4" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
      <div className="flex items-center gap-2 mb-3">
        <User size={14} style={{ color: '#F56B13' }} />
        <span className="text-[10px] font-bold uppercase tracking-wider text-white">DATOS DEL CLIENTE</span>
      </div>
      <div className="space-y-2">
        <div className="relative">
          <input className="glass-input w-full px-3 py-2 rounded-lg text-[13px]" placeholder="NOMBRE DEL CLIENTE"
            value={clienteNombre} onChange={e => handleSearch(e.target.value)} />
          {suggestions.length > 0 && (
            <div className="absolute top-full left-0 right-0 z-20 mt-1 glass-strong rounded-lg overflow-hidden animate-slide-up">
              {suggestions.map(c => (
                <button key={c._id} onClick={() => selectClient(c)}
                  className="w-full text-left px-3 py-2 text-[11px] text-white hover:bg-white/5 transition-colors border-b last:border-0"
                  style={{ borderColor: 'rgba(255,255,255,0.05)' }}>
                  <span className="font-bold">{c.razon_social}</span>
                  <span className="ml-2 text-[9px]" style={{ color: '#5A5A5A' }}>{c.ruc_dni}</span>
                </button>
              ))}
            </div>
          )}
        </div>
        <div className="flex gap-2">
          <input className="glass-input flex-1 px-3 py-2 rounded-lg text-[13px] font-mono" placeholder="DNI / RUC"
            value={clienteDni} onChange={e => { setClienteDni(e.target.value.toUpperCase()); if (e.target.value.length >= 8) buscarPorDni(e.target.value) }} maxLength={11} />
        </div>
      </div>
    </div>
  )
}
