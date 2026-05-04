import { Router, type Request, type Response } from "express";
import { UsuarioRepository } from "../repositories/UsuarioRepository";

export const routerAdmin = Router();

routerAdmin.get("/usuarios", async (req: Request, res: Response) => {
  const pagina = Math.max(1, parseInt((req.query.pagina as string) ?? "1") || 1);
  const limite = 5;
  const busqueda = (req.query.busqueda as string) || undefined;

  try {
    const { datos, total } = await UsuarioRepository.listarUsuarios({ pagina, limite, busqueda });
    res.json({
      datos: datos.map((u) => ({
        id: u.id,
        cedula: u.cedula,
        nombre: u.nombre,
        apellido: u.apellido ?? "",
        telefono: u.telefono ?? "",
        rol: u.rol,
      })),
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
