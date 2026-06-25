import { useState, useEffect, useRef } from 'react'
import { User, Lock, Eye, EyeOff, Loader2, LogIn, AlertTriangle, ShieldCheck, Building2, ChevronDown } from 'lucide-react'
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

/* ─── Login (estilo SICCE) ─── */
function AnimatedBg() {
  const canvasRef = useRef(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    let animId
    let particles = []
    let chartOffset = 0

    const resize = () => {
      canvas.width = window.innerWidth
      canvas.height = window.innerHeight
    }
    resize()
    window.addEventListener('resize', resize)

    class Particle {
      constructor() { this.reset() }
      reset() {
        this.x = Math.random() * canvas.width
        this.y = Math.random() * canvas.height
        this.size = Math.random() * 2.5 + 0.5
        this.speedX = (Math.random() - 0.5) * 0.4
        this.speedY = (Math.random() - 0.5) * 0.4
        this.opacity = Math.random() * 0.5 + 0.1
      }
      update() {
        this.x += this.speedX
        this.y += this.speedY
        if (this.x < 0 || this.x > canvas.width) this.reset()
        if (this.y < 0 || this.y > canvas.height) this.reset()
      }
      draw() {
        ctx.beginPath()
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2)
          ctx.fillStyle = `rgba(251, 191, 36, ${this.opacity})`
        ctx.fill()
      }
    }

    for (let i = 0; i < 80; i++) particles.push(new Particle())

    const drawZigzag = () => {
      ctx.beginPath()
          ctx.strokeStyle = 'rgba(217, 119, 6, 0.2)'
      ctx.lineWidth = 1.5
      let x = 0, y = canvas.height * 0.5
      ctx.moveTo(x, y)
      for (let i = 0; i < (canvas.width / 30); i++) {
        x += 30
        y += Math.sin((i + chartOffset) * 0.3) * 20
        ctx.lineTo(x, y)
      }
      ctx.stroke()
    }

    const drawArrow = () => {
      const baseX = canvas.width * 0.7
      const baseY = canvas.height * 0.25
      ctx.beginPath()
          ctx.strokeStyle = 'rgba(251, 191, 36, 0.3)'
      ctx.lineWidth = 2
      ctx.moveTo(baseX, baseY + 40)
      ctx.lineTo(baseX, baseY)
      ctx.lineTo(baseX + 10, baseY + 8)
      ctx.stroke()
      ctx.beginPath()
      ctx.moveTo(baseX, baseY)
      ctx.lineTo(baseX - 10, baseY + 8)
      ctx.stroke()
    }

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height)
      particles.forEach(p => { p.update(); p.draw() })
      drawZigzag()
      drawArrow()
      chartOffset += 0.008
      animId = requestAnimationFrame(animate)
    }
    animate()

    return () => {
      window.removeEventListener('resize', resize)
      cancelAnimationFrame(animId)
    }
  }, [])

  return <canvas ref={canvasRef} className="absolute inset-0 pointer-events-none" />
}

function LoginScreen({ onLogin }) {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      const res = await fetch(`${API}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.message || 'Error al iniciar sesión')

      sessionStorage.setItem('token', data.token)
      sessionStorage.setItem('user', JSON.stringify(data.user))

      const companiesRes = await fetch(`${API}/companies`, {
        headers: { Authorization: `Bearer ${data.token}` }
      })
      const companiesData = await companiesRes.json()
      let companies = companiesData.companies || companiesData || []
      if (!Array.isArray(companies)) companies = []

      let selected = companies.find(c => c._id === data.user.company_id) || companies[0] || null
      if (selected) sessionStorage.setItem('company', JSON.stringify(selected))

      onLogin(data.user, selected, companies)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden font-sans"
         style={{ background: 'linear-gradient(135deg, #0d0805 0%, #1a0f08 30%, #2a1a0e 60%, #0d0805 100%)' }}>
      <AnimatedBg />
      <div className="absolute top-[-15%] right-[-8%] w-[650px] h-[650px] rounded-full opacity-25 animate-pulse"
           style={{ background: 'radial-gradient(circle, rgba(251,146,60,0.3) 0%, transparent 70%)', animationDuration: '6s' }} />
      <div className="absolute bottom-[-18%] left-[-8%] w-[600px] h-[600px] rounded-full opacity-20"
           style={{ background: 'radial-gradient(circle, rgba(217,119,6,0.35) 0%, transparent 70%)' }} />
      <div className="absolute top-[30%] left-[55%] w-[350px] h-[350px] rounded-full opacity-10 animate-pulse"
           style={{ background: 'radial-gradient(circle, rgba(251,191,36,0.3) 0%, transparent 70%)', animationDuration: '8s' }} />
      <div className="absolute inset-0 opacity-[0.03]"
           style={{ backgroundImage: 'radial-gradient(rgba(255,255,255,0.8) 1px, transparent 1px)', backgroundSize: '45px 45px' }} />

      <div className="relative z-10 w-[95%] max-w-[1050px] flex rounded-3xl overflow-hidden shadow-[0_40px_100px_-20px_rgba(0,0,0,0.7)] border border-white/[0.07]"
           style={{ minHeight: '580px', backdropFilter: 'blur(2px)' }}>

        <div className="hidden md:block md:w-[45%] lg:w-[48%] relative bg-[#0d0805] overflow-hidden">
          <img src="/banner_sigp4.png" className="absolute inset-0 w-full h-full object-cover" alt="SIGP POS" />
          <div className="absolute inset-0 bg-gradient-to-t from-[#0d0805]/80 via-transparent to-[#0d0805]/20" />
          <div className="absolute inset-0 opacity-[0.08]"
               style={{ backgroundImage: 'radial-gradient(circle at 30% 50%, rgba(251,146,60,0.3) 0%, transparent 60%), radial-gradient(circle at 70% 80%, rgba(251,191,36,0.15) 0%, transparent 50%)' }} />
          <div className="absolute top-6 left-6">
            <div className="px-3 py-1 rounded-full bg-amber-600/90 backdrop-blur-sm text-white text-[9px] font-bold uppercase tracking-[0.15em] border border-amber-500/30">
              POS &bull; Live
            </div>
          </div>

        </div>

        <div className="w-full md:w-[55%] lg:w-[52%] bg-[#f5f4f0] flex flex-col justify-center px-8 sm:px-12 lg:px-14 py-10">
          <div className="mb-8">
            <div className="flex items-center gap-2 mb-1">
              <h1 className="text-2xl font-black tracking-tight text-[#1a1916]">SIGP</h1>
              <span className="text-[#d97706] text-2xl font-black italic">POS</span>
              <span className="px-1.5 py-0.5 bg-[#e8e6e1] text-[#6b6960] text-[8px] font-bold rounded uppercase tracking-tight border border-[#d8d6cf]">v2</span>
            </div>
            <p className="text-[10px] text-[#9e9c94] uppercase tracking-[0.2em] font-semibold">Sistema de Gesti&oacute;n de Puntos</p>
          </div>

          <div className="space-y-6">
            <div>
              <h2 className="text-xl font-bold text-[#1a1916] tracking-tight">Iniciar Sesi&oacute;n</h2>
              <p className="text-sm text-[#6b6960] mt-1">Ingrese sus credenciales de SICCE para continuar</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              {error && (
                <div className="p-3.5 rounded-xl flex items-start gap-3 border text-xs font-semibold bg-red-50/80 border-red-300 text-red-600">
                  <AlertTriangle size={16} className="mt-0.5 shrink-0" />
                  <p>{error}</p>
                </div>
              )}

              <div className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-[#6b6960] uppercase tracking-wider">Usuario</label>
                  <div className="relative group">
                    <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#9e9c94] group-focus-within:text-[#d97706] transition-colors">
                      <User size={18} />
                    </div>
                    <input
                      type="text"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      className="w-full bg-white border border-[#d8d6cf] rounded-xl pl-11 pr-4 py-3 text-sm outline-none focus:border-[#d97706] focus:ring-2 focus:ring-[#d97706]/10 transition-all text-[#1a1916] placeholder:text-[#9e9c94]"
                      placeholder="Nombre de usuario"
                      required
                      autoFocus
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-[#6b6960] uppercase tracking-wider">Contrase&ntilde;a</label>
                  <div className="relative group">
                    <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#9e9c94] group-focus-within:text-[#d97706] transition-colors">
                      <Lock size={18} />
                    </div>
                    <input
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full bg-white border border-[#d8d6cf] rounded-xl pl-11 pr-11 py-3 text-sm outline-none focus:border-[#d97706] focus:ring-2 focus:ring-[#d97706]/10 transition-all text-[#1a1916] placeholder:text-[#9e9c94]"
                      placeholder="••••••••"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#9e9c94] hover:text-[#d97706] transition-colors"
                    >
                      {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-[#1a1916] text-white font-bold py-3.5 rounded-xl hover:bg-[#33312b] hover:shadow-lg transition-all active:scale-[0.98] text-sm flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {loading ? <Loader2 className="animate-spin" size={18} /> : <LogIn size={18} />}
                {loading ? 'Ingresando...' : 'Acceder'}
              </button>
            </form>
          </div>

          <div className="mt-8 text-center">
            <p className="text-[9px] text-[#9e9c94] uppercase tracking-[0.25em] font-semibold">&copy; 2026 SIGP &bull; Complemento de SICCE ERP</p>
          </div>
        </div>
      </div>

      <div className="absolute bottom-5 text-center">
        <p className="text-[10px] text-white/20 font-medium tracking-widest uppercase">Acceso seguro &bull; Cifrado de extremo a extremo</p>
      </div>
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
          <button onClick={() => { sessionStorage.clear(); window.location.reload() }} className="mt-4 text-xs text-amber-600 underline">Cerrar sesión</button>
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
