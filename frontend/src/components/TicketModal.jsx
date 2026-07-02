import { useRef, useEffect, useState } from 'react'
import { X, Printer } from 'lucide-react'
import QRCode from 'qrcode'

export default function TicketModal({ sale, company, puntoVenta, onClose }) {
  const ticketRef = useRef(null)
  const [qrDataUrl, setQrDataUrl] = useState('')

  useEffect(() => {
    const qrText = [
      company?.name || 'SIGP',
      'RUC: ' + (company?.ruc || ''),
      'TICKET: ' + sale.serie + '-' + sale.numero,
      'TOTAL: S/ ' + Number(sale.total).toFixed(2),
      'FECHA: ' + sale.fecha_emision,
    ].join('\n')
    QRCode.toDataURL(qrText, { width: 120, margin: 1, color: { dark: '#000', light: '#fff' } })
      .then(url => setQrDataUrl(url))
      .catch(() => {})
  }, [sale])

  const handlePrint = () => {
    const win = window.open('', '_blank')
    if (!win) return
    const content = ticketRef.current?.innerHTML || ''
    win.document.write([
      '<html><head><title>Ticket</title>',
      '<style>',
      '@page { margin: 0; size: 80mm auto; }',
      'body { font-family: "Courier New", monospace; font-size: 11px; margin: 0; padding: 8px; width: 80mm; color: #000; background: #fff; }',
      'table { width: 100%; border-collapse: collapse; }',
      'td { padding: 2px 0; }',
      '.h { text-align: center; font-size: 15px; font-weight: bold; margin-bottom: 2px; }',
      '.s { text-align: center; font-size: 10px; color: #555; margin-bottom: 1px; }',
      '.lh { border-top: 1px dashed #000; margin: 6px 0; }',
      '.total { font-size: 16px; font-weight: bold; text-align: center; margin: 8px 0; }',
      '.ft { text-align: center; font-size: 9px; margin-top: 8px; }',
      '.qty { text-align: center; }',
      '.price { text-align: right; }',
      '.item-name { font-size: 10px; }',
      '.qr { text-align: center; margin: 8px 0; }',
      '.qr img { width: 100px; }',
      '</style></head>',
      '<body>' + content + '</body></html>'
    ].join('\n'))
    win.document.close()
    setTimeout(() => { win.print(); win.close() }, 300)
  }

  if (!sale) return null

  const items = sale.items || []
  const total = Number(sale.total) || 0
  const subtotal = Number(sale.subtotal) || total / 1.18
  const igv = Number(sale.igv) || total - subtotal
  const now = new Date().toLocaleString('es-PE')

  return (
    <div className="fixed inset-0 glass-modal-overlay flex items-center justify-center z-50" onClick={onClose}>
      <div className="glass-modal rounded-2xl max-w-sm w-full mx-4 animate-slide-up overflow-hidden" onClick={e => e.stopPropagation()}>
        <div className="p-4 flex justify-center" style={{ background: 'rgba(10,10,11,0.6)' }}>
          <div ref={ticketRef} className="bg-white text-black rounded-lg p-4" style={{ width: '300px', fontFamily: "'Courier New', monospace", fontSize: '11px' }}>
            <div style={{ textAlign: 'center', marginBottom: '8px' }}>
              <div style={{ fontSize: '16px', fontWeight: 'bold' }}>{company?.name || 'SIGP'}</div>
              <div style={{ fontSize: '10px', color: '#555' }}>{company?.ruc ? 'RUC: ' + company.ruc : ''}</div>
              <div style={{ fontSize: '10px', color: '#555' }}>PV: {puntoVenta || 'POS-SIGP'}</div>
              <div style={{ fontSize: '9px', color: '#888' }}>{now}</div>
            </div>
            <div className="lh" />
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '9px', fontWeight: 'bold', marginBottom: '4px' }}>
              <span style={{ flex: 1 }}>DESCRIPCION</span>
              <span style={{ width: '25px', textAlign: 'center' }}>CANT</span>
              <span style={{ width: '75px', textAlign: 'right' }}>TOTAL</span>
            </div>
            <div className="lh" />
            {items.map((it, i) => (
              <div key={i} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', marginBottom: '2px' }}>
                <span style={{ flex: 1 }}>{it.descripcion}</span>
                <span style={{ textAlign: 'center', width: '25px' }}>{it.cantidad}</span>
                <span style={{ textAlign: 'right', width: '75px' }}>S/ {Number(it.total_item).toFixed(2)}</span>
              </div>
            ))}
            <div className="lh" />
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px' }}>
              <span>SUBTOTAL</span><span>S/ {subtotal.toFixed(2)}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px' }}>
              <span>IGV (18%)</span><span>S/ {igv.toFixed(2)}</span>
            </div>
            <div style={{ borderTop: '1px solid #000', margin: '4px 0' }} />
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px', fontWeight: 'bold' }}>
              <span>TOTAL</span><span>S/ {total.toFixed(2)}</span>
            </div>
            <div className="lh" />
            <div className="qr">{qrDataUrl && <img src={qrDataUrl} alt="QR" />}</div>
            <div style={{ textAlign: 'center', fontSize: '9px', color: '#555' }}>
              <div>{sale.cliente_nombre ? 'CLIENTE: ' + sale.cliente_nombre : 'CLIENTE: PUBLICO GENERAL'}</div>
              <div style={{ marginTop: '4px', fontWeight: 'bold' }}>¡GRACIAS POR SU PREFERENCIA!</div>
            </div>
          </div>
        </div>

        <div className="p-4 flex gap-2">
          <button onClick={onClose} className="btn-relief-outline flex-1 py-2.5 rounded-lg text-[10px] font-bold uppercase tracking-wider flex items-center justify-center gap-1.5">
            <X size={13} /> CERRAR
          </button>
          <button onClick={handlePrint} className="btn-relief-accent flex-[2] py-2.5 rounded-lg text-[10px] font-bold uppercase tracking-wider flex items-center justify-center gap-1.5">
            <Printer size={13} /> IMPRIMIR TICKET
          </button>
        </div>
      </div>
    </div>
  )
}