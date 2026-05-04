import { UsuarioRepository } from "../repositories/UsuarioRepository";
import { CartillaRepository } from "../repositories/CartillaRepository";

export async function handleCrearUsuario(req: Request): Promise<Response> {
  let body: any;
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: "Todos los campos son obligatorios" }, { status: 400 });
  }

  const { cedula, nombre, apellido, telefono } = body ?? {};
  if (!cedula?.trim() || !nombre?.trim() || !apellido?.trim() || !telefono?.trim()) {
    return Response.json({ error: "Todos los campos son obligatorios" }, { status: 400 });
  }

  try {
    const existente = await UsuarioRepository.buscarPorCedula(cedula.trim());
    if (existente) {
      return Response.json({ error: "La cédula ya está registrada" }, { status: 409 });
    }

    const usuario = await UsuarioRepository.crearUsuario({
      cedula: cedula.trim(),
      nombre: nombre.trim(),
      apellido: apellido.trim(),
      telefono: telefono.trim(),
    });

    const cartilla = await CartillaRepository.crearCartilla(usuario.id);

    return Response.json(
      {
        id: usuario.id,
        cedula: usuario.cedula,
        nombre: usuario.nombre,
        apellido: usuario.apellido ?? "",
        telefono: usuario.telefono ?? "",
        rol: usuario.rol,
        cartilla: {
          id: cartilla.id,
          puntos: cartilla.puntos,
          estado: cartilla.estado,
          fecha_inicio: cartilla.fecha_inicio,
        },
      },
      { status: 201 }
    );
  } catch (err) {
    console.error("[crearUsuario] Error de BD:", err);
    return Response.json({ error: "Error al registrar usuario" }, { status: 500 });
  }
}

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

    const cartillaExistente = await CartillaRepository.buscarActivaPorUsuario(usuario.id);
    const cartilla = cartillaExistente ?? await CartillaRepository.crearCartilla(usuario.id);

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
      cartilla: {
        id: cartilla.id,
        puntos: cartilla.puntos,
        estado: cartilla.estado,
        fecha_inicio: cartilla.fecha_inicio,
      },
    });
  } catch (err) {
    console.error("[validarCedula] Error de BD:", err);
    return Response.json({ error: "Error de conexión" }, { status: 500 });
  }
}
