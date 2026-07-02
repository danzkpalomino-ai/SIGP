import { Package, Plus, Scan } from 'lucide-react'

export default function ProductDetail({ product, onAddToCart }) {
  if (!product) {
    return (
      <div className="flex-1 overflow-y-auto p-4">
        <div className="flex items-center gap-2 mb-3">
          <Package size={14} style={{ color: '#F56B13' }} />
          <span className="text-[10px] font-bold uppercase tracking-wider text-white">DETALLE DEL PRODUCTO</span>
        </div>
        <div className="flex flex-col items-center justify-center h-40 text-center">
          <Scan size={36} style={{ color: '#2A2A2E' }} className="mb-2" />
          <p className="text-[10px]" style={{ color: '#5A5A5A' }}>BUSCA O ESCANEA UN PRODUCTO</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex-1 overflow-y-auto p-4">
      <div className="flex items-center gap-2 mb-3">
        <Package size={14} style={{ color: '#F56B13' }} />
        <span className="text-[10px] font-bold uppercase tracking-wider text-white">DETALLE DEL PRODUCTO</span>
      </div>
      <div className="glass-card rounded-xl p-4 animate-slide-up">
        <div className="flex items-start gap-3 mb-3">
          <div className="w-14 h-14 rounded-xl flex items-center justify-center shrink-0" style={{ background: 'rgba(245,107,19,0.12)' }}>
            <Package size={24} style={{ color: '#F56B13' }} />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-black text-white">{product.descripcion}</p>
            <p className="text-[10px] font-mono mt-0.5" style={{ color: '#F56B13' }}>{product.codigo_pos || '—'}</p>
          </div>
        </div>
        <div className="space-y-2 text-[11px]">
          <div className="flex justify-between py-1.5 px-3 rounded-lg" style={{ background: 'rgba(255,255,255,0.03)' }}>
            <span style={{ color: '#5A5A5A' }}>MARCA</span>
            <span className="font-bold text-white">{product.marca || '—'}</span>
          </div>
          <div className="flex justify-between py-1.5 px-3 rounded-lg" style={{ background: 'rgba(255,255,255,0.03)' }}>
            <span style={{ color: '#5A5A5A' }}>CATEGORIA</span>
            <span className="font-bold text-white">{product.categoria || '—'}</span>
          </div>
          <div className="flex justify-between py-1.5 px-3 rounded-lg" style={{ background: 'rgba(255,255,255,0.03)' }}>
            <span style={{ color: '#5A5A5A' }}>STOCK</span>
            <span className={`font-bold ${product.stock_actual <= 0 ? 'text-[#EF4444]' : 'text-[#10B981]'}`}>{product.stock_actual ?? 0}</span>
          </div>
          <div className="flex justify-between py-2 px-3 rounded-lg" style={{ background: 'rgba(245,107,19,0.08)' }}>
            <span className="font-bold" style={{ color: '#5A5A5A' }}>PRECIO UNITARIO</span>
            <span className="text-base font-black" style={{ color: '#F56B13' }}>S/ {Number(product.precio_unitario).toFixed(2)}</span>
          </div>
        </div>
        <button onClick={() => onAddToCart(product)}
          className="btn-relief-accent w-full mt-3 py-2 rounded-lg text-[10px] font-bold uppercase tracking-wider flex items-center justify-center gap-1.5">
          <Plus size={14} /> AGREGAR AL CARRITO
        </button>
      </div>
    </div>
  )
}
