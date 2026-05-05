import { AppDataSource } from "../data-source";
import { Farmacia } from "../entities/Farmacia";

export const FarmaciaRepository = {
  async buscarTodas(): Promise<Farmacia[]> {
    return AppDataSource.getRepository(Farmacia).find({ order: { nombre: "ASC" } });
  },

  async buscarPorId(id: number): Promise<Farmacia | null> {
    return AppDataSource.getRepository(Farmacia).findOneBy({ id });
  },

  async crear(data: Omit<Farmacia, "id">): Promise<Farmacia> {
    const repo = AppDataSource.getRepository(Farmacia);
    return repo.save(repo.create(data));
  },

  async actualizar(id: number, data: Partial<Omit<Farmacia, "id">>): Promise<Farmacia | null> {
    const repo = AppDataSource.getRepository(Farmacia);
    await repo.update(id, data);
    return repo.findOneBy({ id });
  },

  async eliminar(id: number): Promise<boolean> {
    const result = await AppDataSource.getRepository(Farmacia).delete(id);
    return (result.affected ?? 0) > 0;
  },
};
