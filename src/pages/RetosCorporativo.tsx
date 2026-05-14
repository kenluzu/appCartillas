import { useState, useEffect } from "react";
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

// Reemplaza con el número de WhatsApp del call center (formato: 593XXXXXXXXX)
const WHATSAPP_NUMERO = "593XXXXXXXXX";
const WHATSAPP_MENSAJE = "Hola, quiero realizar una compra para el programa *Ponte la 10* de Farmacias Cruz Azul.";

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
  const [form, setForm] = useState<FormState>({ monto: "", numero_factura: "", campo_extra: "" });
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

  useEffect(() => {
    if (!usuario?.cedula || !cartilla?.id) return;
    setCargandoFacturas(true);
    fetch(`/api/usuarios/sincronizar-retos?cod_cliente=${usuario.cod_cliente ?? 0}&cartilla_id=${cartilla.id}`)
      .then(r => r.json())
      .then((data: unknown) => {
        if (data && typeof data === "object" && !Array.isArray(data)) {
          const res = data as {
            goleada: FacturaGoleada[];
            estrategica: FacturaGoleada[];
            foco: FacturaGoleada[];
            cartilla: { id: number; puntos: number; estado: "activa" | "completa" | "cerrada"; fecha_inicio: string };
          };
          setFacturasGoleada(res.goleada ?? []);
          setFacturasEstrategica(res.estrategica ?? []);
          setFacturasFoco(res.foco ?? []);
          if (res.cartilla) setCartilla(res.cartilla);
        }
      })
      .catch(() => {})
      .finally(() => setCargandoFacturas(false));
  }, []);

  if (!usuario || !cartilla) return null;

  const puntos = cartilla.puntos ?? 0;
  const completa = cartilla.estado === "completa" || puntos >= 10;

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
    setForm({ monto: "", numero_factura: "", campo_extra: "" });
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
      ? `Nombre del referido/a: ${form.campo_extra.trim()}`
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
        }),
      });

      const data = await res.json() as Record<string, unknown>;
      if (!res.ok) { setError((data.error as string) ?? "Error al registrar"); return; }

      const nuevaCartilla = data.cartilla as typeof cartilla;
      const monto = data.monto as number;
      setCartilla(nuevaCartilla);
      await cargarRetosReferido();

      if (nuevaCartilla.estado === "completa" || nuevaCartilla.puntos >= 10) {
        setExito(`¡Felicitaciones! Completaste tu cartilla con ${nuevaCartilla.puntos}/10 puntos. Factura $${Number(monto).toFixed(2)} validada.`);
      } else {
        setExito(`¡Punto registrado! Factura $${Number(monto).toFixed(2)} validada. Tu cartilla ahora tiene ${nuevaCartilla.puntos}/10 puntos.`);
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

        {/* Cartilla de progreso */}
        <div className="animate-fade-in-up stagger-1">
          <CartillaWidget cartilla={cartilla} />
        </div>

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
                  disabled={completa}
                  onMouseEnter={() => setHoveredReto(tipo)}
                  onMouseLeave={() => setHoveredReto(null)}
                  className="flex flex-col gap-3 p-[18px] rounded-2xl text-left disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
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
                  </div>
                </button>
              );
            })}
          </div>

          {completa && (
            <p className="text-center font-barlow text-xs mt-3" style={{ color: "rgba(0,0,0,0.42)" }}>
              Cartilla completa — coordina tu premio antes de iniciar una nueva.
            </p>
          )}
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
                  <a
                    href={`https://wa.me/${WHATSAPP_NUMERO}?text=${encodeURIComponent(WHATSAPP_MENSAJE)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl font-condensed font-bold text-sm text-white cursor-pointer"
                    style={{ background: "#25D366" }}
                  >
                    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                    </svg>
                    Hacer una compra
                  </a>
                  <button onClick={cerrarModal} className="w-full bg-gray-100 hover:bg-gray-200 text-gray-600 font-condensed font-bold py-3 rounded-2xl cursor-pointer text-sm">Cerrar</button>
                </div>
              ) : modalActivo === "lineas_estrategicas" ? (
                <div className="space-y-2">
                  <p className="font-barlow text-xs text-gray-400 text-center">Facturas del 15 dic 2025 al 15 ene 2026</p>
                  {renderFacturasList(facturasEstrategica, cfg.color)}
                  <a
                    href={`https://wa.me/${WHATSAPP_NUMERO}?text=${encodeURIComponent(WHATSAPP_MENSAJE)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl font-condensed font-bold text-sm text-white cursor-pointer"
                    style={{ background: "#25D366" }}
                  >
                    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                    </svg>
                    Hacer una compra
                  </a>
                  <button onClick={cerrarModal} className="w-full bg-gray-100 hover:bg-gray-200 text-gray-600 font-condensed font-bold py-3 rounded-2xl cursor-pointer text-sm">Cerrar</button>
                </div>
              ) : modalActivo === "productos_focos" ? (
                <div className="space-y-2">
                  <p className="font-barlow text-xs text-gray-400 text-center">Facturas del 15 dic 2025 al 15 ene 2026</p>
                  {renderFacturasList(facturasFoco, cfg.color)}
                  <a
                    href={`https://wa.me/${WHATSAPP_NUMERO}?text=${encodeURIComponent(WHATSAPP_MENSAJE)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl font-condensed font-bold text-sm text-white cursor-pointer"
                    style={{ background: "#25D366" }}
                  >
                    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                    </svg>
                    Hacer una compra
                  </a>
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
