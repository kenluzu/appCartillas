import { Router, type Request, type Response } from "express";
import { UsuarioRepository } from "../repositories/UsuarioRepository";
import { CartillaRepository } from "../repositories/CartillaRepository";
import { PlanRetiroRepository } from "../repositories/PlanRetiroRepository";
import { FarmaciaRepository } from "../repositories/FarmaciaRepository";
import { RetoRepository } from "../repositories/RetoRepository";

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

const MONTOS_MIN: Record<string, number> = {
  contact_center: 20,
  referido: 10,
  lineas_estrategicas: 10,
  productos_focos: 10,
};

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

// ── Registrar un reto (suma 1 punto a la cartilla) ─────────────────────────────
routerUsuarios.post("/reto", async (req: Request, res: Response) => {
  const { cartilla_id, tipo_reto, monto, numero_factura, descripcion } = req.body ?? {};

  if (!cartilla_id || !tipo_reto || monto == null) {
    res.status(400).json({ error: "Datos incompletos" });
    return;
  }

  const montoNum = parseFloat(monto);
  const montoMin = MONTOS_MIN[tipo_reto];

  if (!montoMin) {
    res.status(400).json({ error: "Tipo de reto no válido" });
    return;
  }

  if (isNaN(montoNum) || montoNum < montoMin) {
    res.status(400).json({ error: `El monto mínimo para este reto es $${montoMin}` });
    return;
  }

  try {
    const { reto, cartilla } = await RetoRepository.registrar({
      cartilla_id: Number(cartilla_id),
      tipo_reto,
      monto: montoNum,
      numero_factura: numero_factura?.trim() || undefined,
      descripcion: descripcion?.trim() || undefined,
    });

    res.status(201).json({
      ok: true,
      reto: {
        id: reto.id,
        tipo_reto: reto.tipo_reto,
        monto: reto.monto,
        fecha_registro: reto.fecha_registro,
      },
      cartilla: {
        id: cartilla.id,
        puntos: cartilla.puntos,
        estado: cartilla.estado,
        fecha_inicio: cartilla.fecha_inicio,
      },
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Error al registrar reto";
    if (msg === "Cartilla no encontrada") {
      res.status(404).json({ error: msg });
    } else if (msg === "La cartilla no está activa") {
      res.status(400).json({ error: msg });
    } else {
      console.error("[registrarReto] Error de BD:", err);
      res.status(500).json({ error: "Error al guardar el reto" });
    }
  }
});

// ── Historial de cartillas de un usuario ───────────────────────────────────────
routerUsuarios.get("/historial", async (req: Request, res: Response) => {
  const usuario_id = req.query.usuario_id as string | undefined;

  if (!usuario_id) {
    res.status(400).json({ error: "usuario_id requerido" });
    return;
  }

  try {
    const cartillas = await CartillaRepository.buscarTodasPorUsuario(Number(usuario_id));
    const ids = cartillas.map(c => c.id);
    const retosMap = await RetoRepository.contarPorCartillas(ids);

    res.json(
      cartillas.map((c, i) => ({
        id: c.id,
        puntos: c.puntos,
        estado: c.estado,
        fecha_inicio: c.fecha_inicio,
        numero: cartillas.length - i,
        total_retos: retosMap.get(c.id) ?? 0,
      }))
    );
  } catch (err) {
    console.error("[historial] Error de BD:", err);
    res.status(500).json({ error: "Error al obtener historial" });
  }
});

// ── Retos de una cartilla específica ───────────────────────────────────────────
routerUsuarios.get("/retos/:cartillaId", async (req: Request, res: Response) => {
  const cartillaId = parseInt(req.params.cartillaId);
  if (isNaN(cartillaId)) {
    res.status(400).json({ error: "ID inválido" });
    return;
  }

  try {
    const retos = await RetoRepository.buscarPorCartilla(cartillaId);
    res.json(retos);
  } catch (err) {
    console.error("[retosCartilla] Error de BD:", err);
    res.status(500).json({ error: "Error al obtener retos" });
  }
});

// ── Iniciar nueva cartilla (después de completar una) ─────────────────────────
routerUsuarios.post("/nueva-cartilla", async (req: Request, res: Response) => {
  const { usuario_id } = req.body ?? {};

  if (!usuario_id) {
    res.status(400).json({ error: "usuario_id requerido" });
    return;
  }

  try {
    const cartillaActual = await CartillaRepository.buscarActivaPorUsuario(Number(usuario_id));

    if (cartillaActual && cartillaActual.estado === "activa") {
      res.status(400).json({ error: "Ya tienes una cartilla activa" });
      return;
    }

    const nueva = await CartillaRepository.crearCartilla(Number(usuario_id));

    res.status(201).json({
      id: nueva.id,
      puntos: nueva.puntos,
      estado: nueva.estado,
      fecha_inicio: nueva.fecha_inicio,
    });
  } catch (err) {
    console.error("[nuevaCartilla] Error de BD:", err);
    res.status(500).json({ error: "Error al crear nueva cartilla" });
  }
});

// ── Rutas legacy de retiros (se mantienen para compatibilidad) ─────────────────
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
    if (cartilla.estado !== "completa" && cartilla.puntos < 10) {
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
