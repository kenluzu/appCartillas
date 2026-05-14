import { useMemo } from "react";
import { useApp } from "../context/AppContext";
import { generatePointImages } from "../lib/pointImages";
import { WhatsAppButton } from "./WhatsAppButton";

const WHATSAPP_ADMIN = "593981034795";

type Cartilla = {
  id: number;
  puntos: number;
  estado: "activa" | "completa" | "cerrada";
  fecha_inicio: string;
};

type Props = { cartilla: Cartilla };

export function CartillaWidget({ cartilla }: Props) {
  const { usuario } = useApp();
  const pointImages = useMemo(() => generatePointImages(10), []);
  const puntos = cartilla.puntos ?? 0;
  const completa = cartilla.estado === "completa" || puntos >= 10;
  const pct = (puntos / 10) * 100;

  const whatsappUrl = usuario && completa
    ? `https://wa.me/${WHATSAPP_ADMIN}?text=${encodeURIComponent(
        `Hola! Completé mi cartilla *Ponte la 10*\nCédula: ${usuario.cedula}\nNombre: ${usuario.nombre} ${usuario.apellido}\nTickets: ${puntos}/10\nMe gustaría coordinar la entrega de mi premio.`
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
          /10 tickets
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
          {puntos} ticket{puntos !== 1 ? "s" : ""}
        </span>
      </div>

      {completa && whatsappUrl && (
        <div className="mx-5 mb-5">
          <WhatsAppButton href={whatsappUrl} className="rounded-xl" />
        </div>
      )}
    </div>
  );
}
