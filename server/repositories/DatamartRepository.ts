import { AppDataSource, DatamartDataSource } from "../data-source";
import { Reto } from "../entities/Reto";
import { CartillaRepository } from "./CartillaRepository";
import { SisParamRepository } from "./SisParamRepository";

async function leerPeriodos(): Promise<{ inicio: number; fin: number }> {
  // lee tabla de parametros del sistema para poder cambiar con facilidad desde el panel de admin
  const [inicio, fin] = await Promise.all([
    SisParamRepository.buscarPorKey("periodo_inicio"),
    SisParamRepository.buscarPorKey("periodo_final"),
  ]);
  return {
    // Con Fallbacks si los parámetros no existen en sis_params
    inicio: inicio ? Number(inicio) : 20251215,
    fin:    fin    ? Number(fin)    : 20260115,
  };
}

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

  async buscarUsuarioPorLogin(login: string): Promise<{ nombre: string } | null> {
    const rows: { nombre: string }[] = await DatamartDataSource.query(
      `SELECT TOP 1 nombre FROM [dbo].[DIM_USUARIO] WHERE login = @0`,
      [login]
    );
    return rows[0] ?? null;
  },

  async queryGoleada(idCliente: number, idBodegas: number[], inicio: number, fin: number): Promise<FacturaRow[]> {
    if (idBodegas.length === 0) return [];
    return DatamartDataSource.query(
      `SELECT c.numero_factura, c.periodo, SUM(fp.monto_total) AS monto_total
       FROM [dbo].[FACT_VENTA_CABECERA] c
       INNER JOIN [dbo].[FACT_VENTA_FORMA_PAGO] fp
         ON fp.id_venta_cab = c.id_venta_cab AND fp.periodo = c.periodo
       WHERE c.id_cliente = @0
         AND c.periodo >= ${inicio} AND c.periodo <= ${fin}
         AND c.id_bodega IN (${idBodegas.join(",")})
       GROUP BY c.id_venta_cab, c.numero_factura, c.periodo
       HAVING SUM(fp.monto_total) >= 20
       ORDER BY c.periodo DESC`,
      [idCliente]
    );
  },

  async queryEstrategica(idCliente: number, cods: string[], idBodegas: number[], inicio: number, fin: number): Promise<FacturaRow[]> {
    if (cods.length === 0 || idBodegas.length === 0) return [];
    return DatamartDataSource.query(
      `SELECT c.numero_factura, c.periodo, SUM(fp.monto_total) AS monto_total
       FROM [dbo].[FACT_VENTA_CABECERA] c
       INNER JOIN [dbo].[FACT_VENTA_FORMA_PAGO] fp
         ON fp.id_venta_cab = c.id_venta_cab AND fp.periodo = c.periodo
       WHERE c.id_cliente = @0
         AND c.periodo >= ${inicio} AND c.periodo <= ${fin}
         AND c.id_bodega IN (${idBodegas.join(",")})
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

  async queryFoco(idCliente: number, cods: string[], idBodegas: number[], inicio: number, fin: number): Promise<FacturaRow[]> {
    if (cods.length === 0 || idBodegas.length === 0) return [];
    return DatamartDataSource.query(
      `SELECT c.numero_factura, c.periodo, SUM(fp.monto_total) AS monto_total
       FROM [dbo].[FACT_VENTA_CABECERA] c
       INNER JOIN [dbo].[FACT_VENTA_FORMA_PAGO] fp
         ON fp.id_venta_cab = c.id_venta_cab AND fp.periodo = c.periodo
       WHERE c.id_cliente = @0
         AND c.periodo >= ${inicio} AND c.periodo <= ${fin}
         AND c.id_bodega IN (${idBodegas.join(",")})
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
    const { inicio, fin } = await leerPeriodos();
    return DatamartDataSource.query(
      `SELECT c.numero_factura, c.periodo, SUM(fp.monto_total) AS monto_total
       FROM [dbo].[FACT_VENTA_CABECERA] c
       INNER JOIN [dbo].[FACT_VENTA_FORMA_PAGO] fp
         ON fp.id_venta_cab = c.id_venta_cab AND fp.periodo = c.periodo
       WHERE c.numero_factura = @0
         AND c.periodo >= ${inicio} AND c.periodo <= ${fin}
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

    const { inicio, fin } = await leerPeriodos();

    const [goleadaRows, estrategicaRows, focoRows, facturasUsadasRows] = await Promise.all([
      this.queryGoleada(codCliente, idBodegas, inicio, fin),
      this.queryEstrategica(codCliente, codsEstrategica, idBodegas, inicio, fin),
      this.queryFoco(codCliente, codsFoco, idBodegas, inicio, fin),
      // Facturas ya registradas en cartillas anteriores del mismo usuario
      AppDataSource.query(
        `SELECT DISTINCT r.numero_factura
         FROM retos r
         INNER JOIN cartillas c ON c.id = r.cartilla_id
         WHERE c.usuario_id = (SELECT usuario_id FROM cartillas WHERE id = @0)
           AND r.cartilla_id != @0
           AND r.numero_factura IS NOT NULL`,
        [cartillaId]
      ) as Promise<{ numero_factura: string }[]>,
    ]);

    // Borrar retos automáticos previos para recalcular con deduplicación por prioridad
    await AppDataSource.query(
      `DELETE FROM retos WHERE cartilla_id = @0 AND tipo_reto IN ('contact_center', 'lineas_estrategicas', 'productos_focos')`,
      [cartillaId]
    );

    // Deduplicar: una misma factura solo pertenece al reto de mayor prioridad
    // Prioridad: foco > lineas_estrategicas > goleada
    // y no puede reutilizarse de cartillas anteriores del mismo usuario
    const seen = new Set<string>(facturasUsadasRows.map(f => f.numero_factura));
    const toInsert: Partial<Reto>[] = [];
    const displayGoleada: FacturaRow[] = [];
    const displayEstrategica: FacturaRow[] = [];
    const displayFoco: FacturaRow[] = [];

    for (const row of focoRows) {
      if (!seen.has(row.numero_factura)) {
        seen.add(row.numero_factura);
        toInsert.push({ cartilla_id: cartillaId, tipo_reto: "productos_focos", monto: row.monto_total, numero_factura: row.numero_factura, estado: "registrado", tickets: Math.floor(row.monto_total / 20) });
        displayFoco.push(row);
      }
    }
    for (const row of estrategicaRows) {
      if (!seen.has(row.numero_factura)) {
        seen.add(row.numero_factura);
        toInsert.push({ cartilla_id: cartillaId, tipo_reto: "lineas_estrategicas", monto: row.monto_total, numero_factura: row.numero_factura, estado: "registrado", tickets: Math.floor(row.monto_total / 20) });
        displayEstrategica.push(row);
      }
    }
    for (const row of goleadaRows) {
      if (!seen.has(row.numero_factura)) {
        seen.add(row.numero_factura);
        toInsert.push({ cartilla_id: cartillaId, tipo_reto: "contact_center", monto: row.monto_total, numero_factura: row.numero_factura, estado: "registrado", tickets: Math.floor(row.monto_total / 20) });
        displayGoleada.push(row);
      }
    }

    if (toInsert.length > 0) {
      await AppDataSource.getRepository(Reto).insert(toInsert);
    }

    // Sumar tickets de todos los retos de esta cartilla (incluyendo referidos)
    const countResult = await AppDataSource.query(
      `SELECT SUM(ISNULL(tickets, 1)) AS total FROM retos WHERE cartilla_id = @0`,
      [cartillaId]
    ) as [{ total: number }];
    const totalPuntos = Math.min(Number(countResult[0]!.total), 10);

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
