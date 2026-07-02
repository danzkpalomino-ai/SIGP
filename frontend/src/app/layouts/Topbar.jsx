import { useEffect, useState } from 'react'
import { MapPin, Bell, LogOut, Building2, Clock } from 'lucide-react'
import { useAuthStore } from '../../app/store/authStore'
import { useUIStore } from '../../app/store/uiStore'

export default function Topbar() {
  const { user, company, puntoVenta, logout } = useAuthStore()
  const { notifications } = useUIStore()
  const [time, setTime] = useState(new Date())

  useEffect(() => {
    const id = setInterval(() => setTime(new Date()), 1000)
    return () => clearInterval(id)
  }, [])

  return (
    <header className="flex items-center justify-between px-5 py-2.5 shrink-0" style={{ background: '#0D0D0F', borderBottom: '1px solid #1E1E22' }}>
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg" style={{ background: 'rgba(245,107,19,0.12)' }}>
          <MapPin size={14} style={{ color: '#F56B13' }} />
          <div>
            <p className="text-[9px] font-bold uppercase tracking-wider" style={{ color: '#5A5A5A' }}>CAJA / PV</p>
            <p className="text-[13px] font-black tracking-tight" style={{ color: '#F56B13' }}>{puntoVenta || 'SIN PV'}</p>
          </div>
        </div>

        <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg" style={{ background: 'rgba(255,255,255,0.03)' }}>
          <Building2 size={14} style={{ color: '#5A5A5A' }} />
          <p className="text-[12px] font-bold text-white uppercase">{company?.name || 'SIN EMPRESA'}</p>
        </div>

        <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase" style={{ background: 'rgba(245,107,19,0.15)', color: '#F56B13' }}>
          {user?.role}
        </span>
      </div>

      <div className="flex items-center gap-4">
        <div className="flex items-center gap-1.5 text-[12px]" style={{ color: '#5A5A5A' }}>
          <Clock size={14} />
          {time.toLocaleTimeString('es-PE')}
        </div>

        <div className="relative">
          <button className="p-2 rounded-lg relative hover:bg-white/5 transition-all">
            <Bell size={16} style={{ color: '#5A5A5A' }} />
            {notifications.length > 0 && (
              <span className="absolute -top-0.5 -right-0.5 w-4 h-4 rounded-full bg-red-500 text-white text-[8px] font-bold flex items-center justify-center">
                {notifications.length}
              </span>
            )}
          </button>
        </div>

        <div className="flex items-center gap-2.5 px-3 py-1.5 rounded-lg" style={{ background: 'rgba(255,255,255,0.03)' }}>
          <div className="w-8 h-8 rounded-full flex items-center justify-center text-[11px] font-black text-white" style={{ background: 'linear-gradient(135deg, #F56B13, #C44D00)' }}>
            {user?.username?.[0]?.toUpperCase() || 'U'}
          </div>
          <div className="hidden sm:block">
            <p className="text-[12px] font-bold text-white leading-tight">{user?.username}</p>
            <p className="text-[9px] uppercase" style={{ color: '#5A5A5A' }}>{user?.role}</p>
          </div>
        </div>

        <button onClick={logout} className="p-2 rounded-lg hover:bg-white/5 transition-all" title="Cerrar sesion">
          <LogOut size={16} style={{ color: '#5A5A5A' }} />
        </button>
      </div>
    </header>
  )
}
