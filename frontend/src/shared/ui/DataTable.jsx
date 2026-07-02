import { ChevronLeft, ChevronRight } from 'lucide-react'

export default function DataTable({ columns, data, onRowClick, loading, page, totalPages, onPageChange }) {
  return (
    <div>
      <div className="overflow-x-auto">
        <table className="glass-table w-full">
          <thead>
            <tr>
              {columns.map((col, i) => (
                <th
                  key={i}
                  className={`text-[10px] font-bold uppercase tracking-wider px-3 py-3 sticky top-0 ${col.align === 'right' ? 'text-right' : col.align === 'center' ? 'text-center' : 'text-left'}`}
                  style={{ color: '#8A8A8A' }}
                  style={col.width ? { width: col.width } : {}}
                >
                  {col.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <tr key={i}>
                  {columns.map((_, j) => (
                    <td key={j} className="px-3 py-3" style={{ borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
                      <div className="h-4 rounded animate-pulse" style={{ background: 'rgba(255,255,255,0.05)' }} />
                    </td>
                  ))}
                </tr>
              ))
            ) : data.length === 0 ? (
              <tr>
                <td colSpan={columns.length} className="text-center py-8 text-[11px]" style={{ color: '#5A5A5A' }}>
                  SIN DATOS
                </td>
              </tr>
            ) : (
              data.map((row, i) => (
                <tr
                  key={row._id || i}
                  onClick={() => onRowClick?.(row)}
                  className={onRowClick ? 'cursor-pointer transition-all hover:bg-white/[0.02]' : ''}
                  style={{ borderBottom: '1px solid rgba(255,255,255,0.03)' }}
                >
                  {columns.map((col, j) => (
                    <td
                      key={j}
                      className={`px-3 py-3 text-[12px] ${col.align === 'right' ? 'text-right' : col.align === 'center' ? 'text-center' : 'text-left'}`}
                      style={{ color: col.color || '#E0E0E0' }}
                    >
                      {col.render ? col.render(row) : row[col.key]}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-between mt-4">
          <p className="text-[10px]" style={{ color: '#5A5A5A' }}>PAGINA {page} DE {totalPages}</p>
          <div className="flex gap-2">
            <button
              onClick={() => onPageChange?.(Math.max(1, page - 1))}
              disabled={page <= 1}
              className="btn-relief-outline px-3 py-1.5 rounded-lg text-[9px] font-bold uppercase disabled:opacity-30 flex items-center gap-1"
            >
              <ChevronLeft size={12} /> ANTERIOR
            </button>
            <button
              onClick={() => onPageChange?.(Math.min(totalPages, page + 1))}
              disabled={page >= totalPages}
              className="btn-relief-outline px-3 py-1.5 rounded-lg text-[9px] font-bold uppercase disabled:opacity-30 flex items-center gap-1"
            >
              SIGUIENTE <ChevronRight size={12} />
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
