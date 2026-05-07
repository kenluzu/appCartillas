import { useState } from "react";
import { useNavigate } from "react-router-dom";

type Cartilla = {
  id: number;
  puntos: number;
  estado: "activa" | "completa" | "cerrada";
  fecha_inicio: string;
};

type Props = {
  cartilla: Cartilla;
};

export function CartillaWidget({ cartilla }: Props) {
  const navigate = useNavigate();
  const [expandida, setExpandida] = useState(true);
  const puntos = cartilla.puntos ?? 0;
  const completa = cartilla.estado === "completa" || puntos >= 10;

  return (
    <div
      className="rounded-2xl overflow-hidden shadow-lg border border-white/20"
      style={{ background: "rgba(255,255,255,0.92)", backdropFilter: "blur(12px)" }}
    >
      <button
        onClick={() => setExpandida(v => !v)}
        className="w-full flex items-center gap-3 px-4 py-3 cursor-pointer hover:bg-black/[0.02] transition-colors"
      >
        <div className="flex gap-1 shrink-0">
          {Array.from({ length: 10 }, (_, i) => (
            <div
              key={i}
              className={`w-2.5 h-2.5 rounded-full transition-colors ${i < puntos ? "bg-green-500" : "bg-gray-200"}`}
            />
          ))}
        </div>
        <span className="flex-1 text-left text-sm font-semibold text-gray-700 tabular-nums">
          {puntos}/10 pts
        </span>
        {completa && (
          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-yellow-100 text-yellow-700 shrink-0">
            Completa 🎉
          </span>
        )}
        <svg
          className={`w-4 h-4 text-gray-400 shrink-0 transition-transform duration-200 ${expandida ? "rotate-180" : ""}`}
          fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {expandida && (
        <div className="px-4 pb-4 border-t border-gray-100 pt-3 space-y-3">
          <div className="grid grid-cols-5 gap-2">
            {Array.from({ length: 10 }, (_, i) => (
              <div
                key={i}
                className={`aspect-square rounded-lg flex items-center justify-center text-base ${i < puntos ? "bg-green-500 shadow-sm" : "bg-gray-100 border-2 border-dashed border-gray-200"}`}
              >
                {i < puntos ? "⭐" : <span className="text-xs text-gray-300 font-mono">{i + 1}</span>}
              </div>
            ))}
          </div>
          <div className="flex items-center justify-between">
            <p className="text-xs text-gray-400">Inicio: {cartilla.fecha_inicio}</p>
            <button
              onClick={() => navigate("/cartilla")}
              className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 transition-colors cursor-pointer"
            >
              Ver detalle →
            </button>
          </div>
          {completa && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-2.5 text-xs text-yellow-800 font-medium text-center">
              ¡Cartilla completa! Ve al detalle para coordinar tu premio.
            </div>
          )}
        </div>
      )}
    </div>
  );
}
