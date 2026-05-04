import { UsuarioRepository } from "../repositories/UsuarioRepository";

export async function handleListarUsuarios(req: Request): Promise<Response> {
  const url = new URL(req.url);
  const pagina = Math.max(1, parseInt(url.searchParams.get("pagina") ?? "1") || 1);
  const limite = 5;
  const busqueda = url.searchParams.get("busqueda") ?? undefined;

  try {
    const { datos, total } = await UsuarioRepository.listarUsuarios({ pagina, limite, busqueda });
    return Response.json({
      datos: datos.map(u => ({
        id: u.id,
        cedula: u.cedula,
        nombre: u.nombre,
        apellido: u.apellido ?? "",
        telefono: u.telefono ?? "",
        rol: u.rol,
      })),
      total,
      pagina,
      limite,
      totalPaginas: Math.max(1, Math.ceil(total / limite)),
    });
  } catch (err) {
    console.error("[listarUsuarios] Error de BD:", err);
    return Response.json({ error: "Error al obtener usuarios" }, { status: 500 });
  }
}
