export default function Card({ children, className = '', hover = false, onClick, ...props }) {
  return (
    <div
      className={`glass-card rounded-xl ${hover ? 'cursor-pointer hover:border-[#F56B13] hover:shadow-lg' : ''} ${className}`}
      onClick={onClick}
      {...props}
    >
      {children}
    </div>
  )
}
