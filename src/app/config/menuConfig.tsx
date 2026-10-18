import React from 'react';
import {
  LayoutDashboard,
  Users,
  Flame,
  Layers,
  Coins,
  Receipt,
  Truck,
  Package,
  FileText,
  ClipboardList,
  Settings
} from 'lucide-react';

export interface SubMenuItem {
  name: string;
  nameUr?: string;
  nameEn?: string;
  icon: React.ReactNode;
  path: string;
  privilege?: string;
  module?: string;
}

export interface MenuItem {
  name: string;
  nameUr: string;
  nameEn: string;
  icon: React.ReactNode;
  path?: string;
  submenu?: SubMenuItem[];
  privilege?: string;
  module?: string;
}

export const getAllMenuItems = (isUrdu?: boolean): MenuItem[] => [
  {
    name: isUrdu ? 'ڈیش بورڈ' : 'Dashboard',
    nameUr: 'ڈیش بورڈ',
    nameEn: 'Dashboard',
    icon: <LayoutDashboard size={20} />,
    path: '/',
  },
  {
    name: isUrdu ? 'سیلز بلنگ' : 'Sales & Billing',
    nameUr: 'سیلز بلنگ',
    nameEn: 'Sales & Billing',
    icon: <FileText size={20} />,
    path: '/bhatta/billing',
  },
  {
    name: isUrdu ? 'کسٹمر کھاتہ' : 'Customer Ledger',
    nameUr: 'کسٹمر کھاتہ',
    nameEn: 'Customer Ledger',
    icon: <Users size={20} />,
    path: '/bhatta/customers',
  },
  {
    name: isUrdu ? 'کچی اینٹ پتھائی' : 'Kacchi Production',
    nameUr: 'کچی اینٹ پتھائی',
    nameEn: 'Kacchi Production',
    icon: <Layers size={20} />,
    path: '/bhatta/kacchi',
  },
  {
    name: isUrdu ? 'پکی اینٹ (بھری و نکلوائی)' : 'Pakki Production',
    nameUr: 'پکی اینٹ (بھری و نکلوائی)',
    nameEn: 'Pakki Production',
    icon: <Flame size={20} />,
    path: '/bhatta/bhatti',
  },
  {
    name: isUrdu ? 'مزدور ایڈوانس' : 'Worker Advances',
    nameUr: 'مزدور ایڈوانس',
    nameEn: 'Worker Advances',
    icon: <Coins size={20} />,
    path: '/bhatta/advances',
  },
  {
    name: isUrdu ? 'مزدور و عملہ' : 'Labor & Staff',
    nameUr: 'مزدور و عملہ',
    nameEn: 'Labor & Staff',
    icon: <ClipboardList size={20} />,
    path: '/bhatta/employees',
  },
  {
    name: isUrdu ? 'اسٹاک و مال گودام' : 'Stock Inventory',
    nameUr: 'اسٹاک و مال گودام',
    nameEn: 'Stock Inventory',
    icon: <Package size={20} />,
    path: '/bhatta/stock',
  },
  {
    name: isUrdu ? 'روزمرہ اخراجات' : 'Daily Expenses',
    nameUr: 'روزمرہ اخراجات',
    nameEn: 'Daily Expenses',
    icon: <Receipt size={20} />,
    path: '/bhatta/expenses',
  },
  {
    name: isUrdu ? 'مٹی و ایندھن کھاتہ' : 'Matti & Fuel Khata',
    nameUr: 'مٹی و ایندھن کھاتہ',
    nameEn: 'Matti & Fuel Khata',
    icon: <Truck size={20} />,
    path: '/bhatta/matti-fuel',
  },
  {
    name: isUrdu ? 'سیٹنگز و پروفائل' : 'Settings & Profile',
    nameUr: 'سیٹنگز و پروفائل',
    nameEn: 'Settings & Profile',
    icon: <Settings size={20} />,
    path: '/bhatta/settings',
  },
];

export const getMenuItems = (user?: any, modules?: Record<string, boolean> | null, isUrdu?: boolean): MenuItem[] => {
  return getAllMenuItems(isUrdu);
};
