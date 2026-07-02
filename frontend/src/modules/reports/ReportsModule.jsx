import ReportsView from '../../features/reports/ReportsView'
import { useAuthStore } from '../../app/store/authStore'
export default function ReportsModule() {
  const { company } = useAuthStore()
  return <ReportsView company={company} />
}
