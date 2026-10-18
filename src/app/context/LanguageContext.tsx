import React, { createContext, useContext, useState, useEffect } from 'react';

export type Language = 'ur' | 'en';

export interface Translations {
  [key: string]: {
    ur: string;
    en: string;
  };
}

export const translations: Translations = {
  // Brand & Header
  brandName: { ur: 'چاند برکس سپلائرز', en: 'Chand Bricks Supplierz' },
  brandSub: { ur: 'بھٹہ مینجمنٹ سسٹم • بوریوالا', en: 'Bhatta Management System • Burewala' },
  address: { ur: 'چک نمبر 431/ای بی چیچہ وطنی روڈ نزد گو پمپ بوریوالا', en: 'Chak No. 431/E.B Chichawatni Road Near Go Pump Burewala' },
  mainYard: { ur: 'مین بھٹہ یارڈ', en: 'Main Bhatta Yard' },
  hajiPhone: { ur: 'حاجی ناصر: 0302-6780883 • منشی سرور: 0304-6557345', en: 'Haji Nasir: 0302-6780883 • Munshi Sarwar: 0304-6557345' },
  munshiRole: { ur: 'مینجر / منشی', en: 'Manager / Munshi' },
  signOut: { ur: 'لاگ آؤٹ کریں', en: 'Sign Out' },

  // Sidebar Menu Items
  menuDashboard: { ur: 'ڈیش بورڈ', en: 'Dashboard' },
  menuBilling: { ur: 'سیلز بلنگ', en: 'Sales & Billing' },
  menuCustomers: { ur: 'کسٹمر کھاتہ', en: 'Customer Ledger' },
  menuKacchi: { ur: 'کچی اینٹ پتھائی', en: 'Kacchi Production' },
  menuBhatti: { ur: 'بھٹی بھری و نکاسی', en: 'Bhatti Kiln Labor' },
  menuAdvances: { ur: 'مزدور ایڈوانس', en: 'Worker Advances' },
  menuEmployees: { ur: 'مزدور و ملازمین', en: 'Labor & Staff' },
  menuStock: { ur: 'اسٹاک و مال گودام', en: 'Stock Inventory' },
  menuExpenses: { ur: 'روزمرہ اخراجات', en: 'Daily Expenses' },
  menuMattiFuel: { ur: 'مٹی و ایندھن', en: 'Matti & Fuel' },

  // Common Actions & Labels
  save: { ur: 'محفوظ کریں', en: 'Save' },
  cancel: { ur: 'منسوخ', en: 'Cancel' },
  delete: { ur: 'حذف کریں', en: 'Delete' },
  print: { ur: 'پرنٹ کریں', en: 'Print' },
  action: { ur: 'کارروائی', en: 'Action' },
  search: { ur: 'تلاش کریں...', en: 'Search...' },
  clear: { ur: 'صاف کریں', en: 'Clear' },
  date: { ur: 'تاریخ', en: 'Date' },
  total: { ur: 'کل میزان', en: 'Total' },
  status: { ur: 'حالت', en: 'Status' },
  quantity: { ur: 'تعداد اینٹ', en: 'Quantity' },
  rate: { ur: 'ریٹ', en: 'Rate' },
  amount: { ur: 'کل رقم', en: 'Total Amount' },
  balance: { ur: 'بقایا', en: 'Balance' },
  paid: { ur: 'ادا شدہ', en: 'Paid' },
  remaining: { ur: 'باقی رقم', en: 'Remaining' },
  remarks: { ur: 'تفصیل / نوٹ', en: 'Remarks' },
  all: { ur: 'تمام', en: 'All' },
  close: { ur: 'بند کریں', en: 'Close' },
  worker: { ur: 'مزدور', en: 'Worker' },
  customer: { ur: 'گاہک', en: 'Customer' },
  phone: { ur: 'فون نمبر', en: 'Phone' },
  selectWorker: { ur: 'مزدور منتخب کریں', en: 'Select Worker' },

  // Dashboard Cards & Sections
  topBannerTitle: { ur: 'چاند برکس سپلائرز (AMD)', en: 'Chand Bricks Supplierz (AMD)' },
  topBannerSub: { ur: 'پتھائی، بھری، نکاسی، کسٹمر کھاتہ، ایڈوانس، سیلز بلنگ اور اخراجات کا خودکار سسٹم', en: 'Real-time Production, Labor Khata, Inventory, Udhar & Billing' },
  todaySales: { ur: 'آج کی کل سیل', en: "Today's Total Sales" },
  totalRecovery: { ur: 'کل نقد وصولی', en: 'Total Cash Recovery' },
  pendingUdhar: { ur: 'مارکیٹ سے کل ادھار وصولی', en: 'Pending Customer Udhar' },
  readyStockCount: { ur: 'تیار پکی اینٹ اسٹاک', en: 'Ready Fired Brick Stock' },
  kacchiGroundCount: { ur: 'کچی اینٹ زمین پر اسٹاک', en: 'Kacchi Raw Ground Stock' },
  recentInvoices: { ur: 'حالیہ سیلز انوائسز', en: 'Recent Sales Invoices' },
  customerUdharSummary: { ur: 'گاہکوں کے ادھار کی فہرست', en: 'Customer Udhar Directory' },
  quickBillingBtn: { ur: 'نیا سیلز بل بنائیں', en: 'New Sales Bill' },
  quickRecoveryBtn: { ur: 'گاہک سے وصولی درج کریں', en: 'Receive Payment' },
  quickPathaiBtn: { ur: 'کچی پتھائی اندراج', en: 'Add Kacchi Pathai' },
  quickExpenseBtn: { ur: 'خرچہ درج کریں', en: 'Add Expense' },

  // Billing Page
  billingTitle: { ur: 'سیلز انوائس و بلنگ سسٹم', en: 'Sales Invoice & Billing' },
  billingSub: { ur: 'گاہک کا نام، اینٹ کی قسم، گاڑی نمبر، کرایہ اور نقد و ادھار بلنگ', en: 'Create customer bills with automatic ledger updates and printable slips' },
  newBillBtn: { ur: 'نیا سیلز بل بنائیں', en: 'Create New Bill' },
  invoiceNo: { ur: 'انوائس نمبر', en: 'Invoice #' },
  vehicleNo: { ur: 'گاڑی / ٹریکٹر نمبر', en: 'Vehicle / Tractor #' },
  driverName: { ur: 'ڈرائیور نام', en: 'Driver Name' },
  brickType: { ur: 'اینٹ کی جنس', en: 'Brick Type' },
  freightCost: { ur: 'کرایہ گاڑی', en: 'Freight / Carriage' },
  receivedCash: { ur: 'نقد وصولی', en: 'Received Cash' },
  viewInvoiceBtn: { ur: 'بل پرچی دیکھیں', en: 'View Invoice' },

  // Customer Ledger
  customersTitle: { ur: 'گاہک کھاتہ و بقایا جات', en: 'Customer Ledger & Udhar' },
  customersSub: { ur: 'تمام ڈیلرز اور خریداروں کا ادھار بیلنس، وصولی ریکارڈ اور کھاتہ پرچی', en: 'Customer receivable directory, payment history and official statements' },
  totalReceivable: { ur: 'مارکیٹ سے کل بقایا جات', en: 'Total Market Receivables' },
  totalPaidAll: { ur: 'اب تک کل وصول شدہ رقم', en: 'Total Cash Recovered' },
  receivePaymentBtn: { ur: 'رقم وصول کریں', en: 'Receive Payment' },
  statementBtn: { ur: 'کھاتہ پرچی', en: 'Khata Slip' },

  // Kacchi Production
  kacchiTitle: { ur: 'کچی اینٹ پتھائی کھاتہ', en: 'Kacchi Production Khata' },
  kacchiSub: { ur: 'مزدور وار تاریخ وار پتھائی ریکارڈ اور خودکار فارمولا: (تعداد / 1000) × ریٹ', en: 'Date-wise molding tracking with automatic formula: (Qty / 1000) × Rate' },
  addPathaiBtn: { ur: 'نیا پتھائی اندراج', en: 'Add Pathai Entry' },
  totalKacchiMolded: { ur: 'کل کچی اینٹ پتھائی', en: 'Total Kacchi Molded' },
  totalPathaiWages: { ur: 'کل پتھائی مزدوری', en: 'Total Pathai Wages' },
  avgRate: { ur: 'اوسط ریٹ فی ہزار', en: 'Average Rate / 1000' },

  // Pakki Bhatti Labor
  bhattiTitle: { ur: 'پکی اینٹ و بھٹی لیبر کھاتہ', en: 'Pakki Bhatti Labor Khata' },
  bhattiSub: { ur: 'بھٹی بھری (لوڈنگ) اور نکاسی (ان لوڈنگ) تاریخ وار کھاتہ مع ریٹ فی ہزار', en: 'Kiln loading (Bhari) and unloading (Nikasi) tracking with wage calculation' },
  bhariTab: { ur: 'بھٹی بھری کھاتہ', en: 'Bhari Khata (Loading)' },
  nikasiTab: { ur: 'بھٹی نکاسی کھاتہ', en: 'Nikasi Khata (Unloading)' },
  addBhariBtn: { ur: 'نیا بھری اندراج', en: 'Add Bhari Entry' },
  addNikasiBtn: { ur: 'نیا نکاسی اندراج', en: 'Add Nikasi Entry' },
  workType: { ur: 'کام کی قسم', en: 'Work Type' },

  // Worker Advances
  advancesTitle: { ur: 'مزدور ایڈوانس و نیٹ حساب', en: 'Worker Advances & Net Settlement' },
  advancesSub: { ur: 'کل کمائی مزدوری (پتھائی + بھری + نکاسی) منفی ایڈوانس = خالص بقایا ادائیگی', en: 'Formula: Total Earned Wages - Advances Taken = Net Payable Balance' },
  settlementTab: { ur: 'نیٹ حساب (خالص بیلنس)', en: 'Master Net Settlement' },
  advanceHistoryTab: { ur: 'ایڈوانس اندراج تاریخ', en: 'Advance History' },
  addAdvanceBtn: { ur: 'نیا ایڈوانس دیں', en: 'Add Advance' },
  totalAdvancesDisbursed: { ur: 'کل جاری کردہ ایڈوانس', en: 'Total Advances Disbursed' },
  totalWagesEarned: { ur: 'کل کمائی مزدوری', en: 'Total Earned Wages' },
  netPayableBalance: { ur: 'خالص واجب الادا رقم', en: 'Net Balance Payable' },

  // Daily Expenses
  expensesTitle: { ur: 'روزمرہ اخراجات کھاتہ', en: 'Daily Expenses Khata' },
  expensesSub: { ur: 'جنریٹر ڈیزل، بجلی بل، لنگر، موٹر مرمت، منشی خرچ اور دفتری اخراجات', en: 'Diesel, electricity, food, machine repair, maintenance and office expenses' },
  addExpenseModalBtn: { ur: 'نیا خرچہ درج کریں', en: 'Add Daily Expense' },
  category: { ur: 'شعبہ خرچ', en: 'Category' },
  paidTo: { ur: 'بنام / وصول کنندہ', en: 'Paid To' },

  // Matti & Fuel
  mattiFuelTitle: { ur: 'مٹی ٹرالی و ایندھن کھاتہ', en: 'Matti Trolley & Fuel Khata' },
  mattiFuelSub: { ur: 'مٹی ٹرالی سپلائی، کوئلہ، لکڑی اور مصالحہ خریداری کا مکمل کھاتہ', en: 'Raw clay trolley deliveries, burning coal, firewood and husk ledgers' },
  mattiTab: { ur: 'مٹی ٹرالی کھاتہ', en: 'Matti Trolley Khata' },
  fuelTab: { ur: 'ایندھن و کوئلہ کھاتہ', en: 'Fuel & Coal Khata' },
  addMattiModalBtn: { ur: 'مٹی ٹرالی اندراج', en: 'Add Matti Trolley' },
  addFuelModalBtn: { ur: 'ایندھن خریداری اندراج', en: 'Add Fuel Purchase' },

  // Stock & Inventory
  stockTitle: { ur: 'اسٹاک و مال گودام مینجمنٹ', en: 'Stock & Inventory Management' },
  stockSub: { ur: 'سیلز انوائس پر خودکار منفی، زمین پتھائی سے اضافہ اور بھٹی پراسیسنگ', en: 'Automatic stock deduction on sales invoice and production sync' },
  adjustStockModalBtn: { ur: 'اسٹاک رد و بدل / ٹوٹ پھوٹ', en: 'Adjust Stock / Breakage' },
  finishedStockReady: { ur: 'تیار پکی اینٹ و ٹائل', en: 'Total Finished Goods Ready' },
  kacchiGroundStockBanner: { ur: 'کچی اینٹ زمین پر اسٹاک', en: 'Raw Ground Stock' },

  // Labor & Employees
  employeesTitle: { ur: 'مزدور و ملازمین مینجمنٹ', en: 'Labor & Staff Management' },
  employeesSub: { ur: 'پتھیر، بھری مزدور، نکاسی مزدور، جلندھر اور ماہانہ تنخواہ دار عملہ', en: 'Pathair, Bhari, Nikasi, Jalandhar masters and salaried staff' },
  staffDirectoryTab: { ur: 'عملہ و مزدور لسٹ', en: 'Staff Directory' },
  attendanceTab: { ur: 'روزانہ حاضری شیٹ', en: 'Daily Attendance' },
  addWorkerBtn: { ur: 'نیا مزدور شامل کریں', en: 'Add New Worker' },
  role: { ur: 'عہدہ / کام کی قسم', en: 'Role / Job' },
  salaryType: { ur: 'اجرت کی قسم', en: 'Wage Type' },
};

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  toggleLanguage: () => void;
  isUrdu: boolean;
  t: (key: string, fallback?: string) => string;
  dir: 'rtl' | 'ltr';
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Default to Urdu as requested by user ("sara project urdu me bna dooo upper option dy k k urdeu and english")
  const [language, setLanguageState] = useState<Language>(() => {
    const saved = localStorage.getItem('app_language');
    return (saved === 'en' || saved === 'ur') ? saved : 'ur';
  });

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    localStorage.setItem('app_language', lang);
  };

  const toggleLanguage = () => {
    setLanguage(language === 'ur' ? 'en' : 'ur');
  };

  useEffect(() => {
    document.documentElement.lang = language;
    document.documentElement.dir = language === 'ur' ? 'rtl' : 'ltr';
    if (language === 'ur') {
      document.body.classList.add('lang-ur');
      document.body.classList.remove('lang-en');
    } else {
      document.body.classList.add('lang-en');
      document.body.classList.remove('lang-ur');
    }
  }, [language]);

  const t = (key: string, fallback?: string): string => {
    if (translations[key]) {
      return translations[key][language];
    }
    return fallback || key;
  };

  const isUrdu = language === 'ur';
  const dir = isUrdu ? 'rtl' : 'ltr';

  return (
    <LanguageContext.Provider value={{ language, setLanguage, toggleLanguage, isUrdu, t, dir }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = (): LanguageContextType => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};
