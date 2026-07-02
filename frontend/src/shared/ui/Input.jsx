import { forwardRef } from 'react'

const Input = forwardRef(({ label, error, icon: Icon, className = '', uppercase = true, ...props }, ref) => {
  return (
    <div className="space-y-1">
      {label && (
        <label className="text-[9px] font-bold uppercase tracking-wider block" style={{ color: '#5A5A5A' }}>{label}</label>
      )}
      <div className="relative">
        {Icon && (
          <Icon size={14} className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: '#5A5A5A' }} />
        )}
        <input
          ref={ref}
          className={`glass-input w-full ${Icon ? 'pl-9' : 'px-3'} py-2 rounded-lg text-[13px] ${uppercase ? 'uppercase' : ''} ${className}`}
          {...props}
        />
      </div>
      {error && <p className="text-[10px] text-red-400 mt-0.5">{error}</p>}
    </div>
  )
})

Input.displayName = 'Input'
export default Input
