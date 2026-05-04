import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AppProvider } from "./context/AppContext";
import { PrivateUserRoute, PrivateAdminRoute } from "./router/PrivateRoutes";
import { IngresoCedula } from "./pages/IngresoCedula";
import { Registro } from "./pages/Registro";
import { Cartilla } from "./pages/Cartilla";
import { PlanificacionRetiro } from "./pages/PlanificacionRetiro";
import { ConfirmacionRetiro } from "./pages/ConfirmacionRetiro";
import { AdminLogin } from "./pages/admin/AdminLogin";
import { AdminPanel } from "./pages/admin/AdminPanel";

export function App() {
  return (
    <BrowserRouter>
      <AppProvider>
        <Routes>
          <Route path="/" element={<IngresoCedula />} />
          <Route path="/registro" element={<Registro />} />

          <Route path="/cartilla" element={
            <PrivateUserRoute><Cartilla /></PrivateUserRoute>
          } />
          <Route path="/planificacion" element={
            <PrivateUserRoute><PlanificacionRetiro /></PrivateUserRoute>
          } />
          <Route path="/confirmacion" element={
            <PrivateUserRoute><ConfirmacionRetiro /></PrivateUserRoute>
          } />

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
