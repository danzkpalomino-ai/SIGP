export default function ErpPageHeader({ icon: Icon, eyebrow, title, description, children }) {
  return (
    <div className="mb-5 flex flex-col lg:flex-row lg:items-start justify-between gap-4 pb-4 border-b border-[var(--erp-border)]">
      <div>
        {eyebrow && (
          <div className="flex items-center gap-2 text-[#4b5563] mb-1">
            {Icon && <Icon size={14} />}
            <span className="text-[10px] font-semibold uppercase tracking-wide">{eyebrow}</span>
          </div>
        )}
        <h1 className="text-xl font-semibold text-[var(--erp-text)] tracking-tight">{title}</h1>
        {description && <p className="text-[12px] text-[var(--erp-text-muted)] mt-1 max-w-lg">{description}</p>}
      </div>
      {children && <div className="shrink-0 flex flex-wrap gap-2">{children}</div>}
    </div>
  );
}
