//@ts-nocheck
import { StatCard } from '../../components/DashboardStats';
import { RoomStatusChart } from '../../components/RoomStatusChart';
import { RevenueChart } from '../../components/RevenueChart';
import { QuickActions } from '../../components/QuickActions';

import {
  BedDouble,
  Users,
  DollarSign,
  Calendar,
  ClipboardList,
  LogIn,
  BookmarkCheck,
  LogOut,
  AlertTriangle,
  XCircle,
  CheckSquare,
  Send,
  CalendarDays,
  Home,
  BarChart3,
  ClipboardCheck,
  LayoutDashboard,
} from 'lucide-react';

import { reservationService } from '../../services/reservationService';
import { useEffect, useMemo, useState } from 'react';
import api from '../../services/api';
import { DateRangeFilter, DateRange } from '../../components/DateRangeFilter';
import { useNavigate } from 'react-router';
import { usePermissions } from '../../hooks/usePermissions';

export function Dashboard() {
  const navigate = useNavigate();
  const { hasPrivilege } = usePermissions();
  const [stats, setStats] = useState<any>(null);
  const [dateRange, setDateRange] = useState<DateRange>({
    startDate: '',
    endDate: '',
  });

   const fetchOrganization = async () => {
    try {
      const response = await api.get('/setting');
     const ans =  response?.data?.settings?.allowCheckout
     localStorage.setItem(
        "allowCheckout",
        JSON.stringify(ans)
      );
      console.log(response?.data?.settings?.allowCheckout);
     
    } catch (err) {
      console.log(err.message);
    }
  };
  const updateStatuses = async () => {
    try {
      await reservationService.overduestatus();
    } catch (error) {
      console.log(error);
    }
  };

  const fetchDashboardData = async () => {
    try {
      const params = new URLSearchParams();

      if (dateRange.startDate) params.append('startDate', dateRange.startDate);
      if (dateRange.endDate) params.append('endDate', dateRange.endDate);

      const res = await api.get(`/users/dashboard?${params.toString()}`);

      if (res.data && res.data.array) {
        setStats(res.data.array);
      }
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error);
    }
  };

  useEffect(() => {
    updateStatuses();
    fetchOrganization();
    fetchDashboardData();
  }, [dateRange]);

  const occupancyRate = useMemo(() => {
    if (!stats?.totalRooms) return 0;
    return Math.round(
      (Number(stats.roomsOccupiedCount || 0) / Number(stats.totalRooms)) * 100
    );
  }, [stats]);

  const topActions = [
    // { label: 'PMS Dashboard', path: '/dashboard', icon: <LayoutDashboard size={15} /> },
    { label: 'HouseKeeping', path: '/housekeeping', icon: <ClipboardCheck size={15} />, privilege: 'housekeeping' },
    // { label: 'Reserved Rooms', path: '/reserved-rooms', icon: <BedDouble size={15} /> },
    { label: 'Reservations', path: '/bookings', icon: <CalendarDays size={15} />, privilege: 'reservations' },
    { label: 'Calander View', path: '/reservations/chart', icon: <Home size={15} />, privilege: 'reservations' },
    { label: 'Room Occupancy', path: '/rooms/status', icon: <LayoutDashboard size={15} />, privilege: 'rooms' },
    { label: 'Daily Ledger', path: '/daily-ledger', icon: <BarChart3 size={15} />, privilege: 'accounts' },
  ];

  const overviewStats = [
    {
      title: 'Total Reservations',
      value: stats?.totalReservationsCount || stats?.totalReservationsCount || 0,
      icon: <ClipboardList size={18} />,
      accent: 'text-blue-700',
      bg: 'bg-blue-50',
    },
    {
      title: 'Checked In',
      value: stats?.checkedInCount || 0,
      icon: <LogIn size={18} />,
      accent: 'text-emerald-700',
      bg: 'bg-emerald-50',
    },
    {
      title: 'Reserved',
      value: stats?.reservedCount || stats?.reservedRoomsCount || 0,
      icon: <BookmarkCheck size={18} />,
      accent: 'text-cyan-700',
      bg: 'bg-cyan-50',
    },
    {
      title: 'Checked Out',
      value: stats?.checkedOutCount || 0,
      icon: <LogOut size={18} />,
      accent: 'text-indigo-700',
      bg: 'bg-indigo-50',
    },
    {
      title: 'Overdue',
      value: stats?.overdueCount || 0,
      icon: <AlertTriangle size={18} />,
      accent: 'text-rose-700',
      bg: 'bg-rose-50',
    },
    {
      title: 'Cancelled',
      value: stats?.cancelledCount || stats?.canceledCount || 0,
      icon: <XCircle size={18} />,
      accent: 'text-slate-700',
      bg: 'bg-slate-100',
    },
    {
      title: 'Rooms Occupied',
      value: stats?.roomsOccupiedCount || 0,
      icon: <CheckSquare size={18} />,
      accent: 'text-violet-700',
      bg: 'bg-violet-50',
    },
    {
      title: 'Expected Arrivals',
      value: stats?.expectedArrivalsCount || stats?.expectedArrivals || 0,
      icon: <Send size={18} />,
      accent: 'text-amber-700',
      bg: 'bg-amber-50',
    },
  ];

  return (
    <div className="min-h-screen bg-slate-50 pb-8">
      <div className="space-y-6 pt-4">
        {/* Header */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex flex-row items-center justify-between gap-3 flex-wrap">
            <div className="min-w-0">
              <h1 className="text-xl font-bold tracking-tight text-slate-950 truncate">
                Dashboard Overview
              </h1>
              <p className="mt-0.5 text-sm font-medium text-slate-500 hidden sm:block">
                Monitor reservations, room occupancy, revenue and hotel operations.
              </p>
            </div>

            <div className="relative z-40 flex items-center gap-3 shrink-0">
              <DateRangeFilter
                onChange={setDateRange}
                defaultLabel="Select Range"
                darkMode={false}
              />
            </div>
          </div>

          

          <div className="mt-5 flex flex-wrap gap-2">
            {topActions
              .filter((item) => !item.privilege || hasPrivilege(item.privilege))
              .map((item) => (
                <button
                  key={item.label}
                  type="button"
                  onClick={() => navigate(item.path)}
                  className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3.5 py-2 text-xs font-bold text-slate-700 transition-all hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700"
                >
                  {item.icon}
                  {item.label}
                </button>
              ))}
          </div>
        </div>
  {/* Operations Overview */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="mb-5 flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-lg font-bold text-slate-950">
                Operations Summary
              </h2>
              <p className="text-sm font-medium text-slate-500">
                Current reservation and room movement overview.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-8 2xl:grid-cols-8">
            {overviewStats.map((item) => (
              <div
                key={item.title}
                className="rounded-xl border border-slate-200 bg-white p-4 transition-all hover:border-slate-300 hover:shadow-md"
              >
                <div className="flex items-center justify-between">
                  <div
                    className={`flex h-10 w-10 items-center justify-center rounded-lg ${item.bg} ${item.accent}`}
                  >
                    {item.icon}
                  </div>
                </div>

                <div className={`mt-4 text-2xl font-extrabold ${item.accent}`}>
                  {item.value}
                </div>

                <div className="mt-1 text-xs font-bold uppercase tracking-wide text-slate-500">
                  {item.title}
                </div>
              </div>
            ))}
          </div>
        </div>
        {/* Main KPI Cards */}
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
          <StatCard
            title="Total Rooms"
            value={stats?.totalRooms?.toString() || '0'}
            icon={<BedDouble size={28} className="text-white" />}
            trend={{ value: 2, isPositive: true }}
            bgColor="bg-gradient-to-br from-blue-700 to-blue-900"
          />

          <StatCard
            title="Room Occupancy"
            value={`${stats?.roomsOccupiedCount || 0} / ${stats?.totalRooms || '0'}`}
            icon={<Users size={28} className="text-white" />}
            trend={{ value: 12, isPositive: true }}
            bgColor="bg-gradient-to-br from-emerald-600 to-teal-700"
          />

          {hasPrivilege('accounts') && (
            <StatCard
              title="Revenue"
              value={` ${
                stats?.receivedAmount?.toLocaleString() || '0'
              }`}
              icon={<DollarSign size={28} className="text-white" />}
              trend={{ value: 8, isPositive: true }}
              bgColor="bg-gradient-to-br from-amber-500 to-orange-600"
            />
          )}

          <StatCard
            title="Check-ins Today"
            value={stats?.checkedInCount?.toString() || '0'}
            icon={<Calendar size={28} className="text-white" />}
            trend={{ value: 5, isPositive: true }}
            bgColor="bg-gradient-to-br from-violet-600 to-purple-700"
          />
        </div>

      

        {/* Quick Actions */}
        {/* <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="mb-4">
            <h2 className="text-lg font-bold text-slate-950">Quick Actions</h2>
            <p className="text-sm font-medium text-slate-500">
              Frequently used hotel management actions.
            </p>
          </div>

          <QuickActions />
        </div> */}

        {/* Charts */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          {hasPrivilege('accounts') && (
            <div className="lg:col-span-2 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <RevenueChart data={stats?.monthlyData} />
            </div>
          )}

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <RoomStatusChart data={stats?.roomStatusData} />
          </div>
        </div>
      </div>
    </div>
  );
}