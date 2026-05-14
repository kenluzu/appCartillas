import { AppDataSource } from "../data-source";
import { Reto } from "../entities/Reto";
import { Cartilla } from "../entities/Cartilla";

const PUNTOS_COMPLETO = 10;

export const RetoRepository = {
  async registrar(data: {
    cartilla_id: number;
    tipo_reto: string;
    monto: number;
    numero_factura?: string;
    descripcion?: string;
    tickets?: number;
    cedula_referido?: string;
    celular_referido?: string;
  }): Promise<{ reto: Reto; cartilla: Cartilla }> {
    const retoRepo = AppDataSource.getRepository(Reto);
    const cartillaRepo = AppDataSource.getRepository(Cartilla);

    const cartilla = await cartillaRepo.findOneBy({ id: data.cartilla_id });
    if (!cartilla) throw new Error("Cartilla no encontrada");
    if (cartilla.estado !== "activa") throw new Error("La cartilla no está activa");

    const tickets = data.tickets ?? 1;

    const reto = retoRepo.create({
      cartilla_id: data.cartilla_id,
      tipo_reto: data.tipo_reto,
      monto: data.monto,
      numero_factura: data.numero_factura ?? null,
      descripcion: data.descripcion ?? null,
      tickets,
      cedula_referido: data.cedula_referido ?? null,
      celular_referido: data.celular_referido ?? null,
      estado: "registrado",
    });
    await retoRepo.save(reto);

    cartilla.puntos = Math.min((cartilla.puntos ?? 0) + tickets, PUNTOS_COMPLETO);
    if (cartilla.puntos >= PUNTOS_COMPLETO && cartilla.estado === "activa") {
      cartilla.estado = "completa";
    }
    await cartillaRepo.save(cartilla);

    return { reto, cartilla };
  },

  async buscarPorCartilla(cartillaId: number): Promise<Reto[]> {
    return AppDataSource.getRepository(Reto)
      .createQueryBuilder("r")
      .where("r.cartilla_id = :id", { id: cartillaId })
      .orderBy("r.fecha_registro", "DESC")
      .getMany();
  },

  async contarPorCartillas(cartillaIds: number[]): Promise<Map<number, number>> {
    if (cartillaIds.length === 0) return new Map();
    const rows = await AppDataSource.getRepository(Reto)
      .createQueryBuilder("r")
      .select("r.cartilla_id", "cartilla_id")
      .addSelect("COUNT(*)", "total")
      .where("r.cartilla_id IN (:...ids)", { ids: cartillaIds })
      .groupBy("r.cartilla_id")
      .getRawMany<{ cartilla_id: number; total: string }>();

    const map = new Map<number, number>();
    for (const row of rows) {
      map.set(Number(row.cartilla_id), Number(row.total));
    }
    return map;
  },
};
