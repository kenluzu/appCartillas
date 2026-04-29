import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  OneToMany,
} from "typeorm";
import type { Relation } from "typeorm";
import { Cartilla } from "./Cartilla.ts";

@Entity("usuarios")
export class Usuario {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ type: "varchar", length: 13, unique: true })
  cedula!: string;

  @Column({ type: "varchar", length: 100 })
  nombre!: string;

  @Column({ type: "varchar", length: 100 })
  apellido!: string;

  @Column({ type: "varchar", length: 15 })
  telefono!: string;

  @Column({ type: "varchar", length: 20, default: "CONSUMER" })
  rol!: string;

  @Column({ type: "varchar", length: 255, nullable: true })
  password!: string | null;

  @CreateDateColumn({ name: "fecha_registro" })
  fechaRegistro!: Date;

  @OneToMany(() => Cartilla, (cartilla) => cartilla.usuario)
  cartillas!: Relation<Cartilla[]>;
}
