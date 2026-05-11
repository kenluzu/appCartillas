# Ponte la 10

Programa de fidelización para farmacias **FarmCorp**. Los clientes acumulan puntos en una cartilla digital de 20 espacios; al completarla, planifican el retiro de una camiseta como premio en la farmacia más cercana.

## Flujo principal

```
Ingreso (cédula)
  ├── Cliente nuevo  → Registro → Cartilla
  └── Cliente existente ────────→ Cartilla → (completa) → Planificación → Confirmación
```

## Panel admin

Permite ver estadísticas, listar usuarios y retiros, marcar premios como entregados, gestionar stock por farmacia y exportar CSV.

> Acceso: `admin-login`. Crear admins con `npx tsx scripts/crearAdmin.ts <cedula> <password> [nombre]`

## Stack

| Capa | Tecnología |
|------|-----------|
| Servidor | Node.js + Express 4 + `tsx` |
| Frontend | React 19 SPA |
| Bundler / dev | Vite 6 |
| Estilos | TailwindCSS v4 |
| ORM | TypeORM 0.3 (`synchronize: false`) |
| Base de datos | SQL Server (`mssql` / `tedious`) |
| Auth admin | JWT 8 h + `bcrypt-ts` |
| Mapa | Leaflet 1.9 (CDN) |

## Comandos

```bash
npm run dev      # Express :3001 + Vite :3000 en paralelo
npm run build    # Build de producción → dist/
npm run start    # Producción: Express sirve dist/
```

## Variables de entorno

```
DB_HOST, DB_PORT, DB_USER, DB_PASSWORD, DB_NAME
JWT_SECRET
PORT
```

## Notas

- **Puntos a día caído:** DATAMART/NEPTUNO sincroniza con 24 h de retraso; el frontend trata `puntos >= 20 OR estado === "completa"` como cartilla completa.
- **`src/lib/api.ts`** es mock para estadísticas, retiros, farmacias y stock — reemplazar al conectar endpoints reales.
- TypeORM no auto-migra; los cambios de esquema requieren `ALTER TABLE` manual en SQL Server.
