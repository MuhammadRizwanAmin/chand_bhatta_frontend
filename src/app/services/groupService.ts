import api from './api';

export const groupService = {
  getAll: async () => {
    const response = await api.get('/groups');
    return response.data;
  },

  getById: async (id: string | number) => {
    const response = await api.get(`/groups/${id}`);
    return response.data;
  },

  create: async (data: any) => {
    const response = await api.post('/groups', data);
    return response.data;
  },

  update: async (id: string | number, data: any) => {
    const response = await api.put(`/groups/${id}`, data);
    return response.data;
  },

  delete: async (id: string | number) => {
    const response = await api.delete(`/groups/${id}`);
    return response.data;
  },

  getLedger: async (id: string | number) => {
    const response = await api.get(`/groups/group/ledger/${id}`);
    return response.data;
  },

  updateRate: async (data: { groupId: number; roomTypeId: number; rate: number }) => {
    const response = await api.put('/groups/rate/rate', data);
    return response.data;
  },

  payOpeningBalance: async (id: string | number, payload: any) => {
    const response = await api.post(`/groups/${id}/pay-opening-balance`, payload);
    return response.data;
  },

  deleteGroupPayment: async (paymentId: string | number) => {
    const response = await api.delete(`/groups/payment/${paymentId}`);
    return response.data;
  }
};
