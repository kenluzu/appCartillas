import type { Farmacia } from "./types";

export type { Farmacia };

export async function getFarmacias(): Promise<Farmacia[]> {
  const res = await fetch("/api/usuarios/farmacias");
  if (!res.ok) throw new Error("Error al cargar farmacias");
  return res.json();
}

export async function adminGetFarmacias(token: string): Promise<Farmacia[]> {
  const res = await fetch("/api/admin/farmacias", {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (res.status === 401 || res.status === 403) throw new Error("UNAUTHORIZED");
  if (!res.ok) throw new Error("Error al cargar farmacias");
  return res.json();
}

export async function adminCrearFarmacia(token: string, data: Omit<Farmacia, "id">): Promise<Farmacia> {
  const res = await fetch("/api/admin/farmacias", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
    body: JSON.stringify(data),
  });
  const json = await res.json();
  if (res.status === 401 || res.status === 403) throw new Error("UNAUTHORIZED");
  if (!res.ok) throw new Error(json.error ?? "Error al crear farmacia");
  return json;
}

export async function adminActualizarFarmacia(
  token: string,
  id: number,
  data: Partial<Omit<Farmacia, "id">>
): Promise<Farmacia> {
  const res = await fetch(`/api/admin/farmacias/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
    body: JSON.stringify(data),
  });
  const json = await res.json();
  if (res.status === 401 || res.status === 403) throw new Error("UNAUTHORIZED");
  if (!res.ok) throw new Error(json.error ?? "Error al actualizar farmacia");
  return json;
}

export async function adminEliminarFarmacia(token: string, id: number): Promise<{ ok: boolean }> {
  const res = await fetch(`/api/admin/farmacias/${id}`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${token}` },
  });
  const json = await res.json();
  if (res.status === 401 || res.status === 403) throw new Error("UNAUTHORIZED");
  if (!res.ok) throw new Error(json.error ?? "Error al eliminar farmacia");
  return json;
}
