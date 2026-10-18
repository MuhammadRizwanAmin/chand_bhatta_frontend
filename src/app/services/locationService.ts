import api from './api';

export interface Location {
  id: number;
  name: string;
  address?: string;
  contactPhone?: string;
  contactEmail?: string;
  prefix?: string;
  status?: boolean;
  logo?: string;
}

export const locationService = {
  getAll: async (): Promise<Location[]> => {
    const res = await api.get('/locations');
    return res.data;
  },

  create: async (data: Partial<Location>): Promise<Location> => {
    const res = await api.post('/locations', data);
    return res.data.location;
  },

  update: async (id: number, data: Partial<Location>): Promise<Location> => {
    const res = await api.put(`/locations/${id}`, data);
    return res.data.location;
  },

  uploadLogo: async (id: number, file: File): Promise<{ logo: string, location: Location }> => {
    const formData = new FormData();
    formData.append('logo', file);
    const res = await api.post(`/locations/${id}/logo`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
    return res.data;
  },

  delete: async (id: number): Promise<void> => {
    await api.delete(`/locations/${id}`);
  },
};
