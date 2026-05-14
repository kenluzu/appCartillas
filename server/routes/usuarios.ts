import { Router, type Request, type Response } from "express";
import { UsuarioRepository } from "../repositories/UsuarioRepository";
import { CartillaRepository } from "../repositories/CartillaRepository";
import { PlanRetiroRepository } from "../repositories/PlanRetiroRepository";
import { FarmaciaRepository } from "../repositories/FarmaciaRepository";
import { RetoRepository } from "../repositories/RetoRepository";
import { DatamartRepository } from "../repositories/DatamartRepository";
import { ComercialCumplimiento } from "../entities/ComercialCumplimiento";
import { AppDataSource, DatamartDataSource } from "../data-source";

export const routerUsuarios = Router();

const MONTOS_MIN = 20;

function horaStr(value: unknown): string {
  if (value instanceof Date) {
    const h = value.getHours().toString().padStart(2, "0");
    const m = value.getMinutes().toString().padStart(2, "0");
    const s = value.getSeconds().toString().padStart(2, "0");
    return `${h}:${m}:${s}`;
  }
  return String(value ?? "");
}

function handleRetoError(err: unknown, res: Response) {
  const msg = err instanceof Error ? err.message : "";
  if (msg === "Cartilla no encontrada") return void res.status(404).json({ error: msg });
  if (msg === "La cartilla no está activa") return void res.status(400).json({ error: msg });
  res.status(500).json({ error: "Error al guardar el reto" });
}

routerUsuarios.get("/farmacias", async (_req: Request, res: Response) => {
  // Obtener listado de farmacias para selección en el plan de retiro
  try {
    const farmacias = await FarmaciaRepository.buscarTodas();
    res.json(farmacias);
  } catch (err) {
    console.error("[farmacias] Error de BD:", err);
    res.status(500).json({ error: "Error al obtener farmacias" });
  }
});

routerUsuarios.get("/validar", async (req: Request, res: Response) => {
  // Validamos que cedula exista en el Datamart y si no existe, la creamos en nuestra BD de dbCartillas
  const cedula = req.query.cedula as string | undefined;

  if (!cedula) {
    res.status(400).json({ error: "Cédula requerida" });
    return;
  }

  try {
    let usuario = await UsuarioRepository.buscarPorCedula(cedula);

    if (!usuario) {
      let nombre = "";
      let telefono = "";
      let cod_cliente: number | null = null;

      if (!DatamartDataSource.isInitialized) {
        res.status(404).json({ error: "Cédula no encontrada." });
        return;
      }

      const rows = await DatamartDataSource.query(
        `SELECT TOP 1 id_cliente, nombre, num_celular
         FROM [dbo].[DIM_CLIENTE]
         WHERE documento_identidad = @0`,
        [cedula]
      ) as { id_cliente: number; nombre: string; num_celular: string }[];

      if (rows.length === 0) {
        res.status(404).json({ error: "Cédula no encontrada." });
        return;
      }

      nombre      = rows[0]!.nombre ?? "";
      telefono    = rows[0]!.num_celular ?? "";
      cod_cliente = rows[0]!.id_cliente ?? null;

      usuario = await UsuarioRepository.crearUsuario({ cedula, nombre, apellido: "", telefono, cod_cliente });
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
        cod_cliente: usuario.cod_cliente ?? null,
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
  // Registrar nuevo usuario (solo para admins)
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

// ── Sincronizar retos automáticos desde Datamart ──────────────────────────────
routerUsuarios.get("/sincronizar-retos", async (req: Request, res: Response) => {
  const codCliente = Number(req.query.cod_cliente);
  const cartillaId = Number(req.query.cartilla_id);

  console.log("Sincronizar retos - cod_cliente:", codCliente, "cartilla_id:", cartillaId);

  if (!cartillaId) {
    res.status(400).json({ error: "cartilla_id requerido" });
    return;
  }

  if (!codCliente) {
    res.json({ goleada: [], estrategica: [], foco: [], cartilla: null });
    return;
  }

  if (!DatamartDataSource.isInitialized) {
    res.status(503).json({ error: "Datamart no disponible" });
    return;
  }

  try {
    const result = await DatamartRepository.sincronizarRetos(codCliente, cartillaId);
    res.json(result);
  } catch (err) {
    console.error("[sincronizar-retos] Error:", err);
    res.status(500).json({ error: "Error al sincronizar retos" });
  }
});

// ── Registrar un reto genérico ────────────────────────────────────────────────
routerUsuarios.post("/reto", async (req: Request, res: Response) => {
  const { cartilla_id, tipo_reto, monto, numero_factura, descripcion } = req.body ?? {};

  if (!cartilla_id || !tipo_reto || monto == null) {
    res.status(400).json({ error: "Datos incompletos" });
    return;
  }

  const montoNum = parseFloat(monto);
  let puntos_a_agregar = 1;

  if (tipo_reto === "cumplimiento") {
    if (isNaN(montoNum) || montoNum < 100) {
      res.status(400).json({ error: "El cumplimiento mínimo para acumular puntos es 100%" });
      return;
    }
    puntos_a_agregar = Math.floor((montoNum - 100) / 5) + 1;
  } else {
    if (isNaN(montoNum) || montoNum < MONTOS_MIN) {
      res.status(400).json({ error: `El monto mínimo para este reto es $${MONTOS_MIN}` });
      return;
    }
  }

  try {
    const { reto, cartilla } = await RetoRepository.registrar({
      cartilla_id: Number(cartilla_id),
      tipo_reto,
      monto: montoNum,
      numero_factura: numero_factura?.trim() || undefined,
      descripcion: descripcion?.trim() || undefined,
      tickets: puntos_a_agregar,
    });

    res.status(201).json({
      ok: true,
      reto: { id: reto.id, tipo_reto: reto.tipo_reto, monto: reto.monto, fecha_registro: reto.fecha_registro },
      cartilla: { id: cartilla.id, puntos: cartilla.puntos, estado: cartilla.estado, fecha_inicio: cartilla.fecha_inicio },
    });
  } catch (err) {
    handleRetoError(err, res);
  }
});

// ── Registrar reto "Refiere a tu 10" validando factura en Datamart ────────────
routerUsuarios.post("/reto/referido", async (req: Request, res: Response) => {
  const { cartilla_id, numero_factura, descripcion, cedula_referido, celular_referido } = req.body ?? {};

  if (!cartilla_id || !numero_factura?.trim()) {
    res.status(400).json({ error: "cartilla_id y numero_factura son requeridos" });
    return;
  }

  if (!DatamartDataSource.isInitialized) {
    res.status(503).json({ error: "Datamart no disponible" });
    return;
  }

  try {
    const rows = await DatamartRepository.queryReferido(numero_factura.trim());

    if (rows.length === 0) {
      res.status(400).json({ error: "Factura no encontrada o no califica (monto < $20 o fuera del período)" });
      return;
    }

    const duplicado = await AppDataSource.query(
      `SELECT 1 FROM retos WHERE tipo_reto = 'referido' AND numero_factura = @0`,
      [numero_factura.trim()]
    ) as unknown[];
    if (duplicado.length > 0) {
      res.status(409).json({ error: "Esta factura ya fue registrada en una cartilla" });
      return;
    }

    const monto = Number(rows[0]!.monto_total);
    const tickets = Math.floor(monto / 20);

    const { reto, cartilla } = await RetoRepository.registrar({
      cartilla_id: Number(cartilla_id),
      tipo_reto: "referido",
      monto,
      numero_factura: numero_factura.trim(),
      descripcion: descripcion?.trim() || undefined,
      tickets,
      cedula_referido: cedula_referido?.trim() || undefined,
      celular_referido: celular_referido?.trim() || undefined,
    });

    res.status(201).json({
      ok: true,
      monto,
      reto: { id: reto.id, tipo_reto: reto.tipo_reto, monto: reto.monto, fecha_registro: reto.fecha_registro },
      cartilla: { id: cartilla.id, puntos: cartilla.puntos, estado: cartilla.estado, fecha_inicio: cartilla.fecha_inicio },
    });
  } catch (err) {
    handleRetoError(err, res);
  }
});

// ── Historial de cartillas de un usuario ──────────────────────────────────────
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

// ── Retos de una cartilla específica ──────────────────────────────────────────
routerUsuarios.get("/retos/:cartillaId", async (req: Request, res: Response) => {
  const cartillaId = parseInt(req.params.cartillaId!);
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

// ── Iniciar nueva cartilla ─────────────────────────────────────────────────────
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

// ── Rutas de retiros ───────────────────────────────────────────────────────────
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

    if (!cartilla) { res.status(404).json({ error: "Cartilla no encontrada" }); return; }
    if (!farmacia) { res.status(400).json({ error: "Farmacia no válida" }); return; }
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
    if (!farmacia) { res.status(400).json({ error: "Farmacia no válida" }); return; }

    const horaFormateada = hora_retiro.length === 5 ? `${hora_retiro}:00` : hora_retiro;
    const plan = await PlanRetiroRepository.actualizar(id, {
      farmacia_id: farmacia.id,
      fecha_retiro,
      hora_retiro: horaFormateada,
    });

    if (!plan) { res.status(404).json({ error: "Retiro no encontrado" }); return; }

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

// ── Validar usuario comercial (por nombre de usuario del Excel) ───────────────
routerUsuarios.get("/validar-comercial", async (req: Request, res: Response) => {
  const usuarioVal = (req.query.usuario as string | undefined)?.trim();
  if (!usuarioVal) {
    res.status(400).json({ error: "usuario requerido" });
    return;
  }

  try {
    const repo = AppDataSource.getRepository(ComercialCumplimiento);
    const registro = await repo
      .createQueryBuilder("c")
      .where("LOWER(c.usuario) = LOWER(:val)", { val: usuarioVal })
      .getOne();

    if (!registro) {
      res.status(404).json({ error: "Usuario no encontrado en el equipo comercial." });
      return;
    }

    const dimUsuario = await DatamartRepository.buscarUsuarioPorLogin(usuarioVal);
    if (!dimUsuario) {
      res.status(404).json({ error: "Usuario no encontrado en el sistema." });
      return;
    }
    const nombreCompleto = dimUsuario.nombre;

    // Cálculo de puntos con gate: los 3 deben ser >= 100%
    const vol  = Number(registro.volumen)     * 100;
    const util = Number(registro.utilidad)    * 100;
    const est  = Number(registro.estrategica) * 100;
    const cumpleTodo = vol >= 100 && util >= 100 && est >= 100;

    const boletoAsegurado  = cumpleTodo ? 1 : 0;
    const puntosVolumen    = cumpleTodo ? Math.floor((vol  - 100) / 5) : 0;
    const puntosUtilidad   = cumpleTodo ? Math.floor((util - 100) / 5) : 0;
    const puntosEstrategica = cumpleTodo ? Math.floor((est  - 100) / 5) : 0;
    const totalPuntos = Math.min(boletoAsegurado + puntosVolumen + puntosUtilidad + puntosEstrategica, 10);

    // Buscar o crear usuario en la tabla usuarios (cedula = valor del usuario comercial)
    let usuario = await UsuarioRepository.buscarPorCedula(usuarioVal);
    if (!usuario) {
      usuario = await UsuarioRepository.crearUsuario({
        cedula: usuarioVal,
        nombre: nombreCompleto,
        apellido: "",
        telefono: "",
      });
    } else if (usuario.nombre !== nombreCompleto) {
      await UsuarioRepository.actualizarNombre(usuario.id, nombreCompleto);
      usuario.nombre = nombreCompleto;
    }

    // Buscar o crear cartilla, actualizar puntos
    const cartillaExistente = await CartillaRepository.buscarActivaPorUsuario(usuario.id);
    let cartilla = cartillaExistente ?? await CartillaRepository.crearCartilla(usuario.id);
    cartilla = await CartillaRepository.actualizarPuntos(cartilla.id, totalPuntos);

    res.json({
      usuario: {
        id: usuario.id,
        cedula: usuario.cedula,
        nombre: usuario.nombre,
        apellido: usuario.apellido ?? "",
        telefono: usuario.telefono ?? "",
        rol: usuario.rol,
        cod_cliente: null,
      },
      cartilla: {
        id: cartilla.id,
        puntos: cartilla.puntos,
        estado: cartilla.estado,
        fecha_inicio: cartilla.fecha_inicio,
      },
      metricas: {
        volumen:             Math.round(vol),
        utilidad:            Math.round(util),
        estrategica:         Math.round(est),
        boleto_asegurado:    boletoAsegurado,
        puntos_volumen:      puntosVolumen,
        puntos_utilidad:     puntosUtilidad,
        puntos_estrategica:  puntosEstrategica,
      },
    });
  } catch (err) {
    console.error("[validar-comercial] Error:", err);
    res.status(500).json({ error: "Error de conexión" });
  }
});
