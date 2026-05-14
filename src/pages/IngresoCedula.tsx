import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useApp } from "../context/AppContext";

export function IngresoCedula() {
  const { canal, setUsuario, setCartilla, setRetiro } = useApp();
  const navigate = useNavigate();
  const [cedula, setCedula] = useState("");
  const [error, setError] = useState("");
  const [cargando, setCargando] = useState(false);

  useEffect(() => {
    if (!canal) navigate("/", { replace: true });
  }, [canal]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const ced = cedula.trim();
    if (!ced) return;

    setCargando(true);
    setError("");
    try {
      const res = await fetch(`/api/usuarios/validar?cedula=${encodeURIComponent(ced)}`);
      const data = await res.json() as Record<string, unknown>;

      if (res.ok) {
        const usuario = data.usuario as { id: number; cedula: string; nombre: string; apellido: string; telefono: string; rol: string; cod_cliente: number | null };
        const cartilla = data.cartilla as { id: number; puntos: number; estado: "activa" | "completa" | "cerrada"; fecha_inicio: string };
        setUsuario(usuario);
        setCartilla(cartilla);
        setRetiro(null);
        navigate("/retos");
      } else {
        throw new Error((data.error as string | undefined) ?? "Error al consultar");
      }
    } catch {
      setError("Error de conexión. Intenta de nuevo.");
    } finally {
      setCargando(false);
    }
  }

  const canalColor = canal === "CORPORATIVO" ? "bg-indigo-600" : "bg-emerald-600";
  const canalHover = canal === "CORPORATIVO" ? "hover:bg-indigo-700" : "hover:bg-emerald-700";
  const canalRing = canal === "CORPORATIVO" ? "focus:ring-indigo-500" : "focus:ring-emerald-500";
  const canalIcon = canal === "CORPORATIVO" ? "🏢" : "🛒";

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4">
      <div className="w-full max-w-sm bg-white rounded-2xl shadow-lg p-8">
        <div className="text-center mb-6">
          <button
            onClick={() => navigate("/")}
            className="inline-flex items-center gap-1.5 text-gray-400 hover:text-gray-600 text-xs transition-colors cursor-pointer mb-4"
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
            Regresar 
          </button>

          <div className={`inline-flex items-center gap-2 rounded-full px-4 py-1.5 ml-3 mb-4 ${canal === "CORPORATIVO" ? "bg-indigo-100 text-indigo-700" : "bg-emerald-100 text-emerald-700"}`}>
            <span>{canalIcon}</span>
            <span className="font-bold text-sm tracking-wider">{canal}</span>
          </div>

          <h1 className="text-2xl font-bold text-gray-800">Ingresa tu cédula</h1>
          <p className="text-gray-500 text-sm mt-1">para acceder a tu programa de retos</p>
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
              className={`w-full border border-gray-300 rounded-lg px-4 py-3 text-lg focus:outline-none focus:ring-2 ${canalRing} focus:border-transparent`}
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
            className={`w-full ${canalColor} ${canalHover} disabled:bg-gray-300 text-white font-semibold py-3 rounded-lg transition-colors cursor-pointer`}
          >
            {cargando ? "Consultando..." : "Continuar"}
          </button>
        </form>
      </div>
    </div>
  );
}
