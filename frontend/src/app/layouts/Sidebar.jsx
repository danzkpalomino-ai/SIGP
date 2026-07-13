import { useLocation, useNavigate } from 'react-router-dom'
import { Package, Users, ShoppingCart, CreditCard, BarChart3, Truck, ClipboardList, ChevronDown, MapPin, Menu } from 'lucide-react'
import { useAuthStore } from '../../app/store/authStore'
import { useUIStore } from '../../app/store/uiStore'
import { useState } from 'react'

const NAV = [
  { id: 'ventas', label: 'Ventas', icon: ShoppingCart, path: '/ventas', children: [
    { id: 'ventas-pos', label: 'Punto de Venta', path: '/ventas' },
    { id: 'ventas-historial', label: 'Registro de Ventas', path: '/ventas/registro' },
  ]},
  { id: 'productos', label: 'Productos', icon: Package, path: '/productos' },
  { id: 'clientes', label: 'Clientes', icon: Users, path: '/clientes' },
  { id: 'proveedores', label: 'Proveedores', icon: Truck, path: '/proveedores' },
  { id: 'compras', label: 'Compras', icon: ClipboardList, path: '/compras' },
  { id: 'caja', label: 'Caja', icon: CreditCard, path: '/caja' },
  { id: 'reportes', label: 'Reportes', icon: BarChart3, path: '/reportes' },
]

export default function Sidebar() {
  const location = useLocation()
  const navigate = useNavigate()
  const { sidebarCollapsed, toggleSidebar } = useUIStore()
  const { user, puntoVenta } = useAuthStore()
  const [expandedItems, setExpandedItems] = useState(['ventas'])

  const isActive = (path) => location.pathname === path
  const collapsed = sidebarCollapsed

  const toggleExpand = (id) => {
    setExpandedItems(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id])
  }

  return (
    <aside
      className={`flex flex-col shrink-0 border-r transition-all duration-300 ${collapsed ? 'w-[60px]' : 'w-[285px]'}`}
      style={{ background: '#111113', borderColor: '#2A2A2E' }}
    >
      {/* Logo SIGP */}
      <div className="px-3 py-4 border-b flex items-center justify-center" style={{ borderColor: '#2A2A2E' }}>
        <img src="/logosigp.PNG" alt="SIGP" className="w-full h-auto object-contain" />
      </div>

      {!collapsed && puntoVenta && (
        <div className="mx-3 mt-3 px-3 py-1.5 rounded flex items-center gap-1.5" style={{ background: '#1A1A1D' }}>
          <MapPin size={12} style={{ color: '#F56B13' }} />
          <span className="text-[9px] font-bold truncate" style={{ color: '#F56B13' }}>{puntoVenta}</span>
        </div>
      )}

      {/* Hamburger menu */}
      <button
        onClick={toggleSidebar}
        className="mx-3 mt-3 p-2 rounded-lg transition-all hover:bg-white/5"
        style={{ color: '#5A5A5A' }}
        title={collapsed ? 'Expandir' : 'Colapsar'}
      >
        <Menu size={18} />
      </button>

      {/* Navigation */}
      <nav className="flex-1 py-3 px-3 space-y-1 overflow-y-auto">
        {NAV.map(item => {
          const Icon = item.icon
          const active = item.children ? item.children.some(c => isActive(c.path)) : isActive(item.path)
          const expanded = expandedItems.includes(item.id)
          return (
            <div key={item.id}>
              <button
                onClick={() => {
                  if (item.children) { toggleExpand(item.id); if (!collapsed) return; }
                  navigate(item.path)
                }}
                className={`w-full flex items-center gap-3 px-3 py-3 rounded-lg text-left transition-all text-[12px] font-bold uppercase tracking-wider ${
                  collapsed ? 'justify-center px-0' : ''
                }`}
                style={{
                  background: active ? '#2D2015' : 'transparent',
                  color: active ? '#F56B13' : '#8A8A8A'
                }}
                title={collapsed ? item.label : undefined}
                onMouseEnter={e => {
                  if (!active) { e.currentTarget.style.background = 'rgba(255,255,255,0.05)'; e.currentTarget.style.color = '#FFFFFF' }
                }}
                onMouseLeave={e => {
                  if (!active) { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#8A8A8A' }
                }}
              >
                <Icon size={collapsed ? 20 : 16} />
                {!collapsed && (
                  <>
                    <span className="flex-1">{item.label}</span>
                    {item.children && <ChevronDown size={12} className={`transition-transform ${expanded ? 'rotate-0' : '-rotate-90'}`} />}
                  </>
                )}
              </button>
              {!collapsed && item.children && expanded && (
                <div className="ml-7 mt-1 space-y-0.5">
                  {item.children.map(child => (
                    <button
                      key={child.id}
                      onClick={() => navigate(child.path)}
                      className="w-full flex items-center px-3 py-2.5 rounded-lg text-left transition-all text-[11px] font-bold tracking-wider"
                      style={{
                        background: isActive(child.path) ? '#2D2015' : 'transparent',
                        color: isActive(child.path) ? '#F56B13' : '#6A6A6A'
                      }}
                      onMouseEnter={e => {
                        if (!isActive(child.path)) { e.currentTarget.style.background = 'rgba(255,255,255,0.03)'; e.currentTarget.style.color = '#CCC' }
                      }}
                      onMouseLeave={e => {
                        if (!isActive(child.path)) { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#6A6A6A' }
                      }}
                    >
                      {child.label}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )
        })}
      </nav>


      {/* SICCE Connection */}
      {!collapsed && (
        <div className="px-3 py-4 border-t flex flex-col items-center gap-2 w-full" style={{ borderColor: '#2A2A2E' }}>
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full" style={{ background: '#10B981' }} />
            <span className="text-[11px] font-bold" style={{ color: '#5A5A5A' }}>Conectado con</span>
          </div>
          <img src="/logosicce.PNG" alt="SICCE ERP" className="w-[190px] h-auto object-contain mx-auto" />
          <span className="text-[7px] font-bold uppercase tracking-wider" style={{ color: '#3A3A3E' }}>ERP System</span>
        </div>
      )}
    </aside>
  )
}
