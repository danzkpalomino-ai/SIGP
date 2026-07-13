import { useState, useEffect, useRef } from 'react'
import { CheckCircle, ShoppingCart, Trash2, X, Smartphone, MoreHorizontal, FileText, Printer, Receipt, ChevronRight } from 'lucide-react'
import { productsApi, salesApi, contactsApi, quotationsApi } from '../../services/api'
import { useAuthStore } from '../../app/store/authStore'
import TicketModal from '../../components/TicketModal'
import QuotationModal from '../../components/QuotationModal'

export default function SalesModule() {
  const { company, user, puntoVenta, companies, logout } = useAuthStore()

  const [products, setProducts] = useState([])
  const [modulos, setModulos] = useState([])
  const [moduloActivo, setModuloActivo] = useState(null)
  const [clients, setClients] = useState([])
  const [cart, setCart] = useState([])
  const [search, setSearch] = useState('')
  const [clienteNombre, setClienteNombre] = useState('')
  const [clienteDni, setClienteDni] = useState('')
  const [clienteSuggestions, setClienteSuggestions] = useState([])
  const [selectedProduct, setSelectedProduct] = useState(null)
  const [selectedQty, setSelectedQty] = useState(1)
  const [loading, setLoading] = useState(false)
  const [todaySales, setTodaySales] = useState({ sales: [], total: 0, count: 0 })
  const [showConfirm, setShowConfirm] = useState(false)
  const [showQuotationConfirm, setShowQuotationConfirm] = useState(false)
  const [lastQuotation, setLastQuotation] = useState(null)
  const [showQuotationTicket, setShowQuotationTicket] = useState(false)
  const [tipoDocumento, setTipoDocumento] = useState('03')
  const [successMsg, setSuccessMsg] = useState('')
  const [lastSale, setLastSale] = useState(null)
  const [showTicket, setShowTicket] = useState(false)
  const [searchTab, setSearchTab] = useState('codigo')
  const [descuento, setDescuento] = useState(0)
  const [selectedPayment, setSelectedPayment] = useState(null)
  const [showProductDetail, setShowProductDetail] = useState(false)
  const [showImagePreview, setShowImagePreview] = useState(false)
  const searchRef = useRef(null)
  const barcodeBuffer = useRef('')
  const barcodeTimer = useRef(null)

  useEffect(() => {
    loadClients(); loadModulos(); loadAllProducts(); loadTodaySales()
    searchRef.current?.focus()
  }, [])

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return
      if (e.key === 'Enter' && barcodeBuffer.current.length > 2) {
        const code = barcodeBuffer.current.trim(); barcodeBuffer.current = ''
        handleBarcodeScan(code); return
      }
      if (e.key.length === 1) {
        barcodeBuffer.current += e.key
        clearTimeout(barcodeTimer.current)
        barcodeTimer.current = setTimeout(() => { barcodeBuffer.current = '' }, 100)
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [products, cart])

  const loadClients = async () => { try { const res = await contactsApi.getAll({ type: 'CLIENTE', limit: 200 }); setClients(res.data.contacts || []) } catch {} }
  const loadModulos = async () => { try { const res = await productsApi.getModulos(); if (res.data?.modulos) setModulos(res.data.modulos) } catch {} }
  const loadAllProducts = async () => { try { setModuloActivo(null); setSelectedProduct(null); const res = await productsApi.getAll({ activo: 'true', limit: 200 }); if (res.data?.products) setProducts(res.data.products) } catch {} }
  const loadProducts = async (modulo) => { try { setModuloActivo(modulo); setSelectedProduct(null); const res = await productsApi.getAll({ modulo, activo: 'true', limit: 100 }); if (res.data?.products) setProducts(res.data.products) } catch {} }
  const loadTodaySales = async () => { try { const res = await salesApi.getToday(); if (res.data) setTodaySales(res.data) } catch {} }

  const handleBarcodeScan = async (code) => {
    try { const res = await productsApi.getByCode(code); if (res.data) { setSelectedProduct(res.data); setSelectedQty(1); addToCart(res.data) } } catch { setSearch(code) }
  }

  const handleSearchEnter = () => {
    if (!search.trim()) return
    const found = products.find(p => p.descripcion?.toLowerCase().includes(search.toLowerCase()) || p.codigo_pos?.toLowerCase() === search.toLowerCase() || p.codigo_barra === search)
    if (found) { setSelectedProduct(found); setSelectedQty(1); addToCart(found); setSearch('') }
  }

  const handleClientSearch = (val) => {
    setClienteNombre(val.toUpperCase())
    if (val.length < 2) { setClienteSuggestions([]); return }
    const matches = clients.filter(c => c.razon_social?.toLowerCase().includes(val.toLowerCase()) || c.ruc_dni?.includes(val))
    setClienteSuggestions(matches.slice(0, 5))
  }

  const selectClient = (c) => { setClienteNombre(c.razon_social); setClienteDni(c.ruc_dni); setClienteSuggestions([]) }

  const buscarClientePorDni = async (dni) => {
    if (dni.length < 8) return
    try { const res = await contactsApi.getByDni(dni); if (res.data) { setClienteNombre(res.data.razon_social); setClienteDni(res.data.ruc_dni) } } catch {}
  }

  const handleRegisterClient = async () => {
    if (!clienteNombre.trim() || !clienteDni.trim()) return
    try {
      const exists = clients.find(c => c.ruc_dni === clienteDni)
      if (exists) { alert('El cliente ya existe'); return }
      await contactsApi.create({ razon_social: clienteNombre.toUpperCase(), ruc_dni: clienteDni, type: 'CLIENTE' })
      alert('Cliente registrado exitosamente')
      loadClients()
    } catch (err) {
      alert('Error al registrar cliente: ' + (err.response?.data?.message || err.message))
    }
  }

  const addToCart = (product, qty = 1) => {
    setCart(prev => {
      const existing = prev.find(p => p._id === product._id)
      if (existing) return prev.map(p => p._id === product._id ? { ...p, cantidad: p.cantidad + qty, total_item: (p.cantidad + qty) * p.precio_unitario } : p)
      return [...prev, { _id: product._id, codigo_pos: product.codigo_pos, descripcion: product.descripcion, marca: product.marca, precio_unitario: product.precio_unitario, cantidad: qty, total_item: product.precio_unitario * qty, imagen: product.imagen }]
    })
  }

  const updateQty = (id, delta) => setCart(prev => prev.map(p => p._id === id ? { ...p, cantidad: Math.max(1, p.cantidad + delta), total_item: Math.max(1, p.cantidad + delta) * p.precio_unitario } : p).filter(p => p.cantidad > 0))
  const removeFromCart = (id) => setCart(prev => prev.filter(p => p._id !== id))
  const clearCart = () => { setCart([]); setSelectedProduct(null) }

  const subtotal = cart.reduce((acc, p) => acc + p.total_item, 0)
  const igv = subtotal * 0.18
  const totalCart = subtotal + igv - descuento

  const handleCheckout = async (tipo) => {
    if (cart.length === 0) return
    setTipoDocumento(tipo); setShowConfirm(true)
  }

  const handleConfirmSale = async () => {
    if (cart.length === 0) return
    setLoading(true)
    try {
      const items = cart.map(p => ({ producto_id: p._id, descripcion: p.descripcion, codigo_pos: p.codigo_pos, cantidad: p.cantidad, precio_unitario: p.precio_unitario, total_item: p.total_item }))
      const res = await salesApi.create({ items, tipo_documento: tipoDocumento, cliente_dni: clienteDni || undefined, cliente_nombre: clienteNombre || undefined, total: totalCart, descuento, serie: 'P001', punto_venta: puntoVenta, metodo_pago: selectedPayment || 'EFECTIVO' })
      setLastSale(res.data); setCart([]); setClienteDni(''); setClienteNombre(''); setSelectedProduct(null); setDescuento(0); setSelectedPayment(null)
      setSuccessMsg(`VENTA REGISTRADA - S/ ${totalCart.toFixed(2)}`)
      loadTodaySales()
      setTimeout(() => setSuccessMsg(''), 4000)
      setTimeout(() => setShowTicket(true), 500)
    } catch (err) { alert('Error: ' + (err.response?.data?.message || err.message)) }
    finally { setLoading(false); setShowConfirm(false) }
  }

  const handleCreateQuotation = async () => {
    if (cart.length === 0) return
    setLoading(true)
    try {
      const items = cart.map(p => ({ producto_id: p._id, descripcion: p.descripcion, codigo_pos: p.codigo_pos, cantidad: p.cantidad, precio_unitario: p.precio_unitario, total_item: p.total_item }))
      const res = await quotationsApi.create({ items, cliente_dni: clienteDni || undefined, cliente_nombre: clienteNombre || undefined, total: totalCart, punto_venta: puntoVenta })
      setLastQuotation(res.data)
      setSuccessMsg(`COTIZACION REGISTRADA - S/ ${totalCart.toFixed(2)}`)
      setTimeout(() => setSuccessMsg(''), 4000)
      setTimeout(() => setShowQuotationTicket(true), 500)
    } catch (err) { alert('Error: ' + (err.response?.data?.message || err.message)) }
    finally { setLoading(false); setShowQuotationConfirm(false) }
  }

  const filteredProducts = products.filter(p => !search || p.descripcion?.toLowerCase().includes(search.toLowerCase()) || p.codigo_pos?.toLowerCase().includes(search.toLowerCase()))
  const topProducts = [...products].sort((a, b) => (b.precio_unitario || 0) - (a.precio_unitario || 0)).slice(0, 8)

  return (
    <div className="h-full flex flex-col" style={{ background: '#0A0A0B' }}>
      {/* ═══ MAIN 2-COLUMN LAYOUT ═══ */}
      <div className="flex-1 flex overflow-hidden">

        {/* ═══ LEFT PANEL: AGREGAR PRODUCTO ═══ */}
        <div className="flex-1 flex flex-col overflow-hidden p-4" style={{ borderRight: '1px solid rgba(255,255,255,0.06)' }}>
          <h2 className="text-[13px] font-black uppercase tracking-widest mb-3" style={{ color: '#9E9E9E' }}>AGREGAR PRODUCTO</h2>

          {/* ─── Search Tabs ─── */}
          <div className="flex gap-1 mb-3 p-1 rounded-xl" style={{ background: 'rgba(26,26,29,0.5)' }}>
            {[
              { id: 'codigo', label: 'CODIGO / BARRAS' },
              { id: 'qr', label: 'ESCANEAR QR' },
              { id: 'manual', label: 'BUSQUEDA MANUAL' }
            ].map(tab => (
              <button key={tab.id} onClick={() => setSearchTab(tab.id)}
                className="flex-1 py-2.5 rounded-lg text-[13px] font-bold uppercase tracking-widest transition-all"
                style={{
                  background: searchTab === tab.id ? 'linear-gradient(135deg, #FF6B00, #F25C05)' : 'transparent',
                  color: searchTab === tab.id ? 'white' : '#9E9E9E'
                }}>{tab.label}</button>
            ))}
          </div>

          {/* ─── Search Input ─── */}
          <div className="relative mb-4">
            <div className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: '#FF6B00' }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 7V5a2 2 0 0 1 2-2h2M17 3h2a2 2 0 0 1 2 2v2M21 17v2a2 2 0 0 1-2 2h-2M7 21H5a2 2 0 0 1-2-2v-2"/><line x1="7" y1="12" x2="17" y2="12"/><line x1="7" y1="8" x2="17" y2="8"/><line x1="7" y1="16" x2="17" y2="16"/></svg>
            </div>
            <input ref={searchRef}
              className="w-full pl-11 pr-12 py-3 rounded-xl text-[13px] font-medium"
              style={{ background: 'rgba(26,26,29,0.6)', border: '1px solid rgba(255,107,0,0.3)', color: '#E0E0E0', outline: 'none' }}
              placeholder={
                searchTab === 'codigo' ? 'Escanea o ingresa el codigo del producto...' :
                searchTab === 'qr' ? 'Ingresa el codigo QR del producto...' :
                'Buscar producto por nombre, codigo o marca...'
              }
              value={search}
              onChange={e => setSearch(e.target.value.toUpperCase())}
              onKeyDown={e => { if (e.key === 'Enter') handleSearchEnter() }}
            />
            <button className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 rounded-lg" style={{ background: 'rgba(26,26,29,0.8)', border: '1px solid rgba(255,255,255,0.06)' }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#9E9E9E" strokeWidth="2"><rect x="2" y="4" width="20" height="16" rx="2"/><path d="M6 8h.01M10 8h.01M14 8h.01M18 8h.01M6 12h.01M10 12h.01M14 12h.01M18 12h.01M6 16h12"/></svg>
            </button>
          </div>

          {/* ─── Tab-specific hint ─── */}
          {searchTab === 'qr' && (
            <div className="mb-3 rounded-xl p-3 flex items-center gap-3" style={{ background: 'rgba(168,85,247,0.08)', border: '1px solid rgba(168,85,247,0.15)' }}>
              <Smartphone size={18} style={{ color: '#A855F7' }} />
              <div>
                <p className="text-[14px] font-bold text-white">Escanear codigo QR</p>
                <p className="text-[14px]" style={{ color: '#9E9E9E' }}>Usa la camara o ingresa el codigo manualmente</p>
              </div>
            </div>
          )}
          {searchTab === 'manual' && (
            <div className="mb-3 rounded-xl p-3 flex items-center gap-3" style={{ background: 'rgba(59,130,246,0.08)', border: '1px solid rgba(59,130,246,0.15)' }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#3B82F6" strokeWidth="2"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>
              <div>
                <p className="text-[14px] font-bold text-white">Busqueda manual</p>
                <p className="text-[14px]" style={{ color: '#9E9E9E' }}>Busca por nombre, codigo de producto o marca</p>
              </div>
            </div>
          )}

          {/* ─── Search Results Grid ─── */}
          {search && filteredProducts.length > 0 ? (
            <div className="grid grid-cols-2 gap-3 mb-4 animate-slide-up">
              {filteredProducts.map(product => (
                <button key={product._id}
                  onClick={() => { addToCart(product); setSearch('') }}
                  className="rounded-xl p-4 transition-all text-left active:scale-95 hover:border-[#FF6B00]"
                  style={{ background: 'rgba(26,26,29,0.6)', border: '1px solid rgba(255,255,255,0.06)' }}>
                  <div className="w-full h-28 rounded-xl flex items-center justify-center mb-3 overflow-hidden" style={{ background: 'rgba(10,10,11,0.8)' }}>
                    {product.imagen ? (
                      <img src={product.imagen} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <div className="text-center">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#2D2D34" strokeWidth="1.5" className="mx-auto mb-1"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><path d="m21 15-5-5L5 21"/></svg>
                        <p className="text-[14px]" style={{ color: '#2D2D34' }}>SIN IMAGEN</p>
                      </div>
                    )}
                  </div>
                  <p className="text-[14px] font-bold text-white line-clamp-2 leading-tight mb-1">{product.descripcion}</p>
                  <p className="text-[13px]" style={{ color: '#9E9E9E' }}>{product.marca || ''}</p>
                  <div className="flex items-center justify-between mt-2 pt-2" style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
                    <p className="text-sm font-black" style={{ color: '#FF6B00' }}>S/ {Number(product.precio_unitario).toFixed(2)}</p>
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: 'rgba(255,107,0,0.15)' }}>
                      <ShoppingCart size={14} style={{ color: '#FF6B00' }} />
                    </div>
                  </div>
                </button>
              ))}
            </div>
          ) : selectedProduct ? (
            <div className="rounded-2xl p-5 mb-4 animate-slide-up" style={{ background: 'rgba(26,26,29,0.6)', border: '1px solid rgba(255,255,255,0.06)' }}>
              <div className="flex gap-5">
                {/* Product Image */}
                <div onClick={() => { if (selectedProduct.imagen) setShowImagePreview(true) }} className="w-44 h-28 rounded-xl flex items-center justify-center shrink-0 overflow-hidden cursor-pointer" style={{ background: 'rgba(10,10,11,0.8)', border: '1px dashed rgba(255,255,255,0.08)' }}>
                  {selectedProduct.imagen ? (
                    <img src={selectedProduct.imagen} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <div className="text-center">
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#2D2D34" strokeWidth="1.5" className="mx-auto mb-1"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><path d="m21 15-5-5L5 21"/></svg>
                      <p className="text-[14px]" style={{ color: '#2D2D34' }}>SIN IMAGEN</p>
                    </div>
                  )}
                </div>

                {/* Product Info */}
                <div className="flex-1 min-w-0">
                  <p className="text-base font-black text-white mb-2">{selectedProduct.descripcion}</p>
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-3">
                      <span className="text-[14px]" style={{ color: '#9E9E9E' }}>Codigo:</span>
                      <span className="text-[13px] font-mono font-bold" style={{ color: '#FF6B00' }}>{selectedProduct.codigo_pos || '—'}</span>
                      <span className="text-[14px] font-bold px-2 py-0.5 rounded" style={{ background: 'rgba(16,185,129,0.15)', color: '#10B981' }}>Stock disponible</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-[14px]" style={{ color: '#9E9E9E' }}>Marca:</span>
                      <span className="text-[13px] font-bold text-white">{selectedProduct.marca || '—'}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-[14px]" style={{ color: '#9E9E9E' }}>Modelo:</span>
                      <span className="text-[13px] font-bold text-white">{selectedProduct.modelo || selectedProduct.descripcion?.substring(0, 20) || '—'}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-[14px]" style={{ color: '#9E9E9E' }}>Almacen:</span>
                      <span className="text-[13px] font-bold text-white">Principal</span>
                    </div>
                  </div>
                  <div className="mt-2">
                    <span className="text-[14px] font-black" style={{ color: '#FF6B00' }}>{selectedProduct.stock_actual ?? 0}</span>
                    <span className="text-[13px] ml-1" style={{ color: '#9E9E9E' }}>unidades</span>
                  </div>
                  <button onClick={() => setShowProductDetail(true)} className="text-[13px] font-bold mt-1 flex items-center gap-1 hover:underline" style={{ color: '#FF6B00' }}>
                    Ver mas detalles <ChevronRight size={10} />
                  </button>
                </div>
              </div>

              {/* Price + Qty + Add Button */}
              <div className="flex items-center gap-4 mt-4 pt-4" style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
                <div>
                  <p className="text-[14px] font-bold uppercase tracking-wider mb-0.5" style={{ color: '#9E9E9E' }}>PRECIO UNITARIO</p>
                  <p className="text-xl font-black" style={{ color: '#FF6B00' }}>S/ {Number(selectedProduct.precio_unitario).toFixed(2)}</p>
                </div>
                <div className="flex items-center gap-3">
                  <p className="text-[14px] font-bold uppercase tracking-wider" style={{ color: '#9E9E9E' }}>CANTIDAD</p>
                  <div className="flex items-center gap-1 rounded-xl overflow-hidden" style={{ border: '1px solid rgba(255,255,255,0.08)' }}>
                    <button onClick={() => setSelectedQty(q => Math.max(1, q - 1))}
                      className="w-9 h-9 flex items-center justify-center font-bold text-white transition-colors"
                      style={{ background: 'rgba(26,26,29,0.8)' }}>-</button>
                    <span className="w-10 text-center text-sm font-black text-white">{selectedQty}</span>
                    <button onClick={() => setSelectedQty(q => q + 1)}
                      className="w-9 h-9 flex items-center justify-center font-bold text-white transition-colors"
                      style={{ background: 'rgba(26,26,29,0.8)' }}>+</button>
                  </div>
                </div>
                <button onClick={() => { addToCart(selectedProduct, selectedQty); setSelectedQty(1) }}
                  className="flex-1 py-3.5 rounded-xl text-[14px] font-black uppercase tracking-widest flex items-center justify-center gap-2 text-white transition-all"
                  style={{ background: 'linear-gradient(135deg, #FF6B00, #F25C05)', boxShadow: '0 4px 20px rgba(255,107,0,0.3)' }}>
                  <ShoppingCart size={14} /> AGREGAR AL CARRITO
                </button>
              </div>
            </div>
          ) : (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center">
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#1A1A1E" strokeWidth="1.5" className="mx-auto mb-3"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>
                <p className="text-[14px] font-bold uppercase tracking-widest" style={{ color: '#2D2D34' }}>Busca o escanea un producto</p>
              </div>
            </div>
          )}

          {/* ─── PRODUCTOS RECIENTES / POPULARES ─── */}
          {!search && (
            <div className="mt-auto">
              <div className="flex items-center justify-between mb-2">
                <p className="text-[14px] font-black uppercase tracking-widest" style={{ color: '#9E9E9E' }}>PRODUCTOS RECIENTES / POPULARES</p>
                <button onClick={loadAllProducts} className="text-[13px] font-bold flex items-center gap-1" style={{ color: '#FF6B00' }}>
                  Ver todos <ChevronRight size={10} />
                </button>
              </div>
              <div className="flex gap-3 overflow-x-auto pb-2" style={{ scrollbarWidth: 'thin' }}>
                {topProducts.map(product => (
                  <button key={product._id}
                    onClick={() => { setSelectedProduct(product); setSelectedQty(1) }}
                    className="shrink-0 w-36 rounded-xl p-3 transition-all text-left active:scale-95"
                    style={{ background: 'rgba(26,26,29,0.5)', border: '1px solid rgba(255,255,255,0.06)' }}
                    onMouseEnter={e => { e.currentTarget.style.borderColor = '#FF6B00' }}
                    onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.06)' }}>
                    <div className="w-full h-24 rounded-lg flex items-center justify-center mb-2 overflow-hidden" style={{ background: 'rgba(10,10,11,0.6)' }}>
                      {product.imagen ? (
                        <img src={product.imagen} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#2D2D34" strokeWidth="1.5"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><path d="m21 15-5-5L5 21"/></svg>
                      )}
                    </div>
                    <p className="text-[14px] font-bold text-white line-clamp-2 leading-tight mb-1">{product.descripcion}</p>
                    <p className="text-[13px] font-black" style={{ color: '#FF6B00' }}>S/ {Number(product.precio_unitario).toFixed(2)}</p>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* ═══ RIGHT PANEL: CHECKOUT ═══ */}
        <div className="w-[420px] flex flex-col overflow-hidden" style={{ background: 'rgba(26,26,29,0.3)' }}>

          {/* ─── CLIENTE ─── */}
          <div className="p-4" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
            <div className="flex items-center gap-2 mb-3">
              <div className="w-6 h-6 rounded-lg flex items-center justify-center" style={{ background: 'rgba(255,107,0,0.15)' }}>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#FF6B00" strokeWidth="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
              </div>
              <span className="text-[13px] font-black uppercase tracking-widest text-white">CLIENTE</span>
            </div>
            <div className="flex gap-2 mb-2">
              <div className="flex-1">
                <label className="text-[14px] font-bold uppercase tracking-wider mb-1 block" style={{ color: '#9E9E9E' }}>Nombre</label>
                <div className="relative">
                  <input className="w-full px-3 py-2 rounded-lg text-[14px]"
                    style={{ background: 'rgba(26,26,29,0.6)', border: '1px solid rgba(255,255,255,0.08)', color: '#E0E0E0', outline: 'none' }}
                    placeholder="Nombre del cliente"
                    value={clienteNombre}
                    onChange={e => handleClientSearch(e.target.value)} />
                  {clienteSuggestions.length > 0 && (
                    <div className="absolute top-full left-0 right-0 z-20 mt-1 rounded-lg overflow-hidden" style={{ background: '#1A1A1E', border: '1px solid rgba(255,255,255,0.08)' }}>
                      {clienteSuggestions.map(c => (
                        <button key={c._id} onClick={() => selectClient(c)}
                          className="w-full text-left px-3 py-2 text-[13px] text-white hover:bg-white/5 transition-colors border-b last:border-0"
                          style={{ borderColor: 'rgba(255,255,255,0.05)' }}>
                          <span className="font-bold">{c.razon_social}</span>
                          <span className="ml-2 text-[13px]" style={{ color: '#9E9E9E' }}>{c.ruc_dni}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
              <div className="w-32">
                <label className="text-[14px] font-bold uppercase tracking-wider mb-1 block" style={{ color: '#9E9E9E' }}>DNI</label>
                <input className="w-full px-3 py-2 rounded-lg text-[14px] font-mono"
                  style={{ background: 'rgba(26,26,29,0.6)', border: '1px solid rgba(255,255,255,0.08)', color: '#E0E0E0', outline: 'none' }}
                  placeholder="DNI"
                  value={clienteDni}
                  onChange={e => { setClienteDni(e.target.value); if (e.target.value.length >= 8) buscarClientePorDni(e.target.value) }}
                  maxLength={11} />
              </div>
              <button onClick={handleRegisterClient} className="self-end w-9 h-9 rounded-lg flex items-center justify-center shrink-0"
                style={{ background: 'rgba(26,26,29,0.8)', border: '1px solid rgba(255,255,255,0.08)' }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#9E9E9E" strokeWidth="2"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><line x1="19" y1="8" x2="19" y2="14"/><line x1="22" y1="11" x2="16" y2="11"/></svg>
              </button>
            </div>
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg" style={{ background: 'rgba(255,107,0,0.06)' }}>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#FF6B00" strokeWidth="2"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
              <span className="text-[13px] font-bold" style={{ color: '#FF6B00' }}>Cliente frecuente</span>
              <span className="ml-auto text-[13px] font-bold" style={{ color: '#FF6B00' }}>125 pts. <ChevronRight size={8} className="inline" /></span>
            </div>
          </div>

          {/* ─── PRODUCTOS EN VENTA ─── */}
          <div className="flex-1 flex flex-col overflow-hidden p-4">
            <div className="flex items-center justify-between mb-3">
              <p className="text-[13px] font-black uppercase tracking-widest text-white">PRODUCTOS EN VENTA ({cart.length})</p>
              <button onClick={clearCart} className="flex items-center gap-1 text-[13px] font-bold" style={{ color: '#9E9E9E' }}>
                <Trash2 size={10} /> Limpiar
              </button>
            </div>

            <div className="flex-1 overflow-y-auto space-y-2" style={{ scrollbarWidth: 'thin' }}>
              {cart.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-center">
                  <ShoppingCart size={32} style={{ color: '#1A1A1E' }} className="mb-2" />
                  <p className="text-[14px] font-bold" style={{ color: '#2D2D34' }}>Carrito vacio</p>
                </div>
              ) : (
                cart.map(item => (
                  <div key={item._id} className="flex items-center gap-3 p-3 rounded-xl"
                    style={{ background: 'rgba(26,26,29,0.5)', border: '1px solid rgba(255,255,255,0.06)' }}>
                    {/* Product Image */}
                    <div className="w-12 h-12 rounded-lg flex items-center justify-center shrink-0 overflow-hidden" style={{ background: 'rgba(10,10,11,0.6)' }}>
                      {item.imagen ? (
                        <img src={item.imagen} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#2D2D34" strokeWidth="1.5"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><path d="m21 15-5-5L5 21"/></svg>
                      )}
                    </div>
                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <p className="text-[13px] font-bold text-white truncate">{item.descripcion}</p>
                      <p className="text-[13px] font-mono" style={{ color: '#9E9E9E' }}>Codigo: {item.codigo_pos || '—'}</p>
                    </div>
                    {/* Qty Controls */}
                    <div className="flex items-center gap-1">
                      <button onClick={() => updateQty(item._id, -1)}
                        className="w-7 h-7 rounded-lg flex items-center justify-center font-bold text-white text-xs"
                        style={{ background: 'rgba(26,26,29,0.8)', border: '1px solid rgba(255,255,255,0.08)' }}>-</button>
                      <span className="w-8 text-center text-xs font-black text-white">{item.cantidad}</span>
                      <button onClick={() => updateQty(item._id, 1)}
                        className="w-7 h-7 rounded-lg flex items-center justify-center font-bold text-white text-xs"
                        style={{ background: 'rgba(26,26,29,0.8)', border: '1px solid rgba(255,255,255,0.08)' }}>+</button>
                    </div>
                    {/* Price */}
                    <p className="text-[13px] font-bold text-white w-20 text-right">S/ {Number(item.precio_unitario).toFixed(2)}</p>
                    <p className="text-[13px] font-black w-20 text-right" style={{ color: '#FF6B00' }}>S/ {item.total_item.toFixed(2)}</p>
                    {/* Remove */}
                    <button onClick={() => removeFromCart(item._id)}
                      className="p-1.5 rounded-lg transition-colors"
                      style={{ color: '#9E9E9E' }}
                      onMouseEnter={e => e.currentTarget.style.color = '#EF4444'}
                      onMouseLeave={e => e.currentTarget.style.color = '#9E9E9E'}>
                      <X size={12} />
                    </button>
                  </div>
                ))
              )}
            </div>

            {/* ─── Totals ─── */}
            <div className="mt-3 pt-3 space-y-2" style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
              <div className="flex justify-between text-[13px]">
                <span style={{ color: '#9E9E9E' }}>Subtotal</span>
                <span className="font-bold text-white">S/ {subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-[13px]">
                <span style={{ color: '#9E9E9E' }}>Descuento</span>
                <span className="font-bold" style={{ color: '#10B981' }}>- S/ {descuento.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-[13px]">
                <span style={{ color: '#9E9E9E' }}>IGV (18%)</span>
                <span className="font-bold text-white">S/ {igv.toFixed(2)}</span>
              </div>
              <div className="flex justify-between items-center pt-2" style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
                <span className="text-sm font-black text-white">TOTAL</span>
                <span className="text-2xl font-black" style={{ color: '#FF6B00' }}>S/ {totalCart.toFixed(2)}</span>
              </div>
            </div>

            {/* ─── Document Buttons ─── */}
            <div className="flex gap-2 mt-3">
              <button onClick={() => handleCheckout('01')} disabled={cart.length === 0 || loading}
                className="flex-1 py-3 rounded-xl text-[13px] font-black uppercase tracking-widest flex items-center justify-center gap-1.5 transition-all disabled:opacity-30"
                style={{ background: 'linear-gradient(135deg, #FF6B00, #F25C05)', color: 'white', boxShadow: '0 4px 16px rgba(255,107,0,0.25)' }}>
                <FileText size={12} /> GENERAR BOLETA
              </button>
              <button onClick={() => handleCheckout('03')} disabled={cart.length === 0 || loading}
                className="flex-1 py-3 rounded-xl text-[13px] font-black uppercase tracking-widest flex items-center justify-center gap-1.5 transition-all disabled:opacity-30"
                style={{ background: 'linear-gradient(135deg, #FF6B00, #F25C05)', color: 'white', boxShadow: '0 4px 16px rgba(255,107,0,0.25)' }}>
                <Printer size={12} /> GENERAR TICKET
              </button>
              <button onClick={() => { if (cart.length === 0) return; setShowQuotationConfirm(true) }} disabled={cart.length === 0 || loading}
                className="flex-1 py-3 rounded-xl text-[13px] font-black uppercase tracking-widest flex items-center justify-center gap-1.5 transition-all disabled:opacity-30"
                style={{ background: 'rgba(26,26,29,0.8)', border: '1px solid rgba(255,255,255,0.08)', color: '#9E9E9E' }}>
                <Receipt size={12} /> COTIZACION
              </button>
            </div>

            {/* ─── Payment Methods ─── */}
            <div className="grid grid-cols-6 gap-2 mt-3">
              {[
                { img: '/efectivo.png', label: 'EFECTIVO', color: '#10B981' },
                { img: '/targeta.png', label: 'TARJETA', color: '#3B82F6' },
                { img: '/yape.png', label: 'YAPE', color: '#A855F7' },
                { img: '/plin.png', label: 'PLIN', color: '#EC4899' },
                { img: '/transferencia.png', label: 'TRANSFERENCIA', color: '#F59E0B' },
                { icon: MoreHorizontal, label: 'OTROS', color: '#6B7280' }
              ].map((method, i) => {
                const isActive = selectedPayment === method.label
                return (
                  <button key={i} onClick={() => setSelectedPayment(isActive ? null : method.label)}
                    className="flex flex-col items-center gap-1.5 py-3 rounded-xl transition-all"
                    style={{
                      background: isActive ? `${method.color}20` : 'rgba(26,26,29,0.5)',
                      border: `1px solid ${isActive ? method.color : 'rgba(255,255,255,0.06)'}`,
                      boxShadow: isActive ? `0 0 12px ${method.color}40` : 'none'
                    }}
                    onMouseEnter={e => { if (!isActive) { e.currentTarget.style.borderColor = method.color; e.currentTarget.style.background = `${method.color}10` } }}
                    onMouseLeave={e => { if (!isActive) { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.06)'; e.currentTarget.style.background = 'rgba(26,26,29,0.5)' } }}>
                    {method.img ? (
                      <img src={method.img} alt={method.label} className="w-8 h-8 object-contain" />
                    ) : (
                      <method.icon size={18} style={{ color: method.color }} />
                    )}
                    <span className="text-[13px] font-bold uppercase tracking-wider" style={{ color: isActive ? method.color : '#9E9E9E' }}>{method.label}</span>
                  </button>
                )
              })}
            </div>
          </div>
        </div>
      </div>

      {/* ═══ STATUS BAR ═══ */}
      <div className="flex items-center justify-between px-5 py-2 shrink-0" style={{ background: 'rgba(26,26,29,0.5)', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full" style={{ background: '#10B981' }} />
          <span className="text-[13px] font-bold" style={{ color: '#9E9E9E' }}>Sistema sincronizado con SICCE ERP</span>
        </div>
        <span className="text-[13px]" style={{ color: '#5A5A5A' }}>Ultima sincronizacion: {new Date().toLocaleString('es-PE')}</span>
        <span className="text-[13px]" style={{ color: '#5A5A5A' }}>Version: 2.0.0</span>
      </div>

      {/* ═══ SUCCESS TOAST ═══ */}
      {successMsg && (
        <div className="fixed top-4 right-4 z-50 px-4 py-2 rounded-xl text-[13px] font-bold animate-slide-up flex items-center gap-2"
          style={{ background: 'rgba(16,185,129,0.15)', border: '1px solid rgba(16,185,129,0.3)', color: '#10B981' }}>
          <CheckCircle size={14} /> {successMsg}
        </div>
      )}

      {/* ═══ CONFIRM MODAL ═══ */}
      {showConfirm && (
        <div className="fixed inset-0 flex items-center justify-center z-50" style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }}
          onClick={() => setShowConfirm(false)}>
          <div className="rounded-2xl p-6 max-w-md w-full mx-4 animate-slide-up"
            style={{ background: 'rgba(26,26,29,0.9)', border: '1px solid rgba(255,255,255,0.08)', boxShadow: '0 16px 48px rgba(0,0,0,0.4)' }}
            onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-black text-white uppercase tracking-wider">
                {tipoDocumento === '01' ? 'GENERAR BOLETA' : 'GENERAR TICKET'}
              </h3>
              <button onClick={() => setShowConfirm(false)} className="p-1.5 rounded-lg" style={{ background: 'rgba(26,26,29,0.8)' }}>
                <X size={14} style={{ color: '#9E9E9E' }} />
              </button>
            </div>
            <div className="space-y-3 text-sm mb-4">
              <div className="flex justify-between"><span style={{ color: '#9E9E9E' }}>CLIENTE</span><span className="font-bold text-white">{clienteNombre || 'PUBLICO GENERAL'}</span></div>
              <div className="flex justify-between"><span style={{ color: '#9E9E9E' }}>DNI/RUC</span><span className="font-bold text-white">{clienteDni || '—'}</span></div>
              <div className="flex justify-between"><span style={{ color: '#9E9E9E' }}>DOCUMENTO</span><span className="font-bold" style={{ color: tipoDocumento === '01' ? '#10B981' : '#FF6B00' }}>{tipoDocumento === '01' ? 'BOLETA' : 'TICKET'}</span></div>
              <div className="flex justify-between"><span style={{ color: '#9E9E9E' }}>METODO DE PAGO</span><span className="font-bold text-white">{selectedPayment || 'EFECTIVO'}</span></div>
              <div className="flex justify-between"><span style={{ color: '#9E9E9E' }}>PRODUCTOS</span><span className="font-bold text-white">{cart.length}</span></div>
              <div className="border-t pt-2 space-y-1" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
                {cart.map((it, i) => (
                  <div key={i} className="flex justify-between text-xs">
                    <span style={{ color: '#9E9E9E' }}>{it.descripcion} x{it.cantidad}</span>
                    <span className="text-white">S/ {it.total_item.toFixed(2)}</span>
                  </div>
                ))}
              </div>
              <div className="border-t pt-3 space-y-1" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
                <div className="flex justify-between text-xs"><span style={{ color: '#9E9E9E' }}>SUBTOTAL</span><span className="text-white">S/ {subtotal.toFixed(2)}</span></div>
                <div className="flex justify-between text-xs"><span style={{ color: '#9E9E9E' }}>IGV (18%)</span><span className="text-white">S/ {igv.toFixed(2)}</span></div>
              </div>
              <div className="flex justify-between border-t pt-2" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
                <span className="font-black text-white">TOTAL</span>
                <span className="text-2xl font-black" style={{ color: '#FF6B00' }}>S/ {totalCart.toFixed(2)}</span>
              </div>
            </div>
            <div className="flex gap-2">
              <button onClick={() => setShowConfirm(false)}
                className="flex-1 py-2.5 rounded-lg text-[14px] font-bold uppercase tracking-wider"
                style={{ background: 'transparent', border: '1px solid rgba(255,255,255,0.08)', color: '#9E9E9E' }}>CANCELAR</button>
              <button onClick={handleConfirmSale} disabled={loading}
                className="flex-1 py-2.5 rounded-lg text-[14px] font-bold uppercase tracking-wider text-white disabled:opacity-50 flex items-center justify-center gap-1.5"
                style={{ background: 'linear-gradient(135deg, #FF6B00, #F25C05)' }}>
                {loading ? 'PROCESANDO...' : 'CONFIRMAR VENTA'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ═══ QUOTATION CONFIRM MODAL ═══ */}
      {showQuotationConfirm && (
        <div className="fixed inset-0 flex items-center justify-center z-50" style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }}
          onClick={() => setShowQuotationConfirm(false)}>
          <div className="rounded-2xl p-6 max-w-md w-full mx-4 animate-slide-up"
            style={{ background: 'rgba(26,26,29,0.9)', border: '1px solid rgba(255,255,255,0.08)', boxShadow: '0 16px 48px rgba(0,0,0,0.4)' }}
            onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-black text-white uppercase tracking-wider">GENERAR COTIZACION</h3>
              <button onClick={() => setShowQuotationConfirm(false)} className="p-1.5 rounded-lg" style={{ background: 'rgba(26,26,29,0.8)' }}>
                <X size={14} style={{ color: '#9E9E9E' }} />
              </button>
            </div>
            <div className="space-y-3 text-sm mb-4">
              <div className="flex justify-between"><span style={{ color: '#9E9E9E' }}>CLIENTE</span><span className="font-bold text-white">{clienteNombre || 'PUBLICO GENERAL'}</span></div>
              <div className="flex justify-between"><span style={{ color: '#9E9E9E' }}>DNI/RUC</span><span className="font-bold text-white">{clienteDni || '—'}</span></div>
              <div className="flex justify-between"><span style={{ color: '#9E9E9E' }}>PRODUCTOS</span><span className="font-bold text-white">{cart.length}</span></div>
              <div className="border-t pt-2 space-y-1" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
                {cart.map((it, i) => (
                  <div key={i} className="flex justify-between text-xs">
                    <span style={{ color: '#9E9E9E' }}>{it.descripcion} x{it.cantidad}</span>
                    <span className="text-white">S/ {it.total_item.toFixed(2)}</span>
                  </div>
                ))}
              </div>
              <div className="border-t pt-3 space-y-1" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
                <div className="flex justify-between text-xs"><span style={{ color: '#9E9E9E' }}>SUBTOTAL</span><span className="text-white">S/ {subtotal.toFixed(2)}</span></div>
                <div className="flex justify-between text-xs"><span style={{ color: '#9E9E9E' }}>IGV (18%)</span><span className="text-white">S/ {igv.toFixed(2)}</span></div>
              </div>
              <div className="flex justify-between border-t pt-2" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
                <span className="font-black text-white">TOTAL</span>
                <span className="text-2xl font-black" style={{ color: '#FF6B00' }}>S/ {totalCart.toFixed(2)}</span>
              </div>
            </div>
            <div className="flex gap-2">
              <button onClick={() => setShowQuotationConfirm(false)}
                className="flex-1 py-2.5 rounded-lg text-[14px] font-bold uppercase tracking-wider"
                style={{ background: 'transparent', border: '1px solid rgba(255,255,255,0.08)', color: '#9E9E9E' }}>CANCELAR</button>
              <button onClick={handleCreateQuotation} disabled={loading}
                className="flex-1 py-2.5 rounded-lg text-[14px] font-bold uppercase tracking-wider text-white disabled:opacity-50 flex items-center justify-center gap-1.5"
                style={{ background: 'linear-gradient(135deg, #FF6B00, #F25C05)' }}>
                {loading ? 'PROCESANDO...' : 'GENERAR COTIZACION'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ═══ QUOTATION MODAL ═══ */}
      {showQuotationTicket && lastQuotation && (
        <QuotationModal quotation={lastQuotation} company={company} puntoVenta={puntoVenta} onClose={() => setShowQuotationTicket(false)} />
      )}

      {/* ═══ PRODUCT DETAIL MODAL ═══ */}
      {showProductDetail && selectedProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ background: 'rgba(0,0,0,0.6)' }} onClick={() => setShowProductDetail(false)}>
          <div className="rounded-2xl p-6 max-w-md w-full mx-4" style={{ background: 'rgba(26,26,29,0.95)', border: '1px solid rgba(255,255,255,0.08)' }}
            onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-black text-white uppercase tracking-wider">Detalle del Producto</h3>
              <button onClick={() => setShowProductDetail(false)} className="p-1.5 rounded-lg" style={{ background: 'rgba(26,26,29,0.8)' }}>
                <X size={14} style={{ color: '#9E9E9E' }} />
              </button>
            </div>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between"><span style={{ color: '#9E9E9E' }}>Codigo:</span><span className="font-mono font-bold text-white">{selectedProduct.codigo_pos || '—'}</span></div>
              <div className="flex justify-between"><span style={{ color: '#9E9E9E' }}>Nombre:</span><span className="font-bold text-white text-right max-w-[60%]">{selectedProduct.descripcion}</span></div>
              <div className="flex justify-between"><span style={{ color: '#9E9E9E' }}>Marca:</span><span className="font-bold text-white">{selectedProduct.marca || '—'}</span></div>
              <div className="flex justify-between"><span style={{ color: '#9E9E9E' }}>Categoria:</span><span className="font-bold text-white">{selectedProduct.categoria || '—'}</span></div>
              <div className="flex justify-between"><span style={{ color: '#9E9E9E' }}>Codigo Barra:</span><span className="font-mono font-bold text-white">{selectedProduct.codigo_barra || '—'}</span></div>
              <div className="flex justify-between"><span style={{ color: '#9E9E9E' }}>Precio:</span><span className="font-black" style={{ color: '#FF6B00' }}>S/ {Number(selectedProduct.precio_unitario).toFixed(2)}</span></div>
              <div className="flex justify-between"><span style={{ color: '#9E9E9E' }}>Stock:</span><span className={`font-bold ${(selectedProduct.stock_actual || 0) <= 0 ? 'text-[#EF4444]' : 'text-[#10B981]'}`}>{selectedProduct.stock_actual ?? 0} unidades</span></div>
              <div className="flex justify-between"><span style={{ color: '#9E9E9E' }}>Almacen:</span><span className="font-bold text-white">Principal</span></div>
            </div>
          </div>
        </div>
      )}

      {/* ═══ IMAGE PREVIEW MODAL ═══ */}
      {showImagePreview && selectedProduct?.imagen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ background: 'rgba(0,0,0,0.8)' }} onClick={() => setShowImagePreview(false)}>
          <div className="relative max-w-lg max-h-[90vh] mx-4" onClick={e => e.stopPropagation()}>
            <button onClick={() => setShowImagePreview(false)} className="absolute -top-3 -right-3 z-10 p-1 rounded-full" style={{ background: '#1A1A1D', border: '1px solid rgba(255,255,255,0.1)' }}>
              <X size={16} style={{ color: '#FFF' }} />
            </button>
            <img src={selectedProduct.imagen} alt="" className="max-w-full max-h-[85vh] rounded-2xl" style={{ border: '1px solid rgba(255,255,255,0.1)' }} />
          </div>
        </div>
      )}

      {/* ═══ TICKET MODAL ═══ */}
      {showTicket && lastSale && (
        <TicketModal sale={lastSale} company={company} puntoVenta={puntoVenta} onClose={() => setShowTicket(false)} />
      )}
    </div>
  )
}
