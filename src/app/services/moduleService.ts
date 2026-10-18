import api from './api';

export interface ModuleConfig {
  reservation: boolean;
  room: boolean;
  floor: boolean;
  beds: boolean;
  staff: boolean;
  agent: boolean;
  accounts: boolean;
  pos: boolean;
  passwords: boolean;
  groups: boolean;
  customers: boolean;
  lossfound: boolean;
  inventory: boolean;
  organization: boolean;
  housekeeping: boolean;
  membership: boolean;
  transportation: boolean;
  reputation: boolean;
  hostel: boolean;
  announcement: boolean;
  kitchen: boolean;
  hrm: boolean;
  [key: string]: boolean;
}

export const moduleService = {
  async getModules(): Promise<ModuleConfig> {
    const res = await api.get('/modules');
    return res.data;
  },
  
  async updateModule(field: string, status: boolean): Promise<any> {
    const res = await api.put('/modules/update', { field, status });
    return res.data;
  }
};
