import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  OneToOne,
  ManyToOne,
  JoinColumn,
} from "typeorm";
import type { Relation } from "typeorm";
import { Cartilla } from "./Cartilla.ts";
import { Farmacia } from "./Farmacia.ts";

export type RetiroEstado = "planificado" | "entregado" | "cancelado";

@Entity("retiros")
export class Retiro {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ type: "date", name: "fecha_retiro" })
  fechaRetiro!: string;

  @Column({ type: "time", name: "hora_retiro" })
  horaRetiro!: string;

  @Column({ type: "varchar", length: 20, default: "planificado" })
  estado!: RetiroEstado;

  @OneToOne(() => Cartilla, (cartilla) => cartilla.retiro, {
    nullable: false,
    onDelete: "CASCADE",
  })
  @JoinColumn({ name: "cartilla_id" })
  cartilla!: Relation<Cartilla>;

  @ManyToOne(() => Farmacia, (farmacia) => farmacia.retiros, {
    nullable: false,
    eager: true,
  })
  @JoinColumn({ name: "farmacia_id" })
  farmacia!: Relation<Farmacia>;
}
