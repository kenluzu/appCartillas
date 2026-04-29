import { Not } from "typeorm";
import { connectDatabase, AppDataSource } from "../database.ts";
import { Usuario } from "../models/Usuario.ts";
import { Cartilla } from "../models/Cartilla.ts";

export type BuscarUsuarioResult =
  | { encontrado: false }
  | {
      encontrado: true;
      usuario: {
        id: number;
        cedula: string;
        nombre: string;
        apellido: string;
        telefono: string;
        rol: string;
      };
      cartilla: {
        id: number;
        puntos: number;
        estado: string;
        fecha_inicio: string;
      };
      retiro: {
        id: number;
        cartilla_id: number;
        farmacia_id: number;
        farmacia_nombre: string;
        farmacia_direccion: string;
        fecha_retiro: string;
        hora_retiro: string;
        estado: string;
      } | null;
    };

export async function buscarUsuario(cedula: string): Promise<BuscarUsuarioResult> {
  await connectDatabase();

  const usuarioRepo = AppDataSource.getRepository(Usuario);
  const usuario = await usuarioRepo.findOne({
    where: { cedula, rol: "CONSUMER" },
  });

  if (!usuario) return { encontrado: false };

  const cartillaRepo = AppDataSource.getRepository(Cartilla);
  const cartilla = await cartillaRepo.findOne({
    where: {
      usuario: { id: usuario.id },
      estado: Not("cerrada"),
    },
    relations: { retiro: { farmacia: true } },
    order: { id: "DESC" },
  });

  if (!cartilla) return { encontrado: false };

  const retiro =
    cartilla.estado === "completa" && cartilla.retiro
      ? {
          id: cartilla.retiro.id,
          cartilla_id: cartilla.id,
          farmacia_id: cartilla.retiro.farmacia.id,
          farmacia_nombre: cartilla.retiro.farmacia.nombre,
          farmacia_direccion: cartilla.retiro.farmacia.direccion,
          fecha_retiro: cartilla.retiro.fechaRetiro,
          hora_retiro: cartilla.retiro.horaRetiro,
          estado: cartilla.retiro.estado,
        }
      : null;

  return {
    encontrado: true,
    usuario: {
      id: usuario.id,
      cedula: usuario.cedula,
      nombre: usuario.nombre,
      apellido: usuario.apellido,
      telefono: usuario.telefono,
      rol: usuario.rol,
    },
    cartilla: {
      id: cartilla.id,
      puntos: cartilla.puntos,
      estado: cartilla.estado,
      fecha_inicio: cartilla.fechaInicio,
    },
    retiro,
  };
}
