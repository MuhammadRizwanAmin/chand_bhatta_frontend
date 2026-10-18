import api from './api';

export const kitchenService = {
  getOrders: async (date?: string) => {
    const dateParam = date ? `&date=${date}` : '';
    const { data } = await api.get(`/kitchen/orders?status=pending,preparing,ready,served,cancelled${dateParam}`);
    return data;
  },

  updateOrderStatus: async (orderId: number, status: string) => {
    const { data } = await api.put(`/kitchen/orders/${orderId}/status`, { status });
    return data;
  },

  updateItemStatus: async (itemId: number, status: string) => {
    const { data } = await api.put(`/kitchen/order-items/${itemId}/status`, { status });
    return data;
  },

  markKotPrinted: async (orderId: number) => {
    const { data } = await api.patch(`/kitchen/orders/${orderId}/kot-printed`);
    return data;
  }
};
