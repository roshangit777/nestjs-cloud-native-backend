import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
} from "typeorm";

@Entity()
export class File {
  @PrimaryGeneratedColumn("uuid")
  id: string;
  @Column()
  originalName: string;
  @Column()
  mimeType: string;
  @Column()
  size: number;
  @Column()
  url: string;
  @Column()
  publicId: string;
  @Column({ nullable: true })
  description: string;
  @Column()
  uploader: number;
  @Column({ type: "jsonb", nullable: true })
  userDetails: { id: number; name: string; email: string; role: string };
  @CreateDateColumn()
  createdAt: Date;
}
