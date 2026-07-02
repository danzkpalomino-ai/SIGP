import { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import { Package, CheckCircle, Loader2, AlertCircle, ArrowLeft } from 'lucide-react'

const API_BASE = import.meta.env.VITE_API_URL || '/api'

export default function ReceptionPage() {
  const { companyId, code } = useParams()
  const [product, setProduct] = useState(null)
  const [purchase, setPurchase] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [cantidad, setCantidad] = useState('')
  const [usuario, setUsuario] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [success, setSuccess] = useState(null)

  useEffect(() => {
    loadProduct()
  }, [companyId, code])

  const loadProduct = async () => {
    try {
      setLoading(true)
      setError('')
      const res = await fetch(`${API_BASE}/public/reception/${companyId}/${code}`)
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.message || 'Producto no encontrado')
      }
      const data = await res.json()
      setProduct(data.product)
      setPurchase(data.purchase)
      if (data.purchase?.cantidad_pedida) {
        setCantidad(String(data.purchase.cantidad_pedida))
      }
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleConfirm = async () => {
    if (!cantidad || Number(cantidad) < 0) return
    try {
      setSubmitting(true)
      const res = await fetch(`${API_BASE}/public/reception/${companyId}/${code}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cantidad_recibida: Number(cantidad), usuario: usuario || undefined })
      })
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.message || 'Error al confirmar')
      }
      const data = await res.json()
      setSuccess(data)
    } catch (err) {
      setError(err.message)
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: '#0A0A0B' }}>
        <div className="text-center">
          <Loader2 size={32} className="animate-spin mx-auto mb-3" style={{ color: '#FF6B00' }} />
          <p className="text-xs font-bold" style={{ color: '#9E9E9E' }}>Cargando producto...</p>
        </div>
      </div>
    )
  }

  if (error && !product) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: '#0A0A0B' }}>
        <div className="text-center max-w-sm mx-4">
          <AlertCircle size={48} style={{ color: '#EF4444' }} className="mx-auto mb-4" />
          <h1 className="text-lg font-black text-white mb-2">Error</h1>
          <p className="text-sm" style={{ color: '#9E9E9E' }}>{error}</p>
          <button onClick={() => window.history.back()} className="mt-6 px-6 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider" style={{ background: 'rgba(255,107,0,0.15)', color: '#FF6B00' }}>
            Volver
          </button>
        </div>
      </div>
    )
  }

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: '#0A0A0B' }}>
        <div className="text-center max-w-sm mx-4 animate-slide-up">
          <div className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4" style={{ background: 'rgba(16,185,129,0.15)' }}>
            <CheckCircle size={40} style={{ color: '#10B981' }} />
          </div>
          <h1 className="text-lg font-black text-white mb-2">RECEPCION CONFIRMADA</h1>
          <div className="rounded-xl p-4 mt-4" style={{ background: 'rgba(26,26,29,0.6)', border: '1px solid rgba(255,255,255,0.06)' }}>
            <p className="text-sm font-bold text-white mb-1">{success.product.descripcion}</p>
            <div className="space-y-1 text-xs" style={{ color: '#9E9E9E' }}>
              <p>Stock anterior: <span className="font-bold text-white">{success.product.stock_anterior}</span></p>
              <p>Recibido: <span className="font-bold" style={{ color: '#10B981' }}>+{success.product.cantidad_recibida}</span></p>
              <p>Stock nuevo: <span className="font-bold" style={{ color: '#FF6B00' }}>{success.product.stock_nuevo}</span></p>
            </div>
            <div className="mt-3 pt-3" style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
              <p className="text-[10px]" style={{ color: '#5A5A5A' }}>Recibido por: {success.recibido_por}</p>
              <p className="text-[10px]" style={{ color: '#5A5A5A' }}>{new Date(success.fecha).toLocaleString('es-PE')}</p>
            </div>
          </div>
          <button onClick={() => { setSuccess(null); setProduct(null); setCantidad(''); setError(''); loadProduct() }} className="mt-6 px-6 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider" style={{ background: 'rgba(255,107,0,0.15)', color: '#FF6B00' }}>
            Escanear otro
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen" style={{ background: '#0A0A0B' }}>
      <div className="max-w-lg mx-auto p-4">
        <button onClick={() => window.history.back()} className="flex items-center gap-2 mb-4 text-xs font-bold" style={{ color: '#9E9E9E' }}>
          <ArrowLeft size={14} /> Volver
        </button>

        <div className="flex items-center gap-2 mb-4">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: 'rgba(255,107,0,0.15)' }}>
            <Package size={16} style={{ color: '#FF6B00' }} />
          </div>
          <h1 className="text-sm font-black uppercase tracking-wider text-white">RECEPCION DE MERCADERIA</h1>
        </div>

        {product.imagen ? (
          <div className="w-full h-48 rounded-xl overflow-hidden mb-4">
            <img src={product.imagen} alt="" className="w-full h-full object-cover" />
          </div>
        ) : (
          <div className="w-full h-32 rounded-xl flex items-center justify-center mb-4" style={{ background: 'rgba(26,26,29,0.6)', border: '1px dashed rgba(255,255,255,0.08)' }}>
            <Package size={32} style={{ color: '#2D2D34' }} />
          </div>
        )}

        <div className="rounded-xl p-4 mb-4" style={{ background: 'rgba(26,26,29,0.6)', border: '1px solid rgba(255,255,255,0.06)' }}>
          <p className="text-base font-black text-white mb-2">{product.descripcion}</p>
          <div className="space-y-1.5 text-xs">
            <div className="flex justify-between">
              <span style={{ color: '#9E9E9E' }}>SKU</span>
              <span className="font-mono font-bold" style={{ color: '#FF6B00' }}>{product.codigo_pos || '—'}</span>
            </div>
            <div className="flex justify-between">
              <span style={{ color: '#9E9E9E' }}>EAN</span>
              <span className="font-mono font-bold text-white">{product.codigo_barra || '—'}</span>
            </div>
            <div className="flex justify-between">
              <span style={{ color: '#9E9E9E' }}>Marca</span>
              <span className="font-bold text-white">{product.marca || '—'}</span>
            </div>
            <div className="flex justify-between">
              <span style={{ color: '#9E9E9E' }}>Precio</span>
              <span className="font-black" style={{ color: '#FF6B00' }}>S/ {Number(product.precio_unitario).toFixed(2)}</span>
            </div>
            <div className="flex justify-between pt-2" style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
              <span style={{ color: '#9E9E9E' }}>Stock actual</span>
              <span className="font-black text-white">{product.stock_actual ?? 0} {product.unidad_medida || 'UND'}</span>
            </div>
          </div>
        </div>

        {purchase && (
          <div className="rounded-xl p-4 mb-4" style={{ background: 'rgba(59,130,246,0.06)', border: '1px solid rgba(59,130,246,0.15)' }}>
            <p className="text-[10px] font-bold uppercase tracking-wider mb-2" style={{ color: '#3B82F6' }}>ORDEN DE COMPRA ASOCIADA</p>
            <div className="space-y-1 text-xs">
              <div className="flex justify-between">
                <span style={{ color: '#9E9E9E' }}>Numero</span>
                <span className="font-bold text-white">{purchase.serie}-{purchase.numero}</span>
              </div>
              <div className="flex justify-between">
                <span style={{ color: '#9E9E9E' }}>Proveedor</span>
                <span className="font-bold text-white">{purchase.proveedor_nombre || '—'}</span>
              </div>
              <div className="flex justify-between">
                <span style={{ color: '#9E9E9E' }}>Cantidad pedida</span>
                <span className="font-black" style={{ color: '#3B82F6' }}>{purchase.cantidad_pedida} uds</span>
              </div>
            </div>
          </div>
        )}

        {error && (
          <div className="rounded-xl p-3 mb-4 flex items-center gap-2 text-xs" style={{ background: 'rgba(239,68,68,0.1)', color: '#EF4444' }}>
            <AlertCircle size={14} /> {error}
          </div>
        )}

        <div className="rounded-xl p-4 mb-4" style={{ background: 'rgba(26,26,29,0.6)', border: '1px solid rgba(255,255,255,0.06)' }}>
          <p className="text-[10px] font-bold uppercase tracking-wider mb-3" style={{ color: '#9E9E9E' }}>DATOS DE RECEPCION</p>
          <div className="space-y-3">
            <div>
              <label className="text-[10px] font-bold uppercase tracking-wider block mb-1" style={{ color: '#5A5A5A' }}>CANTIDAD RECIBIDA</label>
              <input type="number" min="0" value={cantidad} onChange={e => setCantidad(e.target.value)}
                className="w-full px-3 py-2.5 rounded-lg text-sm font-bold"
                style={{ background: 'rgba(10,10,11,0.8)', border: '1px solid rgba(255,255,255,0.08)', color: '#FFFFFF', outline: 'none' }}
                placeholder="0" />
            </div>
            <div>
              <label className="text-[10px] font-bold uppercase tracking-wider block mb-1" style={{ color: '#5A5A5A' }}>RECIBIDO POR (opcional)</label>
              <input type="text" value={usuario} onChange={e => setUsuario(e.target.value)}
                className="w-full px-3 py-2.5 rounded-lg text-sm"
                style={{ background: 'rgba(10,10,11,0.8)', border: '1px solid rgba(255,255,255,0.08)', color: '#FFFFFF', outline: 'none' }}
                placeholder="Nombre del trabajador" />
            </div>
          </div>
        </div>

        <button onClick={handleConfirm} disabled={submitting || !cantidad || Number(cantidad) < 0}
          className="w-full py-3.5 rounded-xl text-[11px] font-black uppercase tracking-widest flex items-center justify-center gap-2 text-white transition-all disabled:opacity-40"
          style={{ background: 'linear-gradient(135deg, #10B981, #059669)', boxShadow: '0 4px 20px rgba(16,185,129,0.3)' }}>
          {submitting ? <Loader2 size={16} className="animate-spin" /> : <CheckCircle size={16} />}
          {submitting ? 'CONFIRMANDO...' : 'CONFIRMAR RECEPCION'}
        </button>
      </div>
    </div>
  )
}
