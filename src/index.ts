import { serve } from "bun";
import index from "./index.html";
import { AppDataSource } from "../server/data-source";
import { handleValidarCedula } from "../server/routes/usuarios";

AppDataSource.initialize()
  .then(() => console.log("Conexión a SQL Server establecida"))
  .catch((err) => console.error("No se pudo conectar a SQL Server:", err));

const server = serve({
  routes: {
    "/api/usuarios/validar": handleValidarCedula,
    "/*": index,
  },
  development: process.env.NODE_ENV !== "production" && { hmr: true, console: true },
});

console.log(`Servidor corriendo en ${server.url}`);
