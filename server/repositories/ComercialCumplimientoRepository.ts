import { AppDataSource } from "../data-source";
import { ComercialCumplimiento } from "../entities/ComercialCumplimiento";

type FilaImportar = {
  usuario: string;
  volumen: number;
  utilidad: number;
  estrategica: number;
};

export type ImportarResult = {
  insertados: number;
  actualizados: number;
};

export const ComercialCumplimientoRepository = {
  async importar(filas: FilaImportar[]): Promise<ImportarResult> {
    if (filas.length === 0) return { insertados: 0, actualizados: 0 };

    const repo = AppDataSource.getRepository(ComercialCumplimiento);
    const ahora = new Date();

    // Cargar usuarios existentes para decidir insert vs update
    const existentes = await repo.find({ select: ["id", "usuario"] });
    const mapaIds = new Map(existentes.map(e => [e.usuario.toLowerCase().trim(), e.id]));

    const toInsert: Partial<ComercialCumplimiento>[] = [];
    const toUpdate: Array<{ id: number; data: Partial<ComercialCumplimiento> }> = [];

    for (const f of filas) {
      const idExistente = mapaIds.get(f.usuario.toLowerCase().trim());
      const campos = {
        volumen: f.volumen,
        utilidad: f.utilidad,
        estrategica: f.estrategica,
        ultima_fecha_modificacion: ahora,
      };
      if (idExistente !== undefined) {
        toUpdate.push({ id: idExistente, data: campos });
      } else {
        toInsert.push({ usuario: f.usuario, tickets: 0, ...campos });
      }
    }

    // INSERT en batches (6 cols × 300 filas = 1800 params < 2100 (limite max por request))
    const BATCH = 300;
    for (let i = 0; i < toInsert.length; i += BATCH) {
      await repo.insert(toInsert.slice(i, i + BATCH));
    }

    // UPDATE individual por id 
    for (const { id, data } of toUpdate) {
      await repo.update(id, data);
    }

    return { insertados: toInsert.length, actualizados: toUpdate.length };
  },

  async buscarTodos(): Promise<ComercialCumplimiento[]> {
    return AppDataSource.getRepository(ComercialCumplimiento).find({
      order: { usuario: "ASC" },
    });
  },
};
