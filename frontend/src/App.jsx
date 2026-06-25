import { useState, useEffect } from 'react'
import { Building2, ChevronDown } from 'lucide-react'
import PosView from './features/pos/PosView'
import PurchasesView from './features/purchases/PurchasesView'

const API = 'http://localhost:3005/api'

export default function App() {
  const [view, setView] = useState('pos')
  const [user, setUser] = useState(null)
  const [company, setCompany] = useState(null)
  const [companies, setCompanies] = useState([])
  const [showCompanySelector, setShowCompanySelector] = useState(false)

  // Restaurar sesión
  useEffect(() => {
    const storedUser = sessionStorage.getItem('user')
    const storedToken = sessionStorage.getItem('token')
    const storedCompany = sessionStorage.getItem('company')
    if (storedUser && storedToken) {
      try {
        setUser(JSON.parse(storedUser))
        if (storedCompany) setCompany(JSON.parse(storedCompany))
      } catch {}
    }
  }, [])

  const isCajero = user?.role === 'CAJERO'

  const handleLogout = () => {
    sessionStorage.clear()
    setUser(null)
    setCompany(null)
    setCompanies([])
  }

  const handleLogin = (u, c, list) => {
    setUser(u)
    setCompany(c)
    setCompanies(list || [])
  }

  const handleSelectCompany = (c) => {
    sessionStorage.setItem('company', JSON.stringify(c))
    setCompany(c)
    setShowCompanySelector(false)
  }

  const navigate = (v) => {
    if (v === 'purchases' && isCajero) return
    setView(v)
  }

  if (!user) {
    return <LoginScreen onLogin={handleLogin} />
  }

  if (!company) {
    return <CompanySelectorScreen companies={companies} onSelect={handleSelectCompany} />
  }

  if (view === 'pos') {
    return (
      <PosView
        company={company}
        user={user}
        companies={companies}
        onLogout={handleLogout}
        onNavigate={navigate}
        onSwitchCompany={() => setShowCompanySelector(true)}
      />
    )
  }

  if (view === 'purchases' && !isCajero) {
    return (
      <PurchasesView
        company={company}
        user={user}
        onBack={() => setView('pos')}
      />
    )
  }

  return null
}

/* ─── Login ─── */
function LoginScreen({ onLogin }) {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      // 1. Login
      const res = await fetch(`${API}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.message || 'Error al iniciar sesión')

      sessionStorage.setItem('token', data.token)
      sessionStorage.setItem('user', JSON.stringify(data.user))

      // 2. Obtener empresas del usuario
      const companiesRes = await fetch(`${API}/companies`, {
        headers: { Authorization: `Bearer ${data.token}` }
      })
      const companiesData = await companiesRes.json()
      let companies = companiesData.companies || companiesData || []

      // Si no es array, convertir
      if (!Array.isArray(companies)) companies = []

      // Si hay empresa asociada al usuario, preferirla
      let selected = companies.find(c => c._id === data.user.company_id) || companies[0] || null

      if (selected) {
        sessionStorage.setItem('company', JSON.stringify(selected))
      }

      onLogin(data.user, selected, companies)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#f5efe6]">
      <form onSubmit={handleSubmit} className="w-full max-w-sm bg-white rounded-2xl shadow-xl p-8 space-y-6">
        <div className="text-center">
          <div className="w-16 h-16 rounded-2xl bg-[#e8dfd2] flex items-center justify-center mx-auto mb-4">
            <span className="text-2xl font-black text-[#1a1916]">SIGP</span>
          </div>
          <h1 className="text-lg font-black text-[#1a1916] uppercase tracking-wider">SIGP</h1>
          <p className="text-[11px] text-[#6b6960] mt-1">Sistema de Gestión de Puntos</p>
          <p className="text-[10px] text-[#9e9c94] mt-1">Usa tus credenciales de SICCE</p>
        </div>
        {error && <p className="text-[11px] text-red-600 font-medium text-center">{error}</p>}
        <div className="space-y-3">
          <input
            className="w-full px-4 py-3 bg-white border border-[#d8d6cf] rounded-xl text-sm font-medium outline-none focus:border-[#1a1916] transition-colors"
            placeholder="Usuario"
            value={username}
            onChange={e => setUsername(e.target.value)}
            autoFocus
          />
          <input
            className="w-full px-4 py-3 bg-white border border-[#d8d6cf] rounded-xl text-sm font-medium outline-none focus:border-[#1a1916] transition-colors"
            type="password"
            placeholder="Contraseña"
            value={password}
            onChange={e => setPassword(e.target.value)}
          />
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-[#1a1916] text-white rounded-xl text-sm font-bold uppercase tracking-wider hover:bg-black transition-colors disabled:opacity-50"
          >
            {loading ? 'Ingresando...' : 'Ingresar'}
          </button>
        </div>
        <p className="text-[9px] text-[#9e9c94] text-center">Requiere backend SICCE (puerto 3005)</p>
      </form>
    </div>
  )
}

/* ─── Selector de empresa ─── */
function CompanySelectorScreen({ companies, onSelect }) {
  if (companies.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f5efe6]">
        <div className="text-center">
          <p className="text-sm font-bold text-[#9e9c94]">No tienes empresas asignadas</p>
          <button onClick={() => { sessionStorage.clear(); window.location.reload() }} className="mt-4 text-xs text-blue-600 underline">Cerrar sesión</button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#f5efe6] p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-2xl bg-[#e8dfd2] flex items-center justify-center mx-auto mb-4">
            <Building2 size={28} className="text-[#1a1916]" />
          </div>
          <h1 className="text-lg font-black text-[#1a1916] uppercase tracking-wider">Seleccionar Empresa</h1>
          <p className="text-[11px] text-[#6b6960] mt-1">Elige la empresa para trabajar en SIGP</p>
        </div>
        <div className="space-y-2">
          {companies.map(c => (
            <button
              key={c._id}
              onClick={() => onSelect(c)}
              className="w-full p-4 bg-white rounded-xl border border-[#d8d6cf] hover:border-[#1a1916] transition-all text-left flex items-center gap-4 group"
            >
              <div className="w-12 h-12 rounded-xl bg-[#f5efe6] flex items-center justify-center group-hover:bg-[#e8dfd2] transition-colors">
                <Building2 size={22} className="text-[#6b6960]" />
              </div>
              <div>
                <p className="text-sm font-bold text-[#1a1916]">{c.name || c.razon_social || 'Empresa'}</p>
                <p className="text-[10px] font-mono text-[#9e9c94]">{c.ruc || c.documento || '—'}</p>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
