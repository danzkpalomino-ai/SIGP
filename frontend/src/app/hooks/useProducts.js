import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { productsApi } from '../../services/api'

export function useProducts(params) {
  return useQuery({
    queryKey: ['products', params],
    queryFn: async () => {
      const res = await productsApi.getAll(params)
      return res.data?.products || []
    }
  })
}

export function useModulos() {
  return useQuery({
    queryKey: ['products', 'modulos'],
    queryFn: async () => {
      const res = await productsApi.getModulos()
      return res.data?.modulos || []
    }
  })
}

export function useCreateProduct() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (data) => {
      const res = await productsApi.create(data)
      return res.data
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['products'] })
  })
}

export function useUpdateProduct() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, data }) => {
      const res = await productsApi.update(id, data)
      return res.data
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['products'] })
  })
}
