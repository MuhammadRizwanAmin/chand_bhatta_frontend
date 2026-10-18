import api from '../api';

export const salesService = {
  async getAll(params?: { startDate?: string; endDate?: string; status?: string }) {
    const { data } = await api.get('/sales', { params });
    return data;
  },

  async getBanks() {
    const { data } = await api.get('/banks');
    return data?.data || data || [];
  },

  async deleteSale(id: number) {
    const { data } = await api.delete(`/sales/${id}`);
    return data;
  },

  async addPayment(saleId: number, payload: any) {
    const { data } = await api.post(`/sales/${saleId}/payment`, payload);
    return data;
  },

  async editPayment(saleId: number, paymentId: number, payload: any) {
    const { data } = await api.put(`/sales/${saleId}/payment/${paymentId}`, payload);
    return data;
  },

  async deletePayment(saleId: number, paymentId: number) {
    const { data } = await api.delete(`/sales/${saleId}/payment/${paymentId}`);
    return data;
  },

  async returnItems(payload: any) {
    const { data } = await api.post(`/sales/return`, payload);
    return data;
  }
};