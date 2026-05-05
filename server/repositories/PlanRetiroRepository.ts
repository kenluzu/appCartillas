import { AppDataSource } from "../data-source";
import { PlanRetiro } from "../entities/PlanRetiro";
import { Cartilla } from "../entities/Cartilla";
import { Farmacia } from "../entities/Farmacia";

function horaStr(value: unknown): string {
  if (value instanceof Date) {
    const h = value.getHours().toString().padStart(2, "0");
    const m = value.getMinutes().toString().padStart(2, "0");
    const s = value.getSeconds().toString().padStart(2, "0");
    return `${h}:${m}:${s}`;
  }
  return String(value ?? "");
}

export const PlanRetiroRepository = {
  async buscarPorCartilla(cartillaId: number): Promise<PlanRetiro | null> {
    return AppDataSource.getRepository(PlanRetiro)
      .createQueryBuilder("p")
      .where("p.cartilla_id = :id", { id: cartillaId })
      .andWhere("p.estado != :cancelado", { cancelado: "cancelado" })
      .orderBy("p.id", "DESC")
      .getOne();
  },

  async crear(data: {
    cartilla_id: number;
    farmacia_id: number;
    fecha_retiro: string;
    hora_retiro: string;
  }): Promise<PlanRetiro> {
    const repo = AppDataSource.getRepository(PlanRetiro);
    const plan = repo.create({ ...data, estado: "planificado" });
    return repo.save(plan);
  },

  async listarParaAdmin(): Promise<{
    id: number; estado: string; fecha_retiro: string; hora_retiro: string;
    farmacia_nombre: string; cedula: string; usuario_nombre: string;
    usuario_apellido: string; telefono: string; puntos: number;
  }[]> {
    const rows: Record<string, unknown>[] = await AppDataSource.query(`
      SELECT
        r.id,
        r.estado,
        CONVERT(varchar(10), r.fecha_retiro, 23) AS fecha_retiro,
        r.hora_retiro,
        f.nombre   AS farmacia_nombre,
        u.cedula,
        u.nombre   AS usuario_nombre,
        u.apellido AS usuario_apellido,
        u.telefono,
        c.puntos
      FROM retiros   r
      INNER JOIN cartillas c ON c.id = r.cartilla_id
      INNER JOIN usuarios  u ON u.id = c.usuario_id
      INNER JOIN farmacias f ON f.id = r.farmacia_id
      WHERE r.estado != 'cancelado'
      ORDER BY r.id DESC
    `);

    return rows.map((row) => ({
      id:               Number(row.id),
      estado:           String(row.estado),
      fecha_retiro:     String(row.fecha_retiro ?? ""),
      hora_retiro:      horaStr(row.hora_retiro),
      farmacia_nombre:  String(row.farmacia_nombre ?? ""),
      cedula:           String(row.cedula ?? ""),
      usuario_nombre:   String(row.usuario_nombre ?? ""),
      usuario_apellido: String(row.usuario_apellido ?? ""),
      telefono:         String(row.telefono ?? ""),
      puntos:           Number(row.puntos ?? 0),
    }));
  },

  async marcarEntregado(id: number): Promise<{ ok: boolean; error?: string }> {
    const repo = AppDataSource.getRepository(PlanRetiro);
    const retiro = await repo.findOneBy({ id });

    if (!retiro)                         return { ok: false, error: "Retiro no encontrado" };
    if (retiro.estado !== "planificado") return { ok: false, error: "El retiro ya fue procesado" };

    await repo.update(id, { estado: "entregado" });
    await AppDataSource.getRepository(Cartilla).update(retiro.cartilla_id, { estado: "cerrada" });
    await AppDataSource.getRepository(Farmacia)
      .createQueryBuilder()
      .update()
      .set({ cantidad: () => "CASE WHEN cantidad > 0 THEN cantidad - 1 ELSE 0 END" })
      .where("id = :id", { id: retiro.farmacia_id })
      .execute();

    return { ok: true };
  },

  async revertirEntrega(id: number): Promise<{ ok: boolean; error?: string }> {
    const repo = AppDataSource.getRepository(PlanRetiro);
    const retiro = await repo.findOneBy({ id });

    if (!retiro)                        return { ok: false, error: "Retiro no encontrado" };
    if (retiro.estado !== "entregado")  return { ok: false, error: "El retiro no está en estado entregado" };

    await repo.update(id, { estado: "planificado" });
    await AppDataSource.getRepository(Cartilla).update(retiro.cartilla_id, { estado: "completa" });
    await AppDataSource.getRepository(Farmacia)
      .createQueryBuilder()
      .update()
      .set({ cantidad: () => "cantidad + 1" })
      .where("id = :id", { id: retiro.farmacia_id })
      .execute();

    return { ok: true };
  },

  async actualizar(
    id: number,
    data: {
      farmacia_id: number;
      fecha_retiro: string;
      hora_retiro: string;
    }
  ): Promise<PlanRetiro | null> {
    const repo = AppDataSource.getRepository(PlanRetiro);
    await repo.update(id, data);
    return repo.findOneBy({ id });
  },
};
