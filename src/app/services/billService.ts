import api from './api';

export const billService = {
  getBills: async () => {
    const res = await api.get('/bills');
    return res.data;
  },

  getBillById: async (id: number | string) => {
    const res = await api.get(`/bills/${id}`);
    return res.data;
  },

  deleteBill: async (id: number) => {
    const res = await api.delete(`/bills/${id}`);
    return res.data;
  },

  addPayment: async (payload: any) => {
    const res = await api.post('/purchasepayment', payload);
    return res.data;
  },

  getBanks: async () => {
    const res = await api.get('/banks');
    return res.data;
  },

  returnItems: async (payload: {
    billId: number;
    returnItems: { billItemId: number; returnQty: number }[];
    refundMethod?: string;
    bankId?: number;
  }) => {
    const res = await api.post('/bills/return', payload);
    return res.data;
  },
};
