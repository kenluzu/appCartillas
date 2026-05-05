import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useApp } from "../context/AppContext";
import type { Retiro } from "../lib/types";

export function IngresoCedula() {
  const { setUsuario, setCartilla, setRetiro, setCedulaPendiente } = useApp();
  const navigate = useNavigate();
  const [cedula, setCedula] = useState("");
  const [error, setError] = useState("");
  const [cargando, setCargando] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const ced = cedula.trim();
    if (!ced) return;

    setCargando(true);
    setError("");
    try {
      const res = await fetch(`/api/usuarios/validar?cedula=${encodeURIComponent(ced)}`);
      const data = await res.json() as Record<string, unknown>;

      if (res.status === 404) {
        setCedulaPendiente(ced);
        navigate("/registro");
      } else if (res.ok) {
        const usuario = data.usuario as { id: number; cedula: string; nombre: string; apellido: string; telefono: string; rol: string };
        const cartilla = data.cartilla as { id: number; puntos: number; estado: "activa" | "completa" | "cerrada"; fecha_inicio: string };
        setUsuario(usuario);
        setCartilla(cartilla);
        setRetiro((data.retiro as Retiro | null) ?? null);
        navigate("/cartilla");
      } else {
        throw new Error((data.error as string | undefined) ?? "Error al consultar");
      }
    } catch (e: any) {
      setError(e.message ?? "Error de red al consultar");
    } finally {
      setCargando(false);
    }
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4">
      <div className="w-full max-w-sm bg-white rounded-2xl shadow-lg p-8">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-gray-800">¡Ponte la 10!</h1>
          <p className="text-gray-500 text-sm mt-1">Únete a nuestro programa y gana camisetas gratis</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Número de cédula
            </label>
            <input
              type="text"
              value={cedula}
              onChange={e => setCedula(e.target.value.replace(/\D/g, "").slice(0, 13))}
              placeholder="Ingresa tu cédula"
              className="w-full border border-gray-300 rounded-lg px-4 py-3 text-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
              autoFocus
              inputMode="numeric"
            />
          </div>

          {error && (
            <p className="text-red-600 text-sm bg-red-50 border border-red-200 rounded-lg p-3">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={cargando || cedula.trim().length === 0}
            className="w-full bg-green-600 hover:bg-green-700 disabled:bg-gray-300 text-white font-semibold py-3 rounded-lg transition-colors cursor-pointer"
          >
            {cargando ? "Consultando..." : "Ingresar"}
          </button>
        </form>

        <div className="mt-6 text-center">
          <button
            onClick={() => navigate("/admin")}
            className="text-xs text-gray-400 hover:text-gray-600 transition-colors cursor-pointer"
          >
            Administrador
          </button>
        </div>
      </div>
    </div>
  );
}
