import "reflect-metadata";
import { hashSync, genSaltSync } from "bcrypt-ts";
import { AppDataSource } from "../server/data-source";
import { Usuario } from "../server/entities/Usuario";

const CEDULA   = process.argv[2];
const PASSWORD = process.argv[3];
const NOMBRE   = process.argv[4] ?? "Administrador";

if (!CEDULA || !PASSWORD) {
  console.error("Uso: npx tsx scripts/crearAdmin.ts <cedula> <password> [nombre]");
  process.exit(1);
}

await AppDataSource.initialize();

const repo = AppDataSource.getRepository(Usuario);

const existente = await repo.findOne({ where: { cedula: CEDULA } });
if (existente) {
  const hash = hashSync(PASSWORD, genSaltSync(12));
  await repo.update(existente.id, { rol: "ADMIN", password: hash });
  console.log(`✓ Usuario ${CEDULA} actualizado a ADMIN con nueva contraseña.`);
} else {
  const hash = hashSync(PASSWORD, genSaltSync(12));
  await repo.save(repo.create({
    cedula:   CEDULA,
    nombre:   NOMBRE,
    apellido: "",
    telefono: "",
    rol:      "ADMIN",
    password: hash,
  }));
  console.log(`✓ Admin ${CEDULA} creado correctamente.`);
}

await AppDataSource.destroy();
