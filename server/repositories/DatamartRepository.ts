import { AppDataSource, DatamartDataSource } from "../data-source";
import { Reto } from "../entities/Reto";
import { CartillaRepository } from "./CartillaRepository";

// ── Rango de fechas para los retos (cambiar para demos) ──────────────────────
export const RETO_PERIODO_INICIO = 20251215;
export const RETO_PERIODO_FIN    = 20260115;

export type FacturaRow = {
  numero_factura: string;
  periodo: number;
  monto_total: number;
};

export type SincronizarRetosResult = {
  goleada: FacturaRow[];
  estrategica: FacturaRow[];
  foco: FacturaRow[];
  cartilla: { id: number; puntos: number; estado: "activa" | "completa" | "cerrada"; fecha_inicio: string };
};

export const DatamartRepository = {

  async queryGoleada(idCliente: number, idBodegas: number[]): Promise<FacturaRow[]> {
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
  },

  async queryEstrategica(idCliente: number, cods: string[]): Promise<FacturaRow[]> {
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
  },

  async queryFoco(idCliente: number, cods: string[]): Promise<FacturaRow[]> {
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
  },

  async queryReferido(numeroFactura: string): Promise<{ monto_total: number }[]> {
    return DatamartDataSource.query(
      `SELECT c.numero_factura, c.periodo, SUM(fp.monto_total) AS monto_total
       FROM [dbo].[FACT_VENTA_CABECERA] c
       INNER JOIN [dbo].[FACT_VENTA_FORMA_PAGO] fp
         ON fp.id_venta_cab = c.id_venta_cab AND fp.periodo = c.periodo
       WHERE c.numero_factura = @0
         AND c.periodo >= ${RETO_PERIODO_INICIO} AND c.periodo <= ${RETO_PERIODO_FIN}
       GROUP BY c.id_venta_cab, c.numero_factura, c.periodo
       HAVING SUM(fp.monto_total) >= 20`,
      [numeroFactura]
    );
  },

  // Sincroniza los tres retos automáticos del Datamart para una cartilla.
  // Borra los registros previos, deduplica por prioridad (goleada > estratégica > foco)
  // y actualiza los puntos de la cartilla.
  async sincronizarRetos(codCliente: number, cartillaId: number): Promise<SincronizarRetosResult> {
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
      this.queryGoleada(codCliente, idBodegas),
      this.queryEstrategica(codCliente, codsEstrategica),
      this.queryFoco(codCliente, codsFoco),
    ]);

    // Borrar retos automáticos previos para recalcular con deduplicación por prioridad
    await AppDataSource.query(
      `DELETE FROM retos WHERE cartilla_id = @0 AND tipo_reto IN ('contact_center', 'lineas_estrategicas', 'productos_focos')`,
      [cartillaId]
    );

    // Deduplicar: una misma factura solo pertenece al reto de mayor prioridad
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

    // Contar todos los retos (incluyendo referidos) como fuente de verdad para puntos
    const countResult = await AppDataSource.query(
      `SELECT COUNT(*) AS total FROM retos WHERE cartilla_id = @0`,
      [cartillaId]
    ) as [{ total: number }];
    const totalPuntos = Number(countResult[0]!.total);

    const cartilla = await CartillaRepository.actualizarPuntos(cartillaId, totalPuntos);

    return {
      goleada: displayGoleada,
      estrategica: displayEstrategica,
      foco: displayFoco,
      cartilla: {
        id: cartilla.id,
        puntos: cartilla.puntos,
        estado: cartilla.estado,
        fecha_inicio: cartilla.fecha_inicio,
      },
    };
  },
};
