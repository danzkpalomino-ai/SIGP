import PosDashboard from '../../features/pos/PosDashboard'
import { useAuthStore } from '../../app/store/authStore'
export default function CajaModule() {
  const { company, user, puntoVenta, puntoVentaId, companies, logout } = useAuthStore()
  return <PosDashboard company={company} user={user} companies={companies} puntoVenta={puntoVenta} puntoVentaId={puntoVentaId} onLogout={logout} onSwitchCompany={() => {}} simplified />
}
