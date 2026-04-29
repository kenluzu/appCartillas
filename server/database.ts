import "reflect-metadata";
import { DataSource } from "typeorm";
import { Usuario } from "./models/Usuario.ts";
import { Cartilla } from "./models/Cartilla.ts";
import { Farmacia } from "./models/Farmacia.ts";
import { Retiro } from "./models/Retiro.ts";

export const AppDataSource = new DataSource({
  type: "mssql",
  host: process.env["DB_HOST"] ?? "localhost",
  port: Number(process.env["DB_PORT"] ?? 1433),
  username: process.env["DB_USER"],
  password: process.env["DB_PASSWORD"],
  database: process.env["DB_NAME"],
  entities: [Usuario, Cartilla, Farmacia, Retiro],
  synchronize: false,
  logging: process.env["NODE_ENV"] !== "production",
  options: {
    encrypt: process.env["DB_ENCRYPT"] === "true",
    trustServerCertificate: process.env["DB_TRUST_CERT"] !== "false",
  },
});

export async function connectDatabase(): Promise<void> {
  if (AppDataSource.isInitialized) return;
  await AppDataSource.initialize();
}
