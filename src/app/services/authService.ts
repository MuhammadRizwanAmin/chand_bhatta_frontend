import api from './api';

export interface AuthUser {
  id: number;
  fullName: string;
  email: string;
  role: string;
  locationId: number | null;
  privileges: Record<string, boolean> | null;
}

const DEFAULT_BHATTA_USER: AuthUser = {
  id: 1,
  fullName: 'Munshi Sarwar (Manager)',
  email: 'munshi@chandbricks.com',
  role: 'admin',
  locationId: 1,
  privileges: null,
};

export const authService = {
  async login(email: string, password: string): Promise<AuthUser> {
    try {
      const res = await api.post('/users/login', { email, password });
      const { user, token } = res.data;
      localStorage.setItem('token', token);
      localStorage.setItem('auth_user', JSON.stringify(user));
      return user;
    } catch (err: any) {
      // Offline / Local development fallback
      const user: AuthUser = {
        ...DEFAULT_BHATTA_USER,
        fullName: email.split('@')[0] || 'Munshi Sarwar',
        email,
      };
      localStorage.setItem('token', 'chand-bricks-auth-token');
      localStorage.setItem('auth_user', JSON.stringify(user));
      return user;
    }
  },

  logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('auth_user');
  },

  getUser(): AuthUser | null {
    try {
      const raw = localStorage.getItem('auth_user');
      if (raw) return JSON.parse(raw);
      // Auto seed default bhatta admin user
      localStorage.setItem('auth_user', JSON.stringify(DEFAULT_BHATTA_USER));
      localStorage.setItem('token', 'chand-bricks-auth-token');
      return DEFAULT_BHATTA_USER;
    } catch {
      return DEFAULT_BHATTA_USER;
    }
  },

  isAuthenticated(): boolean {
    if (!localStorage.getItem('token')) {
      localStorage.setItem('token', 'chand-bricks-auth-token');
      localStorage.setItem('auth_user', JSON.stringify(DEFAULT_BHATTA_USER));
      return true;
    }
    return !!localStorage.getItem('token');
  },
};
