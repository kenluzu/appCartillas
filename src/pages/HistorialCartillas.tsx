import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useApp } from "../context/AppContext";
import { TopBar } from "../components/TopBar";

type CartillaHistorial = {
  id: number;
  puntos: number;
  estado: "activa" | "completa" | "cerrada";
  fecha_inicio: string;
  numero: number;
  total_retos: number;
};

type RetoItem = {
  id: number;
  tipo_reto: string;
  monto: number;
  numero_factura: string | null;
  descripcion: string | null;
  fecha_registro: string;
};

const TIPO_LABELS: Record<string, { label: string; icono: string }> = {
  contact_center: { label: "Contact Center", icono: "📞" },
  referido: { label: "Factura Referido/a", icono: "👥" },
  lineas_estrategicas: { label: "Líneas Estratégicas", icono: "🎯" },
  productos_focos: { label: "Productos Focos", icono: "⭐" },
};

export function HistorialCartillas() {
  const { usuario, canal, cartilla } = useApp();
  const navigate = useNavigate();
  const [cartillas, setCartillas] = useState<CartillaHistorial[]>([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");
  const [expandida, setExpandida] = useState<number | null>(null);
  const [retos, setRetos] = useState<Record<number, RetoItem[]>>({});
  const [cargandoRetos, setCargandoRetos] = useState<number | null>(null);

  useEffect(() => {
    if (!usuario) { navigate("/"); return; }
    cargarHistorial();
  }, [usuario]);

  async function cargarHistorial() {
    setCargando(true);
    setError("");
    try {
      const res = await fetch(`/api/usuarios/historial?usuario_id=${usuario!.id}`);
      if (!res.ok) throw new Error("Error al cargar historial");
      setCartillas(await res.json() as CartillaHistorial[]);
    } catch {
      setError("No se pudo cargar el historial. Intenta de nuevo.");
    } finally {
      setCargando(false);
    }
  }

  async function toggleCartilla(id: number) {
    if (expandida === id) { setExpandida(null); return; }
    setExpandida(id);
    if (retos[id]) return;

    setCargandoRetos(id);
    try {
      const res = await fetch(`/api/usuarios/retos/${id}`);
      if (res.ok) {
        const data = await res.json() as RetoItem[];
        setRetos(prev => ({ ...prev, [id]: data }));
      }
    } finally {
      setCargandoRetos(null);
    }
  }

  function estadoBadge(estado: string) {
    if (estado === "completa") return "bg-amber-50 text-amber-700";
    if (estado === "cerrada") return "bg-slate-100 text-slate-500";
    return "bg-emerald-50 text-emerald-700";
  }

  function estadoLabel(estado: string) {
    if (estado === "completa") return "Completa";
    if (estado === "cerrada") return "Cerrada";
    return "Activa";
  }

  const puntos = cartilla?.puntos ?? 0;

  return (
    <div className="min-h-screen pt-24 pb-8 px-4">

      {/* ── Floating pill navbar ── */}
      {usuario && (
        <TopBar
          nombre={usuario.nombre}
          apellido={usuario.apellido}
          cedula={usuario.cedula}
          canal={canal}
          puntos={puntos}
          accion={{
            label: "Volver",
            icono: "volver",
            onClick: () => navigate("/retos"),
          }}
        />
      )}

      <main className="max-w-md mx-auto space-y-4">

        {cargando && (
          <div className="text-center py-16 text-gray-300 text-sm">Cargando historial...</div>
        )}

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-2xl p-4 text-red-700 text-sm text-center">
            {error}
          </div>
        )}

        {!cargando && !error && cartillas.length === 0 && (
          <div className="text-center py-16 text-gray-300 text-sm">No tienes cartillas registradas.</div>
        )}

        <div className="space-y-3 pb-2">
          {cartillas.map(c => (
            <div key={c.id} className="bg-white rounded-2xl shadow-sm overflow-hidden">
              <button
                className="w-full flex items-center gap-4 px-5 py-4 text-left cursor-pointer hover:bg-gray-50 transition-colors"
                onClick={() => toggleCartilla(c.id)}
              >
                <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 bg-indigo-50">
                  <span className="text-indigo-600 font-bold text-sm">#{c.numero}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${estadoBadge(c.estado)}`}>
                      {estadoLabel(c.estado)}
                    </span>
                    <span className="text-xs text-gray-400">{c.total_retos} retos</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="flex-1 h-1.5 rounded-full bg-gray-100 overflow-hidden">
                      <div
                        className="h-full rounded-full"
                        style={{
                          width: `${Math.min(100, (c.puntos / 10) * 100)}%`,
                          background: c.estado === "completa" || c.puntos >= 10 ? "#fbbf24" : "#34d399",
                        }}
                      />
                    </div>
                    <span className="text-xs text-gray-500 shrink-0 font-semibold tabular-nums">{c.puntos}/10</span>
                  </div>
                  <p className="text-xs text-gray-300 mt-0.5">
                    Inicio: {c.fecha_inicio}
                  </p>
                </div>
                <svg
                  className={`w-4 h-4 text-gray-300 transition-transform duration-200 shrink-0 ${expandida === c.id ? "rotate-90" : ""}`}
                  fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                </svg>
              </button>

              {expandida === c.id && (
                <div className="border-t border-gray-100 px-5 py-3">
                  {cargandoRetos === c.id && (
                    <p className="text-xs text-gray-300 py-2">Cargando retos...</p>
                  )}
                  {retos[c.id] && retos[c.id]!.length === 0 && (
                    <p className="text-xs text-gray-300 py-2">Sin retos registrados.</p>
                  )}
                  {retos[c.id] && retos[c.id]!.length > 0 && (
                    <div className="space-y-2">
                      {retos[c.id]!.map(r => {
                        const info = TIPO_LABELS[r.tipo_reto] ?? { label: r.tipo_reto, icono: "📋" };
                        return (
                          <div key={r.id} className="flex items-start gap-3 py-1.5">
                            <span className="text-lg shrink-0">{info.icono}</span>
                            <div className="flex-1 min-w-0">
                              <p className="text-xs font-semibold text-gray-700">{info.label}</p>
                              <p className="text-xs text-gray-400">
                                ${Number(r.monto).toFixed(2)}
                                {r.numero_factura ? ` · Fact. ${r.numero_factura}` : ""}
                              </p>
                              {r.descripcion && (
                                <p className="text-xs text-gray-300 truncate">{r.descripcion}</p>
                              )}
                            </div>
                            <span className="text-xs text-gray-300 shrink-0">
                              {new Date(r.fecha_registro).toLocaleDateString("es-EC", { day: "2-digit", month: "short" })}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
