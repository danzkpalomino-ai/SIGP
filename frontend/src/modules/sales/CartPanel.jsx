import { ShoppingCart, X, Plus, Minus, Trash2, Printer, FileText } from 'lucide-react'

export default function CartPanel({ cart, onUpdateQty, onRemove, onClear, onCheckout, loading }) {
  const subtotal = cart.reduce((acc, p) => acc + p.total_item, 0)
  const igv = subtotal * 0.18
  const total = subtotal + igv

  return (
    <div className="glass-strong col-span-full" style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
      <div className="grid" style={{ gridTemplateColumns: '1fr 320px' }}>
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
                    <button onClick={() => onRemove(item._id)} className="p-0.5 rounded hover:bg-red-500/10 shrink-0 ml-1" style={{ color: '#5A5A5A' }}>
                      <X size={10} />
                    </button>
                  </div>
                  <p className="text-[8px] font-mono mb-1" style={{ color: '#5A5A5A' }}>{item.codigo_pos || '—'} · S/ {Number(item.precio_unitario).toFixed(2)}</p>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1">
                      <button onClick={() => onUpdateQty(item._id, -1)} className="btn-relief w-5 h-5 rounded flex items-center justify-center">
                        <Minus size={9} className="text-white" />
                      </button>
                      <span className="w-5 text-center text-[11px] font-bold text-white">{item.cantidad}</span>
                      <button onClick={() => onUpdateQty(item._id, 1)} className="btn-relief w-5 h-5 rounded flex items-center justify-center">
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

        <div className="p-3 flex items-center gap-3">
          <div className="flex-1 text-right">
            <div className="flex justify-between text-[9px]"><span style={{ color: '#5A5A5A' }}>SUBTOTAL</span><span className="text-white">S/ {subtotal.toFixed(2)}</span></div>
            <div className="flex justify-between text-[9px]"><span style={{ color: '#5A5A5A' }}>IGV 18%</span><span className="text-white">S/ {igv.toFixed(2)}</span></div>
            <div className="flex justify-between text-sm mt-1 pt-1" style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
              <span className="font-black text-white">TOTAL</span>
              <span className="font-black" style={{ color: '#F56B13' }}>S/ {total.toFixed(2)}</span>
            </div>
          </div>
          <div className="flex gap-1.5">
            <button onClick={onClear} disabled={cart.length === 0} className="btn-relief-outline px-3 py-2 rounded-lg text-[9px] font-bold uppercase tracking-wider disabled:opacity-30">
              <Trash2 size={12} />
            </button>
            <button onClick={() => onCheckout?.('03')} disabled={cart.length === 0 || loading}
              className="btn-relief-accent px-4 py-2 rounded-lg text-[9px] font-bold uppercase tracking-wider disabled:opacity-40 flex items-center gap-1.5">
              <Printer size={12} /> TICKET
            </button>
            <button onClick={() => onCheckout?.('01')} disabled={cart.length === 0 || loading}
              className="btn-relief-accent px-4 py-2 rounded-lg text-[9px] font-bold uppercase tracking-wider disabled:opacity-40 flex items-center gap-1.5"
              style={{ background: 'linear-gradient(180deg, #10B981, #059669)' }}>
              <FileText size={12} /> BOLETA
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
