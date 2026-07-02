import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { salesApi, productsApi } from '../../services/api'

export function useTodaySales() {
  return useQuery({
    queryKey: ['sales', 'today'],
    queryFn: async () => {
      const res = await salesApi.getToday()
      return res.data
    }
  })
}

export function useSalesStats(params) {
  return useQuery({
    queryKey: ['sales', 'stats', params],
    queryFn: async () => {
      const res = await salesApi.getStats(params)
      return res.data
    }
  })
}

export function useSalesList(params) {
  return useQuery({
    queryKey: ['sales', 'list', params],
    queryFn: async () => {
      const res = await salesApi.getAll(params)
      return res.data
    }
  })
}

export function useCreateSale() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (data) => {
      const res = await salesApi.create(data)
      return res.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sales'] })
    }
  })
}
