import { useState, useEffect, useMemo } from 'react'
import { ShoppingCart, Plus, Package, Store, Search, User, Clock, ArrowLeft, Trash2, X, Save, AlertCircle, DollarSign } from 'lucide-react'
import { purchasesApi, contactsApi, productsApi } from '../../services/api'
import { ErpPageHeader, ErpCard, ErpButton } from '../../components'

export default function PurchasesView({ company, user, onBack }) {
  const [purchases, setPurchases] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [providers, setProviders] = useState([])
  const [supplies, setSupplies] = useState([])
  const [tipoCompra, setTipoCompra] = useState('mercadera')
  const [form, setForm] = useState({
    proveedor_nombre: '',
    proveedor_ruc: '',
    items: []
  })
  const [currentItem, setCurrentItem] = useState({ descripcion: '', cantidad: 1, precio_unitario: '' })
  const [search, setSearch] = useState('')

  useEffect(() => {
    loadPurchases()
    loadProviders()
  }, [])

  const loadPurchases = async () => {
    setLoading(true)
    try {
      const res = await purchasesApi.getAll({ limit: 50 })
      setPurchases(res.data.purchases || [])
    } catch { } finally { setLoading(false) }
  }

  const loadProviders = async () => {
    try {
      const res = await contactsApi.getAll({ type: 'PROVEEDOR' })
      setProviders(res.data.contacts || [])
    } catch { }
  }

  const loadSupplies = async (modulo) => {
    try {
      const res = await productsApi.getAll({ modulo, activo: 'true' })
      setSupplies(res.data.products || [])
    } catch { }
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

  const handleSave = async () => {
    if (form.items.length === 0 || (!form.proveedor_nombre && !form.proveedor_ruc)) return
    try {
      await purchasesApi.create({
        ...form,
        tipo_compra: tipoCompra,
        total: totals.total
      })
      setForm({ proveedor_nombre: '', proveedor_ruc: '', items: [] })
      setShowForm(false)
      loadPurchases()
    } catch (err) {
      alert('Error: ' + (err.response?.data?.message || err.message))
    }
  }

  const filtered = purchases.filter(p =>
    !search || p.proveedor_nombre?.toLowerCase().includes(search.toLowerCase()) ||
    p.proveedor_ruc?.includes(search)
  )

  return (
    <div className="h-screen flex flex-col bg-[#f5efe6] overflow-hidden">
      {/* Header */}
      <header className="flex items-center justify-between px-6 py-3 bg-white border-b border-[#e8dfd2] shadow-sm">
        <div className="flex items-center gap-4">
          <button onClick={onBack} className="p-2 rounded-lg hover:bg-[#f0efec] transition-colors">
            <ArrowLeft size={20} className="text-[#1a1916]" />
          </button>
          <div className="w-10 h-10 rounded-xl bg-[#e8dfd2] flex items-center justify-center">
            <ShoppingCart size={20} className="text-[#1a1916]" />
          </div>
          <div>
            <p className="text-sm font-bold text-[#1a1916] uppercase tracking-wider">Compras Rápidas</p>
            <p className="text-[10px] text-[#6b6960]">Registro en vivo para cuadrar fin de mes</p>
          </div>
        </div>
        <ErpButton onClick={() => setShowForm(true)}>
          <Plus size={14} /> Nueva compra
        </ErpButton>
      </header>

      <div className="flex-1 overflow-auto p-6">
        {loading ? (
          <div className="space-y-3">{[1,2,3].map(i => <ErpCard key={i} className="h-16 animate-pulse bg-white/70" />)}</div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <ShoppingCart size={48} className="text-[#e8dfd2] mb-4" />
            <p className="text-sm font-bold text-[#9e9c94] uppercase tracking-widest">No hay compras registradas</p>
            <ErpButton onClick={() => setShowForm(true)} className="mt-4">
              <Plus size={14} /> Registrar primera compra
            </ErpButton>
          </div>
        ) : (
          <div className="space-y-3 max-w-3xl mx-auto">
            <div className="relative max-w-md mb-4">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#9e9c94]" />
              <input className="erp-input w-full pl-10" placeholder="Buscar por proveedor o RUC..." value={search} onChange={e => setSearch(e.target.value)} />
            </div>
            {filtered.map(p => (
              <ErpCard key={p._id} className="p-4 flex items-center justify-between hover:border-[#b8b6ae] transition-all">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center font-black">
                    {(p.proveedor_nombre || 'P')[0]}
                  </div>
                  <div>
                    <p className="text-sm font-bold text-[#1a1916]">{p.proveedor_nombre || 'Proveedor'}</p>
                    <p className="text-[10px] font-mono text-[#9e9c94]">{p.proveedor_ruc || '—'} · {p.fecha_emision}</p>
                    <p className="text-[10px] text-[#6b6960]">{p.items.length} ítem(s) · {p.tipo_compra}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-black text-amber-600">S/ {p.total.toFixed(2)}</p>
                  <span className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase ${p.estado === 'FACTURADO' ? 'bg-emerald-100 text-emerald-600' : 'bg-amber-100 text-amber-600'}`}>{p.estado}</span>
                </div>
              </ErpCard>
            ))}
          </div>
        )}
      </div>

      {/* Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50" onClick={() => setShowForm(false)}>
          <div className="bg-white rounded-2xl p-6 max-w-lg w-full mx-4 shadow-2xl max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-lg font-black text-[#1a1916]">Nueva compra rápida</h3>
                <p className="text-[11px] text-[#6b6960]">Registra la compra mientras hablas con el proveedor</p>
              </div>
              <button onClick={() => setShowForm(false)} className="p-2 rounded-lg hover:bg-[#f0efec]"><X size={18} /></button>
            </div>

            <div className="space-y-4">
              <div className="flex gap-2">
                <button onClick={() => setTipoCompra('mercadera')} className={`flex-1 py-2 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all ${tipoCompra === 'mercadera' ? 'bg-[#1a1916] text-white' : 'bg-[#f0efec] text-[#6b6960]'}`}>Mercadería</button>
                <button onClick={() => setTipoCompra('insumo')} className={`flex-1 py-2 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all ${tipoCompra === 'insumo' ? 'bg-[#1a1916] text-white' : 'bg-[#f0efec] text-[#6b6960]'}`}>Insumo</button>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[9px] font-bold uppercase text-[#9e9c94]">Proveedor</label>
                  <input className="erp-input w-full" placeholder="Nombre" value={form.proveedor_nombre} onChange={e => setForm({...form, proveedor_nombre: e.target.value})} />
                </div>
                <div className="space-y-1">
                  <label className="text-[9px] font-bold uppercase text-[#9e9c94]">RUC</label>
                  <input className="erp-input w-full font-mono" placeholder="20123456789" value={form.proveedor_ruc} onChange={e => setForm({...form, proveedor_ruc: e.target.value})} />
                </div>
              </div>

              <div className="border-t border-[#e8dfd2] pt-4">
                <p className="text-[10px] font-bold uppercase text-[#6b6960] mb-3">Items</p>
                <div className="flex gap-2 items-end mb-3">
                  <div className="flex-1">
                    <input className="erp-input w-full" placeholder="Producto / insumo" value={currentItem.descripcion} onChange={e => setCurrentItem({...currentItem, descripcion: e.target.value})} />
                  </div>
                  <div className="w-20">
                    <input className="erp-input w-full" type="number" min="1" placeholder="Cant" value={currentItem.cantidad} onChange={e => setCurrentItem({...currentItem, cantidad: e.target.value})} />
                  </div>
                  <div className="w-24">
                    <input className="erp-input w-full" type="number" min="0" step="0.01" placeholder="Precio" value={currentItem.precio_unitario} onChange={e => setCurrentItem({...currentItem, precio_unitario: e.target.value})} />
                  </div>
                  <ErpButton onClick={handleAddItem} className="h-[38px]"><Plus size={16} /></ErpButton>
                </div>

                {form.items.length === 0 ? (
                  <p className="text-[11px] text-[#9e9c94] text-center py-4">Agrega productos o insumos a la compra</p>
                ) : (
                  <div className="space-y-1">
                    {form.items.map((it, i) => (
                      <div key={i} className="flex items-center gap-2 py-2 px-3 bg-[#faf7f2] rounded-lg">
                        <span className="flex-1 text-xs font-bold uppercase">{it.descripcion}</span>
                        <span className="text-xs font-mono text-[#6b6960]">{it.cantidad} x S/ {it.precio_unitario.toFixed(2)}</span>
                        <span className="text-xs font-black text-amber-600 w-20 text-right">S/ {it.total_item.toFixed(2)}</span>
                        <button onClick={() => handleRemoveItem(i)} className="p-1 text-red-400 hover:text-red-600"><Trash2 size={14} /></button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="border-t border-[#e8dfd2] pt-4 flex items-center justify-between">
                <div>
                  <p className="text-[9px] text-[#6b6960] uppercase tracking-wider">Total estimado</p>
                  <p className="text-lg font-black text-[#1a1916]">S/ {totals.total.toFixed(2)}</p>
                </div>
                <ErpButton onClick={handleSave} disabled={form.items.length === 0} className="px-6 py-3 text-sm">
                  <Save size={16} /> Guardar compra
                </ErpButton>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
