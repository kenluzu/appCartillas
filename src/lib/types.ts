export type Usuario = {
  id: number;
  cedula: string;
  nombre: string;
  apellido: string;
  telefono: string;
  rol: string;
};

export type Cartilla = {
  id: number;
  puntos: number;
  estado: "activa" | "completa" | "cerrada";
  fecha_inicio: string;
};

export type Farmacia = {
  id: number;
  nombre: string;
  direccion: string;
  latitud: number;
  longitud: number;
  cantidad: number;
};

export type Retiro = {
  id: number;
  cartilla_id: number;
  farmacia_id: number;
  farmacia_nombre: string;
  farmacia_direccion: string;
  fecha_retiro: string;
  hora_retiro: string;
  estado: string;
};
