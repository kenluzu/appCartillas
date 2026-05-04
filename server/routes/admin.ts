import { Router, type Request, type Response } from "express";
import { UsuarioRepository } from "../repositories/UsuarioRepository";
import { CartillaRepository } from "../repositories/CartillaRepository";

export const routerAdmin = Router();

routerAdmin.get("/usuarios", async (req: Request, res: Response) => {
  const pagina = Math.max(1, parseInt((req.query.pagina as string) ?? "1") || 1);
  const limite = 10;
  const busqueda = (req.query.busqueda as string) || undefined;

  try {
    const { datos, total } = await UsuarioRepository.listarUsuarios({ pagina, limite, busqueda });

    const ids = datos.map((u) => u.id);
    const cartillasMap = await CartillaRepository.buscarActivasPorUsuarios(ids);

    res.json({
      datos: datos.map((u) => {
        const cartilla = cartillasMap.get(u.id);
        return {
          id: u.id,
          cedula: u.cedula,
          nombre: u.nombre,
          apellido: u.apellido ?? "",
          telefono: u.telefono ?? "",
          rol: u.rol,
          puntos: cartilla?.puntos ?? null,
          cartilla_estado: cartilla?.estado ?? null,
        };
      }),
      total,
      pagina,
      limite,
      totalPaginas: Math.max(1, Math.ceil(total / limite)),
    });
  } catch (err) {
    console.error("[listarUsuarios] Error de BD:", err);
    res.status(500).json({ error: "Error al obtener usuarios" });
  }
});
