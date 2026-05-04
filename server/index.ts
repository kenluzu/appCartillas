import "reflect-metadata";
import express from "express";
import path from "path";
import { AppDataSource } from "./data-source";
import { routerUsuarios } from "./routes/usuarios";
import { routerAdmin } from "./routes/admin";

const app = express();
const PORT = process.env.PORT ? Number(process.env.PORT) : 3001;
const isProd = process.env.NODE_ENV === "production";

app.use(express.json());

app.use("/api/usuarios", routerUsuarios);
app.use("/api/admin", routerAdmin);

if (isProd) {
  const distDir = path.join(process.cwd(), "dist");
  app.use(express.static(distDir));
  app.get("*", (_req, res) => {
    res.sendFile(path.join(distDir, "index.html"));
  });
}

AppDataSource.initialize()
  .then(() => {
    console.log("Conexión a SQL Server establecida");
    app.listen(PORT, () => {
      console.log(`Servidor corriendo en http://localhost:${PORT}`);
    });
  })
  .catch((err) => {
    console.error("No se pudo conectar a SQL Server:", err);
    process.exit(1);
  });
