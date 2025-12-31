export interface CustomerDetails {
  userId: number;
  name: string;
  email: string;
  contact: string;
}

export interface SubscriptionData {
  amount: number;
  currency: string;
  orderId: string;
  customer: CustomerDetails;
}

export interface SubscriptionPayment {
  amount: number;
  currency: string;
  customer: CustomerDetails;
}

export interface SubscriptionOrderResponse {
  amount: number;
  currency: string;
  id: string;
  receipt: string;
  status: string;
  orderId: string;
}
