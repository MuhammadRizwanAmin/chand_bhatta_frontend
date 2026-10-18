import React, { createContext, useContext, useState, useEffect } from 'react';
import defaultLogo from '../../assets/chand_bricks_logo.jpg';
import defaultBannerLogo from '../../assets/chand_horizontal_logo.jpg';

export interface BhattaSettings {
  businessNameUrdu: string;
  businessNameEnglish: string;
  taglineUrdu: string;
  taglineEnglish: string;
  addressUrdu: string;
  addressEnglish: string;
  hajiPhone: string;
  munshiPhone: string;
  proprietors: string;
  logoUrl: string;
  bannerLogoUrl: string;
  managerName: string;
  managerEmail: string;
  managerPhone: string;
  ntnNumber: string;
}

const DEFAULT_SETTINGS: BhattaSettings = {
  businessNameUrdu: 'چاند برکس سپلائرز (اے ایم ڈی)',
  businessNameEnglish: 'Chand Bricks Supplierz (AMD)',
  taglineUrdu: 'چاند برکس بوریوالا (سپیشل اول اینٹ)',
  taglineEnglish: 'Bhatta ERP & Sales Management',
  addressUrdu: 'چک نمبر 431/ای بی چیچہ وطنی روڈ نزد گو پمپ بوریوالا',
  addressEnglish: 'Chak No. 431/E.B Chichawatni Road Near Go Pump Burewala',
  hajiPhone: '0302-6780883, 0302-7997333',
  munshiPhone: '0304-6557345, 0308-6586638',
  proprietors: 'سیٹھ حاجی محمد بوٹا (مرحوم) • سیٹھ بشیر احمد (مرحوم) • حاجی سیٹھ مجید',
  logoUrl: defaultLogo,
  bannerLogoUrl: defaultBannerLogo,
  managerName: 'منشی سرور (مینیجر)',
  managerEmail: 'munshi@chandbricks.com',
  managerPhone: '0304-6557345',
  ntnNumber: 'PK-BURE-431-2026',
};

const STORAGE_KEY = 'bhatta_profile_settings';

interface BhattaSettingsContextType {
  settings: BhattaSettings;
  updateSettings: (newSettings: Partial<BhattaSettings>) => void;
  updateLogo: (base64: string) => void;
  updateBannerLogo: (base64: string) => void;
  resetSettings: () => void;
}

const BhattaSettingsContext = createContext<BhattaSettingsContextType | undefined>(undefined);

export function BhattaSettingsProvider({ children }: { children: React.ReactNode }) {
  const [settings, setSettings] = useState<BhattaSettings>(() => {
    if (typeof window === 'undefined') return DEFAULT_SETTINGS;
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        return {
          ...DEFAULT_SETTINGS,
          ...parsed,
          // ensure logoUrl falls back to default if empty
          logoUrl: parsed.logoUrl || defaultLogo,
          bannerLogoUrl: parsed.bannerLogoUrl || defaultBannerLogo,
        };
      }
    } catch (e) {
      console.error('Failed to load settings from storage', e);
    }
    return DEFAULT_SETTINGS;
  });

  const saveSettings = (newVals: BhattaSettings) => {
    setSettings(newVals);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(newVals));
    } catch (e) {
      console.error('Failed to persist settings', e);
    }
  };

  const updateSettings = (partial: Partial<BhattaSettings>) => {
    const merged = { ...settings, ...partial };
    saveSettings(merged);
  };

  const updateLogo = (base64: string) => {
    updateSettings({ logoUrl: base64 });
  };

  const updateBannerLogo = (base64: string) => {
    updateSettings({ bannerLogoUrl: base64 });
  };

  const resetSettings = () => {
    saveSettings(DEFAULT_SETTINGS);
  };

  return (
    <BhattaSettingsContext.Provider
      value={{
        settings,
        updateSettings,
        updateLogo,
        updateBannerLogo,
        resetSettings,
      }}
    >
      {children}
    </BhattaSettingsContext.Provider>
  );
}

export function useBhattaSettings() {
  const ctx = useContext(BhattaSettingsContext);
  if (!ctx) {
    throw new Error('useBhattaSettings must be used within a BhattaSettingsProvider');
  }
  return ctx;
}
