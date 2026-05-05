export type Estadisticas = {
  total_usuarios: number;
  cartillas_activas: number;
  cartillas_completas: number;
  cartillas_cerradas: number;
  premios_entregados: number;
  retiros_pendientes: number;
};

export type UsuarioAdmin = {
  id: number;
  cedula: string;
  nombre: string;
  apellido: string;
  telefono: string;
  rol: string;
  puntos?: number;
  cartilla_estado?: string;
};

export async function adminGetEstadisticas(token: string): Promise<Estadisticas> {
  const res = await fetch("/api/admin/estadisticas", {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (res.status === 401 || res.status === 403) throw new Error("UNAUTHORIZED");
  if (!res.ok) throw new Error("Error al cargar estadísticas");
  return res.json();
}

export type UsuarioExport = {
  cedula: string;
  nombre: string;
  apellido: string;
  telefono: string;
  puntos: number;
  cartilla_estado: string;
};

export async function adminExportarUsuarios(token: string): Promise<UsuarioExport[]> {
  const res = await fetch("/api/admin/usuarios/exportar", {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (res.status === 401 || res.status === 403) throw new Error("UNAUTHORIZED");
  if (!res.ok) throw new Error("Error al exportar usuarios");
  return res.json();
}

export async function adminGetUsuarios(
  token: string,
  params: { pagina: number; limite: number; busqueda?: string }
): Promise<{ datos: UsuarioAdmin[]; total: number; pagina: number; limite: number; totalPaginas: number }> {
  const query = new URLSearchParams({ pagina: String(params.pagina), limite: String(params.limite) });
  if (params.busqueda?.trim()) query.set("busqueda", params.busqueda.trim());
  const res = await fetch(`/api/admin/usuarios?${query}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (res.status === 401 || res.status === 403) throw new Error("UNAUTHORIZED");
  if (!res.ok) throw new Error("Error al obtener usuarios");
  return res.json();
}
