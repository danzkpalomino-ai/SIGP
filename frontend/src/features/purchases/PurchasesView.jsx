import { useState, useEffect, useMemo } from 'react'
import { ShoppingCart, Plus, Search, Trash2, X, Save, Edit2 } from 'lucide-react'
import { purchasesApi } from '../../services/api'

export default function PurchasesView({ company, user, onBack }) {
  const [purchases, setPurchases] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [tipoCompra, setTipoCompra] = useState('mercadera')
  const [form, setForm] = useState({ proveedor_nombre: '', proveedor_ruc: '', items: [] })
  const [currentItem, setCurrentItem] = useState({ descripcion: '', cantidad: 1, precio_unitario: '' })
  const [search, setSearch] = useState('')

  useEffect(() => { loadPurchases() }, [])

  const loadPurchases = async () => {
    setLoading(true)
    try {
      const res = await purchasesApi.getAll({ limit: 50 })
      setPurchases(res.data.purchases || [])
    } catch {} finally { setLoading(false) }
  }

  const handleAddItem = () => {
    const cant = parseFloat(currentItem.cantidad) || 0
    const precio = parseFloat(currentItem.precio_unitario) || 0
    if (!currentItem.descripcion || cant <= 0 || precio <= 0) return
    setForm(prev => ({
      ...prev,
      items: [...prev.items, {
        descripcion: currentItem.descripcion.toUpperCase(),
        cantidad: cant,
        precio_unitario: precio,
        total_item: cant * precio
      }]
    }))
    setCurrentItem({ descripcion: '', cantidad: 1, precio_unitario: '' })
  }

  const handleRemoveItem = (index) => {
    setForm(prev => ({ ...prev, items: prev.items.filter((_, i) => i !== index) }))
  }

  const totals = useMemo(() => {
    const subtotal = form.items.reduce((acc, it) => acc + it.total_item, 0)
    const igv = subtotal * 0.18
    return { subtotal, igv, total: subtotal + igv }
  }, [form.items])

  const handleNewForm = () => {
    setEditingId(null)
    setForm({ proveedor_nombre: '', proveedor_ruc: '', items: [] })
    setCurrentItem({ descripcion: '', cantidad: 1, precio_unitario: '' })
    setTipoCompra('mercadera')
    setShowForm(true)
  }

  const handleEdit = (p, e) => {
    e.stopPropagation()
    setEditingId(p._id)
    setForm({ proveedor_nombre: p.proveedor_nombre || '', proveedor_ruc: p.proveedor_ruc || '', items: (p.items || []).map(it => ({ ...it })) })
    setTipoCompra(p.tipo_compra || 'mercadera')
    setCurrentItem({ descripcion: '', cantidad: 1, precio_unitario: '' })
    setShowForm(true)
  }

  const handleSave = async () => {
    if (form.items.length === 0 || (!form.proveedor_nombre && !form.proveedor_ruc)) return
    try {
      if (editingId) {
        await purchasesApi.update(editingId, { ...form, tipo_compra: tipoCompra, total: totals.total })
      } else {
        await purchasesApi.create({ ...form, tipo_compra: tipoCompra, total: totals.total })
      }
      setForm({ proveedor_nombre: '', proveedor_ruc: '', items: [] })
      setShowForm(false)
      setEditingId(null)
      loadPurchases()
    } catch (err) {
      alert('Error: ' + (err.response?.data?.message || err.message))
    }
  }

  const handleDelete = async (id, e) => {
    e.stopPropagation()
    if (!confirm('Eliminar esta compra?')) return
    try {
      await purchasesApi.delete(id)
      loadPurchases()
    } catch (err) {
      alert('Error al eliminar: ' + (err.response?.data?.message || err.message))
    }
  }

  const filtered = purchases.filter(p =>
    !search || p.proveedor_nombre?.toLowerCase().includes(search.toLowerCase()) || p.proveedor_ruc?.includes(search)
  )

  return (
    <div className="flex-1 flex flex-col overflow-hidden" style={{ background: 'rgba(10,10,11,0.6)' }}>
      <div className="glass flex items-center justify-between px-6 py-4" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
        <div>
          <h1 className="text-lg font-black tracking-tight text-white">COMPRAS</h1>
          <p className="text-[11px] mt-0.5" style={{ color: '#8A8A8A' }}>REGISTRO DE COMPRAS</p>
        </div>
        <button onClick={handleNewForm} className="btn-relief-accent flex items-center gap-2 px-4 py-2 rounded-lg text-[11px] font-bold uppercase tracking-wider">
          <Plus size={14} /> Nueva Compra
        </button>
      </div>

      <div className="flex-1 overflow-auto p-6">
        {loading ? (
          <div className="space-y-2">
            {[1,2,3].map(i => <div key={i} className="h-16 rounded-lg animate-pulse glass-card" />)}
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <ShoppingCart size={48} style={{ color: '#2A2A2E' }} className="mb-4" />
            <p className="text-sm font-bold uppercase tracking-widest" style={{ color: '#5A5A5A' }}>NO HAY COMPRAS REGISTRADAS</p>
            <button onClick={() => setShowForm(true)} className="btn-relief-accent mt-4 flex items-center gap-2 px-4 py-2 rounded-lg text-[11px] font-bold uppercase tracking-wider">
              <Plus size={14} /> REGISTRAR PRIMERA COMPRA
            </button>
          </div>
        ) : (
          <div className="space-y-2 max-w-3xl mx-auto">
            <div className="relative max-w-md mb-4">
              <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: '#5A5A5A' }} />
              <input className="glass-input w-full pl-9 pr-3 py-2 rounded-lg text-[13px]" placeholder="BUSCAR POR PROVEEDOR O RUC..." value={search} onChange={e => setSearch(e.target.value.toUpperCase())} />
            </div>
            {filtered.map(p => (
              <div key={p._id} className="glass-card p-4 flex items-center justify-between rounded-xl" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center font-black text-sm glass">
                    {(p.proveedor_nombre || 'P')[0].toUpperCase()}
                  </div>
                  <div>
                    <p className="text-sm font-bold text-white">{p.proveedor_nombre || 'PROVEEDOR'}</p>
                    <p className="text-[10px] font-mono" style={{ color: '#5A5A5A' }}>{p.proveedor_ruc || '—'} · {p.fecha_emision}</p>
                    <p className="text-[10px]" style={{ color: '#5A5A5A' }}>{p.items?.length || 0} ITEM(S) · {p.tipo_compra}</p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <p className="text-sm font-black" style={{ color: '#F56B13' }}>S/ {p.total.toFixed(2)}</p>
                    <span className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase ${p.estado === 'FACTURADO' ? 'text-[#10B981]' : 'text-[#FBBF24]'}`} style={{ background: p.estado === 'FACTURADO' ? 'rgba(16,185,129,0.1)' : 'rgba(251,191,36,0.1)' }}>
                      {p.estado}
                    </span>
                  </div>
                  <div className="flex items-center gap-1" onClick={e => e.stopPropagation()}>
                    <button onClick={(e) => handleEdit(p, e)} className="btn-relief p-1.5 rounded" style={{ color: '#5A5A5A' }}>
                      <Edit2 size={14} />
                    </button>
                    <button onClick={(e) => handleDelete(p._id, e)} className="btn-relief p-1.5 rounded" style={{ color: '#5A5A5A' }}>
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {showForm && (
        <div className="fixed inset-0 glass-modal-overlay flex items-center justify-center z-50" onClick={() => setShowForm(false)}>
          <div className="glass-modal rounded-2xl p-6 max-w-lg w-full mx-4 max-h-[90vh] overflow-y-auto animate-slide-up" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-lg font-black text-white">{editingId ? 'EDITAR COMPRA' : 'NUEVA COMPRA RAPIDA'}</h3>
                <p className="text-[11px]" style={{ color: '#5A5A5A' }}>{editingId ? 'ACTUALIZA LOS DATOS DE LA COMPRA' : 'REGISTRA LA COMPRA MIENTRAS HABLAS CON EL PROVEEDOR'}</p>
              </div>
              <button onClick={() => setShowForm(false)} className="btn-relief p-2 rounded-lg"><X size={18} style={{ color: '#5A5A5A' }} /></button>
            </div>

            <div className="space-y-4">
              <div className="flex gap-2">
                <button onClick={() => setTipoCompra('mercadera')} className={`flex-1 py-2 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all ${tipoCompra === 'mercadera' ? 'btn-relief-accent' : 'btn-relief'}`}>MERCADERIA</button>
                <button onClick={() => setTipoCompra('insumo')} className={`flex-1 py-2 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all ${tipoCompra === 'insumo' ? 'btn-relief-accent' : 'btn-relief'}`}>INSUMO</button>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[9px] font-bold uppercase" style={{ color: '#5A5A5A' }}>PROVEEDOR</label>
                  <input className="glass-input w-full px-3 py-2 rounded-lg text-[13px]" placeholder="NOMBRE" value={form.proveedor_nombre} onChange={e => setForm({...form, proveedor_nombre: e.target.value.toUpperCase()})} />
                </div>
                <div className="space-y-1">
                  <label className="text-[9px] font-bold uppercase" style={{ color: '#5A5A5A' }}>RUC</label>
                  <input className="glass-input w-full px-3 py-2 rounded-lg text-[13px] font-mono" placeholder="20123456789" value={form.proveedor_ruc} onChange={e => setForm({...form, proveedor_ruc: e.target.value.toUpperCase()})} />
                </div>
              </div>

              <div className="border-t pt-4" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
                <p className="text-[10px] font-bold uppercase mb-3" style={{ color: '#5A5A5A' }}>ITEMS</p>
                <div className="flex gap-2 items-end mb-3">
                  <div className="flex-1">
                    <input className="glass-input w-full px-3 py-2 rounded-lg text-[13px]" placeholder="PRODUCTO / INSUMO" value={currentItem.descripcion} onChange={e => setCurrentItem({...currentItem, descripcion: e.target.value.toUpperCase()})} />
                  </div>
                  <div className="w-20">
                    <input className="glass-input w-full px-3 py-2 rounded-lg text-[13px]" type="number" min="1" placeholder="CANT" value={currentItem.cantidad} onChange={e => setCurrentItem({...currentItem, cantidad: e.target.value})} />
                  </div>
                  <div className="w-24">
                    <input className="glass-input w-full px-3 py-2 rounded-lg text-[13px]" type="number" min="0" step="0.01" placeholder="PRECIO" value={currentItem.precio_unitario} onChange={e => setCurrentItem({...currentItem, precio_unitario: e.target.value})} />
                  </div>
                  <button onClick={handleAddItem} className="btn-relief-accent h-[38px] w-[38px] flex items-center justify-center rounded-lg"><Plus size={16} /></button>
                </div>

                {form.items.length > 0 && (
                  <div className="space-y-1">
                    {form.items.map((it, i) => (
                      <div key={i} className="flex items-center gap-2 py-2 px-3 rounded-lg glass-card">
                        <span className="flex-1 text-xs font-bold uppercase text-white">{it.descripcion}</span>
                        <span className="text-xs font-mono" style={{ color: '#5A5A5A' }}>{it.cantidad} X S/ {it.precio_unitario.toFixed(2)}</span>
                        <span className="text-xs font-black w-20 text-right" style={{ color: '#F56B13' }}>S/ {it.total_item.toFixed(2)}</span>
                        <button onClick={() => handleRemoveItem(i)} className="btn-relief p-1.5 rounded" style={{ color: '#EF4444' }}><Trash2 size={14} /></button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="border-t pt-4 flex items-center justify-between" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
                <div>
                  <p className="text-[9px] uppercase tracking-wider" style={{ color: '#5A5A5A' }}>TOTAL ESTIMADO</p>
                  <p className="text-lg font-black text-white">S/ {totals.total.toFixed(2)}</p>
                </div>
                <button onClick={handleSave} disabled={form.items.length === 0} className="btn-relief-accent px-6 py-3 rounded-lg text-[11px] font-bold uppercase tracking-wider flex items-center gap-2 disabled:opacity-50">
                  <Save size={16} /> {editingId ? 'ACTUALIZAR' : 'GUARDAR'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
