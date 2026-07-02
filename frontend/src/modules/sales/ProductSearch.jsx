import { Search, Scan } from 'lucide-react'

export default function ProductSearch({ search, setSearch, onEnter, modulos, moduloActivo, onSelectModulo, onSelectAll, searchRef }) {
  return (
    <div className="px-4 pt-4 pb-2 glass" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
      <div className="relative mb-2">
        <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: '#5A5A5A' }} />
        <input
          ref={searchRef}
          className="glass-input w-full pl-9 pr-10 py-2 rounded-lg text-[13px]"
          placeholder="BUSCAR POR NOMBRE, CODIGO O ESCANEAR CODIGO DE BARRAS..."
          value={search}
          onChange={e => setSearch(e.target.value.toUpperCase())}
          onKeyDown={e => { if (e.key === 'Enter') onEnter?.() }}
        />
        <Scan size={15} className="absolute right-3 top-1/2 -translate-y-1/2" style={{ color: '#F56B13' }} />
      </div>
      <div className="flex gap-1.5 overflow-x-auto pb-1">
        <button onClick={onSelectAll}
          className="btn-relief px-3 py-1.5 rounded-md text-[9px] font-bold uppercase tracking-widest whitespace-nowrap transition-all"
          style={{
            background: !moduloActivo ? 'linear-gradient(180deg, #F56B13, #C44D00)' : '',
            color: !moduloActivo ? 'white' : '#5A5A5A',
            boxShadow: !moduloActivo ? '0 2px 8px rgba(245,107,19,0.3)' : ''
          }}>TODOS</button>
        {modulos.slice(0, 15).map(m => (
          <button key={m} onClick={() => onSelectModulo(m)}
            className="btn-relief px-3 py-1.5 rounded-md text-[9px] font-bold uppercase tracking-widest whitespace-nowrap transition-all"
            style={{
              background: moduloActivo === m ? 'linear-gradient(180deg, #F56B13, #C44D00)' : '',
              color: moduloActivo === m ? 'white' : '#5A5A5A',
              boxShadow: moduloActivo === m ? '0 2px 8px rgba(245,107,19,0.3)' : ''
            }}>{m}</button>
        ))}
      </div>
    </div>
  )
}
