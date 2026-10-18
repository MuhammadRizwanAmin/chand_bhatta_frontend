import api from './api';

export const housekeepingService = {
  getAssignedRooms: async () => {
    const { data } = await api.get('/assignRoom/assigned-rooms-with-type');
    return data;
  },

  getAssignments: async () => {
    const { data } = await api.get('/housekeeping/assignments');
    return data;
  },

  getStaff: async () => {
    const { data } = await api.get('/housekeeping/staff');
    return data;
  },

  getFloors: async () => {
    const { data } = await api.get('/floors');
    return data;
  },

  getHousekeepingRooms: async () => {
    const { data } = await api.get('/housekeeping/dirty-rooms');
    return data;
  },

  markRoomDirty: async (id: number, payload: { notes?: string; endJob?: string; staffId?: string | number }) => {
    const { data } = await api.put(`/assignRoom/room/dirty/${id}`, payload);
    return data;
  },

  markRoomMaintenance: async (id: number, payload: { notes?: string; endJob?: string; staffId?: string | number }) => {
    const { data } = await api.put(`/assignRoom/room/maintenance/${id}`, payload);
    return data;
  },

  updateAssignmentStatus: async (id: number, status: string) => {
    const { data } = await api.put(`/housekeeping/assignment/${id}`, { status });
    return data;
  },

  deleteAssignment: async (id: number) => {
    const { data } = await api.delete(`/housekeeping/assignment/${id}`);
    return data;
  }
};
