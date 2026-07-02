import { useState, useRef, useEffect } from 'react'
import { User, Lock, Eye, EyeOff, Loader2, LogIn, AlertTriangle, Building2 } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '../../app/store/authStore'
import api from '../../services/api'

function AnimatedBg() {
  const ref = useRef(null)
  useEffect(() => {
    const c = ref.current; if (!c) return
    const ctx = c.getContext('2d')
    let id, ps = [], o = 0
    const r = () => { c.width = window.innerWidth; c.height = window.innerHeight }
    r(); window.addEventListener('resize', r)
    class P {
      constructor() { this.reset() }
      reset() { this.x = Math.random()*c.width; this.y = Math.random()*c.height; this.s = Math.random()*2+0.5; this.dx = (Math.random()-0.5)*0.3; this.dy = (Math.random()-0.5)*0.3; this.o = Math.random()*0.4+0.1 }
      u() { this.x+=this.dx; this.y+=this.dy; if(this.x<0||this.x>c.width)this.reset(); if(this.y<0||this.y>c.height)this.reset() }
      d() { ctx.beginPath(); ctx.arc(this.x,this.y,this.s,0,Math.PI*2); ctx.fillStyle=`rgba(245,107,19,${this.o})`; ctx.fill() }
    }
    for(let i=0;i<60;i++)ps.push(new P())
    const a=()=>{ctx.clearRect(0,0,c.width,c.height);ps.forEach(p=>{p.u();p.d()});ctx.beginPath();ctx.strokeStyle='rgba(245,107,19,0.08)';ctx.lineWidth=1;let x=0,y=c.height*0.5;ctx.moveTo(x,y);for(let i=0;i<c.width/25;i++){x+=25;y+=Math.sin((i+o)*0.3)*15;ctx.lineTo(x,y)}ctx.stroke();o+=0.008;id=requestAnimationFrame(a)};a()
    return()=>{window.removeEventListener('resize',r);cancelAnimationFrame(id)}
  },[])
  return <canvas ref={ref} className="absolute inset-0 pointer-events-none"/>
}

export default function LoginModule() {
  const navigate = useNavigate()
  const { login } = useAuthStore()
  const [u, setU] = useState('')
  const [p, setP] = useState('')
  const [sp, setSp] = useState(false)
  const [err, setErr] = useState('')
  const [ld, setLd] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLd(true); setErr('')
    try {
      const r = await api.post('/auth/login', { username: u, password: p })
      const d = r.data
      login(d.user, d.token, [])

      const cr = await api.get('/companies')
      const cd = cr.data
      const list = Array.isArray(cd) ? cd : Array.isArray(cd.companies) ? cd.companies : []
      login(d.user, d.token, list)

      if (list.length === 0) {
        navigate('/select-company')
      } else if (list.length === 1) {
        const { setCompany } = useAuthStore.getState()
        setCompany(list[0])
        navigate('/select-pv')
      } else {
        navigate('/select-company')
      }
    } catch (e) {
      setErr(e.response?.data?.message || e.message)
    } finally { setLd(false) }
  }

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden" style={{ background: '#0A0A0B' }}>
      <AnimatedBg />
      <div className="absolute top-[-15%] right-[-8%] w-[600px] h-[600px] rounded-full opacity-10 animate-pulse" style={{ background: 'radial-gradient(circle,rgba(245,107,19,0.2) 0%,transparent 70%)', animationDuration: '6s' }} />
      <div className="absolute bottom-[-15%] left-[-8%] w-[500px] h-[500px] rounded-full opacity-8" style={{ background: 'radial-gradient(circle,rgba(196,77,0,0.2) 0%,transparent 70%)' }} />
      <div className="relative z-10 w-[95%] max-w-[880px] flex rounded-2xl overflow-hidden border border-white/5 shadow-[0_40px_100px_-20px_rgba(0,0,0,0.8)]" style={{ minHeight: '460px' }}>
        <div className="hidden md:flex md:w-[42%] relative overflow-hidden" style={{ background: '#0A0A0B' }}>
          <img src="/banner_sigp4.png" className="absolute inset-0 w-full h-full object-cover" alt="SIGP" />
          <div className="absolute inset-0 bg-gradient-to-t from-[#0A0A0B]/80 via-transparent to-[#0A0A0B]/20" />
          <div className="absolute top-5 left-5"><div className="px-2.5 py-1 rounded-full text-white text-[8px] font-bold uppercase tracking-widest" style={{ background: 'rgba(245,107,19,0.9)' }}>POS &bull; Live</div></div>
        </div>
        <div className="w-full md:w-[58%] flex flex-col justify-center px-8 sm:px-10 py-8" style={{ background: '#121214' }}>
          <div className="mb-6">
            <div className="flex items-center gap-2 mb-1">
              <h1 className="text-xl font-black text-white">SIGP</h1>
              <span className="text-xl font-black italic" style={{ color: '#F56B13' }}>POS</span>
              <span className="px-1.5 py-0.5 text-[7px] font-bold rounded uppercase" style={{ background: '#1A1A1D', color: '#5A5A5A' }}>v2</span>
            </div>
            <p className="text-[9px] uppercase tracking-[0.2em] font-semibold" style={{ color: '#5A5A5A' }}>Sistema de Gestion de Puntos</p>
          </div>
          <div>
            <h2 className="text-lg font-bold text-white mb-1">Iniciar Sesion</h2>
            <p className="text-[11px] mb-5" style={{ color: '#5A5A5A' }}>Ingrese sus credenciales para continuar</p>
            <form onSubmit={handleSubmit} className="space-y-4">
              {err && (
                <div className="p-2.5 rounded-lg flex items-start gap-2 text-[11px] font-semibold" style={{ background: 'rgba(239,68,68,0.1)', color: '#EF4444' }}>
                  <AlertTriangle size={13} className="mt-0.5 shrink-0" /><p>{err}</p>
                </div>
              )}
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold uppercase tracking-wider" style={{ color: '#8A8A8A' }}>Usuario</label>
                <div className="relative">
                  <User size={15} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: '#5A5A5A' }} />
                  <input type="text" value={u} onChange={e => setU(e.target.value)} className="w-full rounded-lg pl-9 pr-3 py-2.5 text-[13px] outline-none transition-all" style={{ background: '#1A1A1D', border: '1px solid #2A2A2E', color: '#E0E0E0' }} placeholder="Nombre de usuario" required autoFocus
                    onFocus={e => e.target.style.borderColor = '#F56B13'} onBlur={e => e.target.style.borderColor = '#2A2A2E'} />
                </div>
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold uppercase tracking-wider" style={{ color: '#8A8A8A' }}>Contrasena</label>
                <div className="relative">
                  <Lock size={15} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: '#5A5A5A' }} />
                  <input type={sp ? 'text' : 'password'} value={p} onChange={e => setP(e.target.value)} className="w-full rounded-lg pl-9 pr-9 py-2.5 text-[13px] outline-none transition-all" style={{ background: '#1A1A1D', border: '1px solid #2A2A2E', color: '#E0E0E0' }} placeholder="••••••••" required
                    onFocus={e => e.target.style.borderColor = '#F56B13'} onBlur={e => e.target.style.borderColor = '#2A2A2E'} />
                  <button type="button" onClick={() => setSp(!sp)} className="absolute right-3 top-1/2 -translate-y-1/2 transition-colors" style={{ color: '#5A5A5A' }}>{sp ? <EyeOff size={15} /> : <Eye size={15} />}</button>
                </div>
              </div>
              <button type="submit" disabled={ld} className="w-full text-white font-bold py-2.5 rounded-lg text-[12px] transition-all flex items-center justify-center gap-2 disabled:opacity-50" style={{ background: 'linear-gradient(135deg,#F56B13,#C44D00)' }}>
                {ld ? <Loader2 className="animate-spin" size={15} /> : <LogIn size={15} />}{ld ? 'Ingresando...' : 'Acceder'}
              </button>
            </form>
          </div>
          <div className="mt-6 text-center"><p className="text-[8px] uppercase tracking-[0.2em]" style={{ color: '#5A5A5A' }}>&copy; 2026 SIGP &bull; Complemento de SICCE ERP</p></div>
        </div>
      </div>
      <div className="absolute bottom-4 text-center"><p className="text-[9px] text-white/10 font-medium tracking-widest uppercase">Acceso seguro &bull; Cifrado de extremo a extremo</p></div>
    </div>
  )
}
