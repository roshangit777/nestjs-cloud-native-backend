import {
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from "typeorm";
import { Users } from "./user.entity";
import { Roles } from "./roles.entity";

@Entity("user_roles")
export class UserRoleMap {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => Users, (user) => user.roles, { onDelete: "CASCADE" })
  @JoinColumn({ name: "user_id" })
  user: Users;

  @ManyToOne(() => Roles, { eager: true })
  @JoinColumn({ name: "role_id" })
  role: Roles;

  @CreateDateColumn()
  createdAt: Date;
}
