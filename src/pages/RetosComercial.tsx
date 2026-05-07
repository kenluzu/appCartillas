import { useNavigate } from "react-router-dom";
import { useApp } from "../context/AppContext";
import { TopBar } from "../components/TopBar";

const RETOS_FIJOS = [
  { key: "utilidad",             label: "Utilidad",             icono: "💰" },
  { key: "productos_focos",      label: "Productos Focos",      icono: "⭐" },
  { key: "volumen",              label: "Volumen",              icono: "📦" },
  { key: "lineas_estrategicas",  label: "Líneas Estratégicas",  icono: "🎯" },
];

function calcularPuntos(pct: number | null): number {
  if (pct === null || pct < 100) return 0;
  return Math.floor((pct - 100) / 5) + 1;
}

function badgePct(pct: number | null) {
  if (pct === null) return "text-gray-300";
  if (pct >= 110) return "text-emerald-600";
  if (pct >= 105) return "text-amber-500";
  if (pct >= 100) return "text-indigo-600";
  return "text-red-400";
}

export function RetosComercial() {
  const { usuario, cartilla, canal, clearUserSession } = useApp();
  const navigate = useNavigate();

  if (!usuario || !cartilla) return null;

  const puntos = cartilla.puntos ?? 0;

  // % cumplimiento por reto — pendiente de integración con fuente de datos real
  const cumplimiento: Record<string, number | null> = {
    utilidad:            null,
    productos_focos:     null,
    volumen:             null,
    lineas_estrategicas: null,
  };

  return (
    <div className="min-h-screen pt-24 pb-8 px-4">
      <TopBar
        nombre={usuario.nombre}
        apellido={usuario.apellido}
        cedula={usuario.cedula}
        canal={canal}
        puntos={puntos}
        accion={{ label: "Salir", icono: "salir", onClick: () => { clearUserSession(); navigate("/"); } }}
      />

      <div className="max-w-sm mx-auto space-y-4 mt-13">

        {/* Widget oportunidades */}
        <div
          className="rounded-2xl px-5 py-4 shadow-lg border border-white/20 flex items-center gap-4"
          style={{ background: "rgba(255,255,255,0.92)", backdropFilter: "blur(12px)" }}
        >
          <div className="w-12 h-12 rounded-2xl bg-yellow-100 flex items-center justify-center shrink-0 text-2xl">
            ⭐
          </div>
          <div className="min-w-0">
            <p className="text-2xl font-extrabold text-gray-800 leading-none tabular-nums">
              x{puntos}
            </p>
            <p className="text-sm text-gray-500 mt-0.5">
              oportunidad{puntos !== 1 ? "es" : ""} de ganar
            </p>
          </div>
          {puntos > 0 && (
            <div className="ml-auto flex flex-wrap gap-1 max-w-[80px] justify-end">
              {Array.from({ length: Math.min(puntos, 9) }, (_, i) => (
                <span key={i} className="text-base leading-none">⭐</span>
              ))}
              {puntos > 9 && <span className="text-xs text-gray-400 font-semibold mx-auto">+{puntos - 9}</span>}
            </div>
          )}
        </div>

        {/* Tabla de retos fijos */}
        <div
          className="rounded-2xl overflow-hidden shadow-lg border border-white/20"
          style={{ background: "rgba(255,255,255,0.92)", backdropFilter: "blur(12px)" }}
        >
          <div className="px-4 py-3 border-b border-gray-100">
            <p className="font-bold text-gray-700 text-sm">Mis retos (% cumplimiento)</p>
          </div>

          {/* Cabeceras */}
          <div className="grid grid-cols-[1fr_80px_48px] px-4 py-2 bg-gray-50 border-b border-gray-100">
            <span className="text-[10px] font-bold text-gray-400 tracking-wider">Reto</span>
            <span className="text-[10px] font-bold text-gray-400 tracking-wider text-center">%</span>
            <span className="text-[10px] font-bold text-gray-400 tracking-wider text-center">Puntos</span>
          </div>

          <div className="divide-y divide-gray-50">
            {RETOS_FIJOS.map(reto => {
              const pct = cumplimiento[reto.key] ?? null;
              const pts = calcularPuntos(pct);
              return (
                <div key={reto.key} className="grid grid-cols-[1fr_80px_48px] px-4 py-3 items-center">
                  <div className="flex items-center gap-2.5">
                    <span className="text-base shrink-0">{reto.icono}</span>
                    <p className="text-sm font-semibold text-gray-700 leading-tight">{reto.label}</p>
                  </div>
                  <div className="text-center">
                    {pct !== null ? (
                      <span className={`text-sm font-bold tabular-nums ${badgePct(pct)}`}>
                        {pct.toFixed(1)}%
                      </span>
                    ) : (
                      <span className="text-xs text-gray-300 font-mono">—</span>
                    )}
                  </div>
                  <div className="text-center">
                    {pct !== null ? (
                      <span className={`inline-flex items-center justify-center w-7 h-7 rounded-full text-xs font-bold ${pts > 0 ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-400"}`}>
                        {pts}
                      </span>
                    ) : (
                      <span className="text-xs text-gray-300 font-mono">—</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Escala de puntos */}
        <div
          className="rounded-2xl px-4 py-4 shadow-sm border border-white/20"
          style={{ background: "rgba(255,255,255,0.75)", backdropFilter: "blur(8px)" }}
        >
          <p className="text-xs font-bold text-gray-600 uppercase tracking-wider mb-1">¿Cómo se calculan tus puntos?</p>
          <p className="text-xs text-gray-500 mb-3 leading-relaxed">
            Desde <strong>100% de cumplimiento</strong> acumulas <strong>1 punto</strong> por reto.
            Cada <strong>5% adicional</strong> suma una oportunidad extra — cuanto más superes tu meta, más oportunidades tienes de ganar.
          </p>
          <p className="text-xs font-bold text-gray-600 uppercase tracking-wider mb-1">Ejemplo: </p>
          <div className="grid grid-cols-4 gap-1.5 text-center">
            {[
              { rango: "100–104%", pts: 1, color: "text-indigo-600" },
              { rango: "105–109%", pts: 2, color: "text-amber-500" },
              { rango: "110–114%", pts: 3, color: "text-emerald-600" },
              { rango: "115%+",    pts: 4, color: "text-emerald-700" },
            ].map(item => (
              <div key={item.rango} className="bg-white rounded-xl px-2 py-2.5 shadow-sm">
                <p className="text-[10px] text-gray-400 leading-tight">{item.rango}</p>
                <p className={`text-lg font-extrabold mt-0.5 ${item.color}`}>{item.pts}</p>
                <p className="text-[9px] text-gray-400">pt{item.pts > 1 ? "s" : ""}</p>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}
