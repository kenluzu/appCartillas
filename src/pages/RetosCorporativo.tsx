import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useApp } from "../context/AppContext";
import { TopBar } from "../components/TopBar";
import { CartillaWidget } from "../components/CartillaWidget";

type TipoReto = "contact_center" | "referido" | "lineas_estrategicas" | "productos_focos";

type FormState = {
  monto: string;
  numero_factura: string;
  campo_extra: string;
};

const RETO_CONFIG: Record<TipoReto, {
  titulo: string;
  subtitulo: string;
  icono: string;
  montoMin: number;
  labelExtra: string;
  labelFactura: string;
  accent: string;
  iconBg: string;
  colorBtn: string;
  borderColor: string;
}> = {
  contact_center: {
    titulo: "Compras C.C",
    subtitulo: "Compras >= $20",
    icono: "📞",
    montoMin: 20,
    labelExtra: "",
    labelFactura: "N° de referencia CC",
    accent: "text-indigo-600",
    iconBg: "bg-indigo-100",
    colorBtn: "bg-indigo-600 hover:bg-indigo-700",
    borderColor: "border-indigo-200",
  },
  referido: {
    titulo: "Factura Referido/a",
    subtitulo: "Desde $10",
    icono: "👥",
    montoMin: 10,
    labelExtra: "Nombre del referido/a",
    labelFactura: "N° de factura",
    accent: "text-purple-600",
    iconBg: "bg-purple-100",
    colorBtn: "bg-purple-600 hover:bg-purple-700",
    borderColor: "border-purple-200",
  },
  lineas_estrategicas: {
    titulo: "Líneas Estratégicas",
    subtitulo: "Desde $10",
    icono: "🎯",
    montoMin: 10,
    labelExtra: "Producto / Línea",
    labelFactura: "N° de factura",
    accent: "text-amber-600",
    iconBg: "bg-amber-100",
    colorBtn: "bg-amber-600 hover:bg-amber-700",
    borderColor: "border-amber-200",
  },
  productos_focos: {
    titulo: "Productos Focos",
    subtitulo: "Desde $10",
    icono: "⭐",
    montoMin: 10,
    labelExtra: "Nombre del producto",
    labelFactura: "N° de factura",
    accent: "text-emerald-600",
    iconBg: "bg-emerald-100",
    colorBtn: "bg-emerald-600 hover:bg-emerald-700",
    borderColor: "border-emerald-200",
  },
};

export function RetosCorporativo() {
  const { usuario, cartilla, canal, setCartilla, clearUserSession } = useApp();
  const navigate = useNavigate();
  const [modalActivo, setModalActivo] = useState<TipoReto | null>(null);
  const [form, setForm] = useState<FormState>({ monto: "", numero_factura: "", campo_extra: "" });
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState("");
  const [exito, setExito] = useState<string | null>(null);

  if (!usuario || !cartilla) return null;

  const puntos = cartilla.puntos ?? 0;
  const completa = cartilla.estado === "completa" || puntos >= 10;

  function abrirModal(tipo: TipoReto) {
    setModalActivo(tipo);
    setForm({ monto: "", numero_factura: "", campo_extra: "" });
    setError("");
    setExito(null);
  }

  function cerrarModal() {
    setModalActivo(null);
    setError("");
    setExito(null);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!modalActivo || !cartilla) return;

    const cfg = RETO_CONFIG[modalActivo];
    const montoNum = parseFloat(form.monto);

    if (isNaN(montoNum) || montoNum < cfg.montoMin) {
      setError(`El monto mínimo para este reto es $${cfg.montoMin}`);
      return;
    }

    const descripcion = form.campo_extra.trim()
      ? `${cfg.labelExtra}: ${form.campo_extra.trim()}`
      : undefined;

    setEnviando(true);
    setError("");
    try {
      const res = await fetch("/api/usuarios/reto", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          cartilla_id: cartilla.id,
          tipo_reto: modalActivo,
          monto: montoNum,
          numero_factura: form.numero_factura.trim() || undefined,
          descripcion,
        }),
      });

      const data = await res.json() as Record<string, unknown>;
      if (!res.ok) { setError((data.error as string) ?? "Error al registrar"); return; }

      const nuevaCartilla = data.cartilla as typeof cartilla;
      setCartilla(nuevaCartilla);

      if (nuevaCartilla.estado === "completa" || nuevaCartilla.puntos >= 10) {
        setExito(`¡Felicitaciones! Completaste tu cartilla con ${nuevaCartilla.puntos}/10 puntos. Ve a tu cartilla para coordinar tu premio.`);
      } else {
        setExito(`¡Punto registrado! Tu cartilla ahora tiene ${nuevaCartilla.puntos}/10 puntos.`);
      }
    } catch {
      setError("Error de conexión. Intenta de nuevo.");
    } finally {
      setEnviando(false);
    }
  }

  const cfg = modalActivo ? RETO_CONFIG[modalActivo] : null;

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
        <CartillaWidget cartilla={cartilla} />

        {/* Cards de retos */}
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            {(Object.keys(RETO_CONFIG) as TipoReto[]).map(tipo => {
              const c = RETO_CONFIG[tipo];
              return (
                <button
                  key={tipo}
                  onClick={() => abrirModal(tipo)}
                  disabled={completa}
                  className={`flex flex-col gap-3 p-4 rounded-2xl text-left transition-all duration-200 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl hover:-translate-y-0.5 active:scale-[0.97] border ${c.borderColor}`}
                  style={{ background: "rgba(255,255,255,0.92)", backdropFilter: "blur(8px)" }}
                >
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${c.iconBg}`}>
                    <span className="text-xl leading-none">{c.icono}</span>
                  </div>
                  <div>
                    <p className={`font-bold text-sm leading-tight ${c.accent}`}>{c.titulo}</p>
                    <p className="text-gray-400 text-xs mt-0.5 leading-snug">{c.subtitulo}</p>
                  </div>
                </button>
              );
            })}
          </div>
          {completa && (
            <p className="text-center text-xs text-white/60 drop-shadow">
              Cartilla completa — coordina tu premio antes de iniciar una nueva.
            </p>
          )}
        </div>

        {/* Historial */}
        <button
          onClick={() => navigate("/historial")}
          className="w-full flex items-center gap-3 rounded-2xl px-4 py-3.5 text-left shadow-lg hover:shadow-xl transition-all duration-200 cursor-pointer active:scale-[0.99] border border-white/60"
          style={{ background: "rgba(255,255,255,0.88)", backdropFilter: "blur(12px)" }}
        >
          <div className="w-9 h-9 rounded-xl flex items-center justify-center bg-amber-100 shrink-0">
            <svg className="w-4 h-4 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div className="flex-1">
            <p className="font-bold text-gray-800 text-sm">Historial de cartillas</p>
            <p className="text-gray-400 text-xs">Ver todas mis cartillas anteriores</p>
          </div>
          <svg className="w-4 h-4 text-gray-300 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>

      {/* Modal */}
      {modalActivo && cfg && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: "rgba(0,0,0,0.55)", backdropFilter: "blur(6px)" }}
          onClick={e => { if (e.target === e.currentTarget) cerrarModal(); }}
        >
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-sm overflow-hidden">
            <div className="px-5 pt-5 pb-4 border-b border-gray-100 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${cfg.iconBg}`}>
                  <span className="text-xl">{cfg.icono}</span>
                </div>
                <div>
                  <p className={`font-bold text-base ${cfg.accent}`}>{cfg.titulo}</p>
                  <p className="text-xs text-gray-400">{cfg.subtitulo}</p>
                </div>
              </div>
              <button onClick={cerrarModal} className="p-2 rounded-xl hover:bg-gray-100 text-gray-400 cursor-pointer">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="px-5 py-5">
              {modalActivo !== "referido" ? (
                <div className="space-y-4">
                  <div className="flex gap-3 bg-blue-50 border border-blue-100 rounded-2xl p-4">
                    <svg className="w-5 h-5 text-blue-400 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M11.25 11.25l.041-.02a.75.75 0 011.063.852l-.708 2.836a.75.75 0 001.063.853l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9-3.75h.008v.008H12V8.25z" />
                    </svg>
                    <p className="text-sm text-blue-700 leading-relaxed">
                      Este reto se registra automáticamente desde <strong>Neptuno</strong>. No requiere ingreso manual de datos.
                    </p>
                  </div>
                  <button onClick={cerrarModal} className="w-full bg-gray-100 hover:bg-gray-200 text-gray-600 font-bold py-3 rounded-2xl cursor-pointer text-sm">
                    Cerrar
                  </button>
                </div>
              ) : exito ? (
                <div className="text-center py-4">
                  <div className="text-5xl mb-3">🎉</div>
                  <p className="text-emerald-700 font-semibold text-sm leading-relaxed">{exito}</p>
                  <button onClick={cerrarModal} className="mt-5 w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3 rounded-2xl cursor-pointer text-sm">
                    Continuar
                  </button>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-4">
                  {cfg.labelExtra && (
                    <div>
                      <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-1.5">{cfg.labelExtra}</label>
                      <input type="text" value={form.campo_extra} onChange={e => setForm(p => ({ ...p, campo_extra: e.target.value }))} required className="w-full bg-gray-50 rounded-xl px-4 py-2.5 text-sm border border-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-300" />
                    </div>
                  )}
                  {cfg.labelFactura && (
                    <div>
                      <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-1.5">{cfg.labelFactura}</label>
                      <input type="text" value={form.numero_factura} onChange={e => setForm(p => ({ ...p, numero_factura: e.target.value }))} required className="w-full bg-gray-50 rounded-xl px-4 py-2.5 text-sm border border-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-300" />
                    </div>
                  )}
                  <div>
                    <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-1.5">
                      Monto <span className="normal-case font-normal">(mín. ${cfg.montoMin})</span>
                    </label>
                    <div className="relative">
                      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 text-sm font-semibold">$</span>
                      <input type="number" step="0.01" min={cfg.montoMin} value={form.monto} onChange={e => setForm(p => ({ ...p, monto: e.target.value }))} required placeholder={`${cfg.montoMin}.00`} className="w-full bg-gray-50 rounded-xl pl-8 pr-4 py-2.5 text-sm border border-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-300" />
                    </div>
                  </div>
                  {error && <p className="text-red-600 text-xs bg-red-50 rounded-xl p-3 border border-red-100">{error}</p>}
                  <div className="flex gap-2 pt-1">
                    <button type="button" onClick={cerrarModal} className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-600 font-bold py-3 rounded-2xl cursor-pointer text-sm">Cancelar</button>
                    <button type="submit" disabled={enviando} className={`flex-1 ${cfg.colorBtn} disabled:bg-gray-100 disabled:text-gray-400 text-white font-bold py-3 rounded-2xl cursor-pointer text-sm`}>
                      {enviando ? "Registrando..." : "Registrar"}
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
