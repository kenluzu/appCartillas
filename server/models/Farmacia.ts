import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  OneToMany,
} from "typeorm";
import type { Relation } from "typeorm";
import { Retiro } from "./Retiro.ts";

@Entity("farmacias")
export class Farmacia {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ type: "varchar", length: 150 })
  nombre!: string;

  @Column({ type: "varchar", length: 255 })
  direccion!: string;

  @Column({ type: "float" })
  latitud!: number;

  @Column({ type: "float" })
  longitud!: number;

  @Column({ type: "int", default: 0 })
  cantidad!: number;

  @OneToMany(() => Retiro, (retiro) => retiro.farmacia)
  retiros!: Relation<Retiro[]>;
}
