import { AppProvider, useApp } from "./context/AppContext";
import { IngresoCedula } from "./pages/IngresoCedula";
import { Registro } from "./pages/Registro";
import { Cartilla } from "./pages/Cartilla";
import { Redencion } from "./pages/Redencion";
import { ConfirmacionRetiro } from "./pages/ConfirmacionRetiro";
import { AdminLogin } from "./pages/admin/AdminLogin";
import { AdminPanel } from "./pages/admin/AdminPanel";
import "./index.css";

function Router() {
  const { page } = useApp();

  switch (page) {
    case "ingreso":       return <IngresoCedula />;
    case "registro":      return <Registro />;
    case "cartilla":      return <Cartilla />;
    case "redencion":     return <Redencion />;
    case "confirmacion":  return <ConfirmacionRetiro />;
    case "admin-login":   return <AdminLogin />;
    case "admin-panel":   return <AdminPanel />;
    default:              return <IngresoCedula />;
  }
}

export function App() {
  return (
    <AppProvider>
      <Router />
    </AppProvider>
  );
}

export default App;
