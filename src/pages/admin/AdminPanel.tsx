import { useEffect, useState } from "react";
import { Paginacion } from "../../components/Paginacion";
import * as XLSX from "xlsx";
import { useApp } from "../../context/AppContext";
import { api, type Farmacia } from "../../lib/api";

type Tab = "estadisticas" | "usuarios" | "stock" | "retiros";

type Stats = {
  cartillas_activas: number;
  cartillas_completas: number;
  cartillas_cerradas: number;
  premios_entregados: number;
  retiros_pendientes: number;
  total_usuarios: number;
};

type Retiro = {
  id: number;
  estado: string;
  fecha_retiro: string;
  hora_retiro: string;
  farmacia_nombre: string;
  cedula: string;
  usuario_nombre: string;
  usuario_apellido: string;
  telefono: string;
  puntos: number;
};

type UsuarioAdmin = {
  id: number;
  cedula: string;
  nombre: string;
  apellido: string;
  telefono: string;
  rol: string;
  puntos?: number;          
  cartilla_estado?: string;
};

function getToken(): string | null {
  return localStorage.getItem("admin_token");
}

function authHeaders(): HeadersInit {
  return { "Authorization": `Bearer ${getToken()}` };
}

export function AdminPanel() {
  const { adminNombre, navigate, setAdminNombre } = useApp();
  const [tab, setTab] = useState<Tab>("estadisticas");
  const [stats, setStats] = useState<Stats | null>(null);
  const [usuarios, setUsuarios] = useState<UsuarioAdmin[]>([]);
  const [retiros, setRetiros] = useState<Retiro[]>([]);
  const [farmacias, setFarmacias] = useState<Farmacia[]>([]);
  const [stockEdit, setStockEdit] = useState<Record<number, string>>({});
  const [cargando, setCargando] = useState(false);
  const [mensaje, setMensaje] = useState("");
  const [busqueda, setBusqueda] = useState("");
  const [paginaUsuarios, setPaginaUsuarios] = useState(1);
  const [totalUsuarios, setTotalUsuarios] = useState(0);
  const [totalPaginasUsuarios, setTotalPaginasUsuarios] = useState(0);
  const [cargandoUsuarios, setCargandoUsuarios] = useState(false);
  const [errorUsuarios, setErrorUsuarios] = useState("");

  function handleUnauthorized() {
    localStorage.removeItem("admin_token");
    setAdminNombre(null);
    navigate("admin-login");
  }

  useEffect(() => {
    if (!getToken()) navigate("admin-login");
  }, []);

  useEffect(() => {
    if (tab === "estadisticas") loadStats();
    if (tab === "usuarios") loadUsuarios(1, busqueda);
    if (tab === "retiros") loadRetiros();
    if (tab === "stock") loadFarmacias();
  }, [tab]);

  useEffect(() => {
    if (tab !== "usuarios") return;
    const timer = setTimeout(() => loadUsuarios(1, busqueda), 400);
    return () => clearTimeout(timer);
  }, [busqueda]);

  async function loadStats() {
    try { setStats(await api.adminEstadisticas()); } catch { logout(); }
  }

  async function loadUsuarios(pagina: number = 1, busq: string = busqueda) {
    setCargandoUsuarios(true);
    setErrorUsuarios("");
    try {
      const params = new URLSearchParams({ pagina: String(pagina), limite: "20" });
      if (busq.trim()) params.set("busqueda", busq.trim());
      const res = await fetch(`/api/admin/usuarios?${params}`, { headers: authHeaders() });
      if (res.status === 401 || res.status === 403) { handleUnauthorized(); return; }
      if (!res.ok) throw new Error();
      const data = await res.json();
      setUsuarios(data.datos);
      setTotalUsuarios(data.total);
      setTotalPaginasUsuarios(data.totalPaginas);
      setPaginaUsuarios(data.pagina);
    } catch {
      setErrorUsuarios("Error al obtener usuarios");
    } finally {
      setCargandoUsuarios(false);
    }
  }

  async function loadRetiros() {
    try { setRetiros(await api.adminRetiros()); } catch { logout(); }
  }

  async function loadFarmacias() {
    try {
      const data = await api.getFarmacias();
      setFarmacias(data);
      const edits: Record<number, string> = {};
      data.forEach(f => { edits[f.id] = String(f.cantidad); });
      setStockEdit(edits);
    } catch { logout(); }
  }

  function logout() {
    localStorage.removeItem("admin_token");
    setAdminNombre(null);
    navigate("admin-login");
  }

  async function handleEntregar(id: number) {
    if (!confirm("¿Marcar este retiro como entregado?")) return;
    setCargando(true);
    try {
      await api.marcarEntregado(id);
      setMensaje("Premio marcado como entregado");
      loadRetiros();
      setTimeout(() => setMensaje(""), 3000);
    } catch (e: any) {
      setMensaje("Error: " + e.message);
    } finally {
      setCargando(false);
    }
  }

  async function handleGuardarStock(farmaciaId: number) {
    const cantidad = parseInt(stockEdit[farmaciaId] ?? "0");
    if (isNaN(cantidad) || cantidad < 0) { setMensaje("Cantidad inválida"); return; }
    setCargando(true);
    try {
      await api.actualizarStock(farmaciaId, cantidad);
      setMensaje("Stock actualizado");
      loadFarmacias();
      setTimeout(() => setMensaje(""), 3000);
    } catch (e: any) {
      setMensaje("Error: " + e.message);
    } finally {
      setCargando(false);
    }
  }

  function descargarExcel() {
    const data = usuarios.map(u => ({
      Cédula: u.cedula,
      Nombre: u.nombre,
      Apellido: u.apellido,
      Teléfono: u.telefono,
    }));
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Usuarios");
    XLSX.writeFile(wb, "usuarios_ponte_la_10.xlsx");
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
      key: "usuarios",
      label: "Usuarios",
      icon: (
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.95 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />
        </svg>
      ),
    },
    {
      key: "stock",
      label: "Stock",
      icon: (
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 7.5l-.625 10.632a2.25 2.25 0 01-2.247 2.118H6.622a2.25 2.25 0 01-2.247-2.118L3.75 7.5M10 11.25h4M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125z" />
        </svg>
      ),
    },
    {
      key: "retiros",
      label: "Retiros",
      icon: (
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M21 11.25v8.25a1.5 1.5 0 01-1.5 1.5H5.25a1.5 1.5 0 01-1.5-1.5v-8.25M12 4.875A2.625 2.625 0 109.375 7.5H12m0-2.25c.621 0 1.125.504 1.125 1.125v1.5c0 .621-.504 1.125-1.125 1.125m0 0H9.375m-6.375 0h15.75c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3m0 0a1.125 1.125 0 00-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125M12 12v6m-3-3h6" />
        </svg>
      ),
    },
  ];

  const statCards = stats ? [
    { label: "Usuarios registrados", value: stats.total_usuarios, accent: "blue" },
    { label: "Cartillas activas", value: stats.cartillas_activas, accent: "emerald" },
    { label: "Cartillas completas", value: stats.cartillas_completas, accent: "amber" },
    { label: "Cartillas cerradas", value: stats.cartillas_cerradas, accent: "slate" },
    { label: "Premios entregados", value: stats.premios_entregados, accent: "emerald" },
    { label: "Retiros pendientes", value: stats.retiros_pendientes, accent: "orange" },
  ] : [];

  const accentMap: Record<string, { bg: string; text: string; ring: string; dot: string }> = {
    blue: { bg: "bg-blue-50", text: "text-blue-700", ring: "ring-blue-100", dot: "bg-blue-500" },
    emerald: { bg: "bg-emerald-50", text: "text-emerald-700", ring: "ring-emerald-100", dot: "bg-emerald-500" },
    amber: { bg: "bg-amber-50", text: "text-amber-700", ring: "ring-amber-100", dot: "bg-amber-500" },
    slate: { bg: "bg-slate-50", text: "text-slate-600", ring: "ring-slate-100", dot: "bg-slate-400" },
    orange: { bg: "bg-orange-50", text: "text-orange-700", ring: "ring-orange-100", dot: "bg-orange-500" },
  };

  return (
    <div className="min-h-screen">
      <div className="fixed inset-0 backdrop-blur-md bg-white/30 pointer-events-none z-0" />
      {/* Header */}
      <header className="sticky top-0 z-10" style={{ background: "linear-gradient(135deg, #060118 0%, #05002c 50%, #05004e 100%)" }}>
        {/* Top bar */}
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
                  : "border-transparent text-white hover:text-white hover:border-yellow-300"}`}
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
          <div className={`flex items-center gap-2 px-4 py-2.5 rounded-xl shadow-[0_2px_12px_rgba(0,0,0,0.08)] text-sm font-semibold backdrop-blur-sm
            ${mensaje.startsWith("Error")
              ? "bg-red-50/95 text-red-700 ring-1 ring-red-100"
              : "bg-emerald-50/95 text-emerald-700 ring-1 ring-emerald-100"}`}>
            {mensaje.startsWith("Error") ? (
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.28 7.22a.75.75 0 00-1.06 1.06L8.94 10l-1.72 1.72a.75.75 0 101.06 1.06L10 11.06l1.72 1.72a.75.75 0 101.06-1.06L11.06 10l1.72-1.72a.75.75 0 00-1.06-1.06L10 8.94 8.28 7.22z" clipRule="evenodd" />
              </svg>
            ) : (
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z" clipRule="evenodd" />
              </svg>
            )}
            {mensaje}
          </div>
        </div>
      )}

      {/* Content */}
      <main className="relative z-10 p-4 max-w-5xl mx-auto">
        {/* ── Estadísticas ── */}
        {tab === "estadisticas" && stats && (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {statCards.map((s, i) => {
              const colors = accentMap[s.accent];
              return (
                <div
                  key={s.label}
                  className={`bg-white rounded-2xl p-5 ring-1 ${colors!.ring} animate-fade-in-up stagger-${i + 1}`}
                >
                  <div className={`w-9 h-9 rounded-xl ${colors!.bg} flex items-center justify-center mb-3`}>
                    <div className={`w-2.5 h-2.5 rounded-full ${colors!.dot}`}></div>
                  </div>
                  <p className={`text-4xl font-display font-bold ${colors!.text} tracking-tight`}>{s.value}</p>
                  <p className="text-sm text-gray-500 mt-2 font-medium leading-tight">{s.label}</p>
                </div>
              );
            })}
          </div>
        )}

        {/* ── Usuarios ── */}
        {tab === "usuarios" && (
          <div className="space-y-3">
            <div className="flex gap-2">
              <div className="flex-1 relative">
                <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
                </svg>
                <input
                  type="text"
                  placeholder="Buscar por nombre o cédula..."
                  value={busqueda}
                  onChange={e => setBusqueda(e.target.value)}
                  disabled={cargandoUsuarios}
                  className="w-full border border-gray-200 rounded-xl pl-10 pr-4 py-3 text-base bg-white focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-400 transition-all duration-200 placeholder:text-gray-300 disabled:bg-gray-50 disabled:text-gray-400"
                />
              </div>
              <button
                onClick={descargarExcel}
                className="flex items-center gap-1.5 bg-white hover:bg-gray-50 text-gray-600 text-base font-semibold px-5 py-3 rounded-xl ring-1 ring-gray-200 transition-all duration-200 whitespace-nowrap cursor-pointer"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
                </svg>
                Excel
              </button>
            </div>

            <div className="bg-white rounded-2xl ring-1 ring-gray-100 overflow-hidden shadow-[0_1px_3px_rgba(0,0,0,0.02)]">
              <div className="overflow-x-auto">
                <table className="w-full text-base">
                  <thead className="bg-gray-50/80">
                    <tr>
                      <th className="text-left px-5 py-4 text-xs font-bold text-gray-400 uppercase tracking-widest">Cédula</th>
                      <th className="text-left px-5 py-4 text-xs font-bold text-gray-400 uppercase tracking-widest">Nombre</th>
                      <th className="text-left px-5 py-4 text-xs font-bold text-gray-400 uppercase tracking-widest">Teléfono</th>
                      <th className="text-left px-5 py-4 text-xs font-bold text-gray-400 uppercase tracking-widest">Puntos</th>
                      <th className="text-left px-5 py-4 text-xs font-bold text-gray-400 uppercase tracking-widest">Estado</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {cargandoUsuarios ? (
                      <tr>
                        <td colSpan={5} className="px-5 py-14 text-center text-gray-300 text-base">
                          Cargando...
                        </td>
                      </tr>
                    ) : errorUsuarios ? (
                      <tr>
                        <td colSpan={5} className="px-5 py-14 text-center text-red-400 text-base">
                          {errorUsuarios}
                        </td>
                      </tr>
                    ) : usuarios.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="px-5 py-14 text-center text-gray-300 text-base">
                          <svg className="w-10 h-10 mx-auto mb-3 text-gray-200" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.95 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />
                          </svg>
                          No se encontraron usuarios
                        </td>
                      </tr>
                    ) : (
                      usuarios.map(u => (
                        <tr key={u.id} className="hover:bg-gray-50/50 transition-colors duration-150">
                          <td className="px-5 py-4 font-mono text-sm text-gray-500">{u.cedula}</td>
                          <td className="px-5 py-4 font-semibold text-gray-800">{u.nombre} {u.apellido}</td>
                          <td className="px-5 py-4 text-gray-500">{u.telefono}</td>
                          <td className="px-5 py-4">
                            {u.puntos != null ? (
                              <span className="flex items-center gap-1.5">
                                <span className="font-bold text-gray-800">{u.puntos}</span>
                                <span className="text-gray-400 text-sm">/ 20</span>
                                <div className="w-20 h-1.5 rounded-full bg-gray-100 overflow-hidden">
                                  <div
                                    className="h-full rounded-full bg-green-500"
                                    style={{ width: `${Math.min(100, (u.puntos / 20) * 100)}%` }}
                                  />
                                </div>
                              </span>
                            ) : (
                              <span className="text-gray-300">—</span>
                            )}
                          </td>
                          <td className="px-5 py-4">
                            {u.cartilla_estado ? (
                              <span className={`inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-semibold ${
                                u.cartilla_estado === "completa"
                                  ? "bg-amber-50 text-amber-700 ring-1 ring-amber-200"
                                  : u.cartilla_estado === "cerrada"
                                  ? "bg-gray-100 text-gray-500"
                                  : "bg-green-50 text-green-700 ring-1 ring-green-200"
                              }`}>
                                {u.cartilla_estado === "activa" ? "Activa" : u.cartilla_estado === "completa" ? "Completa" : "Cerrada"}
                              </span>
                            ) : (
                              <span className="text-gray-300">—</span>
                            )}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            <Paginacion
              paginaActual={paginaUsuarios}
              totalPaginas={totalPaginasUsuarios || 1}
              total={totalUsuarios}
              limite={20}
              onChange={pagina => loadUsuarios(pagina, busqueda)}
            />
          </div>
        )}

        {/* ── Stock ── */}
        {tab === "stock" && (
          <div className="space-y-3">
            {farmacias.map((f, i) => (
              <div
                key={f.id}
                className="bg-white rounded-2xl ring-1 ring-gray-100 p-5 shadow-[0_1px_3px_rgba(0,0,0,0.02)] animate-fade-in-up"
                style={{ animationDelay: `${i * 0.05}s` }}
              >
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <p className="text-lg font-semibold text-gray-800">{f.nombre}</p>
                    <p className="text-base text-gray-400 mt-0.5">{f.direccion}</p>
                  </div>
                  <div className={`px-3 py-1 rounded-lg text-xs font-semibold ${f.cantidad > 0 ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-600"}`}>
                    {f.cantidad} unidades
                  </div>
                </div>
                <div className="flex gap-2 items-center pt-3 border-t border-gray-50">
                  <label className="text-sm text-gray-500 shrink-0 font-medium">Camisetas:</label>
                  <input
                    type="number"
                    min="0"
                    value={stockEdit[f.id] ?? ""}
                    onChange={e => setStockEdit(prev => ({ ...prev, [f.id]: e.target.value }))}
                    className="w-24 border border-gray-200 rounded-lg px-3 py-1.5 text-sm bg-gray-50/50 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 transition-all duration-200"
                  />
                  <button
                    onClick={() => handleGuardarStock(f.id)}
                    disabled={cargando}
                    className="ml-auto bg-blue-600 hover:bg-blue-700 disabled:bg-gray-200 disabled:text-gray-400 text-white text-sm font-semibold px-4 py-1.5 rounded-lg transition-all duration-200 shadow-[0_1px_2px_rgba(37,99,235,0.1)] hover:shadow-[0_2px_6px_rgba(37,99,235,0.15)] active:scale-[0.98] cursor-pointer"
                  >
                    Guardar
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ── Retiros ── */}
        {tab === "retiros" && (
          <div className="space-y-3">
            {retiros.length === 0 && (
              <div className="bg-white rounded-2xl ring-1 ring-gray-100 p-12 text-center text-gray-300 text-sm shadow-[0_1px_3px_rgba(0,0,0,0.02)]">
                <svg className="w-10 h-10 mx-auto mb-3 text-gray-200" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21 11.25v8.25a1.5 1.5 0 01-1.5 1.5H5.25a1.5 1.5 0 01-1.5-1.5v-8.25M12 4.875A2.625 2.625 0 109.375 7.5H12m0-2.25c.621 0 1.125.504 1.125 1.125v1.5c0 .621-.504 1.125-1.125 1.125m0 0H9.375m-6.375 0h15.75c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3m0 0a1.125 1.125 0 00-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125M12 12v6m-3-3h6" />
                </svg>
                No hay retiros registrados
              </div>
            )}
            {retiros.map((r, i) => (
              <div
                key={r.id}
                className="bg-white rounded-2xl ring-1 ring-gray-100 p-5 shadow-[0_1px_3px_rgba(0,0,0,0.02)] animate-fade-in-up"
                style={{ animationDelay: `${i * 0.05}s` }}
              >
                <div className="flex justify-between items-start gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="text-lg font-semibold text-gray-800 truncate">
                        {r.usuario_nombre} {r.usuario_apellido}
                      </p>
                      {r.estado === "planificado" && (
                        <span className="shrink-0 text-sm px-2.5 py-0.5 rounded-md bg-blue-50 text-blue-600 font-semibold ring-1 ring-blue-100">
                          Pendiente
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-gray-400 font-mono">{r.cedula} · {r.telefono}</p>
                    <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1.5 text-base text-gray-500">
                      <span className="flex items-center gap-1.5">
                        <svg className="w-3.5 h-3.5 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
                        </svg>
                        {r.farmacia_nombre}
                      </span>
                      <span className="flex items-center gap-1.5">
                        <svg className="w-3.5 h-3.5 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
                        </svg>
                        {r.fecha_retiro}
                      </span>
                      <span className="flex items-center gap-1.5">
                        <svg className="w-3.5 h-3.5 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        {r.hora_retiro.slice(0, 5)}
                      </span>
                    </div>
                  </div>
                  <div className="shrink-0">
                    {r.estado === "planificado" ? (
                      <button
                        onClick={() => handleEntregar(r.id)}
                        disabled={cargando}
                        className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 disabled:bg-gray-200 disabled:text-gray-400 text-white text-xs font-semibold px-4 py-2 rounded-xl transition-all duration-200 shadow-[0_1px_2px_rgba(16,185,129,0.15)] hover:shadow-[0_2px_6px_rgba(16,185,129,0.2)] active:scale-[0.98] cursor-pointer"
                      >
                        <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z" clipRule="evenodd" />
                        </svg>
                        Entregado
                      </button>
                    ) : (
                      <span className="flex items-center gap-1.5 text-xs bg-slate-50 text-slate-500 font-semibold px-3 py-2 rounded-xl ring-1 ring-slate-100">
                        <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z" clipRule="evenodd" />
                        </svg>
                        Entregado
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
