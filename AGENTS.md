# AGENTS.md

## Commands

```bash
npm run dev      # Express (3001) + Vite (3000) via concurrently
npm run build    # Vite → dist/
npm run start    # Production: Express serves dist/

npx tsx scripts/crearAdmin.ts <cedula> <password> [nombre]  # one-time admin setup
```

No linter, no tests, no formatter configured.

## Stack

- **Server:** Node.js + `tsx` (ESM, `"type": "module"` in package.json)
- **HTTP:** Express 4 — `server/index.ts`
- **Frontend:** React 19 SPA, Vite 6 (`root: "src"`)
- **CSS:** TailwindCSS v4 via `@tailwindcss/vite`
- **ORM:** TypeORM 0.3, `synchronize: false` (manual migrations only)
- **DB:** SQL Server via `mssql`/`tedious`
- **Admin auth:** JWT (8h) + `bcrypt-ts`

## Architecture

### Server routes

```
/api/usuarios/*  → server/routes/usuarios.ts   (public)
/api/admin/login → server/routes/admin.ts      (public)
/api/admin/*     → server/routes/admin.ts      (JWT + rol === "ADMIN")
```

### Frontend

- **Entry:** `src/frontend.tsx` mounts React; `src/index.html` is the Vite template.
- **Routing:** `src/App.tsx` switches on `page` field from context — no routing library.
- **State:** `src/context/AppContext.tsx` — in-memory session, resets on reload.
- **Alias:** `@/` resolves to `src/` (vite.config.ts).

### Page flow

```
ingreso → (nuevo) → registro ─┐
        → (existente) ────────┴→ cartilla → (≥20 pts) → planificacion → confirmacion

admin-login → admin-panel
```

## Gotchas

- **Leaflet** loads via CDN in `src/index.html`. Accessed as `declare const L: any` in `PlanificacionRetiro.tsx`. Do NOT install as npm package.
- **Points sync delay:** NEPTUNO/DATAMART updates points with 1-day lag. Frontend `completa` = `puntos >= 20` OR `estado === "completa"`.
- **`src/lib/api.ts`** still serves mock data for admin stats/retiros/farmacias/stock. Only the `usuarios` flow hits real Express endpoints. Replace this file when real endpoints are ready.
- **Auto cartilla creation:** If a user logs in with no cartilla in DB, one is created automatically.
- **Vite root is `src/`**, not project root. Build output goes to `../dist`.
- **DB env vars:** `DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASSWORD`, `DB_NAME`. See `.env.example`. `JWT_SECRET` and `PORT` are optional (have dev defaults).

## DB migrations

TypeORM does NOT auto-migrate. Schema changes require manual `ALTER TABLE` on SQL Server. Pending migrations (run once if not yet applied):

```sql
ALTER TABLE usuarios ADD password VARCHAR(255) NULL;

CREATE TABLE retiros (
    id           INT         IDENTITY(1,1) PRIMARY KEY,
    cartilla_id  INT         NOT NULL,
    farmacia_id  INT         NOT NULL,
    fecha_retiro DATE        NOT NULL,
    hora_retiro  VARCHAR(8)  NOT NULL,
    estado       VARCHAR(30) NOT NULL DEFAULT 'planificado'
);
```

## Entities

| Entity | Table | Notes |
|---|---|---|
| `Usuario` | `usuarios` | `password` has `select: false`; fetched explicitly only in `buscarAdminPorCedula`. `rol === "ADMIN"` for admins. |
| `Cartilla` | `cartillas` | 20-point loyalty card. States: `activa`, `completa`, `cerrada`. |
| `PlanRetiro` | `planes_retiro` | |
| `Farmacia` | `farmacias` | |
