import api from './api';

export const purchaseOrderService = {
  createPurchaseOrder: async (data: any) => {
    const res = await api.post('/purchase-orders', data);
    return res.data;
  },
  
  getPurchaseOrders: async () => {
    const res = await api.get('/purchase-orders');
    return res.data;
  },

  deletePurchaseOrder: async (id: number) => {
    const res = await api.delete(`/purchase-orders/${id}`);
    return res.data;
  },

  getPurchaseOrderById: async (id: number | string) => {
    const res = await api.get(`/purchase-orders/${id}`);
    return res.data;
  },

  updatePurchaseOrder: async (id: number | string, data: any) => {
    const res = await api.put(`/purchase-orders/${id}`, data);
    return res.data;
  },

  approvePurchaseOrder: async (id: number | string) => {
    const res = await api.put(`/purchase-orders/${id}/approve`);
    return res.data;
  },

  convertToBill: async (id: number | string) => {
    const res = await api.post(`/bills/convert/${id}`);
    return res.data;
  },
  
  getSuppliers: async () => {
    const res = await api.get('/suppliers');
    return res.data;
  },

  getInventoryItems: async () => {
    const res = await api.get('/items/filtered');
    return res.data;
  }
};
