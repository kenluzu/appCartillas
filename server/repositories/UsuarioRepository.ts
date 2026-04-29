import { AppDataSource } from "../data-source";
import { Usuario } from "../entities/Usuario";

export const UsuarioRepository = {
  async buscarPorCedula(cedula: string): Promise<Usuario | null> {
    return AppDataSource.getRepository(Usuario).findOne({ where: { cedula } });
  },
};
