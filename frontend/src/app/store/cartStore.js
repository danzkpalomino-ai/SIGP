import { create } from 'zustand'

export const useCartStore = create((set, get) => ({
  items: [],
  cliente: { nombre: '', dni: '' },
  tipoDocumento: '03',

  addItem: (product) => {
    const items = get().items
    const existing = items.find(i => i._id === product._id)
    if (existing) {
      set({
        items: items.map(i =>
          i._id === product._id
            ? { ...i, cantidad: i.cantidad + 1, total_item: (i.cantidad + 1) * i.precio_unitario }
            : i
        )
      })
    } else {
      set({
        items: [...items, {
          _id: product._id,
          codigo_pos: product.codigo_pos,
          descripcion: product.descripcion,
          marca: product.marca,
          categoria: product.categoria,
          precio_unitario: product.precio_unitario,
          cantidad: 1,
          total_item: product.precio_unitario
        }]
      })
    }
  },

  updateQty: (id, delta) => {
    set({
      items: get().items.map(i =>
        i._id === id
          ? { ...i, cantidad: Math.max(1, i.cantidad + delta), total_item: Math.max(1, i.cantidad + delta) * i.precio_unitario }
          : i
      ).filter(i => i.cantidad > 0)
    })
  },

  removeItem: (id) => set({ items: get().items.filter(i => i._id !== id) }),
  clearCart: () => set({ items: [], cliente: { nombre: '', dni: '' } }),

  setCliente: (cliente) => set({ cliente }),
  setTipoDocumento: (tipo) => set({ tipoDocumento: tipo }),

  getSubtotal: () => get().items.reduce((acc, i) => acc + i.total_item, 0),
  getIgv: () => get().items.reduce((acc, i) => acc + i.total_item, 0) * 0.18,
  getTotal: () => {
    const sub = get().items.reduce((acc, i) => acc + i.total_item, 0)
    return sub + sub * 0.18
  }
}))
