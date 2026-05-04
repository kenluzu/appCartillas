import { Entity, PrimaryGeneratedColumn, Column } from "typeorm";

@Entity("farmacias")
export class Farmacia {
  @PrimaryGeneratedColumn({ type: "int" })
  id!: number;

  @Column({ type: "varchar", length: 200 })
  nombre!: string;

  @Column({ type: "varchar", length: 300 })
  direccion!: string;

  @Column({ type: "float" })
  latitud!: number;

  @Column({ type: "float" })
  longitud!: number;

  @Column({ type: "int", default: 0 })
  cantidad!: number;
}
