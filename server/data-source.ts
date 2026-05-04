import "reflect-metadata";
import { DataSource } from "typeorm";
import { Usuario } from "./entities/Usuario";
import { Cartilla } from "./entities/Cartilla";

export const AppDataSource = new DataSource({
  type: "mssql",
  host: process.env.DB_HOST ?? "localhost",
  port: Number(process.env.DB_PORT ?? 1433),
  username: process.env.DB_USER ?? "sa",
  password: process.env.DB_PASSWORD ?? "codeFather2000!",
  database: process.env.DB_NAME ?? "ponte_la10",
  entities: [Usuario, Cartilla],
  synchronize: false,
  logging: process.env.NODE_ENV !== "production",
  options: {
    encrypt: false,
    trustServerCertificate: true,
  },
});
