import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import {
  Search,
  Download,
  Plus,
  Building2,
  X,
  CalendarDays,
  Clock,
  RefreshCw,
  DollarSign,
  AlertCircle,
  ArrowRightLeft,
  FileText,
} from 'lucide-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { DataTable, Column } from '../../components/DataTable';
import { reservationService } from '../../services/reservationService';
import { BookingActionMenu } from './BookingActionMenu';
import { useConfirm } from '../../components/ConfirmProvider';
import { toast } from 'sonner';
import { billService } from '../../services/billService';
import api from '../../services/api';
import { List, User as UserIcon, LogOut, CheckCircle, XCircle, PlusCircle, AlertTriangle as AlertTriangleIcon } from 'lucide-react';
import { exportToCSV } from '../../utils/exportUtils';
import { calculateInvoice } from '../../components/InvoiceTemplates';

interface Booking {
  id: string;
  dbId?: number;
  guestName: string;
  groupId?: number | null;
  groupName?: string;
  roomNumber: string;
  roomType: string;
  checkIn: string;
  checkOut: string;
  guests: number;
  amount: string;
  status: string;
  paymentStatus: 'paid' | 'pending' | 'partial';
  balanceAmount?: number;
  rooms?: any[];
  perNight?: number;
  stayNights?: number;
}

const statusColors: Record<string, string> = {
  confirmed: 'bg-blue-100 text-blue-700',
  checked_in: 'bg-green-100 text-green-700',
  checked_out: 'bg-gray-100 text-gray-700',
  cancelled: 'bg-red-100 text-red-700',
  draft: 'bg-yellow-100 text-yellow-700',
  reserved: 'bg-purple-100 text-purple-700',
  overdue: 'bg-purple-100 text-red-700',
  half_day: 'bg-amber-100 text-amber-700',
  early_checkout: 'bg-teal-100 text-teal-800',
};

const paymentStatusColors = {
  paid: 'bg-green-100 text-green-700',
  pending: 'bg-yellow-100 text-yellow-700',
  partial: 'bg-orange-100 text-orange-700',
};

const getDateRange = (preset: string) => {
  const now = new Date();

  const format = (d: Date) => {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  };

  switch (preset) {
    case 'today': {
      const todayStr = format(now);
      return { start: todayStr, end: todayStr };
    }

    case 'yesterday': {
      const yesterday = new Date();
      yesterday.setDate(now.getDate() - 1);
      const yesterdayStr = format(yesterday);
      return { start: yesterdayStr, end: yesterdayStr };
    }

    case 'week': {
      const startOfWeek = new Date(now);
      const day = startOfWeek.getDay();
      // Monday as start of week
      const diffStart = startOfWeek.getDate() - day + (day === 0 ? -6 : 1);
      startOfWeek.setDate(diffStart);
      const endOfWeek = new Date(startOfWeek);
      endOfWeek.setDate(startOfWeek.getDate() + 6); // Sunday
      return { start: format(startOfWeek), end: format(endOfWeek) };
    }

    case 'month': {
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0); // last day of month
      return { start: format(startOfMonth), end: format(endOfMonth) };
    }

    default:
      return { start: '', end: '' };
  }
};

export function AllBookings() {
  const navigate = useNavigate();
  const { confirm } = useConfirm();

  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [reservationType, setReservationType] = useState<string>('all');
  const [channelFilter, setChannelFilter] = useState<string>('all');
  const [datePreset, setDatePreset] = useState<string>('all');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [sortBy, setSortBy] = useState<string>('');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

  const [apiBookings, setApiBookings] = useState<Booking[]>([]);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [totalAmountSum, setTotalAmountSum] = useState(0);
  const [totalBalanceSum, setTotalBalanceSum] = useState(0);
  const [loading, setLoading] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [isPdfExporting, setIsPdfExporting] = useState(false);

  const [todayData, setTodayData] = useState<any>({});
  const [cardFilter, setCardFilter] = useState('all');

  const [extendModalOpen, setExtendModalOpen] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [extendFormValues, setExtendFormValues] = useState({
    extendedDate: '',
    extendedTime: '',
  });
  const [extending, setExtending] = useState(false);

  // Extra Charges modal state
  const [halfDayModal, setHalfDayModal] = useState(false);
  const [halfDayBooking, setHalfDayBooking] = useState<Booking | null>(null);
  const [halfDayAmount, setHalfDayAmount] = useState('');
  const [halfDayChargeName, setHalfDayChargeName] = useState('');
  const [halfDayLoading, setHalfDayLoading] = useState(false);

  // Early Checkout modal state
  const [earlyCheckoutModal, setEarlyCheckoutModal] = useState(false);
  const [earlyCheckoutBooking, setEarlyCheckoutBooking] = useState<Booking | null>(null);
  const [earlyCheckoutDate, setEarlyCheckoutDate] = useState('');
  const [earlyCheckoutStayDays, setEarlyCheckoutStayDays] = useState(1);
  const [earlyCheckoutStayAmount, setEarlyCheckoutStayAmount] = useState('');
  const [earlyCheckoutRefund, setEarlyCheckoutRefund] = useState('');
  const [earlyCheckoutMethod, setEarlyCheckoutMethod] = useState('cash');
  const [earlyCheckoutBankId, setEarlyCheckoutBankId] = useState('');
  const [earlyCheckoutNote, setEarlyCheckoutNote] = useState('');
  const [earlyCheckoutMarkDirty, setEarlyCheckoutMarkDirty] = useState(true);
  const [earlyCheckoutLoading, setEarlyCheckoutLoading] = useState(false);

  // Change Room modal state
  const [changeRoomModal, setChangeRoomModal] = useState(false);
  const [changeRoomBooking, setChangeRoomBooking] = useState<any>(null);
  const [selectedPrevRoomId, setSelectedPrevRoomId] = useState<number | string>('');
  const [selectedNewRoomId, setSelectedNewRoomId] = useState<number | string>('');
  const [changeRoomMarkDirty, setChangeRoomMarkDirty] = useState(false);
  const [changeRoomReason, setChangeRoomReason] = useState('');
  const [availableRoomsList, setAvailableRoomsList] = useState<any[]>([]);
  const [changeRoomLoading, setChangeRoomLoading] = useState(false);
  const [fetchingAvailableRooms, setFetchingAvailableRooms] = useState(false);

  // Cancel + Refund modal state
  const [cancelModal, setCancelModal] = useState(false);
  const [pendingCancel, setPendingCancel] = useState<Booking | null>(null);
  const [cancelRefundDetails, setCancelRefundDetails] = useState({
    amount: '',
    method: 'cash',
    bankId: '',
    note: '',
  });

  // Checkout + Refund state
  const [checkoutModal, setCheckoutModal] = useState(false);
  const [pendingCheckout, setPendingCheckout] = useState<{ booking: Booking; newStatus: string } | null>(null);
  const [refundDetails, setRefundDetails] = useState({
    amount: '',
    method: 'cash',
    bankId: '',
    note: '',
  });
  const [checkoutTime, setCheckoutTime] = useState('');
  const [checkoutPerson, setCheckoutPerson] = useState('');
  const [markDirty, setMarkDirty] = useState(false);
  const [waivedAmount, setWaivedAmount] = useState('');
  const [isWaiveEnabled, setIsWaiveEnabled] = useState(false);
  const [hkStaffList, setHkStaffList] = useState<any[]>([]);
  const [selectedHkStaffId, setSelectedHkStaffId] = useState('');
  const [hkEndJob, setHkEndJob] = useState('');
  const [hkNotes, setHkNotes] = useState('');
  const [banksList, setBanksList] = useState<any[]>([]);
  const [checkoutLoading, setCheckoutLoading] = useState(false);

  useEffect(() => {
    billService.getBanks().then((res: any) => {
      setBanksList(res?.data || res || []);
    }).catch(() => { });
  }, []);

  useEffect(() => {
    if (checkoutModal) {
      import('../../services/staffService').then(({ staffService }) => {
        staffService.getStaffList().then(res => {
          const housekeepingStaff = (res.users || []).filter(
            (u: any) => {
              const role = u.role?.toLowerCase();
              return role === 'housekeeping' || role === 'housekeeper';
            }
          );
          setHkStaffList(housekeepingStaff);
        }).catch(err => console.error(err));
      });
    } else {
      setSelectedHkStaffId('');
      setHkEndJob('');
      setHkNotes('');
      setWaivedAmount('');
      setIsWaiveEnabled(false);
    }
  }, [checkoutModal]);

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        const res = await api.put('/reservation/dashboard/data', {}, {
          params: { startDate: startDate || 'all', endDate: endDate || 'all' }
        });
        // API returns { array: { today: { allReservations, checkedIn, ... } } }
        const todayStats = res.data?.array?.today || res.data?.today || res.data || {};
        setTodayData(todayStats);
      } catch (err) {
        console.error("Dashboard fetch error", err);
      }
    };
    fetchDashboard();
  }, [startDate, endDate]);

  const dateOnly = (value?: string) => {
    if (!value) return '';
    return String(value).slice(0, 10);
  };

  const handleDatePresetChange = (preset: string) => {
    setDatePreset(preset);

    if (preset !== 'custom') {
      const range = getDateRange(preset);
      setStartDate(range.start);
      setEndDate(range.end);
    }
  };

  const openExtendModal = (booking: Booking) => {
    setSelectedBooking(booking);
    setExtendFormValues({
      extendedDate: dateOnly(booking.checkOut),
      extendedTime: '',
    });
    setExtendModalOpen(true);
  };
  const ReloadFunc = () => {
    fetchData();
  };

  const closeExtendModal = () => {
    setExtendModalOpen(false);
    setSelectedBooking(null);
    setExtendFormValues({
      extendedDate: '',
      extendedTime: '',
    });
  };

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(searchTerm);
    }, 500);

    return () => clearTimeout(handler);
  }, [searchTerm]);

  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, filterStatus, cardFilter, startDate, endDate, reservationType, channelFilter]);

  const fetchData = async () => {
    setLoading(true);

    try {
      const params = {
        page,
        limit: 10,
        search: debouncedSearch,
        status: filterStatus === 'all' ? undefined : filterStatus,
        startDate: startDate || undefined,
        endDate: endDate || undefined,
        channel: channelFilter === 'all' ? undefined : channelFilter,
        groupOnly:
          reservationType === 'all'
            ? undefined
            : reservationType === 'group'
              ? 'true'
              : 'false',
        sortBy: sortBy || undefined,
        sortOrder: sortOrder || undefined,
      };

      const response = await reservationService.getAll(params);

      const mappedData = (response.data || []).map((res: any) => {
        const roomNumbers =
          res.rooms?.map((r: any) => r.roomNo).join(', ') || 'N/A';

        const roomTypes =
          res.rooms?.map((r: any) => r.RoomType?.name).join(', ') || 'N/A';

        const inv = calculateInvoice(res, "all");
        const rawTotal = Math.max(0, inv.grandTotal);
        const rawBalance = inv.balanceDue;

        let paymentStat: 'paid' | 'pending' | 'partial' = 'pending';
        if (rawBalance <= 0 && rawTotal > 0) {
          paymentStat = 'paid';
        } else if (inv.grossPaid > 0) {
          paymentStat = 'partial';
        }

        const stayNights = inv.stayDays || 1;
        const roomRentTotal = inv.roomTotal > 0 ? inv.roomTotal : rawTotal;
        const perNightVal = stayNights > 0 ? Math.round(roomRentTotal / stayNights) : roomRentTotal;

        return {
          id: res.refno || String(res.id),
          dbId: res.id,
          guestName: res.customer?.name || 'Unknown',
          groupId: res.groupId || null,
          groupName: res.group?.name || null,
          roomNumber: roomNumbers,
          roomType: roomTypes,
          checkIn: res.startDate,
          checkOut: res.endDate,
          startTime: res.startTime,
          endTime: res.endTime,
          amount: `PKR ${rawTotal.toLocaleString()}`,
          balanceAmount: `PKR ${rawBalance.toLocaleString()}`,
          status: res.status || 'draft',
          paymentStatus: paymentStat,
          balanceAmount1: rawBalance,
          advancePaid1: inv.grossPaid,
          refundedAmount: inv.refundedAmount || 0,
          rooms: res.rooms || [],
          stayNights,
          perNight: perNightVal,
        };
      });

      // If a card filter is active, use the dashboard data directly
      if (cardFilter !== 'all' && todayData) {
        const cardKeyMap: Record<string, string> = {
          allReservations: 'allReservations',
          checkedIn: 'checkedIn',
          checkOut: 'checkOutToday',
          checkedOut: 'checkedOut',
          canceled: 'canceled',
          newBookings: 'newBookings',
          expectedArrivals: 'expectedArrivals',
          overdue: 'overdue',
        };
        const key = cardKeyMap[cardFilter];
        const cardData = todayData[key]?.data || [];
        const mapped = cardData.map((res: any) => {
          const inv = calculateInvoice(res, "all");
          const rawTotal2 = Math.max(0, inv.grandTotal);
          const rawBalance2 = inv.balanceDue;

          let paymentStat: 'paid' | 'pending' | 'partial' = 'pending';
          if (rawBalance2 <= 0 && rawTotal2 > 0) {
            paymentStat = 'paid';
          } else if (inv.grossPaid > 0) {
            paymentStat = 'partial';
          }

          const roomNumbers =
            res.rooms?.map((r: any) => r.roomNo || r.number).join(', ') || 'N/A';

          const roomTypes =
            res.rooms?.map((r: any) => r.RoomType?.name || r.roomType?.name).join(', ') || 'N/A';

          const stayNights2 = inv.stayDays || 1;
          const roomRentTotal2 = inv.roomTotal > 0 ? inv.roomTotal : rawTotal2;
          const perNightVal2 = stayNights2 > 0 ? Math.round(roomRentTotal2 / stayNights2) : roomRentTotal2;

          return {
            id: res.refno || String(res.id),
            dbId: res.id,
            guestName: res.customer?.name || res.customerName || res.guest?.name || res.guest?.firstName || 'Unknown',
            groupId: res.groupId || null,
            groupName: res.group?.name || null,
            roomNumber: roomNumbers,
            roomType: roomTypes,
            checkIn: res.startDate,
            checkOut: res.endDate,
            startTime: res.startTime,
            endTime: res.endTime,
            amount: `PKR ${rawTotal2.toLocaleString()}`,
            balanceAmount: `PKR ${rawBalance2.toLocaleString()}`,
            status: res.status || 'draft',
            paymentStatus: paymentStat,
            balanceAmount1: rawBalance2,
            advancePaid1: inv.grossPaid,
            refundedAmount: inv.refundedAmount || 0,
            rooms: res.rooms || [],
            stayNights: stayNights2,
            perNight: perNightVal2,
          };
        });
        setApiBookings(mapped);
        setTotal(mapped.length);
        const cardSumAmount = mapped.reduce((acc: number, r: any) => acc + (Number(r.amount?.replace(/[^0-9.-]+/g, '')) || 0), 0);
        const cardSumBalance = mapped.reduce((acc: number, r: any) => acc + (Number(r.balanceAmount1 || 0)), 0);
        setTotalAmountSum(cardSumAmount);
        setTotalBalanceSum(cardSumBalance);
        setLoading(false);
        return;
      }

      setApiBookings(mappedData);
      setTotal(response.total || 0);
      const sumAmount = mappedData.reduce((acc: number, r: any) => acc + (r.balanceAmount1 + r.advancePaid1 || 0), 0);
      const sumBalance = mappedData.reduce((acc: number, r: any) => acc + (r.balanceAmount1 || 0), 0);
      setTotalAmountSum(sumAmount);
      setTotalBalanceSum(sumBalance);
    } catch (err) {
      console.error(err);
      toast('Failed to fetch bookings');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [page, debouncedSearch, filterStatus, startDate, endDate, reservationType, channelFilter, cardFilter, sortBy, sortOrder]);

  const handleDelete = async (id: any) => {
    const isConfirmed = await confirm({
      title: 'Delete Booking',
      message:
        'Are you sure you want to delete this booking? This action cannot be undone.',
    });

    if (isConfirmed) {
      try {
        await reservationService.deleteReservation(id);
        fetchData();
      } catch (err) {
        console.error(err);
        toast('Failed to delete booking');
      }
    }
  };

  const handleStatusChange = async (booking: Booking, newStatus: string) => {
    if (newStatus === 'cancelled') {
      const advancePaid = Number((booking as any).advancePaid1 ?? (booking as any).advancePaid ?? 0);
      setPendingCancel(booking);
      setCancelRefundDetails({
        amount: advancePaid > 0 ? String(advancePaid) : '',
        method: 'cash',
        bankId: '',
        note: '',
      });
      setCancelModal(true);
      return;
    }

    if (newStatus === 'half_day') {
      // Pre-fill 50% of room rate as default extra charge amount
      const roomRate = Number((booking as any).roomRate || (booking as any).pricePerDay || 0);
      const defaultHalfDay = roomRate > 0 ? String(Math.round(roomRate * 0.5)) : '';
      setHalfDayBooking(booking);
      setHalfDayAmount(defaultHalfDay);
      setHalfDayChargeName('');
      setHalfDayModal(true);
      return;
    }

    if (newStatus === 'early_checkout') {
      const todayStr = new Date().toISOString().split('T')[0];
      const checkInDate = booking.checkIn ? new Date(booking.checkIn) : new Date();
      const todayDate = new Date(todayStr);
      const diffTime = Math.max(0, todayDate.getTime() - checkInDate.getTime());
      const stayDays = Math.max(1, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));

      const checkOutDate = booking.checkOut ? new Date(booking.checkOut) : checkInDate;
      const bookedDays = Math.max(1, Math.ceil(Math.max(0, checkOutDate.getTime() - checkInDate.getTime()) / (1000 * 60 * 60 * 24)));
      const rawTotal = (booking as any).balanceAmount1 + (booking as any).advancePaid1 || 0;
      const dailyRate = Number((booking as any).roomRate || (booking as any).pricePerDay || (bookedDays > 0 ? Math.round(rawTotal / bookedDays) : rawTotal));

      const suggestedStayAmount = dailyRate * stayDays;
      const advancePaid = Number((booking as any).advancePaid1 ?? (booking as any).advancePaid ?? 0);
      const suggestedRefund = Math.max(0, advancePaid - suggestedStayAmount);

      setEarlyCheckoutBooking(booking);
      setEarlyCheckoutDate(todayStr);
      setEarlyCheckoutStayDays(stayDays);
      setEarlyCheckoutStayAmount(String(suggestedStayAmount));
      setEarlyCheckoutRefund(String(suggestedRefund));
      setEarlyCheckoutMethod('cash');
      setEarlyCheckoutBankId('');
      setEarlyCheckoutNote('');
      setEarlyCheckoutMarkDirty(true);
      setEarlyCheckoutModal(true);
      return;
    }

    if (newStatus === 'checked_out') {
      const balance = Number((booking as any).balanceAmount1 ?? 0);
      const hasGroupBilling = !!(booking as any).groupId;

      // Always block checkout if balance is outstanding (unless group billing)
      if (!hasGroupBilling && balance > 0) {
        toast.warning(`⚠️ Pending balance of PKR ${balance.toLocaleString()} must be cleared before checkout! Please add payment first.`, {
          duration: 5000,
        });
        return;
      }

      // Always open checkout modal — refund section shows when balance < 0
      const now = new Date();
      const hh = String(now.getHours()).padStart(2, '0');
      const mm = String(now.getMinutes()).padStart(2, '0');
      setCheckoutTime(`${hh}:${mm}`);
      setCheckoutPerson('');
      setMarkDirty(false);
      setWaivedAmount('');
      setIsWaiveEnabled(false);
      setRefundDetails({
        amount: balance < 0 ? String(Math.abs(balance)) : '',
        method: 'cash',
        bankId: '',
        note: '',
      });
      setPendingCheckout({ booking, newStatus });
      setCheckoutModal(true);
      return;
    }

    try {
      await reservationService.updateStatus(booking.dbId, newStatus);
      fetchData();
    } catch (err) {
      console.error(err);
      toast.error('Failed to update status');
    }
  };

  const handleApplyHalfDay = async () => {
    if (!halfDayBooking?.dbId) return;
    const amount = Number(halfDayAmount);
    if (!halfDayAmount || isNaN(amount) || amount <= 0) {
      toast.error('Please enter a valid amount');
      return;
    }
    if (!halfDayChargeName.trim()) {
      toast.error('Please enter a charge name');
      return;
    }
    setHalfDayLoading(true);
    try {
      await reservationService.applyHalfDay(halfDayBooking.dbId, {
        halfDayAmount: amount,
        chargeName: halfDayChargeName.trim(),
      });
      toast.success('Extra charge saved successfully!');
      setHalfDayModal(false);
      setHalfDayBooking(null);
      fetchData();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Failed to save extra charge');
    } finally {
      setHalfDayLoading(false);
    }
  };

  const handleEarlyCheckoutDateChange = (newDateStr: string) => {
    setEarlyCheckoutDate(newDateStr);
    if (!earlyCheckoutBooking) return;
    const checkInDate = earlyCheckoutBooking.checkIn ? new Date(earlyCheckoutBooking.checkIn) : new Date();
    const newDate = new Date(newDateStr);
    const diffTime = Math.max(0, newDate.getTime() - checkInDate.getTime());
    const stayDays = Math.max(1, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));
    setEarlyCheckoutStayDays(stayDays);

    const checkOutDate = earlyCheckoutBooking.checkOut ? new Date(earlyCheckoutBooking.checkOut) : checkInDate;
    const bookedDays = Math.max(1, Math.ceil(Math.max(0, checkOutDate.getTime() - checkInDate.getTime()) / (1000 * 60 * 60 * 24)));
    const rawTotal = (earlyCheckoutBooking as any).balanceAmount1 + (earlyCheckoutBooking as any).advancePaid1 || 0;
    const dailyRate = Number((earlyCheckoutBooking as any).roomRate || (earlyCheckoutBooking as any).pricePerDay || (bookedDays > 0 ? Math.round(rawTotal / bookedDays) : rawTotal));

    const newStayAmt = dailyRate * stayDays;
    const advancePaid = Number((earlyCheckoutBooking as any).advancePaid1 ?? (earlyCheckoutBooking as any).advancePaid ?? 0);
    const refund = Math.max(0, advancePaid - newStayAmt);

    setEarlyCheckoutStayAmount(String(newStayAmt));
    setEarlyCheckoutRefund(String(refund));
  };

  const handleApplyEarlyCheckout = async () => {
    if (!earlyCheckoutBooking?.dbId) return;
    setEarlyCheckoutLoading(true);
    try {
      await reservationService.applyEarlyCheckout(earlyCheckoutBooking.dbId, {
        earlyCheckoutDate,
        actualDays: earlyCheckoutStayDays,
        adjustedStayAmount: Number(earlyCheckoutStayAmount || 0),
        refundAmount: Number(earlyCheckoutRefund || 0),
        refundMethod: earlyCheckoutMethod,
        bankId: earlyCheckoutBankId || undefined,
        note: earlyCheckoutNote || undefined,
        markDirty: earlyCheckoutMarkDirty,
      });
      toast.success('Early checkout applied successfully!');
      setEarlyCheckoutModal(false);
      setEarlyCheckoutBooking(null);
      fetchData();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Failed to apply early checkout');
    } finally {
      setEarlyCheckoutLoading(false);
    }
  };

  const openChangeRoomModal = async (booking: any) => {
    setChangeRoomBooking(booking);
    const rooms = booking.rooms || [];
    const firstRoomId = rooms.length > 0 ? (rooms[0].id || rooms[0].assignedRoomId) : '';
    setSelectedPrevRoomId(firstRoomId);
    setSelectedNewRoomId('');
    setChangeRoomMarkDirty(false);
    setChangeRoomReason('');
    setChangeRoomModal(true);
    setFetchingAvailableRooms(true);

    try {
      const todayStr = new Date().toISOString().split('T')[0];
      const res = await api.get(`/assignRoom/assigned-rooms-with-type?date=${todayStr}`);
      const allRooms = res.data?.data || [];
      const currentRoomIds = rooms.map((r: any) => Number(r.id || r.assignedRoomId));
      const available = allRooms.filter((r: any) => 
        (r.status === 'available' || r.status === 'dirty') && 
        !currentRoomIds.includes(Number(r.id))
      );
      setAvailableRoomsList(available);
    } catch (err) {
      console.error('Failed to load available rooms:', err);
      toast.error('Failed to load available rooms');
    } finally {
      setFetchingAvailableRooms(false);
    }
  };

  const handleConfirmRoomChange = async () => {
    if (!changeRoomBooking || !selectedPrevRoomId || !selectedNewRoomId) {
      toast.error('Please select both current room and new room');
      return;
    }

    setChangeRoomLoading(true);
    try {
      const res = await reservationService.changeRoom(changeRoomBooking.dbId, {
        previousRoomId: selectedPrevRoomId,
        newRoomId: selectedNewRoomId,
        markDirty: changeRoomMarkDirty,
        note: changeRoomReason,
      });

      toast.success(res?.message || 'Room changed successfully! Previous room is now Available.');
      setChangeRoomModal(false);
      setChangeRoomBooking(null);
      fetchData();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Failed to change room');
    } finally {
      setChangeRoomLoading(false);
    }
  };

  const confirmCancel = async (withRefund = true) => {
    if (!pendingCancel) return;

    try {
      const refund = withRefund && Number(cancelRefundDetails.amount) > 0 ? {
        amount: Number(cancelRefundDetails.amount),
        method: cancelRefundDetails.method,
        bankId: cancelRefundDetails.bankId || undefined,
        note: cancelRefundDetails.note || undefined,
      } : undefined;

      await reservationService.updateStatus(pendingCancel.dbId, 'cancelled', refund);
      toast.success('Reservation cancelled successfully');
      setCancelModal(false);
      setPendingCancel(null);
      fetchData();
    } catch (err) {
      console.error(err);
      toast.error('Failed to cancel reservation');
    }
  };

  const confirmCheckout = async (skipRefund = false) => {
    if (!pendingCheckout) return;
    const balance = Number((pendingCheckout.booking as any).balanceAmount1 ?? 0);
    const hasRefund = balance < 0 && !skipRefund;

    setCheckoutLoading(true);
    try {
      await reservationService.checkout(
        pendingCheckout.booking.dbId,
        {
          status: pendingCheckout.newStatus,
          checkoutPerson: checkoutPerson.trim() || null,
          endTime: checkoutTime || null,
          markDirty,
          hkStaffId: selectedHkStaffId || null,
          hkEndJob: hkEndJob || null,
          hkNotes: hkNotes || null,
          refundDetails: hasRefund
            ? {
              amount: Number(refundDetails.amount),
              method: refundDetails.method,
              bankId: refundDetails.bankId || undefined,
              note: refundDetails.note || undefined,
            }
            : null,
          waivedAmount: waivedAmount ? Number(waivedAmount) : 0,
        }
      );
      toast.success('Checkout successful!');
      setCheckoutModal(false);
      setPendingCheckout(null);
      fetchData();
    } catch (err: any) {
      console.error(err);
      toast.error(err?.response?.data?.message || 'Failed to checkout');
    } finally {
      setCheckoutLoading(false);
    }
  };

  const handleExtendReservation = async () => {
    if (!selectedBooking?.dbId) {
      toast.error('Invalid booking selected');
      return;
    }

    if (!extendFormValues.extendedDate) {
      toast.error('Please select new checkout date');
      return;
    }

    const currentCheckoutDate = dateOnly(selectedBooking.checkOut);

    if (extendFormValues.extendedDate < currentCheckoutDate) {
      toast.error('New checkout date cannot be before current checkout date');
      return;
    }

    setExtending(true);

    try {
      const payload: any = {
        endDate: extendFormValues.extendedDate,
      };

      if (extendFormValues.extendedTime) {
        payload.endTime = extendFormValues.extendedTime;
      }

      await reservationService.extendReservation(selectedBooking.dbId, payload);

      toast.success('Reservation extended successfully');
      closeExtendModal();
      fetchData();
    } catch (error: any) {
      console.error(error);
      toast(
        error?.response?.data?.message ||
        error?.message ||
        'Failed to extend reservation'
      );
    } finally {
      setExtending(false);
    }
  };

  const fetchAllFilteredBookings = async () => {
    if (cardFilter !== 'all' && todayData) {
      const cardKeyMap: Record<string, string> = {
        allReservations: 'allReservations',
        checkedIn: 'checkedIn',
        checkOut: 'checkOutToday',
        checkedOut: 'checkedOut',
        canceled: 'canceled',
        newBookings: 'newBookings',
        expectedArrivals: 'expectedArrivals',
        overdue: 'overdue',
      };
      const key = cardKeyMap[cardFilter];
      const cardData = todayData[key]?.data || [];
      return cardData.map((res: any) => {
        const inv = calculateInvoice(res, "all");
        const totalVal = Math.max(0, inv.grandTotal);
        const balVal = inv.balanceDue;

        let paymentStat: 'paid' | 'pending' | 'partial' = 'pending';
        if (balVal <= 0 && totalVal > 0) {
          paymentStat = 'paid';
        } else if (inv.grossPaid > 0) {
          paymentStat = 'partial';
        }
        const roomNumbers = res.rooms?.map((r: any) => r.roomNo || r.number).join(', ') || 'N/A';
        const stayNights = inv.stayDays || 1;
        const roomRentTotal = inv.roomTotal > 0 ? inv.roomTotal : totalVal;
        const perNightVal = stayNights > 0 ? Math.round(roomRentTotal / stayNights) : roomRentTotal;

        return {
          id: res.refno || String(res.id),
          guestName: res.customer?.name || res.customerName || res.guest?.name || res.guest?.firstName || 'Unknown',
          roomNumber: roomNumbers,
          checkIn: res.startDate ? String(res.startDate).split('T')[0] : '',
          checkOut: res.endDate ? String(res.endDate).split('T')[0] : '',
          rawAmount: totalVal,
          rawBalance: balVal,
          rawPerNight: perNightVal,
          amount: `PKR ${totalVal.toLocaleString()}`,
          balanceAmount: `PKR ${balVal.toLocaleString()}`,
          perNight: `PKR ${perNightVal.toLocaleString()}`,
          status: res.status || 'draft',
          paymentStatus: paymentStat,
        };
      });
    }

    const params = {
      page: 1,
      limit: 10000,
      search: debouncedSearch || undefined,
      status: filterStatus === 'all' ? undefined : filterStatus,
      startDate: startDate || undefined,
      endDate: endDate || undefined,
      channel: channelFilter === 'all' ? undefined : channelFilter,
      groupOnly:
        reservationType === 'all'
          ? undefined
          : reservationType === 'group'
            ? 'true'
            : 'false',
      sortBy: sortBy || undefined,
      sortOrder: sortOrder || undefined,
    };

    const response = await reservationService.getAll(params);
    return (response.data || []).map((res: any) => {
      const inv = calculateInvoice(res, "all");
      const totalVal = Math.max(0, inv.grandTotal);
      const balVal = inv.balanceDue;

      const roomNumbers = res.rooms?.map((r: any) => r.roomNo).join(', ') || 'N/A';
      let paymentStat: 'paid' | 'pending' | 'partial' = 'pending';
      if (balVal <= 0 && totalVal > 0) {
        paymentStat = 'paid';
      } else if (inv.grossPaid > 0) {
        paymentStat = 'partial';
      }
      const stayNights = inv.stayDays || 1;
      const roomRentTotal = inv.roomTotal > 0 ? inv.roomTotal : totalVal;
      const perNightVal = stayNights > 0 ? Math.round(roomRentTotal / stayNights) : roomRentTotal;

      return {
        id: res.refno || String(res.id),
        guestName: res.customer?.name || 'Unknown',
        roomNumber: roomNumbers,
        checkIn: res.startDate ? String(res.startDate).split('T')[0] : '',
        checkOut: res.endDate ? String(res.endDate).split('T')[0] : '',
        rawAmount: totalVal,
        rawBalance: balVal,
        rawPerNight: perNightVal,
        amount: `PKR ${totalVal.toLocaleString()}`,
        balanceAmount: `PKR ${balVal.toLocaleString()}`,
        perNight: `PKR ${perNightVal.toLocaleString()}`,
        status: res.status || 'draft',
        paymentStatus: paymentStat,
      };
    });
  };

  const handleExport = async () => {
    setIsExporting(true);
    try {
      const allData = await fetchAllFilteredBookings();
      if (!allData || allData.length === 0) {
        toast.info('No bookings to export');
        return;
      }

      const sumAmount = allData.reduce((acc: number, item: any) => acc + (item.rawAmount || 0), 0);
      const sumBalance = allData.reduce((acc: number, item: any) => acc + (item.rawBalance || 0), 0);

      const summaryRow = {
        id: `Total (${allData.length} Bookings)`,
        guestName: '',
        roomNumber: '',
        checkIn: '',
        checkOut: '',
        amount: `PKR ${sumAmount.toLocaleString()}`,
        balanceAmount: `PKR ${sumBalance.toLocaleString()}`,
        perNight: '',
        status: '',
        paymentStatus: '',
      };

      const exportColumns = [
        { header: 'Booking ID', accessorKey: 'id' },
        { header: 'Guest Name', accessorKey: 'guestName' },
        { header: 'Room', accessorKey: 'roomNumber' },
        { header: 'Check-In', accessorKey: 'checkIn' },
        { header: 'Check-Out', accessorKey: 'checkOut' },
        { header: 'Amount', accessorKey: 'amount' },
        { header: 'Balance', accessorKey: 'balanceAmount' },
        { header: 'Per Night', accessorKey: 'perNight' },
        { header: 'Status', accessorKey: 'status' },
        { header: 'Payment', accessorKey: 'paymentStatus' },
      ];

      exportToCSV([...allData, summaryRow], `bookings_${new Date().toISOString().split('T')[0]}.csv`, exportColumns);
      toast.success(`Exported ${allData.length} bookings successfully!`);
    } catch (err) {
      console.error('Export CSV Error:', err);
      toast.error('Failed to export bookings to CSV');
    } finally {
      setIsExporting(false);
    }
  };

  const handleDownloadPDF = async () => {
    setIsPdfExporting(true);
    try {
      const allData = await fetchAllFilteredBookings();
      if (!allData || allData.length === 0) {
        toast.info('No bookings to download');
        return;
      }

      const sumAmount = allData.reduce((acc: number, item: any) => acc + (item.rawAmount || 0), 0);
      const sumBalance = allData.reduce((acc: number, item: any) => acc + (item.rawBalance || 0), 0);

      const doc = new jsPDF({ orientation: 'landscape', unit: 'pt', format: 'a4' });

      doc.setFontSize(18);
      doc.setTextColor(29, 78, 216);
      doc.text('Dove Inn Hotel - Reservations Report', 40, 40);

      doc.setFontSize(10);
      doc.setTextColor(100, 116, 139);
      const generatedAt = new Date().toLocaleString();
      doc.text(`Generated: ${generatedAt} | Total Records: ${allData.length}`, 40, 58);

      const tableBody = allData.map((item: any) => [
        item.id,
        item.guestName,
        item.roomNumber,
        item.checkIn,
        item.checkOut,
        item.amount,
        item.balanceAmount,
        item.perNight,
        (item.status || '').replace('_', ' ').toUpperCase(),
        (item.paymentStatus || '').toUpperCase(),
      ]);

      const tableFoot = [
        [
          `Total: ${allData.length} Bookings`,
          '',
          '',
          '',
          '',
          `PKR ${sumAmount.toLocaleString()}`,
          `PKR ${sumBalance.toLocaleString()}`,
          '',
          '',
          '',
        ]
      ];

      autoTable(doc, {
        startY: 70,
        head: [['Booking ID', 'Guest Name', 'Room', 'Check-In', 'Check-Out', 'Amount', 'Balance', 'Per Night', 'Status', 'Payment']],
        body: tableBody,
        foot: tableFoot,
        theme: 'grid',
        headStyles: {
          fillColor: [29, 78, 216],
          textColor: 255,
          fontStyle: 'bold',
          fontSize: 9,
        },
        footStyles: {
          fillColor: [241, 245, 249],
          textColor: [15, 23, 42],
          fontStyle: 'bold',
          fontSize: 9,
        },
        styles: {
          fontSize: 8,
          cellPadding: 4,
        },
        alternateRowStyles: {
          fillColor: [248, 250, 252],
        },
      });

      doc.save(`reservations_${new Date().toISOString().split('T')[0]}.pdf`);
      toast.success(`Downloaded PDF with ${allData.length} bookings!`);
    } catch (err) {
      console.error('Download PDF Error:', err);
      toast.error('Failed to generate PDF');
    } finally {
      setIsPdfExporting(false);
    }
  };

  const columns: Column<Booking>[] = [
    {
      header: 'Booking ID',
      accessorKey: 'id',
      sortable: true,
      cell: (b) => (
        <button
          type="button"
          onClick={() => navigate(`/booking/${b.dbId || b.id}`)}
          className="text-sm font-semibold cursor-pointer text-[#1D4ED8] hover:text-[#1E40AF] hover:underline transition-colors"
        >
          {b.id}
        </button>
      ),
    },
    {
      header: 'Guest Name',
      accessorKey: 'guestName',
      sortable: true,
      cell: (b: any) => (
        <div className="flex flex-col items-start gap-0.5">
          <span className="text-sm text-gray-900 font-medium">{b.guestName}</span>

          {b.groupId && (
            <span
              title={b.groupName ? `Group: ${b.groupName}` : 'Group Booking'}
              className="inline-flex items-center gap-1 px-1.5 py-0.5 bg-blue-50 border border-blue-200 text-blue-600 rounded text-[10px] font-semibold leading-none mt-0.5"
            >
              <Building2 size={9} />
              {b.groupName || 'Group'}
            </span>
          )}
        </div>
      ),
    },
    {
      header: 'Room',
      accessorKey: 'roomNumber',
      sortable: true,
      cell: (b) => {
        const rooms = b.roomNumber && b.roomNumber !== 'N/A' ? b.roomNumber.split(', ') : [];
        return (
          <div className="flex flex-wrap gap-x-2 gap-y-1 max-w-[200px]">
            {rooms.length > 0 ? rooms.map((room: string, i: number) => (
              <span key={i} className="font-medium text-gray-900 text-sm">{room}{i < rooms.length - 1 ? ',' : ''}</span>
            )) : (
              <span className="font-medium text-gray-900 text-sm">N/A</span>
            )}
          </div>
        );
      },
    },
    {
      header: 'Check-In',
      accessorKey: 'checkIn',
      sortable: true,
      cell: (b) => (
        <div className="flex flex-col">
          <span className="text-sm text-gray-900">
            {b.checkIn ? new Date(b.checkIn).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : '-'}
          </span>
          {b.startTime && (
            <span className="text-xs text-gray-500">
              {(() => {
                const [h, m] = b.startTime.split(':');
                const hour = parseInt(h, 10);
                const ampm = hour >= 12 ? 'PM' : 'AM';
                return `${hour % 12 || 12}:${m} ${ampm}`;
              })()}
            </span>
          )}
        </div>
      ),
    },
    {
      header: 'Check-Out',
      accessorKey: 'checkOut',
      sortable: true,
      cell: (b) => (
        <div className="flex flex-col">
          <span className="text-sm text-gray-900">
            {b.checkOut ? new Date(b.checkOut).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : '-'}
          </span>
          {b.endTime && (
            <span className="text-xs text-gray-500">
              {(() => {
                const [h, m] = b.endTime.split(':');
                const hour = parseInt(h, 10);
                const ampm = hour >= 12 ? 'PM' : 'AM';
                return `${hour % 12 || 12}:${m} ${ampm}`;
              })()}
            </span>
          )}
        </div>
      ),
    },

    {
      header: 'Amount',
      accessorKey: 'amount',
      sortable: true,
      cell: (b: any) => (
        <div className="flex flex-col">
          <span className="text-sm font-medium text-gray-900">{b.amount}</span>
          {Boolean(b.refundedAmount && b.refundedAmount > 0) && (
            <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-rose-600 bg-rose-50 border border-rose-200 px-1.5 py-0.5 rounded mt-0.5 w-max">
              Refund: PKR {Number(b.refundedAmount).toLocaleString()}
            </span>
          )}
        </div>
      ),
    },
    {
      header: 'Balance',
      accessorKey: 'balanceAmount',
      sortable: true,
      cell: (b) => <span className="text-sm text-gray-900">{b.balanceAmount}</span>,
    },
    {
      header: 'Per Night',
      accessorKey: 'perNight',
      sortable: true,
      cell: (b: any) => (
        <div className="flex flex-col">
          <span className="text-sm font-medium text-blue-700">
            PKR {Number(b.perNight || 0).toLocaleString()}
          </span>
          <span className="text-[10px] text-gray-400">
            {b.stayNights || 1} night{(b.stayNights || 1) > 1 ? 's' : ''}
          </span>
        </div>
      ),
    },
    {
      header: 'Status',
      accessorKey: 'status',
      sortable: true,
      cell: (b) => {
        const statusOptionsMap: Record<string, { label: string; value: string }[]> = {
          reserved: [
            { label: 'Reserved', value: 'reserved' },
            { label: 'Checked In', value: 'checked_in' },
            { label: 'Cancelled', value: 'cancelled' },
          ],
          checked_in: [
            { label: 'Checked In', value: 'checked_in' },
            { label: 'Extra Charges', value: 'half_day' },
            { label: 'Early Checkout', value: 'early_checkout' },
            { label: 'Checked Out', value: 'checked_out' },
            { label: 'Cancelled', value: 'cancelled' },
          ],
          overdue: [
            { label: 'Overdue', value: 'overdue' },
            { label: 'Extra Charges', value: 'half_day' },
            { label: 'Early Checkout', value: 'early_checkout' },
            { label: 'Checked Out', value: 'checked_out' },
          ],
          half_day: [
            { label: 'Half Day', value: 'half_day' },
            { label: 'Early Checkout', value: 'early_checkout' },
            { label: 'Checked Out', value: 'checked_out' },
          ],
          early_checkout: [{ label: 'Early Checkout', value: 'early_checkout' }],
          checked_out: [{ label: 'Checked Out', value: 'checked_out' }],
          cancelled: [{ label: 'Cancelled', value: 'cancelled' }],
        };

        const options = statusOptionsMap[b.status] || [
          { label: b.status || 'Unknown', value: b.status || '' },
        ];

        const isLocked = b.status === 'checked_out' || b.status === 'cancelled' || b.status === 'early_checkout';

        return (
          <select
            value={b.status}
            disabled={isLocked}
            onChange={(e) => handleStatusChange(b, e.target.value)}
            className={`px-3 py-1  rounded-full text-xs font-medium outline-none appearance-none pr-6 bg-no-repeat ${isLocked ? 'cursor-not-allowed opacity-80' : 'cursor-pointer'
              } ${statusColors[b.status] || 'bg-gray-100 text-gray-700'}`}
            style={{
              backgroundImage: isLocked
                ? 'none'
                : `url("data:image/svg+xml;charset=US-ASCII,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%22292.4%22%20height%3D%22292.4%22%3E%3Cpath%20fill%3D%22currentColor%22%20d%3D%22M287%2069.4a17.6%2017.6%200%200%200-13-5.4H18.4c-5%200-9.3%201.8-12.9%205.4A17.6%2017.6%200%200%200%200%2082.2c0%205%201.8%209.3%205.4%2012.9l128%20127.9c3.6%203.6%207.8%205.4%2012.8%205.4s9.2-1.8%2012.8-5.4L287%2095c3.5-3.5%205.4-7.8%205.4-12.8%200-5-1.9-9.2-5.4-12.8z%22%2F%3E%3C%2Fsvg%3E")`,
              backgroundPosition: 'right .5rem top 50%',
              backgroundSize: '.55rem auto',
            }}
          >
            {options.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        );
      },
    },
    {
      header: 'Payment',
      accessorKey: 'paymentStatus',
      sortable: true,
      cell: (b) => (
        <span
          className={`inline-flex px-3 py-1 rounded-full text-xs font-medium ${paymentStatusColors[
            b.paymentStatus as keyof typeof paymentStatusColors
            ] || 'bg-gray-100 text-gray-700'
            }`}
        >
          {b.paymentStatus.charAt(0).toUpperCase() + b.paymentStatus.slice(1)}
        </span>
      ),
    },
    {
      header: 'Actions',
      cell: (b: any) => (
        <BookingActionMenu
          booking={b}
          onDelete={handleDelete}
          onExtend={openExtendModal}
          onChangeRoom={openChangeRoomModal}
          onSuccess={ReloadFunc}
        />
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-[#0F172A]">Bookings</h1>
          <p className="text-gray-600 mt-1">
            Manage and view all hotel reservations
          </p>
        </div>

        <button
          onClick={() => navigate('/booking/create')}
          className="flex items-center gap-2 bg-[#1D4ED8] text-white px-6 py-3 rounded-lg hover:bg-[#1E40AF] transition-colors"
        >
          <Plus size={20} />
          New Booking
        </button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-3 mb-2">
        {/* All Reservations */}
        <div
          onClick={() => setCardFilter(cardFilter === 'allReservations' ? 'all' : 'allReservations')}
          className={`bg-white p-3 rounded-xl shadow-sm border cursor-pointer transition-all ${cardFilter === 'allReservations' ? 'border-[#1D4ED8] ring-1 ring-[#1D4ED8] scale-[1.02]' : 'border-gray-100 hover:border-[#1D4ED8]'}`}
        >
          <div className="flex items-center mb-2">
            <List className="text-[#1D4ED8] mr-2" size={24} />
            <h3 className="text-[#1D4ED8] font-bold text-xl m-0">{todayData?.allReservations?.count ?? 0}</h3>
          </div>
          <h6 className="text-gray-800 font-semibold text-sm m-0">All Reservations</h6>
          <p className="text-gray-500 text-xs m-0">Within range</p>
        </div>

        {/* Check In */}
        <div
          onClick={() => setCardFilter(cardFilter === 'checkedIn' ? 'all' : 'checkedIn')}
          className={`bg-white p-3 rounded-xl shadow-sm border cursor-pointer transition-all ${cardFilter === 'checkedIn' ? 'border-[#1D4ED8] ring-1 ring-[#1D4ED8] scale-[1.02]' : 'border-gray-100 hover:border-[#1D4ED8]'}`}
        >
          <div className="flex items-center mb-2">
            <UserIcon className="text-[#1D4ED8] mr-2" size={24} />
            <h3 className="text-[#1D4ED8] font-bold text-xl m-0">{todayData?.checkedIn?.count ?? 0}</h3>
          </div>
          <h6 className="text-gray-800 font-semibold text-sm m-0">Check In</h6>
          <p className="text-gray-500 text-xs m-0">Active reservations</p>
        </div>

        {/* Departures */}
        <div
          onClick={() => setCardFilter(cardFilter === 'checkOut' ? 'all' : 'checkOut')}
          className={`bg-white p-3 rounded-xl shadow-sm border cursor-pointer transition-all ${cardFilter === 'checkOut' ? 'border-yellow-500 ring-1 ring-yellow-500 scale-[1.02]' : 'border-gray-100 hover:border-yellow-300'}`}
        >
          <div className="flex items-center mb-2">
            <LogOut className="text-yellow-500 mr-2" size={24} />
            <h3 className="text-yellow-500 font-bold text-xl m-0">{todayData?.checkOutToday?.count ?? 0}</h3>
          </div>
          <h6 className="text-gray-800 font-semibold text-sm m-0">Departures</h6>
          <p className="text-gray-500 text-xs m-0">Expected checkout</p>
        </div>

        {/* Checked Out */}
        <div
          onClick={() => setCardFilter(cardFilter === 'checkedOut' ? 'all' : 'checkedOut')}
          className={`bg-white p-3 rounded-xl shadow-sm border cursor-pointer transition-all ${cardFilter === 'checkedOut' ? 'border-gray-500 ring-1 ring-gray-500 scale-[1.02]' : 'border-gray-100 hover:border-gray-300'}`}
        >
          <div className="flex items-center mb-2">
            <CheckCircle className="text-gray-500 mr-2" size={24} />
            <h3 className="text-gray-500 font-bold text-xl m-0">{todayData?.checkedOut?.count ?? 0}</h3>
          </div>
          <h6 className="text-gray-800 font-semibold text-sm m-0">Checked Out</h6>
          <p className="text-gray-500 text-xs m-0">Actual checked out</p>
        </div>

        {/* Canceled */}
        <div
          onClick={() => setCardFilter(cardFilter === 'canceled' ? 'all' : 'canceled')}
          className={`bg-white p-3 rounded-xl shadow-sm border cursor-pointer transition-all ${cardFilter === 'canceled' ? 'border-red-500 ring-1 ring-red-500 scale-[1.02]' : 'border-gray-100 hover:border-red-300'}`}
        >
          <div className="flex items-center mb-2">
            <XCircle className="text-red-500 mr-2" size={24} />
            <h3 className="text-red-500 font-bold text-xl m-0">{todayData?.canceled?.count ?? 0}</h3>
          </div>
          <h6 className="text-gray-800 font-semibold text-sm m-0">Canceled</h6>
          <p className="text-gray-500 text-xs m-0">Canceled reservations</p>
        </div>

        {/* New Booking */}
        <div
          onClick={() => setCardFilter(cardFilter === 'newBookings' ? 'all' : 'newBookings')}
          className={`bg-white p-3 rounded-xl shadow-sm border cursor-pointer transition-all ${cardFilter === 'newBookings' ? 'border-cyan-500 ring-1 ring-cyan-500 scale-[1.02]' : 'border-gray-100 hover:border-cyan-300'}`}
        >
          <div className="flex items-center mb-2">
            <PlusCircle className="text-cyan-500 mr-2" size={24} />
            <h3 className="text-cyan-500 font-bold text-xl m-0">{todayData?.newBookings?.count ?? 0}</h3>
          </div>
          <h6 className="text-gray-800 font-semibold text-sm m-0">New Booking</h6>
          <p className="text-gray-500 text-xs m-0">Created within range</p>
        </div>

        {/* Expected Arrivals */}
        <div
          onClick={() => setCardFilter(cardFilter === 'expectedArrivals' ? 'all' : 'expectedArrivals')}
          className={`bg-white p-3 rounded-xl shadow-sm border cursor-pointer transition-all ${cardFilter === 'expectedArrivals' ? 'border-cyan-500 ring-1 ring-cyan-500 scale-[1.02]' : 'border-gray-100 hover:border-cyan-300'}`}
        >
          <div className="flex items-center mb-2">
            <CalendarDays className="text-cyan-500 mr-2" size={24} />
            <h3 className="text-cyan-500 font-bold text-xl m-0">{todayData?.expectedArrivals?.count ?? 0}</h3>
          </div>
          <h6 className="text-gray-800 font-semibold text-sm m-0">Expected Arrivals</h6>
          <p className="text-gray-500 text-xs m-0">Reservations starting</p>
        </div>

        {/* Overdue */}
        <div
          onClick={() => setCardFilter(cardFilter === 'overdue' ? 'all' : 'overdue')}
          className={`bg-white p-3 rounded-xl shadow-sm border cursor-pointer transition-all ${cardFilter === 'overdue' ? 'border-red-500 ring-1 ring-red-500 scale-[1.02]' : 'border-gray-100 hover:border-red-300'}`}
        >
          <div className="flex items-center mb-2">
            <AlertTriangleIcon className="text-red-500 mr-2" size={24} />
            <h3 className="text-red-500 font-bold text-xl m-0">{todayData?.overdue?.count ?? 0}</h3>
          </div>
          <h6 className="text-gray-800 font-semibold text-sm m-0">Overdue</h6>
          <p className="text-gray-500 text-xs m-0">Passed checkout date</p>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm p-4 border border-gray-100">
        <div className="grid grid-cols-1 md:grid-cols-7 gap-4">
          <div className="md:col-span-2 relative">
            <Search
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
              size={18}
            />

            <input
              type="text"
              placeholder="Search by guest, booking ID, or room..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1D4ED8] focus:border-transparent text-sm bg-gray-50/50"
            />
          </div>

          <div>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1D4ED8] text-sm bg-white"
            >
              <option value="all">All Statuses</option>
              <option value="reserved">Reserved</option>
              <option value="checked_in">Checked In</option>
              <option value="checked_out">Checked Out</option>
              <option value="cancelled">Cancelled</option>
              <option value="draft">Draft</option>
            </select>
          </div>

          <div>
            <select
              value={reservationType}
              onChange={(e) => setReservationType(e.target.value)}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1D4ED8] text-sm bg-white"
            >
              <option value="all">All Types</option>
              <option value="individual">Individual Bookings</option>
              <option value="group">Company / Group</option>
            </select>
          </div>

          <div>
            <select
              value={channelFilter}
              onChange={(e) => setChannelFilter(e.target.value)}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1D4ED8] text-sm bg-white"
            >
              <option value="all">All Channels</option>
              <option value="walkin">Walk-in</option>
              <option value="agent">Agent</option>
              <option value="refernce">Reference</option>
              <option value="phone">Phone</option>
              <option value="booking.com">Booking.com</option>
              <option value="airbnb">AirBnb</option>
              <option value="website">Website</option>
              <option value="C/O Adil Khan">C/O Adil Khan</option>
              <option value="C/O Muhammad Kashif">C/O Muhammad Kashif</option>
              <option value="C/O Muhammad Aasif">C/O Muhammad Aasif</option>
              <option value="FO">FO</option>
            </select>
          </div>

          <div>
            <select
              value={datePreset}
              onChange={(e) => handleDatePresetChange(e.target.value)}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1D4ED8] text-sm bg-white"
            >
              <option value="all">All Time</option>
              <option value="today">Today</option>
              <option value="yesterday">Yesterday</option>
              <option value="week">This Week</option>
              <option value="month">This Month</option>
              <option value="custom">Custom Range</option>
            </select>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleExport}
              disabled={isExporting}
              className="flex-1 flex items-center justify-center gap-1.5 border border-gray-200 px-3 py-2 rounded-lg hover:bg-gray-50 transition-colors text-xs font-semibold text-gray-700 disabled:opacity-60"
              title="Export all filtered reservations to CSV"
            >
              <Download size={15} />
              {isExporting ? 'Exporting...' : 'Export'}
            </button>
            <button
              onClick={handleDownloadPDF}
              disabled={isPdfExporting}
              className="flex-1 flex items-center justify-center gap-1.5 border border-blue-200 bg-blue-50/50 hover:bg-blue-100 text-blue-700 px-3 py-2 rounded-lg transition-colors text-xs font-semibold disabled:opacity-60"
              title="Download all filtered reservations as PDF report"
            >
              <FileText size={15} />
              {isPdfExporting ? 'Creating...' : 'PDF'}
            </button>
          </div>
        </div>

        {datePreset === 'custom' && (
          <div className="mt-4 pt-4 border-t border-gray-100 flex flex-wrap items-center gap-4 animate-in fade-in slide-in-from-top-1 duration-200">
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                Start Date:
              </span>

              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="px-3 py-1.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1D4ED8] text-sm"
              />
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                End Date:
              </span>

              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="px-3 py-1.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1D4ED8] text-sm"
              />
            </div>

            <button
              onClick={() => {
                setStartDate('');
                setEndDate('');
              }}
              className="text-xs text-gray-500 hover:text-red-500 transition-colors underline"
            >
              Clear Range
            </button>
          </div>
        )}

        {/* Total Summary Bar */}
        <div className="flex flex-wrap items-center justify-between mt-3 pt-3 border-t border-gray-100 text-xs gap-3">
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-1.5">
              <span className="font-semibold text-gray-600">Total Count:</span>
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-100 text-blue-800">
                {total} {total === 1 ? 'Reservation' : 'Reservations'}
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="font-semibold text-gray-600">Total Amount:</span>
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800">
                PKR {totalAmountSum.toLocaleString()}
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="font-semibold text-gray-600">Total Balance:</span>
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-800">
                PKR {totalBalanceSum.toLocaleString()}
              </span>
            </div>
          </div>
          {(debouncedSearch || filterStatus !== 'all' || startDate || endDate || channelFilter !== 'all' || reservationType !== 'all') && (
            <span className="text-gray-400 italic">Filters active</span>
          )}
        </div>
      </div>

      <DataTable
        columns={columns}
        data={apiBookings}
        serverSide={true}
        totalItems={total}
        page={page}
        onPageChange={setPage}
        loading={loading}
        onSortChange={(key, dir) => {
          setSortBy(key as string);
          setSortOrder(dir);
        }}
      />

      {/* Table Footer Totals Card */}
      <div className="bg-white rounded-xl shadow-sm p-4 border border-gray-100 flex flex-wrap items-center justify-between gap-4 text-sm">
        <div className="text-gray-500 font-medium text-xs">
          Showing page {page} of {Math.max(1, Math.ceil(total / 10))} ({total} total records across all pages)
        </div>
        <div className="flex flex-wrap items-center gap-6">
          <div className="flex items-center gap-2">
            <span className="text-gray-600 font-semibold text-xs">Total Records:</span>
            <span className="text-sm font-bold text-gray-900">{total}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-gray-600 font-semibold text-xs">Total Amount:</span>
            <span className="text-base font-bold text-emerald-600">PKR {totalAmountSum.toLocaleString()}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-gray-600 font-semibold text-xs">Total Balance:</span>
            <span className="text-base font-bold text-amber-600">PKR {totalBalanceSum.toLocaleString()}</span>
          </div>
        </div>
      </div>

      {/* ── Checkout Modal (with optional Refund section) ── */}
      {checkoutModal && pendingCheckout && (() => {
        const balanceAmt = Number((pendingCheckout.booking as any).balanceAmount1 ?? 0);
        const needsRefund = balanceAmt < 0;
        const refundAmt = Math.abs(balanceAmt);
        return (
          <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/40 px-4">
            <div className="w-full max-w-md rounded-2xl bg-white shadow-2xl border border-gray-100 overflow-hidden max-h-[90vh] flex flex-col">

              {/* Header */}
              <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 shrink-0">
                <div className="flex items-center gap-3">
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${needsRefund ? 'bg-emerald-100' : 'bg-blue-100'}`}>
                    {needsRefund
                      ? <DollarSign size={18} className="text-emerald-600" />
                      : <RefreshCw size={18} className="text-blue-600" />}
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-[#0F172A]">
                      {needsRefund ? 'Checkout & Refund' : 'Confirm Checkout'}
                    </h2>
                    <p className="text-xs text-gray-500">
                      {needsRefund
                        ? 'Advance paid exceeds total — refund required'
                        : `${pendingCheckout.booking.guestName} · Room ${pendingCheckout.booking.roomNumber}`}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => { setCheckoutModal(false); setPendingCheckout(null); }}
                  className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <X size={20} />
                </button>
              </div>

              {/* Body — scrollable */}
              <div className="px-6 py-5 space-y-4 overflow-y-auto">

                {/* Checkout Time */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">Checkout Time</label>
                  <input
                    type="time"
                    value={checkoutTime}
                    onChange={(e) => setCheckoutTime(e.target.value)}
                    className="w-full px-3 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#1D4ED8] text-sm"
                  />
                </div>

                {/* Checkout Person */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                    Who is checking out? <span className="text-gray-400 font-normal">(optional)</span>
                  </label>
                  <input
                    type="text"
                    value={checkoutPerson}
                    onChange={(e) => setCheckoutPerson(e.target.value)}
                    placeholder="e.g. Ali / Ahmed / Guest Name"
                    className="w-full px-3 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#1D4ED8] text-sm"
                  />
                </div>

                {/* Mark Dirty */}
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={markDirty}
                    onChange={(e) => setMarkDirty(e.target.checked)}
                    className="w-4 h-4 rounded border-gray-300 text-[#1D4ED8] focus:ring-[#1D4ED8]"
                  />
                  <span className="text-sm font-medium text-gray-700">Mark room as dirty (housekeeping needed)</span>
                </label>

                {markDirty && (
                  <div className="mt-3 p-4 bg-gray-50 border border-gray-200 rounded-xl flex flex-col gap-4">
                    <h4 className="text-sm font-bold text-[#1D4ED8] uppercase tracking-wider">Housekeeping Task Details</h4>

                    <div className="flex flex-col gap-1.5">
                      <label className="text-xs font-semibold text-gray-700">Assign Staff</label>
                      <select
                        className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#1D4ED8] focus:border-[#1D4ED8] outline-none bg-white"
                        value={selectedHkStaffId}
                        onChange={(e) => setSelectedHkStaffId(e.target.value)}
                      >
                        <option value="">-- Auto-Assign or Select Staff --</option>
                        {hkStaffList.map(staff => (
                          <option key={staff.id} value={staff.id}>{staff.fullName} ({staff.role})</option>
                        ))}
                      </select>
                    </div>

                    <div className="flex flex-col gap-1.5">
                      <label className="text-xs font-semibold text-gray-700">End Job Date/Time</label>
                      <input
                        type="datetime-local"
                        value={hkEndJob}
                        onChange={(e) => setHkEndJob(e.target.value)}
                        className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#1D4ED8] focus:border-[#1D4ED8] outline-none"
                      />
                    </div>

                    <div className="flex flex-col gap-1.5">
                      <label className="text-xs font-semibold text-gray-700">Notes</label>
                      <input
                        type="text"
                        value={hkNotes}
                        onChange={(e) => setHkNotes(e.target.value)}
                        placeholder="e.g. Deep clean needed"
                        className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#1D4ED8] focus:border-[#1D4ED8] outline-none"
                      />
                    </div>
                  </div>
                )}

                {/* ── Waive Amount Section ── */}
                {balanceAmt > 0 && (
                  <div className="p-4 bg-blue-50 border border-blue-200 rounded-xl flex flex-col gap-4">
                    <div className="flex items-center justify-between mb-1">
                      <h4 className="text-sm font-bold text-blue-700">
                        Waive Pending Balance
                      </h4>
                      <label className="flex items-center gap-2 cursor-pointer">
                        <div className="relative">
                          <input
                            type="checkbox"
                            className="sr-only"
                            checked={isWaiveEnabled}
                            onChange={(e) => {
                              setIsWaiveEnabled(e.target.checked);
                              if (!e.target.checked) setWaivedAmount('');
                            }}
                          />
                          <div className={`block w-10 h-6 rounded-full transition-colors ${isWaiveEnabled ? 'bg-blue-600' : 'bg-gray-300'}`}></div>
                          <div className={`absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition-transform ${isWaiveEnabled ? 'transform translate-x-4' : ''}`}></div>
                        </div>
                      </label>
                    </div>

                    {isWaiveEnabled && (
                      <>
                        <div className="flex justify-between items-center pb-3 border-b border-blue-200/50">
                          <span className="text-sm text-blue-800">Pending Balance:</span>
                          <span className="text-lg font-black text-blue-700">
                            PKR {Number(balanceAmt).toLocaleString()}
                          </span>
                        </div>

                        <div className="flex flex-col gap-1.5">
                          <label className="text-xs font-semibold text-blue-800">Waive Amount</label>
                          <input
                            type="number"
                            value={waivedAmount}
                            onChange={(e) => setWaivedAmount(e.target.value)}
                            placeholder="Enter amount to waive"
                            className="w-full px-3 py-2 text-sm border border-blue-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                          />
                        </div>
                      </>
                    )}
                  </div>
                )}

                {/* ── Refund Section — only when advance > total ── */}
                {needsRefund && (
                  <div className="rounded-xl border border-emerald-200 overflow-hidden">
                    {/* Refund banner */}
                    <div className="bg-emerald-50 px-4 py-3 flex items-center justify-between">
                      <div>
                        <p className="text-xs text-emerald-700 font-semibold uppercase tracking-wide">Refundable Amount</p>
                        <p className="text-xl font-bold text-emerald-700">PKR {refundAmt.toLocaleString()}</p>
                      </div>
                      <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center">
                        <DollarSign size={20} className="text-emerald-600" />
                      </div>
                    </div>

                    <div className="p-4 space-y-3">
                      {/* Refund Amount */}
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-1">Refund Amount</label>
                        <input
                          type="number"
                          value={refundDetails.amount}
                          onChange={(e) => setRefundDetails({ ...refundDetails, amount: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1D4ED8] text-sm"
                          placeholder="Enter amount"
                        />
                      </div>

                      {/* Refund Method */}
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-1">Refund Method</label>
                        <select
                          value={refundDetails.method}
                          onChange={(e) => setRefundDetails({ ...refundDetails, method: e.target.value, bankId: '' })}
                          className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1D4ED8] text-sm bg-white"
                        >
                          <option value="cash">Cash</option>
                          <option value="bank">Bank Transfer</option>
                          <option value="other">Other</option>
                        </select>
                      </div>

                      {/* Bank dropdown */}
                      {refundDetails.method === 'bank' && (
                        <div>
                          <label className="block text-sm font-semibold text-gray-700 mb-1">Select Bank Account</label>
                          <select
                            value={refundDetails.bankId}
                            onChange={(e) => setRefundDetails({ ...refundDetails, bankId: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1D4ED8] text-sm bg-white"
                          >
                            <option value="">-- Select Bank --</option>
                            {banksList.map((bank: any) => (
                              <option key={bank.id} value={bank.id}>
                                {bank.bankName} - {bank.accountTitle}
                              </option>
                            ))}
                          </select>
                        </div>
                      )}

                      {/* Note */}
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-1">
                          Note <span className="text-gray-400 font-normal">(optional)</span>
                        </label>
                        <input
                          type="text"
                          value={refundDetails.note}
                          onChange={(e) => setRefundDetails({ ...refundDetails, note: e.target.value })}
                          placeholder="e.g. Returned security deposit"
                          className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1D4ED8] text-sm"
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Footer */}
              <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-100 bg-gray-50 shrink-0">
                {needsRefund && (
                  <button
                    onClick={() => confirmCheckout(true)}
                    disabled={checkoutLoading}
                    className="px-5 py-2.5 rounded-lg border border-gray-200 text-gray-700 hover:bg-white transition-colors text-sm disabled:opacity-60"
                  >
                    Checkout (Skip Refund)
                  </button>
                )}
                <button
                  onClick={() => confirmCheckout(false)}
                  disabled={checkoutLoading || (needsRefund && !refundDetails.amount)}
                  className="px-5 py-2.5 rounded-lg bg-[#1D4ED8] text-white hover:bg-[#1E40AF] transition-colors text-sm font-medium disabled:opacity-60"
                >
                  {checkoutLoading
                    ? 'Processing...'
                    : needsRefund
                      ? 'Checkout & Refund'
                      : 'Confirm Checkout'}
                </button>
              </div>
            </div>
          </div>
        );
      })()}

      {extendModalOpen && selectedBooking && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/40 px-4">
          <div className="w-full max-w-lg rounded-2xl bg-white shadow-2xl border border-gray-100 overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <div>
                <h2 className="text-xl font-bold text-[#0F172A]">
                  Extend Reservation
                </h2>
                <p className="text-sm text-gray-500 mt-1">
                  Update checkout date and time
                </p>
              </div>

              <button
                onClick={closeExtendModal}
                className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            <div className="px-6 py-5 space-y-5">
              <div className="rounded-xl bg-blue-50 border border-blue-100 p-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                  <div>
                    <p className="text-gray-500">Booking ID</p>
                    <p className="font-semibold text-gray-900">
                      {selectedBooking.id}
                    </p>
                  </div>

                  <div>
                    <p className="text-gray-500">Guest</p>
                    <p className="font-semibold text-gray-900">
                      {selectedBooking.guestName}
                    </p>
                  </div>

                  <div>
                    <p className="text-gray-500">Room</p>
                    <p className="font-semibold text-gray-900">
                      {selectedBooking.roomNumber}
                    </p>
                  </div>

                  <div>
                    <p className="text-gray-500">Current Check-Out</p>
                    <p className="font-semibold text-gray-900">
                      {dateOnly(selectedBooking.checkOut)}
                    </p>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  New Check-Out Date
                </label>

                <div className="relative">
                  <CalendarDays
                    size={18}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                  />

                  <input
                    type="date"
                    value={extendFormValues.extendedDate}
                    min={dateOnly(selectedBooking.checkOut)}
                    onChange={(e) =>
                      setExtendFormValues((prev) => ({
                        ...prev,
                        extendedDate: e.target.value,
                      }))
                    }
                    className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#1D4ED8] text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  New Check-Out Time
                </label>

                <div className="relative">
                  <Clock
                    size={18}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                  />

                  <input
                    type="time"
                    value={extendFormValues.extendedTime}
                    onChange={(e) =>
                      setExtendFormValues((prev) => ({
                        ...prev,
                        extendedTime: e.target.value,
                      }))
                    }
                    className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#1D4ED8] text-sm"
                  />
                </div>

                <p className="text-xs text-gray-400 mt-2">
                  Time is Optional
                </p>
              </div>
              <div>
                  <select>
                    <option value="half_day">Half Day</option>
                    <option value="full_day">Full Day</option> 
                  </select>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-100 bg-gray-50">
              <button
                onClick={closeExtendModal}
                disabled={extending}
                className="px-5 py-2.5 rounded-lg border border-gray-200 text-gray-700 hover:bg-white transition-colors disabled:opacity-60"
              >
                Cancel
              </button>

              <button
                onClick={handleExtendReservation}
                disabled={extending}
                className="px-5 py-2.5 rounded-lg bg-[#1D4ED8] text-white hover:bg-[#1E40AF] transition-colors disabled:opacity-60"
              >
                {extending ? 'Saving...' : 'Save Extension'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Extra Charges Modal ── */}
      {halfDayModal && halfDayBooking && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[99999] flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full overflow-hidden shadow-2xl animate-in fade-in zoom-in duration-200">
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-100 bg-amber-50/60">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center text-amber-600">
                  <DollarSign size={20} />
                </div>
                <div>
                  <h3 className="font-bold text-gray-900 text-lg">Extra Charges</h3>
                  <p className="text-xs text-gray-500">Add an extra charge to the guest invoice</p>
                </div>
              </div>
              <button
                onClick={() => { setHalfDayModal(false); setHalfDayBooking(null); }}
                className="p-2 rounded-lg hover:bg-gray-100 text-gray-500 transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            {/* Body */}
            <div className="p-6 space-y-4">
              {/* Guest Info */}
              <div className="grid grid-cols-2 gap-4 p-4 bg-gray-50 rounded-xl text-sm">
                <div>
                  <p className="text-gray-500 text-xs">Guest</p>
                  <p className="font-semibold text-gray-900">{halfDayBooking.guestName}</p>
                </div>
                <div>
                  <p className="text-gray-500 text-xs">Room</p>
                  <p className="font-semibold text-gray-900">{halfDayBooking.roomNumber}</p>
                </div>
                <div>
                  <p className="text-gray-500 text-xs">Check-Out Date</p>
                  <p className="font-semibold text-gray-900">{dateOnly(halfDayBooking.checkOut)}</p>
                </div>
                <div>
                  <p className="text-gray-500 text-xs">Booking Ref</p>
                  <p className="font-semibold text-gray-900">{halfDayBooking.id}</p>
                </div>
              </div>

              {/* Charge Name */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Charge Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={halfDayChargeName}
                  onChange={(e) => setHalfDayChargeName(e.target.value)}
                  placeholder="e.g. Late Check-out, Extra Bed, etc."
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-400 text-sm"
                />
                <p className="text-xs text-gray-400 mt-1">This name will appear on the guest invoice.</p>
              </div>

              {/* Amount */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Amount (PKR) <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <DollarSign size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    type="number"
                    min="0"
                    value={halfDayAmount}
                    onChange={(e) => setHalfDayAmount(e.target.value)}
                    placeholder="e.g. 5000"
                    className="w-full pl-9 pr-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-400 text-sm"
                  />
                </div>
                <p className="text-xs text-gray-400 mt-1">Charge will be added to the invoice summary.</p>
              </div>

              <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-700">
                <strong>Note:</strong> Extra charges reflect in Room Revenue and Sales report (not POS Sales).
              </div>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-100 bg-gray-50">
              <button
                onClick={() => { setHalfDayModal(false); setHalfDayBooking(null); }}
                disabled={halfDayLoading}
                className="px-5 py-2.5 rounded-lg border border-gray-200 text-gray-700 hover:bg-white transition-colors disabled:opacity-60"
              >
                Cancel
              </button>
              <button
                onClick={handleApplyHalfDay}
                disabled={halfDayLoading}
                className="px-5 py-2.5 rounded-lg bg-amber-500 text-white hover:bg-amber-600 transition-colors disabled:opacity-60 font-medium"
              >
                {halfDayLoading ? 'Saving...' : 'Save'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Early Checkout Modal ── */}
      {earlyCheckoutModal && earlyCheckoutBooking && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[99999] flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full overflow-hidden shadow-2xl animate-in fade-in zoom-in duration-200">
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-100 bg-teal-50/60">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-teal-100 flex items-center justify-center text-teal-600">
                  <LogOut size={20} />
                </div>
                <div>
                  <h3 className="font-bold text-gray-900 text-lg">Early Checkout</h3>
                  <p className="text-xs text-gray-500">Adjust stay duration & calculate guest refund</p>
                </div>
              </div>
              <button
                onClick={() => { setEarlyCheckoutModal(false); setEarlyCheckoutBooking(null); }}
                className="p-2 rounded-lg hover:bg-gray-100 text-gray-500 transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            {/* Body */}
            <div className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
              {/* Guest & Booking Info */}
              <div className="grid grid-cols-2 gap-3 p-4 bg-gray-50 rounded-xl text-xs">
                <div>
                  <p className="text-gray-400">Guest Name</p>
                  <p className="font-semibold text-gray-900 text-sm">{earlyCheckoutBooking.guestName}</p>
                </div>
                <div>
                  <p className="text-gray-400">Room(s)</p>
                  <p className="font-semibold text-gray-900 text-sm">{earlyCheckoutBooking.roomNumber}</p>
                </div>
                <div>
                  <p className="text-gray-400">Booked Dates</p>
                  <p className="font-semibold text-gray-800">
                    {dateOnly(earlyCheckoutBooking.checkIn)} → {dateOnly(earlyCheckoutBooking.checkOut)}
                  </p>
                </div>
                <div>
                  <p className="text-gray-400">Total Advance Paid</p>
                  <p className="font-bold text-emerald-600 text-sm">
                    PKR {Number((earlyCheckoutBooking as any).advancePaid1 ?? (earlyCheckoutBooking as any).advancePaid ?? 0).toLocaleString()}
                  </p>
                </div>
              </div>

              {/* Early Checkout Date Selection */}
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Actual Checkout Date <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  value={earlyCheckoutDate}
                  onChange={(e) => handleEarlyCheckoutDateChange(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
                <p className="text-xs text-teal-600 font-medium mt-1">
                  Actual Stayed Duration: <strong>{earlyCheckoutStayDays} {earlyCheckoutStayDays === 1 ? 'Night' : 'Nights'}</strong>
                </p>
              </div>

              {/* Financial Calculation */}
              <div className="grid grid-cols-2 gap-3 p-4 bg-teal-50/40 border border-teal-100 rounded-xl">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Adjusted Stay Amount (PKR)
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={earlyCheckoutStayAmount}
                    onChange={(e) => {
                      const newStay = e.target.value;
                      setEarlyCheckoutStayAmount(newStay);
                      const adv = Number((earlyCheckoutBooking as any).advancePaid1 ?? (earlyCheckoutBooking as any).advancePaid ?? 0);
                      const ref = Math.max(0, adv - Number(newStay || 0));
                      setEarlyCheckoutRefund(String(ref));
                    }}
                    placeholder="0.00"
                    className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 bg-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Refund to Guest (PKR)
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={earlyCheckoutRefund}
                    onChange={(e) => setEarlyCheckoutRefund(e.target.value)}
                    placeholder="0.00"
                    className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 bg-white font-bold text-emerald-600"
                  />
                </div>
              </div>

              {/* Refund Method & Bank Selection */}
              {Number(earlyCheckoutRefund) > 0 && (
                <div className="space-y-3 p-3 bg-gray-50 border border-gray-200 rounded-xl">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-gray-600 mb-1">Refund Method</label>
                      <select
                        value={earlyCheckoutMethod}
                        onChange={(e) => setEarlyCheckoutMethod(e.target.value)}
                        className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 bg-white"
                      >
                        <option value="cash">Cash</option>
                        <option value="bank">Bank Transfer</option>
                      </select>
                    </div>

                    {earlyCheckoutMethod === 'bank' && (
                      <div>
                        <label className="block text-xs font-semibold text-gray-600 mb-1">Select Bank Account</label>
                        <select
                          value={earlyCheckoutBankId}
                          onChange={(e) => setEarlyCheckoutBankId(e.target.value)}
                          className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 bg-white"
                        >
                          <option value="">Select Bank...</option>
                          {banksList.map((b: any) => (
                            <option key={b.id} value={b.id}>
                              {b.bankName} — {b.accountTitle}
                            </option>
                          ))}
                        </select>
                      </div>
                    )}
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1">Refund Note / Reason (Optional)</label>
                    <input
                      type="text"
                      value={earlyCheckoutNote}
                      onChange={(e) => setEarlyCheckoutNote(e.target.value)}
                      placeholder="e.g. Guest checked out 1 day early"
                      className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 bg-white"
                    />
                  </div>
                </div>
              )}

              {/* Room Housekeeping */}
              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="earlyCheckoutDirty"
                  checked={earlyCheckoutMarkDirty}
                  onChange={(e) => setEarlyCheckoutMarkDirty(e.target.checked)}
                  className="w-4 h-4 text-teal-600 rounded border-gray-300 focus:ring-teal-500"
                />
                <label htmlFor="earlyCheckoutDirty" className="text-xs text-gray-700 cursor-pointer">
                  Mark room(s) as dirty for housekeeping and release room assignment
                </label>
              </div>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-100 bg-gray-50">
              <button
                onClick={() => { setEarlyCheckoutModal(false); setEarlyCheckoutBooking(null); }}
                disabled={earlyCheckoutLoading}
                className="px-4 py-2 text-sm font-semibold text-gray-600 hover:text-gray-800 transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleApplyEarlyCheckout}
                disabled={earlyCheckoutLoading}
                className="px-5 py-2.5 rounded-lg bg-teal-600 text-white hover:bg-teal-700 font-medium text-sm transition-colors shadow-md shadow-teal-600/20 disabled:opacity-50"
              >
                {earlyCheckoutLoading ? 'Processing...' : 'Confirm Early Checkout'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Cancel Reservation Modal with Refund Details */}
      {cancelModal && pendingCancel && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[99999] flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full overflow-hidden shadow-2xl animate-in fade-in zoom-in duration-200">
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-100 bg-gray-50/50">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center text-red-600">
                  <AlertCircle size={20} />
                </div>
                <div>
                  <h3 className="font-bold text-gray-900 text-lg">Cancel Reservation</h3>
                  <p className="text-xs text-gray-500">Ref #{pendingCancel.bookingNumber}</p>
                </div>
              </div>
              <button
                onClick={() => { setCancelModal(false); setPendingCancel(null); }}
                className="text-gray-400 hover:text-gray-600 p-1.5 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            {/* Content */}
            <div className="p-6 space-y-4">
              <div className="p-3.5 bg-amber-50 border border-amber-200 rounded-xl text-amber-800 text-xs font-medium">
                Are you sure you want to cancel reservation for <strong>{pendingCancel.guestName}</strong>? Rooms assigned will be released.
              </div>

              {/* Refund Section */}
              <div className="p-4 bg-gray-50 border border-gray-200 rounded-xl space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-gray-700 uppercase tracking-wider">Refund Details</span>
                  {Number((pendingCancel as any).advancePaid1 ?? (pendingCancel as any).advancePaid ?? 0) > 0 && (
                    <span className="text-xs font-semibold text-emerald-600">
                      Advance Paid: PKR {Number((pendingCancel as any).advancePaid1 ?? (pendingCancel as any).advancePaid ?? 0).toLocaleString()}
                    </span>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1">Refund Amount (PKR)</label>
                    <input
                      type="number"
                      value={cancelRefundDetails.amount}
                      onChange={(e) => setCancelRefundDetails(prev => ({ ...prev, amount: e.target.value }))}
                      placeholder="0.00"
                      className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1">Refund Method</label>
                    <select
                      value={cancelRefundDetails.method}
                      onChange={(e) => setCancelRefundDetails(prev => ({ ...prev, method: e.target.value }))}
                      className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 bg-white"
                    >
                      <option value="cash">Cash</option>
                      <option value="bank">Bank Transfer</option>
                      <option value="card">Card</option>
                    </select>
                  </div>
                </div>

                {(cancelRefundDetails.method === 'bank' || cancelRefundDetails.method === 'card') && (
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1">Select Bank Account</label>
                    <select
                      value={cancelRefundDetails.bankId}
                      onChange={(e) => setCancelRefundDetails(prev => ({ ...prev, bankId: e.target.value }))}
                      className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 bg-white"
                    >
                      <option value="">Select Bank...</option>
                      {banksList.map((b: any) => (
                        <option key={b.id} value={b.id}>
                          {b.bankName} — {b.accountTitle}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">Cancellation Note / Reason</label>
                  <input
                    type="text"
                    value={cancelRefundDetails.note}
                    onChange={(e) => setCancelRefundDetails(prev => ({ ...prev, note: e.target.value }))}
                    placeholder="e.g. Guest requested cancellation"
                    className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                  />
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-100 bg-gray-50">
              <button
                onClick={() => { setCancelModal(false); setPendingCancel(null); }}
                className="px-4 py-2 text-sm font-semibold text-gray-600 hover:text-gray-800 transition-colors"
              >
                Close
              </button>
              <button
                onClick={() => confirmCancel(false)}
                className="px-4 py-2 text-sm font-semibold text-gray-700 bg-gray-200 hover:bg-gray-300 rounded-lg transition-colors"
              >
                Cancel Without Refund
              </button>
              <button
                onClick={() => confirmCancel(true)}
                className="px-5 py-2 text-sm font-bold text-white bg-red-600 hover:bg-red-700 rounded-lg shadow-md shadow-red-600/20 transition-all"
              >
                Confirm Cancel & Refund
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Change Room Modal ── */}
      {changeRoomModal && changeRoomBooking && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[99999] flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full overflow-hidden shadow-2xl animate-in fade-in zoom-in duration-200">
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-100 bg-indigo-50/60">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600">
                  <ArrowRightLeft size={20} />
                </div>
                <div>
                  <h3 className="font-bold text-gray-900 text-lg">Change Guest Room</h3>
                  <p className="text-xs text-gray-500">Shift guest to a new room & free previous room</p>
                </div>
              </div>
              <button
                onClick={() => { setChangeRoomModal(false); setChangeRoomBooking(null); }}
                className="p-2 rounded-lg hover:bg-gray-100 text-gray-500 transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            {/* Body */}
            <div className="p-6 space-y-4">
              {/* Guest & Current Info */}
              <div className="p-4 bg-gray-50 rounded-xl space-y-2 text-xs">
                <div className="flex justify-between">
                  <span className="text-gray-500">Guest Name:</span>
                  <span className="font-semibold text-gray-900 text-sm">{changeRoomBooking.guestName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Booking Ref:</span>
                  <span className="font-mono font-medium text-gray-700">{changeRoomBooking.id}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Stay Duration:</span>
                  <span className="font-medium text-gray-700">
                    {dateOnly(changeRoomBooking.checkIn)} → {dateOnly(changeRoomBooking.checkOut)}
                  </span>
                </div>
              </div>

              {/* Current Room Selection (if multi-room) */}
              {changeRoomBooking.rooms && changeRoomBooking.rooms.length > 1 ? (
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Select Current Room to Vacate <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={selectedPrevRoomId}
                    onChange={(e) => setSelectedPrevRoomId(e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
                  >
                    {changeRoomBooking.rooms.map((r: any) => (
                      <option key={r.id || r.assignedRoomId} value={r.id || r.assignedRoomId}>
                        Room {r.roomNo || r.number} ({r.RoomType?.name || 'Room'})
                      </option>
                    ))}
                  </select>
                </div>
              ) : (
                <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-800 flex items-center justify-between">
                  <span>Current Room:</span>
                  <strong className="text-sm">Room {changeRoomBooking.roomNumber}</strong>
                </div>
              )}

              {/* New Room Selection */}
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Select New Room <span className="text-red-500">*</span>
                </label>
                {fetchingAvailableRooms ? (
                  <div className="p-3 text-center text-xs text-gray-500 bg-gray-50 rounded-lg animate-pulse">
                    Loading available rooms...
                  </div>
                ) : availableRoomsList.length === 0 ? (
                  <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-xs text-red-600">
                    No available rooms found for today.
                  </div>
                ) : (
                  <select
                    value={selectedNewRoomId}
                    onChange={(e) => setSelectedNewRoomId(e.target.value)}
                    className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
                  >
                    <option value="">-- Choose New Room --</option>
                    {availableRoomsList.map((r: any) => (
                      <option key={r.id} value={r.id}>
                        Room {r.roomNo} — {r.RoomType?.name || 'Standard'} ({r.Floor?.floorName || `Floor ${r.floorId}`})
                      </option>
                    ))}
                  </select>
                )}
                <p className="text-[11px] text-emerald-600 mt-1">
                  ✓ Previous room will be released & set to <strong>Available</strong> automatically.
                </p>
              </div>

              {/* Optional: Mark Dirty checkbox */}
              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="changeRoomDirty"
                  checked={changeRoomMarkDirty}
                  onChange={(e) => setChangeRoomMarkDirty(e.target.checked)}
                  className="w-4 h-4 text-indigo-600 rounded border-gray-300 focus:ring-indigo-500"
                />
                <label htmlFor="changeRoomDirty" className="text-xs text-gray-700 cursor-pointer">
                  Mark previous room as dirty for housekeeping instead of immediately available
                </label>
              </div>

              {/* Reason / Note */}
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Reason for Room Change (Optional)
                </label>
                <input
                  type="text"
                  value={changeRoomReason}
                  onChange={(e) => setChangeRoomReason(e.target.value)}
                  placeholder="e.g. AC issue, Guest requested higher floor"
                  className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
                />
              </div>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-100 bg-gray-50">
              <button
                onClick={() => { setChangeRoomModal(false); setChangeRoomBooking(null); }}
                disabled={changeRoomLoading}
                className="px-4 py-2 text-sm font-semibold text-gray-600 hover:text-gray-800 transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmRoomChange}
                disabled={changeRoomLoading || !selectedNewRoomId}
                className="px-5 py-2.5 rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 font-medium text-sm transition-colors shadow-md shadow-indigo-600/20 disabled:opacity-50"
              >
                {changeRoomLoading ? 'Changing Room...' : 'Confirm Room Change'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}