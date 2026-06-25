export default function ErpCard({ children, className = '', ...props }) {
  return <div className={`erp-card ${className}`} {...props}>{children}</div>;
}
