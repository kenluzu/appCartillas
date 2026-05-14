import { createContext, useContext, useState, type ReactNode } from "react";
import type { Usuario, Cartilla, Retiro } from "../lib/types";

type Canal = "CORPORATIVO" | "COMERCIAL" | null;

export type ComercialMetricas = {
  volumen: number;
  utilidad: number;
  estrategica: number;
  boleto_asegurado: number;
  puntos_volumen: number;
  puntos_utilidad: number;
  puntos_estrategica: number;
};

type AppState = {
  usuario: Usuario | null;
  cartilla: Cartilla | null;
  retiro: Retiro | null;
  canal: Canal;
  adminNombre: string | null;
  cedulaPendiente: string;
  comercialMetricas: ComercialMetricas | null;
  setUsuario: (u: Usuario | null) => void;
  setCartilla: (c: Cartilla | null) => void;
  setRetiro: (r: Retiro | null) => void;
  setCanal: (c: Canal) => void;
  setAdminNombre: (n: string | null) => void;
  setCedulaPendiente: (c: string) => void;
  setComercialMetricas: (m: ComercialMetricas | null) => void;
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
  const [canal, _setCanal] = useState<Canal>(
    () => (sessionStorage.getItem("session_canal") as Canal) ?? null
  );
  const [adminNombre, _setAdminNombre] = useState<string | null>(
    () => localStorage.getItem("admin_nombre")
  );
  const [cedulaPendiente, _setCedulaPendiente] = useState<string>(
    () => sessionStorage.getItem("cedula_pendiente") ?? ""
  );
  const [comercialMetricas, _setComercialMetricas] = useState<ComercialMetricas | null>(
    () => readStorage<ComercialMetricas>(sessionStorage, "session_comercial_metricas")
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

  function setCanal(c: Canal) {
    _setCanal(c);
    if (c) sessionStorage.setItem("session_canal", c);
    else sessionStorage.removeItem("session_canal");
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

  function setComercialMetricas(m: ComercialMetricas | null) {
    _setComercialMetricas(m);
    if (m) sessionStorage.setItem("session_comercial_metricas", JSON.stringify(m));
    else sessionStorage.removeItem("session_comercial_metricas");
  }

  function clearUserSession() {
    _setUsuario(null);
    _setCartilla(null);
    _setRetiro(null);
    _setCanal(null);
    _setComercialMetricas(null);
    sessionStorage.removeItem("session_usuario");
    sessionStorage.removeItem("session_cartilla");
    sessionStorage.removeItem("session_retiro");
    sessionStorage.removeItem("session_canal");
    sessionStorage.removeItem("session_comercial_metricas");
  }

  return (
    <AppContext.Provider
      value={{
        usuario,
        cartilla,
        retiro,
        canal,
        adminNombre,
        cedulaPendiente,
        comercialMetricas,
        setUsuario,
        setCartilla,
        setRetiro,
        setCanal,
        setAdminNombre,
        setCedulaPendiente,
        setComercialMetricas,
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
