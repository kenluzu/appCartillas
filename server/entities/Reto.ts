import { Entity, PrimaryGeneratedColumn, Column } from "typeorm";

@Entity("retos")
export class Reto {
  @PrimaryGeneratedColumn({ type: "int" })
  id!: number;

  @Column({ type: "int" })
  cartilla_id!: number;

  @Column({ type: "varchar", length: 50 })
  tipo_reto!: string;

  @Column({ type: "decimal", precision: 10, scale: 2 })
  monto!: number;

  @Column({ type: "varchar", length: 100, nullable: true })
  numero_factura!: string | null;

  @Column({ type: "varchar", length: 500, nullable: true })
  descripcion!: string | null;

  @Column({ type: "datetime", default: () => "GETDATE()" })
  fecha_registro!: Date;

  @Column({ type: "varchar", length: 20, default: "registrado" })
  estado!: string;
}
