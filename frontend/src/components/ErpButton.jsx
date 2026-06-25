const variants = {
  primary: 'bg-[var(--erp-accent)] text-white hover:bg-[#333]',
  secondary: 'bg-white border border-[var(--erp-border)] text-[var(--erp-text)] hover:bg-[var(--erp-bg-muted)]',
  danger: 'bg-white border border-red-200 text-red-700 hover:bg-red-50',
};

export default function ErpButton({ children, variant = 'primary', className = '', ...props }) {
  return (
    <button className={`inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded text-[11px] font-medium transition-colors ${variants[variant]} ${className}`} {...props}>
      {children}
    </button>
  );
}
