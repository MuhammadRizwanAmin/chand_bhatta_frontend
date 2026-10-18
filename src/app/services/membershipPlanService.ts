import api from './api';


export const membershipService = {
  getAll: async () => {
    const res = await api.get('/membership/plans');
    return res.data;
  },

  create: async (data: any)  => {
    const res = await api.post('/membership/plans', data);
    return res.data;
  },

update: async (id: string | number, data: any) => {
        const res = await api.put(`/membership/plans/${id}`, data);
    return res.data;
  },

delete: async (id: string | number) => {
        await api.delete(`/membership/plans/${id}`);
  },
};
