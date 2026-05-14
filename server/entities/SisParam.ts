import { Entity, PrimaryGeneratedColumn, Column } from "typeorm";

@Entity("sis_params")
export class SisParam {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ type: "varchar", length: 100, unique: true })
  key!: string;

  @Column({ type: "varchar", length: 500 })
  value!: string;
}
