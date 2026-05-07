import { AppDataSource } from "../data-source";
import { Cartilla } from "../entities/Cartilla";

export const CartillaRepository = {
  async buscarActivaPorUsuario(usuarioId: number): Promise<Cartilla | null> {
    return AppDataSource.getRepository(Cartilla)
      .createQueryBuilder("c")
      .where("c.usuario_id = :uid", { uid: usuarioId })
      .andWhere("c.estado != :cerrada", { cerrada: "cerrada" })
      .orderBy("c.id", "DESC")
      .getOne();
  },

  async buscarActivasPorUsuarios(usuarioIds: number[]): Promise<Map<number, Cartilla>> {
    if (usuarioIds.length === 0) return new Map();
    const cartillas = await AppDataSource.getRepository(Cartilla)
      .createQueryBuilder("c")
      .where("c.usuario_id IN (:...ids)", { ids: usuarioIds })
      .andWhere("c.estado != :cerrada", { cerrada: "cerrada" })
      .orderBy("c.id", "DESC")
      .getMany();

    const map = new Map<number, Cartilla>();
    for (const c of cartillas) {
      if (!map.has(c.usuario_id)) map.set(c.usuario_id, c);
    }
    return map;
  },

  async buscarPorId(id: number): Promise<Cartilla | null> {
    return AppDataSource.getRepository(Cartilla).findOneBy({ id });
  },

  async crearCartilla(usuarioId: number): Promise<Cartilla> {
    const repo = AppDataSource.getRepository(Cartilla);
    const cartilla = repo.create({
      usuario_id: usuarioId,
      puntos: 0,
      estado: "activa",
      fecha_inicio: new Date().toISOString().split("T")[0],
    });
    return repo.save(cartilla);
  },

  async buscarTodasPorUsuario(usuarioId: number): Promise<Cartilla[]> {
    return AppDataSource.getRepository(Cartilla)
      .createQueryBuilder("c")
      .where("c.usuario_id = :uid", { uid: usuarioId })
      .orderBy("c.id", "DESC")
      .getMany();
  },
};
