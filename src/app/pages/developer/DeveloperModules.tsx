import { useState, useEffect } from 'react';
import { useModule } from '../../context/ModuleContext';
import { moduleService } from '../../services/moduleService';
import { toast } from 'sonner';
import { Settings, Save, AlertTriangle } from 'lucide-react';

export function DeveloperModules() {
  const { modules, refreshModules } = useModule();
  const [localModules, setLocalModules] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (modules) {
      setLocalModules(modules as Record<string, boolean>);
    }
  }, [modules]);

  const handleToggle = async (key: string, value: boolean) => {
    // Optimistic UI update
    setLocalModules((prev) => ({ ...prev, [key]: value }));
    try {
      await moduleService.updateModule(key, value);
      toast.success(`Module ${key} updated successfully.`);
      refreshModules();
    } catch (error) {
      // Revert on failure
      setLocalModules((prev) => ({ ...prev, [key]: !value }));
      toast.error(`Failed to update module ${key}.`);
    }
  };

  // Exclude typical sequelize keys like id, createdAt, updatedAt
  const moduleKeys = Object.keys(localModules).filter(
    (key) => !['id', 'createdAt', 'updatedAt'].includes(key)
  );

  return (
    <div className="space-y-6 pb-12 max-w-4xl mx-auto mt-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-[#0F172A] flex items-center gap-2">
            <Settings className="text-[#1D4ED8]" />
            Developer Module Manager
          </h1>
          <p className="text-gray-600 mt-1">
            Toggle global software modules on or off. This page is hidden from standard users.
          </p>
        </div>
      </div>

      <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-start gap-3">
        <AlertTriangle className="text-amber-500 shrink-0 mt-0.5" size={20} />
        <div>
          <h3 className="text-sm font-bold text-amber-800">Developer Warning</h3>
          <p className="text-sm text-amber-700 mt-1">
            Disabling a module here will hide it completely from the sidebar and dashboard for all users, including administrators. Associated privileges will also be revoked.
          </p>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 divide-y md:divide-y-0 md:divide-x border-b border-gray-100 last:border-0 flex-wrap">
          {moduleKeys.map((key) => (
            <div key={key} className="p-5 flex items-center justify-between border-b border-gray-100 last:border-0">
              <span className="text-sm font-semibold text-gray-800 capitalize">
                {key}
              </span>
              <label className="relative inline-flex items-center cursor-pointer flex-shrink-0">
                <input
                  type="checkbox"
                  checked={localModules[key] || false}
                  onChange={(e) => handleToggle(key, e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:ring-2 peer-focus:ring-[#1D4ED8] rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#1D4ED8]" />
              </label>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
