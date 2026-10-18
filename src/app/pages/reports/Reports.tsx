import { useState, useEffect } from 'react';
import {
  BarChart3, Download, FileText, TrendingUp, TrendingDown,
  DollarSign, Users, BedDouble, BookOpen, ShoppingCart,
  Wallet, CreditCard, ArrowLeftRight, Scale, PieChart,
  FileSpreadsheet, Printer, Loader2, Calendar,
  ClipboardList, Building2, Receipt, ChevronDown, ChevronRight, Package
} from 'lucide-react';
import api from '../../services/api';
import { getCurrency } from '../../utils/currency';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';
import { calculateInvoice } from '../../components/InvoiceTemplates';

const fmt = (n: number) => `${getCurrency()} ${Number(n || 0).toLocaleString()}`;
const today = new Date().toISOString().split('T')[0];
const monthStart = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0];

const REPORT_GROUPS = [
  {
    label: 'Financial',
    icon: TrendingUp,
    accent: '#10B981',
    accentBg: '#ECFDF5',
    accentText: '#065F46',
    reports: [
      { key: 'payable_receivable', label: 'Payable & Receivable', icon: ArrowLeftRight },
      { key: 'ledger',          label: 'Ledger',           icon: BookOpen },
      { key: 'income_expense',  label: 'Income / Expense', icon: ArrowLeftRight },
      { key: 'profit_loss',     label: 'Profit & Loss',    icon: TrendingUp },
      { key: 'trial_balance',   label: 'Trial Balance',    icon: Scale },
      { key: 'balance_sheet',   label: 'Balance Sheet',    icon: PieChart },
      { key: 'cash_flow',       label: 'Cash Flow',        icon: TrendingDown },
      { key: 'cash_book',       label: 'Cash Book',        icon: Wallet },
      { key: 'bank_statement',  label: 'Bank Statement',   icon: CreditCard },
      { key: 'journal',         label: 'Journal Entries',  icon: ClipboardList },
    ],
  },
  {
    label: 'Reservations',
    icon: BedDouble,
    accent: '#3B82F6',
    accentBg: '#EFF6FF',
    accentText: '#1E40AF',
    reports: [
      { key: 'all_reservations',    label: 'All Reservations',    icon: BedDouble },
      { key: 'active_reservations', label: 'Active Reservations', icon: BedDouble },
      { key: 'guest_folio',         label: 'Guest Folio',         icon: Receipt },
      { key: 'guest_notes',         label: 'Guest Notes',         icon: FileText },
      { key: 'room_occupancy',      label: 'Room Occupancy',      icon: BarChart3 },
      { key: 'overnight_room_revenue', label: 'Overnight Room Revenue', icon: TrendingUp },
    ],
  },
  {
    label: 'Operations',
    icon: BarChart3,
    accent: '#8B5CF6',
    accentBg: '#F5F3FF',
    accentText: '#4C1D95',
    reports: [
      { key: 'payment',          label: 'Payments',         icon: DollarSign },
      { key: 'income',           label: 'Income',           icon: TrendingUp },
      { key: 'expense',          label: 'Expenses',         icon: Receipt },
      { key: 'sales',            label: 'Sales',            icon: ShoppingCart },
      { key: 'sales_vs_expense', label: 'Sales vs Expense', icon: BarChart3 },
      { key: 'purchase',         label: 'Purchases',        icon: FileSpreadsheet },
      { key: 'asset',            label: 'Assets',           icon: Building2 },
      { key: 'inventory_stock',  label: 'Inventory Stock',  icon: Package },
      { key: 'inventory_items_sold', label: 'Inventory Items Sold', icon: ShoppingCart },
      { key: 'customers',        label: 'Customers',        icon: Users },
      { key: 'staff',            label: 'Staff',            icon: Users },
    ],
  },
];

function getColumns(type: string) {
  switch (type) {
    case 'payable_receivable':
      return ['Type', 'Source', 'Ref No', 'Party Name', 'Total Amount', 'Paid Amount', 'Balance Due'];
    case 'ledger':
    case 'income_expense':
      return ['Date','Type','Source','Description','Method','Room No','Amount','Running Balance'];
    case 'profit_loss':
      return ['Type','Amount'];
    case 'trial_balance':
      return ['Account','Debit','Credit'];
    case 'balance_sheet':
      return ['Category','Item','Amount'];
    case 'cash_flow':
      return ['Date','Type','Method','Reference','Amount'];
    case 'cash_book':
      return ['Date','Method','Reference','Room No','Amount'];
    case 'bank_statement':
      return ['Date','Bank','Type','Amount','Note'];
    case 'journal':
      return ['Date','Type','Category','Description','Method','Amount'];
    case 'payment':
      return ['Date','Method','Amount','Status','Customer / Ref'];
    case 'expense':
      return ['Date','Title','Category','Payment','Made By','Amount'];
    case 'income':
      return ['Date','Source','Description','Method','Amount'];
    case 'sales':
    case 'sales_vs_expense':
      return ['Label / ID','Amount'];
    case 'purchase':
      return ['Date','Supplier','Status','Amount'];
    case 'asset':
      return ['Title','Category','Qty','Sell Price','Current Value'];
    case 'inventory_stock':
      return ['Item', 'Category', 'Unit', 'Stock Qty', 'Cost Price', 'Sell Price', 'Total Value'];
    case 'inventory_items_sold':
      return ['Date', 'Item Name', 'Category', 'Quantity Sold', 'Total Value', 'Room No', 'Ref No'];
    case 'customers':
      return ['Name','Phone','CNIC','Email','City'];
    case 'staff':
      return ['Name','Phone','CNIC','Salary','Payout Date'];
    case 'all_reservations':
    case 'active_reservations':
      return ['Ref No','Guest','Room','Check In','Check Out','Status','Total','Received','Balance','Per Night'];
    case 'room_occupancy':
      return ['Room No','Floor','Category','Status','Guest Name','Check In','Check Out','Daily Rent'];
    case 'overnight_room_revenue':
      return ['Date', 'Room No', 'Guest Name', 'Ref No', 'Room Rent', 'Extras', 'Total Revenue'];
    case 'guest_notes':
      return ['Ref No','Guest','Notes','Created'];
    case 'guest_folio':
      return ['Invoice No','Source','Room','Customer','Description','Amount','Tax','Total','Paid','Due','Added By'];
    case 'hostel_tenants':
      return ['Name','Room','Status','Phone','CNIC','Joined'];
    case 'hostel_fees':
      return ['Tenant','Room','Amount','Paid','Pending','Date'];
    case 'hostel_rooms':
      return ['Room No','Type','Capacity','Occupied'];
    default:
      return ['Data'];
  }
}

function renderRow(type: string, row: any, i: number) {
  const c = getCurrency();
  const money = (v: any) => `${c} ${Number(v || 0).toLocaleString()}`;
  const date = (v: any) => {
    if (!v) return '-';
    const d = new Date(v);
    if (isNaN(d.getTime())) return '-';
    const day = d.getDate().toString().padStart(2, '0');
    const month = d.toLocaleString('en-US', { month: 'short' }).toLowerCase();
    const year = d.getFullYear().toString().slice(-2);
    return `${day}-${month}-${year}`;
  };

  switch (type) {
    case 'room_occupancy':
      return [
        row.roomNo,
        row.floor,
        row.category,
        <span className={`px-2 py-1 rounded-full text-xs font-semibold ${row.status === 'checked_in' ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'}`}>{row.status}</span>,
        row.guestName || row.guest || '-',
        date(row.checkIn),
        date(row.checkOut),
        money(row.dailyRent)
      ];
    case 'payable_receivable':
      return [
        row.type === 'receivable' ? <span style={{color: '#059669', fontWeight: 600}}>Receivable</span> : <span style={{color: '#DC2626', fontWeight: 600}}>Payable</span>,
        row.source,
        row.refNo || '—',
        row.partyName || '—',
        money(row.totalAmount),
        money(row.paidAmount),
        money(row.balance)
      ];
    case 'ledger':
    case 'income_expense':
      return [date(row.date), row.type, row.source, row.description, row.method, row.roomNo || '-', money(row.amount), money(row.runningBalance)];
    case 'profit_loss':
      return [row.type, money(row.amount)];
    case 'trial_balance':
      return [row.account, row.balance < 0 ? money(Math.abs(row.balance)) : '—', row.balance >= 0 ? money(row.balance) : '—'];
    case 'balance_sheet':
      return [row.category, row.items?.[0]?.name || '—', money(row.items?.[0]?.amount || 0)];
    case 'cash_flow':
      return [date(row.date), row.type, row.method, row.ref, money(row.amount)];
    case 'cash_book': {
      let roomNo = '-';
      if (row.reservation?.rooms?.length > 0) {
        roomNo = row.reservation.rooms.map((r: any) => r.roomNo).filter(Boolean).join(', ');
      } else if (row.sale?.Reservation?.rooms?.length > 0) {
        roomNo = row.sale.Reservation.rooms.map((r: any) => r.roomNo).filter(Boolean).join(', ');
      }
      return [date(row.date), row.method, row.transactionId || '-', roomNo || '-', money(row.amount)];
    }
    case 'bank_statement':
      return [date(row.createdAt), row.bank?.bankName || '—', row.type, money(row.amount), row.note || '—'];
    case 'journal':
      return [date(row.date), row.type, row.category, row.description, row.method, money(row.amount)];
    case 'payment':
      return [date(row.date), row.method, money(row.amount), row.status, row.reservation?.customer?.name || row.sale?.id || '—'];
    case 'expense':
      return [date(row.date_for || row.createdAt), row.title, row.expense_type, row.payment_type, row.user?.fullName || '—', money(row.price)];
    case 'income':
      return [date(row.date || row.createdAt), row.source, row.description || row.note || '—', row.method, money(row.amount)];
    case 'sales':
      return [`Sale #${row.id}`, money(row.totalAmount)];
    case 'sales_vs_expense':
      return [row.label, money(row.value)];
    case 'purchase':
      return [date(row.createdAt), row.supplier?.name || '—', row.status, money(row.totalAmount)];
    case 'asset':
      return [row.title, row.category, row.quantity, money(row.sellPrice), money(row.currentValue)];
    case 'inventory_stock':
      return [
        row.title,
        row.categoryObj?.name || row.category || '—',
        row.unit || '—',
        row.stocks?.[0]?.qty || 0,
        money(row.costPrice),
        money(row.sellPrice),
        money((row.stocks?.[0]?.qty || 0) * (row.costPrice || 0))
      ];
    case 'inventory_items_sold':
      return [
        date(row.createdAt),
        row.title || '—',
        row.categoryObj?.name || '—',
        row.quantitySold || 0,
        money(row.totalValue),
        row.roomNo || '—',
        row.refNo || '—'
      ];
    case 'customers':
      return [row.name, row.phone, row.cnic, row.email, row.city];
    case 'staff':
      return [row.fullName, row.phone, row.cnic, money(row.salary), row.payout_date || '—'];
    case 'all_reservations':
    case 'active_reservations': {
      const inv = calculateInvoice(row, "all");
      const totalAmt = Math.max(0, inv.grandTotal);
      const receivedAmt = inv.grossPaid;
      const balanceAmt = inv.balanceDue;
      const roomRentVal = inv.roomTotal > 0 ? inv.roomTotal : totalAmt;
      const stayNights = inv.stayDays || 1;
      const perNight = stayNights > 0 ? Math.round(roomRentVal / stayNights) : roomRentVal;
      const roomNumbers = row.rooms?.map((r: any) => r.roomNo).filter(Boolean).join(', ') || '—';

      return [
        row.refno || String(row.id),
        row.customer?.name || '—',
        roomNumbers,
        date(row.startDate),
        date(row.endDate),
        row.status,
        money(totalAmt),
        money(receivedAmt),
        balanceAmt > 0
          ? <span style={{ color: '#DC2626', fontWeight: 600 }}>{money(balanceAmt)}</span>
          : <span style={{ color: '#059669', fontWeight: 600 }}>{money(0)}</span>,
        money(perNight)
      ];
    }
    case 'guest_notes':
      return [row.refno, row.customer?.name, row.resNotes || '—', date(row.createdAt)];
    case 'guest_folio':
      return [
        row.invoiceNo,
        row.source,
        row.room,
        row.customer,
        row.description,
        money(row.amount),
        row.tax > 0 ? money(row.tax) : '—',
        money(row.total),
        money(row.paid),
        row.due > 0 ? <span style={{color:'#DC2626',fontWeight:600}}>{money(row.due)}</span> : <span style={{color:'#059669'}}>Cleared</span>,
        row.addedBy,
      ];
    case 'overnight_room_revenue':
      return [
        date(row.date),
        row.roomNo || '-',
        row.guestName || '-',
        row.refNo || '-',
        money(row.roomRent ?? row.dailyRent),
        row.extrasAmount > 0 ? `${money(row.extrasAmount)}${row.extrasDesc ? ` (${row.extrasDesc})` : ''}` : '—',
        money(row.dailyRent || (Number(row.roomRent || 0) + Number(row.extrasAmount || 0)))
      ];
    case 'hostel_tenants':
      return [row.name, row.room?.roomNo || '—', row.status, row.phone, row.cnic, date(row.createdAt)];
    case 'hostel_fees':
      return [row.tenant?.name, row.tenant?.room?.roomNo || '—', money(row.amount), money(row.paidAmount), money(Number(row.amount || 0) - Number(row.paidAmount || 0)), date(row.createdAt)];
    case 'hostel_rooms':
      return [row.roomNo, row.type, row.capacity, row.tenants?.length || 0];
    default:
      return [JSON.stringify(row).slice(0, 60)];
  }
}

function renderFooterRow(type: string, summary: any, cols: string[]) {
  if (!summary) return null;
  const c = getCurrency();
  const money = (v: any) => `${c} ${Number(v || 0).toLocaleString()}`;

  switch (type) {
    case 'inventory_items_sold':
      return (
        <tr className="bg-gray-100 font-bold border-t-2 border-gray-300 text-gray-900">
          <td className="px-4 py-3 text-xs font-bold text-gray-900 uppercase" colSpan={4}>Total</td>
          <td className="px-4 py-3 text-sm font-bold text-gray-900">{Number(summary.totalQuantity || 0).toLocaleString()}</td>
          <td className="px-4 py-3 text-sm font-bold text-gray-900">{money(summary.totalValue || summary.totalAmount)}</td>
          <td className="px-4 py-3"></td>
          <td className="px-4 py-3"></td>
        </tr>
      );
    case 'inventory_stock':
      return (
        <tr className="bg-gray-100 font-bold border-t-2 border-gray-300 text-gray-900">
          <td className="px-4 py-3 text-xs font-bold text-gray-900 uppercase" colSpan={7}>Total Stock Value</td>
          <td className="px-4 py-3 text-sm font-bold text-gray-900">{money(summary.totalValue)}</td>
        </tr>
      );
    case 'expense':
      return (
        <tr className="bg-gray-100 font-bold border-t-2 border-gray-300 text-gray-900">
          <td className="px-4 py-3 text-xs font-bold text-gray-900 uppercase" colSpan={6}>Total Expense</td>
          <td className="px-4 py-3 text-sm font-bold text-gray-900">{money(summary.totalExpense || summary.total)}</td>
        </tr>
      );
    case 'income':
      return (
        <tr className="bg-gray-100 font-bold border-t-2 border-gray-300 text-gray-900">
          <td className="px-4 py-3 text-xs font-bold text-gray-900 uppercase" colSpan={5}>Total Income</td>
          <td className="px-4 py-3 text-sm font-bold text-gray-900">{money(summary.totalIncome || summary.total)}</td>
        </tr>
      );
    case 'payment':
      return (
        <tr className="bg-gray-100 font-bold border-t-2 border-gray-300 text-gray-900">
          <td className="px-4 py-3 text-xs font-bold text-gray-900 uppercase" colSpan={3}>Total Received</td>
          <td className="px-4 py-3 text-sm font-bold text-gray-900">{money(summary.totalReceived || summary.total)}</td>
          <td className="px-4 py-3"></td>
        </tr>
      );
    case 'overnight_room_revenue':
      return (
        <tr className="bg-gray-100 font-bold border-t-2 border-gray-300 text-gray-900">
          <td className="px-4 py-3 text-xs font-bold text-gray-900 uppercase" colSpan={6}>Total Revenue</td>
          <td className="px-4 py-3 text-sm font-bold text-gray-900">{money(summary.totalRevenue)}</td>
        </tr>
      );
    case 'all_reservations':
    case 'active_reservations':
      return (
        <tr className="bg-gray-100 font-bold border-t-2 border-gray-300 text-gray-900">
          <td className="px-4 py-3 text-xs font-bold text-gray-900 uppercase" colSpan={7}>
            Total Count: {summary.totalCount ?? ''}
          </td>
          <td className="px-4 py-3 text-sm font-bold text-gray-900">{money(summary.totalRevenue)}</td>
          <td className="px-4 py-3 text-sm font-bold text-gray-900">{money(summary.totalReceived)}</td>
          <td className="px-4 py-3 text-sm font-bold text-gray-900">{money(summary.totalBalance)}</td>
          <td className="px-4 py-3 text-sm font-bold text-gray-900">—</td>
        </tr>
      );
    default:
      if (summary.totalValue !== undefined || summary.totalAmount !== undefined || summary.total !== undefined) {
        const val = summary.totalAmount ?? summary.totalValue ?? summary.total;
        return (
          <tr className="bg-gray-100 font-bold border-t-2 border-gray-300 text-gray-900">
            <td className="px-4 py-3 text-xs font-bold text-gray-900 uppercase" colSpan={cols.length}>Total</td>
            <td className="px-4 py-3 text-sm font-bold text-gray-900">{money(val)}</td>
          </tr>
        );
      }
      return null;
  }
}

function SummaryCards({ type, summary }: { type: string; summary: any }) {
  if (!summary) return null;
  const c = getCurrency();
  const money = (v: any) => `${c} ${Number(v || 0).toLocaleString()}`;

  const cards: { label: string; value: string; positive?: boolean; neutral?: boolean }[] = [];

  if (summary.totalCount !== undefined)
    cards.push({ label: 'Total Count', value: String(summary.totalCount), neutral: true });
  if (summary.totalIncome !== undefined)
    cards.push({ label: 'Total Income', value: money(summary.totalIncome), positive: true });
  if (summary.totalExpense !== undefined)
    cards.push({ label: 'Total Expense', value: money(summary.totalExpense), positive: false });
  if (summary.totalPayable !== undefined)
    cards.push({ label: 'Total Payable', value: money(summary.totalPayable), positive: false });
  if (summary.totalReceivable !== undefined)
    cards.push({ label: 'Total Receivable', value: money(summary.totalReceivable), positive: true });
  if (summary.netBalance !== undefined)
    cards.push({ label: 'Net Balance', value: money(summary.netBalance), positive: summary.netBalance >= 0 });
  if (summary.netProfit !== undefined)
    cards.push({ label: 'Net Profit', value: money(summary.netProfit), positive: summary.netProfit >= 0 });
  if (summary.total !== undefined)
    cards.push({ label: 'Total Amount', value: money(summary.total), neutral: true });
  if (summary.totalRevenue !== undefined)
    cards.push({ label: 'Total Revenue', value: money(summary.totalRevenue), positive: true });
  if (summary.totalReceived !== undefined)
    cards.push({ label: 'Received', value: money(summary.totalReceived), neutral: true });
  if (summary.totalBalance !== undefined)
    cards.push({ label: 'Balance Due', value: money(summary.totalBalance), positive: false });
  if (summary.totalTax !== undefined)
    cards.push({ label: 'Total Tax', value: money(summary.totalTax), neutral: true });
  if (summary.totalDebit !== undefined)
    cards.push({ label: 'Total Debit', value: money(summary.totalDebit), positive: false });
  if (summary.totalCredit !== undefined)
    cards.push({ label: 'Total Credit', value: money(summary.totalCredit), positive: true });
  if (summary.totalIn !== undefined)
    cards.push({ label: 'Cash In', value: money(summary.totalIn), positive: true });
  if (summary.totalOut !== undefined)
    cards.push({ label: 'Cash Out', value: money(summary.totalOut), positive: false });
  if (summary.netFlow !== undefined)
    cards.push({ label: 'Net Flow', value: money(summary.netFlow), positive: summary.netFlow >= 0 });
  if (summary.totalQuantity !== undefined)
    cards.push({ label: 'Total Quantity Sold', value: Number(summary.totalQuantity).toLocaleString(), neutral: true });
  if (summary.totalValue !== undefined)
    cards.push({ label: type === 'inventory_items_sold' ? 'Total Amount' : 'Total Value', value: money(summary.totalValue), neutral: true });

  if (!cards.length) return null;

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-5">
      {cards.map(card => {
        let borderColor = 'border-l-gray-300';
        let valueColor = 'text-gray-800';
        let bgColor = 'bg-white';
        if (card.neutral) { borderColor = 'border-l-blue-400'; valueColor = 'text-blue-700'; }
        else if (card.positive === true) { borderColor = 'border-l-emerald-400'; valueColor = 'text-emerald-700'; bgColor = 'bg-emerald-50/40'; }
        else if (card.positive === false) { borderColor = 'border-l-red-400'; valueColor = 'text-red-600'; bgColor = 'bg-red-50/40'; }

        return (
          <div key={card.label} className={`${bgColor} rounded-xl p-4 border border-gray-100 border-l-4 ${borderColor} shadow-sm`}>
            <p className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-1">{card.label}</p>
            <p className={`text-lg font-bold ${valueColor}`}>{card.value}</p>
          </div>
        );
      })}
    </div>
  );
}

// ─── Sidebar Group ──────────────────────────────────────────────────────────
function SidebarGroup({
  group, selectedType, onSelect
}: {
  group: typeof REPORT_GROUPS[0];
  selectedType: string;
  onSelect: (key: string) => void;
}) {
  const isGroupActive = group.reports.some(r => r.key === selectedType);
  const [open, setOpen] = useState(isGroupActive || true);
  const GroupIcon = group.icon;

  return (
    <div className="mb-1">
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-left transition-colors hover:bg-gray-100 group"
      >
        <span
          className="w-6 h-6 rounded-md flex items-center justify-center flex-shrink-0"
          style={{ background: group.accentBg }}
        >
          <GroupIcon size={13} style={{ color: group.accent }} />
        </span>
        <span className="flex-1 text-xs font-bold uppercase tracking-widest text-gray-500 group-hover:text-gray-700">
          {group.label}
        </span>
        {open
          ? <ChevronDown size={13} className="text-gray-400" />
          : <ChevronRight size={13} className="text-gray-400" />}
      </button>

      {open && (
        <div className="mt-0.5 ml-2 pl-3 border-l border-gray-100 space-y-0.5">
          {group.reports.map(report => {
            const Icon = report.icon;
            const active = selectedType === report.key;
            return (
              <button
                key={report.key}
                onClick={() => onSelect(report.key)}
                className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-left text-sm transition-all duration-150
                  ${active
                    ? 'text-white shadow-sm'
                    : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                  }`}
                style={active ? { background: group.accent } : {}}
              >
                <Icon size={14} className={active ? 'text-white/80' : 'text-gray-400'} />
                <span className="font-medium">{report.label}</span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ─── Main Component ──────────────────────────────────────────────────────────
export function Reports() {
  const [selectedType, setSelectedType] = useState('');
  const [startDate, setStartDate] = useState(monthStart);
  const [endDate, setEndDate] = useState(today);
  const [data, setData] = useState<any[]>([]);
  const [summary, setSummary] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [itemType, setItemType] = useState('all');
  const [roomNo, setRoomNo] = useState('');
  const [allRooms, setAllRooms] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [items, setItems] = useState<any[]>([]);
  const [categoryId, setCategoryId] = useState('');
  const [itemId, setItemId] = useState('');

  useEffect(() => {
    api.get('/assignRoom/assigned-rooms-with-type')
      .then(res => {
        const sortedRooms = (res.data?.data || []).sort((a: any, b: any) => (a.roomNo || '').localeCompare(b.roomNo || '', undefined, { numeric: true }));
        setAllRooms(sortedRooms);
      })
      .catch(() => {});

    api.get('/categories')
      .then(res => {
        const list = Array.isArray(res.data) ? res.data : (res.data?.data || []);
        setCategories(list);
      })
      .catch(() => {});

    api.get('/items/filtered')
      .then(res => {
        const list = Array.isArray(res.data?.data) ? res.data.data : (Array.isArray(res.data) ? res.data : []);
        setItems(list);
      })
      .catch(() => {});
  }, []);

  const activeReport = REPORT_GROUPS.flatMap(g => g.reports).find(r => r.key === selectedType);
  const activeGroup = REPORT_GROUPS.find(g => g.reports.some(r => r.key === selectedType));

  useEffect(() => {
    if (!selectedType) return;
    fetchReport(selectedType);
  }, [selectedType, startDate, endDate, itemType, roomNo, categoryId, itemId]);

  const fetchReport = async (type: string) => {
    setLoading(true);
    setError('');
    setData([]);
    setSummary(null);
    try {
      let res;
      if (type === 'guest_folio') {
        res = await api.get('/report/guest-folio/report', { params: { startDate, endDate } });
      } else {
        res = await api.get(`/report/live/${type}`, {
          params: {
            startDate,
            endDate,
            itemType,
            roomNo: roomNo || undefined,
            categoryId: categoryId || undefined,
            itemId: itemId || undefined,
          }
        });
      }
      setData(Array.isArray(res.data.data) ? res.data.data : []);
      setSummary(res.data.summary || null);
    } catch (e: any) {
      setError(e.response?.data?.message || 'Failed to load report.');
    } finally {
      setLoading(false);
    }
  };

  const handleSelect = (key: string) => { setSelectedType(key); setData([]); setSummary(null); };

  const downloadExcel = () => {
    try {
      const table = document.getElementById('report-table');
      if (!table) {
        alert('No data table available to export.');
        return;
      }
      const reportTitle = activeReport?.label || 'Report';
      const fileName = `${reportTitle.replace(/\s+/g, '_')}_${startDate}_to_${endDate}.xlsx`;
      const wb = XLSX.utils.table_to_book(table, { sheet: reportTitle.slice(0, 31) });
      XLSX.writeFile(wb, fileName);
    } catch (e: any) {
      alert('Failed to generate Excel file: ' + (e.message || 'Unknown error'));
    }
  };

  const downloadPdf = () => {
    if (!activeReport) return;
    const doc = new jsPDF();
    doc.text(`${activeReport.label}`, 14, 15);
    doc.setFontSize(10);
    doc.text(`Period: ${startDate} to ${endDate}`, 14, 22);

    autoTable(doc, {
      html: '#report-table',
      startY: 28,
      theme: 'grid',
      styles: { fontSize: 8 },
      headStyles: { fillColor: [17, 24, 39] }
    });

    doc.save(`${activeReport.label.replace(/\s+/g, '_')}_${startDate}_${endDate}.pdf`);
  };

  const cols = getColumns(selectedType);

  return (
    <div className="flex gap-6 min-h-screen bg-gray-50/50">

      {/* ── Sidebar ── */}
      <aside className="w-56 shrink-0">
        <div className="sticky top-0 bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          {/* Sidebar Header */}
          <div className="px-4 py-4 border-b border-gray-100 bg-gray-50">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-[#1D4ED8] flex items-center justify-center">
                <BarChart3 size={14} className="text-white" />
              </div>
              <div>
                <p className="text-sm font-bold text-gray-800">Reports</p>
                <p className="text-[10px] text-gray-400">Analytics Center</p>
              </div>
            </div>
          </div>

          {/* Report Groups */}
          <div className="p-2 max-h-[calc(100vh-120px)] overflow-y-auto">
            {REPORT_GROUPS.map(group => (
              <SidebarGroup
                key={group.label}
                group={group}
                selectedType={selectedType}
                onSelect={handleSelect}
              />
            ))}
          </div>
        </div>
      </aside>

      {/* ── Main Content ── */}
      <div className="flex-1 min-w-0 space-y-5">

        {/* Header */}
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              {activeReport ? activeReport.label : 'Reports & Analytics'}
            </h1>
            <div className="flex items-center gap-2 mt-1">
              {activeGroup && (
                <span
                  className="text-xs font-medium px-2 py-0.5 rounded-full"
                  style={{ background: activeGroup.accentBg, color: activeGroup.accentText }}
                >
                  {activeGroup.label}
                </span>
              )}
              <p className="text-sm text-gray-400">
                {activeReport ? 'Showing data for selected period' : 'Select a report from the sidebar'}
              </p>
            </div>
          </div>

          {data.length > 0 && (
            <div className="flex gap-2 flex-shrink-0">
              <button
                onClick={() => window.print()}
                className="flex items-center gap-2 border border-gray-200 bg-white text-gray-600 px-3.5 py-2 rounded-xl hover:bg-gray-50 text-sm font-medium transition-colors"
              >
                <Printer size={15} />
                Print
              </button>
              <button
                onClick={downloadPdf}
                className="flex items-center gap-2 bg-red-600 text-white px-3.5 py-2 rounded-xl hover:bg-red-700 text-sm font-medium transition-colors"
              >
                <FileText size={15} />
                PDF
              </button>
              <button
                onClick={downloadExcel}
                className="flex items-center gap-2 bg-emerald-600 text-white px-3.5 py-2 rounded-xl hover:bg-emerald-700 text-sm font-medium transition-colors"
              >
                <Download size={15} />
                Excel
              </button>
            </div>
          )}
        </div>

        {/* Filters Bar */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm px-5 py-4">
          <div className="flex flex-wrap items-end gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-1.5 uppercase tracking-wide">From</label>
              <div className="relative">
                <Calendar size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                <input
                  type="date"
                  value={startDate}
                  onChange={e => setStartDate(e.target.value)}
                  className="pl-8 pr-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400 bg-gray-50 text-gray-700"
                />
              </div>
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-1.5 uppercase tracking-wide">To</label>
              <div className="relative">
                <Calendar size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                <input
                  type="date"
                  value={endDate}
                  onChange={e => setEndDate(e.target.value)}
                  className="pl-8 pr-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400 bg-gray-50 text-gray-700"
                />
              </div>
            </div>
            {(selectedType === 'room_occupancy' || selectedType === 'overnight_room_revenue') && (
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1.5 uppercase tracking-wide">Room No</label>
                <select
                  value={roomNo}
                  onChange={e => setRoomNo(e.target.value)}
                  className="px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400 bg-gray-50 text-gray-700 w-32"
                >
                  <option value="">All Rooms</option>
                  {allRooms.map((r, idx) => (
                    <option key={idx} value={r.roomNo}>{r.roomNo}</option>
                  ))}
                </select>
              </div>
            )}
            {selectedType === 'inventory_stock' && (
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1.5 uppercase tracking-wide">Item Type</label>
                <select
                  value={itemType}
                  onChange={(e) => setItemType(e.target.value)}
                  className="px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400 bg-gray-50 text-gray-700 min-w-[150px]"
                >
                  <option value="all">All Items</option>
                  <option value="pos">POS Items</option>
                  <option value="operational">Operational Items</option>
                </select>
              </div>
            )}
            {selectedType === 'inventory_items_sold' && (
              <>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 mb-1.5 uppercase tracking-wide">Category</label>
                  <select
                    value={categoryId}
                    onChange={(e) => {
                      setCategoryId(e.target.value);
                      setItemId('');
                    }}
                    className="px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400 bg-gray-50 text-gray-700 min-w-[150px]"
                  >
                    <option value="">All Categories</option>
                    {categories.map((c: any) => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 mb-1.5 uppercase tracking-wide">Product / Item</label>
                  <select
                    value={itemId}
                    onChange={(e) => setItemId(e.target.value)}
                    className="px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400 bg-gray-50 text-gray-700 min-w-[170px]"
                  >
                    <option value="">All Products</option>
                    {items
                      .filter((item: any) => !categoryId || String(item.categoryId) === String(categoryId))
                      .map((item: any) => (
                        <option key={item.id} value={item.id}>{item.title}</option>
                      ))}
                  </select>
                </div>
              </>
            )}
            {loading && (
              <div className="flex items-center gap-2 text-sm text-gray-400 pb-1">
                <Loader2 size={15} className="animate-spin text-blue-500" />
                <span>Loading report...</span>
              </div>
            )}
          </div>
        </div>

        {/* Empty state */}
        {!selectedType && (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-16 text-center">
            <div className="w-16 h-16 rounded-2xl bg-gray-100 flex items-center justify-center mx-auto mb-4">
              <BarChart3 size={28} className="text-gray-300" />
            </div>
            <p className="text-gray-500 font-semibold text-lg">No Report Selected</p>
            <p className="text-gray-300 text-sm mt-1.5">Choose a report type from the sidebar to view data</p>
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 rounded-2xl p-4 text-sm flex items-center gap-2">
            <span className="w-5 h-5 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0 text-red-500 font-bold text-xs">!</span>
            {error}
          </div>
        )}

        {/* Summary cards */}
        {summary && <SummaryCards type={selectedType} summary={summary} />}

        {/* Data table */}
        {data.length > 0 && (
          <div id="report-print-area" className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            {/* Table header */}
            <div className="px-6 py-4 border-b border-gray-100 flex items-center gap-3">
              {activeReport && activeGroup && (
                <span
                  className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0"
                  style={{ background: activeGroup.accentBg }}
                >
                  <activeReport.icon size={15} style={{ color: activeGroup.accent }} />
                </span>
              )}
              <div>
                <h2 className="font-semibold text-gray-900 text-sm">{activeReport?.label}</h2>
                <p className="text-xs text-gray-400">{data.length} records found</p>
              </div>
              <div className="ml-auto flex items-center gap-1.5 text-xs text-gray-400 bg-gray-50 border border-gray-100 px-3 py-1.5 rounded-lg">
                <Calendar size={11} />
                <span>{startDate}</span>
                <span className="text-gray-300">→</span>
                <span>{endDate}</span>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table id="report-table" className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-900 text-white">
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-400 w-10">#</th>
                    {cols.map(c => (
                      <th key={c} className="px-4 py-3 text-left text-xs font-semibold whitespace-nowrap text-gray-200">
                        {c}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {data.map((row, i) => {
                    const cells = renderRow(selectedType, row, i);
                    return (
                      <tr
                        key={i}
                        className={`border-b border-gray-50 transition-colors hover:bg-blue-50/40 ${i % 2 === 0 ? 'bg-white' : 'bg-gray-50/30'}`}
                      >
                        <td className="px-4 py-3 text-gray-300 text-xs font-mono">{i + 1}</td>
                        {cells.map((cell, ci) => (
                          <td key={ci} className="px-4 py-3 text-gray-700 whitespace-nowrap text-sm">
                            {cell === null || cell === undefined ? (
                              <span className="text-gray-300">—</span>
                            ) : typeof cell === 'object' ? (
                              cell
                            ) : (
                              String(cell)
                            )}
                          </td>
                        ))}
                      </tr>
                    );
                  })}
                </tbody>
                {summary && (
                  <tfoot>
                    {renderFooterRow(selectedType, summary, cols)}
                  </tfoot>
                )}
              </table>
            </div>

            {/* Table footer */}
            <div className="px-6 py-3 bg-gray-50 border-t border-gray-100 text-xs text-gray-400 flex items-center justify-between">
              <span>{data.length} total records</span>
              <span>Period: {startDate} to {endDate}</span>
            </div>
          </div>
        )}

        {/* No data after fetch */}
        {!loading && selectedType && data.length === 0 && !error && summary !== null && (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-12 text-center">
            <div className="w-14 h-14 rounded-2xl bg-gray-100 flex items-center justify-center mx-auto mb-3">
              <FileText size={24} className="text-gray-300" />
            </div>
            <p className="text-gray-500 font-medium">No Records Found</p>
            <p className="text-gray-300 text-sm mt-1">Try adjusting the date range to find results.</p>
          </div>
        )}
      </div>
    </div>
  );
}