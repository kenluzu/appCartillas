import { useEffect } from "react";
import { useApp } from "../context/AppContext";
import { RetosCorporativo } from "./RetosCorporativo";
import { RetosComercial } from "./RetosComercial";

export function Retos() {
  const { canal, usuario, setCartilla } = useApp();

  useEffect(() => {
    if (!usuario) return;
    fetch(`/api/usuarios/validar?cedula=${encodeURIComponent(usuario.cedula)}`)
      .then(r => (r.ok ? r.json() : null))
      .then((data: { cartilla?: unknown } | null) => {
        if (data?.cartilla) setCartilla(data.cartilla as Parameters<typeof setCartilla>[0]);
      })
      .catch(() => {});
  }, []);

  return canal === "COMERCIAL" ? <RetosComercial /> : <RetosCorporativo />;
}
