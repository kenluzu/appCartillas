import { serve } from "bun";
import index from "./index.html";
import { handleBuscarUsuario } from "../server/routes/usuarios.ts";

const server = serve({
  routes: {
    "/api/usuarios": handleBuscarUsuario,
    "/*": index,
  },
  development: process.env.NODE_ENV !== "production" && { hmr: true, console: true },
});

console.log(`Servidor corriendo en ${server.url}`);
