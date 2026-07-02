import Modal from '../../shared/ui/Modal'
import Button from '../../shared/ui/Button'

export default function CheckoutModal({ open, onClose, onConfirm, cart, clienteNombre, clienteDni, tipoDocumento, loading }) {
  const subtotal = cart.reduce((acc, p) => acc + p.total_item, 0)
  const igv = subtotal * 0.18
  const total = subtotal + igv

  return (
    <Modal open={open} onClose={onClose} title={tipoDocumento === '01' ? 'GENERAR BOLETA' : 'GENERAR TICKET'} size="sm"
      actions={
        <div className="flex gap-2 w-full">
          <Button variant="outline" className="flex-1" onClick={onClose}>CANCELAR</Button>
          <Button variant="primary" className="flex-[2]" loading={loading} onClick={onConfirm}>
            {loading ? 'PROCESANDO...' : 'CONFIRMAR VENTA'}
          </Button>
        </div>
      }
    >
      <div className="space-y-3 text-sm">
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
          <span className="text-2xl font-black" style={{ color: '#F56B13' }}>S/ {total.toFixed(2)}</span>
        </div>
      </div>
    </Modal>
  )
}
