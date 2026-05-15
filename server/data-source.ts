import "reflect-metadata";
import { DataSource } from "typeorm";
import { Usuario } from "./entities/Usuario";
import { Cartilla } from "./entities/Cartilla";
import { PlanRetiro } from "./entities/PlanRetiro";
import { Reto } from "./entities/Reto";
import { ComercialCumplimiento } from "./entities/ComercialCumplimiento";
import { SisParam } from "./entities/SisParam";

import * as dotenv from "dotenv";
dotenv.config();

export const AppDataSource = new DataSource({
  type: "mssql",
  host: process.env.DB_HOST,
  domain: process.env.DB_DOMAIN,
  port: Number(process.env.DB_PORT ?? 1433),
  username: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  entities: [Usuario, Cartilla, PlanRetiro, Reto, ComercialCumplimiento, SisParam],
  synchronize: false,
  logging: process.env.NODE_ENV !== "production",
  options: {
    encrypt: false,
    trustServerCertificate: true,
  },
});

export const DatamartDataSource = new DataSource({
  type: "mssql",
  host: process.env.DB_DATAMART_HOST,
  //domain: process.env.DB_DATAMART_DOMAIN,
  port: Number(process.env.DB_DATAMART_PORT ?? 1433),
  username: process.env.DB_DATAMART_USER ,
  password: process.env.DB_DATAMART_PASSWORD,
  database: process.env.DB_DATAMART_NAME,
  entities: [],
  synchronize: false,
  logging: process.env.NODE_ENV !== "production",
  requestTimeout: 60000,
  options: {
    encrypt: false,
    trustServerCertificate: true,
  },
});
