import api from './api';

export const customerService = {
  getAll: async (params?: any) => {
    const response = await api.get('/customer', { params });
    return response.data;
  },

  getById: async (id: string | number) => {
    const response = await api.get(`/customer/${id}`);
    return response.data;
  },

  create: async (data: any) => {
    const response = await api.post('/customer', data);
    return response.data;
  },

  update: async (id: string | number, data: any) => {
    const response = await api.put(`/customer/${id}`, data);
    return response.data;
  },

  delete: async (id: string | number) => {
    const response = await api.delete(`/customer/${id}`);
    return response.data;
  }
};
