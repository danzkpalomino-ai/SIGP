import PurchasesView from '../../features/purchases/PurchasesView'
import { useAuthStore } from '../../app/store/authStore'
export default function PurchasesModule() {
  const { company, user } = useAuthStore()
  return <PurchasesView company={company} user={user} onBack={() => window.history.back()} />
}
