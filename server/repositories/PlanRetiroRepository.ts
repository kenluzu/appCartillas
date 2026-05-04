import { AppDataSource } from "../data-source";
import { PlanRetiro } from "../entities/PlanRetiro";

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
