import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useApp } from "../context/AppContext";
import { TopBar } from "../components/TopBar";
import { CartillaWidget } from "../components/CartillaWidget";
import { WhatsAppButton, buildWhatsAppUrl } from "../components/WhatsAppButton";

type TipoReto = "contact_center" | "referido" | "lineas_estrategicas" | "productos_focos";

type FormState = {
  monto: string;
  numero_factura: string;
  campo_extra: string;
  cedula_referido: string;
  celular_referido: string;
};

const WHATSAPP_NUMERO = "593992066000";
const WHATSAPP_MENSAJE = "Hola, quisiera realizar una compra para el programa *Ponte la 10*.";

type RetoConfig = {
  titulo: string;
  descripcion: string;
  icon: React.ReactNode;
  montoMin: number;
  labelExtra: string;
  labelFactura: string;
  color: string;
  mecanica: string;
  tieneWhatsapp: boolean;
};

const PhoneIcon = () => (
  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 002.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 01-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 00-1.091-.852H4.5A2.25 2.25 0 002.25 4.5v2.25z" />
  </svg>
);

const UsersIcon = () => (
  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />
  </svg>
);

const TargetIcon = () => (
  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 21a9.004 9.004 0 008.716-6.747M12 21a9.004 9.004 0 01-8.716-6.747M12 21c2.485 0 4.5-4.03 4.5-9S14.485 3 12 3m0 18c-2.485 0-4.5-4.03-4.5-9S9.515 3 12 3m0 0a8.997 8.997 0 017.843 4.582M12 3a8.997 8.997 0 00-7.843 4.582m15.686 0A11.953 11.953 0 0112 10.5c-2.998 0-5.74-1.1-7.843-2.918m15.686 0A8.959 8.959 0 0121 12c0 .778-.099 1.533-.284 2.253m0 0A17.919 17.919 0 0112 16.5c-3.162 0-6.133-.815-8.716-2.247m0 0A9.015 9.015 0 013 12c0-1.605.42-3.113 1.157-4.418" />
  </svg>
);

const StarIcon = () => (
  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.562.562 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.499z" />
  </svg>
);

const RETO_CONFIG: Record<TipoReto, RetoConfig> = {
  contact_center: {
    titulo: "Goleada General",
    descripcion: "Compras vía Contact Center desde $20",
    icon: <PhoneIcon />,
    montoMin: 20,
    labelExtra: "",
    labelFactura: "N° de referencia CC",
    color: "#d45bf8",
    mecanica: "Por cada $20,00 en compra en cualquier producto de Farmacias Cruz Azul, a través de call center obtienes un ticket para tu cartilla.",
    tieneWhatsapp: true,
  },
  referido: {
    titulo: "Refiere a tu 10",
    descripcion: "Trae a un referido y suma desde $20",
    icon: <UsersIcon />,
    montoMin: 20,
    labelExtra: "Nombre del referido/a",
    labelFactura: "N° de factura",
    color: "#ff3030",
    mecanica: "Registra el número de una factura mayor o igual a $20,00 que se haya realizado en cualquier Farmacia Cruz Azul de Farmcorp a nivel nacional y obtén un ticket para tu cartilla.",
    tieneWhatsapp: false,
  },
  lineas_estrategicas: {
    titulo: "Jugada Estratégica",
    descripcion: "Compras en líneas estratégicas desde $20",
    icon: <TargetIcon />,
    montoMin: 20,
    labelExtra: "Producto / Línea",
    labelFactura: "N° de factura",
    color: "#292cd8",
    mecanica: "Por cada $20,00 en compra que incluyan cualquier producto de las líneas estratégicas de Farmacias Cruz Azul, a través de call center obtienes un ticket para tu cartilla.",
    tieneWhatsapp: true,
  },
  productos_focos: {
    titulo: "Enfoca el Arco",
    descripcion: "Compras en productos focos desde $20",
    icon: <StarIcon />,
    montoMin: 20,
    labelExtra: "Nombre del producto",
    labelFactura: "N° de factura",
    color: "#22deff",
    mecanica: "Por cada $20,00 en compra que incluyan cualquier producto foco de Farmacias Cruz Azul, a través de call center obtienes un ticket para tu cartilla.",
    tieneWhatsapp: true,
  },
};

type FacturaGoleada = {
  numero_factura: string;
  periodo: number;
  monto_total: number;
};

export function RetosCorporativo() {
  const { usuario, cartilla, canal, setCartilla, clearUserSession } = useApp();
  const navigate = useNavigate();
  const [modalActivo, setModalActivo] = useState<TipoReto | null>(null);
  const [mostrarMecanica, setMostrarMecanica] = useState(false);
  const [form, setForm] = useState<FormState>({ monto: "", numero_factura: "", campo_extra: "", cedula_referido: "", celular_referido: "" });
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState("");
  const [exito, setExito] = useState<string | null>(null);
  const [hoveredReto, setHoveredReto] = useState<TipoReto | null>(null);
  const [facturasGoleada, setFacturasGoleada] = useState<FacturaGoleada[]>([]);
  const [facturasEstrategica, setFacturasEstrategica] = useState<FacturaGoleada[]>([]);
  const [facturasFoco, setFacturasFoco] = useState<FacturaGoleada[]>([]);
  const [cargandoFacturas, setCargandoFacturas] = useState(false);
  const [retosReferido, setRetosReferido] = useState<{ id: number; numero_factura: string | null; monto: number; fecha_registro: string }[]>([]);
  const [cargandoReferidos, setCargandoReferidos] = useState(false);
  type CartillaData = { id: number; puntos: number; estado: "activa" | "completa" | "cerrada"; fecha_inicio: string };
  const [cartillasCompletadas, setCartillasCompletadas] = useState<CartillaData[]>([]);

  useEffect(() => {
    if (!usuario?.cedula || !cartilla?.id) return;
    const usuarioId = usuario.id;
    const cartillaId = cartilla.id;
    setCargandoFacturas(true);
    (async () => {
      try {
        const [syncRes, retosRes, historialRes] = await Promise.all([
          fetch(`/api/usuarios/sincronizar-retos?cod_cliente=${usuario.cod_cliente ?? 0}&cartilla_id=${cartillaId}`),
          fetch(`/api/usuarios/retos/${cartillaId}`),
          fetch(`/api/usuarios/historial?usuario_id=${usuarioId}`),
        ]);
        const data = await syncRes.json() as { goleada: FacturaGoleada[]; estrategica: FacturaGoleada[]; foco: FacturaGoleada[]; cartilla: CartillaData };
        setFacturasGoleada(data.goleada ?? []);
        setFacturasEstrategica(data.estrategica ?? []);
        setFacturasFoco(data.foco ?? []);
        if (retosRes.ok) {
          const todosRetos = await retosRes.json() as { tipo_reto: string; id: number; numero_factura: string | null; monto: number; fecha_registro: string }[];
          if (Array.isArray(todosRetos)) setRetosReferido(todosRetos.filter(x => x.tipo_reto === "referido"));
        }
        if (historialRes.ok) {
          const historial = await historialRes.json() as { id: number; puntos: number; estado: string; fecha_inicio: string }[];
          if (Array.isArray(historial)) {
            setCartillasCompletadas(
              historial
                .filter(c => (c.estado === "completa" || c.puntos >= 10) && c.id !== cartillaId)
                .map(c => ({ id: c.id, puntos: c.puntos, estado: c.estado as CartillaData["estado"], fecha_inicio: c.fecha_inicio }))
            );
          }
        }
        if (data.cartilla) {
          setCartilla(data.cartilla);
          if (data.cartilla.estado === "completa" || data.cartilla.puntos >= 10) {
            const nr = await fetch("/api/usuarios/nueva-cartilla", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ usuario_id: usuarioId }),
            });
            if (nr.ok) {
              const nueva = await nr.json() as CartillaData;
              setCartillasCompletadas(prev => [data.cartilla, ...prev.filter(c => c.id !== data.cartilla.id)]);
              setCartilla(nueva);
            }
          }
        }
      } catch { /* silencioso */ }
      finally { setCargandoFacturas(false); }
    })();
  }, []);

  if (!usuario || !cartilla) return null;

  const puntos = cartilla.puntos ?? 0;

  const ticketsPorTipo: Record<TipoReto, number> = {
    contact_center:      facturasGoleada.reduce((s, f) => s + Math.floor(Number(f.monto_total) / 20), 0),
    lineas_estrategicas: facturasEstrategica.reduce((s, f) => s + Math.floor(Number(f.monto_total) / 20), 0),
    productos_focos:     facturasFoco.reduce((s, f) => s + Math.floor(Number(f.monto_total) / 20), 0),
    referido:            retosReferido.reduce((s, r) => s + Math.floor(Number(r.monto) / 20), 0),
  };

  async function autoNuevaCartilla(completada: CartillaData) {
    if (!usuario) return;
    try {
      const r = await fetch("/api/usuarios/nueva-cartilla", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ usuario_id: usuario.id }),
      });
      if (r.ok) {
        const nueva = await r.json() as CartillaData;
        setCartillasCompletadas(prev => [completada, ...prev]);
        setCartilla(nueva);
      }
    } catch { /* silencioso */ }
  }

  function renderFacturasList(facturas: FacturaGoleada[], color: string) {
    if (cargandoFacturas) return <div className="py-8 text-center font-barlow text-sm text-gray-400">Cargando facturas…</div>;
    if (facturas.length === 0) return <div className="py-8 text-center"><p className="font-barlow text-sm text-gray-400">Sin facturas calificadas en el período.</p></div>;
    return (
      <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
        {facturas.map((f, i) => (
          <div key={i} className="flex items-center justify-between rounded-xl px-4 py-3"
            style={{ background: `${color}10`, border: `1px solid ${color}25` }}>
            <div>
              <p className="font-condensed font-bold text-sm leading-tight" style={{ color: "rgba(0,0,0,0.82)" }}>{f.numero_factura}</p>
              <p className="font-barlow text-xs mt-0.5" style={{ color: "rgba(0,0,0,0.42)" }}>{String(f.periodo).replace(/^(\d{4})(\d{2})(\d{2})$/, "$1-$2-$3")}</p>
            </div>
            <p className="font-condensed font-bold text-base" style={{ color }}>${Number(f.monto_total).toFixed(2)}</p>
          </div>
        ))}
      </div>
    );
  }

  async function cargarRetosReferido() {
    if (!cartilla?.id) return;
    setCargandoReferidos(true);
    try {
      const r = await fetch(`/api/usuarios/retos/${cartilla.id}`);
      const data = await r.json() as { tipo_reto: string; id: number; numero_factura: string | null; monto: number; fecha_registro: string }[];
      if (Array.isArray(data)) setRetosReferido(data.filter(x => x.tipo_reto === "referido"));
    } catch { /* silencioso */ }
    finally { setCargandoReferidos(false); }
  }

  function abrirModal(tipo: TipoReto) {
    setModalActivo(tipo);
    setMostrarMecanica(false);
    setForm({ monto: "", numero_factura: "", campo_extra: "", cedula_referido: "", celular_referido: "" });
    setError("");
    setExito(null);
    if (tipo === "referido") cargarRetosReferido();
  }

  function cerrarModal() {
    setModalActivo(null);
    setMostrarMecanica(false);
    setError("");
    setExito(null);
  }

  async function handleSubmitReferido(e: React.FormEvent) {
    e.preventDefault();
    if (!cartilla) return;

    const descripcion = form.campo_extra.trim()
      ? form.campo_extra.trim()
      : undefined;

    if (retosReferido.some(r => r.numero_factura === form.numero_factura.trim())) {
      setError("Esta factura ya fue registrada en una cartilla.");
      return;
    }

    setEnviando(true);
    setError("");
    try {
      const res = await fetch("/api/usuarios/reto/referido", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          cartilla_id: cartilla.id,
          numero_factura: form.numero_factura.trim(),
          descripcion,
          cedula_referido: form.cedula_referido.trim() || undefined,
          celular_referido: form.celular_referido.trim() || undefined,
        }),
      });

      const data = await res.json() as Record<string, unknown>;
      if (!res.ok) { setError((data.error as string) ?? "Error al registrar"); return; }

      const nuevaCartilla = data.cartilla as typeof cartilla;
      const monto = data.monto as number;
      setCartilla(nuevaCartilla);
      await cargarRetosReferido();

      if (nuevaCartilla.estado === "completa" || nuevaCartilla.puntos >= 10) {
        setExito(`¡Felicitaciones! Completaste tu cartilla con ${nuevaCartilla.puntos}/10 tickets. Factura $${Number(monto).toFixed(2)} validada.`);
        autoNuevaCartilla(nuevaCartilla);
      } else {
        setExito(`¡Ticket registrado! Factura $${Number(monto).toFixed(2)} validada. Tu cartilla ahora tiene ${nuevaCartilla.puntos}/10 tickets.`);
      }
    } catch {
      setError("Error de conexión. Intenta de nuevo.");
    } finally {
      setEnviando(false);
    }
  }

  const cfg = modalActivo ? RETO_CONFIG[modalActivo] : null;

  return (
    <div className="min-h-screen pt-18 pb-8 px-4">
      <TopBar
        nombre={usuario.nombre}
        apellido={usuario.apellido}
        cedula={usuario.cedula}
        canal={canal}
        puntos={puntos}
        accion={{ label: "Salir", icono: "salir", onClick: () => { clearUserSession(); navigate("/"); } }}
      />

      <div className="max-w-lg mx-auto space-y-4 mt-6">

        {/* Cartilla activa */}
        <div className="animate-fade-in-up stagger-1">
          <CartillaWidget cartilla={cartilla} />
        </div>

        {/* Cartillas completadas (folded) */}
        {cartillasCompletadas.map(c => (
          <div key={c.id} className="animate-fade-in-up rounded-[20px] overflow-hidden" style={{ background: "rgba(247,201,72,0.18)", border: "1.5px solid rgba(212,150,10,0.40)" }}>
            <div className="px-5 py-4 flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-condensed font-bold text-base leading-tight" style={{ color: "#7a4e00" }}>Cartilla completada</span>
                  <span className="text-[9px] font-condensed font-bold tracking-wider px-2 py-0.5 rounded-full uppercase" style={{ background: "#d4960a", color: "#fff" }}>✓ Lista</span>
                </div>
                <p className="font-barlow text-xs mt-0.5" style={{ color: "rgba(0,0,0,0.45)" }}>10/10 tickets · Inicio: {c.fecha_inicio}</p>
              </div>
            </div>
            <div className="px-5 pb-4">
              <WhatsAppButton
                className="rounded-xl py-2.5"
                href={buildWhatsAppUrl("593981034795", `Hola! Completé mi cartilla *Ponte la 10*\nCédula: ${usuario.cedula}\nNombre: ${usuario.nombre} ${usuario.apellido}\nMe gustaría coordinar la entrega de mi premio.`)}
              />
            </div>
          </div>
        ))}

        {/* Label — mecánicas */}
        <div className="animate-fade-in-up stagger-2 pt-1">
          <p className="font-condensed font-bold text-[12px] tracking-[0.14em] uppercase" style={{ color: "rgba(0,0,0,0.40)" }}>
            Cómo ganar tickets
          </p>
        </div>

        {/* Grid de mecánicas */}
        <div className="animate-fade-in-up stagger-3">
          <div className="grid grid-cols-2 gap-3">
            {(Object.keys(RETO_CONFIG) as TipoReto[]).map(tipo => {
              const c = RETO_CONFIG[tipo];
              const hovered = hoveredReto === tipo;
              return (
                <button
                  key={tipo}
                  onClick={() => abrirModal(tipo)}
                  onMouseEnter={() => setHoveredReto(tipo)}
                  onMouseLeave={() => setHoveredReto(null)}
                  className="flex flex-col gap-3 p-[18px] rounded-2xl text-left cursor-pointer"
                  style={{
                    background: hovered ? `${c.color}20` : "rgba(255,255,255,0.92)",
                    border: `1px solid ${hovered ? c.color + "40" : "rgba(0,0,0,0.07)"}`,
                    backdropFilter: "blur(16px)",
                    transform: hovered ? "translateY(-2px)" : "translateY(0)",
                    transition: "all 0.2s ease",
                    boxShadow: hovered ? `0 8px 24px ${c.color}22` : "0 2px 10px rgba(0,0,0,0.07)",
                  }}
                >
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                    style={{ background: `${c.color}26`, color: c.color }}
                  >
                    {c.icon}
                  </div>
                  <div>
                    <p className="font-condensed font-bold text-[16px] leading-tight" style={{ color: c.color }}>
                      {c.titulo}
                    </p>
                    <p className="font-barlow text-[12px] mt-1 leading-[1.55]" style={{ color: "rgba(0,0,0,0.85)" }}>
                      {c.descripcion}
                    </p>
                    <span
                      className="inline-block mt-2 text-[11px] font-condensed font-bold px-2 py-0.5 rounded-full"
                      style={{ background: `${c.color}18`, color: c.color }}
                    >
                      {cargandoFacturas ? "…" : `${ticketsPorTipo[tipo]} ticket${ticketsPorTipo[tipo] !== 1 ? "s" : ""}`}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>

        </div>

        {/* Label — historial */}
        <div className="animate-fade-in-up stagger-4 pt-1">
          <p className="font-condensed font-bold text-[12px] tracking-[0.14em] uppercase" style={{ color: "rgba(0,0,0,0.40)" }}>
            Mis cartillas
          </p>
        </div>

        {/* Card de historial */}
        <div className="animate-fade-in-up stagger-4">
          <button
            onClick={() => navigate("/historial")}
            className="w-full flex items-center gap-3 rounded-2xl px-4 py-3.5 text-left cursor-pointer"
            style={{
              background: "rgba(255,255,255,0.92)",
              border: "1px solid rgba(0,0,0,0.07)",
              backdropFilter: "blur(16px)",
              transition: "all 0.2s ease",
              boxShadow: "0 2px 10px rgba(0,0,0,0.07)",
            }}
            onMouseEnter={e => {
              const el = e.currentTarget;
              el.style.transform = "translateY(-2px)";
              el.style.background = "rgba(247,201,72,0.09)";
              el.style.borderColor = "rgba(212,150,10,0.28)";
              el.style.boxShadow = "0 8px 24px rgba(212,150,10,0.15)";
            }}
            onMouseLeave={e => {
              const el = e.currentTarget;
              el.style.transform = "translateY(0)";
              el.style.background = "rgba(255,255,255,0.92)";
              el.style.borderColor = "rgba(0,0,0,0.07)";
              el.style.boxShadow = "0 2px 10px rgba(0,0,0,0.07)";
            }}
          >
            <div
              className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
              style={{ background: "rgba(212,150,10,0.12)", color: "#c8860a" }}
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-condensed font-bold text-[15px] leading-tight" style={{ color: "rgba(0,0,0,0.82)" }}>
                Historial de cartillas
              </p>
              <p className="font-barlow text-[12px] mt-0.5" style={{ color: "rgba(0,0,0,0.42)" }}>
                Ver todas mis cartillas anteriores
              </p>
            </div>
            <svg className="w-4 h-4 shrink-0" style={{ color: "rgba(0,0,0,0.22)" }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>
      </div>

      {/* Modal */}
      {modalActivo && cfg && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: "rgba(0,0,0,0.65)", backdropFilter: "blur(8px)" }}
          onClick={e => { if (e.target === e.currentTarget) cerrarModal(); }}
        >
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-sm overflow-hidden">
            <div className="px-5 pt-5 pb-4 border-b border-gray-100">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center"
                    style={{ background: `${cfg.color}20`, color: cfg.color }}
                  >
                    {cfg.icon}
                  </div>
                  <div>
                    <p className="font-condensed font-bold text-base" style={{ color: cfg.color }}>{cfg.titulo}</p>
                    <p className="font-barlow text-xs text-gray-400">{cfg.descripcion}</p>
                  </div>
                </div>
                <button onClick={cerrarModal} className="p-2 rounded-xl hover:bg-gray-100 text-gray-400 cursor-pointer">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              {/* Botón ver mecánica */}
              <button
                onClick={() => setMostrarMecanica(v => !v)}
                className="mt-3 flex items-center gap-1.5 text-xs font-barlow cursor-pointer transition-colors"
                style={{ color: mostrarMecanica ? cfg.color : "rgba(0,0,0,0.38)" }}
              >
                <svg className="w-3.5 h-3.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M11.25 11.25l.041-.02a.75.75 0 011.063.852l-.708 2.836a.75.75 0 001.063.853l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9-3.75h.008v.008H12V8.25z" />
                </svg>
                Ver detalle de mecánica
                <svg className={`w-3 h-3 transition-transform ${mostrarMecanica ? "rotate-180" : ""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              {mostrarMecanica && (
                <p className="mt-2 font-barlow text-xs leading-relaxed rounded-xl px-3 py-2.5" style={{ background: `${cfg.color}10`, color: "rgba(0,0,0,0.72)", border: `1px solid ${cfg.color}25` }}>
                  {cfg.mecanica}
                </p>
              )}
            </div>

            <div className="px-5 py-2">
              {modalActivo === "contact_center" ? (
                <div className="space-y-3">
                  <p className="font-barlow text-xs text-gray-400 text-center">Facturas del 15 dic 2025 al 15 ene 2026</p>
                  {renderFacturasList(facturasGoleada, cfg.color)}
                  <WhatsAppButton href={buildWhatsAppUrl(WHATSAPP_NUMERO, WHATSAPP_MENSAJE)} label="Hacer una compra" />
                  <button onClick={cerrarModal} className="w-full bg-gray-100 hover:bg-gray-200 text-gray-600 font-condensed font-bold py-3 rounded-2xl cursor-pointer text-sm">Cerrar</button>
                </div>
              ) : modalActivo === "lineas_estrategicas" ? (
                <div className="space-y-2">
                  <p className="font-barlow text-xs text-gray-400 text-center">Facturas del 15 dic 2025 al 15 ene 2026</p>
                  {renderFacturasList(facturasEstrategica, cfg.color)}
                  <WhatsAppButton href={buildWhatsAppUrl(WHATSAPP_NUMERO, WHATSAPP_MENSAJE)} label="Hacer una compra" />
                  <button onClick={cerrarModal} className="w-full bg-gray-100 hover:bg-gray-200 text-gray-600 font-condensed font-bold py-3 rounded-2xl cursor-pointer text-sm">Cerrar</button>
                </div>
              ) : modalActivo === "productos_focos" ? (
                <div className="space-y-2">
                  <p className="font-barlow text-xs text-gray-400 text-center">Facturas del 15 dic 2025 al 15 ene 2026</p>
                  {renderFacturasList(facturasFoco, cfg.color)}
                  <WhatsAppButton href={buildWhatsAppUrl(WHATSAPP_NUMERO, WHATSAPP_MENSAJE)} label="Hacer una compra" />
                  <button onClick={cerrarModal} className="w-full bg-gray-100 hover:bg-gray-200 text-gray-600 font-condensed font-bold py-3 rounded-2xl cursor-pointer text-sm">Cerrar</button>
                </div>
              ) : modalActivo !== "referido" ? (
                <div className="space-y-4">
                  <div className="flex gap-3 bg-blue-50 border border-blue-100 rounded-2xl p-4">
                    <svg className="w-5 h-5 text-blue-400 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M11.25 11.25l.041-.02a.75.75 0 011.063.852l-.708 2.836a.75.75 0 001.063.853l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9-3.75h.008v.008H12V8.25z" />
                    </svg>
                    <p className="font-barlow text-sm text-blue-700 leading-relaxed">
                      Este reto se registra automáticamente desde <strong>Neptuno</strong>. No requiere ingreso manual de datos.
                    </p>
                  </div>
                  <button onClick={cerrarModal} className="w-full bg-gray-100 hover:bg-gray-200 text-gray-600 font-condensed font-bold py-3 rounded-2xl cursor-pointer text-sm">
                    Cerrar
                  </button>
                </div>
              ) : exito ? (
                <div className="text-center py-4">
                  <div className="text-5xl mb-3">🎉</div>
                  <p className="font-barlow text-emerald-700 font-semibold text-sm leading-relaxed">{exito}</p>
                  <button onClick={cerrarModal} className="mt-5 w-full bg-emerald-600 hover:bg-emerald-700 text-white font-condensed font-bold py-3 rounded-2xl cursor-pointer text-sm">
                    Continuar
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  {cargandoReferidos ? (
                    <p className="font-barlow text-xs text-gray-400 text-center py-2">Cargando registros…</p>
                  ) : retosReferido.length > 0 && (
                    <div>
                      <p className="font-condensed font-bold text-xs text-gray-400 uppercase tracking-wider mb-1.5">Ya registradas</p>
                      <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
                        {retosReferido.map(r => (
                          <div key={r.id} className="flex items-center justify-between rounded-xl px-3 py-2"
                            style={{ background: `${cfg.color}10`, border: `1px solid ${cfg.color}25` }}>
                            <p className="font-condensed font-bold text-sm" style={{ color: "rgba(0,0,0,0.75)" }}>{r.numero_factura}</p>
                            <p className="font-condensed font-bold text-sm" style={{ color: cfg.color }}>${Number(r.monto).toFixed(2)}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                <form onSubmit={handleSubmitReferido} className="space-y-3">
                  <div>
                    <label className="block font-condensed font-bold text-xs text-gray-400 uppercase tracking-wider mb-1.5">{cfg.labelExtra}</label>
                    <input type="text" value={form.campo_extra} onChange={e => setForm(p => ({ ...p, campo_extra: e.target.value }))} className="w-full font-barlow bg-gray-50 rounded-xl px-4 py-2.5 text-sm border border-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-300" />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block font-condensed font-bold text-xs text-gray-400 uppercase tracking-wider mb-1.5">Cédula del referido</label>
                      <input type="text" inputMode="numeric" required value={form.cedula_referido} onChange={e => setForm(p => ({ ...p, cedula_referido: e.target.value.replace(/\D/g, "").slice(0, 10) }))} className="w-full font-barlow bg-gray-50 rounded-xl px-4 py-2.5 text-sm border border-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-300" placeholder="0912345678" />
                    </div>
                    <div>
                      <label className="block font-condensed font-bold text-xs text-gray-400 uppercase tracking-wider mb-1.5">Celular del referido</label>
                      <input type="text" inputMode="numeric" required value={form.celular_referido} onChange={e => setForm(p => ({ ...p, celular_referido: e.target.value.replace(/\D/g, "").slice(0, 10) }))} className="w-full font-barlow bg-gray-50 rounded-xl px-4 py-2.5 text-sm border border-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-300" placeholder="0991234567" />
                    </div>
                  </div>
                  <div>
                    <label className="block font-condensed font-bold text-xs text-gray-400 uppercase tracking-wider mb-1.5">{cfg.labelFactura}</label>
                    <input type="text" value={form.numero_factura} onChange={e => setForm(p => ({ ...p, numero_factura: e.target.value }))} required className="w-full font-barlow bg-gray-50 rounded-xl px-4 py-2.5 text-sm border border-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-300" />
                  </div>
                  {error && <p className="font-barlow text-red-600 text-xs bg-red-50 rounded-xl p-3 border border-red-100">{error}</p>}
                  <div className="flex gap-2 pt-1">
                    <button type="button" onClick={cerrarModal} className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-600 font-condensed font-bold py-3 rounded-2xl cursor-pointer text-sm">Cancelar</button>
                    <button
                      type="submit"
                      disabled={enviando}
                      className="flex-1 font-condensed font-bold py-3 rounded-2xl cursor-pointer text-sm disabled:opacity-50 transition-opacity"
                      style={{ background: cfg.color, color: "#fff" }}
                    >
                      {enviando ? "Validando..." : "Registrar"}
                    </button>
                  </div>
                </form>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
