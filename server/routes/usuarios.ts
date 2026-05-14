import { Router, type Request, type Response } from "express";
import { UsuarioRepository } from "../repositories/UsuarioRepository";
import { CartillaRepository } from "../repositories/CartillaRepository";
import { PlanRetiroRepository } from "../repositories/PlanRetiroRepository";
import { FarmaciaRepository } from "../repositories/FarmaciaRepository";
import { RetoRepository } from "../repositories/RetoRepository";
import { AppDataSource, DatamartDataSource } from "../data-source";
import { Reto } from "../entities/Reto";

// ── Rango de fechas para los retos (cambiar para demos) ───────────────────────
const RETO_PERIODO_INICIO = 20251215;
const RETO_PERIODO_FIN    = 20260115;

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
    let usuario = await UsuarioRepository.buscarPorCedula(cedula);

    if (!usuario) {
      // Buscar en DIM_CLIENTE del Datamart para auto-crear el usuario
      let nombre = "";
      let telefono = "";
      let cod_cliente: number | null = null;

      if (DatamartDataSource.isInitialized) {
        const rows = await DatamartDataSource.query(
          `SELECT TOP 1 id_cliente, nombre, num_celular
           FROM [dbo].[DIM_CLIENTE]
           WHERE documento_identidad = @0`,
          [cedula]
        ) as { id_cliente: number; nombre: string; num_celular: string }[];

        if (rows.length > 0) {
          nombre      = rows[0]!.nombre ?? "";
          telefono    = rows[0]!.num_celular ?? "";
          cod_cliente = rows[0]!.id_cliente ?? null;
        }
      }

      usuario = await UsuarioRepository.crearUsuario({
        cedula,
        nombre,
        apellido: "",
        telefono,
        cod_cliente,
      });
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

// ── Helpers de consulta Datamart ──────────────────────────────────────────────
// Los helpers reciben id_cliente (ya resuelto) para usar el índice de FACT_VENTA_CABECERA
async function queryGoleada(idCliente: number, idBodegas: number[]) {
  // Facturas con productos comprados en bodegas específicas (contact_center) desde $20 dentro del rango de fechas. 
  console.log("Query Goleada - idCliente:", idCliente, "idBodegas:", idBodegas);
  if (idBodegas.length === 0) return [];
  return DatamartDataSource.query(
    `SELECT c.numero_factura, c.periodo, SUM(fp.monto_total) AS monto_total
     FROM [dbo].[FACT_VENTA_CABECERA] c
     INNER JOIN [dbo].[FACT_VENTA_FORMA_PAGO] fp
       ON fp.id_venta_cab = c.id_venta_cab AND fp.periodo = c.periodo
     WHERE c.id_cliente = @0
       AND c.periodo >= ${RETO_PERIODO_INICIO} AND c.periodo <= ${RETO_PERIODO_FIN}
       AND c.id_bodega IN (${idBodegas.join(",")})
     GROUP BY c.id_venta_cab, c.numero_factura, c.periodo
     HAVING SUM(fp.monto_total) >= 20
     ORDER BY c.periodo DESC`,
    [idCliente]
  );
}

async function queryEstrategica(idCliente: number, cods: string[]) {
  // Facturas con productos comprados de líneas estratégicas desde $20 dentro del rango de fechas.
  if (cods.length === 0) return [];
  return DatamartDataSource.query(
    `SELECT c.numero_factura, c.periodo, SUM(fp.monto_total) AS monto_total
     FROM [dbo].[FACT_VENTA_CABECERA] c
     INNER JOIN [dbo].[FACT_VENTA_FORMA_PAGO] fp
       ON fp.id_venta_cab = c.id_venta_cab AND fp.periodo = c.periodo
     WHERE c.id_cliente = @0
       AND c.periodo >= ${RETO_PERIODO_INICIO} AND c.periodo <= ${RETO_PERIODO_FIN}
       AND EXISTS (
         SELECT 1 FROM [dbo].[FACT_VENTA_DETALLE] d
         WHERE d.id_venta_cab = c.id_venta_cab
           AND d.periodo = c.periodo
           AND d.id_producto IN (${cods.join(",")})
       )
     GROUP BY c.id_venta_cab, c.numero_factura, c.periodo
     HAVING SUM(fp.monto_total) >= 20
     ORDER BY c.periodo DESC`,
    [idCliente]
  );
}

async function queryFoco(idCliente: number, cods: string[]) {
  // Facturas con productos comprados de líneas de foco desde $20 dentro del rango de fechas.
  if (cods.length === 0) return [];
  return DatamartDataSource.query(
    `SELECT c.numero_factura, c.periodo, SUM(fp.monto_total) AS monto_total
     FROM [dbo].[FACT_VENTA_CABECERA] c
     INNER JOIN [dbo].[FACT_VENTA_FORMA_PAGO] fp
       ON fp.id_venta_cab = c.id_venta_cab AND fp.periodo = c.periodo
     WHERE c.id_cliente = @0
       AND c.periodo >= ${RETO_PERIODO_INICIO} AND c.periodo <= ${RETO_PERIODO_FIN}
       AND EXISTS (
         SELECT 1 FROM [dbo].[FACT_VENTA_DETALLE] d
         WHERE d.id_venta_cab = c.id_venta_cab
           AND d.periodo = c.periodo
           AND d.id_producto IN (${cods.join(",")})
       )
     GROUP BY c.id_venta_cab, c.numero_factura, c.periodo
     HAVING SUM(fp.monto_total) >= 20
     ORDER BY c.periodo DESC`,
    [idCliente]
  );
}

// ── Sincronizar todos los retos automáticos (Datamart) + actualizar puntos ────
routerUsuarios.get("/sincronizar-retos", async (req: Request, res: Response) => {
  const codCliente = Number(req.query.cod_cliente);
  const cartillaId = Number(req.query.cartilla_id);
  
  console.log("Sincronizar retos - cod_cliente:", codCliente, "cartilla_id:", cartillaId);
  if (!cartillaId) {
    res.status(400).json({ error: "cartilla_id requerido" });
    return;
  }

  // Sin cod_cliente el usuario no tiene data en el Datamart — devolver vacío sin error
  if (!codCliente) {
    res.json({ goleada: [], estrategica: [], foco: [], cartilla: null });
    return;
  }

  if (!DatamartDataSource.isInitialized) {
    res.status(503).json({ error: "Datamart no disponible" });
    return;
  }

  try {
    type FacturaRow = { numero_factura: string; periodo: number; monto_total: number };

    const [bodegaRows, productosRows] = await Promise.all([
      DatamartDataSource.query(
        `SELECT id_bodega FROM [dbo].[DIM_BODEGA] WHERE empresa_general IN ('FC039', 'FC237')`
      ) as Promise<{ id_bodega: number }[]>,
      AppDataSource.query(
        `SELECT cod_producto, tipo FROM productos WHERE activo = 1 AND tipo IN ('estrategica', 'foco')`
      ) as Promise<{ cod_producto: string; tipo: string }[]>,
    ]);

    const idBodegas       = bodegaRows.map(b => b.id_bodega);
    const codsEstrategica = productosRows.filter(p => p.tipo === "estrategica").map(p => `'${p.cod_producto}'`);
    const codsFoco        = productosRows.filter(p => p.tipo === "foco").map(p => `'${p.cod_producto}'`);

    const [goleadaRows, estrategicaRows, focoRows] = await Promise.all([
      queryGoleada(codCliente, idBodegas),
      queryEstrategica(codCliente, codsEstrategica),
      queryFoco(codCliente, codsFoco),
    ]) as [FacturaRow[], FacturaRow[], FacturaRow[]];

    // Borrar retos automáticos previos para recalcular con deduplicación por prioridad.
    // Los retos de tipo 'referido' no se tocan.
    await AppDataSource.query(
      `DELETE FROM retos WHERE cartilla_id = @0 AND tipo_reto IN ('contact_center', 'lineas_estrategicas', 'productos_focos')`,
      [cartillaId]
    );

    // Deduplicar en orden de prioridad: contact_center > lineas_estrategicas > productos_focos.
    // Una misma factura solo puede pertenecer al reto de mayor prioridad.
    const seen = new Set<string>();
    const toInsert: Partial<Reto>[] = [];

    const displayGoleada: FacturaRow[] = [];
    const displayEstrategica: FacturaRow[] = [];
    const displayFoco: FacturaRow[] = [];

    for (const row of goleadaRows) {
      if (!seen.has(row.numero_factura)) {
        seen.add(row.numero_factura);
        toInsert.push({ cartilla_id: cartillaId, tipo_reto: "contact_center", monto: row.monto_total, numero_factura: row.numero_factura, estado: "registrado" });
        displayGoleada.push(row);
      }
    }
    for (const row of estrategicaRows) {
      if (!seen.has(row.numero_factura)) {
        seen.add(row.numero_factura);
        toInsert.push({ cartilla_id: cartillaId, tipo_reto: "lineas_estrategicas", monto: row.monto_total, numero_factura: row.numero_factura, estado: "registrado" });
        displayEstrategica.push(row);
      }
    }
    for (const row of focoRows) {
      if (!seen.has(row.numero_factura)) {
        seen.add(row.numero_factura);
        toInsert.push({ cartilla_id: cartillaId, tipo_reto: "productos_focos", monto: row.monto_total, numero_factura: row.numero_factura, estado: "registrado" });
        displayFoco.push(row);
      }
    }

    if (toInsert.length > 0) {
      await AppDataSource.getRepository(Reto).insert(toInsert);
    }

    // Contar todos los retos de esta cartilla (incluyendo referidos) como fuente de verdad para puntos
    const countResult = await AppDataSource.query(
      `SELECT COUNT(*) AS total FROM retos WHERE cartilla_id = @0`,
      [cartillaId]
    ) as [{ total: number }];
    const totalPuntos = Number(countResult[0]!.total);

    const cartilla = await CartillaRepository.actualizarPuntos(cartillaId, totalPuntos);

    res.json({
      goleada: displayGoleada,
      estrategica: displayEstrategica,
      foco: displayFoco,
      cartilla: {
        id: cartilla.id,
        puntos: cartilla.puntos,
        estado: cartilla.estado,
        fecha_inicio: cartilla.fecha_inicio,
      },
    });
  } catch (err) {
    console.error("[sincronizar-retos] Error:", err);
    res.status(500).json({ error: "Error al sincronizar retos" });
  }
});

// ── Registrar un reto ─────────────────────────────────────────────────────────
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
    const montoMin = MONTOS_MIN[tipo_reto];
    if (!montoMin) {
      res.status(400).json({ error: "Tipo de reto no válido" });
      return;
    }
    if (isNaN(montoNum) || montoNum < montoMin) {
      res.status(400).json({ error: `El monto mínimo para este reto es $${montoMin}` });
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
      puntos_a_agregar,
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

// ── Registrar reto "Refiere a tu 10" validando factura en Datamart ────────────
routerUsuarios.post("/reto/referido", async (req: Request, res: Response) => {
  const { cartilla_id, numero_factura, descripcion } = req.body ?? {};

  if (!cartilla_id || !numero_factura?.trim()) {
    res.status(400).json({ error: "cartilla_id y numero_factura son requeridos" });
    return;
  }

  if (!DatamartDataSource.isInitialized) {
    res.status(503).json({ error: "Datamart no disponible" });
    return;
  }

  try {
    const rows = await DatamartDataSource.query(
      `SELECT c.numero_factura, c.periodo, SUM(fp.monto_total) AS monto_total
       FROM [dbo].[FACT_VENTA_CABECERA] c
       INNER JOIN [dbo].[FACT_VENTA_FORMA_PAGO] fp
         ON fp.id_venta_cab = c.id_venta_cab AND fp.periodo = c.periodo
       WHERE c.numero_factura = @0
         AND c.periodo >= ${RETO_PERIODO_INICIO} AND c.periodo <= ${RETO_PERIODO_FIN}
       GROUP BY c.id_venta_cab, c.numero_factura, c.periodo
       HAVING SUM(fp.monto_total) >= 20`,
      [numero_factura.trim()]
    ) as { monto_total: number }[];

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

    const { reto, cartilla } = await RetoRepository.registrar({
      cartilla_id: Number(cartilla_id),
      tipo_reto: "referido",
      monto,
      numero_factura: numero_factura.trim(),
      descripcion: descripcion?.trim() || undefined,
      puntos_a_agregar: 1,
    });

    res.status(201).json({
      ok: true,
      monto,
      reto: { id: reto.id, tipo_reto: reto.tipo_reto, monto: reto.monto, fecha_registro: reto.fecha_registro },
      cartilla: { id: cartilla.id, puntos: cartilla.puntos, estado: cartilla.estado, fecha_inicio: cartilla.fecha_inicio },
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Error al registrar reto";
    if (msg === "Cartilla no encontrada") {
      res.status(404).json({ error: msg });
    } else if (msg === "La cartilla no está activa") {
      res.status(400).json({ error: msg });
    } else {
      console.error("[registrarReferido] Error:", err);
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
