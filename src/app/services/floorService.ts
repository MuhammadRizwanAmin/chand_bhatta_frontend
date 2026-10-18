import api from './api';

export interface FloorData {
  name: string;
  roomNames: string;
  numberOfRooms?: number;
}

export const floorService = {
  createFloor: async (data: FloorData) => {
    const response = await api.post('/floors/add-floor', data);
    return response.data;
  },

  getFloors: async () => {
    const response = await api.get('/floors');
    return response.data;
  },

  updateFloor: async (id: number, data: FloorData) => {
    const response = await api.put(`/floors/update/${id}`, data);
    return response.data;
  },

  deleteFloor: async (id: number) => {
    const response = await api.delete(`/floors/delete/${id}`);
    return response.data;
  },
};
