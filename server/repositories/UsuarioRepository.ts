import { AppDataSource } from "../data-source";
import { Usuario } from "../entities/Usuario";

export const UsuarioRepository = {
  async buscarPorCedula(cedula: string): Promise<Usuario | null> {
    return AppDataSource.getRepository(Usuario).findOne({ where: { cedula } });
  },

  async crearUsuario(datos: {
    cedula: string;
    nombre: string;
    apellido: string;
    telefono: string;
  }): Promise<Usuario> {
    const repo = AppDataSource.getRepository(Usuario);
    const usuario = repo.create({
      cedula: datos.cedula,
      nombre: datos.nombre,
      apellido: datos.apellido,
      telefono: datos.telefono,
    });
    return repo.save(usuario);
  },

  async listarUsuarios({pagina, limite, busqueda,}: {pagina: number;limite: number;busqueda?: string;
  }): Promise<{ datos: Usuario[]; total: number }> {
    const repo = AppDataSource.getRepository(Usuario);
    const skip = (pagina - 1) * limite;

    if (busqueda?.trim()) {
      const q = `%${busqueda.trim()}%`;
      const [datos, total] = await repo
        .createQueryBuilder("u")
        .where("u.cedula LIKE :q OR u.nombre LIKE :q OR u.apellido LIKE :q", { q })
        .orderBy("u.cedula", "ASC")
        .skip(skip)
        .take(limite)
        .getManyAndCount();
      return { datos, total };
    }

    const [datos, total] = await repo.findAndCount({
      order: { cedula: "ASC" },
      skip,
      take: limite,
    });
    return { datos, total };
  },
};
