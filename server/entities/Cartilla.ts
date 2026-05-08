import { Entity, PrimaryGeneratedColumn, Column } from "typeorm";

@Entity("cartillas")
export class Cartilla {
  @PrimaryGeneratedColumn({ type: "int" })
  id!: number;

  @Column({ type: "int" })
  usuario_id!: number;

  @Column({ type: "int", default: 0 })
  puntos!: number;

  @Column({ type: "varchar", length: 20, default: "activa" })
  estado!: "activa" | "completa" | "cerrada";

  @Column({ type: "date", nullable: true })
  fecha_inicio!: string;

  @Column({ type: "varchar", length: 500, nullable: true })
  url_imagen!: string | null;
}
