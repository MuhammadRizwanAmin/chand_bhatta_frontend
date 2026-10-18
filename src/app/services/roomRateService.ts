import api from './api';
import { RoomType } from './roomTypeService';
import { Bed } from './bedService';

export interface RoomRate {
  id: number;
  roomTypeId: number;
  bedTypeId: number;
  capacity: string;
  extraCapability: string;
  rate: string;
  webRate: string;
  discount: number;
  bedCharge: string;
  personCharge: string;
  roomSize: string;
  roomSizeOption: string;
  bedNo: string;
  description?: string;
  locationId?: number;
  RoomType?: RoomType;
  bedType?: Bed;
}

export interface RoomRatePayload {
  roomTypeId: number;
  bedTypeId: number;
  capacity: string;
  extraCapability: string;
  rate: string;
  webRate: string;
  discount: number;
  bedCharge: string;
  personCharge: string;
  roomSize: string;
  roomSizeOption: string;
  bedNo: string;
  description?: string;
}

export const roomRateService = {
  getAll: async (): Promise<RoomRate[]> => {
    const response = await api.get('/rooms/get-rooms');
    return response.data;
  },

  create: async (data: RoomRatePayload): Promise<RoomRate> => {
    const response = await api.post('/rooms/add-room', data);
    return response.data;
  },

  update: async (id: number, data: Partial<RoomRatePayload>): Promise<RoomRate> => {
    const response = await api.put(`/rooms/update-room/${id}`, data);
    return response.data;
  },

  delete: async (id: number): Promise<void> => {
    await api.delete(`/rooms/delete-room/${id}`);
  },
};
