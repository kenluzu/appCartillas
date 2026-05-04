import { Router, type Request, type Response } from "express";
import jwt from "jsonwebtoken";
import { compareSync } from "bcrypt-ts";
import { UsuarioRepository } from "../repositories/UsuarioRepository";
import { CartillaRepository } from "../repositories/CartillaRepository";
import { authMiddleware, JWT_SECRET } from "../middleware/authMiddleware";
import { AppDataSource } from "../data-source";
import { Usuario } from "../entities/Usuario";
import { Cartilla } from "../entities/Cartilla";

export const routerAdmin = Router();

// ── Ruta pública: login ────────────────────────────────────────────────────────
routerAdmin.post("/login", async (req: Request, res: Response) => {
  const { cedula, password } = req.body ?? {};

  if (!cedula?.trim() || !password) {
    res.status(400).json({ error: "Credenciales requeridas" });
    return;
  }

  try {
    const admin = await UsuarioRepository.buscarAdminPorCedula(cedula.trim());

    if (!admin || !admin.password) {
      res.status(401).json({ error: "Credenciales inválidas" });
      return;
    }
    const passwordValida = compareSync(password, admin.password);
    if (!passwordValida) {
      res.status(401).json({ error: "Credenciales inválidas" });
      return;
    }

    const nombre = `${admin.nombre}${admin.apellido ? " " + admin.apellido : ""}`;
    const token = jwt.sign(
      { cedula: admin.cedula, nombre, rol: "ADMIN" },
      JWT_SECRET,
      { expiresIn: "8h" }
    );

    res.json({ token, nombre });
  } catch (err) {
    console.error("[admin/login] Error:", err);
    res.status(500).json({ error: "Error de servidor" });
  }
});

// ── Rutas protegidas ───────────────────────────────────────────────────────────
routerAdmin.use(authMiddleware);

type EstadisticasResponse = {
  total_usuarios: number;
  cartillas_activas: number;
  cartillas_completas: number;
  cartillas_cerradas: number;
  premios_entregados: number;
  retiros_pendientes: number;
};

routerAdmin.get("/estadisticas", async (_req: Request, res: Response) => {
  try {
    const usuarioRepo = AppDataSource.getRepository(Usuario);
    const cartillaRepo = AppDataSource.getRepository(Cartilla);

    const [total_usuarios, cartillas_activas, cartillas_completas, cartillas_cerradas] =
      await Promise.all([
        usuarioRepo.createQueryBuilder("u").where("u.rol != :admin", { admin: "ADMIN" }).getCount(),
        cartillaRepo.count({ where: { estado: "activa" } }),
        cartillaRepo.count({ where: { estado: "completa" } }),
        cartillaRepo.count({ where: { estado: "cerrada" } }),
      ]);

    const result: EstadisticasResponse = {
      total_usuarios,
      cartillas_activas,
      cartillas_completas,
      cartillas_cerradas,
      premios_entregados: 0, // TODO: requiere tabla retiros con estado='entregado'
      retiros_pendientes: 0, // TODO: requiere tabla retiros con estado='planificado'
    };

    res.json(result);
  } catch (err) {
    console.error("[admin/estadisticas] Error:", err);
    res.status(500).json({ error: "Error al obtener estadísticas" });
  }
});

routerAdmin.get("/usuarios", async (req: Request, res: Response) => {
  const pagina   = Math.max(1, parseInt((req.query.pagina as string) ?? "1") || 1);
  const limite   = 10;
  const busqueda = (req.query.busqueda as string) || undefined;

  try {
    const { datos, total } = await UsuarioRepository.listarUsuarios({ pagina, limite, busqueda });

    const ids         = datos.map((u) => u.id);
    const cartillasMap = await CartillaRepository.buscarActivasPorUsuarios(ids);

    res.json({
      datos: datos.map((u) => {
        const cartilla = cartillasMap.get(u.id);
        return {
          id:              u.id,
          cedula:          u.cedula,
          nombre:          u.nombre,
          apellido:        u.apellido  ?? "",
          telefono:        u.telefono  ?? "",
          rol:             u.rol,
          puntos:          cartilla?.puntos      ?? null,
          cartilla_estado: cartilla?.estado      ?? null,
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
