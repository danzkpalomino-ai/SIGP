import { useState, useEffect, useRef } from 'react'
import { Search, Plus, Edit2, Trash2, Package, Save, X, Phone, Mail, Clock, TrendingUp, BarChart3, User, AlertCircle, Barcode, FileText, Image } from 'lucide-react'
import { productsApi, salesApi, contactsApi } from '../../services/api'
import BarcodeLabel from '../../components/BarcodeLabel'
import CodigoAltaModal from '../../components/CodigoAltaModal'

export default function ProductsDashboard({ company }) {
  const [products, setProducts] = useState(() => {
    try { const c = sessionStorage.getItem('pd_products'); return c ? JSON.parse(c) : [] } catch { return [] }
  })
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [selectedProduct, setSelectedProduct] = useState(null)
  const [modulos, setModulos] = useState(() => {
    try { const c = sessionStorage.getItem('pd_modulos'); return c ? JSON.parse(c) : [] } catch { return [] }
  })
  const [moduloFilter, setModuloFilter] = useState('')
  const [clients, setClients] = useState(() => {
    try { const c = sessionStorage.getItem('pd_clients'); return c ? JSON.parse(c) : [] } catch { return [] }
  })
  const [todaySales, setTodaySales] = useState(() => {
    try { const c = sessionStorage.getItem('pd_sales'); return c ? JSON.parse(c) : { sales: [], total: 0, count: 0 } } catch { return { sales: [], total: 0, count: 0 } }
  })
  const [form, setForm] = useState({ descripcion: '', precio_unitario: '', categoria: '', marca: '', stock_actual: '', imagen: '' })
  const [error, setError] = useState('')
  const [showCodigoAlta, setShowCodigoAlta] = useState(false)
  const [showDrawer, setShowDrawer] = useState(false)
  const fileInputRef = useRef(null)

  useEffect(() => { loadProducts(); loadModulos(); loadClients(); loadTodaySales() }, [])

  useEffect(() => { if (products.length) sessionStorage.setItem('pd_products', JSON.stringify(products)) }, [products])
  useEffect(() => { if (modulos.length) sessionStorage.setItem('pd_modulos', JSON.stringify(modulos)) }, [modulos])
  useEffect(() => { if (clients.length) sessionStorage.setItem('pd_clients', JSON.stringify(clients)) }, [clients])
  useEffect(() => { sessionStorage.setItem('pd_sales', JSON.stringify(todaySales)) }, [todaySales])

  const loadProducts = async () => {
    setLoading(true)
    try {
      const res = await productsApi.getAll({ activo: 'true' })
      if (res.data?.products) setProducts(res.data.products)
    } catch (err) { console.error('[PD] loadProducts:', err) } finally { setLoading(false) }
  }

  const loadModulos = async () => { try { const res = await productsApi.getModulos(); if (res.data?.modulos) setModulos(res.data.modulos) } catch (err) { console.error('[PD] loadModulos:', err) } }
  const loadClients = async () => { try { const res = await contactsApi.getAll({ type: 'CLIENTE' }); if (res.data?.contacts) setClients(res.data.contacts) } catch (err) { console.error('[PD] loadClients:', err) } }
  const loadTodaySales = async () => { try { const res = await salesApi.getToday(); if (res.data) setTodaySales(res.data) } catch (err) { console.error('[PD] loadTodaySales:', err) } }

  const filtered = products.filter(p => {
    const s = search.toLowerCase()
    const ms = !search || p.descripcion?.toLowerCase().includes(s) || p.codigo_pos?.toLowerCase().includes(s) || p.codigo_barra?.includes(s)
    const mm = !moduloFilter || p.modulo_pos === moduloFilter
    return ms && mm
  })

  const handleSelect = (p) => {
    setSelectedProduct(p)
    setForm({
      descripcion: p.descripcion || '',
      precio_unitario: p.precio_unitario ?? '',
      categoria: p.categoria || '',
      marca: p.marca || '',
      stock_actual: p.stock_actual ?? '',
      imagen: p.imagen || ''
    })
    setError('')
    setShowDrawer(true)
  }

  const handleCreate = () => {
    setSelectedProduct({ _id: null })
    setForm({ descripcion: '', precio_unitario: '', categoria: '', marca: '', stock_actual: '', imagen: '' })
    setError('')
    setShowDrawer(true)
  }

  const handleCloseDrawer = () => { setShowDrawer(false); setTimeout(() => setSelectedProduct(null), 300) }

  const handleSave = async () => {
    if (!form.descripcion.trim()) { setError('Nombre requerido'); return }
    try {
      if (selectedProduct?._id) {
        await productsApi.update(selectedProduct._id, form)
      } else {
        await productsApi.create({ ...form, modulo_pos: moduloFilter || 'GENERAL' })
      }
      setSelectedProduct(null)
      setShowDrawer(false)
      loadProducts()
    } catch (err) { setError(err.response?.data?.message || err.message) }
  }

  const handleDelete = async (id) => {
    if (!confirm('Eliminar producto?')) return
    try {
      await productsApi.delete(id)
      if (selectedProduct?._id === id) { setSelectedProduct(null); setShowDrawer(false) }
      loadProducts()
    } catch {}
  }

  const handleImageUpload = (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (ev) => setForm({ ...form, imagen: ev.target?.result || '' })
    reader.readAsDataURL(file)
  }

  const timeAgo = (date) => {
    if (!date) return 'Sin actividad'
    const diff = Date.now() - new Date(date).getTime()
    const h = Math.floor(diff / 3600000)
    if (h < 1) return 'Minutos'; if (h < 24) return `${h}h`; const d = Math.floor(h / 24)
    return d < 30 ? `${d}d` : `${Math.floor(d / 30)}m`
  }

  const topProducts = [...products].sort((a, b) => (b.precio_unitario || 0) - (a.precio_unitario || 0)).slice(0, 5)
  const totalVentasMes = todaySales.total

  return (
    <div className="h-full flex flex-col" style={{ background: '#0A0A0B' }}>

      {/* ═══ HEADER ═══ */}
      <div className="glass px-6 pt-5 pb-3">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h1 className="text-lg font-black tracking-tight text-white">GESTION DE PRODUCTOS</h1>
            <p className="text-[11px] mt-0.5" style={{ color: '#8A8A8A' }}>{filtered.length} productos registrados</p>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => setShowCodigoAlta(true)} className="btn-relief-outline flex items-center gap-1.5 px-3 py-2 rounded-lg text-[11px] font-bold uppercase tracking-wider">
              <FileText size={13} /> Dar alta codigos
            </button>
            <button onClick={handleCreate} className="btn-relief-accent flex items-center gap-1.5 px-4 py-2 rounded-lg text-[11px] font-bold uppercase tracking-wider">
              <Plus size={14} /> Crear Nuevo
            </button>
          </div>
        </div>
        <div className="flex gap-3">
          <div className="relative flex-1 max-w-sm">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: '#5A5A5A' }} />
            <input className="glass-input w-full pl-9 pr-3 py-2 rounded-lg text-[13px] font-medium"
              placeholder="BUSCAR PRODUCTO POR NOMBRE O CODIGO..."
              value={search} onChange={e => setSearch(e.target.value.toUpperCase())} />
          </div>
          <select className="glass-select px-3 py-2 rounded-lg text-[11px] font-bold"
            value={moduloFilter} onChange={e => setModuloFilter(e.target.value)}>
            <option value="">TODOS</option>
            {modulos.map(m => <option key={m} value={m}>{m}</option>)}
          </select>
        </div>
      </div>

      {/* ═══ PRODUCT TABLE ═══ */}
      <div className="flex-1 overflow-auto px-6 py-4">
        {loading ? (
          <div className="space-y-2 mt-4">
            {[1,2,3,4,5].map(i => <div key={i} className="h-12 rounded-lg animate-pulse glass-card" />)}
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <Package size={44} className="mb-3" style={{ color: '#2A2A2E' }} />
            <p className="text-sm font-bold uppercase tracking-widest" style={{ color: '#5A5A5A' }}>No hay productos</p>
          </div>
        ) : (
          <table className="glass-table w-full">
            <thead>
              <tr>
                {['Imagen', 'Codigo', 'Nombre del Producto', 'Categoria', 'Precio Venta', 'Stock Actual', 'Acciones'].map(h => (
                  <th key={h} className="text-left text-[10px] font-bold uppercase tracking-wider px-3 py-3 sticky top-0" style={{ color: '#8A8A8A' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map(p => (
                <tr key={p._id} onClick={() => handleSelect(p)} className="cursor-pointer transition-all"
                  style={{ background: selectedProduct?._id === p._id ? 'rgba(245, 107, 19, 0.1)' : 'transparent' }}>
                  <td className="px-3 py-3" style={{ borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
                    {p.imagen ? (
                      <img src={p.imagen} alt="" className="w-9 h-9 rounded-lg object-cover" />
                    ) : (
                      <div className="glass w-9 h-9 rounded-lg flex items-center justify-center">
                        <Package size={16} style={{ color: '#5A5A5A' }} />
                      </div>
                    )}
                  </td>
                  <td className="px-3 py-3" style={{ borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
                    <p className="font-mono text-xs" style={{ color: '#F56B13' }}>{p.codigo_pos || '—'}</p>
                    {p.codigo_barra && <p className="font-mono text-[9px] mt-0.5" style={{ color: '#5A5A5A' }}>EAN: {p.codigo_barra}</p>}
                  </td>
                  <td className="px-3 py-3 text-sm font-bold" style={{ color: '#E0E0E0', borderBottom: '1px solid rgba(255,255,255,0.03)' }}>{p.descripcion}</td>
                  <td className="px-3 py-3 text-xs" style={{ color: '#5A5A5A', borderBottom: '1px solid rgba(255,255,255,0.03)' }}>{p.categoria || '—'}</td>
                  <td className="px-3 py-3 text-sm font-bold" style={{ color: '#F56B13', borderBottom: '1px solid rgba(255,255,255,0.03)' }}>S/ {Number(p.precio_unitario).toFixed(2)}</td>
                  <td className="px-3 py-3" style={{ borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
                    <span className={`font-bold text-sm ${p.stock_actual <= 0 ? 'text-[#EF4444]' : p.stock_actual <= 5 ? 'text-[#FBBF24]' : 'text-[#10B981]'}`}>{p.stock_actual ?? 0}</span>
                  </td>
                  <td className="px-3 py-3" style={{ borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
                    <div className="flex items-center gap-1" onClick={e => e.stopPropagation()}>
                      <button onClick={() => handleSelect(p)} className="p-1.5 rounded btn-relief" style={{ color: '#5A5A5A' }}>
                        <Edit2 size={13} />
                      </button>
                      <button onClick={() => handleDelete(p._id)} className="p-1.5 rounded btn-relief" style={{ color: '#5A5A5A' }}>
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* ═══ RECENT CLIENTS + REPORTS (bottom row) ═══ */}
      <div className="grid shrink-0" style={{ gridTemplateColumns: '1fr 280px', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
        <div className="glass overflow-hidden" style={{ borderRight: '1px solid rgba(255,255,255,0.06)' }}>
          <div className="px-6 py-3 border-b flex items-center justify-between glass-strong" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
            <h2 className="text-[11px] font-black uppercase tracking-wider text-white">CLIENTES RECIENTES</h2>
            <span className="text-[10px]" style={{ color: '#8A8A8A' }}>{clients.length} TOTAL</span>
          </div>
          <div className="overflow-x-auto">
            <table className="glass-table w-full">
              <thead>
                <tr>
                  {['Cliente', 'Contacto', 'RUC/DNI', 'Ultima Visita'].map(h => (
                    <th key={h} className="text-left text-[9px] font-bold uppercase tracking-wider px-3 py-2" style={{ color: '#5A5A5A' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {clients.length === 0 ? (
                  <tr><td colSpan={4} className="text-center py-6 text-[11px]" style={{ color: '#5A5A5A' }}>SIN CLIENTES REGISTRADOS</td></tr>
                ) : (
                  clients.slice(0, 4).map(c => (
                    <tr key={c._id}>
                      <td className="px-3 py-2.5 text-[12px] font-bold" style={{ color: '#E0E0E0', borderBottom: '1px solid rgba(255,255,255,0.03)' }}>{c.razon_social}</td>
                      <td className="px-3 py-2.5" style={{ borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
                        <div className="flex items-center gap-2 text-[10px]" style={{ color: '#5A5A5A' }}>
                          {c.telefono && <span className="flex items-center gap-1"><Phone size={9} />{c.telefono}</span>}
                          {c.email && <span className="flex items-center gap-1"><Mail size={9} />{c.email}</span>}
                        </div>
                      </td>
                      <td className="px-3 py-2.5 text-[10px]" style={{ color: '#5A5A5A', borderBottom: '1px solid rgba(255,255,255,0.03)' }}>{c.ruc_dni || '—'}</td>
                      <td className="px-3 py-2.5 text-[10px]" style={{ color: '#8A8A8A', borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
                        <span className="flex items-center gap-1"><Clock size={9} />{timeAgo(c.updatedAt || c.createdAt)}</span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="glass-strong overflow-hidden">
          <div className="px-4 py-3 border-b" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
            <div className="flex items-center justify-between mb-1">
              <h2 className="text-[11px] font-black uppercase tracking-wider text-white">RESUMEN DE REPORTES</h2>
              <TrendingUp size={14} style={{ color: '#F56B13' }} />
            </div>
            <div className="flex items-center justify-between">
              <span className="text-[9px] uppercase" style={{ color: '#5A5A5A' }}>VENTAS DEL DIA</span>
              <span className="text-sm font-black" style={{ color: '#F56B13' }}>S/ {totalVentasMes.toFixed(2)}</span>
            </div>
          </div>
          <div className="px-4 py-2 border-b" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
            <MiniChart sales={todaySales.sales} />
          </div>
          <div className="px-4 py-3 space-y-2.5">
            {topProducts.length === 0 ? (
              <p className="text-[10px] text-center py-2" style={{ color: '#5A5A5A' }}>SIN DATOS</p>
            ) : (
              topProducts.map((p, i) => (
                <div key={p._id} className="flex items-center gap-2.5 glass-card rounded-lg p-2">
                  <span className="text-[10px] font-black w-4 text-center" style={{ color: '#F56B13' }}>#{i+1}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-[11px] font-bold text-white truncate">{p.descripcion}</p>
                    <p className="text-[9px]" style={{ color: '#5A5A5A' }}>{p.categoria || '—'}</p>
                  </div>
                  <span className="text-[11px] font-black" style={{ color: '#F56B13' }}>S/ {Number(p.precio_unitario).toFixed(2)}</span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {showCodigoAlta && (
        <CodigoAltaModal products={products.filter(p => p.codigo_barra)} company={company} onClose={() => setShowCodigoAlta(false)} />
      )}

      {/* ═══ DRAWER OVERLAY (slides from right) ═══ */}
      {showDrawer && (
        <>
          <div className="fixed inset-0 bg-black/50 z-40 transition-opacity" onClick={handleCloseDrawer} />
          <div className="fixed top-0 right-0 h-full z-50 w-[420px] max-w-[90vw] shadow-2xl animate-slide-left overflow-y-auto"
            style={{ background: '#121214', borderLeft: '1px solid rgba(255,255,255,0.06)' }}>
            <div className="p-5">
              {/* Header */}
              <div className="flex items-center justify-between mb-5">
                <h2 className="text-xs font-black uppercase tracking-wider text-white">
                  {selectedProduct?._id ? 'DETALLE DE PRODUCTO' : 'NUEVO PRODUCTO'}
                </h2>
                <button onClick={handleCloseDrawer} className="p-1.5 rounded btn-relief">
                  <X size={15} style={{ color: '#5A5A5A' }} />
                </button>
              </div>

              {/* Error */}
              {error && (
                <div className="p-2.5 rounded-lg flex items-start gap-2 mb-4 text-xs" style={{ background: 'rgba(239,68,68,0.1)', color: '#EF4444' }}>
                  <AlertCircle size={13} className="mt-0.5 shrink-0" /><p>{error}</p>
                </div>
              )}

              {/* ── PRODUCT IMAGE ── */}
              <div className="mb-4">
                <label className="text-[9px] font-bold uppercase tracking-wider block mb-1.5" style={{ color: '#5A5A5A' }}>IMAGEN DEL PRODUCTO</label>
                {form.imagen ? (
                  <div className="relative w-full h-44 rounded-xl overflow-hidden">
                    <img src={form.imagen} alt="" className="w-full h-full object-cover" />
                    <button onClick={() => setForm({ ...form, imagen: '' })} className="absolute top-2 right-2 p-1 rounded-full bg-black/60">
                      <X size={12} className="text-white" />
                    </button>
                  </div>
                ) : (
                  <div className="w-full h-44 rounded-xl flex flex-col items-center justify-center glass-card cursor-pointer" onClick={() => fileInputRef.current?.click()} style={{ border: '1px dashed rgba(255,255,255,0.15)' }}>
                    <Image size={28} style={{ color: '#5A5A5A' }} />
                    <p className="text-[10px] mt-1.5 font-bold" style={{ color: '#5A5A5A' }}>SUBIR IMAGEN</p>
                    <p className="text-[9px] mt-0.5" style={{ color: '#3A3A3A' }}>PNG, JPG max 2MB</p>
                  </div>
                )}
                <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
              </div>

              {/* ── EAN-13 BARCODE ── */}
              {selectedProduct?.codigo_barra ? (
                <div className="mb-4 glass-card rounded-xl p-3">
                  <div className="flex items-center gap-1.5 mb-2">
                    <Barcode size={13} style={{ color: '#F56B13' }} />
                    <span className="text-[8px] font-bold uppercase tracking-wider" style={{ color: '#5A5A5A' }}>CODIGO DE BARRAS EAN-13</span>
                  </div>
                  <div className="flex justify-center">
                    <BarcodeLabel product={selectedProduct} size="large" companyId={company?._id} />
                  </div>
                </div>
              ) : !selectedProduct?._id ? (
                <div className="mb-4 glass-card rounded-xl p-4 flex flex-col items-center" style={{ border: '1px dashed rgba(255,255,255,0.1)' }}>
                  <div className="flex items-center gap-1.5 mb-2">
                    <Barcode size={13} style={{ color: '#5A5A5A' }} />
                    <span className="text-[8px] font-bold uppercase tracking-wider" style={{ color: '#5A5A5A' }}>CODIGO DE BARRAS EAN-13</span>
                  </div>
                  <p className="text-[10px] font-bold text-white">SE GENERARA AUTOMATICAMENTE</p>
                </div>
              ) : null}

              {/* ── FORM FIELDS ── */}
              <div className="space-y-3.5">
                <div className="space-y-1">
                  <label className="text-[9px] font-bold uppercase tracking-wider" style={{ color: '#5A5A5A' }}>NOMBRE</label>
                  <input className="glass-input w-full px-3 py-2 rounded-lg text-[13px]"
                    placeholder="NOMBRE DEL PRODUCTO"
                    value={form.descripcion} onChange={e => setForm({...form, descripcion: e.target.value.toUpperCase()})} />
                </div>

                <div className="flex gap-3">
                  <div className="flex-1 space-y-1">
                    <label className="text-[9px] font-bold uppercase tracking-wider" style={{ color: '#5A5A5A' }}>PRECIO</label>
                    <input className="glass-input w-full px-3 py-2 rounded-lg text-[13px]"
                      type="number" step="0.01" placeholder="0.00"
                      value={form.precio_unitario} onChange={e => setForm({...form, precio_unitario: e.target.value})} />
                  </div>
                  <div className="flex-1 space-y-1">
                    <label className="text-[9px] font-bold uppercase tracking-wider" style={{ color: '#5A5A5A' }}>STOCK</label>
                    <input className="glass-input w-full px-3 py-2 rounded-lg text-[13px]"
                      type="number" placeholder="0"
                      value={form.stock_actual} onChange={e => setForm({...form, stock_actual: e.target.value})} />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[9px] font-bold uppercase tracking-wider" style={{ color: '#5A5A5A' }}>CATEGORIA</label>
                  <input className="glass-input w-full px-3 py-2 rounded-lg text-[13px]"
                    placeholder="ESCRIBE O SELECCIONA CATEGORIA"
                    value={form.categoria} onChange={e => setForm({...form, categoria: e.target.value.toUpperCase()})}
                    list="categoria-list" />
                  <datalist id="categoria-list">
                    {[...new Set(products.map(p => p.categoria).filter(Boolean))].map(c => <option key={c} value={c} />)}
                  </datalist>
                </div>

                <div className="space-y-1">
                  <label className="text-[9px] font-bold uppercase tracking-wider" style={{ color: '#5A5A5A' }}>MARCA</label>
                  <input className="glass-input w-full px-3 py-2 rounded-lg text-[13px]"
                    placeholder="ESCRIBE O SELECCIONA MARCA"
                    value={form.marca} onChange={e => setForm({...form, marca: e.target.value.toUpperCase()})}
                    list="marca-list" />
                  <datalist id="marca-list">
                    {[...new Set(products.map(p => p.marca).filter(Boolean))].map(m => <option key={m} value={m} />)}
                  </datalist>
                </div>

                <div className="flex gap-2 pt-3">
                  <button onClick={() => { if (selectedProduct?._id) { if (confirm('Eliminar producto?')) { productsApi.delete(selectedProduct._id).then(() => { handleCloseDrawer(); loadProducts() }).catch(() => {}) } } }} className="btn-relief px-3 py-2.5 rounded-lg text-[10px] font-bold uppercase tracking-wider"
                    style={{ color: '#EF4444', border: '1px solid rgba(239,68,68,0.2)' }}>
                    <Trash2 size={12} />
                  </button>
                  <button onClick={handleSave} className="btn-relief-accent flex-1 py-2.5 rounded-lg text-[10px] font-bold uppercase tracking-wider flex items-center justify-center gap-1.5">
                    <Save size={13} /> {selectedProduct?._id ? 'GUARDAR CAMBIOS' : 'CREAR PRODUCTO'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  )
}

/* ─── Mini Chart (Canvas) ─── */
function MiniChart({ sales }) {
  const ref = useRef(null)

  useEffect(() => { if (sales?.length) draw() }, [sales])

  const draw = () => {
    const c = ref.current; if (!c) return
    const ctx = c.getContext('2d')
    const dpr = 2; const w = c.offsetWidth; const h = c.offsetHeight
    c.width = w * dpr; c.height = h * dpr; ctx.scale(dpr, dpr)
    ctx.clearRect(0, 0, w, h)

    const hourly = new Array(24).fill(0)
    sales.forEach(s => { const hr = new Date(s.createdAt || s.fecha_emision).getHours(); hourly[hr] += s.total || 0 })

    const start = 7, end = 21, max = Math.max(...hourly, 1)
    const pad = { t: 5, r: 5, b: 14, l: 28 }
    const cw = w - pad.l - pad.r, ch = h - pad.t - pad.b

    ctx.strokeStyle = 'rgba(42,42,46,0.6)'; ctx.lineWidth = 0.5
    for (let i = 0; i <= 2; i++) {
      const y = pad.t + (ch / 2) * i
      ctx.beginPath(); ctx.moveTo(pad.l, y); ctx.lineTo(w - pad.r, y); ctx.stroke()
      ctx.fillStyle = '#5A5A5A'; ctx.font = '7px Inter, sans-serif'; ctx.textAlign = 'right'
      ctx.fillText(`S/${Math.round(max * (1 - i/2))}`, pad.l - 3, y + 2)
    }

    ctx.beginPath(); ctx.moveTo(pad.l, pad.t + ch)
    for (let i = start; i <= end; i++) {
      const x = pad.l + ((i - start) / (end - start)) * cw
      const y = pad.t + ch - (hourly[i] / max) * ch
      ctx.lineTo(x, y)
    }
    ctx.lineTo(pad.l + cw, pad.t + ch); ctx.closePath()
    const g = ctx.createLinearGradient(0, pad.t, 0, pad.t + ch)
    g.addColorStop(0, 'rgba(245,107,19,0.25)'); g.addColorStop(1, 'rgba(245,107,19,0.01)')
    ctx.fillStyle = g; ctx.fill()

    ctx.beginPath(); ctx.strokeStyle = '#F56B13'; ctx.lineWidth = 1.5; ctx.lineJoin = 'round'
    for (let i = start; i <= end; i++) {
      const x = pad.l + ((i - start) / (end - start)) * cw
      const y = pad.t + ch - (hourly[i] / max) * ch
      i === start ? ctx.moveTo(x, y) : ctx.lineTo(x, y)
    }
    ctx.stroke()

    ctx.fillStyle = '#5A5A5A'; ctx.font = '7px Inter, sans-serif'; ctx.textAlign = 'center'
    for (let i = start; i <= end; i += 4) {
      const x = pad.l + ((i - start) / (end - start)) * cw
      ctx.fillText(`${i}:00`, x, h - 2)
    }
  }

  return <canvas ref={ref} className="w-full" style={{ height: '70px' }} />
}