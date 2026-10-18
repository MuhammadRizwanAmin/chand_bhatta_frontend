import api from './api';

export interface AssignedRoomData {
  id: number;
  roomNo: string;
  floorId: number;
  roomTypeId: number;
  status: string;
  RoomType?: {
    id: number;
    name: string;
  };
}

export const assignedRoomService = {
  getAll: async (): Promise<AssignedRoomData[]> => {
    const response = await api.get('/assignRoom/assigned-rooms-with-type');
    return response.data.data;
  },

  assignRoomType: async (roomTypeId: number, assignments: { roomNo: string, floorId: number }[]) => {
    const response = await api.post('/assignRoom/assign-room-type', { roomTypeId, assignments });
    return response.data;
  },

  getAvailableRoomsByRoomType: async (roomTypeId: number, startDate: string, endDate: string) => {
    const response = await api.get(`/assignRoom/available/${roomTypeId}`, { params: { startDate, endDate } });
    return response.data.data;
  },

  getAvailableRoomsByFloor: async (floorId: number, startDate: string, endDate: string) => {
    const response = await api.get(`/assignRoom/available/floor/${floorId}`, { params: { startDate, endDate } });
    return response.data.data;
  }
};
