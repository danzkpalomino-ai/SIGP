import ProductsDashboard from '../../features/products/ProductsDashboard'
import { useAuthStore } from '../../app/store/authStore'
export default function ProductsModule() {
  const { company } = useAuthStore()
  return <ProductsDashboard company={company} />
}
