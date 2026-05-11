import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useApp } from "../context/AppContext";
import { generatePointImages } from "../lib/pointImages";

const WHATSAPP_ADMIN = "593983621347";

type Cartilla = {
  id: number;
  puntos: number;
  estado: "activa" | "completa" | "cerrada";
  fecha_inicio: string;
};

type Props = { cartilla: Cartilla };

export function CartillaWidget({ cartilla }: Props) {
  const navigate = useNavigate();
  const { usuario } = useApp();
  const pointImages = useMemo(() => generatePointImages(10), []);
  const puntos = cartilla.puntos ?? 0;
  const completa = cartilla.estado === "completa" || puntos >= 10;
  const pct = (puntos / 10) * 100;

  const whatsappUrl = usuario && completa
    ? `https://wa.me/${WHATSAPP_ADMIN}?text=${encodeURIComponent(
        `Hola! Completé mi cartilla *Ponte la 10* 🎉\nCédula: ${usuario.cedula}\nNombre: ${usuario.nombre} ${usuario.apellido}\nPuntos: ${puntos}/10\nMe gustaría coordinar la entrega de mi premio.`
      )}`
    : null;

  return (
    <div
      className="rounded-[20px] shadow-md overflow-hidden"
      style={{
        background: "rgba(255,255,255,0.92)",
        border: "1px solid rgba(0,0,0,0.07)",
        backdropFilter: "blur(20px)",
      }}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-5 pt-5">
        <span className="font-condensed font-bold text-[12px] tracking-[0.14em] uppercase" style={{ color: "rgba(0,0,0,0.38)" }}>
          Tu cartilla activa
        </span>
      </div>

      {/* Score */}
      <div className="px-5 pt-2 flex items-baseline gap-2">
        <span className="font-condensed font-black leading-none" style={{ fontSize: "42px", color: "#d4960a" }}>
          {puntos}
        </span>
        <span className="font-barlow text-sm font-medium" style={{ color: "rgba(0,0,0,0.38)" }}>
          /10 pts
        </span>
        {completa && (
          <span
            className="ml-1 text-[10px] font-condensed font-bold tracking-wider px-2 py-0.5 rounded-full uppercase"
            style={{ background: "#f7c948", color: "#1a1000" }}
          >
            Completa
          </span>
        )}
      </div>

      {/* Slots — 2 filas × 5 coleccionables */}
      <div className="px-5 pt-3">
        <div className="grid grid-cols-5 gap-2">
          {Array.from({ length: 10 }, (_, i) => {
            const lleno = i < puntos;
            return (
              <div
                key={i}
                className="aspect-square rounded-xl flex items-center justify-center overflow-hidden"
                style={
                  lleno
                    ? {
                        background: "rgba(247, 201, 72, 0.14)",
                        border: "1.5px solid rgba(247, 201, 72, 0.45)",
                      }
                    : {
                        background: "rgba(0, 0, 0, 0.04)",
                        border: "1.5px dashed rgba(0, 0, 0, 0.13)",
                      }
                }
              >
                {lleno ? (
                  <img
                    src={pointImages[i]!}
                    alt="punto"
                    className="w-full h-full object-contain p-1"
                    style={{ filter: "drop-shadow(0 2px 5px rgba(212,150,10,0.45))" }}
                  />
                ) : (
                  <span className="text-[11px] font-mono font-bold" style={{ color: "rgba(0,0,0,0.20)" }}>
                    {i + 1}
                  </span>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Barra de progreso */}
      <div className="px-5 pt-4">
        <div className="relative h-1.5 rounded-full" style={{ background: "rgba(0,0,0,0.08)" }}>
          {puntos > 0 && (
            <div
              className="h-full rounded-full transition-all duration-700"
              style={{
                width: `${pct}%`,
                background: "linear-gradient(90deg, #f7c948 0%, #d4960a 100%)",
              }}
            />
          )}
          {puntos > 0 && (
            <div
              className="absolute top-1/2 -translate-y-1/2 w-3.5 h-3.5 rounded-full"
              style={{
                left: `calc(${Math.min(pct, 100)}% - 7px)`,
                background: "#d4960a",
                boxShadow: "0 0 10px 3px rgba(212,150,10,0.55)",
              }}
            />
          )}
        </div>
      </div>

      {/* Metadata */}
      <div className="px-5 pt-2.5 pb-5 flex items-center justify-between">
        <span className="text-[11px] font-barlow" style={{ color: "rgba(0,0,0,0.35)" }}>
          Inicio: {cartilla.fecha_inicio}
        </span>
        <span className="text-[11px] font-barlow" style={{ color: "rgba(0,0,0,0.35)" }}>
          {puntos} coleccionable{puntos !== 1 ? "s" : ""}
        </span>
      </div>

      {completa && whatsappUrl && (
        <div className="mx-5 mb-5 space-y-2">
          <a
            href={whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full flex items-center justify-center gap-2 py-3 rounded-xl font-condensed font-bold text-sm text-white transition-opacity hover:opacity-90"
            style={{ background: "#25d366" }}
          >
            <svg className="w-4 h-4 shrink-0" fill="currentColor" viewBox="0 0 24 24">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
            </svg>
            Coordinar mi premio por WhatsApp
          </a>
          <button
            onClick={() => navigate("/cartilla")}
            className="w-full py-2.5 rounded-xl font-condensed font-bold text-sm transition-opacity hover:opacity-70 cursor-pointer"
            style={{ background: "rgba(212,150,10,0.09)", color: "#996b00", border: "1px solid rgba(212,150,10,0.22)" }}
          >
            Ver detalle de cartilla
          </button>
        </div>
      )}
    </div>
  );
}
