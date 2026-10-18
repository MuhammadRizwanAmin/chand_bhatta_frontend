import React, { createContext, useContext, useEffect, useState } from 'react';
import { moduleService, ModuleConfig } from '../services/moduleService';
import { authService } from '../services/authService';

interface ModuleContextType {
  modules: ModuleConfig | null;
  loading: boolean;
  refreshModules: () => Promise<void>;
}

const ModuleContext = createContext<ModuleContextType>({
  modules: null,
  loading: true,
  refreshModules: async () => {},
});

export const useModule = () => useContext(ModuleContext);

export const ModuleProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [modules, setModules] = useState<ModuleConfig | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchModules = async () => {
    if (!authService.isAuthenticated()) {
      setLoading(false);
      return;
    }
    try {
      setLoading(true);
      const data = await moduleService.getModules();
      setModules(data);
    } catch (error) {
      console.error('Error fetching modules:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchModules();
  }, []);

  return (
    <ModuleContext.Provider value={{ modules, loading, refreshModules: fetchModules }}>
      {children}
    </ModuleContext.Provider>
  );
};
