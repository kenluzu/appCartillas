import { Entity, PrimaryGeneratedColumn, Column } from "typeorm";

@Entity("usuarios")
export class Usuario {
  @PrimaryGeneratedColumn({ type: "int" })
  id!: number;

  @Column({ type: "varchar", length: 20, unique: true })
  cedula!: string;

  @Column({ type: "varchar", length: 100 })
  nombre!: string;

  @Column({ type: "varchar", length: 100, nullable: true })
  apellido!: string;

  @Column({ type: "varchar", length: 20, nullable: true })
  telefono!: string;

  @Column({ type: "varchar", length: 20, default: "usuario" })
  rol!: string;

  @Column({ type: "varchar", length: 255, nullable: true, select: false })
  password!: string | null;

  @Column({ type: "int", nullable: true })
  cod_cliente!: number | null;
}
