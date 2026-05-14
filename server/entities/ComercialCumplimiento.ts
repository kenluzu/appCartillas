import { Entity, PrimaryGeneratedColumn, Column } from "typeorm";

@Entity("comercial_cumplimiento")
export class ComercialCumplimiento {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ type: "varchar", length: 100 })
  usuario!: string;

  @Column({ type: "decimal", precision: 18, scale: 2, default: 0 })
  volumen!: number;

  @Column({ type: "decimal", precision: 18, scale: 2, default: 0 })
  utilidad!: number;

  @Column({ type: "decimal", precision: 18, scale: 2, default: 0 })
  estrategica!: number;

  @Column({ type: "int", default: 0 })
  tickets!: number;

  @Column({ type: "datetime", default: () => "GETDATE()" })
  ultima_fecha_modificacion!: Date;
}
