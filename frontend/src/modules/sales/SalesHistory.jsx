import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { salesApi, syncApi } from '../../services/api'
import { formatCurrency, formatDate, formatTime } from '../../shared/utils/format'
import {
  Calendar, Search, ShoppingCart, FileText, Tag, RotateCcw, ChevronLeft, ChevronRight,
  RefreshCw, Download, X, Eye, MoreVertical, BarChart3, Grid3X3, Filter,
  Hash, Clock, Store, CreditCard, UserCheck, Receipt, TrendingUp, TrendingDown,
  ArrowUpRight, ArrowDownRight, Upload, Cloud, CloudOff, CheckCircle2, AlertCircle, Printer, Ban
} from 'lucide-react'

const ESTADO_COLORS = {
  COMPLETADO: { bg: 'rgba(16,185,129,0.12)', color: '#10B981', label: 'Completada' },
  ANULADO: { bg: 'rgba(239,68,68,0.12)', color: '#EF4444', label: 'Anulada' },
  DEVUELTO: { bg: 'rgba(245,158,11,0.12)', color: '#F59E0B', label: 'Devuelta' },
  PENDIENTE: { bg: 'rgba(107,114,128,0.12)', color: '#6B7280', label: 'Pendiente' },
}

const TIPO_LABELS = { '01': 'Factura', '03': 'Boleta', '07': 'Nota Venta' }

function DonutChart({ breakdown }) {
  const segments = [
    { label: 'Completadas', pct: breakdown?.completadas?.pct || 0, total: breakdown?.completadas?.total || 0, color: '#F56B13' },
    { label: 'Anuladas', pct: breakdown?.anuladas?.pct || 0, total: breakdown?.anuladas?.total || 0, color: '#EF4444' },
    { label: 'Devueltas', pct: breakdown?.devueltas?.pct || 0, total: breakdown?.devueltas?.total || 0, color: '#F59E0B' },
    { label: 'Pendientes', pct: breakdown?.pendientes?.pct || 0, total: breakdown?.pendientes?.total || 0, color: '#6B7280' },
  ]
  const cumulative = segments.reduce((acc, s) => { acc.push((acc.length ? acc[acc.length - 1] : 0) + s.pct); return acc }, [])
  const conic = segments.map((s, i) => `${s.color} ${cumulative[i - 1] || 0}% ${cumulative[i]}%`).join(', ')

  return (
    <div className="flex items-center gap-4">
      <div className="relative w-[100px] h-[100px] shrink-0">
        <div className="w-full h-full rounded-full" style={{
          background: `conic-gradient(${conic || '#2A2A2E 0% 100%'})`,
          mask: 'radial-gradient(farthest-side, transparent 60%, black 61%)',
          WebkitMask: 'radial-gradient(farthest-side, transparent 60%, black 61%)'
        }} />
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-xl font-black text-white">{breakdown?.total || 0}</span>
          <span className="text-[9px] font-bold" style={{ color: '#5A5A5A' }}>Ventas</span>
        </div>
      </div>
      <div className="space-y-1.5 flex-1">
        {segments.map((s, i) => (
          <div key={i} className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <div className="w-2 h-2 rounded-sm" style={{ background: s.color }} />
              <span className="text-[10px] font-bold" style={{ color: '#CCC' }}>{s.label}</span>
            </div>
            <div className="text-right">
              <span className="text-[10px] font-black text-white">{s.pct.toFixed(1)}%</span>
              <span className="text-[9px] font-bold ml-1" style={{ color: '#5A5A5A' }}>/ {formatCurrency(s.total)}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

function HourlyChart({ hourly }) {
  const maxVal = Math.max(...(hourly || []).map(h => h.total), 1)
  const chartH = 80
  const chartW = 200
  const points = (hourly || []).map((h, i) => `${(i / 23) * chartW},${chartH - (h.total / maxVal) * chartH}`).join(' ')

  return (
    <div>
      <svg viewBox={`0 0 ${chartW} ${chartH + 16}`} className="w-full" style={{ height: 100 }}>
        {[0, 0.25, 0.5, 0.75, 1].map((pct, i) => (
          <line key={i} x1={0} y1={chartH - pct * chartH} x2={chartW} y2={chartH - pct * chartH} stroke="#1E1E22" strokeWidth={0.5} />
        ))}
        {points && <polyline points={points} fill="none" stroke="#F56B13" strokeWidth={1.5} strokeLinejoin="round" strokeLinecap="round" />}
        {points && <polyline points={`0,${chartH} ${points} ${chartW},${chartH}`} fill="url(#hourlyGrad)" stroke="none" opacity={0.3} />}
        <defs>
          <linearGradient id="hourlyGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#F56B13" stopOpacity={0.4} />
            <stop offset="100%" stopColor="#F56B13" stopOpacity={0} />
          </linearGradient>
        </defs>
        {[0, 4, 8, 12, 16, 20, 23].map(h => (
          <text key={h} x={(h / 23) * chartW} y={chartH + 12} textAnchor="middle" fill="#5A5A5A" fontSize={7} fontFamily="sans-serif">
            {String(h).padStart(2, '0')}:00
          </text>
        ))}
      </svg>
    </div>
  )
}

export default function SalesHistory() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [filters, setFilters] = useState({ fecha_desde: '', fecha_hasta: '', estado: '', punto_venta: '', caja: '', tipo_documento: '', q: '' })
  const [page, setPage] = useState(1)
  const [limit, setLimit] = useState(8)

  /* Sync state */
  const [selectedIds, setSelectedIds] = useState(new Set())
  const [showSyncDropdown, setShowSyncDropdown] = useState(false)
  const [showDateModal, setShowDateModal] = useState(false)
  const [syncFecha, setSyncFecha] = useState({ desde: '', hasta: '' })
  const [paginasInput, setPaginasInput] = useState(5)
  const [syncError, setSyncError] = useState(null)
  const [syncStatus, setSyncStatus] = useState(null)
  const [detailSale, setDetailSale] = useState(null)
  const [actionMenuId, setActionMenuId] = useState(null)
  const [showTopProducts, setShowTopProducts] = useState(false)

  const { data: summary } = useQuery({
    queryKey: ['salesSummary'],
    queryFn: () => salesApi.getSummary().then(r => r.data)
  })

  const { data: breakdown } = useQuery({
    queryKey: ['salesStatusBreakdown', filters],
    queryFn: () => salesApi.getStatusBreakdown({ fecha_desde: filters.fecha_desde, fecha_hasta: filters.fecha_hasta, punto_venta: filters.punto_venta, caja: filters.caja }).then(r => r.data)
  })

  const { data: hourlyData } = useQuery({
    queryKey: ['salesHourly'],
    queryFn: () => salesApi.getHourly().then(r => r.data)
  })

  const { data, isLoading } = useQuery({
    queryKey: ['salesList', filters, page, limit],
    queryFn: () => salesApi.getAll({ ...filters, page, limit, origen: 'todos' }).then(r => r.data),
    keepPreviousData: true
  })

  const { data: pendingData, refetch: refetchPending } = useQuery({
    queryKey: ['syncPendingCount'],
    queryFn: () => syncApi.getPendingCount().then(r => r.data)
  })

  const { data: topProductsData } = useQuery({
    queryKey: ['topProducts', filters.fecha_desde, filters.fecha_hasta],
    queryFn: () => salesApi.getByProduct({ fecha_desde: filters.fecha_desde, fecha_hasta: filters.fecha_hasta, limit: 10 }).then(r => r.data),
    enabled: showTopProducts
  })

  const { data: autoStatus, refetch: refetchAuto } = useQuery({
    queryKey: ['syncAutoStatus'],
    queryFn: () => syncApi.getAutoStatus().then(r => r.data)
  })

  const exportMutation = useMutation({
    mutationFn: (body) => syncApi.exportSales(body).then(r => r.data),
    onSuccess: (data) => {
      setSyncStatus(`${data.synced} ventas enviadas a SICCE`);
      setSyncError(null);
      setShowSyncDropdown(false);
      setShowDateModal(false);
      refetchPending();
      queryClient.invalidateQueries(['salesList']);
      setTimeout(() => setSyncStatus(null), 5000);
    },
    onError: (err) => {
      const msg = err?.response?.data?.message || err.message || 'Error al enviar a SICCE';
      setSyncError(msg);
      console.error('[SIGP] Sync error:', err);
      setShowSyncDropdown(false);
      setShowDateModal(false);
      setTimeout(() => setSyncError(null), 5000);
    }
  })

  const toggleAutoMutation = useMutation({
    mutationFn: (enabled) => syncApi.toggleAuto({ enabled }).then(r => r.data),
    onSuccess: () => refetchAuto(),
    onError: (err) => setSyncError(err?.response?.data?.message || err.message || 'Error al cambiar auto-sync')
  })

  const clearFilters = () => { setFilters({ fecha_desde: '', fecha_hasta: '', estado: '', punto_venta: '', caja: '', tipo_documento: '', q: '' }); setPage(1) }
  const hasFilters = Object.values(filters).some(v => v !== '')

  const toggleSelect = (id) => {
    const next = new Set(selectedIds)
    if (next.has(id)) next.delete(id); else next.add(id)
    setSelectedIds(next)
  }

  const toggleSelectAll = () => {
    if (!data?.sales) return
    if (selectedIds.size === data.sales.length) setSelectedIds(new Set())
    else setSelectedIds(new Set(data.sales.map(s => s._id)))
  }

  const handleExport = (modo) => {
    const body = { modo }
    if (modo === 'manual') body.sale_ids = [...selectedIds]
    if (modo === 'fecha') { body.fecha_desde = syncFecha.desde; body.fecha_hasta = syncFecha.hasta }
    if (modo === 'paginas') body.paginas = paginasInput
    setSyncStatus('Enviando a SICCE...');
    setSyncError(null);
    exportMutation.mutate(body)
  }

  const changeHoy = summary?.ventas_hoy?.change || 0
  const changeMes = summary?.ventas_mes?.change || 0
  const avgAyer = summary?.ventas_ayer?.count > 0 ? summary.ventas_ayer.total / summary.ventas_ayer.count : 0
  const changePromedio = avgAyer > 0 ? ((summary?.ventas_hoy?.promedio - avgAyer) / avgAyer * 100) : 0
  const changeDev = summary?.devoluciones?.change || 0

  const stats = [
    { label: 'VENTAS HOY', value: formatCurrency(summary?.ventas_hoy?.total || 0), sub: `${summary?.ventas_hoy?.count || 0} ventas`, change: changeHoy, icon: ShoppingCart, color: '#F56B13' },
    { label: 'TOTAL VENTAS', value: summary?.ventas_mes?.count || 0, sub: `${Math.abs(changeMes).toFixed(1)}% vs ayer`, change: changeMes, icon: FileText, color: '#10B981' },
    { label: 'TICKET PROMEDIO', value: formatCurrency(summary?.ventas_hoy?.promedio || 0), sub: `${Math.abs(changePromedio).toFixed(1)}% vs ayer`, change: changePromedio, icon: Tag, color: '#8B5CF6' },
    { label: 'DEVOLUCIONES', value: formatCurrency(summary?.devoluciones?.total || 0), sub: `${Math.abs(changeDev).toFixed(1)}% vs ayer`, change: changeDev, icon: RotateCcw, color: '#EF4444' },
    { label: 'VENTAS DEL MES', value: formatCurrency(summary?.ventas_mes?.total || 0), sub: `${Math.abs(changeMes).toFixed(1)}% vs mes anterior`, change: changeMes, icon: Calendar, color: '#F56B13' },
  ]

  /* Columns config */
  const hasSelected = selectedIds.size > 0
  const showCheckboxes = showSyncDropdown

  const HEADER_COLS = [
    ...(showCheckboxes ? [{ label: '', icon: null, align: 'center', width: 28 }] : []),
    { label: 'N° Venta', icon: Hash, align: 'left' },
    { label: 'Fecha / Hora', icon: Clock, align: 'left' },
    { label: 'Tienda', icon: Store, align: 'left' },
    { label: 'Caja', icon: CreditCard, align: 'left' },
    { label: 'Cajero', icon: UserCheck, align: 'left' },
    { label: 'Cliente', icon: null, align: 'left' },
    { label: 'Tipo', icon: Receipt, align: 'left' },
    { label: 'Total', icon: null, align: 'right' },
    { label: 'Estado', icon: null, align: 'center' },
    { label: 'Sync', icon: Cloud, align: 'center' },
    { label: 'Acciones', icon: null, align: 'center' },
  ]

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      {/* Header */}
      <div className="px-5 pt-4 pb-2 flex items-center justify-between shrink-0">
        <div>
          <h1 className="text-sm font-black text-white uppercase tracking-wider">Registro de Ventas</h1>
          <p className="text-[9px] font-bold" style={{ color: '#5A5A5A' }}>Consulta y gestion de todas las ventas realizadas</p>
        </div>
      </div>

      <div className="flex-1 flex gap-4 px-5 pb-4 overflow-hidden">
        {/* LEFT COLUMN */}
        <div className="flex-1 flex flex-col gap-3 min-w-0 overflow-y-auto">
          {/* Stats Row */}
          <div className="grid grid-cols-5 gap-2.5 shrink-0">
            {stats.map((s, i) => {
              const Icon = s.icon
              const isNeg = s.change < 0
              return (
                <div key={i} className="rounded-xl p-3 border" style={{ background: '#111113', borderColor: '#2A2A2E' }}>
                  <div className="flex items-start justify-between mb-1.5">
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: `${s.color}15` }}>
                      <Icon size={16} style={{ color: s.color }} />
                    </div>
                  </div>
                  <p className="text-[7px] font-bold uppercase tracking-wider" style={{ color: '#5A5A5A' }}>{s.label}</p>
                  <p className="text-sm font-black text-white mt-0.5">{s.value}</p>
                  <div className="flex items-center gap-1 mt-1">
                    {isNeg ? <ArrowDownRight size={9} style={{ color: '#EF4444' }} /> : <ArrowUpRight size={9} style={{ color: '#10B981' }} />}
                    <span className="text-[9px] font-black" style={{ color: isNeg ? '#EF4444' : '#10B981' }}>
                      {Math.abs(s.change).toFixed(1)}%
                    </span>
                    <span className="text-[9px] font-bold" style={{ color: '#5A5A5A' }}>vs ayer</span>
                  </div>
                </div>
              )
            })}
          </div>

          {/* Filters */}
          <div className="rounded-xl border p-3 shrink-0" style={{ background: '#111113', borderColor: '#2A2A2E' }}>
            <div className="flex items-center gap-2 mb-2">
              <Filter size={10} style={{ color: '#F56B13' }} />
              <span className="text-[8px] font-black uppercase tracking-wider" style={{ color: '#8A8A8A' }}>Filtros de Busqueda</span>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              <div className="flex items-center gap-1.5 border rounded-lg px-2 py-1.5" style={{ borderColor: '#2A2A2E' }}>
                <Calendar size={11} style={{ color: '#5A5A5A' }} />
                <input type="date" value={filters.fecha_desde} onChange={e => { setFilters(f => ({...f, fecha_desde: e.target.value})); setPage(1) }}
                  className="text-[9px] bg-transparent text-white outline-none w-[90px]" style={{ colorScheme: 'dark' }} />
                <span className="text-[7px] font-bold" style={{ color: '#5A5A5A' }}>-</span>
                <input type="date" value={filters.fecha_hasta} onChange={e => { setFilters(f => ({...f, fecha_hasta: e.target.value})); setPage(1) }}
                  className="text-[9px] bg-transparent text-white outline-none w-[90px]" style={{ colorScheme: 'dark' }} />
              </div>
              <select value={filters.punto_venta} onChange={e => { setFilters(f => ({...f, punto_venta: e.target.value})); setPage(1) }}
                className="text-[9px] px-2 py-1.5 rounded-lg border bg-transparent text-white outline-none cursor-pointer" style={{ borderColor: '#2A2A2E', background: '#18181B' }}>
                <option value="">Todas las tiendas</option>
                <option value="POS-SIGP">POS-SIGP</option>
              </select>
              <select value={filters.caja} onChange={e => { setFilters(f => ({...f, caja: e.target.value})); setPage(1) }}
                className="text-[9px] px-2 py-1.5 rounded-lg border bg-transparent text-white outline-none cursor-pointer" style={{ borderColor: '#2A2A2E', background: '#18181B' }}>
                <option value="">Todas las cajas</option>
                <option value="Caja 01">Caja 01</option>
                <option value="Caja 02">Caja 02</option>
                <option value="Caja 03">Caja 03</option>
              </select>
              <select value={filters.estado} onChange={e => { setFilters(f => ({...f, estado: e.target.value})); setPage(1) }}
                className="text-[9px] px-2 py-1.5 rounded-lg border bg-transparent text-white outline-none cursor-pointer" style={{ borderColor: '#2A2A2E', background: '#18181B' }}>
                <option value="">Todos</option>
                <option value="COMPLETADO">Completada</option>
                <option value="ANULADO">Anulada</option>
                <option value="DEVUELTO">Devuelta</option>
                <option value="PENDIENTE">Pendiente</option>
              </select>
              <select value={filters.tipo_documento} onChange={e => { setFilters(f => ({...f, tipo_documento: e.target.value})); setPage(1) }}
                className="text-[9px] px-2 py-1.5 rounded-lg border bg-transparent text-white outline-none cursor-pointer" style={{ borderColor: '#2A2A2E', background: '#18181B' }}>
                <option value="">Todos</option>
                <option value="01">Factura</option>
                <option value="03">Boleta</option>
                <option value="07">Nota Venta</option>
              </select>
              <div className="flex items-center gap-1.5 border rounded-lg px-2 py-1.5 flex-1 min-w-[160px]" style={{ borderColor: '#2A2A2E' }}>
                <Search size={11} style={{ color: '#5A5A5A' }} />
                <input type="text" placeholder="Buscar por N° venta, cliente, DNI..." value={filters.q}
                  onChange={e => { setFilters(f => ({...f, q: e.target.value})); setPage(1) }}
                  className="text-[9px] bg-transparent text-white outline-none flex-1 placeholder:text-[#5A5A5A]" />
              </div>
            </div>
            <div className="flex items-center justify-between mt-2">
              <button className="text-[8px] font-bold flex items-center gap-1 hover:text-white transition-colors" style={{ color: '#F56B13' }}>
                <Filter size={9} /> Mas filtros
              </button>
              <div className="flex items-center gap-2">
                {hasFilters && (
                  <button onClick={clearFilters} className="text-[8px] font-bold px-3 py-1.5 rounded-lg border hover:bg-white/5 transition-all" style={{ borderColor: '#2A2A2E', color: '#8A8A8A' }}>
                    Limpiar
                  </button>
                )}
                <button onClick={() => setPage(1)} className="text-[8px] font-bold px-3 py-1.5 rounded-lg transition-all" style={{ background: '#F56B13', color: '#FFF' }}>
                  Buscar
                </button>
              </div>
            </div>
          </div>

          {/* Sync Bar */}
          <div className="rounded-xl border p-2.5 flex items-center gap-3 shrink-0" style={{ background: '#0D0D0F', borderColor: '#1E1E22' }}>
            <div className="relative">
              <button
                onClick={() => { setShowSyncDropdown(!showSyncDropdown); if (!showSyncDropdown) setSelectedIds(new Set()) }}
                className="text-[9px] font-black px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-all"
                style={{ background: '#F56B13', color: '#FFF' }}
              >
                <Upload size={12} /> Enviar a SICCE
              </button>
              {showSyncDropdown && (
                <>
                  <div className="fixed inset-0 z-10" onClick={() => setShowSyncDropdown(false)} />
                  <div className="absolute top-full left-0 mt-1 z-20 w-[220px] rounded-xl border overflow-hidden" style={{ background: '#1A1A1D', borderColor: '#2A2A2E' }}>
                    {[
                      { label: `Enviar seleccionadas (${selectedIds.size})`, modo: 'manual', disabled: selectedIds.size === 0 },
                      { label: 'Enviar por fecha...', modo: 'fecha', disabled: false },
                      { label: `Enviar ultimas ${paginasInput} paginas`, modo: 'paginas', disabled: false },
                      { label: 'Enviar todo pendiente', modo: 'todo', disabled: false },
                    ].map((opt, i) => (
                      <button key={i} onClick={() => {
                        if (opt.modo === 'fecha') { setShowDateModal(true); setShowSyncDropdown(false) }
                        else handleExport(opt.modo)
                      }} disabled={opt.disabled}
                        className="w-full text-left px-3 py-2.5 text-[9px] font-bold transition-all hover:bg-white/5 disabled:opacity-30 disabled:cursor-not-allowed"
                        style={{ color: opt.disabled ? '#3A3A3E' : '#CCC', borderBottom: i < 3 ? '1px solid #2A2A2E' : 'none' }}>
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>

            <div className="flex items-center gap-1.5">
              <button
                onClick={() => { const next = !autoStatus?.auto_sync_sicce; toggleAutoMutation.mutate(next) }}
                className={`text-[9px] font-bold px-2.5 py-1.5 rounded-lg flex items-center gap-1.5 border transition-all ${autoStatus?.auto_sync_sicce ? '' : 'opacity-50'}`}
                style={{ borderColor: '#2A2A2E', color: autoStatus?.auto_sync_sicce ? '#10B981' : '#5A5A5A' }}
              >
                {autoStatus?.auto_sync_sicce ? <Cloud size={12} /> : <CloudOff size={12} />}
                Auto-sync: {autoStatus?.auto_sync_sicce ? 'ON' : 'OFF'}
              </button>
            </div>

            <div className="flex items-center gap-2 flex-1">
              {pendingData && pendingData.pending > 0 && (
                <button onClick={() => refetchPending()} className="flex items-center gap-1 text-[8px] font-bold px-2 py-1 rounded-lg hover:bg-white/5 transition-all" style={{ color: '#F59E0B' }}>
                  <AlertCircle size={10} />
                  {pendingData.pending} pendientes
                </button>
              )}
              {pendingData && pendingData.synced > 0 && (
                <span className="flex items-center gap-1 text-[8px] font-bold" style={{ color: '#5A5A5A' }}>
                  <CheckCircle2 size={10} style={{ color: '#10B981' }} />
                  {pendingData.synced} enviados
                </span>
              )}
            </div>

            {hasSelected && (
              <span className="text-[8px] font-bold" style={{ color: '#F56B13' }}>{selectedIds.size} seleccionadas</span>
            )}
            {syncError && (
              <span className="text-[8px] font-bold flex items-center gap-1" style={{ color: '#EF4444' }}>
                <AlertCircle size={10} /> {syncError}
              </span>
            )}
            {syncStatus && (
              <span className="text-[8px] font-bold flex items-center gap-1" style={{ color: exportMutation.isLoading ? '#F56B13' : '#10B981' }}>
                {exportMutation.isLoading ? <RefreshCw size={10} className="animate-spin" /> : <CheckCircle2 size={10} />}
                {syncStatus}
              </span>
            )}
          </div>

          {/* Table */}
          <div className="flex-1 rounded-xl border overflow-hidden flex flex-col" style={{ background: '#111113', borderColor: '#2A2A2E' }}>
            <div className="px-4 py-2.5 border-b flex items-center justify-between" style={{ borderColor: '#2A2A2E' }}>
              <h3 className="text-[10px] font-black text-white uppercase tracking-wider">Listado de Ventas</h3>
              <div className="flex items-center gap-2">
                <button className="text-[8px] font-bold px-2.5 py-1.5 rounded-lg border flex items-center gap-1.5 hover:bg-white/5 transition-all" style={{ borderColor: '#2A2A2E', color: '#8A8A8A' }}>
                  <Download size={10} /> Exportar
                </button>
                <button onClick={() => queryClient.invalidateQueries(['salesList'])} className="text-[8px] font-bold px-2.5 py-1.5 rounded-lg border flex items-center gap-1.5 hover:bg-white/5 transition-all" style={{ borderColor: '#2A2A2E', color: '#8A8A8A' }}>
                  <RefreshCw size={10} /> Actualizar
                </button>
              </div>
            </div>
            <div className="flex-1 overflow-auto">
              <table className="w-full">
                <thead className="sticky top-0" style={{ background: '#18181B' }}>
                  <tr>
                    {HEADER_COLS.map((col, i) => {
                      const isCheck = i === 0 && showCheckboxes
                      return (
                        <th key={i} className={`px-3 py-2 text-[7px] font-bold uppercase tracking-wider ${col.align === 'right' ? 'text-right' : col.align === 'center' ? 'text-center' : 'text-left'}`}
                          style={{ color: '#5A5A5A', width: col.width || undefined }}>
                          {isCheck ? (
                            <input type="checkbox" checked={data?.sales && selectedIds.size === data.sales.length && data.sales.length > 0}
                              onChange={toggleSelectAll} className="cursor-pointer accent-[#F56B13]" />
                          ) : (
                            <span className="flex items-center gap-1 inline-flex">
                              {col.icon && <col.icon size={8} />}
                              {col.label}
                            </span>
                          )}
                        </th>
                      )
                    })}
                  </tr>
                </thead>
                <tbody>
                  {isLoading ? (
                    <tr><td colSpan={HEADER_COLS.length} className="text-center py-8 text-[10px] font-bold" style={{ color: '#5A5A5A' }}>Cargando ventas...</td></tr>
                  ) : data?.sales?.length === 0 ? (
                    <tr><td colSpan={HEADER_COLS.length} className="text-center py-8 text-[10px] font-bold" style={{ color: '#5A5A5A' }}>No se encontraron ventas</td></tr>
                  ) : data?.sales?.map(sale => {
                    const es = ESTADO_COLORS[sale.estado] || ESTADO_COLORS.COMPLETADO
                    const synced = sale.sync?.sicce
                    return (
                      <tr key={sale._id} className="border-b transition-colors hover:bg-white/[0.02]" style={{ borderColor: '#1E1E22' }}>
                        {showCheckboxes && (
                          <td className="px-3 py-2.5 text-center">
                            <input type="checkbox" checked={selectedIds.has(sale._id)} onChange={() => toggleSelect(sale._id)}
                              className="cursor-pointer accent-[#F56B13]" />
                          </td>
                        )}
                        <td className="px-3 py-2.5">
                          <span className="text-[9px] font-black underline cursor-pointer" style={{ color: '#F56B13' }}>
                            VTA-{String(sale.correlativo).padStart(7, '0')}
                          </span>
                        </td>
                        <td className="px-3 py-2.5">
                          <p className="text-[9px] font-bold text-white">{formatDate(sale.fecha_emision)}</p>
                          <p className="text-[9px] font-bold" style={{ color: '#5A5A5A' }}>{sale.creado_en ? formatTime(new Date(sale.creado_en)) : ''}</p>
                        </td>
                        <td className="px-3 py-2.5">
                          <span className="text-[9px] font-bold text-white">{sale.punto_venta || '-'}</span>
                        </td>
                        <td className="px-3 py-2.5">
                          <span className="text-[9px] font-bold text-white">{sale.caja || '-'}</span>
                        </td>
                        <td className="px-3 py-2.5">
                          <span className="text-[9px] font-bold text-white">{sale.registrado_por?.username || '-'}</span>
                        </td>
                        <td className="px-3 py-2.5">
                          <p className="text-[9px] font-bold text-white">{(sale.cliente_nombre || 'CLIENTE GENERAL').toUpperCase()}</p>
                          {sale.cliente_dni && <p className="text-[9px] font-bold" style={{ color: '#5A5A5A' }}>DNI: {sale.cliente_dni}</p>}
                        </td>
                        <td className="px-3 py-2.5">
                          <span className="text-[7px] font-black px-1.5 py-0.5 rounded" style={{ background: '#1A1A2E', color: '#8B5CF6' }}>
                            {TIPO_LABELS[sale.tipo_documento] || 'Boleta'} {sale.serie}-{sale.numero}
                          </span>
                        </td>
                        <td className="px-3 py-2.5 text-right">
                          <span className="text-[10px] font-black" style={{ color: '#10B981' }}>{formatCurrency(sale.total)}</span>
                        </td>
                        <td className="px-3 py-2.5 text-center">
                          <span className="text-[7px] font-black px-2 py-0.5 rounded-full uppercase" style={{ background: es.bg, color: es.color }}>
                            {es.label}
                          </span>
                        </td>
                        <td className="px-3 py-2.5 text-center">
                          {synced ? (
                            <span className="flex items-center justify-center gap-1 text-[7px] font-bold" style={{ color: '#10B981' }}>
                              <CheckCircle2 size={10} /> SICCE
                            </span>
                          ) : (
                            <span className="flex items-center justify-center gap-1 text-[7px] font-bold" style={{ color: '#F59E0B' }}>
                              <AlertCircle size={10} /> Pend.
                            </span>
                          )}
                        </td>
                        <td className="px-3 py-2.5 text-center">
                          <div className="flex items-center justify-center gap-1">
                            <button onClick={() => setDetailSale(sale)} className="p-1 rounded hover:bg-white/5 transition-all" title="Ver detalle">
                              <Eye size={12} style={{ color: '#8A8A8A' }} />
                            </button>
                            <div className="relative">
                              <button onClick={() => setActionMenuId(actionMenuId === sale._id ? null : sale._id)}
                                className="p-1 rounded hover:bg-white/5 transition-all" title="Mas opciones">
                                <MoreVertical size={12} style={{ color: '#8A8A8A' }} />
                              </button>
                              {actionMenuId === sale._id && (
                                <>
                                  <div className="fixed inset-0 z-10" onClick={() => setActionMenuId(null)} />
                                  <div className="absolute right-0 top-full mt-1 z-20 w-44 rounded-xl border overflow-hidden" style={{ background: '#1A1A1D', borderColor: '#2A2A2E' }}>
                                    <button onClick={() => { setDetailSale(sale); setActionMenuId(null) }}
                                      className="w-full text-left px-3 py-2.5 text-[9px] font-bold transition-all hover:bg-white/5 flex items-center gap-2"
                                      style={{ color: '#CCC', borderBottom: '1px solid #2A2A2E' }}>
                                      <Eye size={11} /> Ver detalle
                                    </button>
                                    <button onClick={() => { /* TODO: reimprimir ticket */ setActionMenuId(null) }}
                                      className="w-full text-left px-3 py-2.5 text-[9px] font-bold transition-all hover:bg-white/5 flex items-center gap-2"
                                      style={{ color: '#CCC', borderBottom: '1px solid #2A2A2E' }}>
                                      <Printer size={11} /> Reimprimir ticket
                                    </button>
                                    <button onClick={async () => { setActionMenuId(null); if (!confirm('Anular esta venta?')) return; try { await salesApi.update(sale._id, { estado: 'ANULADO' }); queryClient.invalidateQueries(['salesList']) } catch {} }}
                                      className="w-full text-left px-3 py-2.5 text-[9px] font-bold transition-all hover:bg-white/5 flex items-center gap-2"
                                      style={{ color: '#EF4444' }}>
                                      <Ban size={11} /> Anular venta
                                    </button>
                                  </div>
                                </>
                              )}
                            </div>
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
            {/* Pagination */}
            <div className="border-t px-4 py-2 flex items-center justify-between" style={{ borderColor: '#2A2A2E' }}>
              <p className="text-[8px] font-bold" style={{ color: '#5A5A5A' }}>
                Mostrando {data?.total ? Math.min((page - 1) * limit + 1, data.total) : 0} a {Math.min(page * limit, data?.total || 0)} de {data?.total || 0} ventas
              </p>
              <div className="flex items-center gap-1">
                <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
                  className="p-1.5 rounded border transition-all hover:bg-white/5 disabled:opacity-30" style={{ borderColor: '#2A2A2E' }}>
                  <ChevronLeft size={11} style={{ color: '#8A8A8A' }} />
                </button>
                {Array.from({ length: Math.min(5, data?.pages || 1) }, (_, i) => {
                  const start = Math.max(1, Math.min(page - 2, (data?.pages || 1) - 4))
                  const p = start + i
                  if (p > (data?.pages || 1)) return null
                  return (
                    <button key={p} onClick={() => setPage(p)}
                      className="w-6 h-6 rounded text-[9px] font-bold transition-all"
                      style={{ background: p === page ? '#F56B13' : 'transparent', color: p === page ? '#FFF' : '#5A5A5A' }}>
                      {p}
                    </button>
                  )
                })}
                {data && data.pages > 5 && <span className="text-[8px] font-bold px-1" style={{ color: '#5A5A5A' }}>...</span>}
                {data && data.pages > 5 && (
                  <button onClick={() => setPage(data.pages)}
                    className="w-6 h-6 rounded text-[9px] font-bold transition-all"
                    style={{ background: page === data.pages ? '#F56B13' : 'transparent', color: page === data.pages ? '#FFF' : '#5A5A5A' }}>
                    {data.pages}
                  </button>
                )}
                <button onClick={() => setPage(p => Math.min(data?.pages || 1, p + 1))} disabled={page === (data?.pages || 1)}
                  className="p-1.5 rounded border transition-all hover:bg-white/5 disabled:opacity-30" style={{ borderColor: '#2A2A2E' }}>
                  <ChevronRight size={11} style={{ color: '#8A8A8A' }} />
                </button>
              </div>
              <select value={limit} onChange={e => { setLimit(Number(e.target.value)); setPage(1) }}
                className="text-[8px] font-bold px-2 py-1 rounded border bg-transparent text-white outline-none cursor-pointer" style={{ borderColor: '#2A2A2E', background: '#18181B', color: '#8A8A8A' }}>
                <option value={8}>8 por pagina</option>
                <option value={15}>15 por pagina</option>
                <option value={25}>25 por pagina</option>
                <option value={50}>50 por pagina</option>
              </select>
            </div>
          </div>
        </div>

        {/* RIGHT SIDEBAR */}
        <div className="w-[280px] flex flex-col gap-3 shrink-0 overflow-y-auto">
          <div className="rounded-xl border p-4" style={{ background: '#111113', borderColor: '#2A2A2E' }}>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-[10px] font-black uppercase tracking-wider" style={{ color: '#8A8A8A' }}>Resumen por Periodo</h3>
              <span className="text-[9px] font-bold px-1.5 py-0.5 rounded" style={{ background: '#1A1A1D', color: '#F56B13' }}>Hoy</span>
            </div>
            <DonutChart breakdown={breakdown} />
          </div>
          <div className="rounded-xl border p-4" style={{ background: '#111113', borderColor: '#2A2A2E' }}>
            <h3 className="text-[10px] font-black uppercase tracking-wider mb-3" style={{ color: '#8A8A8A' }}>Ventas por Hora</h3>
            <HourlyChart hourly={hourlyData?.hourly} />
          </div>
          <div className="rounded-xl border p-4" style={{ background: '#111113', borderColor: '#2A2A2E' }}>
            <h3 className="text-[10px] font-black uppercase tracking-wider mb-3" style={{ color: '#8A8A8A' }}>Acciones Rapidas</h3>
            <div className="space-y-2">
              {[
                { label: 'Reporte de Ventas', sub: 'Ver reporte detallado', icon: BarChart3, color: '#F56B13', action: () => navigate('/reportes') },
                { label: 'Ventas por Periodo', sub: 'Analisis por fechas', icon: Calendar, color: '#10B981', action: () => {
                  const d = new Date(); const firstDay = new Date(d.getFullYear(), d.getMonth(), 1);
                  setFilters(f => ({ ...f, fecha_desde: firstDay.toISOString().split('T')[0], fecha_hasta: new Date().toISOString().split('T')[0] })) } },
                { label: 'Top Productos', sub: 'Productos mas vendidos', icon: Grid3X3, color: '#8B5CF6', action: () => setShowTopProducts(true) },
                { label: 'Exportar Todas las Ventas', sub: 'Descargar en Excel / PDF', icon: Download, color: '#3B82F6', action: () => {
                  if (!data?.sales?.length) return;
                  const rows = [['N° Venta','Fecha','Cliente','DNI','Tipo','Total','Estado','Metodo Pago','Sync']];
                  data.sales.forEach(s => { rows.push([`VTA-${String(s.correlativo).padStart(7,'0')}`,formatDate(s.fecha_emision),(s.cliente_nombre||'CLIENTE GENERAL').toUpperCase(),s.cliente_dni||'-',TIPO_LABELS[s.tipo_documento]||'Boleta',s.total.toFixed(2),(ESTADO_COLORS[s.estado]||{}).label||s.estado,s.metodo_pago||'EFECTIVO',s.sync?.sicce?'Si':'No']) });
                  const csv = rows.map(r => r.map(c => `"${String(c).replace(/"/g,'""')}"`).join(',')).join('\n');
                  const blob = new Blob(['\uFEFF'+csv], { type: 'text/csv;charset=utf-8;' });
                  const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = `ventas_${new Date().toISOString().split('T')[0]}.csv`; a.click();
                  URL.revokeObjectURL(a.href); } },
              ].map((a, i) => {
                const Icon = a.icon
                return (
                  <button key={i} onClick={a.action} className="w-full flex items-center gap-2.5 p-2 rounded-lg border hover:bg-white/[0.03] transition-all text-left" style={{ borderColor: '#2A2A2E' }}>
                    <div className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0" style={{ background: `${a.color}15` }}>
                      <Icon size={13} style={{ color: a.color }} />
                    </div>
                    <div>
                      <p className="text-[11px] font-bold text-white">{a.label}</p>
                      <p className="text-[9px] font-bold" style={{ color: '#5A5A5A' }}>{a.sub}</p>
                    </div>
                  </button>
                )
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Sale Detail Modal */}
      {detailSale && (
        <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ background: 'rgba(0,0,0,0.6)' }} onClick={() => setDetailSale(null)}>
          <div className="rounded-xl border p-5 w-[440px] max-h-[80vh] overflow-y-auto" style={{ background: '#111113', borderColor: '#2A2A2E' }}
            onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-[10px] font-black text-white uppercase tracking-wider">Detalle de Venta</h3>
              <button onClick={() => setDetailSale(null)} className="p-1 rounded hover:bg-white/5"><X size={14} style={{ color: '#8A8A8A' }} /></button>
            </div>
            <div className="space-y-3 text-[10px]">
              <div className="flex justify-between"><span style={{ color: '#5A5A5A' }}>N° Venta</span><span className="font-bold text-white" style={{ color: '#F56B13' }}>VTA-{String(detailSale.correlativo).padStart(7, '0')}</span></div>
              <div className="flex justify-between"><span style={{ color: '#5A5A5A' }}>Fecha / Hora</span><span className="font-bold text-white">{formatDate(detailSale.fecha_emision)} {detailSale.creado_en ? formatTime(new Date(detailSale.creado_en)) : ''}</span></div>
              <div className="flex justify-between"><span style={{ color: '#5A5A5A' }}>Tienda</span><span className="font-bold text-white">{detailSale.punto_venta || '-'}</span></div>
              <div className="flex justify-between"><span style={{ color: '#5A5A5A' }}>Caja</span><span className="font-bold text-white">{detailSale.caja || '-'}</span></div>
              <div className="flex justify-between"><span style={{ color: '#5A5A5A' }}>Cliente</span><span className="font-bold text-white">{(detailSale.cliente_nombre || 'CLIENTE GENERAL').toUpperCase()}</span></div>
              {detailSale.cliente_dni && <div className="flex justify-between"><span style={{ color: '#5A5A5A' }}>DNI/RUC</span><span className="font-bold text-white">{detailSale.cliente_dni}</span></div>}
              <div className="flex justify-between"><span style={{ color: '#5A5A5A' }}>Documento</span><span className="font-bold text-white">{TIPO_LABELS[detailSale.tipo_documento] || 'Boleta'} {detailSale.serie}-{detailSale.numero}</span></div>
              <div className="flex justify-between"><span style={{ color: '#5A5A5A' }}>Metodo de Pago</span><span className="font-bold text-white">{detailSale.metodo_pago || 'EFECTIVO'}</span></div>
              <div className="flex justify-between"><span style={{ color: '#5A5A5A' }}>Estado</span><span className={`font-bold`} style={{ color: (ESTADO_COLORS[detailSale.estado] || ESTADO_COLORS.COMPLETADO).color }}>{(ESTADO_COLORS[detailSale.estado] || ESTADO_COLORS.COMPLETADO).label}</span></div>
              <div className="flex justify-between"><span style={{ color: '#5A5A5A' }}>Sync SICCE</span><span className="font-bold text-white">{detailSale.sync?.sicce ? 'Sincronizado' : 'Pendiente'}</span></div>
            </div>
            <div className="mt-4 pt-3 border-t" style={{ borderColor: '#2A2A2E' }}>
              <p className="text-[9px] font-bold uppercase tracking-wider mb-2" style={{ color: '#5A5A5A' }}>Productos</p>
              {detailSale.items?.map((item, i) => (
                <div key={i} className="flex justify-between text-[10px] py-1">
                  <span style={{ color: '#CCC' }}>{item.descripcion} <span style={{ color: '#5A5A5A' }}>x{item.cantidad}</span></span>
                  <span className="font-bold text-white">S/ {Number(item.total_item).toFixed(2)}</span>
                </div>
              ))}
            </div>
            <div className="mt-3 pt-3 border-t space-y-1" style={{ borderColor: '#2A2A2E' }}>
              <div className="flex justify-between text-[10px]"><span style={{ color: '#5A5A5A' }}>Subtotal</span><span className="text-white">S/ {Number(detailSale.subtotal).toFixed(2)}</span></div>
              <div className="flex justify-between text-[10px]"><span style={{ color: '#5A5A5A' }}>IGV (18%)</span><span className="text-white">S/ {Number(detailSale.igv).toFixed(2)}</span></div>
              <div className="flex justify-between text-sm pt-1 border-t" style={{ borderColor: '#2A2A2E' }}>
                <span className="font-black text-white">TOTAL</span>
                <span className="font-black" style={{ color: '#10B981' }}>S/ {Number(detailSale.total).toFixed(2)}</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Top Products Modal */}
      {showTopProducts && (
        <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ background: 'rgba(0,0,0,0.6)' }} onClick={() => setShowTopProducts(false)}>
          <div className="rounded-xl border p-5 w-[440px] max-h-[80vh] overflow-y-auto" style={{ background: '#111113', borderColor: '#2A2A2E' }}
            onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-[10px] font-black text-white uppercase tracking-wider">Top 10 Productos mas Vendidos</h3>
              <button onClick={() => setShowTopProducts(false)} className="p-1 rounded hover:bg-white/5"><X size={14} style={{ color: '#8A8A8A' }} /></button>
            </div>
            {!topProductsData ? (
              <p className="text-[10px] font-bold py-8 text-center" style={{ color: '#5A5A5A' }}>Cargando...</p>
            ) : topProductsData.length === 0 ? (
              <p className="text-[10px] font-bold py-8 text-center" style={{ color: '#5A5A5A' }}>Sin datos de productos vendidos</p>
            ) : (
              <div className="space-y-2">
                {topProductsData.map((p, i) => (
                  <div key={i} className="flex items-center gap-3 p-2.5 rounded-lg" style={{ background: 'rgba(26,26,29,0.5)', border: '1px solid rgba(255,255,255,0.06)' }}>
                    <span className="text-[11px] font-black w-5 text-center" style={{ color: '#F56B13' }}>#{i+1}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-[11px] font-bold text-white truncate">{p.producto}</p>
                      <p className="text-[9px]" style={{ color: '#5A5A5A' }}>{p.cantidad} unidades</p>
                    </div>
                    <span className="text-[11px] font-black" style={{ color: '#10B981' }}>{formatCurrency(p.total)}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Sync Date Modal */}
      {showDateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ background: 'rgba(0,0,0,0.6)' }}>
          <div className="rounded-xl border p-5 w-[320px]" style={{ background: '#111113', borderColor: '#2A2A2E' }}>
            <h3 className="text-[10px] font-black text-white uppercase tracking-wider mb-4">Enviar por fecha</h3>
            <div className="space-y-3">
              <div>
                <p className="text-[8px] font-bold mb-1" style={{ color: '#5A5A5A' }}>Desde</p>
                <input type="date" value={syncFecha.desde} onChange={e => setSyncFecha(f => ({...f, desde: e.target.value}))}
                  className="w-full text-[9px] px-3 py-2 rounded-lg border bg-transparent text-white outline-none" style={{ borderColor: '#2A2A2E', colorScheme: 'dark' }} />
              </div>
              <div>
                <p className="text-[8px] font-bold mb-1" style={{ color: '#5A5A5A' }}>Hasta</p>
                <input type="date" value={syncFecha.hasta} onChange={e => setSyncFecha(f => ({...f, hasta: e.target.value}))}
                  className="w-full text-[9px] px-3 py-2 rounded-lg border bg-transparent text-white outline-none" style={{ borderColor: '#2A2A2E', colorScheme: 'dark' }} />
              </div>
              <div>
                <p className="text-[8px] font-bold mb-1" style={{ color: '#5A5A5A' }}>Paginas (max 10)</p>
                <input type="number" min={1} max={10} value={paginasInput} onChange={e => setPaginasInput(Math.min(10, Math.max(1, Number(e.target.value) || 1)))}
                  className="w-full text-[9px] px-3 py-2 rounded-lg border bg-transparent text-white outline-none" style={{ borderColor: '#2A2A2E' }} />
              </div>
            </div>
            <div className="flex items-center justify-end gap-2 mt-4">
              <button onClick={() => setShowDateModal(false)} className="text-[8px] font-bold px-3 py-1.5 rounded-lg border hover:bg-white/5 transition-all" style={{ borderColor: '#2A2A2E', color: '#8A8A8A' }}>
                Cancelar
              </button>
              <button onClick={() => handleExport('fecha')} className="text-[8px] font-bold px-3 py-1.5 rounded-lg transition-all" style={{ background: '#F56B13', color: '#FFF' }}>
                Enviar a SICCE
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
