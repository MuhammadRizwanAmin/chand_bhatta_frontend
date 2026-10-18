import api from './api';

export interface Bed {
  id: number;
  name: string;
  createdAt?: string;
}

export const bedService = {
  getAll: async (): Promise<Bed[]> => {
    const response = await api.get('/rooms/beds');
    return response.data;
  },

  create: async (name: string): Promise<Bed> => {
    const response = await api.post('/rooms/add-bed', { name });
    return response.data.newBed;
  },

  update: async (id: number, name: string): Promise<Bed> => {
    const response = await api.put(`/rooms/edit-bed/${id}`, { name });
    return response.data.bed;
  },

  delete: async (id: number): Promise<void> => {
    await api.delete(`/rooms/delete-bed/${id}`);
  },
};
