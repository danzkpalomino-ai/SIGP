import { useRef, useEffect } from 'react'
import QRCode from 'qrcode'
import EAN13Canvas from './EAN13Canvas'

function getQRBaseUrl() {
  if (typeof window !== 'undefined') {
    return window.location.origin
  }
  return 'http://localhost:5174'
}

export default function BarcodeLabel({ product, size = 'small', companyId }) {
  const qrRef = useRef(null)
  const dim = size === 'large' ? 160 : 80

  useEffect(() => {
    if (qrRef.current && product?.codigo_barra) {
      const qrUrl = companyId
        ? `${getQRBaseUrl()}/r/${companyId}/${product.codigo_barra}`
        : product.codigo_barra
      QRCode.toCanvas(qrRef.current, qrUrl, {
        width: dim,
        margin: 1,
        color: { dark: '#000', light: '#FFF' }
      })
    }
  }, [product, dim, companyId])

  if (!product) return null

  if (size === 'large') {
    return (
      <div className="flex flex-col items-center p-4 rounded-xl" style={{ background: '#FFFFFF', border: '1px solid #2A2A2E' }}>
        <EAN13Canvas code={product.codigo_barra} width={320} height={120} />
        <p className="text-xs font-bold text-black mt-3 text-center">{product.descripcion}</p>
        <p className="text-[10px] text-gray-500 font-mono">{product.codigo_pos}</p>
        <p className="text-[9px] text-gray-400 font-mono">{product.codigo_barra}</p>
      </div>
    )
  }

  return (
    <div className="flex items-center gap-3 p-2 rounded-lg" style={{ background: '#1A1A1D' }}>
      <EAN13Canvas code={product.codigo_barra} width={140} height={50} />
      <canvas ref={qrRef} style={{ width: dim, height: dim }} />
      <div className="flex-1 min-w-0">
        <p className="text-[11px] font-bold text-white truncate">{product.descripcion}</p>
        <p className="text-[9px] text-gray-400 font-mono">{product.codigo_pos} · {product.codigo_barra}</p>
      </div>
    </div>
  )
}