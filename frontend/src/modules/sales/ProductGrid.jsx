import { Package } from 'lucide-react'

export default function ProductGrid({ products, onSelectProduct, search }) {
  const filtered = products.filter(p =>
    !search || p.descripcion?.toLowerCase().includes(search.toLowerCase()) || p.codigo_pos?.toLowerCase().includes(search.toLowerCase())
  )

  if (filtered.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center">
        <Package size={44} style={{ color: '#2A2A2E' }} className="mb-3" />
        <p className="text-sm font-bold uppercase tracking-widest" style={{ color: '#5A5A5A' }}>SIN PRODUCTOS</p>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-2.5">
      {filtered.map(product => (
        <button
          key={product._id}
          onClick={() => onSelectProduct(product)}
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
  )
}
