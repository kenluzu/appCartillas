import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useApp } from "../context/AppContext";
import type { ComercialMetricas } from "../context/AppContext";
import { TopBar } from "../components/TopBar";

const RETOS_FIJOS = [
  { key: "utilidad",             label: "Utilidad",            icono: "💰" },
  { key: "volumen",              label: "Volumen",             icono: "📦" },
  { key: "lineas_estrategicas",  label: "Líneas Estratégicas", icono: "🎯" },
];

function adicionalPorPct(percent: number | null): number {
  // cada 5% adicional sobre el 100% suma 1 punto
  if (percent === null || percent < 100) return 0;
  return Math.floor((percent - 100) / 5);
}

function badgePct(pct: number | null) {
  if (pct === null) return "text-gray-300";
  if (pct >= 110) return "text-emerald-600";
  if (pct >= 105) return "text-amber-500";
  if (pct >= 100) return "text-indigo-600";
  return "text-red-400";
}

export function RetosComercial() {
  const { usuario, cartilla, canal, clearUserSession, comercialMetricas, setComercialMetricas, setCartilla } = useApp();
  const navigate = useNavigate();

  useEffect(() => {
    if (!usuario?.cedula) return;
    fetch(`/api/usuarios/validar-comercial?usuario=${encodeURIComponent(usuario.cedula)}`)
      .then(r => r.ok ? r.json() : null)
      .then((data: { cartilla: typeof cartilla; metricas: ComercialMetricas } | null) => {
        if (!data) return;
        setCartilla(data.cartilla);
        setComercialMetricas(data.metricas);
      })
      .catch(() => {});
  }, [usuario?.cedula]);

  if (!usuario || !cartilla) return null;

  const boletoAsegurado = comercialMetricas?.boleto_asegurado ?? 0;

  const adicionalPorIndicador: Record<string, number> = {
    utilidad:            comercialMetricas?.puntos_utilidad    ?? adicionalPorPct(comercialMetricas?.utilidad    ?? null),
    volumen:             comercialMetricas?.puntos_volumen     ?? adicionalPorPct(comercialMetricas?.volumen     ?? null),
    lineas_estrategicas: comercialMetricas?.puntos_estrategica ?? adicionalPorPct(comercialMetricas?.estrategica ?? null),
  };

  const totalAdicional = Object.values(adicionalPorIndicador).reduce((a, b) => a + b, 0);
  const puntos = boletoAsegurado + totalAdicional;

  const cumplimiento: Record<string, number | null> = {
    utilidad:            comercialMetricas?.utilidad    ?? null,
    volumen:             comercialMetricas?.volumen     ?? null,
    lineas_estrategicas: comercialMetricas?.estrategica ?? null,
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

        {/* Tabla de retos */}
        <div
          className="rounded-2xl overflow-hidden shadow-lg border border-white/20"
          style={{ background: "rgba(255,255,255,0.92)", backdropFilter: "blur(12px)" }}
        >
          <div className="px-4 py-3 border-b border-gray-100">
            <p className="font-bold text-gray-700 text-sm">Mis retos (% cumplimiento)</p>
          </div>

          {/* Cabeceras */}
          <div className="grid grid-cols-[1fr_72px_60px_60px] px-4 py-2 bg-gray-50 border-b border-gray-100">
            <span className="text-[10px] font-bold text-gray-400 tracking-wider">Reto</span>
            <span className="text-[10px] font-bold text-gray-400 tracking-wider text-center">%</span>
            <span className="text-[10px] font-bold text-gray-400 tracking-wider text-center">Asegurado</span>
            <span className="text-[10px] font-bold text-gray-400 tracking-wider text-center">Adicional</span>
          </div>

          {/* Fila boleto asegurado */}
          <div className="grid grid-cols-[1fr_72px_60px_60px] px-4 py-3 items-center bg-indigo-50/60 border-b border-indigo-100">
            <div className="flex items-center gap-2.5">
              <span className="text-base shrink-0">🎟️</span>
              <p className="text-xs font-semibold text-indigo-700 leading-tight">100% en los 3</p>
            </div>
            <div />
            <div className="text-center">
              <span className={`inline-flex items-center justify-center w-7 h-7 rounded-full text-xs font-bold ${boletoAsegurado > 0 ? "bg-indigo-100 text-indigo-700" : "bg-gray-100 text-gray-400"}`}>
                {boletoAsegurado}
              </span>
            </div>
            <div />
          </div>

          {/* Filas por indicador */}
          <div className="divide-y divide-gray-50">
            {RETOS_FIJOS.map(reto => {
              const pct = cumplimiento[reto.key] ?? null;
              const adicional = adicionalPorIndicador[reto.key] ?? 0;
              return (
                <div key={reto.key} className="grid grid-cols-[1fr_72px_60px_60px] px-4 py-3 items-center">
                  <div className="flex items-center gap-2.5">
                    <span className="text-base shrink-0">{reto.icono}</span>
                    <p className="text-sm font-semibold text-gray-700 leading-tight">{reto.label}</p>
                  </div>
                  <div className="text-center">
                    {pct !== null ? (
                      <span className={`text-sm font-bold tabular-nums ${badgePct(pct)}`}>
                        {Math.round(pct)}%
                      </span>
                    ) : (
                      <span className="text-xs text-gray-300 font-mono">—</span>
                    )}
                  </div>
                  <div />
                  <div className="text-center">
                    {pct !== null ? (
                      <span className={`inline-flex items-center justify-center w-7 h-7 rounded-full text-xs font-bold ${adicional > 0 ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-400"}`}>
                        {adicional}
                      </span>
                    ) : (
                      <span className="text-xs text-gray-300 font-mono">—</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Resumen total */}
          <div className="px-4 py-3 border-t border-gray-100 bg-gray-50 flex items-center justify-between">
            <div className="flex items-center gap-4 text-xs text-gray-500">
              <span>Asegurado: <strong className="text-indigo-700">{boletoAsegurado}</strong></span>
              <span>Adicional: <strong className="text-green-700">{totalAdicional}</strong></span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-bold text-gray-600">Total:</span>
              <span className="inline-flex items-center justify-center min-w-[28px] h-7 px-2 rounded-full text-sm font-extrabold bg-yellow-100 text-yellow-700">
                {puntos}
              </span>
            </div>
          </div>
        </div>

        {/* Escala de puntos */}
        <div
          className="rounded-2xl px-4 py-4 shadow-sm border border-white/20"
          style={{ background: "rgba(255,255,255,0.75)", backdropFilter: "blur(8px)" }}
        >
          <p className="text-xs font-bold text-gray-600 uppercase tracking-wider mb-1">¿Cómo se calculan tus boletos?</p>
          <p className="text-xs text-gray-500 mb-3 leading-relaxed">
            Al cumplir el <strong>100% en los 3 indicadores</strong> obtienes 1 boleto asegurado.
            Luego, <strong>cada 5% adicional por indicador individual</strong> suma un boleto extra.
          </p>
          <p className="text-xs font-bold text-gray-600 uppercase tracking-wider mb-2">Boletos adicionales por indicador:</p>
          <div className="grid grid-cols-4 gap-1.5 text-center">
            {[
              { rango: "100–104%", pts: 0, color: "text-gray-500" },
              { rango: "105–109%", pts: 1, color: "text-amber-500" },
              { rango: "110–114%", pts: 2, color: "text-emerald-600" },
              { rango: "115%+",    pts: 3, color: "text-emerald-700" },
            ].map(item => (
              <div key={item.rango} className="bg-white rounded-xl px-2 py-2.5 shadow-sm">
                <p className="text-[10px] text-gray-400 leading-tight">{item.rango}</p>
                <p className={`text-lg font-extrabold mt-0.5 ${item.color}`}>{item.pts}</p>
                <p className="text-[9px] text-gray-400">adic.</p>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}
