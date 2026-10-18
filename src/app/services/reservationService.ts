import api from './api';

export const reservationService = {
  create: async (data: any, files?: any) => {
    const formData = new FormData();
    
    // Append standard fields
    Object.keys(data).forEach(key => {
      if (data[key] !== undefined && data[key] !== null) {
        if (typeof data[key] === 'object' && !(data[key] instanceof File)) {
          formData.append(key, JSON.stringify(data[key]));
        } else {
          formData.append(key, data[key]);
        }
      }
    });

    // Append files if any
    if (files) {
      if (files.proofImage) formData.append('proofImage', files.proofImage);
      if (files.cnicFront) formData.append('cnicFront', files.cnicFront);
      if (files.cnicBack) formData.append('cnicBack', files.cnicBack);
      if (files.document) formData.append('document', files.document);
    }

    const response = await api.post('/reservation/create', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  getAll: async (params?: any) => {
    const response = await api.get('/reservation', { params });
    return response.data;
  },


  deleteReservation: async (id?: any) => {
    const response = await api.delete(`/reservation/${id}`);
    return response.data;
  },

  updateStatus: async (id: string | number, status: string, refund?: { amount: number; method: string; bankId?: string; note?: string }) => {
    const payload: any = { status };
    if (refund) payload.refundDetails = refund;
    const response = await api.put(`/reservation/status/${id}`, payload);
    return response.data;
  },

  checkout: async (id: string | number, payload: {
    status: string;
    checkoutPerson?: string | null;
    endDate?: string | null;
    endTime?: string | null;
    markDirty?: boolean;
    hkStaffId?: string | null;
    hkEndJob?: string | null;
    hkNotes?: string | null;
    refundDetails?: {
      amount: number;
      method: string;
      bankId?: string;
      note?: string;
    } | null;
  }) => {
    const response = await api.post(`/reservation/checkout/${id}`, payload);
    return response.data;
  },
  extendReservation: async (id: number, payload: any) => {
  const response = await api.put(`/reservation/extend/${id}`, payload);
  return response.data;
},

  overduestatus: async () => {
  const response = await api.patch(`/reservation/update/statuses`)
  return response.data;
},

  applyHalfDay: async (id: string | number, payload: { halfDayAmount: number; chargeName?: string; checkoutTime?: string }) => {
    const response = await api.post(`/reservation/half-day/${id}`, payload);
    return response.data;
  },

  applyEarlyCheckout: async (id: string | number, payload: {
    earlyCheckoutDate?: string;
    actualDays?: number;
    adjustedStayAmount?: number;
    refundAmount?: number;
    refundMethod?: string;
    bankId?: string | number;
    note?: string;
    markDirty?: boolean;
    hkStaffId?: string | number;
  }) => {
    const response = await api.post(`/reservation/early-checkout/${id}`, payload);
    return response.data;
  },

  changeRoom: async (id: string | number, payload: {
    previousRoomId: number | string;
    newRoomId: number | string;
    markDirty?: boolean;
    note?: string;
  }) => {
    const response = await api.post(`/reservation/change-room/${id}`, payload);
    return response.data;
  },
};
