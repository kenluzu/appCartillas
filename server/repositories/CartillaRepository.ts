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
};
