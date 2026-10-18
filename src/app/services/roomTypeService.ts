import api from './api';

export interface RoomType {
  id: number;
  name: string;
  locationId?: number;
  createdAt?: string;
}

export const roomTypeService = {
  getAll: async (): Promise<RoomType[]> => {
    const response = await api.get('/rooms/room-types');
    return response.data;
  },

  create: async (name: string): Promise<RoomType> => {
    const response = await api.post('/rooms/add-room-type', { name });
    return response.data;
  },

  update: async (id: number, name: string): Promise<RoomType> => {
    const response = await api.put(`/rooms/edit-room-type/${id}`, { name });
    return response.data;
  },

  delete: async (id: number): Promise<void> => {
    await api.delete(`/rooms/delete-room-type/${id}`);
  },
};
