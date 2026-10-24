// Chand Bricks Supplierz - Bhatta Management System Service Layer
// Full Multi-Module CRUD, Offline Persistence & Backend Sync

export interface Employee {
  id: number;
  full_name: string;
  phone: string;
  cnic: string;
  role: 'Kacchi_Worker' | 'Pakki_Worker' | 'Bhari_Worker' | 'Nikasi_Worker' | 'Munshi' | 'Driver' | 'General_Labor';
  salary_type: 'Per_Thousand_Bricks' | 'Daily_Wage' | 'Monthly_Salary';
  monthly_salary_amount: number;
  joining_date: string;
  status: 'Active' | 'Inactive';
  created_at?: string;
}

export interface EmployeeAttendance {
  id: number;
  employee_id: number;
  attendance_date: string;
  status: 'Present' | 'Absent' | 'Half_Day' | 'Leave';
  notes?: string;
}

export interface KacchiAentRecord {
  id: number;
  employee_id: number;
  entry_date: string;
  item_type?: 'Kacchi_Aent' | 'Tile';
  quantity: number;
  rate_per_thousand: number;
  total_amount: number;
  status?: 'Paid' | 'Unpaid';
}

export interface PakkiAentRecord {
  id: number;
  employee_id: number;
  entry_date: string;
  item_type?: 'Pakki_Aent' | 'Tile';
  quantity: number;
  rate_per_thousand: number;
  total_amount: number;
  status?: 'Paid' | 'Unpaid';
}

export interface BhattiLaborRecord {
  id: number;
  employee_id: number;
  work_type: 'Bhari' | 'Nikasi';
  entry_date: string;
  item_type?: 'Pakki_Aent' | 'Tile';
  quantity: number;
  rate_per_thousand: number;
  total_amount: number;
  chamber_no?: string;
  notes?: string;
  aval_qty?: number;
  doem_qty?: number;
  soyem_qty?: number;
  tile_qty?: number;
  khangar_qty?: number;
  status?: 'Paid' | 'Unpaid';
}

export interface WorkerAdvance {
  id: number;
  employee_id: number;
  advance_date: string;
  amount_paid: number;
  remarks: string;
  status?: 'Paid' | 'Unpaid';
}

export interface StaffSalaryPayment {
  id: number;
  employee_id: number;
  employee_name: string;
  month_period: string; // e.g. "October 2026"
  base_salary: number;
  advance_deducted: number;
  net_payable: number;
  paid_amount: number;
  payment_date: string;
  status: 'Paid' | 'Unpaid';
  remarks?: string;
}

export interface ExpenseCategory {
  id: number;
  category_name: string;
}

export interface DailyExpense {
  id: number;
  title?: string;
  category_id: number;
  category_name?: string;
  expense_date: string;
  amount: number;
  payment_mode: 'Cash' | 'Bank_Transfer' | 'Cheque';
  paid_by: string;
  description: string;
  is_salary_mapped?: boolean;
}

export interface MattiTrolleyRecord {
  id: number;
  entry_date: string;
  trolley_count: number;
  rate_per_trolley: number;
  total_amount: number;
  paid_amount: number;
  supplier_name: string;
  remarks: string;
  status?: 'Paid' | 'Unpaid';
}

export interface FuelMasalaExpense {
  id: number;
  entry_date: string;
  item_type: 'Lakri' | 'Kuila' | 'Masala_Bhura';
  quantity: number;
  unit_rate: number;
  total_amount: number;
  paid_amount: number;
  supplier_name: string;
  remarks: string;
  status?: 'Paid' | 'Unpaid';
}

export interface StockInventory {
  id: number;
  item_name: 'Aent_Aval' | 'Aent_Doem' | 'Aent_Soyem' | 'Tile' | 'Kacchi_Aent' | 'Kacchi_Tile';
  current_stock: number;
  last_updated?: string;
}

export interface Customer {
  id: number;
  customer_name: string;
  phone: string;
  address: string;
  opening_balance: number;
}

export interface SalesInvoice {
  id: number;
  invoice_number: string;
  customer_id: number;
  customer_name?: string;
  invoice_date: string;
  item_type: 'Aent_Aval' | 'Aent_Doem' | 'Aent_Soyem' | 'Tile' | 'Kacchi_Aent';
  quantity: number;
  rate_per_thousand: number;
  base_amount: number;
  kiraya_freight: number;
  net_total_amount: number;
  destination_address: string;
  driver_name?: string;
}

export interface CustomerPayment {
  id: number;
  customer_id: number;
  customer_name?: string;
  payment_date: string;
  amount_received: number;
  payment_mode: 'Cash' | 'Bank_Transfer' | 'Cheque';
  reference_no: string;
  notes: string;
}

export interface DriverVehicle {
  id: number;
  driver_name: string;
  vehicle_no: string;
  vehicle_type?: string;
  phone?: string;
}

const SEED_DRIVERS_VEHICLES: DriverVehicle[] = [
  { id: 1, driver_name: 'Iqbal Hussain', vehicle_no: 'Trolley # 4821', vehicle_type: 'Tractor Trolley', phone: '0303-4455667' },
  { id: 2, driver_name: 'Muhammad Asif', vehicle_no: 'Trolley # 3312', vehicle_type: 'Tractor Trolley', phone: '0301-2233445' },
  { id: 3, driver_name: 'Rashid Gujjar', vehicle_no: 'Mazda Truck # 7810', vehicle_type: 'Truck', phone: '0305-9988776' },
  { id: 4, driver_name: 'Tariq Mehmood', vehicle_no: 'Trolley # 5214', vehicle_type: 'Tractor Trolley', phone: '0306-6655443' },
  { id: 5, driver_name: 'Sajid Ali', vehicle_no: 'Trolley # 9045', vehicle_type: 'Tractor Trolley', phone: '0308-1122334' },
];

// Initial Seed Data for Instant Realistic Pakistani Bhatta Experience
const SEED_EMPLOYEES: Employee[] = [
  { id: 1, full_name: 'Munshi Sarwar', phone: '0304-6557345', cnic: '36104-1234567-1', role: 'Munshi', salary_type: 'Monthly_Salary', monthly_salary_amount: 45000, joining_date: '2023-01-10', status: 'Active' },
  { id: 2, full_name: 'Muhammad Akram Pathair', phone: '0301-7654321', cnic: '36104-2345678-3', role: 'Kacchi_Worker', salary_type: 'Per_Thousand_Bricks', monthly_salary_amount: 0, joining_date: '2023-02-01', status: 'Active' },
  { id: 3, full_name: 'Bashir Ahmad Bhariwala', phone: '0306-8877665', cnic: '36104-3456789-5', role: 'Bhari_Worker', salary_type: 'Per_Thousand_Bricks', monthly_salary_amount: 0, joining_date: '2023-03-15', status: 'Active' },
  { id: 4, full_name: 'Rashid Jalaiwala (Master)', phone: '0308-9988776', cnic: '36104-4567890-7', role: 'Pakki_Worker', salary_type: 'Daily_Wage', monthly_salary_amount: 1800, joining_date: '2023-04-12', status: 'Active' },
  { id: 5, full_name: 'Ghulam Fareed Nikasi', phone: '0305-1122334', cnic: '36104-5678901-9', role: 'Nikasi_Worker', salary_type: 'Per_Thousand_Bricks', monthly_salary_amount: 0, joining_date: '2023-05-18', status: 'Active' },
  { id: 6, full_name: 'Iqbal Hussain Driver', phone: '0303-4455667', cnic: '36104-6789012-1', role: 'Driver', salary_type: 'Monthly_Salary', monthly_salary_amount: 32000, joining_date: '2023-06-01', status: 'Active' },
  { id: 7, full_name: 'Allah Ditta Pathair', phone: '0307-3344556', cnic: '36104-7890123-3', role: 'Kacchi_Worker', salary_type: 'Per_Thousand_Bricks', monthly_salary_amount: 0, joining_date: '2023-07-20', status: 'Active' },
];

const SEED_CUSTOMERS: Customer[] = [
  { id: 1, customer_name: 'Chaudhry Tariq Mehmood', phone: '0300-1234567', address: 'Chichawatni Road, Burewala', opening_balance: 0 },
  { id: 2, customer_name: 'Malik Arshad Builder', phone: '0321-9876543', address: 'Grain Market, Burewala', opening_balance: 0 },
  { id: 3, customer_name: 'Rana Liaqat Ali (Contractor)', phone: '0333-5544332', address: 'Model Town, Vehari', opening_balance: 0 },
  { id: 4, customer_name: 'Haji Aslam & Sons Plaza', phone: '0302-1122334', address: 'College Road, Gaggoo Mandi', opening_balance: 0 },
];

const SEED_CATEGORIES: ExpenseCategory[] = [
  { id: 1, category_name: 'Chai & Food' },
  { id: 2, category_name: 'Generator & Fuel' },
  { id: 3, category_name: 'Machinery Maintenance' },
  { id: 4, category_name: 'Land Lease & Rent' },
  { id: 5, category_name: 'Transport & Freight' },
  { id: 6, category_name: 'Staff Salary' },
  { id: 7, category_name: 'Miscellaneous' },
  { id: 8, category_name: 'Matti Trolley' },
];

const SEED_STOCKS: StockInventory[] = [
  { id: 1, item_name: 'Aent_Aval', current_stock: 85000 },
  { id: 2, item_name: 'Aent_Doem', current_stock: 42000 },
  { id: 3, item_name: 'Aent_Soyem', current_stock: 18000 },
  { id: 4, item_name: 'Tile', current_stock: 25000 },
  { id: 5, item_name: 'Kacchi_Aent', current_stock: 120000 },
  { id: 6, item_name: 'Kacchi_Tile', current_stock: 35000 },
];

export function getLocalDateString(d: Date = new Date()): string {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

const todayStr = getLocalDateString(new Date());
const yesterdayStr = getLocalDateString(new Date(Date.now() - 86400000));
const twoDaysAgoStr = getLocalDateString(new Date(Date.now() - 172800000));

const SEED_KACCHI: KacchiAentRecord[] = [
  { id: 1, employee_id: 2, entry_date: todayStr, item_type: 'Kacchi_Aent', quantity: 7500, rate_per_thousand: 1500, total_amount: 11250, status: 'Paid' },
  { id: 2, employee_id: 7, entry_date: todayStr, item_type: 'Tile', quantity: 5000, rate_per_thousand: 1600, total_amount: 8000, status: 'Unpaid' },
  { id: 3, employee_id: 2, entry_date: yesterdayStr, item_type: 'Kacchi_Aent', quantity: 7500, rate_per_thousand: 1500, total_amount: 11250, status: 'Paid' },
  { id: 4, employee_id: 7, entry_date: yesterdayStr, item_type: 'Kacchi_Aent', quantity: 7500, rate_per_thousand: 1500, total_amount: 11250, status: 'Paid' },
];

const SEED_BHATTI: BhattiLaborRecord[] = [
  { id: 1, employee_id: 3, work_type: 'Bhari', entry_date: todayStr, item_type: 'Pakki_Aent', quantity: 10000, rate_per_thousand: 500, total_amount: 5000, status: 'Paid' },
  { id: 2, employee_id: 5, work_type: 'Nikasi', entry_date: todayStr, item_type: 'Tile', quantity: 6000, rate_per_thousand: 520, total_amount: 3120, tile_qty: 6000, status: 'Unpaid' },
  { id: 3, employee_id: 3, work_type: 'Bhari', entry_date: yesterdayStr, item_type: 'Pakki_Aent', quantity: 10000, rate_per_thousand: 500, total_amount: 5000, status: 'Paid' },
  { id: 4, employee_id: 5, work_type: 'Nikasi', entry_date: yesterdayStr, item_type: 'Pakki_Aent', quantity: 10000, rate_per_thousand: 500, total_amount: 5000, aval_qty: 6000, doem_qty: 3000, soyem_qty: 1000, status: 'Paid' },
];

const SEED_ADVANCES: WorkerAdvance[] = [
  { id: 1, employee_id: 2, advance_date: twoDaysAgoStr, amount_paid: 8000, remarks: 'Family medical expense advance', status: 'Paid' },
  { id: 2, employee_id: 3, advance_date: yesterdayStr, amount_paid: 6000, remarks: 'Ration kharcha advance', status: 'Paid' },
  { id: 3, employee_id: 5, advance_date: todayStr, amount_paid: 5000, remarks: 'Home maintenance advance', status: 'Paid' },
  { id: 4, employee_id: 7, advance_date: twoDaysAgoStr, amount_paid: 6000, remarks: 'Weekly labor advance', status: 'Paid' },
];

const SEED_STAFF_SALARIES: StaffSalaryPayment[] = [
  {
    id: 1,
    employee_id: 1,
    employee_name: 'Munshi Sarwar',
    month_period: `${new Date().toLocaleString('default', { month: 'long' })} ${new Date().getFullYear()}`,
    base_salary: 45000,
    advance_deducted: 5000,
    net_payable: 40000,
    paid_amount: 40000,
    payment_date: todayStr,
    status: 'Paid',
    remarks: 'Monthly Munshi Salary Paid Full',
  },
  {
    id: 2,
    employee_id: 6,
    employee_name: 'Iqbal Hussain Driver',
    month_period: `${new Date().toLocaleString('default', { month: 'long' })} ${new Date().getFullYear()}`,
    base_salary: 32000,
    advance_deducted: 4000,
    net_payable: 28000,
    paid_amount: 28000,
    payment_date: todayStr,
    status: 'Paid',
    remarks: 'Driver Monthly Salary',
  },
];

const SEED_EXPENSES: DailyExpense[] = [
  { id: 1, title: 'Chai & Lunch', category_id: 1, category_name: 'Chai & Food', expense_date: todayStr, amount: 3500, payment_mode: 'Cash', paid_by: 'Munshi Sarwar', description: 'Labor tea, biscuits & lunch' },
  { id: 2, title: 'Machine Greasing & Parts', category_id: 3, category_name: 'Machinery Maintenance', expense_date: yesterdayStr, amount: 3000, payment_mode: 'Cash', paid_by: 'Seth Haji Nasir', description: 'Gari grease and bearing replacement' },
  { id: 3, title: 'Lighting & Cables', category_id: 7, category_name: 'Miscellaneous', expense_date: yesterdayStr, amount: 2000, payment_mode: 'Cash', paid_by: 'Munshi Sarwar', description: 'Bhatta lighting bulbs & wires' },
];

const SEED_MATTI: MattiTrolleyRecord[] = [
  { id: 1, entry_date: todayStr, trolley_count: 5, rate_per_trolley: 2500, total_amount: 12500, paid_amount: 12500, supplier_name: 'Akram Matti Supply', remarks: 'Good quality chikni matti (paid cash)', status: 'Paid' },
  { id: 2, entry_date: yesterdayStr, trolley_count: 5, rate_per_trolley: 2500, total_amount: 12500, paid_amount: 12500, supplier_name: 'Akram Matti Supply', remarks: 'Paid fully via Cash', status: 'Paid' },
];

const SEED_FUEL: FuelMasalaExpense[] = [
  { id: 1, entry_date: todayStr, item_type: 'Kuila', quantity: 30, unit_rate: 800, total_amount: 24000, paid_amount: 20000, supplier_name: 'Balochistan Coal Traders', remarks: 'High grade burning coal (Mounds)' },
  { id: 2, entry_date: yesterdayStr, item_type: 'Lakri', quantity: 35, unit_rate: 400, total_amount: 14000, paid_amount: 14000, supplier_name: 'Burewala Timber Mart', remarks: 'Acacia (Kikar) dry firewood' },
  { id: 3, entry_date: twoDaysAgoStr, item_type: 'Masala_Bhura', quantity: 20, unit_rate: 350, total_amount: 7000, paid_amount: 5000, supplier_name: 'Khan Rice Mill Bhura', remarks: 'Rice husk burning mix' },
];

const SEED_INVOICES: SalesInvoice[] = [
  {
    id: 1,
    invoice_number: 'CSB-2026-0001',
    customer_id: 1,
    customer_name: 'Chaudhry Tariq Mehmood',
    invoice_date: todayStr,
    item_type: 'Aent_Aval',
    quantity: 15000,
    rate_per_thousand: 16000,
    base_amount: 240000,
    kiraya_freight: 10000,
    net_total_amount: 250000,
    destination_address: 'Site: Chichawatni Road, near Burewala Bypass',
    driver_name: 'Iqbal Hussain (Trolley # 4821)',
  },
  {
    id: 2,
    invoice_number: 'CSB-2026-0002',
    customer_id: 2,
    customer_name: 'Malik Arshad Builder',
    invoice_date: yesterdayStr,
    item_type: 'Aent_Doem',
    quantity: 10000,
    rate_per_thousand: 14500,
    base_amount: 145000,
    kiraya_freight: 5000,
    net_total_amount: 150000,
    destination_address: 'Plaza Construction, Grain Market Burewala',
    driver_name: 'Shaukat Ali (Truck # 7712)',
  },
  {
    id: 3,
    invoice_number: 'CSB-2026-0003',
    customer_id: 3,
    customer_name: 'Rana Liaqat Ali (Contractor)',
    invoice_date: yesterdayStr,
    item_type: 'Tile',
    quantity: 8000,
    rate_per_thousand: 12000,
    base_amount: 96000,
    kiraya_freight: 4000,
    net_total_amount: 100000,
    destination_address: 'Govt School Project, Vehari',
    driver_name: 'Tahir Abbas',
  },
];

const SEED_PAYMENTS: CustomerPayment[] = [
  { id: 1, customer_id: 1, customer_name: 'Chaudhry Tariq Mehmood', payment_date: todayStr, amount_received: 120000, payment_mode: 'Cash', reference_no: 'RCP-1041', notes: 'Cash recovery against Invoice # CSB-2026-0001' },
  { id: 2, customer_id: 2, customer_name: 'Malik Arshad Builder', payment_date: yesterdayStr, amount_received: 80000, payment_mode: 'Bank_Transfer', reference_no: 'HBL-TXN-98212', notes: 'Bank transfer received via Munshi' },
];

const SEED_ATTENDANCE: EmployeeAttendance[] = [
  { id: 1, employee_id: 1, attendance_date: todayStr, status: 'Present', notes: 'Munshi on-duty' },
  { id: 2, employee_id: 2, attendance_date: todayStr, status: 'Present', notes: 'Pathai morning shift' },
  { id: 3, employee_id: 3, attendance_date: todayStr, status: 'Present', notes: 'Bhari shift 1' },
  { id: 4, employee_id: 4, attendance_date: todayStr, status: 'Present', notes: 'Jalai inspection' },
  { id: 5, employee_id: 5, attendance_date: todayStr, status: 'Present', notes: 'Nikasi line 2' },
  { id: 6, employee_id: 6, attendance_date: todayStr, status: 'Present', notes: 'Delivery trips' },
  { id: 7, employee_id: 7, attendance_date: todayStr, status: 'Present', notes: 'Pathai shift' },
];

// Bhatta Storage Versioning for clean, accurate calculations
const CURRENT_DATA_VERSION = 'v7_integrated_expenses';
if (typeof window !== 'undefined') {
  try {
    const savedVersion = localStorage.getItem('bhatta_data_version');
    if (savedVersion !== CURRENT_DATA_VERSION) {
      const keysToClear = [
        'employees', 'customers', 'categories', 'stocks', 'kacchi',
        'bhatti', 'advances', 'expenses', 'matti', 'fuel', 'invoices',
        'payments', 'attendance', 'staff_salaries'
      ];
      keysToClear.forEach(k => localStorage.removeItem(`bhatta_${k}`));
      localStorage.setItem('bhatta_data_version', CURRENT_DATA_VERSION);
    }
  } catch (e) {
    console.error('Storage version check failed:', e);
  }
}

// Helper to get/set local storage
function loadFromStorage<T>(key: string, defaultValue: T): T {
  try {
    const raw = localStorage.getItem(`bhatta_${key}`);
    return raw ? JSON.parse(raw) : defaultValue;
  } catch {
    return defaultValue;
  }
}

function saveToStorage<T>(key: string, val: T): void {
  try {
    localStorage.setItem(`bhatta_${key}`, JSON.stringify(val));
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('bhatta_data_updated', { detail: { key } }));
    }
  } catch (err) {
    console.error('Failed to save to storage', err);
  }
}

// Master Bhatta Service
export const bhattaService = {
  // 1. Employees
  getEmployees(): Employee[] {
    return loadFromStorage('employees', SEED_EMPLOYEES);
  },
  saveEmployee(employee: Partial<Employee>): Employee {
    const list = this.getEmployees();
    if (employee.id) {
      const idx = list.findIndex(e => e.id === employee.id);
      if (idx !== -1) {
        list[idx] = { ...list[idx], ...employee } as Employee;
      }
      saveToStorage('employees', list);
      return list[idx];
    } else {
      const newEmp: Employee = {
        id: Date.now(),
        full_name: employee.full_name || 'Worker',
        phone: employee.phone || '',
        cnic: employee.cnic || '',
        role: employee.role || 'Kacchi_Worker',
        salary_type: employee.salary_type || 'Per_Thousand_Bricks',
        monthly_salary_amount: Number(employee.monthly_salary_amount || 0),
        joining_date: employee.joining_date || new Date().toISOString().split('T')[0],
        status: employee.status || 'Active',
        created_at: new Date().toISOString(),
      };
      list.unshift(newEmp);
      saveToStorage('employees', list);
      return newEmp;
    }
  },
  deleteEmployee(id: number): void {
    const list = this.getEmployees().filter(e => e.id !== id);
    saveToStorage('employees', list);
  },
  toggleEmployeeStatus(id: number): Employee | null {
    const list = this.getEmployees();
    const idx = list.findIndex(e => e.id === id);
    if (idx !== -1) {
      list[idx].status = list[idx].status === 'Active' ? 'Inactive' : 'Active';
      saveToStorage('employees', list);
      return list[idx];
    }
    return null;
  },

  // 2. Attendance
  getAttendance(date?: string): EmployeeAttendance[] {
    const list = loadFromStorage('attendance', SEED_ATTENDANCE);
    if (date) {
      return list.filter(a => a.attendance_date === date);
    }
    return list;
  },
  saveAttendanceRecord(record: Omit<EmployeeAttendance, 'id'>): void {
    const list = loadFromStorage('attendance', SEED_ATTENDANCE);
    const existingIdx = list.findIndex(
      a => a.employee_id === record.employee_id && a.attendance_date === record.attendance_date
    );
    if (existingIdx !== -1) {
      list[existingIdx] = { ...list[existingIdx], ...record };
    } else {
      list.push({ id: Date.now() + Math.floor(Math.random() * 1000), ...record });
    }
    saveToStorage('attendance', list);
  },

  // 3. Kacchi Production
  getKacchiRecords(): KacchiAentRecord[] {
    return loadFromStorage('kacchi', SEED_KACCHI);
  },
  addKacchiRecord(record: { employee_id: number; entry_date: string; item_type?: 'Kacchi_Aent' | 'Tile'; quantity: number; rate_per_thousand: number; status?: 'Paid' | 'Unpaid' }): KacchiAentRecord {
    const list = this.getKacchiRecords();
    const total_amount = (Number(record.quantity) / 1000.0) * Number(record.rate_per_thousand);
    const itemType = record.item_type || 'Kacchi_Aent';
    const status = record.status || 'Paid';
    const newRecord: KacchiAentRecord = {
      id: Date.now(),
      employee_id: record.employee_id,
      entry_date: record.entry_date,
      item_type: itemType,
      quantity: Number(record.quantity),
      rate_per_thousand: Number(record.rate_per_thousand),
      total_amount,
      status,
    };
    list.unshift(newRecord);
    saveToStorage('kacchi', list);

    // Increment ground stock
    if (itemType === 'Tile') {
      this.adjustStock('Tile', Number(record.quantity));
    } else {
      this.adjustStock('Kacchi_Aent', Number(record.quantity));
    }
    return newRecord;
  },
  deleteKacchiRecord(id: number): void {
    const list = this.getKacchiRecords().filter(r => r.id !== id);
    saveToStorage('kacchi', list);
  },
  toggleKacchiStatus(id: number): void {
    const list = this.getKacchiRecords();
    const idx = list.findIndex(r => r.id === id);
    if (idx !== -1) {
      list[idx].status = list[idx].status === 'Unpaid' ? 'Paid' : 'Unpaid';
      saveToStorage('kacchi', list);
    }
  },
  updateKacchiRecord(id: number, data: Partial<KacchiAentRecord>): KacchiAentRecord | null {
    const list = this.getKacchiRecords();
    const idx = list.findIndex(r => r.id === id);
    if (idx === -1) return null;
    const existing = list[idx];
    const quantity = data.quantity !== undefined ? Number(data.quantity) : existing.quantity;
    const rate = data.rate_per_thousand !== undefined ? Number(data.rate_per_thousand) : existing.rate_per_thousand;
    const total_amount = (quantity / 1000.0) * rate;

    // Adjust stock delta
    const diff = quantity - existing.quantity;
    if (diff !== 0) {
      const stockKey = (data.item_type || existing.item_type) === 'Tile' ? 'Tile' : 'Kacchi_Aent';
      this.adjustStock(stockKey, diff);
    }

    const updated: KacchiAentRecord = {
      ...existing,
      ...data,
      quantity,
      rate_per_thousand: rate,
      total_amount,
    };
    list[idx] = updated;
    saveToStorage('kacchi', list);
    return updated;
  },

  // 4. Pakki & Bhatti Labor
  getBhattiRecords(): BhattiLaborRecord[] {
    return loadFromStorage('bhatti', SEED_BHATTI);
  },
  addBhattiRecord(record: {
    employee_id: number;
    work_type: 'Bhari' | 'Nikasi';
    entry_date: string;
    item_type?: 'Pakki_Aent' | 'Tile';
    quantity: number;
    rate_per_thousand: number;
    chamber_no?: string;
    notes?: string;
    aval_qty?: number;
    doem_qty?: number;
    soyem_qty?: number;
    tile_qty?: number;
    khangar_qty?: number;
    status?: 'Paid' | 'Unpaid';
  }): BhattiLaborRecord {
    const list = this.getBhattiRecords();
    const total_amount = (Number(record.quantity) / 1000.0) * Number(record.rate_per_thousand);
    const itemType = record.item_type || 'Pakki_Aent';
    const status = record.status || 'Paid';
    const newRecord: BhattiLaborRecord = {
      id: Date.now(),
      employee_id: record.employee_id,
      work_type: record.work_type,
      entry_date: record.entry_date,
      item_type: itemType,
      quantity: Number(record.quantity),
      rate_per_thousand: Number(record.rate_per_thousand),
      total_amount,
      chamber_no: record.chamber_no,
      notes: record.notes,
      aval_qty: record.aval_qty,
      doem_qty: record.doem_qty,
      soyem_qty: record.soyem_qty,
      tile_qty: record.tile_qty,
      khangar_qty: record.khangar_qty,
      status,
    };
    list.unshift(newRecord);
    saveToStorage('bhatti', list);

    if (record.work_type === 'Bhari') {
      // Deduct from Kacchi ground stock as loaded into kiln
      this.adjustStock(itemType === 'Tile' ? 'Tile' : 'Kacchi_Aent', -Number(record.quantity));
    } else if (record.work_type === 'Nikasi') {
      // Unloaded out of kiln into finished stock
      if (itemType === 'Tile') {
        const tQty = Number(record.tile_qty || record.quantity);
        this.adjustStock('Tile', tQty);
      } else {
        const aval = Number(record.aval_qty || record.quantity);
        this.adjustStock('Aent_Aval', aval);
        if (record.doem_qty) this.adjustStock('Aent_Doem', Number(record.doem_qty));
        if (record.soyem_qty) this.adjustStock('Aent_Soyem', Number(record.soyem_qty));
      }
    }
    return newRecord;
  },
  toggleBhattiStatus(id: number): void {
    const list = this.getBhattiRecords();
    const idx = list.findIndex(r => r.id === id);
    if (idx !== -1) {
      list[idx].status = list[idx].status === 'Unpaid' ? 'Paid' : 'Unpaid';
      saveToStorage('bhatti', list);
    }
  },
  updateBhattiRecord(id: number, data: Partial<BhattiLaborRecord>): void {
    const list = this.getBhattiRecords();
    const idx = list.findIndex(r => r.id === id);
    if (idx !== -1) {
      const existing = list[idx];
      const quantity = data.quantity !== undefined ? Number(data.quantity) : existing.quantity;
      const rate = data.rate_per_thousand !== undefined ? Number(data.rate_per_thousand) : existing.rate_per_thousand;
      const total_amount = (quantity / 1000.0) * rate;
      list[idx] = {
        ...existing,
        ...data,
        quantity,
        rate_per_thousand: rate,
        total_amount,
      };
      saveToStorage('bhatti', list);
    }
  },
  deleteBhattiRecord(id: number): void {
    const list = this.getBhattiRecords().filter(r => r.id !== id);
    saveToStorage('bhatti', list);
  },

  // 5. Worker Advance Ledger & Settlement
  getAdvances(): WorkerAdvance[] {
    return loadFromStorage('advances', SEED_ADVANCES);
  },
  addAdvance(record: { employee_id: number; advance_date: string; amount_paid: number; remarks: string; status?: 'Paid' | 'Unpaid' }): WorkerAdvance {
    const list = this.getAdvances();
    const newAdvance: WorkerAdvance = {
      id: Date.now(),
      employee_id: record.employee_id,
      advance_date: record.advance_date,
      amount_paid: Number(record.amount_paid),
      remarks: record.remarks,
      status: record.status || 'Paid',
    };
    list.unshift(newAdvance);
    saveToStorage('advances', list);
    return newAdvance;
  },
  toggleWorkerAdvanceStatus(id: number): void {
    const list = this.getAdvances();
    const idx = list.findIndex(a => a.id === id);
    if (idx !== -1) {
      list[idx].status = list[idx].status === 'Unpaid' ? 'Paid' : 'Unpaid';
      saveToStorage('advances', list);
    }
  },
  updateAdvance(id: number, data: Partial<WorkerAdvance>): WorkerAdvance | null {
    const list = this.getAdvances();
    const idx = list.findIndex(a => a.id === id);
    if (idx === -1) return null;
    list[idx] = {
      ...list[idx],
      ...data,
      amount_paid: data.amount_paid !== undefined ? Number(data.amount_paid) : list[idx].amount_paid,
    };
    saveToStorage('advances', list);
    return list[idx];
  },
  deleteAdvance(id: number): void {
    const list = this.getAdvances().filter(a => a.id !== id);
    saveToStorage('advances', list);
  },
  getWorkerSettlements() {
    const employees = this.getEmployees();
    const kacchi = this.getKacchiRecords();
    const bhatti = this.getBhattiRecords();
    const advances = this.getAdvances();

    return employees.map(emp => {
      const empKacchi = kacchi.filter(k => k.employee_id === emp.id).reduce((sum, k) => sum + k.total_amount, 0);
      const empBhari = bhatti.filter(b => b.employee_id === emp.id && b.work_type === 'Bhari').reduce((sum, b) => sum + b.total_amount, 0);
      const empNikasi = bhatti.filter(b => b.employee_id === emp.id && b.work_type === 'Nikasi').reduce((sum, b) => sum + b.total_amount, 0);
      const fixedSalary = emp.salary_type === 'Monthly_Salary' ? emp.monthly_salary_amount : 0;
      const totalEarned = empKacchi + empBhari + empNikasi + fixedSalary;
      const totalAdvance = advances.filter(a => a.employee_id === emp.id).reduce((sum, a) => sum + a.amount_paid, 0);
      const netPayable = totalEarned - totalAdvance;

      return {
        employee: emp,
        empKacchi,
        empBhari,
        empNikasi,
        fixedSalary,
        totalEarned,
        totalAdvance,
        netPayable,
      };
    });
  },

  // 6. Daily Expenses
  getExpenses(): DailyExpense[] {
    return loadFromStorage('expenses', SEED_EXPENSES);
  },
  getCategories(): ExpenseCategory[] {
    return loadFromStorage('expense_categories', SEED_CATEGORIES);
  },
  addExpense(exp: { title?: string; category_id: number; expense_date: string; amount: number; payment_mode: 'Cash' | 'Bank_Transfer' | 'Cheque'; paid_by: string; description: string }): DailyExpense {
    const list = this.getExpenses();
    const cats = this.getCategories();
    const foundCat = cats.find(c => c.id === Number(exp.category_id));
    const newExp: DailyExpense = {
      id: Date.now(),
      title: exp.title || (foundCat ? foundCat.category_name : 'Daily Expense'),
      category_id: Number(exp.category_id),
      category_name: foundCat ? foundCat.category_name : 'Miscellaneous',
      expense_date: exp.expense_date,
      amount: Number(exp.amount),
      payment_mode: exp.payment_mode,
      paid_by: exp.paid_by,
      description: exp.description,
    };
    list.unshift(newExp);
    saveToStorage('expenses', list);
    return newExp;
  },
  updateExpense(id: number, exp: { title?: string; category_id: number; expense_date: string; amount: number; payment_mode: 'Cash' | 'Bank_Transfer' | 'Cheque'; paid_by: string; description: string }): DailyExpense | null {
    const list = this.getExpenses();
    const cats = this.getCategories();
    const foundCat = cats.find(c => c.id === Number(exp.category_id));
    const index = list.findIndex(e => e.id === id);
    if (index === -1) return null;
    list[index] = {
      ...list[index],
      title: exp.title || list[index].title || (foundCat ? foundCat.category_name : 'Daily Expense'),
      category_id: Number(exp.category_id),
      category_name: foundCat ? foundCat.category_name : 'Miscellaneous',
      expense_date: exp.expense_date,
      amount: Number(exp.amount),
      payment_mode: exp.payment_mode,
      paid_by: exp.paid_by,
      description: exp.description,
    };
    saveToStorage('expenses', list);
    return list[index];
  },
  deleteExpense(id: number): void {
    const list = this.getExpenses().filter(e => e.id !== id);
    saveToStorage('expenses', list);
  },

  // 7. Matti Trolley & Fuel
  getMattiRecords(): MattiTrolleyRecord[] {
    return loadFromStorage('matti', SEED_MATTI);
  },
  addMattiRecord(record: { entry_date: string; trolley_count: number; rate_per_trolley: number; paid_amount: number; supplier_name: string; remarks: string }): MattiTrolleyRecord {
    const list = this.getMattiRecords();
    const total_amount = Number(record.trolley_count) * Number(record.rate_per_trolley);
    const newRecord: MattiTrolleyRecord = {
      id: Date.now(),
      entry_date: record.entry_date,
      trolley_count: Number(record.trolley_count),
      rate_per_trolley: Number(record.rate_per_trolley),
      total_amount,
      paid_amount: Number(record.paid_amount || 0),
      supplier_name: record.supplier_name,
      remarks: record.remarks,
    };
    list.unshift(newRecord);
    saveToStorage('matti', list);
    return newRecord;
  },
  deleteMattiRecord(id: number): void {
    const list = this.getMattiRecords().filter(m => m.id !== id);
    saveToStorage('matti', list);
  },
  updateMattiRecord(id: number, data: Partial<MattiTrolleyRecord>): MattiTrolleyRecord | null {
    const list = this.getMattiRecords();
    const idx = list.findIndex(m => m.id === id);
    if (idx === -1) return null;
    const existing = list[idx];
    const trolley_count = data.trolley_count !== undefined ? Number(data.trolley_count) : existing.trolley_count;
    const rate_per_trolley = data.rate_per_trolley !== undefined ? Number(data.rate_per_trolley) : existing.rate_per_trolley;
    const total_amount = trolley_count * rate_per_trolley;
    const paid_amount = data.paid_amount !== undefined ? Number(data.paid_amount) : existing.paid_amount;

    const updated: MattiTrolleyRecord = {
      ...existing,
      ...data,
      trolley_count,
      rate_per_trolley,
      total_amount,
      paid_amount,
    };
    list[idx] = updated;
    saveToStorage('matti', list);
    return updated;
  },

  getFuelRecords(): FuelMasalaExpense[] {
    return loadFromStorage('fuel', SEED_FUEL);
  },
  addFuelRecord(record: { entry_date: string; item_type: 'Lakri' | 'Kuila' | 'Masala_Bhura'; quantity: number; unit_rate: number; paid_amount?: number; supplier_name: string; remarks: string }): FuelMasalaExpense {
    const list = this.getFuelRecords();
    const total_amount = Number(record.quantity) * Number(record.unit_rate);
    const paid_amount = record.paid_amount !== undefined ? Number(record.paid_amount) : total_amount;
    const newRecord: FuelMasalaExpense = {
      id: Date.now(),
      entry_date: record.entry_date,
      item_type: record.item_type,
      quantity: Number(record.quantity),
      unit_rate: Number(record.unit_rate),
      total_amount,
      paid_amount,
      supplier_name: record.supplier_name,
      remarks: record.remarks,
    };
    list.unshift(newRecord);
    saveToStorage('fuel', list);
    return newRecord;
  },
  deleteFuelRecord(id: number): void {
    const list = this.getFuelRecords().filter(f => f.id !== id);
    saveToStorage('fuel', list);
  },
  updateFuelRecord(id: number, data: Partial<FuelMasalaExpense>): FuelMasalaExpense | null {
    const list = this.getFuelRecords();
    const idx = list.findIndex(f => f.id === id);
    if (idx === -1) return null;
    const existing = list[idx];
    const quantity = data.quantity !== undefined ? Number(data.quantity) : existing.quantity;
    const unit_rate = data.unit_rate !== undefined ? Number(data.unit_rate) : existing.unit_rate;
    const total_amount = quantity * unit_rate;
    const paid_amount = data.paid_amount !== undefined ? Number(data.paid_amount) : (existing.paid_amount ?? total_amount);

    const updated: FuelMasalaExpense = {
      ...existing,
      ...data,
      quantity,
      unit_rate,
      total_amount,
      paid_amount,
    };
    list[idx] = updated;
    saveToStorage('fuel', list);
    return updated;
  },

  // 8. Stocks
  getStocks(): StockInventory[] {
    return loadFromStorage('stocks', SEED_STOCKS);
  },
  adjustStock(item_name: StockInventory['item_name'], change: number): void {
    const list = this.getStocks();
    const idx = list.findIndex(s => s.item_name === item_name);
    if (idx !== -1) {
      list[idx].current_stock = Math.max(0, list[idx].current_stock + change);
      list[idx].last_updated = new Date().toISOString();
    } else {
      list.push({ id: Date.now(), item_name, current_stock: Math.max(0, change), last_updated: new Date().toISOString() });
    }
    saveToStorage('stocks', list);
  },
  setStock(item_name: StockInventory['item_name'], current_stock: number): void {
    const list = this.getStocks();
    const idx = list.findIndex(s => s.item_name === item_name);
    if (idx !== -1) {
      list[idx].current_stock = current_stock;
      list[idx].last_updated = new Date().toISOString();
    } else {
      list.push({ id: Date.now(), item_name, current_stock, last_updated: new Date().toISOString() });
    }
    saveToStorage('stocks', list);
  },

  // 9. Customers & Ledger
  getCustomers(): Customer[] {
    return loadFromStorage('customers', SEED_CUSTOMERS);
  },
  saveCustomer(customer: Partial<Customer>): Customer {
    const list = this.getCustomers();
    if (customer.id) {
      const idx = list.findIndex(c => c.id === customer.id);
      if (idx !== -1) {
        list[idx] = { ...list[idx], ...customer } as Customer;
        saveToStorage('customers', list);
        return list[idx];
      }
    }
    const newCust: Customer = {
      id: Date.now(),
      customer_name: customer.customer_name || 'New Customer',
      phone: customer.phone || '',
      address: customer.address || '',
      opening_balance: Number(customer.opening_balance || 0),
    };
    list.unshift(newCust);
    saveToStorage('customers', list);
    return newCust;
  },
  deleteCustomer(id: number): void {
    const list = this.getCustomers().filter(c => c.id !== id);
    saveToStorage('customers', list);
  },
  getPayments(): CustomerPayment[] {
    return loadFromStorage('payments', SEED_PAYMENTS);
  },
  addCustomerPayment(payment: { customer_id: number; payment_date: string; amount_received: number; payment_mode: 'Cash' | 'Bank_Transfer' | 'Cheque'; reference_no: string; notes: string }): CustomerPayment {
    const list = this.getPayments();
    const cust = this.getCustomers().find(c => c.id === payment.customer_id);
    const newPay: CustomerPayment = {
      id: Date.now(),
      customer_id: payment.customer_id,
      customer_name: cust?.customer_name || 'Customer',
      payment_date: payment.payment_date,
      amount_received: Number(payment.amount_received),
      payment_mode: payment.payment_mode,
      reference_no: payment.reference_no,
      notes: payment.notes,
    };
    list.unshift(newPay);
    saveToStorage('payments', list);
    return newPay;
  },
  getCustomerStatement(customerId: number) {
    const cust = this.getCustomers().find(c => c.id === customerId);
    const invoices = this.getInvoices().filter(i => i.customer_id === customerId);
    const payments = this.getPayments().filter(p => p.customer_id === customerId);

    const openingBalance = Number(cust?.opening_balance) || 0;
    const totalBilled = invoices.reduce((sum, inv) => sum + (Number(inv.net_total_amount) || 0), 0);
    const totalPaid = payments.reduce((sum, p) => sum + (Number(p.amount_received) || 0), 0);
    const currentBalance = (openingBalance + totalBilled) - totalPaid;

    // Build timeline
    const timeline = [
      ...invoices.map(i => ({
        date: i.invoice_date,
        type: 'Invoice',
        ref: i.invoice_number,
        description: `${(i.item_type || 'Item').replace('_', ' ')} (${(Number(i.quantity) || 0).toLocaleString()} units @ Rs.${Number(i.rate_per_thousand) || 0}/thousand)`,
        debit: Number(i.net_total_amount) || 0,
        credit: 0,
      })),
      ...payments.map(p => ({
        date: p.payment_date,
        type: 'Payment',
        ref: p.reference_no || 'Cash Receipt',
        description: `Payment via ${p.payment_mode || 'Cash'} - ${p.notes || ''}`,
        debit: 0,
        credit: Number(p.amount_received) || 0,
      })),
    ].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    let running = openingBalance;
    const ledger = timeline.map(row => {
      running = running + (Number(row.debit) || 0) - (Number(row.credit) || 0);
      return { ...row, balance: running, runningBalance: running };
    });

    return {
      customer: cust,
      openingBalance,
      totalBilled,
      totalPaid,
      currentBalance,
      ledger,
    };
  },

  // 10. Invoicing & Sales
  getInvoices(): SalesInvoice[] {
    return loadFromStorage('invoices', SEED_INVOICES);
  },
  createSalesInvoice(invoice: {
    customer_id: number;
    customer_name?: string;
    invoice_date: string;
    item_type: SalesInvoice['item_type'];
    quantity: number;
    rate_per_thousand: number;
    kiraya_freight: number;
    destination_address: string;
    driver_name?: string;
  }): SalesInvoice {
    const list = this.getInvoices();
    const cust = this.getCustomers().find(c => c.id === invoice.customer_id);
    const base_amount = (Number(invoice.quantity) / 1000.0) * Number(invoice.rate_per_thousand);
    const net_total_amount = base_amount + Number(invoice.kiraya_freight || 0);
    const invCount = list.length + 1;
    const invoice_number = `CSB-${new Date().getFullYear()}-${String(invCount).padStart(4, '0')}`;

    const newInvoice: SalesInvoice = {
      id: Date.now(),
      invoice_number,
      customer_id: invoice.customer_id,
      customer_name: invoice.customer_name || cust?.customer_name || 'Direct Customer',
      invoice_date: invoice.invoice_date,
      item_type: invoice.item_type,
      quantity: Number(invoice.quantity),
      rate_per_thousand: Number(invoice.rate_per_thousand),
      base_amount,
      kiraya_freight: Number(invoice.kiraya_freight || 0),
      net_total_amount,
      destination_address: invoice.destination_address,
      driver_name: invoice.driver_name || 'Bhatta Transport',
    };

    list.unshift(newInvoice);
    saveToStorage('invoices', list);

    // Auto deduct from stock
    this.adjustStock(invoice.item_type, -Number(invoice.quantity));

    return newInvoice;
  },
  deleteInvoice(id: number): void {
    const list = this.getInvoices().filter(i => i.id !== id);
    saveToStorage('invoices', list);
  },
  updateInvoice(id: number, data: Partial<SalesInvoice>): SalesInvoice | null {
    const list = this.getInvoices();
    const idx = list.findIndex(i => i.id === id);
    if (idx === -1) return null;
    const existing = list[idx];

    let customer_name = data.customer_name || existing.customer_name;
    if (data.customer_id && data.customer_id !== existing.customer_id) {
      const cust = this.getCustomers().find(c => c.id === data.customer_id);
      if (cust) customer_name = data.customer_name || cust.customer_name;
    }

    const quantity = data.quantity !== undefined ? Number(data.quantity) : existing.quantity;
    const rate = data.rate_per_thousand !== undefined ? Number(data.rate_per_thousand) : existing.rate_per_thousand;
    const base_amount = (quantity / 1000.0) * rate;
    const kiraya_freight = data.kiraya_freight !== undefined ? Number(data.kiraya_freight) : existing.kiraya_freight;
    const net_total_amount = base_amount + kiraya_freight;

    // Adjust stock delta if quantity or item_type changed
    const targetItem = data.item_type || existing.item_type;
    if (targetItem === existing.item_type) {
      const qtyDelta = existing.quantity - quantity; // if new quantity is smaller, add back; if bigger, deduct
      if (qtyDelta !== 0) {
        this.adjustStock(targetItem, qtyDelta);
      }
    } else {
      // Returned old item, deducted new item
      this.adjustStock(existing.item_type, existing.quantity);
      this.adjustStock(targetItem, -quantity);
    }

    const updated: SalesInvoice = {
      ...existing,
      ...data,
      customer_name,
      quantity,
      rate_per_thousand: rate,
      base_amount,
      kiraya_freight,
      net_total_amount,
    };

    list[idx] = updated;
    saveToStorage('invoices', list);
    return updated;
  },

  // 11. Staff Salaries & Payroll Tracking
  getStaffSalaries(): StaffSalaryPayment[] {
    return loadFromStorage('staff_salaries', SEED_STAFF_SALARIES);
  },
  saveStaffSalary(salary: Partial<StaffSalaryPayment>): StaffSalaryPayment {
    const list = this.getStaffSalaries();
    if (salary.id) {
      const idx = list.findIndex(s => s.id === salary.id);
      if (idx !== -1) {
        list[idx] = { ...list[idx], ...salary } as StaffSalaryPayment;
        saveToStorage('staff_salaries', list);
        return list[idx];
      }
    }
    const newSal: StaffSalaryPayment = {
      id: Date.now(),
      employee_id: salary.employee_id || 1,
      employee_name: salary.employee_name || 'Staff Member',
      month_period: salary.month_period || `${new Date().toLocaleString('default', { month: 'long' })} ${new Date().getFullYear()}`,
      base_salary: Number(salary.base_salary || 0),
      advance_deducted: Number(salary.advance_deducted || 0),
      net_payable: Number(salary.net_payable || (Number(salary.base_salary || 0) - Number(salary.advance_deducted || 0))),
      paid_amount: Number(salary.paid_amount || (Number(salary.base_salary || 0) - Number(salary.advance_deducted || 0))),
      payment_date: salary.payment_date || new Date().toISOString().split('T')[0],
      status: salary.status || 'Paid',
      remarks: salary.remarks || '',
    };
    list.unshift(newSal);
    saveToStorage('staff_salaries', list);
    return newSal;
  },
  toggleStaffSalaryStatus(id: number): StaffSalaryPayment | null {
    const list = this.getStaffSalaries();
    const idx = list.findIndex(s => s.id === id);
    if (idx === -1) return null;
    list[idx].status = list[idx].status === 'Paid' ? 'Unpaid' : 'Paid';
    saveToStorage('staff_salaries', list);
    return list[idx];
  },

  getAllExpensesWithSalaries(): DailyExpense[] {
    const directExpenses = this.getExpenses();
    const staffSalaries = this.getStaffSalaries().filter(s => s.status === 'Paid');
    const laborAdvances = this.getAdvances().filter(a => a.status !== 'Unpaid');
    const mattiRecords = this.getMattiRecords();
    const fuelRecords = this.getFuelRecords();
    const emps = this.getEmployees();

    const mappedSalaries: DailyExpense[] = [
      ...staffSalaries.map(s => ({
        id: -1000 - s.id,
        title: `Staff Salary - ${s.employee_name}`,
        category_id: 6,
        category_name: 'Staff Salary',
        expense_date: s.payment_date,
        amount: Number(s.paid_amount || s.net_payable) || 0,
        payment_mode: 'Cash' as const,
        paid_by: 'Munshi Sarwar',
        description: `Staff Salary for ${s.month_period} (Advance Deducted: Rs. ${s.advance_deducted.toLocaleString()})`,
        is_salary_mapped: true,
      })),
      ...laborAdvances.map(a => {
        const emp = emps.find(e => e.id === a.employee_id);
        return {
          id: -2000 - a.id,
          title: `Labor Advance - ${emp?.full_name || 'Worker'}`,
          category_id: 6,
          category_name: 'Staff Salary',
          expense_date: a.advance_date,
          amount: Number(a.amount_paid) || 0,
          payment_mode: 'Cash' as const,
          paid_by: 'Munshi Sarwar',
          description: `Worker Advance: ${a.remarks || 'Advance payout'}`,
          is_salary_mapped: true,
        };
      }),
    ];

    const mappedMatti: DailyExpense[] = mattiRecords.map(m => ({
      id: -3000 - m.id,
      title: `مٹی ٹرالی - ${m.supplier_name || 'سپلائر'} (${m.trolley_count} ٹرالی)`,
      category_id: 8,
      category_name: 'Matti Trolley',
      expense_date: m.entry_date,
      amount: Number(m.paid_amount !== undefined && m.paid_amount > 0 ? m.paid_amount : m.total_amount) || Number(m.total_amount) || 0,
      payment_mode: 'Cash' as const,
      paid_by: 'Munshi Sarwar',
      description: `مٹی ٹرالی کھاتہ: ${m.trolley_count} ٹرالیاں @ Rs. ${m.rate_per_trolley} = Rs. ${m.total_amount.toLocaleString()} (ادا شدہ: Rs. ${(m.paid_amount || 0).toLocaleString()})${m.remarks ? ' - ' + m.remarks : ''}`,
      is_salary_mapped: true,
    }));

    const fuelItemLabels: Record<string, string> = {
      'Lakri': 'لکڑی (Wood)',
      'Kuila': 'کوئلہ (Coal)',
      'Masala_Bhura': 'مسالحہ / بھورا (Bhoosa)',
    };

    const mappedFuel: DailyExpense[] = fuelRecords.map(f => ({
      id: -4000 - f.id,
      title: `${fuelItemLabels[f.item_type] || f.item_type} - ${f.supplier_name || 'سپلائر'}`,
      category_id: 2,
      category_name: 'Generator & Fuel',
      expense_date: f.entry_date,
      amount: Number(f.paid_amount !== undefined && f.paid_amount > 0 ? f.paid_amount : f.total_amount) || Number(f.total_amount) || 0,
      payment_mode: 'Cash' as const,
      paid_by: 'Munshi Sarwar',
      description: `ایندھن/کوئلہ کھاتہ: ${f.quantity} مقدار @ Rs. ${f.unit_rate} = Rs. ${f.total_amount.toLocaleString()} (ادا شدہ: Rs. ${(f.paid_amount !== undefined ? f.paid_amount : f.total_amount).toLocaleString()})${f.remarks ? ' - ' + f.remarks : ''}`,
      is_salary_mapped: true,
    }));

    return [...directExpenses, ...mappedSalaries, ...mappedMatti, ...mappedFuel].sort(
      (a, b) => new Date(b.expense_date).getTime() - new Date(a.expense_date).getTime()
    );
  },

  // Executive Dashboard Aggregation
  getExecutiveDashboardStats(range?: { startDate: string; endDate: string }) {
    const today = getLocalDateString(new Date());
    const kacchiAll = this.getKacchiRecords();
    const bhattiAll = this.getBhattiRecords();
    const invoicesAll = this.getInvoices();
    const paymentsAll = this.getPayments();
    const customers = this.getCustomers();
    const advancesAll = this.getAdvances();
    const expensesAll = this.getExpenses();
    const mattiAll = this.getMattiRecords();
    const fuelAll = this.getFuelRecords();
    const stocks = this.getStocks();
    const staffSalariesAll = this.getStaffSalaries();
    const employeesAll = this.getEmployees();

    const normalizeDate = (d?: string | number): string => {
      if (!d) return '';
      if (typeof d === 'number') d = new Date(d).toISOString();
      let str = String(d).trim();
      if (/^\d{1,2}[-/]\d{1,2}[-/]\d{4}/.test(str)) {
        const parts = str.split(/[-/]/);
        return `${parts[2]}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}`;
      }
      return str.slice(0, 10).replace(/\//g, '-');
    };

    const isDateInRange = (dateStr?: string) => {
      if (!range || (!range.startDate && !range.endDate)) return true;
      if (!dateStr) return true;
      const target = normalizeDate(dateStr);
      if (!target) return true;
      const start = normalizeDate(range.startDate);
      const end = normalizeDate(range.endDate);
      if (start && target < start) return false;
      if (end && target > end) return false;
      return true;
    };

    const kacchi = kacchiAll.filter(k => isDateInRange(k.entry_date || (k as any).date || (k as any).created_at));
    const bhatti = bhattiAll.filter(b => isDateInRange(b.entry_date || (b as any).date || (b as any).created_at));
    const invoices = invoicesAll.filter(i => isDateInRange(i.invoice_date || (i as any).date || (i as any).created_at || (i as any).entry_date));
    const payments = paymentsAll.filter(p => isDateInRange(p.payment_date || (p as any).date || (p as any).created_at));
    const advances = advancesAll.filter(a => isDateInRange(a.advance_date || (a as any).date || (a as any).created_at));
    const expenses = expensesAll.filter(e => isDateInRange(e.expense_date || (e as any).date || (e as any).created_at));
    const matti = mattiAll.filter(m => isDateInRange(m.entry_date || (m as any).date || (m as any).created_at));
    const fuel = fuelAll.filter(f => isDateInRange(f.entry_date || (f as any).date || (f as any).created_at));

    const todayKacchiQty = kacchiAll.filter(k => normalizeDate(k.entry_date) === today).reduce((sum, k) => sum + (Number(k.quantity) || 0), 0);
    const todayBhariQty = bhattiAll.filter(b => normalizeDate(b.entry_date) === today && b.work_type === 'Bhari').reduce((sum, b) => sum + (Number(b.quantity) || 0), 0);
    const todayNikasiQty = bhattiAll.filter(b => normalizeDate(b.entry_date) === today && b.work_type === 'Nikasi').reduce((sum, b) => sum + (Number(b.quantity) || 0), 0);

    const totalKacchiQty = kacchi.reduce((sum, k) => sum + (Number(k.quantity) || 0), 0);
    const kacchiAentQty = kacchi.filter(k => (k.item_type || 'Kacchi_Aent') !== 'Tile').reduce((sum, k) => sum + (Number(k.quantity) || 0), 0);
    const kacchiTileQty = kacchi.filter(k => k.item_type === 'Tile').reduce((sum, k) => sum + (Number(k.quantity) || 0), 0);

    const nikasiRecords = bhatti.filter(b => b.work_type === 'Nikasi' || !b.work_type);
    const totalNikasiQty = nikasiRecords.reduce((sum, b) => sum + (Number(b.quantity) || 0), 0);
    const pakkiTileQty = nikasiRecords.reduce((sum, b) => {
      if (b.tile_qty !== undefined && Number(b.tile_qty) > 0) return sum + Number(b.tile_qty);
      if (b.item_type === 'Tile') return sum + (Number(b.quantity) || 0);
      return sum;
    }, 0);
    const pakkiAentQty = Math.max(0, totalNikasiQty - pakkiTileQty);
    const pakkiAvalQty = nikasiRecords.reduce((sum, b) => sum + (Number(b.aval_qty) || 0), 0);
    const pakkiDoemQty = nikasiRecords.reduce((sum, b) => sum + (Number(b.doem_qty) || 0), 0);
    const pakkiSoyemQty = nikasiRecords.reduce((sum, b) => sum + (Number(b.soyem_qty) || 0), 0);
    const totalProductionAll = totalKacchiQty + totalNikasiQty;

    // All-time totals across entire database
    const allTimeKacchiAent = kacchiAll.filter(k => (k.item_type || 'Kacchi_Aent') !== 'Tile').reduce((sum, k) => sum + (Number(k.quantity) || 0), 0);
    const allTimeKacchiTile = kacchiAll.filter(k => k.item_type === 'Tile').reduce((sum, k) => sum + (Number(k.quantity) || 0), 0);
    const allNikasiRecords = bhattiAll.filter(b => b.work_type === 'Nikasi' || !b.work_type);
    const allTimeNikasiQty = allNikasiRecords.reduce((sum, b) => sum + (Number(b.quantity) || 0), 0);
    const allTimePakkiTile = allNikasiRecords.reduce((sum, b) => {
      if (b.tile_qty !== undefined && Number(b.tile_qty) > 0) return sum + Number(b.tile_qty);
      if (b.item_type === 'Tile') return sum + (Number(b.quantity) || 0);
      return sum;
    }, 0);
    const allTimePakkiAent = Math.max(0, allTimeNikasiQty - allTimePakkiTile);
    const allTimePakkiAval = allNikasiRecords.reduce((sum, b) => sum + (Number(b.aval_qty) || 0), 0);
    const allTimePakkiDoem = allNikasiRecords.reduce((sum, b) => sum + (Number(b.doem_qty) || 0), 0);
    const allTimePakkiSoyem = allNikasiRecords.reduce((sum, b) => sum + (Number(b.soyem_qty) || 0), 0);

    const totalSalesRevenue = invoices.reduce((sum, i) => {
      const val = Number(i.net_total_amount ?? (i as any).total_amount ?? (i as any).base_amount ?? (i as any).amount ?? 0);
      return sum + val;
    }, 0);
    const totalPaymentsReceived = payments.reduce((sum, p) => sum + (Number(p.amount_received) || 0), 0);
    const totalOpeningBalances = customers.reduce((sum, c) => sum + (Number(c.opening_balance) || 0), 0);
    const totalOutstandingCustomerBalances = Math.max(0, (invoicesAll.reduce((sum, i) => sum + (Number(i.net_total_amount ?? (i as any).total_amount ?? 0)), 0) + totalOpeningBalances) - paymentsAll.reduce((sum, p) => sum + (Number(p.amount_received) || 0), 0));

    const totalWorkerAdvancesGiven = advances.reduce((sum, a) => sum + (Number(a.amount_paid) || 0), 0);

    // Salary & Staff stats
    const monthlyStaff = employeesAll.filter(e => e.status === 'Active' && e.salary_type === 'Monthly_Salary');
    const totalStaffMonthlyBase = monthlyStaff.reduce((sum, e) => sum + (Number(e.monthly_salary_amount) || 0), 0);
    const totalStaffSalaryPaid = staffSalariesAll.filter(s => s.status === 'Paid' && isDateInRange(s.payment_date)).reduce((sum, s) => sum + (Number(s.paid_amount || s.net_payable) || 0), 0);
    const totalStaffSalaryRemaining = Math.max(0, totalStaffMonthlyBase - totalStaffSalaryPaid);

    const totalLaborWages = kacchi.reduce((sum, k) => sum + (Number(k.total_amount) || 0), 0) + bhatti.reduce((sum, b) => sum + (Number(b.total_amount) || 0), 0);
    const totalLaborAdvances = advances.reduce((sum, a) => sum + (Number(a.amount_paid) || 0), 0);
    const totalLaborRemaining = Math.max(0, totalLaborWages - totalLaborAdvances);

    const totalSalariesPaid = totalStaffSalaryPaid + totalLaborAdvances;
    const totalSalariesRemaining = totalStaffSalaryRemaining + totalLaborRemaining;

    // Total Costs (Integrating General Expenses, Matti Trolley, Fuel, Labor Wages, and Staff Salaries)
    const totalGeneralExpenses = expenses.reduce((sum, e) => sum + (Number(e.amount) || 0), 0);
    const totalMattiCost = matti.reduce((sum, m) => sum + (Number(m.total_amount) || 0), 0);
    const totalFuelCost = fuel.reduce((sum, f) => sum + (Number(f.total_amount) || 0), 0);
    const totalLaborCost = totalLaborWages;
    const totalAllExpenses = totalGeneralExpenses + totalMattiCost + totalFuelCost + totalLaborCost + totalStaffSalaryPaid;
    const netProfitOrLoss = totalSalesRevenue - totalAllExpenses;

    // Matti Trolley Khata aggregation for selected range
    const totalMattiBill = matti.reduce((sum, m) => sum + (Number(m.total_amount) || 0), 0);
    const totalMattiPaid = matti.reduce((sum, m) => sum + (Number(m.paid_amount) || 0), 0);
    const totalMattiPending = Math.max(0, totalMattiBill - totalMattiPaid);
    const totalMattiTrolleys = matti.reduce((sum, m) => sum + (Number(m.trolley_count) || 0), 0);

    // Fuel & Coal Khata aggregation for selected range
    const totalFuelBill = fuel.reduce((sum, f) => sum + (Number(f.total_amount) || 0), 0);
    const totalFuelPaid = fuel.reduce((sum, f) => sum + (Number(f.paid_amount) || 0), 0);
    const totalFuelPending = Math.max(0, totalFuelBill - totalFuelPaid);
    const totalFuelQuantity = fuel.reduce((sum, f) => sum + (Number(f.quantity) || 0), 0);

    const stockMap: Record<string, number> = {};
    stocks.forEach(s => {
      stockMap[s.item_name] = Number(s.current_stock) || 0;
    });

    return {
      todayProduction: {
        kacchi: todayKacchiQty,
        bhari: todayBhariQty,
        nikasi: todayNikasiQty,
        totalToday: todayKacchiQty + todayNikasiQty,
        totalOverall: totalProductionAll,
        totalKacchiAll: totalKacchiQty,
        totalNikasiAll: totalNikasiQty,
        kacchiAent: kacchiAentQty,
        kacchiTile: kacchiTileQty,
        pakkiAent: pakkiAentQty,
        pakkiTile: pakkiTileQty,
        pakkiAval: pakkiAvalQty,
        pakkiDoem: pakkiDoemQty,
        pakkiSoyem: pakkiSoyemQty,
        allTimeKacchiAent,
        allTimeKacchiTile,
        allTimePakkiAent,
        allTimePakkiTile,
        allTimePakkiAval,
        allTimePakkiDoem,
        allTimePakkiSoyem,
      },
      financials: {
        totalSalesRevenue,
        totalPaymentsReceived,
        totalOutstandingCustomerBalances: Math.max(0, totalOutstandingCustomerBalances),
        totalWorkerAdvancesGiven,
        totalStaffSalaryPaid,
        totalStaffSalaryRemaining,
        totalSalariesPaid,
        totalSalariesRemaining,
        totalAllExpenses,
        netProfitOrLoss,
      },
      expenseBreakdown: {
        totalAllExpenses,
        salaries: totalLaborCost + totalStaffSalaryPaid,
        salariesPaid: totalSalariesPaid,
        salariesRemaining: totalSalariesRemaining,
        matti: totalMattiCost,
        mattiPaid: totalMattiPaid,
        mattiPending: totalMattiPending,
        mattiTrolleys: totalMattiTrolleys,
        fuel: totalFuelCost,
        fuelPaid: totalFuelPaid,
        fuelPending: totalFuelPending,
        fuelQuantity: totalFuelQuantity,
        generalExpenses: totalGeneralExpenses,
      },
      matti: {
        totalBill: totalMattiBill,
        totalPaid: totalMattiPaid,
        totalPending: totalMattiPending,
        trolleyCount: totalMattiTrolleys,
      },
      fuel: {
        totalBill: totalFuelBill,
        totalPaid: totalFuelPaid,
        totalPending: totalFuelPending,
        totalQuantity: totalFuelQuantity,
      },
      stocks: {
        aval: stockMap['Aent_Aval'] || 0,
        doem: stockMap['Aent_Doem'] || 0,
        soyem: stockMap['Aent_Soyem'] || 0,
        tile: stockMap['Tile'] || 0,
        kacchi: stockMap['Kacchi_Aent'] || 0,
        kacchiTile: stockMap['Kacchi_Tile'] || 0,
      },
    };
  },

  // 12. Drivers & Vehicles
  getDriversVehicles(): DriverVehicle[] {
    return loadFromStorage('drivers_vehicles', SEED_DRIVERS_VEHICLES);
  },
  saveDriverVehicle(item: Partial<DriverVehicle>): DriverVehicle {
    const list = this.getDriversVehicles();
    if (item.id) {
      const idx = list.findIndex(v => v.id === item.id);
      if (idx !== -1) {
        list[idx] = { ...list[idx], ...item } as DriverVehicle;
        saveToStorage('drivers_vehicles', list);
        return list[idx];
      }
    }
    const newItem: DriverVehicle = {
      id: Date.now(),
      driver_name: item.driver_name || 'Driver',
      vehicle_no: item.vehicle_no || 'Trolley',
      vehicle_type: item.vehicle_type || 'Tractor Trolley',
      phone: item.phone || '',
    };
    list.unshift(newItem);
    saveToStorage('drivers_vehicles', list);
    return newItem;
  },
  deleteDriverVehicle(id: number): void {
    const list = this.getDriversVehicles().filter(v => v.id !== id);
    saveToStorage('drivers_vehicles', list);
  },
};
