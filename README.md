# App de cartillas Fidelización

Programa de fidelización para farmacias **Farmcorp**. Los clientes acumulan puntos en una cartilla digital de 20 espacios; al completarla, planifican el retiro de una camiseta como premio en la farmacia más cercana.

## Flujo principal

```
Ingreso (cédula)
  ├── Cliente nuevo  → Registro → Cartilla
  └── Cliente existente ────────→ Cartilla → (completa) → Planificación → Confirmación
```


## Panel admin

Permite ver estadísticas, listar usuarios y retiros, marcar premios como entregados y actualizar stock por farmacia.

> Credenciales de prueba: cédula `123` / contraseña `123`

## Stack

| Capa | Tecnología |
|------|-----------|
| Runtime & servidor | [Bun](https://bun.sh) |
| Frontend | React 19 + TypeScript |
| Estilos | TailwindCSS v4 |
| Mapa | Leaflet 1.9.4 (CDN) |
| Bundler | Bun nativo (`bun-plugin-tailwind`) |

## Cómo ejecutar

```bash
# Instalar dependencias
bun install

# Servidor de desarrollo con HMR en http://localhost:3000
bun run dev

# Build de producción
bun run build

# Servidor de producción
bun run start
```

## Notas

- `src/lib/api.ts` es la capa de datos actual con un store en memoria. Es el archivo a reemplazar cuando se integre el backend real.
