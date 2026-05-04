import { Router, type Request, type Response } from "express";
import { UsuarioRepository } from "../repositories/UsuarioRepository";
import { CartillaRepository } from "../repositories/CartillaRepository";

export const routerUsuarios = Router();

routerUsuarios.get("/validar", async (req: Request, res: Response) => {
  const cedula = req.query.cedula as string | undefined;

  if (!cedula) {
    res.status(400).json({ error: "Cédula requerida" });
    return;
  }

  try {
    const usuario = await UsuarioRepository.buscarPorCedula(cedula);
    if (!usuario) {
      res.status(404).json({ existe: false });
      return;
    }

    const cartillaExistente = await CartillaRepository.buscarActivaPorUsuario(usuario.id);
    const cartilla = cartillaExistente ?? await CartillaRepository.crearCartilla(usuario.id);

    res.json({
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
    res.status(500).json({ error: "Error de conexión" });
  }
});

routerUsuarios.post("/", async (req: Request, res: Response) => {
  const { cedula, nombre, apellido, telefono } = req.body ?? {};

  if (!cedula?.trim() || !nombre?.trim() || !apellido?.trim() || !telefono?.trim()) {
    res.status(400).json({ error: "Todos los campos son obligatorios" });
    return;
  }

  try {
    const existente = await UsuarioRepository.buscarPorCedula(cedula.trim());
    if (existente) {
      res.status(409).json({ error: "La cédula ya está registrada" });
      return;
    }

    const usuario = await UsuarioRepository.crearUsuario({
      cedula: cedula.trim(),
      nombre: nombre.trim(),
      apellido: apellido.trim(),
      telefono: telefono.trim(),
    });

    const cartilla = await CartillaRepository.crearCartilla(usuario.id);

    res.status(201).json({
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
    });
  } catch (err) {
    console.error("[crearUsuario] Error de BD:", err);
    res.status(500).json({ error: "Error al registrar usuario" });
  }
});
