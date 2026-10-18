import api from '../api';

const getCreatedOrUpdatedItem = (data: any) => {
  return (
    data?.item ||
    data?.data ||
    data?.newItem ||
    data?.updatedItem ||
    data
  );
};

export const InventoryService = {
  getAll: async (params?: any) => {
    const response = await api.get('/items', { params });
    return response.data;
  },

  getById: async (id: number) => {
    const response = await api.get(`/items/${id}`);
    return response.data;
  },

  getTransactions: async (id: number | string) => {
    const response = await api.get(`/items/transactions/item/${id}`);
    return response.data;
  },

  create: async (payload: FormData | any) => {
    const response = await api.post('/items', payload, {
      headers:
        payload instanceof FormData
          ? { 'Content-Type': 'multipart/form-data' }
          : { 'Content-Type': 'application/json' },
    });

    return getCreatedOrUpdatedItem(response.data);
  },

  update: async (id: number, payload: FormData | any) => {
    const response = await api.put(`/items/${id}`, payload, {
      headers:
        payload instanceof FormData
          ? { 'Content-Type': 'multipart/form-data' }
          : { 'Content-Type': 'application/json' },
    });

    return getCreatedOrUpdatedItem(response.data);
  },

  delete: async (id: number) => {
    const response = await api.delete(`/items/${id}`);
    return response.data;
  },
};