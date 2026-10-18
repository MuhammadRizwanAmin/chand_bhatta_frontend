export interface SaleItem {
  id: number;
  name?: string;
  price: number;
  quantity: number;
  totalPrice: number;
  extra?: {
    name: string;
  };
}

export interface Reservation {
  refno: string;
}

export interface KitchenOrder {
  status?: 'pending' | 'ready' | 'served' | 'cancelled';
}

export interface Sale {
  id: number;
  prefix: string;
  customerName: string;
  customerPhone?: string;

  totalAmount: number;
  taxAmount?: number;
  taxPercentage?: number;
  advancePaid: number;
  balanceAmount: number;
  refundAmount?: number;
  returnStatus?: string;

  paymentMethod: string;
  paymentStatus: string;

  reservationId?: number;

  Reservation?: Reservation;
  kitchenOrder?: KitchenOrder;

  createdAt: string;

  items?: SaleItem[];
  payments?: { id: number; method: string; amount: number; bankId?: number; transactionId?: string; note?: string; date?: string; }[];
}

export interface Bank {
  id: number;
  bankName: string;
  accountTitle: string;
}