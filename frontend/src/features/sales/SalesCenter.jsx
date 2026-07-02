import { useState, useEffect, useRef } from 'react'
import { Search, Plus, Minus, X, ShoppingCart, User, Trash2, CreditCard, Package, Clock, BarChart3, TrendingUp, Activity, ChevronDown, LogOut, Building2, FileText, Users, Settings, MapPin, DollarSign, Printer, CheckCircle, Scan, Barcode, Camera, Hash, Tag, Box } from 'lucide-react'
import { productsApi, salesApi, contactsApi } from '../../services/api'
import TicketModal from '../../components/TicketModal'

export default function SalesCenter({ company, user, puntoVenta, onSwitchCompany, companies }) {
  const [clients, setClients] = useState([])
  const [products, setProducts] = useState([])
  const [modulos, setModulos] = useState([])
  const [moduloActivo, setModuloActivo] = useState(null)
  const [cart, setCart] = useState([])
  const [search, setSearch] = useState('')
  const [clienteDni, setClienteDni] = useState('')
  const [clienteNombre, setClienteNombre] = useState('')
  const [clienteSuggestions, setClienteSuggestions] = useState([])
  const [selectedProduct, setSelectedProduct] = useState(null)
  const [loading, setLoading] = useState(false)
  const [todaySales, setTodaySales] = useState({ sales: [], total: 0, count: 0 })
  const [showConfirm, setShowConfirm] = useState(false)
  const [tipoDocumento, setTipoDocumento] = useState('03')
  const [successMsg, setSuccessMsg] = useState('')
  const [lastSale, setLastSale] = useState(null)
  const [showTicket, setShowTicket] = useState(false)
  const [showHistory, setShowHistory] = useState(false)
  const [historySales, setHistorySales] = useState([])
  const [historyPage, setHistoryPage] = useState(1)
  const [historyTotal, setHistoryTotal] = useState(0)
  const [selectedHistory, setSelectedHistory] = useState(null)
  const searchRef = useRef(null)
  const barcodeBuffer = useRef('')
  const barcodeTimer = useRef(null)

  useEffect(() => {
    loadClients()
    loadModulos()
    loadAllProducts()
    loadTodaySales()
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
  const loadAllProducts = async () => {
    try {
      setModuloActivo(null)
      setSelectedProduct(null)
      const res = await productsApi.getAll({ activo: 'true', limit: 200 })
      if (res.data?.products) setProducts(res.data.products)
    } catch {}
  }
  const loadProducts = async (modulo) => {
    try {
      setModuloActivo(modulo)
      setSelectedProduct(null)
      const res = await productsApi.getAll({ modulo, activo: 'true', limit: 100 })
      if (res.data?.products) setProducts(res.data.products)
    } catch {}
  }
  const loadTodaySales = async () => { try { const res = await salesApi.getToday(); if (res.data) setTodaySales(res.data) } catch {} }
  const loadHistory = async (page = 1) => {
    try {
      const res = await salesApi.getAll({ page, limit: 25, origen: 'todos' })
      setHistorySales(res.data.sales || [])
      setHistoryTotal(res.data.pages || 1)
      setHistoryPage(res.data.page || 1)
    } catch {}
  }

  const handleBarcodeScan = async (code) => {
    try {
      const res = await productsApi.getByCode(code)
      if (res.data) {
        setSelectedProduct(res.data)
        addToCart(res.data)
      }
    } catch { setSearch(code) }
  }

  const handleSearchChange = (val) => {
    setSearch(val)
    if (!val.trim()) { setSelectedProduct(null); return }
    const found = products.find(p => p.codigo_pos?.toLowerCase() === val.toLowerCase() || p.codigo_barra === val)
    if (found) setSelectedProduct(found)
  }

  const handleSearchEnter = () => {
    if (!search.trim()) return
    const found = products.find(p =>
      p.descripcion?.toLowerCase().includes(search.toLowerCase()) ||
      p.codigo_pos?.toLowerCase() === search.toLowerCase() ||
      p.codigo_barra === search
    )
    if (found) { setSelectedProduct(found); addToCart(found); setSearch('') }
  }

  const handleClientSearch = (val) => {
    setClienteNombre(val.toUpperCase())
    if (val.length < 2) { setClienteSuggestions([]); return }
    const matches = clients.filter(c => c.razon_social?.toLowerCase().includes(val.toLowerCase()) || c.ruc_dni?.includes(val))
    setClienteSuggestions(matches.slice(0, 5))
  }

  const selectClient = (c) => {
    setClienteNombre(c.razon_social)
    setClienteDni(c.ruc_dni)
    setClienteSuggestions([])
  }

  const buscarClientePorDni = async (dni) => {
    if (dni.length < 8) return
    try {
      const res = await contactsApi.getByDni(dni)
      if (res.data) { setClienteNombre(res.data.razon_social); setClienteDni(res.data.ruc_dni) }
    } catch {}
  }

  const addToCart = (product) => {
    setCart(prev => {
      const existing = prev.find(p => p._id === product._id)
      if (existing) {
        return prev.map(p => p._id === product._id ? { ...p, cantidad: p.cantidad + 1, total_item: (p.cantidad + 1) * p.precio_unitario } : p)
      }
      return [...prev, {
        _id: product._id,
        codigo_pos: product.codigo_pos,
        descripcion: product.descripcion,
        marca: product.marca,
        categoria: product.categoria,
        precio_unitario: product.precio_unitario,
        cantidad: 1,
        total_item: product.precio_unitario
      }]
    })
  }

  const updateQty = (id, delta) => {
    setCart(prev => prev.map(p =>
      p._id === id ? { ...p, cantidad: Math.max(1, p.cantidad + delta), total_item: Math.max(1, p.cantidad + delta) * p.precio_unitario } : p
    ).filter(p => p.cantidad > 0))
  }

  const removeFromCart = (id) => setCart(prev => prev.filter(p => p._id !== id))
  const clearCart = () => { setCart([]); setSelectedProduct(null) }

  const subtotal = cart.reduce((acc, p) => acc + p.total_item, 0)
  const igv = subtotal * 0.18
  const totalCart = subtotal + igv

  const handleCheckout = async () => {
    if (cart.length === 0) return
    setLoading(true)
    try {
      const items = cart.map(p => ({
        producto_id: p._id, descripcion: p.descripcion, codigo_pos: p.codigo_pos,
        cantidad: p.cantidad, precio_unitario: p.precio_unitario, total_item: p.total_item
      }))
      const res = await salesApi.create({
        items, tipo_documento: tipoDocumento,
        cliente_dni: clienteDni || undefined, cliente_nombre: clienteNombre || undefined,
        total: totalCart, serie: 'P001', punto_venta: puntoVenta
      })
      setLastSale(res.data)
      setCart([])
      setClienteDni(''); setClienteNombre(''); setClienteSuggestions([])
      setSelectedProduct(null)
      setSuccessMsg(`VENTA REGISTRADA - S/ ${totalCart.toFixed(2)}`)
      loadTodaySales()
      setTimeout(() => setSuccessMsg(''), 4000)
      setTimeout(() => setShowTicket(true), 500)
    } catch (err) { alert('Error: ' + (err.response?.data?.message || err.message)) }
    finally { setLoading(false); setShowConfirm(false) }
  }

  const filteredProducts = products.filter(p =>
    !search || p.descripcion?.toLowerCase().includes(search.toLowerCase()) || p.codigo_pos?.toLowerCase().includes(search.toLowerCase())
  )

  const topProducts = [...products].sort((a, b) => (b.precio_unitario || 0) - (a.precio_unitario || 0)).slice(0, 5)

  return (
    <div className="h-full flex flex-col" style={{ background: 'rgba(10,10,11,0.8)' }}>
      {/* ═══ TOP BAR ═══ */}
      <div className="glass flex items-center justify-between px-5 py-2 shrink-0" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg" style={{ background: 'rgba(245,107,19,0.12)' }}>
            <MapPin size={14} style={{ color: '#F56B13' }} />
            <div>
              <p className="text-[7px] font-bold uppercase tracking-wider" style={{ color: '#5A5A5A' }}>PUNTO DE VENTA</p>
              <p className="text-[11px] font-black tracking-tight" style={{ color: '#F56B13' }}>{puntoVenta || 'SIN PUNTO'}</p>
            </div>
          </div>
          <button onClick={onSwitchCompany} className="btn-relief flex items-center gap-1.5 px-2 py-1 rounded-lg">
            <Building2 size={12} style={{ color: '#5A5A5A' }} />
            <p className="text-[10px] font-bold text-white uppercase tracking-wider">{company?.name || 'SIGP'}</p>
            {companies?.length > 1 && <ChevronDown size={10} style={{ color: '#5A5A5A' }} />}
          </button>
          <span className="px-1.5 py-0.5 rounded text-[8px] font-bold uppercase" style={{ background: 'rgba(245,107,19,0.15)', color: '#F56B13' }}>{user?.role}</span>
        </div>
        <div className="flex items-center gap-4">
          {successMsg && (
            <div className="px-3 py-1.5 rounded-lg text-[11px] font-bold animate-slide-up flex items-center gap-1.5" style={{ background: 'rgba(16,185,129,0.15)', color: '#10B981' }}>
              <CheckCircle size={13} /> {successMsg}
            </div>
          )}
          <div className="text-right">
            <p className="text-[9px] uppercase" style={{ color: '#5A5A5A' }}>VENTAS HOY</p>
            <p className="text-[11px] font-black text-white">{todaySales.count} VENTAS · S/ {todaySales.total.toFixed(2)}</p>
          </div>
          <button onClick={() => { setShowHistory(!showHistory); if (!showHistory && historySales.length === 0) loadHistory() }}
            className="btn-relief-outline px-3 py-1.5 rounded-lg text-[9px] font-bold uppercase tracking-wider flex items-center gap-1">
            <FileText size={12} /> HISTORIAL
          </button>
        </div>
      </div>

      {/* ═══ MAIN GRID ═══ */}
      <div className="flex-1 grid overflow-hidden" style={{ gridTemplateColumns: '320px 1fr', gridTemplateRows: '1fr auto' }}>
        {/* ─── LEFT COLUMN: Client + Product Detail ─── */}
        <div className="flex flex-col overflow-hidden glass-strong" style={{ borderRight: '1px solid rgba(255,255,255,0.06)' }}>
          {/* Client Panel */}
          <div className="p-4" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
            <div className="flex items-center gap-2 mb-3">
              <User size={14} style={{ color: '#F56B13' }} />
              <span className="text-[10px] font-bold uppercase tracking-wider text-white">DATOS DEL CLIENTE</span>
            </div>
            <div className="space-y-2">
              <div className="relative">
                <input className="glass-input w-full px-3 py-2 rounded-lg text-[13px]"
                  placeholder="NOMBRE DEL CLIENTE"
                  value={clienteNombre}
                  onChange={e => handleClientSearch(e.target.value)} />
                {clienteSuggestions.length > 0 && (
                  <div className="absolute top-full left-0 right-0 z-20 mt-1 glass-strong rounded-lg overflow-hidden animate-slide-up">
                    {clienteSuggestions.map(c => (
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
                <input className="glass-input flex-1 px-3 py-2 rounded-lg text-[13px] font-mono"
                  placeholder="DNI / RUC"
                  value={clienteDni}
                  onChange={e => { setClienteDni(e.target.value.toUpperCase()); if (e.target.value.length >= 8) buscarClientePorDni(e.target.value) }}
                  maxLength={11} />
              </div>
            </div>
          </div>

          {/* Product Detail Panel */}
          <div className="flex-1 overflow-y-auto p-4">
            <div className="flex items-center gap-2 mb-3">
              <Box size={14} style={{ color: '#F56B13' }} />
              <span className="text-[10px] font-bold uppercase tracking-wider text-white">DETALLE DEL PRODUCTO</span>
            </div>

            {selectedProduct ? (
              <div className="glass-card rounded-xl p-4 animate-slide-up">
                <div className="flex items-start gap-3 mb-3">
                  <div className="w-14 h-14 rounded-xl flex items-center justify-center shrink-0" style={{ background: 'rgba(245,107,19,0.12)' }}>
                    <Package size={24} style={{ color: '#F56B13' }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-black text-white">{selectedProduct.descripcion}</p>
                    <p className="text-[10px] font-mono mt-0.5" style={{ color: '#F56B13' }}>{selectedProduct.codigo_pos || '—'}</p>
                  </div>
                </div>
                <div className="space-y-2 text-[11px]">
                  <div className="flex justify-between py-1.5 px-3 rounded-lg" style={{ background: 'rgba(255,255,255,0.03)' }}>
                    <span style={{ color: '#5A5A5A' }}>MARCA</span>
                    <span className="font-bold text-white">{selectedProduct.marca || '—'}</span>
                  </div>
                  <div className="flex justify-between py-1.5 px-3 rounded-lg" style={{ background: 'rgba(255,255,255,0.03)' }}>
                    <span style={{ color: '#5A5A5A' }}>CATEGORIA</span>
                    <span className="font-bold text-white">{selectedProduct.categoria || '—'}</span>
                  </div>
                  <div className="flex justify-between py-1.5 px-3 rounded-lg" style={{ background: 'rgba(255,255,255,0.03)' }}>
                    <span style={{ color: '#5A5A5A' }}>STOCK</span>
                    <span className={`font-bold ${selectedProduct.stock_actual <= 0 ? 'text-[#EF4444]' : selectedProduct.stock_actual <= 5 ? 'text-[#FBBF24]' : 'text-[#10B981]'}`}>
                      {selectedProduct.stock_actual ?? 0}
                    </span>
                  </div>
                  <div className="flex justify-between py-2 px-3 rounded-lg" style={{ background: 'rgba(245,107,19,0.08)' }}>
                    <span className="font-bold" style={{ color: '#5A5A5A' }}>PRECIO UNITARIO</span>
                    <span className="text-base font-black" style={{ color: '#F56B13' }}>S/ {Number(selectedProduct.precio_unitario).toFixed(2)}</span>
                  </div>
                </div>
                <button onClick={() => { addToCart(selectedProduct); setSelectedProduct(selectedProduct) }}
                  className="btn-relief-accent w-full mt-3 py-2 rounded-lg text-[10px] font-bold uppercase tracking-wider flex items-center justify-center gap-1.5">
                  <Plus size={14} /> AGREGAR AL CARRITO
                </button>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-40 text-center">
                <Scan size={36} style={{ color: '#2A2A2E' }} className="mb-2" />
                <p className="text-[10px]" style={{ color: '#5A5A5A' }}>BUSCA O ESCANEA UN PRODUCTO</p>
                <p className="text-[9px] mt-1" style={{ color: '#3A3A3E' }}>USA EL BUSCADOR, ESCANER O SELECCIONA DE LA GRILLA</p>
              </div>
            )}
          </div>
        </div>

        {/* ─── RIGHT COLUMN: Search + Product Grid ─── */}
        <div className="flex flex-col overflow-hidden">
          {/* Search + Category tabs */}
          <div className="px-4 pt-4 pb-2 glass" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
            <div className="relative mb-2">
              <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: '#5A5A5A' }} />
              <input
                ref={searchRef}
                className="glass-input w-full pl-9 pr-10 py-2 rounded-lg text-[13px]"
                placeholder="BUSCAR POR NOMBRE, CODIGO O ESCANEAR CODIGO DE BARRAS..."
                value={search}
                onChange={e => handleSearchChange(e.target.value.toUpperCase())}
                onKeyDown={e => { if (e.key === 'Enter') handleSearchEnter() }}
              />
              <Scan size={15} className="absolute right-3 top-1/2 -translate-y-1/2" style={{ color: '#F56B13' }} />
            </div>
            <div className="flex gap-1.5 overflow-x-auto pb-1">
              <button
                onClick={() => loadAllProducts()}
                className="btn-relief px-3 py-1.5 rounded-md text-[9px] font-bold uppercase tracking-widest whitespace-nowrap transition-all"
                style={{
                  background: !moduloActivo ? 'linear-gradient(180deg, #F56B13, #C44D00)' : '',
                  color: !moduloActivo ? 'white' : '#5A5A5A',
                  boxShadow: !moduloActivo ? '0 2px 8px rgba(245,107,19,0.3)' : ''
                }}
              >TODOS</button>
              {modulos.slice(0, 15).map(m => (
                <button
                  key={m}
                  onClick={() => loadProducts(m)}
                  className="btn-relief px-3 py-1.5 rounded-md text-[9px] font-bold uppercase tracking-widest whitespace-nowrap transition-all"
                  style={{
                    background: moduloActivo === m ? 'linear-gradient(180deg, #F56B13, #C44D00)' : '',
                    color: moduloActivo === m ? 'white' : '#5A5A5A',
                    boxShadow: moduloActivo === m ? '0 2px 8px rgba(245,107,19,0.3)' : ''
                  }}
                >{m}</button>
              ))}
            </div>
          </div>

          {/* Product Grid */}
          <div className="flex-1 overflow-y-auto p-4" style={{ background: 'rgba(10,10,11,0.4)' }}>
            {moduloActivo === null && modulos.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center">
                <Package size={44} style={{ color: '#2A2A2E' }} className="mb-3" />
                <p className="text-sm font-bold uppercase tracking-widest" style={{ color: '#5A5A5A' }}>SELECCIONA UNA CATEGORIA</p>
                <p className="text-[10px] mt-1" style={{ color: '#3A3A3E' }}>O BUSCA UN PRODUCTO POR CODIGO O NOMBRE</p>
              </div>
            ) : filteredProducts.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center">
                <Package size={44} style={{ color: '#2A2A2E' }} className="mb-3" />
                <p className="text-sm font-bold uppercase tracking-widest" style={{ color: '#5A5A5A' }}>SIN PRODUCTOS</p>
              </div>
            ) : (
              <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-2.5">
                {filteredProducts.map(product => (
                  <button
                    key={product._id}
                    onClick={() => { setSelectedProduct(product); addToCart(product) }}
                    className="glass-card rounded-xl p-3 transition-all text-left active:scale-95"
                    onMouseEnter={e => { e.currentTarget.style.borderColor = '#F56B13'; e.currentTarget.style.boxShadow = '0 4px 20px rgba(245,107,19,0.15)' }}
                    onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.06)'; e.currentTarget.style.boxShadow = '' }}
                  >
                    <div className="w-full h-14 rounded-lg flex items-center justify-center mb-2" style={{ background: 'rgba(26,26,29,0.4)' }}>
                      <Package size={20} style={{ color: '#3A3A3E' }} />
                    </div>
                    <p className="text-[8px] font-mono mb-0.5" style={{ color: '#F56B13' }}>{product.codigo_pos || '—'}</p>
                    <p className="text-[10px] font-bold text-white line-clamp-1">{product.descripcion}</p>
                    <p className="text-[11px] font-black mt-1" style={{ color: '#F56B13' }}>S/ {Number(product.precio_unitario).toFixed(2)}</p>
                    <p className={`text-[7px] font-bold mt-0.5 ${product.stock_actual <= 0 ? 'text-[#EF4444]' : product.stock_actual <= 5 ? 'text-[#FBBF24]' : 'text-[#10B981]'}`}>
                      STOCK: {product.stock_actual ?? 0}
                    </p>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* ═══ BOTTOM: Cart + Totals + Actions (span both columns) ═══ */}
        <div className="glass-strong col-span-full" style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
          <div className="grid" style={{ gridTemplateColumns: '1fr 320px' }}>
            {/* Cart items */}
            <div className="p-3 overflow-x-auto" style={{ borderRight: '1px solid rgba(255,255,255,0.06)' }}>
              {cart.length === 0 ? (
                <div className="flex items-center gap-2 py-2">
                  <ShoppingCart size={16} style={{ color: '#2A2A2E' }} />
                  <p className="text-[11px]" style={{ color: '#5A5A5A' }}>CARRITO VACIO — AGREGA PRODUCTOS</p>
                </div>
              ) : (
                <div className="flex gap-2 overflow-x-auto pb-1">
                  {cart.map(item => (
                    <div key={item._id} className="glass-card p-2 rounded-lg shrink-0" style={{ minWidth: '180px' }}>
                      <div className="flex items-start justify-between mb-1">
                        <p className="text-[9px] font-bold text-white line-clamp-1">{item.descripcion}</p>
                        <button onClick={() => removeFromCart(item._id)} className="p-0.5 rounded hover:bg-red-500/10 shrink-0 ml-1" style={{ color: '#5A5A5A' }}>
                          <X size={10} />
                        </button>
                      </div>
                      <p className="text-[8px] font-mono mb-1" style={{ color: '#5A5A5A' }}>{item.codigo_pos || '—'} · S/ {Number(item.precio_unitario).toFixed(2)}</p>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1">
                          <button onClick={() => updateQty(item._id, -1)} className="btn-relief w-5 h-5 rounded flex items-center justify-center">
                            <Minus size={9} className="text-white" />
                          </button>
                          <span className="w-5 text-center text-[11px] font-bold text-white">{item.cantidad}</span>
                          <button onClick={() => updateQty(item._id, 1)} className="btn-relief w-5 h-5 rounded flex items-center justify-center">
                            <Plus size={9} className="text-white" />
                          </button>
                        </div>
                        <span className="text-[10px] font-black" style={{ color: '#F56B13' }}>S/ {item.total_item.toFixed(2)}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Totals + Actions */}
            <div className="p-3 flex items-center gap-3">
              <div className="flex-1 text-right">
                <div className="flex justify-between text-[9px]"><span style={{ color: '#5A5A5A' }}>SUBTOTAL</span><span className="text-white">S/ {subtotal.toFixed(2)}</span></div>
                <div className="flex justify-between text-[9px]"><span style={{ color: '#5A5A5A' }}>IGV 18%</span><span className="text-white">S/ {igv.toFixed(2)}</span></div>
                <div className="flex justify-between text-sm mt-1 pt-1" style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
                  <span className="font-black text-white">TOTAL</span>
                  <span className="font-black" style={{ color: '#F56B13' }}>S/ {totalCart.toFixed(2)}</span>
                </div>
              </div>
              <div className="flex gap-1.5">
                <button onClick={clearCart} disabled={cart.length === 0}
                  className="btn-relief-outline px-3 py-2 rounded-lg text-[9px] font-bold uppercase tracking-wider disabled:opacity-30">
                  <Trash2 size={12} />
                </button>
                <button onClick={() => { setTipoDocumento('03'); setShowConfirm(true) }}
                  disabled={cart.length === 0 || loading}
                  className="btn-relief-accent px-4 py-2 rounded-lg text-[9px] font-bold uppercase tracking-wider disabled:opacity-40 flex items-center gap-1.5">
                  <Printer size={12} /> TICKET
                </button>
                <button onClick={() => { setTipoDocumento('01'); setShowConfirm(true) }}
                  disabled={cart.length === 0 || loading}
                  className="btn-relief-accent px-4 py-2 rounded-lg text-[9px] font-bold uppercase tracking-wider disabled:opacity-40 flex items-center gap-1.5"
                  style={{ background: 'linear-gradient(180deg, #10B981, #059669)' }}>
                  <FileText size={12} /> BOLETA
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom bar: Activity */}
        <div className="col-span-full glass" style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
          <div className="grid" style={{ gridTemplateColumns: '1fr 1fr' }}>
            <div className="p-2 flex items-center gap-4" style={{ borderRight: '1px solid rgba(255,255,255,0.06)' }}>
              <div className="flex items-center gap-2">
                <BarChart3 size={12} style={{ color: '#F56B13' }} />
                <span className="text-[9px] font-bold uppercase tracking-wider text-white">HOY</span>
              </div>
              <span className="text-[10px] font-black" style={{ color: '#F56B13' }}>{todaySales.count} VENTAS</span>
              <span className="text-[10px] font-black text-white">S/ {todaySales.total.toFixed(2)}</span>
              <div className="flex gap-1">
                {topProducts.slice(0, 3).map((p, i) => (
                  <span key={i} className="px-1.5 py-0.5 rounded text-[7px] font-bold glass" style={{ color: '#5A5A5A' }}>{p.descripcion?.substring(0, 12)}</span>
                ))}
              </div>
            </div>
            <div className="p-2 overflow-hidden">
              <div className="flex items-center gap-2">
                <Activity size={12} style={{ color: '#10B981' }} />
                <span className="text-[9px] font-bold uppercase tracking-wider text-white">ACTIVIDAD RECIENTE</span>
              </div>
              <div className="flex gap-3 overflow-x-auto mt-1">
                {todaySales.sales.length === 0 ? (
                  <p className="text-[9px]" style={{ color: '#5A5A5A' }}>SIN ACTIVIDAD HOY</p>
                ) : (
                  todaySales.sales.slice(0, 5).map((s, i) => (
                    <div key={s._id || i} className="flex items-center gap-2 px-2 py-1 rounded glass-card shrink-0">
                      <div className="w-1.5 h-1.5 rounded-full" style={{ background: '#10B981' }} />
                      <span className="text-[8px] text-white font-bold">{s.cliente_nombre || 'PUBLICO'}</span>
                      <span className="text-[7px] font-mono" style={{ color: '#5A5A5A' }}>{s.serie}-{s.numero}</span>
                      <span className="text-[8px] font-black" style={{ color: '#F56B13' }}>S/ {Number(s.total).toFixed(2)}</span>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ═══ CONFIRM MODAL ═══ */}
      {showConfirm && (
        <div className="fixed inset-0 glass-modal-overlay flex items-center justify-center z-50" onClick={() => setShowConfirm(false)}>
          <div className="glass-modal rounded-2xl p-6 max-w-md w-full mx-4 animate-slide-up" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-black text-white uppercase tracking-wider">
                {tipoDocumento === '01' ? 'GENERAR BOLETA' : 'GENERAR TICKET'}
              </h3>
              <button onClick={() => setShowConfirm(false)} className="btn-relief p-1.5 rounded-lg"><X size={16} style={{ color: '#5A5A5A' }} /></button>
            </div>
            <div className="space-y-3 text-sm mb-4">
              <div className="flex justify-between"><span style={{ color: '#5A5A5A' }}>CLIENTE</span><span className="font-bold text-white">{clienteNombre || 'PUBLICO GENERAL'}</span></div>
              <div className="flex justify-between"><span style={{ color: '#5A5A5A' }}>DNI/RUC</span><span className="font-bold text-white">{clienteDni || '—'}</span></div>
              <div className="flex justify-between"><span style={{ color: '#5A5A5A' }}>DOCUMENTO</span><span className="font-bold" style={{ color: tipoDocumento === '01' ? '#10B981' : '#F56B13' }}>{tipoDocumento === '01' ? 'BOLETA' : 'TICKET'}</span></div>
              <div className="flex justify-between"><span style={{ color: '#5A5A5A' }}>PRODUCTOS</span><span className="font-bold text-white">{cart.length}</span></div>
              <div className="border-t pt-2 space-y-1" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
                {cart.map((it, i) => (
                  <div key={i} className="flex justify-between text-xs">
                    <span style={{ color: '#5A5A5A' }}>{it.descripcion} x{it.cantidad}</span>
                    <span className="text-white">S/ {it.total_item.toFixed(2)}</span>
                  </div>
                ))}
              </div>
              <div className="border-t pt-3 space-y-1" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
                <div className="flex justify-between text-xs"><span style={{ color: '#5A5A5A' }}>SUBTOTAL</span><span className="text-white">S/ {subtotal.toFixed(2)}</span></div>
                <div className="flex justify-between text-xs"><span style={{ color: '#5A5A5A' }}>IGV (18%)</span><span className="text-white">S/ {igv.toFixed(2)}</span></div>
              </div>
              <div className="flex justify-between border-t pt-2" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
                <span className="font-black text-white">TOTAL</span>
                <span className="text-2xl font-black" style={{ color: '#F56B13' }}>S/ {totalCart.toFixed(2)}</span>
              </div>
            </div>
            <div className="flex gap-2">
              <button onClick={() => setShowConfirm(false)} className="btn-relief-outline flex-1 py-2.5 rounded-lg text-[10px] font-bold uppercase tracking-wider">CANCELAR</button>
              <button onClick={handleCheckout} disabled={loading} className="btn-relief-accent flex-1 py-2.5 rounded-lg text-[10px] font-bold uppercase tracking-wider disabled:opacity-50 flex items-center justify-center gap-1.5">
                {loading ? 'PROCESANDO...' : 'CONFIRMAR VENTA'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ═══ TICKET MODAL ═══ */}
      {showTicket && lastSale && (
        <TicketModal sale={lastSale} company={company} puntoVenta={puntoVenta} onClose={() => setShowTicket(false)} />
      )}

      {/* ═══ HISTORY MODAL ═══ */}
      {showHistory && (
        <div className="fixed inset-0 glass-modal-overlay flex items-center justify-center z-50" onClick={() => setShowHistory(false)}>
          <div className="glass-modal rounded-2xl p-6 max-w-4xl w-full mx-4 max-h-[85vh] overflow-y-auto animate-slide-up" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-black text-white uppercase tracking-wider">HISTORIAL DE VENTAS</h3>
              <button onClick={() => setShowHistory(false)} className="btn-relief p-1.5 rounded-lg"><X size={16} style={{ color: '#5A5A5A' }} /></button>
            </div>

            {historySales.length === 0 ? (
              <p className="text-center py-8 text-[11px]" style={{ color: '#5A5A5A' }}>SIN VENTAS REGISTRADAS</p>
            ) : (
              <>
                <div className="overflow-x-auto">
                  <table className="glass-table w-full">
                    <thead>
                      <tr>
                        <th className="text-left text-[9px] font-bold uppercase tracking-wider px-2 py-2" style={{ color: '#5A5A5A' }}>TICKET</th>
                        <th className="text-left text-[9px] font-bold uppercase tracking-wider px-2 py-2" style={{ color: '#5A5A5A' }}>CLIENTE</th>
                        <th className="text-left text-[9px] font-bold uppercase tracking-wider px-2 py-2" style={{ color: '#5A5A5A' }}>FECHA</th>
                        <th className="text-right text-[9px] font-bold uppercase tracking-wider px-2 py-2" style={{ color: '#5A5A5A' }}>TOTAL</th>
                        <th className="text-center text-[9px] font-bold uppercase tracking-wider px-2 py-2" style={{ color: '#5A5A5A' }}>ESTADO</th>
                      </tr>
                    </thead>
                    <tbody>
                      {historySales.map(s => (
                        <tr key={s._id} className="cursor-pointer transition-all" onClick={() => setSelectedHistory(selectedHistory?._id === s._id ? null : s)}
                          style={{ background: selectedHistory?._id === s._id ? 'rgba(245,107,19,0.08)' : 'transparent' }}>
                          <td className="px-2 py-2 font-mono text-[10px]" style={{ color: '#F56B13' }}>{s.serie}-{s.numero}</td>
                          <td className="px-2 py-2 text-[10px] font-bold text-white">{s.cliente_nombre || 'PUBLICO GENERAL'}</td>
                          <td className="px-2 py-2 text-[9px]" style={{ color: '#5A5A5A' }}>{s.fecha_emision}</td>
                          <td className="px-2 py-2 text-[10px] font-bold text-right" style={{ color: '#F56B13' }}>S/ {Number(s.total).toFixed(2)}</td>
                          <td className="px-2 py-2 text-center">
                            <span className={`px-1.5 py-0.5 rounded text-[8px] font-bold uppercase ${s.estado === 'COMPLETADO' ? 'text-[#10B981]' : 'text-[#EF4444]'}`}
                              style={{ background: s.estado === 'COMPLETADO' ? 'rgba(16,185,129,0.1)' : 'rgba(239,68,68,0.1)' }}>
                              {s.estado}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <div className="flex items-center justify-between mt-4">
                  <p className="text-[10px]" style={{ color: '#5A5A5A' }}>PAGINA {historyPage} DE {historyTotal}</p>
                  <div className="flex gap-2">
                    <button onClick={() => loadHistory(Math.max(1, historyPage - 1))} disabled={historyPage <= 1}
                      className="btn-relief-outline px-3 py-1.5 rounded-lg text-[9px] font-bold uppercase disabled:opacity-30">ANTERIOR</button>
                    <button onClick={() => loadHistory(Math.min(historyTotal, historyPage + 1))} disabled={historyPage >= historyTotal}
                      className="btn-relief-outline px-3 py-1.5 rounded-lg text-[9px] font-bold uppercase disabled:opacity-30">SIGUIENTE</button>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
