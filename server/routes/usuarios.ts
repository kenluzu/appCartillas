import { Router, type Request, type Response } from "express";
import { UsuarioRepository } from "../repositories/UsuarioRepository";
import { CartillaRepository } from "../repositories/CartillaRepository";
import { PlanRetiroRepository } from "../repositories/PlanRetiroRepository";
import { FarmaciaRepository } from "../repositories/FarmaciaRepository";

export const routerUsuarios = Router();

function horaStr(value: unknown): string {
  if (value instanceof Date) {
    const h = value.getHours().toString().padStart(2, "0");
    const m = value.getMinutes().toString().padStart(2, "0");
    const s = value.getSeconds().toString().padStart(2, "0");
    return `${h}:${m}:${s}`;
  }
  return String(value ?? "");
}

routerUsuarios.get("/farmacias", async (_req: Request, res: Response) => {
  try {
    const farmacias = await FarmaciaRepository.buscarTodas();
    res.json(farmacias);
  } catch (err) {
    console.error("[farmacias] Error de BD:", err);
    res.status(500).json({ error: "Error al obtener farmacias" });
  }
});

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

    const planExistente = await PlanRetiroRepository.buscarPorCartilla(cartilla.id);

    let retiro = null;
    if (planExistente) {
      const farmacia = await FarmaciaRepository.buscarPorId(planExistente.farmacia_id);
      retiro = {
        id: planExistente.id,
        cartilla_id: planExistente.cartilla_id,
        farmacia_id: planExistente.farmacia_id,
        farmacia_nombre: farmacia?.nombre ?? "",
        farmacia_direccion: farmacia?.direccion ?? "",
        fecha_retiro: planExistente.fecha_retiro,
        hora_retiro: horaStr(planExistente.hora_retiro),
        estado: planExistente.estado,
      };
    }

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
      retiro,
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

routerUsuarios.post("/plan", async (req: Request, res: Response) => {
  const { cartilla_id, farmacia_id, fecha_retiro, hora_retiro } = req.body ?? {};

  if (!cartilla_id || !farmacia_id || !fecha_retiro || !hora_retiro) {
    res.status(400).json({ error: "Datos incompletos" });
    return;
  }

  try {
    const [cartilla, farmacia] = await Promise.all([
      CartillaRepository.buscarPorId(Number(cartilla_id)),
      FarmaciaRepository.buscarPorId(Number(farmacia_id)),
    ]);

    if (!cartilla) {
      res.status(404).json({ error: "Cartilla no encontrada" });
      return;
    }
    if (!farmacia) {
      res.status(400).json({ error: "Farmacia no válida" });
      return;
    }
    if (cartilla.estado !== "completa" && cartilla.puntos < 20) {
      res.status(400).json({ error: "La cartilla no tiene los puntos suficientes" });
      return;
    }

    const existente = await PlanRetiroRepository.buscarPorCartilla(cartilla.id);
    if (existente) {
      res.status(409).json({ error: "Ya existe un retiro planificado para esta cartilla" });
      return;
    }

    const horaFormateada = hora_retiro.length === 5 ? `${hora_retiro}:00` : hora_retiro;
    const plan = await PlanRetiroRepository.crear({
      cartilla_id: cartilla.id,
      farmacia_id: farmacia.id,
      fecha_retiro,
      hora_retiro: horaFormateada,
    });

    res.status(201).json({
      id: plan.id,
      cartilla_id: plan.cartilla_id,
      farmacia_id: plan.farmacia_id,
      farmacia_nombre: farmacia.nombre,
      farmacia_direccion: farmacia.direccion,
      fecha_retiro: plan.fecha_retiro,
      hora_retiro: horaStr(plan.hora_retiro),
      estado: plan.estado,
    });
  } catch (err) {
    console.error("[crearPlan] Error de BD:", err);
    res.status(500).json({ error: "Error al guardar el retiro" });
  }
});

routerUsuarios.put("/plan/:id", async (req: Request, res: Response) => {
  const id = Number(req.params.id);
  const { farmacia_id, fecha_retiro, hora_retiro } = req.body ?? {};

  if (!id || !farmacia_id || !fecha_retiro || !hora_retiro) {
    res.status(400).json({ error: "Datos incompletos" });
    return;
  }

  try {
    const farmacia = await FarmaciaRepository.buscarPorId(Number(farmacia_id));
    if (!farmacia) {
      res.status(400).json({ error: "Farmacia no válida" });
      return;
    }

    const horaFormateada = hora_retiro.length === 5 ? `${hora_retiro}:00` : hora_retiro;
    const plan = await PlanRetiroRepository.actualizar(id, {
      farmacia_id: farmacia.id,
      fecha_retiro,
      hora_retiro: horaFormateada,
    });

    if (!plan) {
      res.status(404).json({ error: "Retiro no encontrado" });
      return;
    }

    res.json({
      id: plan.id,
      cartilla_id: plan.cartilla_id,
      farmacia_id: plan.farmacia_id,
      farmacia_nombre: farmacia.nombre,
      farmacia_direccion: farmacia.direccion,
      fecha_retiro: plan.fecha_retiro,
      hora_retiro: horaStr(plan.hora_retiro),
      estado: plan.estado,
    });
  } catch (err) {
    console.error("[actualizarPlan] Error de BD:", err);
    res.status(500).json({ error: "Error al actualizar el retiro" });
  }
});
