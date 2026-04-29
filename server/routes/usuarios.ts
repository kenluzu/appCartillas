import { UsuarioRepository } from "../repositories/UsuarioRepository";

export async function handleValidarCedula(req: Request): Promise<Response> {
  const url = new URL(req.url);
  const cedula = url.searchParams.get("cedula");

  if (!cedula) {
    return Response.json({ error: "Cédula requerida" }, { status: 400 });
  }

  try {
    const usuario = await UsuarioRepository.buscarPorCedula(cedula);
    if (!usuario) {
      return Response.json({ existe: false }, { status: 404 });
    }
    return Response.json({
      existe: true,
      usuario: {
        id: usuario.id,
        cedula: usuario.cedula,
        nombre: usuario.nombre,
        apellido: usuario.apellido ?? "",
        telefono: usuario.telefono ?? "",
        rol: usuario.rol,
      },
    });
  } catch (err) {
    console.error("[validarCedula] Error de BD:", err);
    return Response.json({ error: "Error de conexión" }, { status: 500 });
  }
}
