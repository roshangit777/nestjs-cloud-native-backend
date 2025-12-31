import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from "typeorm";

@Entity()
export class Subscription {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column()
  userId: number;

  @Column()
  name: string;

  @Column()
  email: string;

  @Column()
  orderId: string;

  @Column()
  price: number;

  @Column()
  currency: string;

  @Column()
  receipt: string;

  @Column()
  status: string;

  @Column({ default: false })
  paid: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updateAt: Date;

  @OneToMany(() => SubscriptionPayment, (payment) => payment.order)
  payments: SubscriptionPayment[];
}

@Entity()
export class SubscriptionPayment {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  /** Reference to our internal order record */
  @ManyToOne(() => Subscription, (order) => order.payments, {
    onDelete: "CASCADE",
  })
  @JoinColumn({ name: "orderId" }) // sets FK column name
  order: Subscription;

  // actual FK column
  @Column("uuid")
  orderId: string;

  /** Razorpay returned fields */
  @Column({ nullable: true })
  razorpayPaymentId: string; // example: pay_Lg83hJ...

  @Column({ nullable: true })
  razorpay_Confirmation_PaymentId: string; // example: pay_Lg83hJ...

  @Column({ nullable: true })
  razorpayOrderId: string; // example: order_Lf93hF...

  @Column({ nullable: true })
  status: string; // created, captured, failed, refunded

  @Column({ nullable: true })
  method: string; // card, upi, wallet...

  @Column({ type: "decimal", nullable: true })
  amount: number;

  @Column({ nullable: true })
  currency: string;

  /** Useful extracted structured fields */
  @Column({ type: "json", nullable: true })
  customer: any; // name/email/contact only if needed

  /** Full Razorpay Response for future validation/debugging */
  @Column({ type: "json", nullable: true })
  rawPaymentResponse: any;

  @Column({ type: "json", nullable: true })
  rawPaymentSuccessResponse: any;

  /** Timestamps */
  @UpdateDateColumn()
  paidAt: Date;

  @Column({ type: "json", nullable: true })
  transactionDetails: any;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
