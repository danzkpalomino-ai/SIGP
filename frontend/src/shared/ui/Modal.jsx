import { useEffect } from 'react'
import { X } from 'lucide-react'
import Button from './Button'

export default function Modal({ open, onClose, title, children, actions, size = 'md' }) {
  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => { document.body.style.overflow = '' }
  }, [open])

  if (!open) return null

  const sizes = { sm: 'max-w-sm', md: 'max-w-lg', lg: 'max-w-3xl', xl: 'max-w-5xl' }

  return (
    <div className="fixed inset-0 glass-modal-overlay flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className={`glass-modal rounded-2xl w-full ${sizes[size]} max-h-[90vh] overflow-y-auto animate-slide-up`} onClick={e => e.stopPropagation()}>
        {(title || onClose) && (
          <div className="flex items-center justify-between p-5 border-b" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
            {title && <h3 className="text-sm font-black text-white uppercase tracking-wider">{title}</h3>}
            {onClose && (
              <button onClick={onClose} className="btn-relief p-1.5 rounded-lg"><X size={16} style={{ color: '#5A5A5A' }} /></button>
            )}
          </div>
        )}
        <div className="p-5">{children}</div>
        {actions && (
          <div className="flex items-center justify-end gap-2 p-5 border-t" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
            {actions}
          </div>
        )}
      </div>
    </div>
  )
}
