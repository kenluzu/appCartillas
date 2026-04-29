import { buscarUsuario } from "../services/buscarUsuario.ts";

export async function handleBuscarUsuario(req: Request): Promise<Response> {
  const url = new URL(req.url);
  const cedula = url.searchParams.get("cedula")?.trim();

  if (!cedula) {
    return Response.json({ error: "Cédula requerida" }, { status: 400 });
  }

  try {
    const resultado = await buscarUsuario(cedula);
    return Response.json(resultado);
  } catch (e: unknown) {
    const mensaje = e instanceof Error ? e.message : "Error interno";
    return Response.json({ error: mensaje }, { status: 500 });
  }
}
