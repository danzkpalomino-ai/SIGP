import { useState, useEffect } from 'react'
import { X, Download, CheckSquare, Square, ChevronLeft, ChevronRight, AlertCircle, CheckCircle, Package, Users, Truck } from 'lucide-react'
import { syncApi } from '../services/api'

const TABS = [
  { id: 'products', label: 'PRODUCTOS', icon: Package },
  { id: 'clientes', label: 'CLIENTES', icon: Users },
  { id: 'proveedores', label: 'PROVEEDORES', icon: Truck },
]

export default function ImportFromSICCEModal({ onClose, initialTab }) {
  const [tab, setTab] = useState(initialTab || 'products')
  const [items, setItems] = useState([])
  const [selected, setSelected] = useState(new Set())
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(0)
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [importing, setImporting] = useState(false)
  const [result, setResult] = useState(null)
  const [selectAll, setSelectAll] = useState(false)

  const loadPage = async (p) => {
    setLoading(true)
    try {
      let res
      if (tab === 'products') {
        res = await syncApi.getImportPreview({ page: p, limit: 100 })
        setItems(res.data.products || [])
      } else {
        const type = tab === 'clientes' ? 'CLIENTE' : 'PROVEEDOR'
        res = await syncApi.getImportContactsPreview({ page: p, limit: 100, type })
        setItems(res.data.contacts || [])
      }
      setTotalPages(res.data.pages || 0)
      setTotal(res.data.total || 0)
      setPage(p)
      setSelectAll(false)
      setSelected(new Set())
    } catch (err) { console.error(err) } finally { setLoading(false) }
  }

  useEffect(() => { loadPage(1) }, [tab])

  const toggleItem = (id) => {
    const next = new Set(selected)
    if (next.has(id)) next.delete(id); else next.add(id)
    setSelected(next)
    setSelectAll(next.size === items.length && items.length > 0)
  }

  const toggleSelectAll = () => {
    if (selectAll) { setSelected(new Set()); setSelectAll(false) }
    else { setSelected(new Set(items.map(i => i._id))); setSelectAll(true) }
  }

  const handleImport = async () => {
    if (selected.size === 0) return
    setImporting(true)
    try {
      let res
      if (tab === 'products') {
        res = await syncApi.confirmImport({ product_ids: Array.from(selected) })
      } else {
        res = await syncApi.confirmImportContacts({ contact_ids: Array.from(selected), type: tab === 'clientes' ? 'CLIENTE' : 'PROVEEDOR' })
      }
      setResult(res.data)
    } catch (err) { alert('Error: ' + (err.response?.data?.message || err.message)) } finally { setImporting(false) }
  }

  const labelSingular = tab === 'products' ? 'PRODUCTO' : tab === 'clientes' ? 'CLIENTE' : 'PROVEEDOR'

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ background: 'rgba(0,0,0,0.7)' }} onClick={onClose}>
      <div className="rounded-2xl w-full max-w-5xl mx-4 max-h-[90vh] overflow-hidden animate-slide-up" style={{ background: '#121214', border: '1px solid rgba(255,255,255,0.08)' }}
        onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between px-6 py-4 border-b" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
          <div>
            <h2 className="text-sm font-black text-white uppercase tracking-wider">IMPORTAR DESDE SICCE</h2>
            <p className="text-[10px] mt-0.5" style={{ color: '#5A5A5A' }}>{total} registros disponibles</p>
          </div>
          <button onClick={onClose} className="btn-relief p-1.5 rounded-lg"><X size={16} style={{ color: '#5A5A5A' }} /></button>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 px-6 py-3 border-b" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
          {TABS.map(t => {
            const Icon = t.icon; const active = tab === t.id
            return (
              <button key={t.id} onClick={() => { setTab(t.id); setResult(null) }}
                className="px-4 py-2 rounded-lg text-[10px] font-bold uppercase tracking-wider flex items-center gap-1.5 transition-all"
                style={{ background: active ? 'rgba(245,107,19,0.15)' : 'transparent', color: active ? '#F56B13' : '#5A5A5A', border: active ? '1px solid rgba(245,107,19,0.3)' : '1px solid transparent' }}>
                <Icon size={13} /> {t.label}
              </button>
            )
          })}
        </div>

        {result ? (
          <div className="p-10 text-center">
            <CheckCircle size={48} className="mx-auto mb-4" style={{ color: '#10B981' }} />
            <h3 className="text-base font-black text-white uppercase tracking-wider mb-2">IMPORTACION COMPLETADA</h3>
            <p className="text-sm" style={{ color: '#5A5A5A' }}>
              {result.imported} {labelSingular}(s) importados correctamente
              {result.skipped > 0 && ` · ${result.skipped} omitidos (ya existentes)`}
            </p>
            <button onClick={onClose} className="mt-6 btn-relief-accent px-6 py-2.5 rounded-lg text-[10px] font-bold uppercase tracking-wider">
              CERRAR
            </button>
          </div>
        ) : (
          <>
            <div className="px-6 py-3 border-b flex items-center justify-between" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
              <div className="flex items-center gap-3">
                <button onClick={toggleSelectAll} className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider" style={{ color: '#8A8A8A' }}>
                  {selectAll ? <CheckSquare size={14} style={{ color: '#F56B13' }} /> : <Square size={14} />}
                  SELECT ALL
                </button>
                <span className="text-[10px]" style={{ color: '#5A5A5A' }}>{selected.size} seleccionados</span>
              </div>
              <div className="flex items-center gap-2">
                <button onClick={() => loadPage(page - 1)} disabled={page <= 1}
                  className="btn-relief p-1.5 rounded-lg disabled:opacity-30"><ChevronLeft size={14} style={{ color: '#5A5A5A' }} /></button>
                <span className="text-[11px] font-bold text-white">Pág {page} de {totalPages}</span>
                <button onClick={() => loadPage(page + 1)} disabled={page >= totalPages}
                  className="btn-relief p-1.5 rounded-lg disabled:opacity-30"><ChevronRight size={14} style={{ color: '#5A5A5A' }} /></button>
              </div>
            </div>

            <div className="overflow-y-auto" style={{ maxHeight: '45vh' }}>
              {loading ? (
                <div className="p-6 space-y-2">
                  {[1,2,3,4,5].map(i => <div key={i} className="h-10 rounded-lg animate-pulse" style={{ background: '#1A1A1D' }} />)}
                </div>
              ) : items.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <Package size={36} style={{ color: '#2A2A2E' }} className="mb-2" />
                  <p className="text-[12px] font-bold" style={{ color: '#5A5A5A' }}>NO HAY {labelSingular}S DE SICCE DISPONIBLES</p>
                </div>
              ) : tab === 'products' ? (
                <table className="glass-table w-full">
                  <thead>
                    <tr>
                      <th className="w-10 px-3 py-2"></th>
                      <th className="text-left text-[9px] font-bold uppercase tracking-wider px-3 py-2" style={{ color: '#8A8A8A' }}>NOMBRE</th>
                      <th className="text-left text-[9px] font-bold uppercase tracking-wider px-3 py-2" style={{ color: '#8A8A8A' }}>MARCA</th>
                      <th className="text-left text-[9px] font-bold uppercase tracking-wider px-3 py-2" style={{ color: '#8A8A8A' }}>CATEGORIA</th>
                      <th className="text-right text-[9px] font-bold uppercase tracking-wider px-3 py-2" style={{ color: '#8A8A8A' }}>STOCK</th>
                      <th className="text-right text-[9px] font-bold uppercase tracking-wider px-3 py-2" style={{ color: '#8A8A8A' }}>PRECIO</th>
                    </tr>
                  </thead>
                  <tbody>
                    {items.map(p => (
                      <tr key={p._id} onClick={() => toggleItem(p._id)} className="cursor-pointer transition-all hover:bg-white/[0.02]">
                        <td className="px-3 py-2"><button className="p-0.5">{selected.has(p._id) ? <CheckSquare size={14} style={{ color: '#F56B13' }} /> : <Square size={14} style={{ color: '#3A3A3A' }} />}</button></td>
                        <td className="px-3 py-2 text-[12px] font-bold text-white">{p.descripcion}</td>
                        <td className="px-3 py-2 text-[11px]" style={{ color: '#5A5A5A' }}>{p.marca || '—'}</td>
                        <td className="px-3 py-2 text-[11px]" style={{ color: '#5A5A5A' }}>{p.categoria || '—'}</td>
                        <td className="px-3 py-2 text-[11px] text-right font-bold" style={{ color: p.stock_actual > 0 ? '#10B981' : '#EF4444' }}>{p.stock_actual ?? 0}</td>
                        <td className="px-3 py-2 text-[11px] text-right font-bold" style={{ color: '#F56B13' }}>{p.precio_unitario ? `S/ ${Number(p.precio_unitario).toFixed(2)}` : '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <table className="glass-table w-full">
                  <thead>
                    <tr>
                      <th className="w-10 px-3 py-2"></th>
                      <th className="text-left text-[9px] font-bold uppercase tracking-wider px-3 py-2" style={{ color: '#8A8A8A' }}>RAZON SOCIAL</th>
                      <th className="text-left text-[9px] font-bold uppercase tracking-wider px-3 py-2" style={{ color: '#8A8A8A' }}>RUC/DNI</th>
                      <th className="text-left text-[9px] font-bold uppercase tracking-wider px-3 py-2" style={{ color: '#8A8A8A' }}>DIRECCION</th>
                      <th className="text-left text-[9px] font-bold uppercase tracking-wider px-3 py-2" style={{ color: '#8A8A8A' }}>TELEFONO</th>
                      <th className="text-left text-[9px] font-bold uppercase tracking-wider px-3 py-2" style={{ color: '#8A8A8A' }}>EMAIL</th>
                    </tr>
                  </thead>
                  <tbody>
                    {items.map(c => (
                      <tr key={c._id} onClick={() => toggleItem(c._id)} className="cursor-pointer transition-all hover:bg-white/[0.02]">
                        <td className="px-3 py-2"><button className="p-0.5">{selected.has(c._id) ? <CheckSquare size={14} style={{ color: '#F56B13' }} /> : <Square size={14} style={{ color: '#3A3A3A' }} />}</button></td>
                        <td className="px-3 py-2 text-[12px] font-bold text-white">{c.razon_social}</td>
                        <td className="px-3 py-2 text-[11px] font-mono" style={{ color: '#F56B13' }}>{c.ruc_dni}</td>
                        <td className="px-3 py-2 text-[11px]" style={{ color: '#5A5A5A' }}>{c.direccion || '—'}</td>
                        <td className="px-3 py-2 text-[11px]" style={{ color: '#5A5A5A' }}>{c.telefono || '—'}</td>
                        <td className="px-3 py-2 text-[11px]" style={{ color: '#5A5A5A' }}>{c.email || '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>

            <div className="px-6 py-4 border-t flex items-center justify-between" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
              <div className="flex items-center gap-2" style={{ color: '#5A5A5A' }}>
                <AlertCircle size={12} />
                <span className="text-[10px]">Datos de SICCE con origen sicce → se importaran como sigp</span>
              </div>
              <div className="flex gap-2">
                <button onClick={onClose} className="btn-relief-outline px-4 py-2 rounded-lg text-[10px] font-bold uppercase tracking-wider">CANCELAR</button>
                <button onClick={handleImport} disabled={selected.size === 0 || importing}
                  className="btn-relief-accent px-6 py-2 rounded-lg text-[10px] font-bold uppercase tracking-wider flex items-center gap-1.5 disabled:opacity-40">
                  <Download size={13} /> {importing ? 'IMPORTANDO...' : `IMPORTAR ${selected.size} ${labelSingular}(S)`}
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
