import {
  Entity,
  PrimaryColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
} from "typeorm";

export enum VideoStatus {
  UPLOADED = "UPLOADED",
  PROCESSING = "PROCESSING",
  READY = "READY",
  FAILED = "FAILED",
  DELETING = "DELETING",
  DELETED = "DELETED",
  DELETE_FAILED = "DELETE_FAILED",
}

@Entity({ name: "videos" })
export class Video {
  /**
   * Single source of truth ID
   * Generated in API before upload
   */
  @PrimaryColumn("uuid")
  id: string;

  /**
   * Original uploaded file (S3 key)
   * Example: original/abc123.mp4
   */
  @Column({ name: "original_key" })
  originalKey: string;

  /**
   * HLS master playlist key
   * Example: hls/abc123/master.m3u8
   */
  @Column({ name: "stream_key", type: "varchar", nullable: true })
  streamKey: string | null;

  @Column({ name: "stream_url", type: "varchar", nullable: true })
  streamUrl: string | null;

  /**
   * Processing status
   */
  @Column({
    type: "enum",
    enum: VideoStatus,
    default: VideoStatus.UPLOADED,
  })
  status: VideoStatus;

  /**
   * Optional error message if processing fails
   */
  @Column({ name: "error_reason", type: "varchar", nullable: true })
  uploadErrorReason: string | null;

  @Column({ name: "error_reason", type: "varchar", nullable: true })
  deleteErrorReason: string | null;

  @Column()
  uploader: number;

  @Column({ type: "jsonb" })
  userDetails: { id: number; name: string; email: string; role: string };

  /**
   * Metadata (sent by client)
   */
  @Column({ name: "title", type: "varchar", nullable: true })
  title: string | null;

  @Column({ name: "description", type: "varchar", nullable: true })
  description: string | null;

  @Column({ name: "mime_type", type: "varchar", nullable: true })
  mimeType: string | null;

  @Column({ name: "size_bytes", type: "bigint", nullable: true })
  sizeBytes: number | null;

  /**
   * Audit fields
   */
  @CreateDateColumn({ name: "created_at" })
  createdAt: Date;

  @UpdateDateColumn({ name: "updated_at" })
  updatedAt: Date;

  @DeleteDateColumn({ nullable: true })
  deletedAt?: Date;
}
