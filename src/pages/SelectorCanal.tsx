import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useApp } from "../context/AppContext";
import fondoWeb from "../assets/fondo-web.png";
import fondoResponsive from "../assets/fondo-responsive.jpg";

export function SelectorCanal() {
  const { setCanal, setUsuario, setCartilla, setRetiro, setComercialMetricas } = useApp();
  const navigate = useNavigate();
  const [cedula, setCedula] = useState("");
  const [cargando, setCargando] = useState<"CORPORATIVO" | "COMERCIAL" | null>(null);
  const [error, setError] = useState("");

  async function seleccionar(canal: "CORPORATIVO" | "COMERCIAL") {
    const val = cedula.trim();
    if (!val) {
      setError("Ingresa tu identificador antes de continuar.");
      return;
    }

    setCargando(canal);
    setError("");
    try {
      if (canal === "COMERCIAL") {
        const res = await fetch(`/api/usuarios/validar-comercial?usuario=${encodeURIComponent(val)}`);
        const data = await res.json() as Record<string, unknown>;

        if (res.status === 404) {
          setError("Usuario no encontrado. Comunícate con el administrador.");
          return;
        }
        if (!res.ok) {
          throw new Error((data.error as string | undefined) ?? "Error al consultar");
        }

        const usuario = data.usuario as { id: number; cedula: string; nombre: string; apellido: string; telefono: string; rol: string; cod_cliente: number | null };
        const cartilla = data.cartilla as { id: number; puntos: number; estado: "activa" | "completa" | "cerrada"; fecha_inicio: string };
        const metricas = data.metricas as import("../context/AppContext").ComercialMetricas;
        setUsuario(usuario);
        setCartilla(cartilla);
        setRetiro(null);
        setCanal(canal);
        setComercialMetricas(metricas);
        navigate("/retos");
      } else {
        const res = await fetch(`/api/usuarios/validar?cedula=${encodeURIComponent(val)}`);
        const data = await res.json() as Record<string, unknown>;

        if (res.status === 404) {
          setError("Cédula no encontrada. Comunícate con el administrador.");
          return;
        }
        if (!res.ok) {
          throw new Error((data.error as string | undefined) ?? "Error al consultar");
        }

        const usuario = data.usuario as { id: number; cedula: string; nombre: string; apellido: string; telefono: string; rol: string; cod_cliente: number | null };
        const cartilla = data.cartilla as { id: number; puntos: number; estado: "activa" | "completa" | "cerrada"; fecha_inicio: string };
        setUsuario(usuario);
        setCartilla(cartilla);
        setRetiro(null);
        setCanal(canal);
        navigate("/retos");
      }
    } catch (e: unknown) {
      if (e instanceof Error && (e.message.includes("no encontrad"))) {
        setError(e.message);
      } else {
        setError("Error de conexión. Intenta de nuevo.");
      }
    } finally {
      setCargando(null);
    }
  }

  const cedulaValida = cedula.trim().length > 0;

  const [isMobile, setIsMobile] = useState(() => window.innerWidth < 768);
  useEffect(() => {
    const handler = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener("resize", handler);
    return () => window.removeEventListener("resize", handler);
  }, []);

  return (
    <div
      className="min-h-screen flex items-end justify-center pb-12 md:items-center md:justify-end md:pb-0 md:pr-38 px-4"
      style={{
        backgroundImage: `url(${isMobile ? fondoResponsive : fondoWeb})`,
        backgroundSize: "cover",
        backgroundPosition: "center",
      }}
    >
      <div className="w-full max-w-sm bg-white/75 backdrop-blur-md rounded-3xl shadow-2xl p-6 md:p-8 border border-white/60">

        <div className="flex flex-col gap-5">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">
              Cédula / Usuario
            </label>
            <input
              type="text"
              value={cedula}
              onChange={e => {
                setCedula(e.target.value.toUpperCase());
                setError("");
              }}
              placeholder="Cédula o usuario comercial"
              autoFocus
              className="w-full border border-gray-200 bg-gray-50 rounded-xl px-4 py-3 text-base focus:outline-none focus:ring-2 focus:ring-gray-300 focus:border-transparent transition-all"
            />
            {error && (
              <p className="mt-2 text-red-600 text-sm bg-red-50 border border-red-200 rounded-lg px-3 py-2">
                {error}
              </p>
            )}
          </div>

          {/* Selección de equipo */}
          <div>
            <p className="text-gray-400 text-xs font-medium uppercase tracking-wider mb-3">
              Selecciona tu equipo
            </p>

            <div className="space-y-3">
              <button
                onClick={() => seleccionar("CORPORATIVO")}
                disabled={!cedulaValida || cargando !== null}
                className="w-full flex items-center gap-4 bg-indigo-50 hover:bg-indigo-100 disabled:opacity-50 disabled:cursor-not-allowed border-2 border-indigo-100 hover:border-indigo-300 rounded-2xl px-5 py-4 text-left transition-all duration-200 cursor-pointer group"
              >
                <div className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0 bg-indigo-500">
                  {cargando === "CORPORATIVO" ? (
                    <svg className="w-5 h-5 text-white animate-spin" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                    </svg>
                  ) : (
                    <span className="text-xl">🏢</span>
                  )}
                </div>
                <div className="flex-1">
                  <p className="text-indigo-800 font-bold text-base tracking-wide">CORPORATIVO</p>
                  <p className="text-indigo-400 text-xs mt-0.5">Equipo corporativo Farmcorp</p>
                </div>
                <svg className="w-5 h-5 text-indigo-300 group-hover:text-indigo-600 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                </svg>
              </button>

              <button
                onClick={() => seleccionar("COMERCIAL")}
                disabled={!cedulaValida || cargando !== null}
                className="w-full flex items-center gap-4 bg-emerald-50 hover:bg-emerald-100 disabled:opacity-50 disabled:cursor-not-allowed border-2 border-emerald-100 hover:border-emerald-300 rounded-2xl px-5 py-4 text-left transition-all duration-200 cursor-pointer group"
              >
                <div className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0 bg-emerald-300">
                  {cargando === "COMERCIAL" ? (
                    <svg className="w-5 h-5 text-white animate-spin" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                    </svg>
                  ) : (
                    <span className="text-xl">🏥</span>
                  )}
                </div>
                <div className="flex-1">
                  <p className="text-emerald-700 font-bold text-base tracking-wide">COMERCIAL</p>
                  <p className="text-emerald-400 text-xs mt-0.5">Equipo comercial Farmcorp</p>
                </div>
                <svg className="w-5 h-5 text-emerald-300 group-hover:text-emerald-600 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </div>

            <div className="mt-5 text-center">
              <button
                onClick={() => navigate("/admin")}
                className="text-xs text-gray-300 hover:text-gray-500 transition-colors cursor-pointer"
              >
                Administrador
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
