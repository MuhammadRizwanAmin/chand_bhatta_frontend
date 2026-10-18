import { createBrowserRouter } from 'react-router';
import { Layout } from './components/Layout';
import { ProtectedRoute } from './components/ProtectedRoute';
import { HousekeeperRoute } from './components/HousekeeperRoute';
import HousekeeperMyTasks from './pages/housekeeping/HousekeeperMyTasks';
import { Login } from './pages/auth/Login';
import { Dashboard } from './pages/dashboard/Dashboard';
import { AllBookings } from './pages/bookings/AllBookings';
import { CheckIn } from './pages/bookings/CheckIn';
import { CheckOut } from './pages/bookings/CheckOut';
import { GroupBookings } from './pages/bookings/GroupBookings';
import { ReservationChart } from './pages/bookings/ReservationChart';
import { RoomManagement } from './pages/rooms/RoomManagement';
import { FloorPlan } from './pages/rooms/FloorPlan';
import { RoomTypes } from './pages/rooms/RoomTypes';
import { Beds } from './pages/rooms/Beds';
import { RoomTypeRates } from './pages/rooms/RoomTypeRates';
import { Housekeeping } from './pages/housekeeping/Housekeeping';
import { RoomStatusBoard } from './pages/rooms/RoomStatusBoard';
import { RoomOccupancy } from './pages/rooms/RoomOccupancy';
import { GuestList } from './pages/guests/GuestList';
import ViewGuest from './pages/guests/ViewGuest';
import { Membership } from './pages/guests/Membership';
import { MembersList } from './pages/guests/MembersList';
import { Companies } from './pages/guests/Companies';
import ViewCompany from './pages/guests/ViewCompany';
import { Suppliers } from './pages/guests/Suppliers';
import ViewSupplier from './pages/guests/ViewSupplier';
import { Agents } from './pages/guests/Agents';
import ViewAgent from './pages/guests/ViewAgent';
import { Payments } from './pages/finance/Payments';
import { Invoices } from './pages/finance/Invoices';
import { Expenses } from './pages/finance/Expenses';
import { AddEditExpense } from './pages/finance/AddEditExpense';
import { ViewExpense } from './pages/finance/ViewExpense';
import { ExpenseCategories } from './pages/finance/ExpenseCategories';
import { BankAccounts } from './pages/finance/BankAccounts';
import { BankLogs } from './pages/finance/BankLogs';
import { POS } from './pages/pos/POS';
import { ViewInventoryItem } from './pages/inventory/ViewInventoryItem';
import { Inventory } from './pages/inventory/Inventory';
import { Reports } from './pages/reports/Reports';
import { DailyLedger } from './pages/reports/DailyLedger';
import { StaffManagement } from './pages/staff/StaffManagement';
import { SettingsGeneral } from './pages/settings/SettingsGeneral';
import { SettingsLocations } from './pages/settings/SettingsLocations';
import { SettingsPackages } from './pages/settings/SettingsPackages';
import { SettingsAgents } from './pages/settings/SettingsAgents';
import ViewReservation from './pages/bookings/ViewReservation';
import AddReservation from './pages/bookings/AddNewBooking';
import EditReservation from './pages/bookings/EditReservation';
import AddNewItem from './pages/inventory/AddNewInventory';
import Categories from './pages/inventory/Categories';
import StandaloneSalesList from './pages/sales/StandaloneSalesList';
import { StaffForm } from './pages/staff/StaffForm';
import { RolesManagement } from './pages/staff/RolesManagement';
import { StaffView } from './pages/staff/StaffView';
import KitchenOrders from './pages/pos/KitchenOrders';
import { PurchaseOrdersList } from './pages/finance/PurchaseOrdersList';
import { AddPurchaseOrder } from './pages/finance/AddPurchaseOrder';
import { ViewPurchaseOrder } from './pages/finance/ViewPurchaseOrder';
import { PurchaseBillsList } from './pages/finance/PurchaseBillsList';
import { ViewPurchaseBill } from './pages/finance/ViewPurchaseBill';
import { HostelRoomList } from './pages/hostel/HostelRoomList';
import { AddHostelTenant } from './pages/hostel/AddHostelTenant';
import { HostelTenantList } from './pages/hostel/TenantList';
import { HostelFeeList } from './pages/hostel/HostelFeeList';
import { TenantView } from './pages/hostel/TenantView';
import { HostelRoomView } from './pages/hostel/HostelRoomView';
import { EditHostelTenant } from './pages/hostel/EditHostelTenant';
import { TransportationTrips } from './pages/transportation/TransportationTrips';
import { TransportationVehicle } from './pages/transportation/TransportationVehicle';
import TableManagement from './pages/pos/Table';
import { AssetsList } from './pages/assets/AssetsList';
import { AddEditAsset } from './pages/assets/AddEditAsset';
import { ViewAsset } from './pages/assets/ViewAsset';
import { DeveloperModules } from './pages/developer/DeveloperModules';
import { HRMDashboard } from './pages/HRM/Dashboard';
import { Attendance } from './pages/HRM/Attendance';
import { Leaves } from './pages/HRM/Leaves';
import { Scheduling } from './pages/HRM/Scheduling';
import { Payroll } from './pages/HRM/Payroll';
import { EmployeeAttendanceLogs } from './pages/HRM/EmployeeAttendanceLogs';

import ForgotPassword from './pages/auth/ForgotPassword';

// Chand Bricks Supplierz - Bhatta ERP Modules
import { BhattaDashboard } from './pages/bhatta/BhattaDashboard';
import { EmployeeManagement } from './pages/bhatta/EmployeeManagement';
import { KacchiProductionKhata } from './pages/bhatta/KacchiProductionKhata';
import { PakkiBhattiLaborKhata } from './pages/bhatta/PakkiBhattiLaborKhata';
import { WorkerAdvanceSettlement } from './pages/bhatta/WorkerAdvanceSettlement';
import { DailyExpensesKhata } from './pages/bhatta/DailyExpensesKhata';
import { MattiFuelKhata } from './pages/bhatta/MattiFuelKhata';
import { StockInventory } from './pages/bhatta/StockInventory';
import { CustomerLedger } from './pages/bhatta/CustomerLedger';
import { SalesInvoiceBilling } from './pages/bhatta/SalesInvoiceBilling';
import { BhattaSettings } from './pages/bhatta/BhattaSettings';

export const router = createBrowserRouter([
  // Public routes
  { path: '/login', Component: Login },
  { path: '/forgot-password', Component: ForgotPassword },

  // Housekeeper-only route (no sidebar, full-screen mobile view)
  {
    path: '/',
    Component: HousekeeperRoute,
    children: [
      { path: 'housekeeping-tasks', Component: HousekeeperMyTasks },
    ],
  },

  // Protected routes — all wrapped by ProtectedRoute
  {
    path: '/',
    Component: ProtectedRoute,
    children: [
      {
        path: '/',
        Component: Layout,
        children: [
          // Bhatta ERP Main Routes
          { index: true, Component: BhattaDashboard },
          { path: 'dashboard', Component: BhattaDashboard },
          { path: 'bhatta/employees', Component: EmployeeManagement },
          { path: 'bhatta/kacchi', Component: KacchiProductionKhata },
          { path: 'bhatta/bhatti', Component: PakkiBhattiLaborKhata },
          { path: 'bhatta/advances', Component: WorkerAdvanceSettlement },
          { path: 'bhatta/expenses', Component: DailyExpensesKhata },
          { path: 'bhatta/matti-fuel', Component: MattiFuelKhata },
          { path: 'bhatta/stock', Component: StockInventory },
          { path: 'bhatta/customers', Component: CustomerLedger },
          { path: 'bhatta/billing', Component: SalesInvoiceBilling },
          { path: 'bhatta/settings', Component: BhattaSettings },

          // Reservations
          { path: 'bookings', Component: AllBookings },
          { path: 'booking/:id', Component: ViewReservation },
          { path: 'booking/:id/edit', Component: EditReservation },
          { path: 'booking/create', Component: AddReservation },
          { path: 'reservations/checkin', Component: CheckIn },
          { path: 'reservations/checkout', Component: CheckOut },
          { path: 'reservations/groups', Component: GroupBookings },
          { path: 'reservations/chart', Component: ReservationChart },

          // Sales
          { path: 'sales', Component: StandaloneSalesList },

          // Rooms
          { path: 'rooms', Component: RoomManagement },
          { path: 'rooms/floor-plan', Component: FloorPlan },
          { path: 'rooms/types', Component: RoomTypes },
          { path: 'rooms/beds', Component: Beds },
          { path: 'rooms/rates', Component: RoomTypeRates },
          { path: 'rooms/status', Component: RoomStatusBoard },
          { path: 'rooms/occupancy', Component: RoomOccupancy },
          { path: 'housekeeping', Component: Housekeeping },

          // Hostel
          { path: 'pms/rooms', Component: HostelRoomList },
          { path: 'pms/room/view/:id', Component: HostelRoomView },
          { path: 'pms/tenants/add', Component: AddHostelTenant },
          { path: 'pms/tenant/edit/:id', Component: EditHostelTenant },
          { path: 'pms/fees', Component: HostelFeeList },
          { path: 'pms/tenants', Component: HostelTenantList },
          { path: 'pms/tenants/view/:id', Component: TenantView },

          // Guests
          { path: 'guests', Component: GuestList },
          { path: 'companies', Component: Companies },
          { path: 'companies/:id', Component: ViewCompany },
          { path: 'membership-plans', Component: Membership },
          { path: 'members', Component: MembersList },
          { path: 'suppliers', Component: Suppliers },
          { path: 'suppliers/:id', Component: ViewSupplier },
          { path: 'agents', Component: Agents },
          { path: 'agents/:id', Component: ViewAgent },
          { path: 'guests/:id', Component: ViewGuest },

          // Finance
          { path: 'finance/payments', Component: Payments },
          { path: 'finance/invoices', Component: Invoices },
          { path: 'finance/expenses', Component: Expenses },
          { path: 'finance/expenses/add', Component: AddEditExpense },
          { path: 'finance/expenses/edit/:id', Component: AddEditExpense },
          { path: 'finance/expenses/view/:id', Component: ViewExpense },
          { path: 'finance/expense-categories', Component: ExpenseCategories },
          { path: 'finance/banks', Component: BankAccounts },
          { path: 'finance/banks/:id/logs', Component: BankLogs },
          { path: 'finance/purchase-orders', Component: PurchaseOrdersList },
          { path: 'finance/purchase-orders/add', Component: AddPurchaseOrder },
          { path: 'finance/purchase-orders/edit/:id', Component: AddPurchaseOrder },
          { path: 'finance/purchase-orders/view/:id', Component: ViewPurchaseOrder },
          { path: 'finance/bills', Component: PurchaseBillsList },
          { path: 'finance/bills/view/:id', Component: ViewPurchaseBill },

          // Other modules
          { path: 'pos', Component: POS },
          { path: 'table', Component: TableManagement },
          { path: 'kitchen', Component: KitchenOrders },
          { path: 'inventory', Component: Inventory },
          { path: 'categories', Component: Categories },
          { path: 'inventory/addnew', Component: AddNewItem },
          { path: 'inventory/edit/:id', Component: AddNewItem },
          { path: 'inventory/view/:id', Component: ViewInventoryItem },
          { path: 'assets', Component: AssetsList },
          { path: 'assets/add', Component: AddEditAsset },
          { path: 'assets/edit/:id', Component: AddEditAsset },
          { path: 'assets/view/:id', Component: ViewAsset },
          { path: 'reports', Component: Reports },
          { path: 'daily-ledger', Component: DailyLedger },
          // Staff
          { path: 'staff', Component: StaffManagement },
          { path: 'staff/roles', Component: RolesManagement },
          { path: 'staff/add', Component: StaffForm },
          { path: 'staff/edit/:id', Component: StaffForm },
          { path: 'staff/view/:id', Component: StaffView },

          // HRM
          { path: 'hrm/dashboard', Component: HRMDashboard },
          { path: 'hrm/attendance', Component: Attendance },
          { path: 'hrm/attendance/:id', Component: EmployeeAttendanceLogs },
          { path: 'hrm/scheduling', Component: Scheduling },
          { path: 'hrm/leaves', Component: Leaves },
          { path: 'hrm/payroll', Component: Payroll },

          // Transportation
          { path: 'transportation/vehicles', Component: TransportationVehicle },
          { path: 'transportation/trips', Component: TransportationTrips },

          // Settings
          { path: 'settings/general', Component: SettingsGeneral },
          { path: 'settings/locations', Component: SettingsLocations },
          { path: 'settings/packages', Component: SettingsPackages },
          { path: 'settings/agents', Component: SettingsAgents },

          // Developer Hidden Routes
          { path: 'dev/modules', Component: DeveloperModules },
        ],
      },
    ],
  },
]);
