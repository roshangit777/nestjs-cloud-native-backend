import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
} from "typeorm";

@Entity("roles")
export class Roles {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true })
  roleName: string;

  @Column({ nullable: true })
  description: string;

  @CreateDateColumn()
  createdAt: Date;
}
