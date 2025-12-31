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

export interface SubscriptionOrder {
  amount: number;
  currency: string;
  userId: string;
}

export interface CustomerDetails {
  contact: number;
  email: string;
  name: string;
}

export interface SubscriptionPayment {
  amount: number;
  currency: string;
  customer: CustomerDetails;
}
