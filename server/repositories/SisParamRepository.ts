import { AppDataSource } from "../data-source";
import { SisParam } from "../entities/SisParam";

export const SisParamRepository = {
  async listar(): Promise<SisParam[]> {
    return AppDataSource.getRepository(SisParam).find({ order: { key: "ASC" } });
  },

  async buscarPorKey(key: string): Promise<string | null> {
    const param = await AppDataSource.getRepository(SisParam).findOneBy({ key });
    return param?.value ?? null;
  },

  async crear(key: string, value: string): Promise<SisParam> {
    const repo = AppDataSource.getRepository(SisParam);
    const param = repo.create({ key: key.trim(), value: value.trim() });
    return repo.save(param);
  },

  async actualizar(id: number, value: string): Promise<SisParam | null> {
    const repo = AppDataSource.getRepository(SisParam);
    await repo.update(id, { value: value.trim() });
    return repo.findOneBy({ id });
  },

  async eliminar(id: number): Promise<void> {
    await AppDataSource.getRepository(SisParam).delete(id);
  },
};
