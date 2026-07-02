import { useState, useEffect } from 'react'
import { DollarSign, Clock, TrendingUp, BarChart3, X, CheckCircle, AlertCircle, History, Download, Plus, Minus, CreditCard, Smartphone, Wallet, LogOut, Building2, ChevronDown, MapPin, Activity, FileText } from 'lucide-react'
import { cashRegisterApi, salesApi } from '../../services/api'
import jsPDF from 'jspdf'

export default function PosDashboard({ company, user, puntoVenta, onLogout, onSwitchCompany, companies, simplified }) {
  const [shift, setShift] = useState(null)
  const [todayData, setTodayData] = useState({ total: 0, count: 0 })
  const [loading, setLoading] = useState(true)
  const [showOpenShift, setShowOpenShift] = useState(false)
  const [showCloseShift, setShowCloseShift] = useState(false)
  const [showMovement, setShowMovement] = useState(false)
  const [movementTipo, setMovementTipo] = useState('INGRESO')
  const [historyShifts, setHistoryShifts] = useState([])
  const [showHistory, setShowHistory] = useState(false)
  const [montoInicial, setMontoInicial] = useState('')
  const [montoFinal, setMontoFinal] = useState('')
  const [movementMonto, setMovementMonto] = useState('')
  const [movementMotivo, setMovementMotivo] = useState('')
  const [notas, setNotas] = useState('')
  const [successMsg, setSuccessMsg] = useState('')

  useEffect(() => { loadData() }, [])

  const loadData = async () => {
    setLoading(true)
    try {
      const res = await cashRegisterApi.getCurrent()
      setShift(res.data.shift)
      setTodayData(res.data.todaySales)
    } catch {} finally { setLoading(false) }
  }

  const handleOpenShift = async () => {
    try {
      const res = await cashRegisterApi.openShift({ monto_inicial: parseFloat(montoInicial) || 0, notas: notas.toUpperCase() })
      setShift(res.data)
      setShowOpenShift(false)
      setMontoInicial('')
      setNotas('')
      setSuccessMsg('TURNO ABIERTO — S/ ' + (parseFloat(montoInicial) || 0).toFixed(2))
      setTimeout(() => setSuccessMsg(''), 3000)
    } catch (err) { alert(err.response?.data?.message || err.message) }
  }

  const handleCloseShift = async () => {
    try {
      const res = await cashRegisterApi.closeShift(shift._id, { monto_final_real: parseFloat(montoFinal) || 0 })
      setShift(res.data)
      setShowCloseShift(false)
      setMontoFinal('')
      setSuccessMsg('TURNO CERRADO')
      setTimeout(() => setSuccessMsg(''), 3000)
    } catch (err) { alert(err.response?.data?.message || err.message) }
  }

  const handleAddMovement = async () => {
    if (!movementMonto || parseFloat(movementMonto) <= 0) return
    try {
      const res = await cashRegisterApi.addMovement(shift._id, {
        tipo: movementTipo, monto: parseFloat(movementMonto), motivo: movementMotivo.toUpperCase()
      })
      setShift(res.data)
      setShowMovement(false)
      setMovementMonto('')
      setMovementMotivo('')
      setSuccessMsg(movementTipo + ' REGISTRADO — S/ ' + parseFloat(movementMonto).toFixed(2))
      setTimeout(() => setSuccessMsg(''), 3000)
    } catch (err) { alert(err.response?.data?.message || err.message) }
  }

  const loadHistory = async () => {
    try {
      const res = await cashRegisterApi.getHistory({ limit: 30 })
      setHistoryShifts(res.data.shifts || [])
      setShowHistory(true)
    } catch {}
  }

  const exportPDF = () => {
    if (!shift) return
    const doc = new jsPDF()
    const pageW = doc.internal.pageSize.getWidth()

    doc.setFontSize(16)
    doc.text('REPORTE DE CIERRE DE CAJA', pageW / 2, 20, { align: 'center' })
    doc.setFontSize(9)
    doc.text(company?.name || 'SIGP', pageW / 2, 27, { align: 'center' })

    doc.setFontSize(10)
    doc.text('DATOS DEL TURNO', 14, 40)
    doc.setFontSize(9)
    const info = [
      ['Cajero', shift.cajero_nombre || '—'],
      ['Apertura', new Date(shift.apertura).toLocaleString('es-PE')],
      ['Cierre', shift.cierre ? new Date(shift.cierre).toLocaleString('es-PE') : '—'],
      ['Estado', shift.estado],
    ]
    let y = 47
    info.forEach(([l, v]) => { doc.text(l + ': ' + v, 20, y); y += 6 })

    y += 5
    doc.setFontSize(10)
    doc.text('RESUMEN FINANCIERO', 14, y)
    y += 7
    doc.setFontSize(9)
    const finanzas = [
      ['Monto Inicial', 'S/ ' + (shift.monto_inicial || 0).toFixed(2)],
      ['Total Ventas', 'S/ ' + (shift.ventas_total || 0).toFixed(2)],
      ['Total Mov. Ingreso', 'S/ ' + (shift.movimientos?.filter(m => m.tipo === 'INGRESO').reduce((a, m) => a + m.monto, 0) || 0).toFixed(2)],
      ['Total Mov. Egreso', 'S/ ' + (shift.movimientos?.filter(m => m.tipo === 'EGRESO').reduce((a, m) => a + m.monto, 0) || 0).toFixed(2)],
      ['Monto Final Esperado', 'S/ ' + (shift.monto_final_esperado || 0).toFixed(2)],
      ['Monto Final Real', 'S/ ' + (shift.monto_final_real || 0).toFixed(2)],
      ['Diferencia', 'S/ ' + (shift.diferencia || 0).toFixed(2)],
    ]
    finanzas.forEach(([l, v]) => { doc.text(l, 20, y); doc.text(v, pageW - 20, y, { align: 'right' }); y += 6 })

    if (shift.movimientos?.length > 0) {
      y += 5
      doc.setFontSize(10)
      doc.text('MOVIMIENTOS', 14, y)
      y += 6
      doc.setFontSize(8)
      shift.movimientos.forEach(m => {
        doc.text((m.tipo === 'INGRESO' ? '+ ' : '- ') + 'S/ ' + m.monto.toFixed(2) + ' — ' + (m.motivo || 'SIN MOTIVO'), 20, y)
        y += 4
      })
    }

    doc.save('cierre-caja-' + shift._id?.substring(0, 8) + '.pdf')
  }

  const totalIngresos = shift?.movimientos?.filter(m => m.tipo === 'INGRESO').reduce((a, m) => a + m.monto, 0) || 0
  const totalEgresos = shift?.movimientos?.filter(m => m.tipo === 'EGRESO').reduce((a, m) => a + m.monto, 0) || 0

  return (
    <div className={`${simplified ? 'h-full' : 'h-screen'} flex flex-col`} style={{ background: 'rgba(10,10,11,0.8)' }}>
      {/* ═══ TOP BAR ═══ */}
      <div className="glass flex items-center justify-between px-5 py-2 shrink-0" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg" style={{ background: 'rgba(245,107,19,0.12)' }}>
            <MapPin size={14} style={{ color: '#F56B13' }} />
            <div>
              <p className="text-[7px] font-bold uppercase tracking-wider" style={{ color: '#5A5A5A' }}>CAJA</p>
              <p className="text-[11px] font-black tracking-tight" style={{ color: '#F56B13' }}>{puntoVenta || 'SIN PUNTO'}</p>
            </div>
          </div>
          <button onClick={onSwitchCompany} className="btn-relief flex items-center gap-1.5 px-2 py-1 rounded-lg">
            <Building2 size={12} style={{ color: '#5A5A5A' }} />
            <p className="text-[10px] font-bold text-white uppercase tracking-wider">{company?.name || 'SIGP'}</p>
            {companies?.length > 1 && <ChevronDown size={10} style={{ color: '#5A5A5A' }} />}
          </button>
          <span className="px-1.5 py-0.5 rounded text-[8px] font-bold uppercase" style={{ background: 'rgba(245,107,19,0.15)', color: '#F56B13' }}>{user?.role}</span>
          <span className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase ${shift ? 'text-[#10B981]' : 'text-[#EF4444]'}`}
            style={{ background: shift ? 'rgba(16,185,129,0.1)' : 'rgba(239,68,68,0.1)' }}>
            {shift ? 'TURNO ABIERTO' : 'SIN TURNO'}
          </span>
        </div>
        <div className="flex items-center gap-3">
          {successMsg && (
            <div className="px-3 py-1.5 rounded-lg text-[11px] font-bold animate-slide-up flex items-center gap-1.5" style={{ background: 'rgba(16,185,129,0.15)', color: '#10B981' }}>
              <CheckCircle size={13} /> {successMsg}
            </div>
          )}
          <div className="flex items-center gap-3">
            <button onClick={() => loadHistory()} className="btn-relief-outline px-3 py-1.5 rounded-lg text-[9px] font-bold uppercase tracking-wider flex items-center gap-1">
              <History size={12} /> HISTORIAL
            </button>
            {!simplified && (
              <button onClick={onLogout} className="btn-relief p-1.5 rounded-lg" title="Cerrar sesion">
                <LogOut size={14} style={{ color: '#5A5A5A' }} />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* ═══ MAIN CONTENT ═══ */}
      <div className="flex-1 overflow-y-auto p-6">
        {loading ? (
          <div className="grid grid-cols-3 gap-4 mb-6">
            {[1,2,3].map(i => <div key={i} className="h-32 rounded-xl animate-pulse glass-card" />)}
          </div>
        ) : (
          <>
            {/* ─── STATUS CARDS ─── */}
            <div className="grid grid-cols-4 gap-4 mb-6">
              <div className="glass-card p-4 rounded-xl">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-9 h-9 rounded-lg flex items-center justify-center" style={{ background: 'rgba(245,107,19,0.12)' }}>
                    <DollarSign size={16} style={{ color: '#F56B13' }} />
                  </div>
                </div>
                <p className="text-[9px] font-bold uppercase tracking-wider" style={{ color: '#5A5A5A' }}>VENTAS HOY</p>
                <p className="text-lg font-black text-white mt-0.5">S/ {todayData.total.toFixed(2)}</p>
                <p className="text-[10px] mt-0.5" style={{ color: '#5A5A5A' }}>{todayData.count} TRANSACCIONES</p>
              </div>

              <div className="glass-card p-4 rounded-xl">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-9 h-9 rounded-lg flex items-center justify-center" style={{ background: 'rgba(16,185,129,0.12)' }}>
                    <TrendingUp size={16} style={{ color: '#10B981' }} />
                  </div>
                </div>
                <p className="text-[9px] font-bold uppercase tracking-wider" style={{ color: '#5A5A5A' }}>INGRESOS CAJA</p>
                <p className="text-lg font-black text-white mt-0.5">S/ {totalIngresos.toFixed(2)}</p>
                <p className="text-[10px] mt-0.5" style={{ color: '#5A5A5A' }}>MOVIMIENTOS MANUALES</p>
              </div>

              <div className="glass-card p-4 rounded-xl">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-9 h-9 rounded-lg flex items-center justify-center" style={{ background: 'rgba(239,68,68,0.12)' }}>
                    <Minus size={16} style={{ color: '#EF4444' }} />
                  </div>
                </div>
                <p className="text-[9px] font-bold uppercase tracking-wider" style={{ color: '#5A5A5A' }}>EGRESOS CAJA</p>
                <p className="text-lg font-black text-white mt-0.5">S/ {totalEgresos.toFixed(2)}</p>
                <p className="text-[10px] mt-0.5" style={{ color: '#5A5A5A' }}>SALIDAS MANUALES</p>
              </div>

              <div className="glass-card p-4 rounded-xl" style={{ borderColor: shift ? 'rgba(16,185,129,0.3)' : 'rgba(239,68,68,0.3)' }}>
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-9 h-9 rounded-lg flex items-center justify-center" style={{ background: shift ? 'rgba(16,185,129,0.12)' : 'rgba(239,68,68,0.12)' }}>
                    <Clock size={16} style={{ color: shift ? '#10B981' : '#EF4444' }} />
                  </div>
                </div>
                <p className="text-[9px] font-bold uppercase tracking-wider" style={{ color: '#5A5A5A' }}>TURNO</p>
                <p className="text-lg font-black text-white mt-0.5">{shift ? 'ABIERTO' : 'CERRADO'}</p>
                <p className="text-[10px] mt-0.5" style={{ color: '#5A5A5A' }}>
                  {shift ? new Date(shift.apertura).toLocaleTimeString('es-PE') : 'SIN TURNO ACTIVO'}
                </p>
              </div>
            </div>

            {/* ─── TURN ACTIONS ─── */}
            <div className="flex gap-3 mb-6">
              {!shift ? (
                <button onClick={() => setShowOpenShift(true)} className="btn-relief-accent px-6 py-3 rounded-xl text-[11px] font-bold uppercase tracking-wider flex items-center gap-2">
                  <Clock size={16} /> ABRIR TURNO
                </button>
              ) : (
                <>
                  <button onClick={() => setShowMovement(true)} className="btn-relief-accent px-4 py-2.5 rounded-xl text-[10px] font-bold uppercase tracking-wider flex items-center gap-1.5">
                    <Plus size={14} /> INGRESO / EGRESO
                  </button>
                  <button onClick={() => setShowCloseShift(true)} className="px-4 py-2.5 rounded-xl text-[10px] font-bold uppercase tracking-wider flex items-center gap-1.5"
                    style={{ background: 'linear-gradient(180deg, #EF4444, #DC2626)', color: 'white', boxShadow: '0 2px 8px rgba(239,68,68,0.3)' }}>
                    <X size={14} /> CERRAR TURNO
                  </button>
                  <button onClick={exportPDF} className="btn-relief-outline px-4 py-2.5 rounded-xl text-[10px] font-bold uppercase tracking-wider flex items-center gap-1.5">
                    <Download size={14} /> REPORTE PDF
                  </button>
                </>
              )}
            </div>

            <div className="grid grid-cols-3 gap-4 mb-6">
              {/* ─── MOVEMENTS LOG ─── */}
              <div className="col-span-2 glass-card p-5 rounded-xl">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-sm font-black text-white uppercase tracking-wider">MOVIMIENTOS DE CAJA</h2>
                  {shift && (
                    <span className="text-[10px]" style={{ color: '#5A5A5A' }}>{shift.movimientos?.length || 0} REGISTROS</span>
                  )}
                </div>

                {!shift ? (
                  <div className="flex flex-col items-center justify-center py-8 text-center">
                    <AlertCircle size={28} style={{ color: '#2A2A2E' }} className="mb-2" />
                    <p className="text-[11px]" style={{ color: '#5A5A5A' }}>ABRE UN TURNO PARA REGISTRAR MOVIMIENTOS</p>
                  </div>
                ) : shift.movimientos?.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-8 text-center">
                    <Activity size={28} style={{ color: '#2A2A2E' }} className="mb-2" />
                    <p className="text-[11px]" style={{ color: '#5A5A5A' }}>SIN MOVIMIENTOS EN ESTE TURNO</p>
                  </div>
                ) : (
                  <div className="space-y-1 max-h-64 overflow-y-auto">
                    {shift.movimientos.map((m, i) => (
                      <div key={i} className="flex items-center justify-between py-2 px-3 rounded-lg" style={{ background: 'rgba(255,255,255,0.03)' }}>
                        <div className="flex items-center gap-3">
                          <div className={`w-2 h-2 rounded-full ${m.tipo === 'INGRESO' ? 'bg-[#10B981]' : 'bg-[#EF4444]'}`} />
                          <div>
                            <p className="text-[11px] font-bold text-white">{m.tipo}</p>
                            <p className="text-[9px]" style={{ color: '#5A5A5A' }}>{m.motivo || 'SIN MOTIVO'}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className={`text-[12px] font-black ${m.tipo === 'INGRESO' ? 'text-[#10B981]' : 'text-[#EF4444]'}`}>
                            {m.tipo === 'INGRESO' ? '+ ' : '- '}S/ {m.monto.toFixed(2)}
                          </p>
                          <p className="text-[8px]" style={{ color: '#3A3A3E' }}>
                            {m.creado_en ? new Date(m.creado_en).toLocaleTimeString('es-PE') : ''}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* ─── SHIFT INFO ─── */}
              <div className="glass-card p-5 rounded-xl">
                <h2 className="text-sm font-black text-white uppercase tracking-wider mb-4">INFO DEL TURNO</h2>
                {!shift ? (
                  <div className="flex flex-col items-center justify-center py-8 text-center">
                    <Clock size={28} style={{ color: '#2A2A2E' }} className="mb-2" />
                    <p className="text-[11px]" style={{ color: '#5A5A5A' }}>NO HAY TURNO ACTIVO</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div className="flex justify-between py-1.5 px-3 rounded-lg text-[11px]" style={{ background: 'rgba(255,255,255,0.03)' }}>
                      <span style={{ color: '#5A5A5A' }}>CAJERO</span>
                      <span className="font-bold text-white">{shift.cajero_nombre || '—'}</span>
                    </div>
                    <div className="flex justify-between py-1.5 px-3 rounded-lg text-[11px]" style={{ background: 'rgba(255,255,255,0.03)' }}>
                      <span style={{ color: '#5A5A5A' }}>APERTURA</span>
                      <span className="font-bold text-white">{new Date(shift.apertura).toLocaleString('es-PE')}</span>
                    </div>
                    <div className="flex justify-between py-1.5 px-3 rounded-lg text-[11px]" style={{ background: 'rgba(255,255,255,0.03)' }}>
                      <span style={{ color: '#5A5A5A' }}>MONTO INICIAL</span>
                      <span className="font-bold" style={{ color: '#F56B13' }}>S/ {(shift.monto_inicial || 0).toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between py-1.5 px-3 rounded-lg text-[11px]" style={{ background: 'rgba(255,255,255,0.03)' }}>
                      <span style={{ color: '#5A5A5A' }}>VENTAS TOTAL</span>
                      <span className="font-bold" style={{ color: '#10B981' }}>S/ {(shift.ventas_total || 0).toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between py-1.5 px-3 rounded-lg text-[11px]" style={{ background: 'rgba(255,255,255,0.03)' }}>
                      <span style={{ color: '#5A5A5A' }}>INGRESOS (MANUAL)</span>
                      <span className="font-bold" style={{ color: '#10B981' }}>S/ {totalIngresos.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between py-1.5 px-3 rounded-lg text-[11px]" style={{ background: 'rgba(255,255,255,0.03)' }}>
                      <span style={{ color: '#5A5A5A' }}>EGRESOS (MANUAL)</span>
                      <span className="font-bold" style={{ color: '#EF4444' }}>S/ {totalEgresos.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between py-2 px-3 rounded-lg text-xs" style={{ background: 'rgba(245,107,19,0.08)' }}>
                      <span className="font-bold" style={{ color: '#5A5A5A' }}>SALDO ESTIMADO</span>
                      <span className="text-base font-black" style={{ color: '#F56B13' }}>
                        S/ {((shift.monto_inicial || 0) + totalIngresos - totalEgresos + (shift.ventas_total || 0)).toFixed(2)}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </>
        )}
      </div>

      {/* ═══ OPEN SHIFT MODAL ═══ */}
      {showOpenShift && (
        <div className="fixed inset-0 glass-modal-overlay flex items-center justify-center z-50" onClick={() => setShowOpenShift(false)}>
          <div className="glass-modal rounded-2xl p-6 max-w-sm w-full mx-4 animate-slide-up" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-black text-white uppercase tracking-wider">ABRIR TURNO</h3>
              <button onClick={() => setShowOpenShift(false)} className="btn-relief p-1.5 rounded-lg"><X size={16} style={{ color: '#5A5A5A' }} /></button>
            </div>
            <div className="space-y-4">
              <div className="space-y-1">
                <label className="text-[9px] font-bold uppercase tracking-wider" style={{ color: '#5A5A5A' }}>MONTO INICIAL</label>
                <input className="glass-input w-full px-3 py-2 rounded-lg text-[13px]" type="number" step="0.01" placeholder="0.00"
                  value={montoInicial} onChange={e => setMontoInicial(e.target.value)} />
              </div>
              <div className="space-y-1">
                <label className="text-[9px] font-bold uppercase tracking-wider" style={{ color: '#5A5A5A' }}>NOTAS (OPCIONAL)</label>
                <input className="glass-input w-full px-3 py-2 rounded-lg text-[13px]" placeholder="OBSERVACIONES"
                  value={notas} onChange={e => setNotas(e.target.value.toUpperCase())} />
              </div>
              <button onClick={handleOpenShift} className="btn-relief-accent w-full py-2.5 rounded-lg text-[10px] font-bold uppercase tracking-wider">
                ABRIR TURNO
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ═══ CLOSE SHIFT MODAL ═══ */}
      {showCloseShift && (
        <div className="fixed inset-0 glass-modal-overlay flex items-center justify-center z-50" onClick={() => setShowCloseShift(false)}>
          <div className="glass-modal rounded-2xl p-6 max-w-sm w-full mx-4 animate-slide-up" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-black text-white uppercase tracking-wider">CERRAR TURNO</h3>
              <button onClick={() => setShowCloseShift(false)} className="btn-relief p-1.5 rounded-lg"><X size={16} style={{ color: '#5A5A5A' }} /></button>
            </div>

            <div className="space-y-3 text-sm mb-4">
              <div className="flex justify-between py-1"><span style={{ color: '#5A5A5A' }}>VENTAS DEL TURNO</span><span className="font-bold text-white">{shift?.ventas_count || 0}</span></div>
              <div className="flex justify-between py-1"><span style={{ color: '#5A5A5A' }}>TOTAL VENTAS</span><span className="font-bold" style={{ color: '#10B981' }}>S/ {(shift?.ventas_total || 0).toFixed(2)}</span></div>
              <div className="flex justify-between py-1"><span style={{ color: '#5A5A5A' }}>INGRESOS MANUALES</span><span className="font-bold" style={{ color: '#10B981' }}>S/ {totalIngresos.toFixed(2)}</span></div>
              <div className="flex justify-between py-1"><span style={{ color: '#5A5A5A' }}>EGRESOS MANUALES</span><span className="font-bold" style={{ color: '#EF4444' }}>S/ {totalEgresos.toFixed(2)}</span></div>
              <div className="border-t pt-2 space-y-1" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
                <div className="flex justify-between"><span style={{ color: '#5A5A5A' }}>MONTO INICIAL</span><span className="text-white">S/ {(shift?.monto_inicial || 0).toFixed(2)}</span></div>
                <div className="flex justify-between"><span className="font-bold text-white">SALDO ESPERADO</span>
                  <span className="font-black" style={{ color: '#F56B13' }}>
                    S/ {((shift?.monto_inicial || 0) + totalIngresos - totalEgresos + (shift?.ventas_total || 0)).toFixed(2)}
                  </span>
                </div>
              </div>
              <div className="space-y-1 pt-2">
                <label className="text-[9px] font-bold uppercase tracking-wider" style={{ color: '#5A5A5A' }}>MONTO REAL EN CAJA</label>
                <input className="glass-input w-full px-3 py-2 rounded-lg text-[13px]" type="number" step="0.01"
                  placeholder="INGRESA EL MONTO CONTADO"
                  value={montoFinal} onChange={e => setMontoFinal(e.target.value)} />
              </div>
            </div>

            <div className="flex gap-2">
              <button onClick={() => setShowCloseShift(false)} className="btn-relief-outline flex-1 py-2.5 rounded-lg text-[10px] font-bold uppercase tracking-wider">CANCELAR</button>
              <button onClick={handleCloseShift} className="flex-1 py-2.5 rounded-lg text-[10px] font-bold uppercase tracking-wider text-white"
                style={{ background: 'linear-gradient(180deg, #EF4444, #DC2626)' }}>
                CERRAR TURNO
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ═══ MOVEMENT MODAL ═══ */}
      {showMovement && (
        <div className="fixed inset-0 glass-modal-overlay flex items-center justify-center z-50" onClick={() => setShowMovement(false)}>
          <div className="glass-modal rounded-2xl p-6 max-w-sm w-full mx-4 animate-slide-up" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-black text-white uppercase tracking-wider">MOVIMIENTO DE CAJA</h3>
              <button onClick={() => setShowMovement(false)} className="btn-relief p-1.5 rounded-lg"><X size={16} style={{ color: '#5A5A5A' }} /></button>
            </div>
            <div className="space-y-4">
              <div className="flex gap-2">
                <button onClick={() => setMovementTipo('INGRESO')}
                  className={`flex-1 py-2.5 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all ${movementTipo === 'INGRESO' ? 'btn-relief-accent' : 'btn-relief'}`}>
                  <Plus size={14} className="inline mr-1" /> INGRESO
                </button>
                <button onClick={() => setMovementTipo('EGRESO')}
                  className={`flex-1 py-2.5 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all ${movementTipo === 'EGRESO' ? 'px-4 py-2.5 rounded-lg text-[10px] font-bold uppercase' : 'btn-relief'}`}
                  style={movementTipo === 'EGRESO' ? { background: 'linear-gradient(180deg, #EF4444, #DC2626)', color: 'white', boxShadow: '0 2px 8px rgba(239,68,68,0.3)' } : {}}>
                  <Minus size={14} className="inline mr-1" /> EGRESO
                </button>
              </div>
              <div className="space-y-1">
                <label className="text-[9px] font-bold uppercase tracking-wider" style={{ color: '#5A5A5A' }}>MONTO</label>
                <input className="glass-input w-full px-3 py-2 rounded-lg text-[13px]" type="number" step="0.01" placeholder="0.00"
                  value={movementMonto} onChange={e => setMovementMonto(e.target.value)} />
              </div>
              <div className="space-y-1">
                <label className="text-[9px] font-bold uppercase tracking-wider" style={{ color: '#5A5A5A' }}>MOTIVO</label>
                <input className="glass-input w-full px-3 py-2 rounded-lg text-[13px]" placeholder="DESCRIPCION DEL MOVIMIENTO"
                  value={movementMotivo} onChange={e => setMovementMotivo(e.target.value.toUpperCase())} />
              </div>
              <button onClick={handleAddMovement} className="btn-relief-accent w-full py-2.5 rounded-lg text-[10px] font-bold uppercase tracking-wider">
                REGISTRAR {movementTipo}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ═══ HISTORY MODAL ═══ */}
      {showHistory && (
        <div className="fixed inset-0 glass-modal-overlay flex items-center justify-center z-50" onClick={() => setShowHistory(false)}>
          <div className="glass-modal rounded-2xl p-6 max-w-3xl w-full mx-4 max-h-[85vh] overflow-y-auto animate-slide-up" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-black text-white uppercase tracking-wider">HISTORIAL DE TURNOS</h3>
              <button onClick={() => setShowHistory(false)} className="btn-relief p-1.5 rounded-lg"><X size={16} style={{ color: '#5A5A5A' }} /></button>
            </div>
            {historyShifts.length === 0 ? (
              <p className="text-center py-8 text-[11px]" style={{ color: '#5A5A5A' }}>SIN TURNOS REGISTRADOS</p>
            ) : (
              <div className="space-y-2">
                {historyShifts.map(s => (
                  <div key={s._id} className="glass-card p-3 rounded-lg">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-[11px] font-bold text-white">{s.cajero_nombre || '—'}</p>
                        <p className="text-[9px]" style={{ color: '#5A5A5A' }}>
                          {new Date(s.apertura).toLocaleDateString('es-PE')} — {new Date(s.apertura).toLocaleTimeString('es-PE')}
                          {s.cierre ? ' → ' + new Date(s.cierre).toLocaleTimeString('es-PE') : ''}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-[11px] font-black" style={{ color: '#F56B13' }}>S/ {(s.ventas_total || 0).toFixed(2)}</p>
                        <span className={`px-1.5 py-0.5 rounded text-[8px] font-bold uppercase ${s.estado === 'ABIERTO' ? 'text-[#10B981]' : 'text-[#5A5A5A]'}`}
                          style={{ background: s.estado === 'ABIERTO' ? 'rgba(16,185,129,0.1)' : 'rgba(255,255,255,0.05)' }}>
                          {s.estado}
                        </span>
                        {s.diferencia !== undefined && s.diferencia !== 0 && (
                          <span className={`ml-1 px-1.5 py-0.5 rounded text-[8px] font-bold uppercase ${s.diferencia > 0 ? 'text-[#10B981]' : 'text-[#EF4444]'}`}
                            style={{ background: s.diferencia > 0 ? 'rgba(16,185,129,0.1)' : 'rgba(239,68,68,0.1)' }}>
                            DIF: S/ {(s.diferencia || 0).toFixed(2)}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
