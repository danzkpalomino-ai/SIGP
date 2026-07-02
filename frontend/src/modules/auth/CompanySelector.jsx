import { useNavigate } from 'react-router-dom'
import { Building2 } from 'lucide-react'
import { useAuthStore } from '../../app/store/authStore'

export default function CompanySelector() {
  const navigate = useNavigate()
  const { companies, setCompany, logout } = useAuthStore()

  if (companies.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: '#0A0A0B' }}>
        <div className="text-center">
          <p className="text-[11px] font-bold" style={{ color: '#5A5A5A' }}>No tienes empresas asignadas</p>
          <button onClick={() => { logout(); navigate('/login') }} className="mt-3 text-[10px] underline" style={{ color: '#F56B13' }}>Cerrar sesion</button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4" style={{ background: '#0A0A0B' }}>
      <div className="w-full max-w-sm">
        <div className="text-center mb-6">
          <div className="w-14 h-14 rounded-xl flex items-center justify-center mx-auto mb-3" style={{ background: 'linear-gradient(135deg, #F56B13, #C44D00)' }}>
            <Building2 size={24} className="text-white" />
          </div>
          <h1 className="text-base font-black text-white uppercase tracking-wider">Seleccionar Empresa</h1>
          <p className="text-[10px] mt-1" style={{ color: '#5A5A5A' }}>Elige la empresa para trabajar</p>
        </div>
        <div className="space-y-1.5">
          {companies.map(c => (
            <button key={c._id} onClick={() => { setCompany(c); navigate('/select-pv') }}
              className="w-full p-3 rounded-xl border transition-all text-left flex items-center gap-3 hover:border-[#F56B13]" style={{ background: '#121214', borderColor: '#2A2A2E' }}>
              <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ background: '#1A1A1D' }}>
                <Building2 size={18} style={{ color: '#5A5A5A' }} />
              </div>
              <div>
                <p className="text-[12px] font-bold text-white">{c.name || c.razon_social || 'Empresa'}</p>
                <p className="text-[9px] font-mono" style={{ color: '#5A5A5A' }}>{c.ruc || c.documento || '—'}</p>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
