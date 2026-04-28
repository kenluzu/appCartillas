// ─── Tipos de dominio ─────────────────────────────────────────────────────────

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

// ─── Datos de demostración ────────────────────────────────────────────────────

const FARMACIAS: Farmacia[] = [
  { id: 1, nombre: "El Paraiso",   direccion: "Av. Amazonas N24-33 y Colón", latitud: -2.1397603, longitud: -79.8798885, cantidad: 5 },
  { id: 2, nombre: "El Batán",   direccion: "Av. 6 de Diciembre N36-109", latitud: -2.15535337, longitud: -79.8658869, cantidad: 3 },
  { id: 3, nombre: "DUran El Recreo",        direccion: "Av. Naciones Unidas y Amazonas", latitud: -2.16953526, longitud: -79.851385, cantidad: 0 },
  { id: 4, nombre: "Farmacorp Entrada de la 8", direccion: "Av. Diego de Vásquez y Machala",  latitud: -0.1051, longitud: -78.4942, cantidad: 8 },
  { id: 5, nombre: "Farmacorp La Carolina",direccion: "Av. Eloy Alfaro N32-650 y Portugal",  latitud: -0.1618, longitud: -78.4823, cantidad: 2 },
];

// ─── Store en memoria (persiste durante la sesión) ────────────────────────────

type StoredUsuario = Usuario & { password?: string };
type StoredCartilla = Cartilla & { usuario_id: number };
type StoredRetiro  = Retiro   & { cartilla_id: number };

let _nextId = 100;
const nextId = () => ++_nextId;

const usuarios = new Map<string, StoredUsuario>([
  ["1234567890", { id: 1, cedula: "1234567890", nombre: "Juan Carlos",  apellido: "Pérez López",    telefono: "0991234567", rol: "usuario" }],
  ["0987654321", { id: 2, cedula: "0987654321", nombre: "María Elena",  apellido: "García Torres",  telefono: "0987654321", rol: "usuario" }],
  ["1122334455", { id: 3, cedula: "1122334455", nombre: "Carlos",       apellido: "Rodríguez Vega", telefono: "0995551234", rol: "usuario" }],
  ["admin",      { id: 99, cedula: "admin",     nombre: "Administrador",apellido: "Sistema",        telefono: "0000000000", rol: "admin", password: "123" }],
]);

const cartillas = new Map<number, StoredCartilla>([
  [1, { id: 1, usuario_id: 1, puntos: 12, estado: "activa",    fecha_inicio: "2026-01-15" }],
  [2, { id: 2, usuario_id: 2, puntos: 20, estado: "completa",  fecha_inicio: "2026-02-01" }],
  [3, { id: 3, usuario_id: 3, puntos:  8, estado: "activa",    fecha_inicio: "2026-03-10" }],
]);

const retiros = new Map<number, StoredRetiro>();

function cartillaDe(usuarioId: number): StoredCartilla | undefined {
  return [...cartillas.values()]
    .filter(c => c.usuario_id === usuarioId && c.estado !== "cerrada")
    .sort((a, b) => b.id - a.id)[0];
}

function retiroDe(cartillaId: number): StoredRetiro | undefined {
  return [...retiros.values()].find(r => r.cartilla_id === cartillaId && r.estado === "planificado");
}

function farmaciaById(id: number): Farmacia {
  const f = FARMACIAS.find(f => f.id === id);
  if (!f) throw new Error("Farmacia no encontrada");
  return f;
}

// ─── Implementación mock del API ──────────────────────────────────────────────

function delay(ms = 300) {
  return new Promise(r => setTimeout(r, ms));
}

export const api = {
  async buscarUsuario(cedula: string): Promise<{
    encontrado: boolean;
    usuario?: Usuario;
    cartilla?: Cartilla;
    retiro?: Retiro | null;
  }> {
    await delay();
    const usuario = usuarios.get(cedula);
    if (!usuario || usuario.rol === "admin") return { encontrado: false };

    let cartilla = cartillaDe(usuario.id);
    if (!cartilla) {
      const id = nextId();
      cartilla = { id, usuario_id: usuario.id, puntos: 0, estado: "activa", fecha_inicio: new Date().toISOString().slice(0, 10) };
      cartillas.set(id, cartilla);
    }

    const retiro = cartilla.estado === "completa" ? retiroDe(cartilla.id) ?? null : null;
    const { usuario_id: _, ...cartillaOut } = cartilla;
    return { encontrado: true, usuario, cartilla: cartillaOut, retiro: retiro ?? null };
  },

  async registrarUsuario(data: { cedula: string; nombre: string; apellido: string; telefono: string }): Promise<{ usuario: Usuario; cartilla: Cartilla }> {
    await delay();
    if (usuarios.has(data.cedula)) throw new Error("El usuario ya existe");

    const id = nextId();
    const usuario: StoredUsuario = { id, rol: "usuario", ...data };
    usuarios.set(data.cedula, usuario);

    const cartillaId = nextId();
    const cartilla: StoredCartilla = { id: cartillaId, usuario_id: id, puntos: 0, estado: "activa", fecha_inicio: new Date().toISOString().slice(0, 10) };
    cartillas.set(cartillaId, cartilla);

    const { usuario_id: _, ...cartillaOut } = cartilla;
    return { usuario, cartilla: cartillaOut };
  },

  async getFarmacias(): Promise<Farmacia[]> {
    await delay(200);
    return [...FARMACIAS];
  },

  async crearRedencion(data: { cartilla_id: number; farmacia_id: number; fecha_retiro: string; hora_retiro: string }): Promise<Retiro> {
    await delay();
    const cartilla = cartillas.get(data.cartilla_id);
    if (!cartilla) throw new Error("Cartilla no encontrada");
    if (cartilla.estado !== "completa") throw new Error("La cartilla no está completa");
    if (retiroDe(data.cartilla_id)) throw new Error("Ya existe un retiro planificado para esta cartilla");

    const farmacia = farmaciaById(data.farmacia_id);
    if (farmacia.cantidad <= 0) throw new Error("Sin stock en esa farmacia");

    const id = nextId();
    const retiro: StoredRetiro = {
      id,
      cartilla_id: data.cartilla_id,
      farmacia_id: data.farmacia_id,
      farmacia_nombre: farmacia.nombre,
      farmacia_direccion: farmacia.direccion,
      fecha_retiro: data.fecha_retiro,
      hora_retiro: `${data.hora_retiro}:00`,
      estado: "planificado",
    };
    retiros.set(id, retiro);
    return retiro;
  },

  async modificarRedencion(id: number, data: { farmacia_id: number; fecha_retiro: string; hora_retiro: string }): Promise<Retiro> {
    await delay();
    const retiro = retiros.get(id);
    if (!retiro) throw new Error("Retiro no encontrado");
    if (retiro.estado === "entregado") throw new Error("El premio ya fue entregado, no se puede modificar");

    const farmacia = farmaciaById(data.farmacia_id);
    if (farmacia.cantidad <= 0) throw new Error("Sin stock en esa farmacia");

    const updated: StoredRetiro = {
      ...retiro,
      farmacia_id: data.farmacia_id,
      farmacia_nombre: farmacia.nombre,
      farmacia_direccion: farmacia.direccion,
      fecha_retiro: data.fecha_retiro,
      hora_retiro: `${data.hora_retiro}:00`,
    };
    retiros.set(id, updated);
    return updated;
  },

  async adminLogin(cedula: string, password: string): Promise<{ token: string; nombre: string }> {
    await delay();
    const admin = usuarios.get(cedula);
    if (!admin || admin.rol !== "admin" || admin.password !== password) {
      throw new Error("Credenciales inválidas");
    }
    return { token: "mock-admin-token", nombre: admin.nombre };
  },

  async adminEstadisticas() {
    await delay(200);
    const todos = [...cartillas.values()];
    return {
      total_usuarios:      [...usuarios.values()].filter(u => u.rol === "usuario").length,
      cartillas_activas:   todos.filter(c => c.estado === "activa").length,
      cartillas_completas: todos.filter(c => c.estado === "completa").length,
      cartillas_cerradas:  todos.filter(c => c.estado === "cerrada").length,
      premios_entregados:  [...retiros.values()].filter(r => r.estado === "entregado").length,
      retiros_pendientes:  [...retiros.values()].filter(r => r.estado === "planificado").length,
    };
  },

  async adminUsuarios(): Promise<{
    id: number; cedula: string; nombre: string; apellido: string;
    telefono: string; fecha_registro: string;
    cartilla_id?: number; puntos?: number; cartilla_estado?: string;
  }[]> {
    await delay(200);
    return [...usuarios.values()]
      .filter(u => u.rol === "usuario")
      .map(u => {
        const c = cartillaDe(u.id);
        return {
          id: u.id, cedula: u.cedula, nombre: u.nombre,
          apellido: u.apellido, telefono: u.telefono,
          fecha_registro: "2026-01-01",
          cartilla_id: c?.id,
          puntos: c?.puntos,
          cartilla_estado: c?.estado,
        };
      });
  },

  async adminRetiros(): Promise<{
    id: number; estado: string; fecha_retiro: string; hora_retiro: string;
    farmacia_nombre: string; cedula: string; usuario_nombre: string;
    usuario_apellido: string; telefono: string; puntos: number;
  }[]> {
    await delay(200);
    return [...retiros.values()].map(r => {
      const cartilla = cartillas.get(r.cartilla_id);
      const usuario  = cartilla ? [...usuarios.values()].find(u => u.id === cartilla.usuario_id) : undefined;
      return {
        id: r.id, estado: r.estado,
        fecha_retiro: r.fecha_retiro, hora_retiro: r.hora_retiro,
        farmacia_nombre: r.farmacia_nombre,
        cedula:          usuario?.cedula      ?? "",
        usuario_nombre:  usuario?.nombre      ?? "",
        usuario_apellido:usuario?.apellido    ?? "",
        telefono:        usuario?.telefono    ?? "",
        puntos:          cartilla?.puntos     ?? 0,
      };
    });
  },

  async marcarEntregado(id: number): Promise<{ ok: boolean }> {
    await delay();
    const retiro = retiros.get(id);
    if (!retiro) throw new Error("Retiro no encontrado");
    if (retiro.estado === "entregado") throw new Error("Ya está marcado como entregado");
    retiros.set(id, { ...retiro, estado: "entregado" });

    const cartilla = cartillas.get(retiro.cartilla_id);
    if (cartilla) cartillas.set(cartilla.id, { ...cartilla, estado: "cerrada" });

    const farmacia = FARMACIAS.find(f => f.id === retiro.farmacia_id);
    if (farmacia) farmacia.cantidad = Math.max(0, farmacia.cantidad - 1);

    return { ok: true };
  },

  async actualizarStock(farmaciaId: number, cantidad: number): Promise<{ ok: boolean }> {
    await delay();
    const farmacia = FARMACIAS.find(f => f.id === farmaciaId);
    if (!farmacia) throw new Error("Farmacia no encontrada");
    farmacia.cantidad = cantidad;
    return { ok: true };
  },
};

// ─── Utilidad de distancia ────────────────────────────────────────────────────

export function haversine(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}
