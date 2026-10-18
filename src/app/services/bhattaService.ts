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
  quantity: number;
  rate_per_thousand: number;
  total_amount: number;
}

export interface PakkiAentRecord {
  id: number;
  employee_id: number;
  entry_date: string;
  quantity: number;
  rate_per_thousand: number;
  total_amount: number;
}

export interface BhattiLaborRecord {
  id: number;
  employee_id: number;
  work_type: 'Bhari' | 'Nikasi';
  entry_date: string;
  quantity: number;
  rate_per_thousand: number;
  total_amount: number;
  chamber_no?: string;
  notes?: string;
  aval_qty?: number;
  doem_qty?: number;
  soyem_qty?: number;
  khangar_qty?: number;
}

export interface WorkerAdvance {
  id: number;
  employee_id: number;
  advance_date: string;
  amount_paid: number;
  remarks: string;
}

export interface ExpenseCategory {
  id: number;
  category_name: string;
}

export interface DailyExpense {
  id: number;
  category_id: number;
  category_name?: string;
  expense_date: string;
  amount: number;
  payment_mode: 'Cash' | 'Bank_Transfer' | 'Cheque';
  paid_by: string;
  description: string;
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
}

export interface StockInventory {
  id: number;
  item_name: 'Aent_Aval' | 'Aent_Doem' | 'Aent_Soyem' | 'Tile' | 'Kacchi_Aent';
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
];

const SEED_STOCKS: StockInventory[] = [
  { id: 1, item_name: 'Aent_Aval', current_stock: 85000 },
  { id: 2, item_name: 'Aent_Doem', current_stock: 42000 },
  { id: 3, item_name: 'Aent_Soyem', current_stock: 18000 },
  { id: 4, item_name: 'Tile', current_stock: 25000 },
  { id: 5, item_name: 'Kacchi_Aent', current_stock: 120000 },
];

const todayStr = new Date().toISOString().split('T')[0];
const yesterdayStr = new Date(Date.now() - 86400000).toISOString().split('T')[0];
const twoDaysAgoStr = new Date(Date.now() - 172800000).toISOString().split('T')[0];

const SEED_KACCHI: KacchiAentRecord[] = [
  { id: 1, employee_id: 2, entry_date: todayStr, quantity: 7500, rate_per_thousand: 1500, total_amount: 11250 },
  { id: 2, employee_id: 7, entry_date: todayStr, quantity: 7500, rate_per_thousand: 1500, total_amount: 11250 },
  { id: 3, employee_id: 2, entry_date: yesterdayStr, quantity: 7500, rate_per_thousand: 1500, total_amount: 11250 },
  { id: 4, employee_id: 7, entry_date: yesterdayStr, quantity: 7500, rate_per_thousand: 1500, total_amount: 11250 },
];

const SEED_BHATTI: BhattiLaborRecord[] = [
  { id: 1, employee_id: 3, work_type: 'Bhari', entry_date: todayStr, quantity: 10000, rate_per_thousand: 500, total_amount: 5000 },
  { id: 2, employee_id: 5, work_type: 'Nikasi', entry_date: todayStr, quantity: 10000, rate_per_thousand: 500, total_amount: 5000 },
  { id: 3, employee_id: 3, work_type: 'Bhari', entry_date: yesterdayStr, quantity: 10000, rate_per_thousand: 500, total_amount: 5000 },
  { id: 4, employee_id: 5, work_type: 'Nikasi', entry_date: yesterdayStr, quantity: 10000, rate_per_thousand: 500, total_amount: 5000 },
];

const SEED_ADVANCES: WorkerAdvance[] = [
  { id: 1, employee_id: 2, advance_date: twoDaysAgoStr, amount_paid: 8000, remarks: 'Family medical expense advance' },
  { id: 2, employee_id: 3, advance_date: yesterdayStr, amount_paid: 6000, remarks: 'Ration kharcha advance' },
  { id: 3, employee_id: 5, advance_date: todayStr, amount_paid: 5000, remarks: 'Home maintenance advance' },
  { id: 4, employee_id: 7, advance_date: twoDaysAgoStr, amount_paid: 6000, remarks: 'Weekly labor advance' },
];

const SEED_EXPENSES: DailyExpense[] = [
  { id: 1, category_id: 1, category_name: 'Chai & Food', expense_date: todayStr, amount: 3500, payment_mode: 'Cash', paid_by: 'Munshi Sarwar', description: 'Labor tea, biscuits & lunch' },
  { id: 2, category_id: 2, category_name: 'Generator & Fuel', expense_date: todayStr, amount: 6500, payment_mode: 'Cash', paid_by: 'Munshi Sarwar', description: 'Diesel for tractor trolley & tube well' },
  { id: 3, category_id: 3, category_name: 'Machinery Maintenance', expense_date: yesterdayStr, amount: 3000, payment_mode: 'Cash', paid_by: 'Seth Haji Nasir', description: 'Gari grease and bearing replacement' },
  { id: 4, category_id: 7, category_name: 'Miscellaneous', expense_date: yesterdayStr, amount: 2000, payment_mode: 'Cash', paid_by: 'Munshi Sarwar', description: 'Bhatta lighting bulbs & wires' },
];

const SEED_MATTI: MattiTrolleyRecord[] = [
  { id: 1, entry_date: todayStr, trolley_count: 5, rate_per_trolley: 2500, total_amount: 12500, paid_amount: 12500, supplier_name: 'Akram Matti Supply', remarks: 'Good quality chikni matti (paid cash)' },
  { id: 2, entry_date: yesterdayStr, trolley_count: 5, rate_per_trolley: 2500, total_amount: 12500, paid_amount: 12500, supplier_name: 'Akram Matti Supply', remarks: 'Paid fully via Cash' },
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
const CURRENT_DATA_VERSION = 'v5_accurate_flow_calibrated';
if (typeof window !== 'undefined') {
  try {
    const savedVersion = localStorage.getItem('bhatta_data_version');
    if (savedVersion !== CURRENT_DATA_VERSION) {
      const keysToClear = [
        'employees', 'customers', 'categories', 'stocks', 'kacchi',
        'bhatti', 'advances', 'expenses', 'matti', 'fuel', 'invoices',
        'payments', 'attendance'
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
  addKacchiRecord(record: { employee_id: number; entry_date: string; quantity: number; rate_per_thousand: number }): KacchiAentRecord {
    const list = this.getKacchiRecords();
    const total_amount = (Number(record.quantity) / 1000.0) * Number(record.rate_per_thousand);
    const newRecord: KacchiAentRecord = {
      id: Date.now(),
      employee_id: record.employee_id,
      entry_date: record.entry_date,
      quantity: Number(record.quantity),
      rate_per_thousand: Number(record.rate_per_thousand),
      total_amount,
    };
    list.unshift(newRecord);
    saveToStorage('kacchi', list);

    // Increment Kacchi ground stock
    this.adjustStock('Kacchi_Aent', Number(record.quantity));
    return newRecord;
  },
  deleteKacchiRecord(id: number): void {
    const list = this.getKacchiRecords().filter(r => r.id !== id);
    saveToStorage('kacchi', list);
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
      this.adjustStock('Kacchi_Aent', diff);
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
    quantity: number;
    rate_per_thousand: number;
    chamber_no?: string;
    notes?: string;
    aval_qty?: number;
    doem_qty?: number;
    soyem_qty?: number;
    khangar_qty?: number;
  }): BhattiLaborRecord {
    const list = this.getBhattiRecords();
    const total_amount = (Number(record.quantity) / 1000.0) * Number(record.rate_per_thousand);
    const newRecord: BhattiLaborRecord = {
      id: Date.now(),
      employee_id: record.employee_id,
      work_type: record.work_type,
      entry_date: record.entry_date,
      quantity: Number(record.quantity),
      rate_per_thousand: Number(record.rate_per_thousand),
      total_amount,
      chamber_no: record.chamber_no,
      notes: record.notes,
      aval_qty: record.aval_qty,
      doem_qty: record.doem_qty,
      soyem_qty: record.soyem_qty,
      khangar_qty: record.khangar_qty,
    };
    list.unshift(newRecord);
    saveToStorage('bhatti', list);

    if (record.work_type === 'Bhari') {
      // Deduct from Kacchi ground stock as loaded into kiln
      this.adjustStock('Kacchi_Aent', -Number(record.quantity));
    } else if (record.work_type === 'Nikasi') {
      // Unloaded out of kiln into finished stock
      const aval = Number(record.aval_qty || record.quantity);
      this.adjustStock('Aent_Aval', aval);
      if (record.doem_qty) this.adjustStock('Aent_Doem', Number(record.doem_qty));
      if (record.soyem_qty) this.adjustStock('Aent_Soyem', Number(record.soyem_qty));
    }
    return newRecord;
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
  addAdvance(record: { employee_id: number; advance_date: string; amount_paid: number; remarks: string }): WorkerAdvance {
    const list = this.getAdvances();
    const newAdvance: WorkerAdvance = {
      id: Date.now(),
      employee_id: record.employee_id,
      advance_date: record.advance_date,
      amount_paid: Number(record.amount_paid),
      remarks: record.remarks,
    };
    list.unshift(newAdvance);
    saveToStorage('advances', list);
    return newAdvance;
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
  addExpense(exp: { category_id: number; expense_date: string; amount: number; payment_mode: 'Cash' | 'Bank_Transfer' | 'Cheque'; paid_by: string; description: string }): DailyExpense {
    const list = this.getExpenses();
    const cats = this.getCategories();
    const foundCat = cats.find(c => c.id === Number(exp.category_id));
    const newExp: DailyExpense = {
      id: Date.now(),
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
  updateExpense(id: number, exp: { category_id: number; expense_date: string; amount: number; payment_mode: 'Cash' | 'Bank_Transfer' | 'Cheque'; paid_by: string; description: string }): DailyExpense | null {
    const list = this.getExpenses();
    const cats = this.getCategories();
    const foundCat = cats.find(c => c.id === Number(exp.category_id));
    const index = list.findIndex(e => e.id === id);
    if (index === -1) return null;
    list[index] = {
      ...list[index],
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

    const openingBalance = cust?.opening_balance || 0;
    const totalBilled = invoices.reduce((sum, inv) => sum + inv.net_total_amount, 0);
    const totalPaid = payments.reduce((sum, p) => sum + p.amount_received, 0);
    const currentBalance = (openingBalance + totalBilled) - totalPaid;

    // Build timeline
    const timeline = [
      ...invoices.map(i => ({
        date: i.invoice_date,
        type: 'Invoice',
        ref: i.invoice_number,
        description: `${i.item_type.replace('_', ' ')} (${i.quantity.toLocaleString()} units @ Rs.${i.rate_per_thousand}/thousand)`,
        debit: i.net_total_amount,
        credit: 0,
      })),
      ...payments.map(p => ({
        date: p.payment_date,
        type: 'Payment',
        ref: p.reference_no || 'Cash Receipt',
        description: `Payment via ${p.payment_mode} - ${p.notes || ''}`,
        debit: 0,
        credit: p.amount_received,
      })),
    ].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    let running = openingBalance;
    const ledger = timeline.map(row => {
      running = running + row.debit - row.credit;
      return { ...row, runningBalance: running };
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
      customer_name: cust?.customer_name || 'Direct Customer',
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

    let customer_name = existing.customer_name;
    if (data.customer_id && data.customer_id !== existing.customer_id) {
      const cust = this.getCustomers().find(c => c.id === data.customer_id);
      if (cust) customer_name = cust.customer_name;
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

  // Executive Dashboard Aggregation
  getExecutiveDashboardStats() {
    const today = new Date().toISOString().split('T')[0];
    const kacchi = this.getKacchiRecords();
    const bhatti = this.getBhattiRecords();
    const invoices = this.getInvoices();
    const payments = this.getPayments();
    const customers = this.getCustomers();
    const advances = this.getAdvances();
    const expenses = this.getExpenses();
    const matti = this.getMattiRecords();
    const fuel = this.getFuelRecords();
    const stocks = this.getStocks();

    const todayKacchiQty = kacchi.filter(k => k.entry_date === today).reduce((sum, k) => sum + k.quantity, 0);
    const todayBhariQty = bhatti.filter(b => b.entry_date === today && b.work_type === 'Bhari').reduce((sum, b) => sum + b.quantity, 0);
    const todayNikasiQty = bhatti.filter(b => b.entry_date === today && b.work_type === 'Nikasi').reduce((sum, b) => sum + b.quantity, 0);

    const totalKacchiQty = kacchi.reduce((sum, k) => sum + k.quantity, 0);
    const totalNikasiQty = bhatti.filter(b => b.work_type === 'Nikasi').reduce((sum, b) => sum + b.quantity, 0);
    const totalProductionAll = totalKacchiQty + totalNikasiQty;

    const totalSalesRevenue = invoices.reduce((sum, i) => sum + i.net_total_amount, 0);
    const totalPaymentsReceived = payments.reduce((sum, p) => sum + p.amount_received, 0);
    const totalOpeningBalances = customers.reduce((sum, c) => sum + (c.opening_balance || 0), 0);
    const totalOutstandingCustomerBalances = Math.max(0, (totalSalesRevenue + totalOpeningBalances) - totalPaymentsReceived);

    const totalWorkerAdvancesGiven = advances.reduce((sum, a) => sum + a.amount_paid, 0);

    // Total Costs
    const totalGeneralExpenses = expenses.reduce((sum, e) => sum + e.amount, 0);
    const totalMattiCost = matti.reduce((sum, m) => sum + m.total_amount, 0);
    const totalFuelCost = fuel.reduce((sum, f) => sum + f.total_amount, 0);
    const totalLaborCost = kacchi.reduce((sum, k) => sum + k.total_amount, 0) + bhatti.reduce((sum, b) => sum + b.total_amount, 0);
    const totalAllExpenses = totalGeneralExpenses + totalMattiCost + totalFuelCost + totalLaborCost;
    const netProfitOrLoss = totalSalesRevenue - totalAllExpenses;

    const stockMap: Record<string, number> = {};
    stocks.forEach(s => {
      stockMap[s.item_name] = s.current_stock;
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
      },
      financials: {
        totalSalesRevenue,
        totalPaymentsReceived,
        totalOutstandingCustomerBalances: Math.max(0, totalOutstandingCustomerBalances),
        totalWorkerAdvancesGiven,
        totalAllExpenses,
        netProfitOrLoss,
      },
      stocks: {
        aval: stockMap['Aent_Aval'] || 0,
        doem: stockMap['Aent_Doem'] || 0,
        soyem: stockMap['Aent_Soyem'] || 0,
        tile: stockMap['Tile'] || 0,
        kacchi: stockMap['Kacchi_Aent'] || 0,
      },
    };
  },
};
