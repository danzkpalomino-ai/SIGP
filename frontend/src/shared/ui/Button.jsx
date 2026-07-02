import { forwardRef } from 'react'

const variants = {
  primary: 'btn-relief-accent',
  secondary: 'btn-relief',
  outline: 'btn-relief-outline',
  danger: 'bg-gradient-to-b from-red-500 to-red-600 text-white shadow-md hover:shadow-lg active:shadow-sm border border-red-400/30'
}

const sizes = {
  sm: 'px-2 py-1 text-[9px] rounded-md',
  md: 'px-3 py-2 text-[10px] rounded-lg',
  lg: 'px-5 py-2.5 text-[11px] rounded-xl'
}

const Button = forwardRef(({ children, variant = 'primary', size = 'md', className = '', icon: Icon, loading, disabled, ...props }, ref) => {
  return (
    <button
      ref={ref}
      disabled={disabled || loading}
      className={`font-bold uppercase tracking-wider inline-flex items-center justify-center gap-1.5 transition-all disabled:opacity-40 disabled:cursor-not-allowed active:scale-[0.98] ${variants[variant]} ${sizes[size]} ${className}`}
      {...props}
    >
      {loading ? (
        <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
        </svg>
      ) : Icon ? <Icon size={size === 'sm' ? 12 : size === 'md' ? 14 : 16} /> : null}
      {children}
    </button>
  )
})

Button.displayName = 'Button'
export default Button
