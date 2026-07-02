import { Outlet } from 'react-router-dom'
import Sidebar from './Sidebar'
import Topbar from './Topbar'
import { useAuthStore } from '../../app/store/authStore'

export default function MainLayout() {
  const { user, company, puntoVenta } = useAuthStore()

  if (!user || !company || !puntoVenta) return null

  return (
    <div className="h-screen flex" style={{ background: '#0A0A0B' }}>
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <Topbar />
        <main className="flex-1 overflow-hidden">
          <Outlet />
        </main>
        {/* System status footer */}
        <div className="shrink-0 px-4 py-1.5 flex items-center gap-4 text-[8px] border-t" style={{ background: '#0D0D0F', borderColor: '#1E1E22' }}>
          <span style={{ color: '#3A3A3E' }}>© 2025 SIGP v2 - Todos los derechos reservados</span>
          <span className="flex-1" />
          <span className="flex items-center gap-1.5" style={{ color: '#5A5A5A' }}>
            <span className="w-1.5 h-1.5 rounded-full" style={{ background: '#10B981' }} />
            Sistema sincronizado con SICCE ERP
          </span>
          <span className="flex-1" />
          <span style={{ color: '#3A3A3E' }}>Version: 2.0.0</span>
        </div>
      </div>
    </div>
  )
}
