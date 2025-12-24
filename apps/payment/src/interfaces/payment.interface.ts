export interface PaymentCheck {
  id: string;
  name: string;
  email: string;
  number: string;
  currency: string;
  amount: string;
}

export interface CreateOrder {
  amount: number;
  currency: string;
  userId: string;
  productId: string;
  customerEmail: string;
  customerName: string;
  customerNumber: string;
}
