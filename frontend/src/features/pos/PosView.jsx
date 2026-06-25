import { useState, useEffect, useRef, useCallback } from 'react'
import { Search, Plus, Minus, X, ShoppingCart, User, Trash2, CreditCard, Printer, LogOut, Grid, Package, Clock, ChevronDown } from 'lucide-react'
import { productsApi, salesApi, contactsApi } from '../../services/api'

export default function PosView({ company, user, companies, onLogout, onNavigate, onSwitchCompany }) {
  const isCajero = user?.role === 'CAJERO'
  const [modulos, setModulos] = useState([])
  const [moduloActivo, setModuloActivo] = useState(null)
  const [products, setProducts] = useState([])
  const [cart, setCart] = useState([])
  const [search, setSearch] = useState('')
  const [clienteDni, setClienteDni] = useState('')
  const [clienteNombre, setClienteNombre] = useState('')
  const [loading, setLoading] = useState(false)
  const [todaySales, setTodaySales] = useState({ count: 0, total: 0 })
  const [showConfirm, setShowConfirm] = useState(false)
  const [successMsg, setSuccessMsg] = useState('')
  const searchRef = useRef(null)
  const barcodeBuffer = useRef('')
  const barcodeTimer = useRef(null)

  // Cargar módulos al inicio
  useEffect(() => {
    loadModulos()
    loadTodaySales()
    searchRef.current?.focus()
  }, [])

  // Detectar escáner de código de barras
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Enter' && barcodeBuffer.current.length > 2) {
        const code = barcodeBuffer.current.trim()
        barcodeBuffer.current = ''
        handleBarcodeScan(code)
        return
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

  const loadModulos = async () => {
    try {
      const res = await productsApi.getModulos()
      setModulos(res.data.modulos || [])
    } catch { }
  }

  const loadProducts = async (modulo) => {
    try {
      setModuloActivo(modulo)
      const res = await productsApi.getAll({ modulo, activo: 'true' })
      setProducts(res.data.products || [])
    } catch { }
  }

  const loadTodaySales = async () => {
    try {
      const res = await salesApi.getToday()
      setTodaySales(res.data)
    } catch { }
  }

  const handleBarcodeScan = async (code) => {
    try {
      const res = await productsApi.getByCode(code)
      addToCart(res.data)
    } catch {
      // Si no se encuentra, buscarlo textual
      setSearch(code)
    }
  }

  const addToCart = (product) => {
    setCart(prev => {
      const existing = prev.find(p => p._id === product._id)
      if (existing) {
        return prev.map(p => p._id === product._id
          ? { ...p, cantidad: p.cantidad + 1, total_item: (p.cantidad + 1) * p.precio_unitario }
          : p
        )
      }
      return [...prev, {
        _id: product._id,
        codigo_pos: product.codigo_pos,
        descripcion: product.descripcion,
        precio_unitario: product.precio_unitario,
        cantidad: 1,
        total_item: product.precio_unitario
      }]
    })
  }

  const updateQty = (id, delta) => {
    setCart(prev => prev.map(p =>
      p._id === id
        ? { ...p, cantidad: Math.max(1, p.cantidad + delta), total_item: Math.max(1, p.cantidad + delta) * p.precio_unitario }
        : p
    ).filter(p => p.cantidad > 0))
  }

  const removeFromCart = (id) => {
    setCart(prev => prev.filter(p => p._id !== id))
  }

  const totalCart = cart.reduce((acc, p) => acc + p.total_item, 0)

  const buscarCliente = async (dni) => {
    if (dni.length < 8) return
    try {
      const res = await contactsApi.getByDni(dni)
      setClienteNombre(res.data.razon_social || '')
    } catch {
      setClienteNombre('')
    }
  }

  const handleCheckout = async () => {
    if (cart.length === 0) return
    setLoading(true)
    try {
      const items = cart.map(p => ({
        producto_id: p._id,
        descripcion: p.descripcion,
        codigo_pos: p.codigo_pos,
        cantidad: p.cantidad,
        precio_unitario: p.precio_unitario,
        total_item: p.total_item
      }))
      await salesApi.create({
        items,
        cliente_dni: clienteDni || undefined,
        cliente_nombre: clienteNombre || undefined,
        total: totalCart,
        serie: 'P001'
      })
      setCart([])
      setClienteDni('')
      setClienteNombre('')
      setSuccessMsg(`Venta registrada — S/ ${totalCart.toFixed(2)}`)
      loadTodaySales()
      setTimeout(() => setSuccessMsg(''), 3000)
    } catch (err) {
      alert('Error al registrar venta: ' + (err.response?.data?.message || err.message))
    } finally {
      setLoading(false)
      setShowConfirm(false)
    }
  }

  return (
    <div className="h-screen flex flex-col bg-[#f5efe6] overflow-hidden">
      {/* Top bar */}
      <header className="flex items-center justify-between px-6 py-3 bg-white border-b border-[#e8dfd2] shadow-sm">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-[#e8dfd2] flex items-center justify-center">
            <span className="text-sm font-black text-[#1a1916]">SIGP</span>
          </div>
          <div>
            <button onClick={onSwitchCompany} className="flex items-center gap-1.5 group">
              <p className="text-xs font-bold text-[#1a1916] uppercase tracking-wider">{company?.name || 'SIGP'}</p>
              {companies?.length > 1 && <ChevronDown size={12} className="text-[#6b6960] group-hover:text-[#1a1916]" />}
            </button>
            <div className="flex items-center gap-2 mt-0.5">
              <p className="text-[10px] text-[#6b6960]">Punto de Venta</p>
              <span className={`px-1.5 py-0.5 rounded text-[8px] font-bold uppercase tracking-wider ${
                isCajero ? 'bg-amber-100 text-amber-700' : 'bg-blue-100 text-blue-700'
              }`}>{user?.role || 'USER'}</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="text-right">
            <p className="text-[10px] text-[#6b6960]">Ventas hoy</p>
            <p className="text-sm font-black text-[#1a1916]">{todaySales.count} ventas — S/ {todaySales.total.toFixed(2)}</p>
          </div>
          {successMsg && (
            <div className="px-4 py-2 bg-emerald-100 text-emerald-800 rounded-lg text-xs font-bold animate-in slide-in-from-right-2 fade-in">
              {successMsg}
            </div>
          )}
          <button onClick={onLogout} className="p-2 rounded-lg hover:bg-[#f0efec] transition-colors" title="Cerrar sesión">
            <LogOut size={18} className="text-[#6b6960]" />
          </button>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* Left: Products grid */}
        <div className="flex-1 flex flex-col overflow-hidden border-r border-[#e8dfd2]">
          {/* Search */}
          <div className="p-4 bg-white border-b border-[#e8dfd2]">
            <div className="relative max-w-md">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#9e9c94]" />
              <input
                ref={searchRef}
                className="w-full pl-10 pr-4 py-3 bg-[#f5efe6] border border-[#d8d6cf] rounded-xl text-sm font-medium outline-none focus:border-[#1a1916] transition-colors"
                placeholder="Buscar producto por nombre o código..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                onKeyDown={e => {
                  if (e.key === 'Enter' && search.trim()) {
                    const found = products.find(p =>
                      p.descripcion.toLowerCase().includes(search.toLowerCase()) ||
                      p.codigo_pos?.toLowerCase() === search.toLowerCase()
                    )
                    if (found) addToCart(found)
                    setSearch('')
                  }
                }}
              />
            </div>
          </div>

          {/* Module tabs */}
          <div className="flex gap-1.5 px-4 py-3 bg-white border-b border-[#e8dfd2] overflow-x-auto">
            {modulos.map(m => (
              <button
                key={m}
                onClick={() => loadProducts(m)}
                className={`px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest whitespace-nowrap transition-all ${
                  moduloActivo === m
                    ? 'bg-[#1a1916] text-white shadow-md'
                    : 'bg-[#f0efec] text-[#6b6960] hover:bg-[#e8dfd2]'
                }`}
              >
                {m}
              </button>
            ))}
            {modulos.length === 0 && (
              <p className="text-[11px] text-[#9e9c94] py-2">Crea productos con módulos para empezar</p>
            )}
          </div>

          {/* Products grid */}
          <div className="flex-1 overflow-y-auto p-4">
            <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
              {products.filter(p =>
                !search || p.descripcion.toLowerCase().includes(search.toLowerCase()) ||
                p.codigo_pos?.toLowerCase().includes(search.toLowerCase())
              ).map(product => (
                <button
                  key={product._id}
                  onClick={() => addToCart(product)}
                  className="bg-white rounded-xl p-4 border border-[#e8dfd2] hover:border-[#1a1916] hover:shadow-lg transition-all text-left group active:scale-95"
                >
                  <div className="w-12 h-12 rounded-lg bg-[#f5efe6] flex items-center justify-center mb-3 group-hover:bg-[#e8dfd2] transition-colors">
                    <Package size={22} className="text-[#6b6960]" />
                  </div>
                  <p className="text-[10px] font-mono text-[#9e9c94] mb-1">{product.codigo_pos || '—'}</p>
                  <p className="text-xs font-bold text-[#1a1916] leading-tight line-clamp-2">{product.descripcion}</p>
                  <p className="text-sm font-black text-emerald-700 mt-2">S/ {product.precio_unitario.toFixed(2)}</p>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Right: Cart */}
        <div className="w-96 flex flex-col bg-white">
          {/* Client info */}
          <div className="p-4 border-b border-[#e8dfd2] space-y-2">
            <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-wider text-[#6b6960] mb-2">
              <User size={14} /> Cliente
            </div>
            <input
              className="w-full px-3 py-2 bg-[#f5efe6] border border-[#d8d6cf] rounded-lg text-xs font-medium outline-none focus:border-[#1a1916] transition-colors"
              placeholder="DNI del cliente (opcional)"
              value={clienteDni}
              onChange={e => { setClienteDni(e.target.value); if (e.target.value.length >= 8) buscarCliente(e.target.value) }}
              maxLength={11}
            />
            {clienteNombre && (
              <p className="text-xs font-bold text-[#1a1916]">{clienteNombre}</p>
            )}
          </div>

          {/* Cart items */}
          <div className="flex-1 overflow-y-auto p-4 space-y-2">
            {cart.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center">
                <ShoppingCart size={40} className="text-[#e8dfd2] mb-3" />
                <p className="text-xs text-[#9e9c94] font-medium">Carrito vacío</p>
                <p className="text-[10px] text-[#b8b6ae] mt-1">Selecciona productos del lado izquierdo</p>
              </div>
            ) : (
              cart.map((item, idx) => (
                <div key={item._id} className="flex items-center gap-3 p-3 bg-[#faf7f2] rounded-xl border border-[#e8dfd2]">
                  <div className="flex-1 min-w-0">
                    <p className="text-[10px] font-mono text-[#9e9c94]">{item.codigo_pos || '—'}</p>
                    <p className="text-xs font-bold text-[#1a1916] truncate">{item.descripcion}</p>
                    <p className="text-xs font-semibold text-emerald-700 mt-0.5">S/ {item.precio_unitario.toFixed(2)}</p>
                  </div>
                  <div className="flex items-center gap-1">
                    <button onClick={() => updateQty(item._id, -1)} className="w-7 h-7 rounded-lg bg-white border border-[#d8d6cf] flex items-center justify-center hover:bg-[#f0efec]"><Minus size={12} /></button>
                    <span className="w-8 text-center text-sm font-bold font-mono">{item.cantidad}</span>
                    <button onClick={() => updateQty(item._id, 1)} className="w-7 h-7 rounded-lg bg-white border border-[#d8d6cf] flex items-center justify-center hover:bg-[#f0efec]"><Plus size={12} /></button>
                  </div>
                  <p className="text-sm font-black text-[#1a1916] w-20 text-right">S/ {item.total_item.toFixed(2)}</p>
                  <button onClick={() => removeFromCart(item._id)} className="p-1.5 rounded-lg hover:bg-red-50 text-red-400 hover:text-red-600 transition-colors">
                    <X size={14} />
                  </button>
                </div>
              ))
            )}
          </div>

          {/* Total & Checkout */}
          <div className="p-4 border-t border-[#e8dfd2] bg-white space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs text-[#6b6960] font-medium uppercase tracking-wider">Total</span>
              <span className="text-2xl font-black text-[#1a1916]">S/ {totalCart.toFixed(2)}</span>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => { if (cart.length > 0) setCart([]) }}
                className="flex-1 py-3 rounded-xl border border-red-200 text-red-600 text-xs font-bold uppercase tracking-wider hover:bg-red-50 transition-colors flex items-center justify-center gap-2"
                disabled={cart.length === 0}
              >
                <Trash2 size={16} /> Vaciar
              </button>
              <button
                onClick={() => { if (cart.length > 0) setShowConfirm(true) }}
                className="flex-[2] py-3 rounded-xl bg-[#1a1916] text-white text-xs font-bold uppercase tracking-wider hover:bg-black transition-colors flex items-center justify-center gap-2 disabled:opacity-40"
                disabled={cart.length === 0 || loading}
              >
                <CreditCard size={16} /> Cobrar S/ {totalCart.toFixed(2)}
              </button>
            </div>
            {!isCajero && (
              <button
                onClick={() => onNavigate('purchases')}
                className="w-full py-2 rounded-xl border border-[#d8d6cf] text-[#6b6960] text-[10px] font-bold uppercase tracking-wider hover:bg-[#f0efec] transition-colors flex items-center justify-center gap-2"
              >
                <Clock size={14} /> Compras rápidas
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Confirm modal */}
      {showConfirm && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50" onClick={() => setShowConfirm(false)}>
          <div className="bg-white rounded-2xl p-8 max-w-sm w-full mx-4 shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="text-center mb-6">
              <div className="w-16 h-16 rounded-2xl bg-emerald-100 flex items-center justify-center mx-auto mb-4">
                <ShoppingCart size={32} className="text-emerald-600" />
              </div>
              <h3 className="text-lg font-black text-[#1a1916]">Confirmar venta</h3>
              <p className="text-sm text-[#6b6960] mt-1">{cart.length} producto(s)</p>
              {clienteNombre && <p className="text-xs text-[#6b6960]">Cliente: {clienteNombre}</p>}
            </div>
            <p className="text-3xl font-black text-center text-[#1a1916] mb-6">S/ {totalCart.toFixed(2)}</p>
            <div className="flex gap-3">
              <button onClick={() => setShowConfirm(false)} className="flex-1 py-3 rounded-xl border border-[#d8d6cf] text-[#6b6960] text-xs font-bold uppercase tracking-wider hover:bg-[#f0efec]">Cancelar</button>
              <button onClick={handleCheckout} disabled={loading} className="flex-1 py-3 rounded-xl bg-emerald-600 text-white text-xs font-bold uppercase tracking-wider hover:bg-emerald-700 disabled:opacity-50">
                {loading ? 'Procesando...' : 'Confirmar venta'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
