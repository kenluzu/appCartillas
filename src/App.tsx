import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AppProvider } from "./context/AppContext";
import { PrivateUserRoute, PrivateAdminRoute } from "./router/PrivateRoutes";
import { SelectorCanal } from "./pages/SelectorCanal";
import { IngresoCedula } from "./pages/IngresoCedula";
import { Retos } from "./pages/Retos";
import { Cartilla } from "./pages/Cartilla";
import { HistorialCartillas } from "./pages/HistorialCartillas";
import { Registro } from "./pages/Registro";
import { PlanificacionRetiro } from "./pages/PlanificacionRetiro";
import { ConfirmacionRetiro } from "./pages/ConfirmacionRetiro";
import { AdminLogin } from "./pages/admin/AdminLogin";
import { AdminPanel } from "./pages/admin/AdminPanel";

export function App() {
  return (
    <BrowserRouter>
      <AppProvider>
        <Routes>
          {/* Nuevo flujo */}
          <Route path="/" element={<SelectorCanal />} />
          <Route path="/ingresar" element={<IngresoCedula />} />

          <Route path="/retos" element={
            <PrivateUserRoute><Retos /></PrivateUserRoute>
          } />
          <Route path="/cartilla" element={
            <PrivateUserRoute><Cartilla /></PrivateUserRoute>
          } />
          <Route path="/historial" element={
            <PrivateUserRoute><HistorialCartillas /></PrivateUserRoute>
          } />

          {/* Vistas legacy (mantenidas, fuera del flujo principal) */}
          <Route path="/registro" element={<Registro />} />
          <Route path="/planificacion" element={
            <PrivateUserRoute><PlanificacionRetiro /></PrivateUserRoute>
          } />
          <Route path="/confirmacion" element={
            <PrivateUserRoute><ConfirmacionRetiro /></PrivateUserRoute>
          } />

          {/* Admin */}
          <Route path="/admin" element={<AdminLogin />} />
          <Route path="/admin/panel" element={
            <PrivateAdminRoute><AdminPanel /></PrivateAdminRoute>
          } />

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AppProvider>
    </BrowserRouter>
  );
}

export default App;
