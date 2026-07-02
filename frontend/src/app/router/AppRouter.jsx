import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useAuthStore } from '../store/authStore'
import MainLayout from '../layouts/MainLayout'
import LoginPage from '../../pages/LoginPage'
import CompanySelectPage from '../../pages/CompanySelectPage'
import PuntoVentaPage from '../../pages/PuntoVentaPage'
import VentasPage from '../../pages/VentasPage'
import VentasHistorialPage from '../../pages/VentasHistorialPage'
import ProductosPage from '../../pages/ProductosPage'
import ClientesPage from '../../pages/ClientesPage'
import ProveedoresPage from '../../pages/ProveedoresPage'
import ComprasPage from '../../pages/ComprasPage'
import CajaPage from '../../pages/CajaPage'
import ReportesPage from '../../pages/ReportesPage'
import ConfigPage from '../../pages/ConfigPage'
import ReceptionPage from '../../pages/ReceptionPage'

function ProtectedRoute({ children, step }) {
  const { user, company, puntoVenta } = useAuthStore()
  if (!user) return <Navigate to="/login" replace />
  if ((step === 'company' || step === 'pv') && !company) return <Navigate to="/select-company" replace />
  if (step === 'pv' && !puntoVenta) return <Navigate to="/select-pv" replace />
  return children
}

export default function AppRouter() {
  const { user } = useAuthStore()

  if (!user) {
    return (
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/r/:companyId/:code" element={<ReceptionPage />} />
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </BrowserRouter>
    )
  }

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Navigate to="/" replace />} />
        <Route path="/r/:companyId/:code" element={<ReceptionPage />} />
        <Route path="/select-company" element={<CompanySelectPage />} />
        <Route path="/select-pv" element={<PuntoVentaPage />} />
        <Route path="/" element={<ProtectedRoute step="pv"><MainLayout /></ProtectedRoute>}>
          <Route index element={<Navigate to="/ventas" replace />} />
          <Route path="ventas" element={<VentasPage />} />
          <Route path="ventas/registro" element={<VentasHistorialPage />} />
          <Route path="productos" element={<ProductosPage />} />
          <Route path="clientes" element={<ClientesPage />} />
          <Route path="proveedores" element={<ProveedoresPage />} />
          <Route path="compras" element={<ComprasPage />} />
          <Route path="caja" element={<CajaPage />} />
          <Route path="reportes" element={<ReportesPage />} />
          <Route path="configuracion" element={<ConfigPage />} />
          <Route path="*" element={<Navigate to="/ventas" replace />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}
