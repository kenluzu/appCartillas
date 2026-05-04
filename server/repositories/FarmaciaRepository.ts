import { AppDataSource } from "../data-source";
import { Farmacia } from "../entities/Farmacia";

export const FarmaciaRepository = {
  async buscarTodas(): Promise<Farmacia[]> {
    return AppDataSource.getRepository(Farmacia).find({ order: { nombre: "ASC" } });
  },

  async buscarPorId(id: number): Promise<Farmacia | null> {
    return AppDataSource.getRepository(Farmacia).findOneBy({ id });
  },
};
