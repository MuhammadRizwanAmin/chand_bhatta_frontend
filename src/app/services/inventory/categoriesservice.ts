import api from '../api';

export type CategoryStatus = 'active' | 'inactive';

export type CategoryPayload = {
  name: string;
  description?: string;
  status?: CategoryStatus;
};

const getCreatedOrUpdatedCategory = (data: any) => {
  return (
    data?.category ||
    data?.data ||
    data?.newCategory ||
    data?.updatedCategory ||
    data?.newBed ||
    data?.bed ||
    data
  );
};

export const CategoriesService = {
  getAll: async () => {
    const response = await api.get('/categories');
    return response.data;
  },

  create: async (payload: CategoryPayload | string) => {
    const body = typeof payload === 'string' ? { name: payload } : payload;

    const response = await api.post('/categories', body);
    return getCreatedOrUpdatedCategory(response.data);
  },

  update: async (id: number, payload: CategoryPayload | string) => {
    const body = typeof payload === 'string' ? { name: payload } : payload;

    const response = await api.put(`/categories/${id}`, body);
    return getCreatedOrUpdatedCategory(response.data);
  },

  delete: async (id: number) => {
    const response = await api.delete(`/categories/${id}`);
    return response.data;
  },
};
