export type Usuario = {
  id: number;
  cedula: string;
  nombre: string;
  apellido: string;
  telefono: string;
  rol: string;
  cod_cliente: number | null;
};

export type Cartilla = {
  id: number;
  puntos: number;
  estado: "activa" | "completa" | "cerrada";
  fecha_inicio: string;
};

export type Retiro = {
  id: number;
  cartilla_id: number;
  fecha_retiro: string;
  hora_retiro: string;
  estado: string;
};
