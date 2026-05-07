import { Router, type Request, type Response } from "express";
import jwt from "jsonwebtoken";
import { compareSync } from "bcrypt-ts";
import { UsuarioRepository } from "../repositories/UsuarioRepository";
import { CartillaRepository } from "../repositories/CartillaRepository";
import { FarmaciaRepository } from "../repositories/FarmaciaRepository";
import { PlanRetiroRepository } from "../repositories/PlanRetiroRepository";
import { RetoRepository } from "../repositories/RetoRepository";
import { PlanRetiro } from "../entities/PlanRetiro";
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

    const retiroRepo = AppDataSource.getRepository(PlanRetiro);

    const [total_usuarios, cartillas_activas, cartillas_completas, cartillas_cerradas, premios_entregados, retiros_pendientes] =
      await Promise.all([
        usuarioRepo.createQueryBuilder("u").where("u.rol != :admin", { admin: "ADMIN" }).getCount(),
        cartillaRepo.count({ where: { estado: "activa" } }),
        cartillaRepo.count({ where: { estado: "completa" } }),
        cartillaRepo.count({ where: { estado: "cerrada" } }),
        retiroRepo.count({ where: { estado: "entregado" } }),
        retiroRepo.count({ where: { estado: "planificado" } }),
      ]);

    const result: EstadisticasResponse = {
      total_usuarios,
      cartillas_activas,
      cartillas_completas,
      cartillas_cerradas,
      premios_entregados,
      retiros_pendientes,
    };

    res.json(result);
  } catch (err) {
    console.error("[admin/estadisticas] Error:", err);
    res.status(500).json({ error: "Error al obtener estadísticas" });
  }
});

routerAdmin.get("/farmacias", async (_req: Request, res: Response) => {
  try {
    res.json(await FarmaciaRepository.buscarTodas());
  } catch (err) {
    console.error("[admin/farmacias] Error:", err);
    res.status(500).json({ error: "Error al obtener farmacias" });
  }
});

routerAdmin.post("/farmacias", async (req: Request, res: Response) => {
  const { nombre, direccion, latitud, longitud, cantidad } = req.body ?? {};
  if (!nombre?.trim() || !direccion?.trim() || latitud == null || longitud == null) {
    res.status(400).json({ error: "Faltan campos requeridos" });
    return;
  }
  try {
    const farmacia = await FarmaciaRepository.crear({
      nombre: nombre.trim(),
      direccion: direccion.trim(),
      latitud: Number(latitud),
      longitud: Number(longitud),
      cantidad: Number(cantidad ?? 0),
    });
    res.status(201).json(farmacia);
  } catch (err) {
    console.error("[admin/farmacias/crear] Error:", err);
    res.status(500).json({ error: "Error al crear farmacia" });
  }
});

routerAdmin.put("/farmacias/:id", async (req: Request, res: Response) => {
  const id = parseInt(req.params.id);
  if (isNaN(id)) { res.status(400).json({ error: "ID inválido" }); return; }
  const { nombre, direccion, latitud, longitud, cantidad } = req.body ?? {};
  const updates: Record<string, unknown> = {};
  if (nombre?.trim())    updates.nombre    = nombre.trim();
  if (direccion?.trim()) updates.direccion = direccion.trim();
  if (latitud  != null)  updates.latitud   = Number(latitud);
  if (longitud != null)  updates.longitud  = Number(longitud);
  if (cantidad != null)  updates.cantidad  = Number(cantidad);
  try {
    const farmacia = await FarmaciaRepository.actualizar(id, updates);
    if (!farmacia) { res.status(404).json({ error: "Farmacia no encontrada" }); return; }
    res.json(farmacia);
  } catch (err) {
    console.error("[admin/farmacias/actualizar] Error:", err);
    res.status(500).json({ error: "Error al actualizar farmacia" });
  }
});

routerAdmin.delete("/farmacias/:id", async (req: Request, res: Response) => {
  const id = parseInt(req.params.id);
  if (isNaN(id)) { res.status(400).json({ error: "ID inválido" }); return; }
  try {
    const ok = await FarmaciaRepository.eliminar(id);
    if (!ok) { res.status(404).json({ error: "Farmacia no encontrada" }); return; }
    res.json({ ok: true });
  } catch (err) {
    console.error("[admin/farmacias/eliminar] Error:", err);
    res.status(500).json({ error: "Error al eliminar farmacia" });
  }
});

routerAdmin.get("/usuarios/exportar", async (_req: Request, res: Response) => {
  try {
    const usuarios = await UsuarioRepository.exportarTodos();
    const ids = usuarios.map((u) => u.id);
    const cartillasMap = await CartillaRepository.buscarActivasPorUsuarios(ids);

    res.json(
      usuarios.map((u) => {
        const cartilla = cartillasMap.get(u.id);
        return {
          cedula:          u.cedula,
          nombre:          u.nombre,
          apellido:        u.apellido  ?? "",
          telefono:        u.telefono  ?? "",
          puntos:          cartilla?.puntos  ?? 0,
          cartilla_estado: cartilla?.estado  ?? "sin cartilla",
        };
      })
    );
  } catch (err) {
    console.error("[admin/usuarios/exportar] Error:", err);
    res.status(500).json({ error: "Error al exportar usuarios" });
  }
});

routerAdmin.get("/retiros", async (_req: Request, res: Response) => {
  try {
    res.json(await PlanRetiroRepository.listarParaAdmin());
  } catch (err) {
    console.error("[admin/retiros] Error:", err);
    res.status(500).json({ error: "Error al obtener retiros" });
  }
});

routerAdmin.put("/retiros/:id/entregar", async (req: Request, res: Response) => {
  const id = parseInt(req.params.id);
  if (isNaN(id)) { res.status(400).json({ error: "ID inválido" }); return; }
  try {
    const result = await PlanRetiroRepository.marcarEntregado(id);
    if (!result.ok) { res.status(400).json({ error: result.error }); return; }
    res.json({ ok: true });
  } catch (err) {
    console.error("[admin/retiros/entregar] Error:", err);
    res.status(500).json({ error: "Error al marcar retiro como entregado" });
  }
});

routerAdmin.put("/retiros/:id/revertir", async (req: Request, res: Response) => {
  const id = parseInt(req.params.id);
  if (isNaN(id)) { res.status(400).json({ error: "ID inválido" }); return; }
  try {
    const result = await PlanRetiroRepository.revertirEntrega(id);
    if (!result.ok) { res.status(400).json({ error: result.error }); return; }
    res.json({ ok: true });
  } catch (err) {
    console.error("[admin/retiros/revertir] Error:", err);
    res.status(500).json({ error: "Error al revertir el retiro" });
  }
});

// ── Cartillas (reemplaza la vista de retiros en el nuevo flujo) ────────────────
routerAdmin.get("/cartillas", async (req: Request, res: Response) => {
  const estado = req.query.estado as string | undefined;
  const busqueda = (req.query.busqueda as string) || undefined;
  const pagina = Math.max(1, parseInt((req.query.pagina as string) ?? "1") || 1);
  const limite = 20;

  try {
    let sql = `
      SELECT
        c.id, c.usuario_id, c.puntos, c.estado, c.fecha_inicio,
        u.cedula, u.nombre, u.apellido, u.telefono,
        (SELECT COUNT(*) FROM retos r WHERE r.cartilla_id = c.id) AS total_retos
      FROM cartillas c
      INNER JOIN usuarios u ON u.id = c.usuario_id
      WHERE u.rol != 'ADMIN'
    `;
    const params: unknown[] = [];

    if (estado && estado !== "todos") {
      sql += ` AND c.estado = @${params.length}`;
      params.push(estado);
    }
    if (busqueda?.trim()) {
      const q = `%${busqueda.trim()}%`;
      sql += ` AND (u.nombre LIKE @${params.length} OR u.cedula LIKE @${params.length + 1})`;
      params.push(q, q);
    }

    const countSql = `SELECT COUNT(*) AS total FROM (${sql}) AS sub`;
    const countResult = await AppDataSource.query(countSql, params) as Array<{ total: number }>;
    const total = Number(countResult[0]?.total ?? 0);

    sql += ` ORDER BY c.id DESC OFFSET ${(pagina - 1) * limite} ROWS FETCH NEXT ${limite} ROWS ONLY`;
    const datos = await AppDataSource.query(sql, params) as Array<Record<string, unknown>>;

    res.json({
      datos: datos.map(row => ({
        id:          Number(row["id"]),
        usuario_id:  Number(row["usuario_id"]),
        cedula:      row["cedula"],
        nombre:      row["nombre"],
        apellido:    row["apellido"] ?? "",
        telefono:    row["telefono"] ?? "",
        puntos:      Number(row["puntos"]),
        estado:      row["estado"],
        fecha_inicio: row["fecha_inicio"],
        total_retos: Number(row["total_retos"]),
      })),
      total,
      pagina,
      limite,
      totalPaginas: Math.max(1, Math.ceil(total / limite)),
    });
  } catch (err) {
    console.error("[admin/cartillas] Error:", err);
    res.status(500).json({ error: "Error al obtener cartillas" });
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
