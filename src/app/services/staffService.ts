import api from './api';

export const staffService = {
  getStaffList: async () => {
    const { data } = await api.get('/users');
    return data;
  },

  getStaffDetails: async (id: number | string) => {
    const { data } = await api.get(`/users/single/${id}`);
    return data;
  },

  createStaff: async (formData: FormData) => {
    const { data } = await api.post('/users', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return data;
  },

  updateStaff: async (id: number | string, formData: FormData) => {
    const { data } = await api.put(`/users/update/${id}`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return data;
  },

  deleteStaff: async (id: number | string) => {
    const { data } = await api.delete(`/users/${id}`);
    return data;
  }
};
