import { useState, useEffect, useRef } from 'react'
import { BarChart3, ShoppingCart, Package, DollarSign, Download, FileText, TrendingUp, Calendar, X, Clock, History, Building2, Wallet } from 'lucide-react'
import { salesApi, productsApi, reportsApi } from '../../services/api'
import jsPDF from 'jspdf'

export default function ReportsView({ company }) {
  const [tab, setTab] = useState('resumen')
  const [todayData, setTodayData] = useState({ sales: [], total: 0, count: 0 })
  const [stats, setStats] = useState(null)
  const [topProducts, setTopProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [fechaDesde, setFechaDesde] = useState('')
  const [fechaHasta, setFechaHasta] = useState('')
  const [products, setProducts] = useState([])
  const [historyData, setHistoryData] = useState({ items: [], total: 0, page: 1, pages: 0 })
  const [historyTab, setHistoryTab] = useState('ventas')
  const [summary, setSummary] = useState(null)
  const [summaryTipo, setSummaryTipo] = useState('diario')
  const hourlyRef = useRef(null)
  const doughnutRef = useRef(null)

  useEffect(() => { if (tab === 'resumen') loadData() }, [fechaDesde, fechaHasta, tab])
  useEffect(() => { if (tab === 'historial') loadHistory() }, [historyData.page, historyTab, tab])
  useEffect(() => { if (tab === 'resumen') { if (todayData.sales.length > 0) drawHourlyChart(); if (topProducts.length > 0) drawDoughnutChart() } }, [todayData, topProducts, tab])

  const loadData = async () => {
    setLoading(true)
    try {
      const params = {}
      if (fechaDesde) params.fecha_desde = fechaDesde
      if (fechaHasta) params.fecha_hasta = fechaHasta
      const [salesRes, statsRes, prodRes, prodSalesRes, sumRes] = await Promise.all([
        salesApi.getToday(), salesApi.getStats(params), productsApi.getAll({ activo: 'true' }),
        salesApi.getByProduct({ ...params, limit: 10 }), reportsApi.getSummary({ ...params, tipo: summaryTipo })
      ])
      setTodayData(salesRes.data)
      setStats(statsRes.data)
      setProducts(prodRes.data.products || [])
      setTopProducts(prodSalesRes.data || [])
      setSummary(sumRes.data)
    } catch {} finally { setLoading(false) }
  }

  const loadHistory = async () => {
    setLoading(true)
    try {
      const params = { page: historyData.page, limit: 20, tipo: historyTab }
      if (fechaDesde) params.fecha_desde = fechaDesde
      if (fechaHasta) params.fecha_hasta = fechaHasta
      const res = await reportsApi.getHistory(params)
      setHistoryData(res.data)
    } catch {} finally { setLoading(false) }
  }

  const drawHourlyChart = () => {
    const canvas = hourlyRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    const dpr = 2; const w = canvas.offsetWidth; const h = canvas.offsetHeight
    canvas.width = w * dpr; canvas.height = h * dpr; ctx.scale(dpr, dpr)
    ctx.clearRect(0, 0, w, h)
    const hourly = new Array(24).fill(0)
    todayData.sales.forEach(s => { const hr = new Date(s.createdAt || s.fecha_emision).getHours(); hourly[hr] += s.total || 0 })
    const start = 6, end = 22, max = Math.max(...hourly, 1)
    const pad = { t: 20, r: 15, b: 25, l: 45 }; const cw = w - pad.l - pad.r; const ch = h - pad.t - pad.b
    ctx.strokeStyle = 'rgba(255,255,255,0.06)'; ctx.lineWidth = 0.5
    for (let i = 0; i <= 4; i++) { const y = pad.t + (ch / 4) * i; ctx.beginPath(); ctx.moveTo(pad.l, y); ctx.lineTo(w - pad.r, y); ctx.stroke(); ctx.fillStyle = '#5A5A5A'; ctx.font = '9px Inter, sans-serif'; ctx.textAlign = 'right'; ctx.fillText('S/' + Math.round(max * (1 - i/4)), pad.l - 6, y + 3) }
    ctx.beginPath(); ctx.moveTo(pad.l, pad.t + ch)
    for (let i = start; i <= end; i++) { const x = pad.l + ((i - start) / (end - start)) * cw; const y = pad.t + ch - (hourly[i] / max) * ch; ctx.lineTo(x, y) }
    ctx.lineTo(pad.l + cw, pad.t + ch); ctx.closePath()
    const g = ctx.createLinearGradient(0, pad.t, 0, pad.t + ch); g.addColorStop(0, 'rgba(245,107,19,0.3)'); g.addColorStop(1, 'rgba(245,107,19,0.02)')
    ctx.fillStyle = g; ctx.fill()
    ctx.beginPath(); ctx.strokeStyle = '#F56B13'; ctx.lineWidth = 2; ctx.lineJoin = 'round'
    for (let i = start; i <= end; i++) { const x = pad.l + ((i - start) / (end - start)) * cw; const y = pad.t + ch - (hourly[i] / max) * ch; i === start ? ctx.moveTo(x, y) : ctx.lineTo(x, y) }
    ctx.stroke()
    ctx.fillStyle = '#5A5A5A'; ctx.font = '9px Inter, sans-serif'; ctx.textAlign = 'center'
    for (let i = start; i <= end; i += 4) { const x = pad.l + ((i - start) / (end - start)) * cw; ctx.fillText(i + ':00', x, h - 5) }
  }

  const drawDoughnutChart = () => {
    const canvas = doughnutRef.current; if (!canvas) return
    const ctx = canvas.getContext('2d'); const dpr = 2; const size = canvas.offsetWidth
    canvas.width = size * dpr; canvas.height = size * dpr; ctx.scale(dpr, dpr); ctx.clearRect(0, 0, size, size)
    const colors = ['#F56B13','#10B981','#3B82F6','#8B5CF6','#EC4899','#FBBF24','#EF4444','#14B8A6','#F97316','#6366F1']
    const cx = size/2, cy = size/2, r = size/2 - 20, ir = r * 0.55
    const total = topProducts.reduce((a, p) => a + p.total, 0) || 1
    let angle = -Math.PI/2
    topProducts.slice(0, 10).forEach((p, i) => { const slice = (p.total/total)*Math.PI*2; ctx.beginPath(); ctx.arc(cx,cy,r,angle,angle+slice); ctx.arc(cx,cy,ir,angle+slice,angle,true); ctx.closePath(); ctx.fillStyle = colors[i%colors.length]; ctx.fill(); angle += slice })
    ctx.fillStyle = '#E0E0E0'; ctx.font = '11px Inter, sans-serif'; ctx.textAlign = 'center'; ctx.fillText('TOP', cx, cy-4); ctx.font = '9px Inter, sans-serif'; ctx.fillText('PRODUCTOS', cx, cy+8)
  }

  const exportPDF = () => {
    const doc = new jsPDF(); const pageW = doc.internal.pageSize.getWidth()
    doc.setFontSize(16); doc.text('REPORTE DE VENTAS - ' + (company?.name || 'SIGP'), pageW/2, 20, { align: 'center' })
    doc.setFontSize(9); doc.text('Periodo: ' + (fechaDesde || 'INICIO') + ' a ' + (fechaHasta || 'HOY'), pageW/2, 27, { align: 'center' })
    if (stats) { doc.setFontSize(11); doc.text('RESUMEN', 14, 40); doc.setFontSize(9); let y=47; [['Total Ventas',String(stats.total_ventas)],['Total Ingresos','S/ '+Number(stats.total_ingresos).toFixed(2)],['IGV Total','S/ '+Number(stats.total_igv).toFixed(2)],['Productos Vendidos',String(stats.total_productos_vendidos)],['Promedio por Venta','S/ '+Number(stats.promedio_por_venta).toFixed(2)]].forEach(([l,v])=>{doc.text(l,20,y);doc.text(v,pageW-20,y,{align:'right'});y+=7}) }
    if (topProducts.length>0) { let y=stats?80:47; y+=10; doc.setFontSize(11); doc.text('TOP PRODUCTOS',14,y); y+=7; doc.setFontSize(8); topProducts.slice(0,10).forEach((p,i)=>{doc.text((i+1)+'. '+p.producto,20,y);doc.text(p.cantidad+' und - S/'+Number(p.total).toFixed(2),pageW-20,y,{align:'right'});y+=5}) }
    doc.save('reporte-ventas-'+(fechaDesde||'todo')+'.pdf')
  }

  const exportCSV = () => {
    let csv = 'PRODUCTO,CANTIDAD,TOTAL\n'
    topProducts.forEach(p => { csv += '"'+p.producto+'",'+p.cantidad+','+Number(p.total).toFixed(2)+'\n' })
    const blob = new Blob([csv], {type:'text/csv;charset=utf-8;'}); const link = document.createElement('a')
    link.href = URL.createObjectURL(blob); link.download = 'reporte-ventas-'+(fechaDesde||'todo')+'.csv'; link.click()
  }

  const clearFilters = () => { setFechaDesde(''); setFechaHasta('') }
  const hasFilters = fechaDesde || fechaHasta

  const statCards = stats ? [
    { label: 'TOTAL VENTAS', value: stats.total_ventas, icon: ShoppingCart, color: '#F56B13' },
    { label: 'INGRESOS TOTALES', value: 'S/ '+Number(stats.total_ingresos).toFixed(2), icon: DollarSign, color: '#10B981' },
    { label: 'IGV TOTAL', value: 'S/ '+Number(stats.total_igv).toFixed(2), icon: TrendingUp, color: '#3B82F6' },
    { label: 'PRODUCTOS VENDIDOS', value: stats.total_productos_vendidos, icon: Package, color: '#8B5CF6' },
    { label: 'PROMEDIO/VENTA', value: 'S/ '+Number(stats.promedio_por_venta).toFixed(2), icon: BarChart3, color: '#EC4899' },
  ] : []

  const TABS = [
    { id: 'resumen', label: 'RESUMEN', icon: BarChart3 },
    { id: 'historial', label: 'HISTORIAL', icon: History },
    { id: 'exportar', label: 'EXPORTAR', icon: Download },
  ]

  return (
    <div className="flex-1 overflow-auto" style={{ background: 'rgba(10,10,11,0.6)' }}>
      <div className="p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-lg font-black tracking-tight text-white">REPORTES</h1>
            <p className="text-[11px] mt-0.5" style={{ color: '#8A8A8A' }}>ANALISIS DEL SISTEMA</p>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={exportCSV} className="btn-relief-outline flex items-center gap-1.5 px-3 py-2 rounded-lg text-[10px] font-bold uppercase tracking-wider"><Download size={13} /> CSV</button>
            <button onClick={exportPDF} className="btn-relief-accent flex items-center gap-1.5 px-3 py-2 rounded-lg text-[10px] font-bold uppercase tracking-wider"><FileText size={13} /> PDF</button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 mb-6 p-1 rounded-xl" style={{ background: 'rgba(26,26,29,0.5)' }}>
          {TABS.map(t => {
            const Icon = t.icon; const active = tab === t.id
            return (
              <button key={t.id} onClick={() => setTab(t.id)}
                className="flex-1 py-2.5 rounded-lg text-[10px] font-bold uppercase tracking-wider flex items-center justify-center gap-1.5 transition-all"
                style={{ background: active ? 'linear-gradient(135deg, #F56B13, #C44D00)' : 'transparent', color: active ? 'white' : '#5A5A5A' }}>
                <Icon size={13} /> {t.label}
              </button>
            )
          })}
        </div>

        {/* Filters */}
        <div className="glass-card p-4 rounded-xl mb-6">
          <div className="flex items-center gap-3">
            <Calendar size={14} style={{ color: '#F56B13' }} />
            <input className="glass-input px-3 py-1.5 rounded-lg text-[12px]" type="date" value={fechaDesde} onChange={e => setFechaDesde(e.target.value)} />
            <span style={{ color: '#5A5A5A' }} className="text-xs">A</span>
            <input className="glass-input px-3 py-1.5 rounded-lg text-[12px]" type="date" value={fechaHasta} onChange={e => setFechaHasta(e.target.value)} />
            {hasFilters && <button onClick={clearFilters} className="btn-relief p-1.5 rounded-lg" style={{ color: '#5A5A5A' }}><X size={14} /></button>}
          </div>
        </div>

        {/* ═══════════ RESUME TAB ═══════════ */}
        {tab === 'resumen' && (
          loading ? (
            <div className="space-y-4">
              <div className="grid grid-cols-5 gap-4">{[1,2,3,4,5].map(i => <div key={i} className="h-24 rounded-xl animate-pulse glass-card" />)}</div>
              <div className="grid grid-cols-2 gap-4"><div className="h-64 rounded-xl animate-pulse glass-card" /><div className="h-64 rounded-xl animate-pulse glass-card" /></div>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-5 gap-4 mb-6">
                {statCards.map((s, i) => {
                  const Icon = s.icon
                  return (
                    <div key={i} className="glass-card p-4 rounded-xl">
                      <div className="flex items-center gap-3 mb-2"><div className="w-9 h-9 rounded-lg flex items-center justify-center" style={{ background: s.color+'18' }}><Icon size={16} style={{ color: s.color }} /></div></div>
                      <p className="text-[9px] font-bold uppercase tracking-wider" style={{ color: '#5A5A5A' }}>{s.label}</p>
                      <p className="text-base font-black text-white mt-0.5">{s.value}</p>
                    </div>
                  )
                })}
              </div>

              <div className="grid grid-cols-3 gap-4 mb-6">
                <div className="col-span-2 glass-card p-5 rounded-xl">
                  <div className="flex items-center justify-between mb-4">
                    <div><h2 className="text-sm font-black text-white uppercase tracking-wider">VENTAS POR HORA</h2><p className="text-[10px] mt-0.5" style={{ color: '#5A5A5A' }}>DISTRIBUCION DE VENTAS DEL DIA</p></div>
                    <span className="text-lg font-black" style={{ color: '#F56B13' }}>S/ {todayData.total.toFixed(2)}</span>
                  </div>
                  <div className="w-full" style={{ height: '220px' }}><canvas ref={hourlyRef} className="w-full h-full" /></div>
                </div>
                <div className="glass-card p-5 rounded-xl">
                  <h2 className="text-sm font-black text-white uppercase tracking-wider mb-4">TOP PRODUCTOS</h2>
                  <div className="w-full" style={{ height: '220px' }}><canvas ref={doughnutRef} className="w-full h-full" /></div>
                </div>
              </div>

              <div className="glass-card p-5 rounded-xl">
                <h2 className="text-sm font-black text-white uppercase tracking-wider mb-4">DETALLE DE PRODUCTOS</h2>
                {topProducts.length === 0 ? (
                  <p className="text-[10px] text-center py-4" style={{ color: '#5A5A5A' }}>SIN DATOS</p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="glass-table w-full">
                      <thead><tr><th className="text-left text-[10px] font-bold uppercase tracking-wider px-3 py-2" style={{ color: '#8A8A8A' }}>#</th><th className="text-left text-[10px] font-bold uppercase tracking-wider px-3 py-2" style={{ color: '#8A8A8A' }}>PRODUCTO</th><th className="text-right text-[10px] font-bold uppercase tracking-wider px-3 py-2" style={{ color: '#8A8A8A' }}>CANTIDAD</th><th className="text-right text-[10px] font-bold uppercase tracking-wider px-3 py-2" style={{ color: '#8A8A8A' }}>TOTAL</th></tr></thead>
                      <tbody>{topProducts.map((p,i)=>(
                        <tr key={i}><td className="px-3 py-2 text-[10px]" style={{ color: '#F56B13' }}>#{i+1}</td><td className="px-3 py-2 text-xs font-bold text-white">{p.producto}</td><td className="px-3 py-2 text-xs text-right" style={{ color: '#5A5A5A' }}>{p.cantidad}</td><td className="px-3 py-2 text-xs font-bold text-right" style={{ color: '#F56B13' }}>S/ {Number(p.total).toFixed(2)}</td></tr>
                      ))}</tbody>
                    </table>
                  </div>
                )}
              </div>

              {summary?.grouped && summary.grouped.length > 0 && (
                <div className="glass-card p-5 rounded-xl mt-4">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-sm font-black text-white uppercase tracking-wider">RESUMEN AGRUPADO</h2>
                    <select className="glass-select px-3 py-1.5 rounded-lg text-[10px] font-bold" value={summaryTipo} onChange={e => { setSummaryTipo(e.target.value); loadData() }}>
                      <option value="diario">DIARIO</option>
                      <option value="mensual">MENSUAL</option>
                    </select>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="glass-table w-full">
                      <thead><tr><th className="text-left text-[10px] font-bold uppercase tracking-wider px-3 py-2" style={{ color: '#8A8A8A' }}>PERIODO</th><th className="text-right text-[10px] font-bold uppercase tracking-wider px-3 py-2" style={{ color: '#8A8A8A' }}>VENTAS</th><th className="text-right text-[10px] font-bold uppercase tracking-wider px-3 py-2" style={{ color: '#8A8A8A' }}>INGRESOS</th><th className="text-right text-[10px] font-bold uppercase tracking-wider px-3 py-2" style={{ color: '#8A8A8A' }}>IGV</th></tr></thead>
                      <tbody>{summary.grouped.map((g,i)=>(
                        <tr key={i}><td className="px-3 py-2 text-xs font-bold text-white">{g.fecha}</td><td className="px-3 py-2 text-xs text-right" style={{ color: '#5A5A5A' }}>{g.ventas}</td><td className="px-3 py-2 text-xs font-bold text-right" style={{ color: '#10B981' }}>S/ {g.ingresos.toFixed(2)}</td><td className="px-3 py-2 text-xs font-bold text-right" style={{ color: '#3B82F6' }}>S/ {g.igv.toFixed(2)}</td></tr>
                      ))}</tbody>
                    </table>
                  </div>
                </div>
              )}
            </>
          )
        )}

        {/* ═══════════ HISTORY TAB ═══════════ */}
        {tab === 'historial' && (
          <>
            <div className="flex gap-2 mb-4">
              {[
                { id: 'ventas', label: 'VENTAS', icon: ShoppingCart },
                { id: 'caja', label: 'CAJA', icon: Wallet },
              ].map(t => {
                const Icon = t.icon; const active = historyTab === t.id
                return (
                  <button key={t.id} onClick={() => { setHistoryTab(t.id); setHistoryData(p=>({...p,page:1})) }}
                    className="px-4 py-2 rounded-lg text-[10px] font-bold uppercase tracking-wider flex items-center gap-1.5 transition-all"
                    style={{ background: active ? 'rgba(245,107,19,0.15)' : 'rgba(255,255,255,0.03)', color: active ? '#F56B13' : '#5A5A5A', border: active ? '1px solid rgba(245,107,19,0.3)' : '1px solid transparent' }}>
                    <Icon size={13} /> {t.label}
                  </button>
                )
              })}
            </div>

            {loading ? (
              <div className="space-y-2">{[1,2,3,4,5].map(i => <div key={i} className="h-12 rounded-lg animate-pulse glass-card" />)}</div>
            ) : historyData.items?.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <History size={36} style={{ color: '#2A2A2E' }} className="mb-2" />
                <p className="text-[12px] font-bold" style={{ color: '#5A5A5A' }}>SIN REGISTROS EN EL HISTORIAL</p>
              </div>
            ) : (
              <>
                <div className="glass-card rounded-xl overflow-hidden">
                  <table className="glass-table w-full">
                    <thead>
                      <tr>
                        {historyTab === 'caja' ? (
                          <>
                            <th className="text-left text-[10px] font-bold uppercase tracking-wider px-3 py-2" style={{ color: '#8A8A8A' }}>FECHA</th>
                            <th className="text-left text-[10px] font-bold uppercase tracking-wider px-3 py-2" style={{ color: '#8A8A8A' }}>CAJERO</th>
                            <th className="text-right text-[10px] font-bold uppercase tracking-wider px-3 py-2" style={{ color: '#8A8A8A' }}>MONTO INICIAL</th>
                            <th className="text-right text-[10px] font-bold uppercase tracking-wider px-3 py-2" style={{ color: '#8A8A8A' }}>VENTAS</th>
                            <th className="text-right text-[10px] font-bold uppercase tracking-wider px-3 py-2" style={{ color: '#8A8A8A' }}>DIFERENCIA</th>
                            <th className="text-center text-[10px] font-bold uppercase tracking-wider px-3 py-2" style={{ color: '#8A8A8A' }}>ESTADO</th>
                          </>
                        ) : (
                          <>
                            <th className="text-left text-[10px] font-bold uppercase tracking-wider px-3 py-2" style={{ color: '#8A8A8A' }}># VENTA</th>
                            <th className="text-left text-[10px] font-bold uppercase tracking-wider px-3 py-2" style={{ color: '#8A8A8A' }}>CLIENTE</th>
                            <th className="text-left text-[10px] font-bold uppercase tracking-wider px-3 py-2" style={{ color: '#8A8A8A' }}>FECHA</th>
                            <th className="text-right text-[10px] font-bold uppercase tracking-wider px-3 py-2" style={{ color: '#8A8A8A' }}>TOTAL</th>
                            <th className="text-center text-[10px] font-bold uppercase tracking-wider px-3 py-2" style={{ color: '#8A8A8A' }}>ESTADO</th>
                          </>
                        )}
                      </tr>
                    </thead>
                    <tbody>
                      {historyData.items.map((item, i) => (
                        <tr key={item._id || i}>
                          {historyTab === 'caja' ? (
                            <>
                              <td className="px-3 py-2 text-[11px] text-white">{new Date(item.apertura).toLocaleDateString('es-PE')}</td>
                              <td className="px-3 py-2 text-[11px] font-bold text-white">{item.cajero_nombre || '—'}</td>
                              <td className="px-3 py-2 text-[11px] text-right" style={{ color: '#F56B13' }}>S/ {(item.monto_inicial||0).toFixed(2)}</td>
                              <td className="px-3 py-2 text-[11px] font-bold text-right" style={{ color: '#10B981' }}>S/ {(item.ventas_total||0).toFixed(2)}</td>
                              <td className="px-3 py-2 text-[11px] text-right" style={{ color: item.diferencia > 0 ? '#10B981' : '#EF4444' }}>S/ {(item.diferencia||0).toFixed(2)}</td>
                              <td className="px-3 py-2 text-center">
                                <span className={`px-1.5 py-0.5 rounded text-[8px] font-bold uppercase ${item.estado === 'ABIERTO' ? 'text-[#10B981]' : 'text-[#5A5A5A]'}`}
                                  style={{ background: item.estado === 'ABIERTO' ? 'rgba(16,185,129,0.1)' : 'rgba(255,255,255,0.05)' }}>{item.estado}</span>
                              </td>
                            </>
                          ) : (
                            <>
                              <td className="px-3 py-2 text-[11px]" style={{ color: '#F56B13' }}>VTA-{String(item.correlativo).padStart(7,'0')}</td>
                              <td className="px-3 py-2 text-[11px] font-bold text-white">{item.cliente_nombre || 'PUBLICO GENERAL'}</td>
                              <td className="px-3 py-2 text-[11px]" style={{ color: '#5A5A5A' }}>{item.fecha_emision}</td>
                              <td className="px-3 py-2 text-[11px] font-bold text-right" style={{ color: '#F56B13' }}>S/ {(item.total||0).toFixed(2)}</td>
                              <td className="px-3 py-2 text-center">
                                <span className={`px-1.5 py-0.5 rounded text-[8px] font-bold uppercase ${item.estado === 'COMPLETADO' ? 'text-[#10B981]' : 'text-[#EF4444]'}`}
                                  style={{ background: item.estado === 'COMPLETADO' ? 'rgba(16,185,129,0.1)' : 'rgba(239,68,68,0.1)' }}>{item.estado}</span>
                              </td>
                            </>
                          )}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="flex items-center justify-between mt-4">
                  <span className="text-[10px]" style={{ color: '#5A5A5A' }}>Total: {historyData.total} registros</span>
                  <div className="flex gap-2">
                    <button onClick={() => setHistoryData(p=>({...p,page:Math.max(1,p.page-1)}))} disabled={historyData.page<=1}
                      className="btn-relief px-3 py-1.5 rounded-lg text-[10px] font-bold disabled:opacity-30">ANTERIOR</button>
                    <span className="text-[10px] font-bold text-white px-2 py-1.5">Pág {historyData.page}/{historyData.pages}</span>
                    <button onClick={() => setHistoryData(p=>({...p,page:Math.min(p.pages,p.page+1)}))} disabled={historyData.page>=historyData.pages}
                      className="btn-relief px-3 py-1.5 rounded-lg text-[10px] font-bold disabled:opacity-30">SIGUIENTE</button>
                  </div>
                </div>
              </>
            )}
          </>
        )}

        {/* ═══════════ EXPORT TAB ═══════════ */}
        {tab === 'exportar' && (
          <div className="glass-card p-6 rounded-xl max-w-xl mx-auto">
            <h2 className="text-sm font-black text-white uppercase tracking-wider mb-4">EXPORTAR REPORTE</h2>
            <div className="space-y-4">
              <div className="space-y-1">
                <label className="text-[9px] font-bold uppercase tracking-wider" style={{ color: '#5A5A5A' }}>TIPO DE REPORTE</label>
                <select className="glass-input w-full px-3 py-2 rounded-lg text-[13px]" defaultValue="ventas">
                  <option value="ventas">VENTAS</option>
                  <option value="productos">PRODUCTOS MAS VENDIDOS</option>
                  <option value="caja">CIERRE DE CAJA</option>
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[9px] font-bold uppercase tracking-wider" style={{ color: '#5A5A5A' }}>DESDE</label>
                  <input className="glass-input w-full px-3 py-2 rounded-lg text-[13px]" type="date" value={fechaDesde} onChange={e => setFechaDesde(e.target.value)} />
                </div>
                <div className="space-y-1">
                  <label className="text-[9px] font-bold uppercase tracking-wider" style={{ color: '#5A5A5A' }}>HASTA</label>
                  <input className="glass-input w-full px-3 py-2 rounded-lg text-[13px]" type="date" value={fechaHasta} onChange={e => setFechaHasta(e.target.value)} />
                </div>
              </div>
              <div className="flex gap-2 pt-2">
                <button onClick={exportCSV} className="btn-relief-outline flex-1 py-2.5 rounded-lg text-[10px] font-bold uppercase tracking-wider flex items-center justify-center gap-1.5">
                  <Download size={13} /> EXPORTAR CSV
                </button>
                <button onClick={exportPDF} className="btn-relief-accent flex-1 py-2.5 rounded-lg text-[10px] font-bold uppercase tracking-wider flex items-center justify-center gap-1.5">
                  <FileText size={13} /> EXPORTAR PDF
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
