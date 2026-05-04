import { createContext, useContext, useState, type ReactNode } from "react";
import type { Usuario, Cartilla, Retiro } from "../lib/api";

type AppState = {
  usuario: Usuario | null;
  cartilla: Cartilla | null;
  retiro: Retiro | null;
  adminNombre: string | null;
  cedulaPendiente: string;
  setUsuario: (u: Usuario | null) => void;
  setCartilla: (c: Cartilla | null) => void;
  setRetiro: (r: Retiro | null) => void;
  setAdminNombre: (n: string | null) => void;
  setCedulaPendiente: (c: string) => void;
  clearUserSession: () => void;
};

const AppContext = createContext<AppState>(null!);

function readStorage<T>(storage: Storage, key: string): T | null {
  try {
    const raw = storage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : null;
  } catch {
    return null;
  }
}

export function AppProvider({ children }: { children: ReactNode }) {
  const [usuario, _setUsuario] = useState<Usuario | null>(
    () => readStorage<Usuario>(sessionStorage, "session_usuario")
  );
  const [cartilla, _setCartilla] = useState<Cartilla | null>(
    () => readStorage<Cartilla>(sessionStorage, "session_cartilla")
  );
  const [retiro, _setRetiro] = useState<Retiro | null>(
    () => readStorage<Retiro>(sessionStorage, "session_retiro")
  );
  const [adminNombre, _setAdminNombre] = useState<string | null>(
    () => localStorage.getItem("admin_nombre")
  );
  const [cedulaPendiente, _setCedulaPendiente] = useState<string>(
    () => sessionStorage.getItem("cedula_pendiente") ?? ""
  );

  function setUsuario(u: Usuario | null) {
    _setUsuario(u);
    if (u) sessionStorage.setItem("session_usuario", JSON.stringify(u));
    else sessionStorage.removeItem("session_usuario");
  }

  function setCartilla(c: Cartilla | null) {
    _setCartilla(c);
    if (c) sessionStorage.setItem("session_cartilla", JSON.stringify(c));
    else sessionStorage.removeItem("session_cartilla");
  }

  function setRetiro(r: Retiro | null) {
    _setRetiro(r);
    if (r) sessionStorage.setItem("session_retiro", JSON.stringify(r));
    else sessionStorage.removeItem("session_retiro");
  }

  function setAdminNombre(n: string | null) {
    _setAdminNombre(n);
    if (n) localStorage.setItem("admin_nombre", n);
    else localStorage.removeItem("admin_nombre");
  }

  function setCedulaPendiente(c: string) {
    _setCedulaPendiente(c);
    if (c) sessionStorage.setItem("cedula_pendiente", c);
    else sessionStorage.removeItem("cedula_pendiente");
  }

  function clearUserSession() {
    _setUsuario(null);
    _setCartilla(null);
    _setRetiro(null);
    sessionStorage.removeItem("session_usuario");
    sessionStorage.removeItem("session_cartilla");
    sessionStorage.removeItem("session_retiro");
  }

  return (
    <AppContext.Provider
      value={{
        usuario,
        cartilla,
        retiro,
        adminNombre,
        cedulaPendiente,
        setUsuario,
        setCartilla,
        setRetiro,
        setAdminNombre,
        setCedulaPendiente,
        clearUserSession,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  return useContext(AppContext);
}
