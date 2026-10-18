import React, { useEffect, useState, useMemo } from 'react';
import {
  RefreshCw, CheckCircle2, Clock, DoorOpen, Wrench,
  Paintbrush, ChevronDown, ChevronUp, LogOut, Bed,
  CheckCheck, AlertCircle, Loader2, Building2, Calendar,
  Package, CalendarDays, ChevronRight, X,
} from 'lucide-react';
import { toast } from 'sonner';
import api from '../../services/api';
import { authService } from '../../services/authService';
import { useNavigate } from 'react-router';

// ─── Types ────────────────────────────────────────────────────────────────────
interface IssuedItem {
  id: number;
  quantityIssued: number;
  item?: { title: string; unit?: string };
}

interface TaskAssignment {
  id: number;
  status: 'pending' | 'in-progress' | 'completed';
  notes?: string;
  endJob?: string;
  createdAt: string;
  room?: {
    roomNo: string | number;
    status?: string;
    Floor?: { floorName: string };
    RoomType?: { name: string };
  };
  issuedItems?: IssuedItem[]; // joined client-side from vouchers
}

// ─── Date helpers ─────────────────────────────────────────────────────────────
const toDateStr = (d: Date) => d.toLocaleDateString('en-CA'); // yyyy-mm-dd

const PRESETS = ['today', 'yesterday', 'this-week', 'custom'] as const;
type Preset = typeof PRESETS[number];

function getPresetRange(preset: Preset): { from: string; to: string } {
  const today = new Date();
  const ymd = (d: Date) => toDateStr(d);

  if (preset === 'today') {
    const s = ymd(today);
    return { from: s, to: s };
  }
  if (preset === 'yesterday') {
    const y = new Date(today);
    y.setDate(today.getDate() - 1);
    const s = ymd(y);
    return { from: s, to: s };
  }
  if (preset === 'this-week') {
    const mon = new Date(today);
    mon.setDate(today.getDate() - today.getDay() + (today.getDay() === 0 ? -6 : 1));
    return { from: ymd(mon), to: ymd(today) };
  }
  return { from: '', to: '' };
}

function presetLabel(p: Preset) {
  return { today: 'Today', yesterday: 'Yesterday', 'this-week': 'This Week', custom: 'Custom' }[p];
}

// ─── Status config ────────────────────────────────────────────────────────────
const STATUS_CONFIG = {
  pending: {
    label: 'Pending',
    bg: 'bg-amber-50',
    border: 'border-amber-200',
    badge: 'bg-amber-100 text-amber-800',
    dot: 'bg-amber-400',
    icon: Clock,
  },
  'in-progress': {
    label: 'In Progress',
    bg: 'bg-blue-50',
    border: 'border-blue-200',
    badge: 'bg-blue-100 text-blue-800',
    dot: 'bg-blue-500',
    icon: RefreshCw,
  },
  completed: {
    label: 'Completed',
    bg: 'bg-emerald-50',
    border: 'border-emerald-200',
    badge: 'bg-emerald-100 text-emerald-800',
    dot: 'bg-emerald-500',
    icon: CheckCircle2,
  },
} as const;

function timeUntil(iso?: string) {
  if (!iso) return null;
  const diff = new Date(iso).getTime() - Date.now();
  if (diff < 0) return { label: 'Overdue', overdue: true };
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return { label: `${mins}m left`, overdue: false };
  return { label: `${Math.floor(mins / 60)}h ${mins % 60}m left`, overdue: false };
}

// ─── Task Card ────────────────────────────────────────────────────────────────
function TaskCard({
  task,
  onUpdateStatus,
  updating,
}: {
  task: TaskAssignment;
  onUpdateStatus: (id: number, status: string) => void;
  updating: number | null;
}) {
  const [expanded, setExpanded] = useState(false);
  const cfg = STATUS_CONFIG[task.status] ?? STATUS_CONFIG.pending;
  const deadline = timeUntil(task.endJob);
  const isUpdating = updating === task.id;
  const hasInventory = (task.issuedItems?.length ?? 0) > 0;

  return (
    <div className={`rounded-2xl border-2 ${cfg.border} ${cfg.bg} overflow-hidden shadow-sm`}>
      {/* Card header — tap to expand */}
      <button
        onClick={() => setExpanded(p => !p)}
        className="w-full flex items-start gap-3 p-4 text-left"
      >
        {/* Icon badge */}
        <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 shadow-sm text-white
          ${task.room?.status === 'maintenance' ? 'bg-purple-500' : 'bg-orange-500'}`}
        >
          {task.room?.status === 'maintenance' ? <Wrench size={20} /> : <Paintbrush size={20} />}
        </div>

        <div className="flex-1 min-w-0">
          {/* Room + status badge row */}
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <span className="text-lg font-bold text-gray-900 leading-tight">
              Room {task.room?.roomNo ?? '—'}
            </span>
            <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold ${cfg.badge}`}>
              <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
              {cfg.label}
            </span>
          </div>

          {/* Floor + type */}
          <div className="flex items-center gap-3 mt-1 flex-wrap text-xs text-gray-500">
            {task.room?.Floor?.floorName && (
              <span className="flex items-center gap-1">
                <Building2 size={11} /> {task.room.Floor.floorName}
              </span>
            )}
            {task.room?.RoomType?.name && (
              <span className="flex items-center gap-1">
                <Bed size={11} /> {task.room.RoomType.name}
              </span>
            )}
            {hasInventory && (
              <span className="flex items-center gap-1 text-indigo-600 font-medium">
                <Package size={11} /> {task.issuedItems!.length} item{task.issuedItems!.length !== 1 ? 's' : ''} issued
              </span>
            )}
          </div>

          {/* Deadline chip */}
          {deadline && (
            <div className={`mt-1.5 inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full
              ${deadline.overdue ? 'bg-red-100 text-red-700' : 'bg-gray-100 text-gray-600'}`}
            >
              <Clock size={10} />
              {deadline.label}
            </div>
          )}
        </div>

        <div className="flex-shrink-0 text-gray-400 mt-1">
          {expanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
        </div>
      </button>

      {/* Expanded details */}
      {expanded && (
        <div className="px-4 pb-4 space-y-3 border-t border-white/60 pt-3">

          {/* Deadline */}
          {task.endJob && (
            <div className="flex items-center gap-2 text-sm text-gray-600 bg-white/70 rounded-xl px-3 py-2">
              <Clock size={14} className="text-gray-400 flex-shrink-0" />
              <div>
                <div className="text-[10px] text-gray-400 font-semibold uppercase tracking-wide">Deadline</div>
                <div className="font-semibold">{new Date(task.endJob).toLocaleString()}</div>
              </div>
            </div>
          )}

          {/* Instructions / Notes */}
          {task.notes && (
            <div className="bg-yellow-50 border border-yellow-100 rounded-xl px-3 py-2.5 text-sm">
              <div className="text-[10px] font-semibold text-yellow-600 uppercase tracking-wide mb-1">Instructions</div>
              <div className="text-gray-800">{task.notes}</div>
            </div>
          )}

          {/* Issued Inventory */}
          {hasInventory && (
            <div className="bg-indigo-50 border border-indigo-100 rounded-xl overflow-hidden">
              <div className="flex items-center gap-1.5 px-3 py-2 border-b border-indigo-100">
                <Package size={13} className="text-indigo-600" />
                <span className="text-xs font-semibold text-indigo-700 uppercase tracking-wide">Issued Inventory</span>
              </div>
              <div className="divide-y divide-indigo-100">
                {task.issuedItems!.map((it, i) => (
                  <div key={i} className="flex items-center justify-between px-3 py-2 text-sm">
                    <span className="text-gray-800 font-medium">{it.item?.title ?? 'Unknown Item'}</span>
                    <span className="text-indigo-700 font-bold text-xs bg-indigo-100 px-2 py-0.5 rounded-full">
                      ×{it.quantityIssued} {it.item?.unit ?? ''}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Action buttons */}
          <div className="flex gap-2 pt-1">
            {task.status === 'pending' && (
              <button
                onClick={() => onUpdateStatus(task.id, 'in-progress')}
                disabled={isUpdating}
                className="flex-1 flex items-center justify-center gap-2 bg-[#1D4ED8] hover:bg-[#1E40AF] text-white font-semibold py-3 rounded-xl transition-colors disabled:opacity-60 shadow-sm active:scale-[0.98]"
              >
                {isUpdating ? <Loader2 size={16} className="animate-spin" /> : <RefreshCw size={16} />}
                Start Task
              </button>
            )}
            {task.status === 'in-progress' && (
              <button
                onClick={() => onUpdateStatus(task.id, 'completed')}
                disabled={isUpdating}
                className="flex-1 flex items-center justify-center gap-2 bg-emerald-500 hover:bg-emerald-600 text-white font-semibold py-3 rounded-xl transition-colors disabled:opacity-60 shadow-sm active:scale-[0.98]"
              >
                {isUpdating ? <Loader2 size={16} className="animate-spin" /> : <CheckCheck size={16} />}
                Mark Complete
              </button>
            )}
            {task.status === 'completed' && (
              <div className="flex-1 flex items-center justify-center gap-2 bg-emerald-100 text-emerald-700 font-semibold py-3 rounded-xl">
                <CheckCircle2 size={16} /> Done
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Section header ───────────────────────────────────────────────────────────
function SectionHeader({ icon: Icon, label, color }: { icon: any; label: string; color: string }) {
  return (
    <p className={`text-xs font-semibold uppercase tracking-widest ${color} mb-2 flex items-center gap-1.5`}>
      <Icon size={12} /> {label}
    </p>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function HousekeeperMyTasks() {
  const user = authService.getUser();
  const navigate = useNavigate();

  const [allTasks, setAllTasks] = useState<TaskAssignment[]>([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<number | null>(null);

  // Status filter
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'in-progress' | 'completed'>('all');

  // Date preset — default: today
  const [preset, setPreset] = useState<Preset>('today');
  const [customFrom, setCustomFrom] = useState('');
  const [customTo, setCustomTo] = useState('');
  const [showCustomPicker, setShowCustomPicker] = useState(false);

  // Active date range
  const dateRange = useMemo(() => {
    if (preset === 'custom') return { from: customFrom, to: customTo };
    return getPresetRange(preset);
  }, [preset, customFrom, customTo]);

  // ── Fetch data ──────────────────────────────────────────────────────────────
  const fetchTasks = async () => {
    if (!user?.id) return;
    setLoading(true);
    try {
      const [tasksRes, vouchersRes] = await Promise.all([
        api.get(`/housekeeping/staff-tasks/${user.id}`),
        api.get('/issueVoucher?issuedToType=HousekeepingAssignment').catch(() => null),
      ]);

      const tasks: TaskAssignment[] = tasksRes.data || [];
      const vouchers: any[] = vouchersRes?.data || [];

      // Join issued items onto each task
      const enriched = tasks.map(t => {
        const tv = vouchers.filter(v => v.issuedToName === String(t.id));
        const issuedItems: IssuedItem[] = tv.flatMap(v => v.items || []);
        return { ...t, issuedItems };
      });

      setAllTasks(enriched);
    } catch {
      toast.error('Failed to load tasks');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTasks();
    const interval = setInterval(fetchTasks, 60000);
    return () => clearInterval(interval);
  }, []);

  const handleUpdateStatus = async (id: number, status: string) => {
    setUpdating(id);
    try {
      await api.put(`/housekeeping/assignment/${id}`, { status });
      setAllTasks(prev => prev.map(t => t.id === id ? { ...t, status: status as any } : t));
      toast.success(status === 'in-progress' ? 'Task started! 🧹' : 'Task completed! ✅');
    } catch {
      toast.error('Failed to update task');
    } finally {
      setUpdating(null);
    }
  };

  const handleLogout = () => { authService.logout(); navigate('/login'); };

  // ── Filtered tasks ──────────────────────────────────────────────────────────
  const dateTasks = useMemo(() => {
    const { from, to } = dateRange;
    return allTasks.filter(t => {
      const d = toDateStr(new Date(t.createdAt));
      if (from && d < from) return false;
      if (to && d > to) return false;
      return true;
    });
  }, [allTasks, dateRange]);

  const displayTasks = useMemo(() =>
    statusFilter === 'all' ? dateTasks : dateTasks.filter(t => t.status === statusFilter),
    [dateTasks, statusFilter]
  );

  const counts = useMemo(() => ({
    all: dateTasks.length,
    pending: dateTasks.filter(t => t.status === 'pending').length,
    'in-progress': dateTasks.filter(t => t.status === 'in-progress').length,
    completed: dateTasks.filter(t => t.status === 'completed').length,
  }), [dateTasks]);

  // ── Render ──────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-gradient-to-b from-[#0F172A] to-[#1E293B] flex flex-col">

      {/* ── Sticky top bar ── */}
      <header className="sticky top-0 z-20 bg-[#0F172A]/95 backdrop-blur-md border-b border-white/10 px-4 py-3 flex items-center justify-between">
        <div>
          <h1 className="text-white font-bold text-lg leading-tight">My Tasks</h1>
          <p className="text-gray-400 text-xs">
            {user?.fullName ?? 'Housekeeper'} · {new Date().toLocaleDateString('en-GB', { weekday: 'short', day: '2-digit', month: 'short' })}
          </p>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={fetchTasks}
            disabled={loading}
            className="p-2 text-gray-400 hover:text-white hover:bg-white/10 rounded-xl transition-colors"
          >
            <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
          </button>
          <button
            onClick={handleLogout}
            className="p-2 text-gray-400 hover:text-red-400 hover:bg-white/10 rounded-xl transition-colors"
            title="Logout"
          >
            <LogOut size={18} />
          </button>
        </div>
      </header>

      {/* ── Date preset strip ── */}
      <div className="px-4 pt-3 pb-1">
        <div className="flex gap-2 overflow-x-auto scrollbar-hide">
          {PRESETS.map(p => (
            <button
              key={p}
              onClick={() => {
                setPreset(p);
                if (p === 'custom') setShowCustomPicker(true);
              }}
              className={`flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border transition-all
                ${preset === p
                  ? 'bg-[#1D4ED8] border-[#1D4ED8] text-white shadow-md'
                  : 'bg-white/5 border-white/10 text-gray-300 hover:bg-white/10'
                }`}
            >
              <CalendarDays size={12} />
              {presetLabel(p)}
            </button>
          ))}
        </div>

        {/* Custom date range picker */}
        {preset === 'custom' && showCustomPicker && (
          <div className="mt-2 bg-white/10 backdrop-blur rounded-2xl p-3 border border-white/10">
            <div className="flex items-center justify-between mb-2">
              <span className="text-white text-xs font-semibold">Custom Range</span>
              <button onClick={() => setShowCustomPicker(false)} className="text-gray-400 hover:text-white">
                <X size={14} />
              </button>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-[10px] text-gray-400 font-medium block mb-1">From</label>
                <input
                  type="date"
                  value={customFrom}
                  onChange={e => setCustomFrom(e.target.value)}
                  className="w-full bg-white/10 text-white text-sm border border-white/20 rounded-xl px-2 py-1.5 outline-none focus:border-[#1D4ED8]"
                />
              </div>
              <div>
                <label className="text-[10px] text-gray-400 font-medium block mb-1">To</label>
                <input
                  type="date"
                  value={customTo}
                  onChange={e => setCustomTo(e.target.value)}
                  className="w-full bg-white/10 text-white text-sm border border-white/20 rounded-xl px-2 py-1.5 outline-none focus:border-[#1D4ED8]"
                />
              </div>
            </div>
            <button
              onClick={() => setShowCustomPicker(false)}
              className="mt-2 w-full bg-[#1D4ED8] text-white text-xs font-semibold py-2 rounded-xl hover:bg-[#1E40AF] transition-colors"
            >
              Apply
            </button>
          </div>
        )}

        {/* Active range label (for custom) */}
        {preset === 'custom' && (customFrom || customTo) && !showCustomPicker && (
          <div className="mt-1.5 flex items-center gap-1.5">
            <span className="text-[10px] text-gray-400">
              {customFrom || '—'} → {customTo || '—'}
            </span>
            <button
              onClick={() => { setCustomFrom(''); setCustomTo(''); }}
              className="text-[10px] text-red-400 underline"
            >
              clear
            </button>
          </div>
        )}
      </div>

      {/* ── Stats row ── */}
      <div className="grid grid-cols-3 gap-3 px-4 pt-3 pb-2">
        {[
          { label: 'Pending', count: counts.pending, color: 'from-amber-500 to-orange-500', icon: Clock },
          { label: 'In Progress', count: counts['in-progress'], color: 'from-blue-500 to-indigo-500', icon: RefreshCw },
          { label: 'Completed', count: counts.completed, color: 'from-emerald-500 to-teal-500', icon: CheckCircle2 },
        ].map(({ label, count, color, icon: Icon }) => (
          <div key={label} className={`bg-gradient-to-br ${color} rounded-2xl p-3 text-white text-center shadow-lg`}>
            <Icon size={16} className="mx-auto mb-1 opacity-90" />
            <div className="text-2xl font-bold leading-none">{count}</div>
            <div className="text-[10px] font-medium opacity-80 mt-0.5 leading-tight">{label}</div>
          </div>
        ))}
      </div>

      {/* ── Status filter chips ── */}
      <div className="px-4 pb-3 flex gap-2 overflow-x-auto scrollbar-hide">
        {(
          [
            { key: 'all', label: 'All' },
            { key: 'pending', label: 'Pending' },
            { key: 'in-progress', label: 'In Progress' },
            { key: 'completed', label: 'Done' },
          ] as const
        ).map(({ key, label }) => (
          <button
            key={key}
            onClick={() => setStatusFilter(key)}
            className={`flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-semibold transition-all
              ${statusFilter === key
                ? 'bg-white text-[#0F172A] shadow'
                : 'bg-white/10 text-gray-300 hover:bg-white/20'
              }`}
          >
            {label}
            <span className={`text-xs px-1.5 py-0.5 rounded-full font-bold
              ${statusFilter === key ? 'bg-[#1D4ED8] text-white' : 'bg-white/10 text-gray-300'}`}
            >
              {counts[key]}
            </span>
          </button>
        ))}
      </div>

      {/* ── Tasks list ── */}
      <main className="flex-1 px-4 pb-8 space-y-3">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-4">
            <Loader2 size={36} className="text-white animate-spin" />
            <p className="text-gray-400 text-sm">Loading your tasks...</p>
          </div>
        ) : displayTasks.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3 text-center">
            <DoorOpen size={52} className="text-gray-500 opacity-60" />
            <p className="text-white font-semibold text-lg">No tasks found</p>
            <p className="text-gray-400 text-sm">
              {statusFilter === 'all'
                ? 'No assignments for the selected period.'
                : `No ${statusFilter} tasks in selected period.`}
            </p>
            {preset !== 'all' && (
              <button
                onClick={() => setPreset('today')}
                className="mt-1 text-xs text-[#60A5FA] underline"
              >
                Back to Today
              </button>
            )}
          </div>
        ) : (
          <>
            {/* In Progress first */}
            {statusFilter === 'all' && counts['in-progress'] > 0 && (
              <div className="mb-1">
                <SectionHeader icon={AlertCircle} label="Active Now" color="text-blue-400" />
                {displayTasks.filter(t => t.status === 'in-progress').map(task => (
                  <div key={task.id} className="mb-3">
                    <TaskCard task={task} onUpdateStatus={handleUpdateStatus} updating={updating} />
                  </div>
                ))}
              </div>
            )}

            {/* Pending */}
            {statusFilter === 'all' && counts.pending > 0 && (
              <div className="mb-1">
                <SectionHeader icon={Clock} label="Pending" color="text-amber-400" />
                {displayTasks.filter(t => t.status === 'pending').map(task => (
                  <div key={task.id} className="mb-3">
                    <TaskCard task={task} onUpdateStatus={handleUpdateStatus} updating={updating} />
                  </div>
                ))}
              </div>
            )}

            {/* Completed */}
            {statusFilter === 'all' && counts.completed > 0 && (
              <div>
                <SectionHeader icon={CheckCircle2} label="Completed" color="text-emerald-400" />
                {displayTasks.filter(t => t.status === 'completed').map(task => (
                  <div key={task.id} className="mb-3">
                    <TaskCard task={task} onUpdateStatus={handleUpdateStatus} updating={updating} />
                  </div>
                ))}
              </div>
            )}

            {/* Single-status view */}
            {statusFilter !== 'all' && displayTasks.map(task => (
              <TaskCard key={task.id} task={task} onUpdateStatus={handleUpdateStatus} updating={updating} />
            ))}
          </>
        )}
      </main>

      <div className="h-4" />
    </div>
  );
}
