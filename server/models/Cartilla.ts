import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  OneToOne,
  JoinColumn,
} from "typeorm";
import type { Relation } from "typeorm";
import { Usuario } from "./Usuario.ts";
import { Retiro } from "./Retiro.ts";

export type CartillaEstado = "activa" | "completa" | "cerrada";

@Entity("cartillas")
export class Cartilla {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ type: "int", default: 0 })
  puntos!: number;

  @Column({ type: "varchar", length: 20, default: "activa" })
  estado!: CartillaEstado;

  @Column({ type: "date", name: "fecha_inicio" })
  fechaInicio!: string;

  @ManyToOne(() => Usuario, (usuario) => usuario.cartillas, {
    nullable: false,
    onDelete: "CASCADE",
  })
  @JoinColumn({ name: "usuario_id" })
  usuario!: Relation<Usuario>;

  @OneToOne(() => Retiro, (retiro) => retiro.cartilla, { nullable: true })
  retiro!: Relation<Retiro> | null;
}
