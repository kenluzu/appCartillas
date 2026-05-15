import { Entity, PrimaryGeneratedColumn, Column } from "typeorm";

@Entity("retiros")
export class PlanRetiro {
  @PrimaryGeneratedColumn({ type: "int" })
  id!: number;

  @Column({ type: "int" })
  cartilla_id!: number;

  @Column({ type: "date" })
  fecha_retiro!: string;

  @Column({ type: "varchar", length: 8 })
  hora_retiro!: string;

  @Column({ type: "varchar", length: 30, default: "planificado" })
  estado!: string;
}
