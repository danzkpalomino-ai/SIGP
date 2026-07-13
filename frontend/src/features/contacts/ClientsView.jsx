import { useState, useEffect } from 'react'
import { Search, Plus, Users, Phone, Mail, Edit2, Trash2, X, Save, AlertCircle, User, Download } from 'lucide-react'
import { contactsApi } from '../../services/api'
import ImportFromSICCEModal from '../../components/ImportFromSICCEModal'

export default function ClientsView() {
  const [clients, setClients] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [selected, setSelected] = useState(null)
  const [showImport, setShowImport] = useState(false)
  const [form, setForm] = useState({ razon_social: '', ruc_dni: '', telefono: '', email: '', direccion: '', type: 'CLIENTE' })
  const [error, setError] = useState('')

  useEffect(() => { loadClients() }, [])

  const loadClients = async () => {
    setLoading(true)
    try {
      const res = await contactsApi.getAll({ type: 'CLIENTE' })
      setClients(res.data.contacts || [])
    } catch {} finally { setLoading(false) }
  }

  const filtered = clients.filter(c =>
    !search || c.razon_social?.toLowerCase().includes(search.toLowerCase()) || c.ruc_dni?.includes(search)
  )

  const handleCreate = () => {
    setForm({ razon_social: '', ruc_dni: '', telefono: '', email: '', direccion: '', type: 'CLIENTE' })
    setSelected(null)
    setShowForm(true)
    setError('')
  }

  const handleEdit = (c) => {
    setForm({
      razon_social: c.razon_social || '',
      ruc_dni: c.ruc_dni || '',
      telefono: c.telefono || '',
      email: c.email || '',
      direccion: c.direccion || '',
      type: c.type || 'CLIENTE'
    })
    setSelected(c)
    setShowForm(true)
    setError('')
  }

  const handleSave = async () => {
    if (!form.razon_social.trim()) { setError('Nombre requerido'); return }
    try {
      if (selected) {
        await contactsApi.update(selected._id, form)
      } else {
        await contactsApi.create(form)
      }
      setShowForm(false)
      setSelected(null)
      loadClients()
    } catch (err) {
      setError(err.response?.data?.message || err.message)
    }
  }

  const handleDelete = async (id) => {
    if (!confirm('Eliminar cliente?')) return
    try {
      await contactsApi.delete(id)
      if (selected?._id === id) setSelected(null)
      loadClients()
    } catch {}
  }

  const timeAgo = (date) => {
    if (!date) return 'Sin actividad'
    const diff = Date.now() - new Date(date).getTime()
    const hours = Math.floor(diff / 3600000)
    if (hours < 1) return 'Hace minutos'
    if (hours < 24) return `Hace ${hours}h`
    const days = Math.floor(hours / 24)
    if (days < 30) return `Hace ${days}d`
    return `Hace ${Math.floor(days/30)}m`
  }

  return (
    <div className="flex-1 flex overflow-hidden">
      <div className="flex-1 flex flex-col overflow-hidden">
        <div className="glass px-6 py-4" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-lg font-black tracking-tight text-white">CLIENTES</h1>
              <p className="text-[11px] mt-0.5" style={{ color: '#8A8A8A' }}>{filtered.length} CLIENTES REGISTRADOS</p>
            </div>
            <div className="flex items-center gap-2">
              <button onClick={() => setShowImport(true)} className="btn-relief flex items-center gap-2 px-4 py-2 rounded-lg text-[11px] font-bold uppercase tracking-wider" style={{ color: '#F56B13' }}>
                <Download size={14} /> Importar SICCE
              </button>
              <button onClick={handleCreate} className="btn-relief-accent flex items-center gap-2 px-4 py-2 rounded-lg text-[11px] font-bold uppercase tracking-wider">
                <Plus size={14} /> Crear Nuevo
              </button>
            </div>
          </div>
          <div className="relative max-w-md">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: '#5A5A5A' }} />
            <input className="glass-input w-full pl-9 pr-3 py-2 rounded-lg text-[13px]" placeholder="BUSCAR POR NOMBRE O DNI..." value={search} onChange={e => setSearch(e.target.value.toUpperCase())} />
          </div>
        </div>

        <div className="flex-1 overflow-auto p-6" style={{ background: 'rgba(10,10,11,0.6)' }}>
          {loading ? (
            <div className="space-y-2">
              {[1,2,3,4,5].map(i => <div key={i} className="h-16 rounded-lg animate-pulse glass-card" />)}
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center">
              <Users size={48} style={{ color: '#2A2A2E' }} className="mb-4" />
              <p className="text-sm font-bold uppercase tracking-widest" style={{ color: '#5A5A5A' }}>NO HAY CLIENTES</p>
            </div>
          ) : (
            <div className="space-y-2">
              {filtered.map(c => (
                <div
                  key={c._id}
                  onClick={() => handleEdit(c)}
                  className={`glass-card flex items-center gap-4 p-4 rounded-xl cursor-pointer ${selected?._id === c._id ? 'border-[#F56B13]' : ''}`}
                  style={{ borderColor: selected?._id === c._id ? '#F56B13' : 'rgba(255,255,255,0.06)' }}
                >
                  <div className="w-10 h-10 rounded-full flex items-center justify-center text-xs font-black text-white" style={{ background: 'linear-gradient(135deg, #F56B13, #C44D00)' }}>
                    {(c.razon_social || 'C')[0].toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-white truncate">{c.razon_social}</p>
                    <div className="flex items-center gap-3 mt-1">
                      {c.ruc_dni && (
                        <span className="flex items-center gap-1 text-[10px]" style={{ color: '#5A5A5A' }}>
                          <User size={10} /> {c.ruc_dni}
                        </span>
                      )}
                      {c.telefono && (
                        <span className="flex items-center gap-1 text-[10px]" style={{ color: '#5A5A5A' }}>
                          <Phone size={10} /> {c.telefono}
                        </span>
                      )}
                      {c.email && (
                        <span className="flex items-center gap-1 text-[10px]" style={{ color: '#5A5A5A' }}>
                          <Mail size={10} /> {c.email}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-[10px]" style={{ color: '#5A5A5A' }}>{timeAgo(c.updatedAt || c.createdAt)}</p>
                    <div className="flex items-center gap-1 mt-1" onClick={e => e.stopPropagation()}>
                      <button onClick={() => handleEdit(c)} className="btn-relief p-1.5 rounded" style={{ color: '#5A5A5A' }}><Edit2 size={12} /></button>
                      <button onClick={() => handleDelete(c._id)} className="btn-relief p-1.5 rounded" style={{ color: '#5A5A5A' }}><Trash2 size={12} /></button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {showForm && (
        <div className="glass-strong w-80 overflow-y-auto" style={{ borderLeft: '1px solid rgba(255,255,255,0.06)' }}>
          <div className="p-5">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-sm font-black text-white uppercase tracking-wider">
                {selected ? 'DETALLE DE CLIENTE' : 'NUEVO CLIENTE'}
              </h2>
              <button onClick={() => { setShowForm(false); setSelected(null) }} className="btn-relief p-1.5 rounded-lg">
                <X size={16} style={{ color: '#5A5A5A' }} />
              </button>
            </div>

            <div className="w-full h-24 rounded-xl flex items-center justify-center mb-6 glass-card" style={{ border: '1px dashed rgba(255,255,255,0.1)' }}>
              <User size={32} style={{ color: '#2A2A2E' }} />
            </div>

            {error && (
              <div className="p-3 rounded-lg flex items-start gap-2 mb-4 text-xs" style={{ background: 'rgba(239,68,68,0.1)', color: '#EF4444' }}>
                <AlertCircle size={14} className="mt-0.5 shrink-0" />
                <p>{error}</p>
              </div>
            )}

            <div className="space-y-4">
              <div className="space-y-1">
                <label className="text-[9px] font-bold uppercase tracking-wider" style={{ color: '#5A5A5A' }}>NOMBRE / RAZON SOCIAL</label>
                <input className="glass-input w-full px-3 py-2 rounded-lg text-[13px]" value={form.razon_social} onChange={e => setForm({...form, razon_social: e.target.value.toUpperCase()})} placeholder="NOMBRE COMPLETO" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[9px] font-bold uppercase tracking-wider" style={{ color: '#5A5A5A' }}>DNI / RUC</label>
                  <input className="glass-input w-full px-3 py-2 rounded-lg text-[13px] font-mono" value={form.ruc_dni} onChange={e => setForm({...form, ruc_dni: e.target.value.toUpperCase()})} placeholder="00000000" maxLength={11} />
                </div>
                <div className="space-y-1">
                  <label className="text-[9px] font-bold uppercase tracking-wider" style={{ color: '#5A5A5A' }}>TELEFONO</label>
                  <input className="glass-input w-full px-3 py-2 rounded-lg text-[13px]" value={form.telefono} onChange={e => setForm({...form, telefono: e.target.value})} placeholder="999 999 999" />
                </div>
              </div>
              <div className="space-y-1">
                <label className="text-[9px] font-bold uppercase tracking-wider" style={{ color: '#5A5A5A' }}>EMAIL</label>
                <input className="glass-input w-full px-3 py-2 rounded-lg text-[13px]" type="email" value={form.email} onChange={e => setForm({...form, email: e.target.value})} placeholder="CORREO@EJEMPLO.COM" />
              </div>
              <div className="space-y-1">
                <label className="text-[9px] font-bold uppercase tracking-wider" style={{ color: '#5A5A5A' }}>DIRECCION</label>
                <input className="glass-input w-full px-3 py-2 rounded-lg text-[13px]" value={form.direccion} onChange={e => setForm({...form, direccion: e.target.value.toUpperCase()})} placeholder="AV. PRINCIPAL 123" />
              </div>
              <div className="flex gap-2 pt-2">
                <button onClick={handleSave} className="btn-relief-accent flex-1 py-2.5 rounded-lg text-[10px] font-bold uppercase tracking-wider flex items-center justify-center gap-2">
                  <Save size={14} /> {selected ? 'GUARDAR CAMBIOS' : 'CREAR CLIENTE'}
                </button>
                <button onClick={() => { setShowForm(false); setSelected(null) }} className="btn-relief-outline px-4 py-2.5 rounded-lg text-[10px] font-bold uppercase tracking-wider">
                  CANCELAR
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showImport && (
        <ImportFromSICCEModal onClose={() => { setShowImport(false); loadClients() }} initialTab="clientes" />
      )}
    </div>
  )
}
