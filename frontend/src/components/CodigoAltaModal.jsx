import { useState, useRef, useCallback } from 'react'
import { jsPDF } from 'jspdf'
import QRCode from 'qrcode'
import { X, FileText, Loader2 } from 'lucide-react'

function generateEAN13Canvas(code) {
  const A = ['0001101','0011001','0010011','0111101','0100011','0110001','0101111','0111011','0110111','0001011']
  const B = ['0100111','0110011','0011011','0100001','0011101','0111001','0000101','0010001','0001001','0010111']
  const C = ['1110010','1100110','1101100','1000010','1011100','1001110','1010000','1000100','1001000','1110100']
  const PARITY = ['AAAAAA','AABABB','AABBAB','AABBBA','ABAABB','ABBAAB','ABBBAA','ABABAB','ABABBA','ABBABA']

  const digits = code.split('').map(Number)
  const left = digits.slice(1, 7)
  const right = digits.slice(7, 13)
  const parity = PARITY[digits[0]]

  let p = '101'
  left.forEach((d, i) => { p += parity[i] === 'A' ? A[d] : B[d] })
  p += '01010'
  right.forEach(d => { p += C[d] })
  p += '101'

  const w = 200, h = 70
  const c = document.createElement('canvas')
  c.width = w * 2; c.height = h * 2
  const ctx = c.getContext('2d')
  ctx.scale(2, 2)

  ctx.fillStyle = '#FFFFFF'
  ctx.fillRect(0, 0, w, h)
  ctx.fillStyle = '#000000'

  const m = 8, dw = w - m * 2, mw = dw / p.length, bh = h - 18

  for (let i = 0; i < p.length; i++) {
    if (p[i] === '1') {
      ctx.fillRect(m + i * mw, 0, Math.ceil(mw), bh)
    }
  }

  ctx.font = '10px monospace'
  ctx.textAlign = 'center'
  ctx.fillText(code[0], m - 3, bh + 14)
  ctx.fillText(code.slice(1, 7), m + (dw - 10) / 4 + 5, bh + 14)
  ctx.fillText(code.slice(7), m + (dw - 10) / 2 + (dw - 10) / 4 + 5, bh + 14)

  return c.toDataURL('image/png')
}

async function generateQRCanvas(code) {
  const c = document.createElement('canvas')
  await QRCode.toCanvas(c, code, { width: 100, margin: 1, color: { dark: '#000', light: '#FFF' } })
  return c.toDataURL('image/png')
}

function getQRBaseUrl() {
  if (typeof window !== 'undefined') {
    return window.location.origin
  }
  return 'http://localhost:5174'
}

export default function CodigoAltaModal({ products, company, onClose }) {
  const [generating, setGenerating] = useState(false)

  const generatePDF = useCallback(async () => {
    setGenerating(true)
    try {
      const pdf = new jsPDF('p', 'mm', 'a4')
      const pw = 210, ph = 297
      const cols = 2, rows = 4
      const ml = 10, mt = 10
      const cw = (pw - ml * 2) / cols
      const ch = (ph - mt * 2) / rows

      for (let batch = 0; batch < products.length; batch += cols * rows) {
        if (batch > 0) pdf.addPage()
        const pageProducts = products.slice(batch, batch + cols * rows)

        for (let i = 0; i < pageProducts.length; i++) {
          const p = pageProducts[i]
          const col = i % cols
          const row = Math.floor(i / cols)
          const x = ml + col * cw
          const y = mt + row * ch

          if (p.codigo_barra) {
            const barcodeDataUrl = generateEAN13Canvas(p.codigo_barra)
            pdf.addImage(barcodeDataUrl, 'PNG', x + 2, y + 2, cw - 4, 22)
          }

          const qrUrl = `${getQRBaseUrl()}/r/${company?._id || 'unknown'}/${p.codigo_barra || p.codigo_pos || p._id}`
          const qrDataUrl = await generateQRCanvas(qrUrl)
          pdf.addImage(qrDataUrl, 'PNG', x + 4, y + 26, 18, 18)

          pdf.setFontSize(7)
          pdf.setFont('Helvetica', 'bold')
          pdf.text(p.descripcion?.slice(0, 40) || '', x + 25, y + 32, { maxWidth: cw - 30 })

          pdf.setFontSize(5)
          pdf.setFont('Helvetica', 'normal')
          pdf.text(`SKU: ${p.codigo_pos || '—'}`, x + 25, y + 38)
          pdf.text(`EAN: ${p.codigo_barra || '—'}`, x + 25, y + 43)
          pdf.setFont('Helvetica', 'bold')
          pdf.text(`S/ ${Number(p.precio_unitario).toFixed(2)}`, x + 25, y + 49)
        }
      }

      pdf.save('codigos_productos.pdf')
    } catch (err) {
      alert('Error al generar PDF: ' + err.message)
    } finally {
      setGenerating(false)
    }
  }, [products])

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50" onClick={onClose}>
      <div className="rounded-2xl p-6 max-w-sm w-full mx-4 animate-slide-up" style={{ background: '#1A1A1E', border: '1px solid #2D2D34' }} onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-black text-white">Dar alta codigos</h3>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-white/5"><X size={16} className="text-[#9E9E9E]" /></button>
        </div>

        <div className="p-4 rounded-xl mb-4" style={{ background: '#0D0D0F' }}>
          <p className="text-xs text-[#9E9E9E]">
            Se generara un PDF en formato A4 con <span className="font-bold text-white">{products.length}</span> etiquetas organizadas en {Math.ceil(products.length / 8)} pagina(s).
          </p>
          <p className="text-[10px] text-[#9E9E9E] mt-2">
            Cada etiqueta incluye: codigo de barras EAN-13, codigo QR, nombre, SKU y precio.
          </p>
        </div>

        <button
          onClick={generatePDF}
          disabled={generating || products.length === 0}
          className="w-full py-3 rounded-xl text-white text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 disabled:opacity-50 transition-all"
          style={{ background: 'linear-gradient(135deg, #F56B13, #C44D00)' }}
        >
          {generating ? <Loader2 size={16} className="animate-spin" /> : <FileText size={16} />}
          {generating ? 'Generando PDF...' : 'Generar PDF de codigos'}
        </button>
      </div>
    </div>
  )
}