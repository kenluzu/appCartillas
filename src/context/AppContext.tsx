import { createContext, useContext, useState, type ReactNode } from "react";
import type { Usuario, Cartilla, Retiro } from "../lib/api";

export type Page =
  | "ingreso"
  | "registro"
  | "cartilla"
  | "planificacion"
  | "confirmacion"
  | "admin-login"
  | "admin-panel";

type AppState = {
  page: Page;
  usuario: Usuario | null;
  cartilla: Cartilla | null;
  retiro: Retiro | null;
  adminNombre: string | null;
  cedulaPendiente: string;
  navigate: (page: Page) => void;
  setUsuario: (u: Usuario | null) => void;
  setCartilla: (c: Cartilla | null) => void;
  setRetiro: (r: Retiro | null) => void;
  setAdminNombre: (n: string | null) => void;
  setCedulaPendiente: (c: string) => void;
};

const AppContext = createContext<AppState>(null!);

export function AppProvider({ children }: { children: ReactNode }) {
  const [page, setPage] = useState<Page>("ingreso");
  const [usuario, setUsuario] = useState<Usuario | null>(null);
  const [cartilla, setCartilla] = useState<Cartilla | null>(null);
  const [retiro, setRetiro] = useState<Retiro | null>(null);
  const [adminNombre, setAdminNombre] = useState<string | null>(null);
  const [cedulaPendiente, setCedulaPendiente] = useState("");

  return (
    <AppContext.Provider
      value={{
        page,
        usuario,
        cartilla,
        retiro,
        adminNombre,
        cedulaPendiente,
        navigate: setPage,
        setUsuario,
        setCartilla,
        setRetiro,
        setAdminNombre,
        setCedulaPendiente,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  return useContext(AppContext);
}
