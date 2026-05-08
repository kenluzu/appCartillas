import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Paginacion } from "../../components/Paginacion";
import * as XLSX from "xlsx";
import { useApp } from "../../context/AppContext";
import type { Farmacia } from "../../lib/types";
import { adminGetFarmacias, adminCrearFarmacia, adminActualizarFarmacia, adminEliminarFarmacia } from "../../lib/farmacias";
import { adminGetEstadisticas } from "../../lib/admin";

type Tab = "estadisticas" | "farmacias" | "puntaje" | "excel";

function formatFecha(fecha: string): string {
  const d = new Date(fecha);
  if (isNaN(d.getTime())) return fecha;
  return d.toLocaleString("es-EC", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).replace(",", "");
}

type Stats = {
  cartillas_activas: number;
  cartillas_completas: number;
  cartillas_cerradas: number;
  premios_entregados: number;
  retiros_pendientes: number;
  total_usuarios: number;
};

type CartillaAdmin = {
  id: number;
  usuario_id: number;
  cedula: string;
  nombre: string;
  apellido: string;
  telefono: string;
  puntos: number;
  estado: "activa" | "completa" | "cerrada";
  fecha_inicio: string;
  total_retos: number;
  url_imagen: string | null;
};

function getToken(): string | null {
  return localStorage.getItem("admin_token");
}

function authHeaders(): HeadersInit {
  return { "Authorization": `Bearer ${getToken()}` };
}

export function AdminPanel() {
  const { adminNombre, setAdminNombre } = useApp();
  const navigate = useNavigate();
  const [tab, setTab] = useState<Tab>("estadisticas");
  const [stats, setStats] = useState<Stats | null>(null);
  const [cartillas, setCartillas] = useState<CartillaAdmin[]>([]);
  const [farmacias, setFarmacias] = useState<Farmacia[]>([]);
  const [modalAbierto, setModalAbierto] = useState(false);
  const [farmaciaEditId, setFarmaciaEditId] = useState<number | null>(null);
  const [form, setForm] = useState({ nombre: "", direccion: "", latitud: "", longitud: "", cantidad: "0" });
  const [loadingStats, setLoadingStats] = useState(false);
  const [statsError, setStatsError] = useState(false);
  const [cargando, setCargando] = useState(false);
  const [mensaje, setMensaje] = useState("");
  // Cartillas tab state
  const [filtroEstadoCartilla, setFiltroEstadoCartilla] = useState<"todos" | "activa" | "completa" | "cerrada">("todos");
  const [busquedaCartilla, setBusquedaCartilla] = useState("");
  const [paginaCartilla, setPaginaCartilla] = useState(1);
  const [totalCartillas, setTotalCartillas] = useState(0);
  const [totalPaginasCartillas, setTotalPaginasCartillas] = useState(0);
  const [cargandoCartillas, setCargandoCartillas] = useState(false);
  const [urlMap, setUrlMap] = useState<Record<number, string>>({});
  const [savingCartillaId, setSavingCartillaId] = useState<number | null>(null);

  function handleUnauthorized() {
    localStorage.removeItem("admin_token");
    localStorage.removeItem("admin_nombre");
    setAdminNombre(null);
    navigate("/admin");
  }

  useEffect(() => {
    if (!getToken()) navigate("/admin");
  }, []);

  useEffect(() => {
    if (tab === "estadisticas") loadStats();
    if (tab === "puntaje") loadCartillas(1, busquedaCartilla, filtroEstadoCartilla);
    if (tab === "farmacias") loadFarmacias();
  }, [tab]);

  useEffect(() => {
    if (tab !== "puntaje") return;
    const timer = setTimeout(() => loadCartillas(1, busquedaCartilla, filtroEstadoCartilla), 400);
    return () => clearTimeout(timer);
  }, [busquedaCartilla, filtroEstadoCartilla]);

  async function loadStats() {
    const token = getToken();
    if (!token) { logout(); return; }
    setLoadingStats(true);
    setStatsError(false);
    try {
      setStats(await adminGetEstadisticas(token));
    } catch (e: unknown) {
      if (e instanceof Error && e.message === "UNAUTHORIZED") { logout(); return; }
      setStatsError(true);
    } finally {
      setLoadingStats(false);
    }
  }

  async function loadCartillas(
    pagina: number = 1,
    busq: string = busquedaCartilla,
    estado: string = filtroEstadoCartilla
  ) {
    setCargandoCartillas(true);
    try {
      const params = new URLSearchParams({ pagina: String(pagina) });
      if (estado !== "todos") params.set("estado", estado);
      if (busq.trim()) params.set("busqueda", busq.trim());
      const res = await fetch(`/api/admin/cartillas?${params}`, { headers: authHeaders() });
      if (res.status === 401 || res.status === 403) { handleUnauthorized(); return; }
      if (!res.ok) throw new Error();
      const data = await res.json() as { datos: CartillaAdmin[]; total: number; totalPaginas: number; pagina: number };
      setCartillas(data.datos);
      setTotalCartillas(data.total);
      setTotalPaginasCartillas(data.totalPaginas);
      setPaginaCartilla(data.pagina);
      setUrlMap(prev => {
        const next = { ...prev };
        data.datos.forEach(c => { next[c.id] = c.url_imagen ?? ""; });
        return next;
      });
    } catch {
      setMensaje("Error al cargar cartillas");
    } finally {
      setCargandoCartillas(false);
    }
  }

  async function loadFarmacias() {
    const token = getToken();
    if (!token) { handleUnauthorized(); return; }
    try {
      setFarmacias(await adminGetFarmacias(token));
    } catch (e: unknown) {
      if (e instanceof Error && e.message === "UNAUTHORIZED") { handleUnauthorized(); return; }
      setMensaje("Error al cargar farmacias");
    }
  }

  function abrirModalCrear() {
    setFarmaciaEditId(null);
    setForm({ nombre: "", direccion: "", latitud: "", longitud: "", cantidad: "0" });
    setModalAbierto(true);
  }

  function abrirModalEditar(f: Farmacia) {
    setFarmaciaEditId(f.id);
    setForm({ nombre: f.nombre, direccion: f.direccion, latitud: String(f.latitud), longitud: String(f.longitud), cantidad: String(f.cantidad) });
    setModalAbierto(true);
  }

  async function handleSubmitFarmacia(e: React.FormEvent) {
    e.preventDefault();
    const token = getToken();
    if (!token) { handleUnauthorized(); return; }
    const data = {
      nombre: form.nombre.trim(),
      direccion: form.direccion.trim(),
      latitud: parseFloat(form.latitud),
      longitud: parseFloat(form.longitud),
      cantidad: parseInt(form.cantidad),
    };
    setCargando(true);
    try {
      if (farmaciaEditId) {
        await adminActualizarFarmacia(token, farmaciaEditId, data);
        setMensaje("Farmacia actualizada");
      } else {
        await adminCrearFarmacia(token, data);
        setMensaje("Farmacia creada");
      }
      setModalAbierto(false);
      loadFarmacias();
      setTimeout(() => setMensaje(""), 3000);
    } catch (e: unknown) {
      if (e instanceof Error && e.message === "UNAUTHORIZED") { handleUnauthorized(); return; }
      setMensaje("Error: " + (e instanceof Error ? e.message : "Error desconocido"));
    } finally {
      setCargando(false);
    }
  }

  async function handleEliminarFarmacia(id: number) {
    if (!confirm("¿Eliminar esta farmacia? Esta acción no se puede deshacer.")) return;
    const token = getToken();
    if (!token) { handleUnauthorized(); return; }
    setCargando(true);
    try {
      await adminEliminarFarmacia(token, id);
      setMensaje("Farmacia eliminada");
      loadFarmacias();
      setTimeout(() => setMensaje(""), 3000);
    } catch (e: unknown) {
      if (e instanceof Error && e.message === "UNAUTHORIZED") { handleUnauthorized(); return; }
      setMensaje("Error: " + (e instanceof Error ? e.message : "Error desconocido"));
    } finally {
      setCargando(false);
    }
  }

  function logout() {
    localStorage.removeItem("admin_token");
    localStorage.removeItem("admin_nombre");
    setAdminNombre(null);
    navigate("/admin");
  }

  async function descargarExcelCartillas() {
    const token = getToken();
    if (!token) { handleUnauthorized(); return; }
    setCargando(true);
    try {
      const params = new URLSearchParams({ pagina: "1", limite: "9999" });
      if (filtroEstadoCartilla !== "todos") params.set("estado", filtroEstadoCartilla);
      if (busquedaCartilla.trim()) params.set("busqueda", busquedaCartilla.trim());
      const res = await fetch(`/api/admin/cartillas?${params}`, { headers: { Authorization: `Bearer ${token}` } });
      if (res.status === 401 || res.status === 403) { handleUnauthorized(); return; }
      if (!res.ok) throw new Error();
      const data = await res.json() as { datos: CartillaAdmin[] };
      const filas = data.datos.map(c => ({
        "Cédula":      c.cedula,
        "Nombre":      c.nombre,
        "Apellido":    c.apellido,
        "Teléfono":    c.telefono,
        "Puntos":      c.puntos,
        "Estado":      c.estado,
        "Retos":       c.total_retos,
        "Imagen":      c.url_imagen ?? "",
        "Inicio":      formatFecha(c.fecha_inicio),
      }));
      const ws = XLSX.utils.json_to_sheet(filas);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Cartillas");
      XLSX.writeFile(wb, "cartillas_ponte_la_10.xlsx");
    } catch (e: unknown) {
      if (e instanceof Error && e.message === "UNAUTHORIZED") { handleUnauthorized(); return; }
      setMensaje("Error al exportar: " + (e instanceof Error ? e.message : "Error desconocido"));
    } finally {
      setCargando(false);
    }
  }

  async function guardarUrlImagen(cartillaId: number) {
    const url = (urlMap[cartillaId] ?? "").trim();
    const cartilla = cartillas.find(c => c.id === cartillaId);
    if (!cartilla || url === (cartilla.url_imagen ?? "")) return;
    setSavingCartillaId(cartillaId);
    try {
      const res = await fetch(`/api/admin/cartillas/${cartillaId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", ...authHeaders() },
        body: JSON.stringify({ url_imagen: url }),
      });
      if (res.status === 401 || res.status === 403) { handleUnauthorized(); return; }
      if (!res.ok) throw new Error();
      const data = await res.json() as { cartilla: { estado: CartillaAdmin["estado"]; url_imagen: string | null } };
      setCartillas(prev => prev.map(c => c.id === cartillaId
        ? { ...c, estado: data.cartilla.estado, url_imagen: data.cartilla.url_imagen }
        : c
      ));
      setUrlMap(prev => ({ ...prev, [cartillaId]: data.cartilla.url_imagen ?? "" }));
    } catch {
      setMensaje("Error al guardar imagen");
    } finally {
      setSavingCartillaId(null);
    }
  }

  async function toggleEstado(cartillaId: number, estadoActual: CartillaAdmin["estado"]) {
    if (estadoActual === "activa") return;
    const nuevoEstado: CartillaAdmin["estado"] = estadoActual === "completa" ? "cerrada" : "completa";
    setSavingCartillaId(cartillaId);
    try {
      const res = await fetch(`/api/admin/cartillas/${cartillaId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", ...authHeaders() },
        body: JSON.stringify({ estado: nuevoEstado }),
      });
      if (res.status === 401 || res.status === 403) { handleUnauthorized(); return; }
      if (!res.ok) throw new Error();
      setCartillas(prev => prev.map(c => c.id === cartillaId ? { ...c, estado: nuevoEstado } : c));
    } catch {
      setMensaje("Error al cambiar estado");
    } finally {
      setSavingCartillaId(null);
    }
  }

  const tabs: { key: Tab; label: string; icon: React.ReactNode }[] = [
    {
      key: "estadisticas",
      label: "Estadísticas",
      icon: (
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" />
        </svg>
      ),
    },
    {
      key: "farmacias",
      label: "Farmacias",
      icon: (
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 21v-7.5a.75.75 0 01.75-.75h3a.75.75 0 01.75.75V21m-4.5 0H2.36m11.14 0H18m0 0h3.64m-1.39 0V9.349m-16.5 11.65V9.35m0 0a3.001 3.001 0 003.75-.615A2.993 2.993 0 009.75 9.75c.896 0 1.7-.393 2.25-1.016a2.993 2.993 0 002.25 1.016c.896 0 1.7-.393 2.25-1.016a3.001 3.001 0 003.75.614m-16.5 0a3.004 3.004 0 01-.621-4.72L4.318 3.44A1.5 1.5 0 015.378 3h13.243a1.5 1.5 0 011.06.44l1.19 1.189a3 3 0 01-.621 4.72m-13.5 8.65h3.75a.75.75 0 00.75-.75V13.5a.75.75 0 00-.75-.75H6.75a.75.75 0 00-.75.75v3.75c0 .415.336.75.75.75z" />
        </svg>
      ),
    },
    {
      key: "puntaje",
      label: "Puntaje",
      icon: (
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6zM13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25A2.25 2.25 0 0113.5 18v-2.25z" />
        </svg>
      ),
    },
    {
      key: "excel",
      label: "Excel Comercial",
      icon: (
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
        </svg>
      ),
    },
  ];

  type AccentKey = "blue" | "emerald" | "amber" | "slate" | "orange" | "violet";

  const statCards: { label: string; value: number | undefined; accent: AccentKey; icon: React.ReactNode }[] = [
    {
      label: "Usuarios registrados",
      value: stats?.total_usuarios,
      accent: "violet",
      icon: <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20"><path d="M10 9a3 3 0 100-6 3 3 0 000 6zM6 8a2 2 0 11-4 0 2 2 0 014 0zM1.49 15.326a.78.78 0 01-.358-.442 3 3 0 014.308-3.516 6.484 6.484 0 00-1.905 3.959c-.023.222-.014.442.025.654a4.97 4.97 0 01-2.07-.655zM16.44 15.98a4.97 4.97 0 002.07-.654.78.78 0 00.357-.442 3 3 0 00-4.308-3.517 6.484 6.484 0 011.907 3.96 2.32 2.32 0 01-.026.654zM18 8a2 2 0 11-4 0 2 2 0 014 0zM5.304 16.19a.844.844 0 01-.277-.71 5 5 0 019.947 0 .843.843 0 01-.277.71A6.975 6.975 0 0110 18a6.974 6.974 0 01-4.696-1.81z" /></svg>,
    },
    {
      label: "Cartillas activas",
      value: stats?.cartillas_activas,
      accent: "emerald",
      icon: <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z" clipRule="evenodd" /></svg>,
    },
    {
      label: "Cartillas completas",
      value: stats?.cartillas_completas,
      accent: "amber",
      icon: <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 1a4.5 4.5 0 00-4.5 4.5V9H5a2 2 0 00-2 2v6a2 2 0 002 2h10a2 2 0 002-2v-6a2 2 0 00-2-2h-.5V5.5A4.5 4.5 0 0010 1zm3 8V5.5a3 3 0 10-6 0V9h6z" clipRule="evenodd" /></svg>,
    },
    {
      label: "Cartillas cerradas",
      value: stats?.cartillas_cerradas,
      accent: "slate",
      icon: <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 2a1 1 0 00-1 1v1.323l-3.954 1.582A1.5 1.5 0 004 7.308V15a3 3 0 003 3h6a3 3 0 003-3V7.308a1.5 1.5 0 00-1.046-1.403L11 4.323V3a1 1 0 00-1-1z" clipRule="evenodd" /></svg>,
    },
    {
      label: "Premios coordinados",
      value: stats?.premios_entregados,
      accent: "emerald",
      icon: <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20"><path d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" /></svg>,
    },
    {
      label: "Pendientes de entregar",
      value: stats?.retiros_pendientes,
      accent: "orange",
      icon: <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" /></svg>,
    },
  ];

  const accentMap: Record<AccentKey, { bg: string; text: string; num: string }> = {
    violet:  { bg: "bg-violet-50",  text: "text-violet-600",  num: "text-gray-800" },
    blue:    { bg: "bg-blue-50",    text: "text-blue-600",    num: "text-gray-800" },
    emerald: { bg: "bg-emerald-50", text: "text-emerald-600", num: "text-gray-800" },
    amber:   { bg: "bg-amber-50",   text: "text-amber-600",   num: "text-gray-800" },
    slate:   { bg: "bg-slate-100",  text: "text-slate-500",   num: "text-gray-600" },
    orange:  { bg: "bg-orange-50",  text: "text-orange-600",  num: "text-gray-800" },
  };

  return (
    <div className="min-h-screen bg-[#f0f0f8]">

      <header className="sticky top-0 z-10" style={{ background: "linear-gradient(135deg, #060118 0%, #05002c 50%, #05004e 100%)" }}>
        <div className="px-6 py-4 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center text-xl" style={{ background: "rgba(255,255,255,0.12)" }}>
              🏆
            </div>
            <div>
              <h1 className="font-display text-2xl font-bold text-white tracking-tight leading-none">Panel de administración</h1>
              <p className="text-white text-xs mt-0.5 font-medium tracking-wide uppercase">Ponte la 10 · Farmcorp</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="text-right hidden sm:block">
              <p className="text-base font-semibold text-white">{adminNombre}</p>
              <p className="text-xs text-green-300">Administrador</p>
            </div>
            <div className="w-10 h-10 rounded-full flex items-center justify-center font-bold text-green-900 text-sm"
              style={{ background: "linear-gradient(135deg, #fbbf24, #f59e0b)" }}>
              {adminNombre?.charAt(0) ?? "A"}
            </div>
            <button
              onClick={logout}
              title="Cerrar sesión"
              className="p-2 rounded-lg transition-all duration-200 cursor-pointer"
              style={{ background: "rgba(255,255,255,0.08)" }}
              onMouseEnter={e => (e.currentTarget.style.background = "rgba(239,68,68,0.2)")}
              onMouseLeave={e => (e.currentTarget.style.background = "rgba(255,255,255,0.01)")}
            >
              <svg className="w-5 h-5 text-green-200" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15m3 0l3-3m0 0l-3-3m3 3H9" />
              </svg>
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="px-6 flex gap-0.5 overflow-x-auto" style={{ borderTop: "1px solid rgba(255,255,255,0.1)" }}>
          {tabs.map(t => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`flex items-center gap-2 px-5 py-3.5 text-sm font-semibold whitespace-nowrap border-b-2 transition-all duration-200 cursor-pointer
                ${tab === t.key
                  ? "border-yellow-400 text-yellow-300"
                  : "border-transparent text-white/60 hover:text-white hover:border-white/30"}`}
            >
              {t.icon}
              {t.label}
            </button>
          ))}
        </div>
      </header>

      {/* Flash message */}
      {mensaje && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-20 animate-slide-in">
          <div className={`flex items-center gap-2 px-4 py-2.5 rounded-xl shadow-lg text-sm font-semibold backdrop-blur-sm
            ${mensaje.startsWith("Error")
              ? "bg-red-50 text-red-700 ring-1 ring-red-100"
              : "bg-white text-emerald-700 ring-1 ring-emerald-100"}`}>
            {mensaje.startsWith("Error") ? (
              <svg className="w-4 h-4 shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.28 7.22a.75.75 0 00-1.06 1.06L8.94 10l-1.72 1.72a.75.75 0 101.06 1.06L10 11.06l1.72 1.72a.75.75 0 101.06-1.06L11.06 10l1.72-1.72a.75.75 0 00-1.06-1.06L10 8.94 8.28 7.22z" clipRule="evenodd" />
              </svg>
            ) : (
              <svg className="w-4 h-4 shrink-0 text-emerald-500" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z" clipRule="evenodd" />
              </svg>
            )}
            {mensaje}
          </div>
        </div>
      )}

      {/* Content */}
      <main className="p-4 max-w-5xl mx-auto">

        {/* Estadísticas */}
        {tab === "estadisticas" && (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {statCards.map((s, i) => {
              const colors = accentMap[s.accent];
              const display = loadingStats ? "—" : statsError ? "—" : (s.value ?? "—");
              return (
                <div
                  key={s.label}
                  className="bg-white rounded-2xl p-5 shadow-[0_2px_8px_rgba(0,0,0,0.06)] animate-fade-in-up"
                  style={{ animationDelay: `${i * 0.05}s` }}
                >
                  <div className="flex items-start justify-between mb-4">
                    <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider leading-tight">{s.label}</p>
                    <span className={`shrink-0 flex items-center justify-center w-6 h-6 rounded-full ${colors.bg} ${colors.text}`}>
                      {s.icon}
                    </span>
                  </div>
                  <p className={`text-3xl font-bold tracking-tight ${loadingStats ? "text-gray-200 animate-pulse" : colors.num}`}>
                    {display}
                  </p>
                </div>
              );
            })}
          </div>
        )}

        {/* Farmacias */}
        {tab === "farmacias" && (
          <div className="space-y-3">
            <div className="flex justify-end">
              <button
                onClick={abrirModalCrear}
                className="flex items-center gap-2 bg-violet-600 hover:bg-violet-700 text-white font-semibold px-5 py-2.5 rounded-xl transition-all duration-200 shadow-[0_2px_8px_rgba(109,40,217,0.25)] cursor-pointer text-sm"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                </svg>
                Nueva farmacia
              </button>
            </div>

            {farmacias.length === 0 && (
              <div className="bg-white rounded-2xl shadow-[0_2px_8px_rgba(0,0,0,0.06)] p-12 text-center text-gray-300 text-sm">
                No hay farmacias registradas
              </div>
            )}

            {farmacias.map((f, i) => (
              <div
                key={f.id}
                className="bg-white rounded-2xl shadow-[0_2px_8px_rgba(0,0,0,0.06)] p-5 animate-fade-in-up"
                style={{ animationDelay: `${i * 0.05}s` }}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-800">{f.nombre}</p>
                    <p className="text-xs text-gray-400 mt-0.5">{f.direccion}</p>
                    <p className="text-xs text-gray-300 mt-1 font-mono">{f.latitud}, {f.longitud}</p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${f.cantidad > 0 ? "bg-emerald-50 text-emerald-600" : "bg-red-50 text-red-500"}`}>
                      {f.cantidad} uds.
                    </span>
                    <button onClick={() => abrirModalEditar(f)} title="Editar"
                      className="p-2 rounded-xl bg-[#f0f0f8] hover:bg-violet-50 text-gray-400 hover:text-violet-600 transition-all duration-200 cursor-pointer">
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125" />
                      </svg>
                    </button>
                    <button onClick={() => handleEliminarFarmacia(f.id)} title="Eliminar"
                      className="p-2 rounded-xl bg-[#f0f0f8] hover:bg-red-50 text-gray-400 hover:text-red-500 transition-all duration-200 cursor-pointer">
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                      </svg>
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Cartillas */}
        {tab === "puntaje" && (
          <div className="space-y-3">
            {/* Filtros */}
            <div className="flex flex-wrap gap-2">
              <div className="flex-1 relative min-w-[160px]">
                <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-300 pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
                </svg>
                <input
                  type="text"
                  placeholder="Buscar por nombre o cédula..."
                  value={busquedaCartilla}
                  onChange={e => setBusquedaCartilla(e.target.value)}
                  className="w-full bg-white rounded-xl pl-10 pr-4 py-2.5 text-sm shadow-[0_2px_8px_rgba(0,0,0,0.06)] border-0 focus:outline-none focus:ring-2 focus:ring-violet-400/30 transition-all duration-200 placeholder:text-gray-300"
                />
              </div>
              <select
                value={filtroEstadoCartilla}
                onChange={e => setFiltroEstadoCartilla(e.target.value as typeof filtroEstadoCartilla)}
                className="bg-white rounded-xl px-3 py-2.5 text-sm text-gray-600 shadow-[0_2px_8px_rgba(0,0,0,0.06)] border-0 focus:outline-none focus:ring-2 focus:ring-violet-400/30 transition-all duration-200 cursor-pointer"
              >
                <option value="todos">Todos los estados</option>
                <option value="activa">Activas</option>
                <option value="completa">Completas</option>
                <option value="cerrada">Cerradas</option>
              </select>
              <button
                onClick={descargarExcelCartillas}
                disabled={cargando}
                className="flex items-center gap-1.5 bg-white hover:bg-[#f9f9fd] disabled:opacity-50 text-gray-600 text-sm font-semibold px-4 py-2.5 rounded-xl shadow-[0_2px_8px_rgba(0,0,0,0.06)] transition-all duration-200 whitespace-nowrap cursor-pointer disabled:cursor-not-allowed"
              >
                <svg className="w-4 h-4 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
                </svg>
                Excel
              </button>
            </div>

            {/* Tabla */}
            <div className="bg-white rounded-2xl shadow-[0_2px_8px_rgba(0,0,0,0.06)] overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-[#f0f0f8]">
                      <th className="text-left px-5 py-3.5 text-xs font-bold text-gray-400 uppercase tracking-widest">Cédula</th>
                      <th className="text-left px-5 py-3.5 text-xs font-bold text-gray-400 uppercase tracking-widest">Nombre</th>
                      <th className="text-left px-5 py-3.5 text-xs font-bold text-gray-400 uppercase tracking-widest">Puntos</th>
                      <th className="text-left px-5 py-3.5 text-xs font-bold text-gray-400 uppercase tracking-widest">Retos</th>
                      <th className="text-left px-5 py-3.5 text-xs font-bold text-gray-400 uppercase tracking-widest">Estado</th>
                      <th className="text-left px-5 py-3.5 text-xs font-bold text-gray-400 uppercase tracking-widest">Imagen / Enlace</th>
                      <th className="text-left px-5 py-3.5 text-xs font-bold text-gray-400 uppercase tracking-widest hidden sm:table-cell">Inicio</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#f0f0f8]">
                    {cargandoCartillas ? (
                      <tr><td colSpan={7} className="px-5 py-14 text-center text-gray-300 text-sm">Cargando...</td></tr>
                    ) : cartillas.length === 0 ? (
                      <tr><td colSpan={7} className="px-5 py-14 text-center text-gray-300 text-sm">No se encontraron cartillas</td></tr>
                    ) : (
                      cartillas.map(c => (
                        <tr key={c.id} className="hover:bg-[#f9f9fd] transition-colors duration-150">
                          <td className="px-5 py-3.5 font-mono text-xs text-gray-400">{c.cedula}</td>
                          <td className="px-5 py-3.5 font-semibold text-gray-800">{c.nombre} {c.apellido}</td>
                          <td className="px-5 py-3.5">
                            <span className="flex items-center gap-2">
                              <span className="font-bold text-gray-700 tabular-nums w-4 text-right">{c.puntos}</span>
                              <span className="text-gray-300 text-xs">/ 10</span>
                              <div className="w-14 h-1.5 rounded-full bg-[#f0f0f8] overflow-hidden">
                                <div
                                  className="h-full rounded-full transition-all duration-500"
                                  style={{
                                    width: `${Math.min(100, (c.puntos / 10) * 100)}%`,
                                    background: c.estado === "completa" || c.puntos >= 10 ? "#fbbf24" : "#34d399",
                                  }}
                                />
                              </div>
                            </span>
                          </td>
                          <td className="px-5 py-3.5 text-gray-500 tabular-nums">{c.total_retos}</td>
                          <td className="px-5 py-3.5">
                            {c.estado === "activa" ? (
                              <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-600">
                                Activa
                              </span>
                            ) : (
                              <button
                                onClick={() => toggleEstado(c.id, c.estado)}
                                disabled={savingCartillaId === c.id}
                                title={c.estado === "completa" ? "Cambiar a Cerrada" : "Cambiar a Completa"}
                                className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold transition-all duration-150 cursor-pointer disabled:opacity-50 ${
                                  c.estado === "completa"
                                    ? "bg-amber-50 text-amber-600 hover:bg-amber-100"
                                    : "bg-slate-100 text-slate-500 hover:bg-slate-200"
                                }`}
                              >
                                {savingCartillaId === c.id ? (
                                  <svg className="w-3 h-3 animate-spin" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                                  </svg>
                                ) : (
                                  <svg className="w-3 h-3 opacity-60" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
                                  </svg>
                                )}
                                {c.estado === "completa" ? "Completa" : "Cerrada"}
                              </button>
                            )}
                          </td>
                          <td className="px-4 py-2.5">
                            <div className="flex items-center gap-1.5 min-w-[180px]">
                              <input
                                type="url"
                                value={urlMap[c.id] ?? ""}
                                onChange={e => setUrlMap(prev => ({ ...prev, [c.id]: e.target.value }))}
                                onBlur={() => guardarUrlImagen(c.id)}
                                onKeyDown={e => { if (e.key === "Enter") { e.currentTarget.blur(); } }}
                                placeholder="https://..."
                                disabled={savingCartillaId === c.id}
                                className="flex-1 bg-[#f9f9fd] rounded-lg px-2.5 py-1.5 text-xs border border-transparent focus:border-violet-300 focus:outline-none focus:bg-white transition-all duration-150 placeholder:text-gray-300 disabled:opacity-50 min-w-0"
                              />
                              {(urlMap[c.id] ?? "").trim() && (
                                <a
                                  href={urlMap[c.id]}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  title="Ver imagen"
                                  className="shrink-0 p-1 rounded-lg bg-violet-50 hover:bg-violet-100 text-violet-500 transition-colors"
                                >
                                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 6H5.25A2.25 2.25 0 003 8.25v10.5A2.25 2.25 0 005.25 21h10.5A2.25 2.25 0 0018 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25" />
                                  </svg>
                                </a>
                              )}
                            </div>
                          </td>
                          <td className="px-5 py-3.5 text-xs text-gray-400 hidden sm:table-cell">{formatFecha(c.fecha_inicio)}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            <Paginacion
              paginaActual={paginaCartilla}
              totalPaginas={totalPaginasCartillas || 1}
              total={totalCartillas}
              limite={20}
              onChange={p => loadCartillas(p, busquedaCartilla, filtroEstadoCartilla)}
            />
          </div>
        )}
        {/* Excel Comercial */}
        {tab === "excel" && (
          <div className="max-w-xl mx-auto space-y-4">

            {/* Header */}
            <div className="bg-white rounded-2xl p-5 shadow-[0_2px_8px_rgba(0,0,0,0.06)]">
              <div className="flex items-start gap-4">
                <div className="w-11 h-11 rounded-xl bg-emerald-50 flex items-center justify-center shrink-0">
                  <svg className="w-5 h-5 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
                  </svg>
                </div>
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <h2 className="font-bold text-gray-800 text-base">Carga de datos — Equipo Comercial</h2>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 uppercase tracking-wide">Próximamente</span>
                  </div>
                  <p className="text-sm text-gray-500 leading-relaxed">
                    Sube el archivo Excel con el <strong>% de cumplimiento</strong> de los usuarios del canal Comercial.
                    Los datos se procesarán automáticamente para calcular los puntos y oportunidades de cada vendedor.
                  </p>
                </div>
              </div>
            </div>

            {/* Zona de carga */}
            <div className="bg-white rounded-2xl p-6 shadow-[0_2px_8px_rgba(0,0,0,0.06)]">
              <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-4">Archivo Excel</p>

              {/* Drop zone */}
              <div className="border-2 border-dashed border-gray-200 rounded-2xl px-6 py-10 flex flex-col items-center gap-3 bg-gray-50/50 cursor-not-allowed opacity-60 select-none">
                <div className="w-14 h-14 rounded-2xl bg-emerald-100 flex items-center justify-center">
                  <svg className="w-7 h-7 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
                  </svg>
                </div>
                <div className="text-center">
                  <p className="text-sm font-semibold text-gray-500">Arrastra tu archivo aquí</p>
                  <p className="text-xs text-gray-400 mt-0.5">o haz clic para seleccionar</p>
                </div>
                <p className="text-xs text-gray-300 font-mono">.xlsx · .xls</p>
              </div>

              <button
                disabled
                className="mt-4 w-full flex items-center justify-center gap-2 bg-emerald-600 disabled:bg-gray-200 disabled:text-gray-400 text-white font-semibold py-3 rounded-xl text-sm transition-colors cursor-not-allowed"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
                Procesar archivo
              </button>
            </div>

            {/* Info formato TODO: COMENTADO HASTA SABER EL FORMATO*/}
            {/*<div className="bg-white rounded-2xl p-5 shadow-[0_2px_8px_rgba(0,0,0,0.06)]">
              <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Formato esperado</p>
              <div className="space-y-2">
                {["Cédula del vendedor", "% Cumplimiento — Utilidad", "% Cumplimiento — Productos Focos", "% Cumplimiento — Volumen", "% Cumplimiento — Líneas Estratégicas"].map((col, i) => (
                  <div key={col} className="flex items-center gap-3">
                    <span className="w-6 h-6 rounded-lg bg-[#f0f0f8] text-gray-400 text-xs font-bold flex items-center justify-center shrink-0">
                      {String.fromCharCode(65 + i)}
                    </span>
                    <span className="text-sm text-gray-600">{col}</span>
                  </div>
                ))}
              </div>
              <p className="text-xs text-gray-300 mt-4">
                * El formato exacto de columnas puede variar. Se definirá junto al equipo antes de habilitar la carga.
              </p>
            </div>*/}

          </div>
        )}

      </main>

      {/* Modal crear / editar farmacia */}
      {modalAbierto && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/30 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-[0_20px_60px_rgba(0,0,0,0.15)] w-full max-w-md p-6 animate-fade-in-up">
            <h2 className="text-lg font-bold text-gray-800 mb-5">
              {farmaciaEditId ? "Editar farmacia" : "Nueva farmacia"}
            </h2>
            <form onSubmit={handleSubmitFarmacia} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1.5">Nombre</label>
                <input type="text" value={form.nombre} onChange={e => setForm(p => ({ ...p, nombre: e.target.value }))} required
                  className="w-full bg-[#f9f9fd] rounded-xl px-4 py-2.5 text-sm border-0 focus:outline-none focus:ring-2 focus:ring-violet-400/30 transition-all duration-200" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1.5">Dirección</label>
                <input type="text" value={form.direccion} onChange={e => setForm(p => ({ ...p, direccion: e.target.value }))} required
                  className="w-full bg-[#f9f9fd] rounded-xl px-4 py-2.5 text-sm border-0 focus:outline-none focus:ring-2 focus:ring-violet-400/30 transition-all duration-200" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1.5">Latitud</label>
                  <input type="number" step="any" value={form.latitud} onChange={e => setForm(p => ({ ...p, latitud: e.target.value }))} required
                    className="w-full bg-[#f9f9fd] rounded-xl px-4 py-2.5 text-sm border-0 focus:outline-none focus:ring-2 focus:ring-violet-400/30 transition-all duration-200" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1.5">Longitud</label>
                  <input type="number" step="any" value={form.longitud} onChange={e => setForm(p => ({ ...p, longitud: e.target.value }))} required
                    className="w-full bg-[#f9f9fd] rounded-xl px-4 py-2.5 text-sm border-0 focus:outline-none focus:ring-2 focus:ring-violet-400/30 transition-all duration-200" />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1.5">Stock (camisetas)</label>
                <input type="number" min="0" value={form.cantidad} onChange={e => setForm(p => ({ ...p, cantidad: e.target.value }))} required
                  className="w-full bg-[#f9f9fd] rounded-xl px-4 py-2.5 text-sm border-0 focus:outline-none focus:ring-2 focus:ring-violet-400/30 transition-all duration-200" />
              </div>
              <div className="flex gap-2 pt-2">
                <button type="button" onClick={() => setModalAbierto(false)}
                  className="flex-1 bg-[#f0f0f8] hover:bg-[#e8e8f4] text-gray-600 font-semibold py-2.5 rounded-xl transition-all duration-200 cursor-pointer text-sm">
                  Cancelar
                </button>
                <button type="submit" disabled={cargando}
                  className="flex-1 bg-violet-600 hover:bg-violet-700 disabled:bg-gray-200 disabled:text-gray-400 text-white font-semibold py-2.5 rounded-xl transition-all duration-200 cursor-pointer text-sm shadow-[0_2px_8px_rgba(109,40,217,0.25)]">
                  {farmaciaEditId ? "Guardar cambios" : "Crear farmacia"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
