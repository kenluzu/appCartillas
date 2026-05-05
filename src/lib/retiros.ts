import type { Retiro } from "./types";

export type { Retiro };

export type RetiroAdmin = {
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

export async function crearPlan(data: {
  cartilla_id: number;
  farmacia_id: number;
  fecha_retiro: string;
  hora_retiro: string;
}): Promise<Retiro> {
  const res = await fetch("/api/usuarios/plan", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json.error ?? "Error al guardar el retiro");
  return json;
}

export async function actualizarPlan(
  id: number,
  data: { farmacia_id: number; fecha_retiro: string; hora_retiro: string }
): Promise<Retiro> {
  const res = await fetch(`/api/usuarios/plan/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json.error ?? "Error al actualizar el retiro");
  return json;
}

export async function adminGetRetiros(token: string): Promise<RetiroAdmin[]> {
  const res = await fetch("/api/admin/retiros", {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (res.status === 401 || res.status === 403) throw new Error("UNAUTHORIZED");
  if (!res.ok) throw new Error("Error al cargar retiros");
  return res.json();
}

export async function adminMarcarEntregado(token: string, id: number): Promise<{ ok: boolean }> {
  const res = await fetch(`/api/admin/retiros/${id}/entregar`, {
    method: "PUT",
    headers: { Authorization: `Bearer ${token}` },
  });
  const json = await res.json();
  if (res.status === 401 || res.status === 403) throw new Error("UNAUTHORIZED");
  if (!res.ok) throw new Error(json.error ?? "Error al marcar como entregado");
  return json;
}

export async function adminRevertirEntrega(token: string, id: number): Promise<{ ok: boolean }> {
  const res = await fetch(`/api/admin/retiros/${id}/revertir`, {
    method: "PUT",
    headers: { Authorization: `Bearer ${token}` },
  });
  const json = await res.json();
  if (res.status === 401 || res.status === 403) throw new Error("UNAUTHORIZED");
  if (!res.ok) throw new Error(json.error ?? "Error al revertir el retiro");
  return json;
}
