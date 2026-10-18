import React, { useEffect, useState, useMemo } from 'react';
import {
  Search, RefreshCw, CheckCircle2, AlertTriangle,
  Clock, DoorOpen, Wrench, Paintbrush, Building2, PersonStanding, Eye, ChevronRight,
  X, FileSpreadsheet, FileText, CalendarDays, Package, Trash2
} from 'lucide-react';
import { toast } from 'sonner';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';

import api from '../../services/api';
import { usePermissions } from '../../hooks/usePermissions';
import { housekeepingService } from '../../services/housekeepingService';
import { useConfirm } from '../../components/ConfirmProvider';
import { DataTable } from '../../components/DataTable';
import Select from 'react-select';

// ─── Types ────────────────────────────────────────────────────────────────
interface Room {
  id?: number;
  roomNo: string | number;
  floorId: number;
  status?: string;
  roomStatus?: string;
  RoomType?: { name: string };
  Floor?: { id: number; floorName: string };
  _localDirty?: boolean;
}

interface Floor {
  id: number;
  floorName: string;
  numberOfRooms: number;
  startRoomNo?: number;
  roomNames?: string | null;
  filteredRooms?: Array<string | number>;
}

interface Staff {
  id: number;
  fullName: string;
  role: string;
  phone?: string;
}

interface Assignment {
  id: number;
  status: string;
  notes?: string;
  createdAt: string;
  endJob?: string;
  assignedRoomId?: number;
  room?: Room;
  staff?: Staff;
}

// ─── Constants ────────────────────────────────────────────────────────────
const STATUS_META: Record<string, { label: string; color: string; bg: string }> = {
  pending: { label: 'Pending', color: 'text-amber-700', bg: 'bg-amber-100' },
  'in-progress': { label: 'In Progress', color: 'text-blue-700', bg: 'bg-blue-100' },
  completed: { label: 'Completed', color: 'text-emerald-700', bg: 'bg-emerald-100' },
};

function timeAgo(iso?: string) {
  if (!iso) return '—';
  const diff = Math.floor((Date.now() - new Date(iso).getTime()) / 60000);
  if (diff < 1) return 'Just now';
  if (diff < 60) return `${diff}m ago`;
  return `${Math.floor(diff / 60)}h ago`;
}

const roomKey = (value: any) => String(value ?? '').trim().toLowerCase();
const roomLabel = (value: any) => String(value ?? 'N/A').trim() || 'N/A';

const getFloorRoomLabels = (floor: Floor, allRooms: Room[] = []) => {
  if (floor.roomNames) {
    const names = floor.roomNames
      .split(',')
      .map((name) => name.trim())
      .filter(Boolean);
    if (names.length) return names;
  }

  const existingRooms = allRooms
    .filter((room) => room.floorId === floor.id && room.roomNo !== undefined && room.roomNo !== null)
    .map((room) => room.roomNo);

  if (existingRooms.length) return existingRooms;

  if (typeof floor.startRoomNo === 'number' && Number.isFinite(floor.startRoomNo)) {
    return Array.from({ length: floor.numberOfRooms || 0 }, (_, i) => floor.startRoomNo! + i);
  }

  return [];
};

// ─── Main Component ───────────────────────────────────────────────────────
export function Housekeeping() {
  const [allRooms, setAllRooms] = useState<Room[]>([]);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [staffList, setStaffList] = useState<Staff[]>([]);
  const [floors, setFloors] = useState<Floor[]>([]);
  const [housekeepingRooms, setHousekeepingRooms] = useState<Room[]>([]);
  const [inventoryItems, setInventoryItems] = useState<any[]>([]);
  const [issueVouchers, setIssueVouchers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = usePermissions();

  // Filters
  const [activeTab, setActiveTab] = useState<'rooms' | 'assignments'>('rooms');
  const [statusFilter, setStatusFilter] = useState('all');
  const [staffFilter, setStaffFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  // Date filter
  const [startDateFilter, setStartDateFilter] = useState<string>(new Date().toLocaleDateString('en-CA'));
  const [endDateFilter, setEndDateFilter] = useState<string>(new Date().toLocaleDateString('en-CA'));

  // Modals
  const [showRoomModal, setShowRoomModal] = useState(false);
  const [selectedRoom, setSelectedRoom] = useState<Room | null>(null);

  // Room modal form
  const [isDirtyChecked, setIsDirtyChecked] = useState(false);
  const [isMaintenanceChecked, setIsMaintenanceChecked] = useState(false);
  const [notes, setNotes] = useState('');
  const [endJobDateTime, setEndJobDateTime] = useState('');
  const [selectedStaffId, setSelectedStaffId] = useState('');
  const [assigning, setAssigning] = useState(false);
  const [issueInventoryChecked, setIssueInventoryChecked] = useState(false);
  const [selectedInventoryItems, setSelectedInventoryItems] = useState<{ itemId: string, quantity: string }[]>([{ itemId: '', quantity: '1' }]);

  // Assignment details modal
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [detailAssignment, setDetailAssignment] = useState<Assignment | null>(null);

  const { confirm } = useConfirm();

  // ─── Data Fetching ──────────────────────────────────────────────────────
  const fetchData = async () => {
    setLoading(true);
    try {
      const [roomsRes, assignRes, staffRes, floorsRes, hkRes, invRes, vouchersRes] = await Promise.all([
        housekeepingService.getAssignedRooms(),
        housekeepingService.getAssignments(),
        housekeepingService.getStaff(),
        housekeepingService.getFloors(),
        housekeepingService.getHousekeepingRooms(),
        api.get('/items/filtered?ispos=0').catch(() => null),
        api.get('/issueVoucher?issuedToType=HousekeepingAssignment').catch(() => null),
      ]);

      setAllRooms(roomsRes?.data || roomsRes || []);
      setAssignments(assignRes?.data || assignRes || []);
      setStaffList(staffRes?.data || staffRes || []);

      const floorsData = floorsRes?.data || floorsRes || [];
      setFloors([...floorsData].reverse());
      setHousekeepingRooms(hkRes?.data || hkRes || []);
      if (invRes?.data?.data) {
        setInventoryItems(invRes.data.data);
      }
      if (vouchersRes?.data) {
        setIssueVouchers(vouchersRes.data);
      }
    } catch (err) {
      console.error(err);
      toast.error('Failed to load housekeeping data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // ─── Submit Action ──────────────────────────────────────────────────────
  const handleSubmit = async () => {
    if (!selectedRoom) return;
    setAssigning(true);

    try {
      if (isDirtyChecked) {
        const response: any = await housekeepingService.markRoomDirty(selectedRoom.id!, {
          notes,
          endJob: endJobDateTime || undefined,
          staffId: selectedStaffId || undefined
        });

        const newAssignmentId = response?.assignment?.id;

        setAllRooms(prev => prev.map(r => r.id === selectedRoom.id ? { ...r, status: 'dirty', _localDirty: true } : r));
        setHousekeepingRooms(prev => {
          const exists = prev.find(r => roomKey(r.roomNo) === roomKey(selectedRoom.roomNo));
          if (exists) return prev.map(r => roomKey(r.roomNo) === roomKey(selectedRoom.roomNo) ? { ...r, status: 'dirty' } : r);
          return [...prev, { ...selectedRoom, status: 'dirty' }];
        });

        toast.success(`Room ${roomLabel(selectedRoom.roomNo)} marked as dirty`);

        // Issue inventory items if selected
        if (issueInventoryChecked && selectedInventoryItems.length > 0 && newAssignmentId) {
          const validItems = selectedInventoryItems
            .filter(i => i.itemId && Number(i.quantity) > 0)
            .map(i => ({ itemId: Number(i.itemId), quantityIssued: Number(i.quantity) }));
          
          if (validItems.length > 0) {
            await api.post('/items/issue', {
              issuedToType: 'HousekeepingAssignment',
              issuedToName: newAssignmentId.toString(),
              createdBy: user?.id || 1,
              items: validItems,
              remarks: `Issued for housekeeping assignment - ${notes}`
            });
            toast.success('Inventory items issued successfully');
          }
        }
      }

      if (isMaintenanceChecked) {
        await housekeepingService.markRoomMaintenance(selectedRoom.id!, {
          notes,
          endJob: endJobDateTime || undefined,
          staffId: selectedStaffId || undefined
        });

        setAllRooms(prev => prev.map(r => r.id === selectedRoom.id ? { ...r, status: 'maintenance' } : r));
        setHousekeepingRooms(prev => {
          const exists = prev.find(r => roomKey(r.roomNo) === roomKey(selectedRoom.roomNo));
          if (exists) return prev.map(r => roomKey(r.roomNo) === roomKey(selectedRoom.roomNo) ? { ...r, status: 'maintenance' } : r);
          return [...prev, { ...selectedRoom, status: 'maintenance' }];
        });

        toast.success(`Room ${roomLabel(selectedRoom.roomNo)} marked for maintenance`);
      }

      setShowRoomModal(false);
      resetModal();
      fetchData();
    } catch (err: any) {
      toast.error(err?.message || 'Failed to update room');
    } finally {
      setAssigning(false);
    }
  };

  const updateAssignmentStatus = async (id: number, status: string) => {
    try {
      await housekeepingService.updateAssignmentStatus(id, status);
      setAssignments(prev => prev.map(a => a.id === id ? { ...a, status } : a));
      toast.success(`Task marked as ${STATUS_META[status]?.label}`);
      fetchData();
    } catch {
      toast.error('Failed to update status');
    }
  };

  const handleDeleteAssignment = async (id: number) => {
    const isConfirmed = await confirm({
      title: 'Delete Assignment',
      message: 'Are you sure you want to delete this task? Issued items will be reversed and the room will become available again.',
    });

    if (isConfirmed) {
      try {
        await housekeepingService.deleteAssignment(id);
        toast.success('Assignment deleted successfully');
        fetchData();
      } catch (error: any) {
        toast.error(error?.response?.data?.message || error?.message || 'Failed to delete assignment');
      }
    }
  };

  const resetModal = () => {
    setNotes('');
    setIsDirtyChecked(false);
    setIsMaintenanceChecked(false);
    setEndJobDateTime('');
    setSelectedStaffId('');
    setIssueInventoryChecked(false);
    setSelectedInventoryItems([{ itemId: '', quantity: '1' }]);
  };

  // ─── Derived Data ───────────────────────────────────────────────────────
  const totalRoomsCount = useMemo(() => {
    return floors.reduce((acc, floor) => acc + getFloorRoomLabels(floor, allRooms).length, 0);
  }, [floors, allRooms]);

  // Date-filtered assignments
  const dateFilteredAssignments = useMemo(() => {
    return assignments.filter(a => {
      const createdStr = new Date(a.createdAt).toLocaleDateString('en-CA');
      const startStr = startDateFilter ? new Date(startDateFilter).toLocaleDateString('en-CA') : null;
      const endStr = endDateFilter ? new Date(endDateFilter).toLocaleDateString('en-CA') : null;

      if (startStr && createdStr < startStr) return false;
      if (endStr && createdStr > endStr) return false;
      return true;
    });
  }, [assignments, startDateFilter, endDateFilter]);

  const counts = useMemo(() => {
    let actualDirty = 0;
    let actualMaintenance = 0;
    let actualUnassigned = 0;

    floors.forEach(floor => {
      const allRoomNos = getFloorRoomLabels(floor, allRooms);
      allRoomNos.forEach(roomNo => {
        const assigned = allRooms.find(r => roomKey(r.roomNo) === roomKey(roomNo) && r.floorId === floor.id);
        const hk = housekeepingRooms.find(r => roomKey(r.roomNo) === roomKey(roomNo) && (r.floorId === floor.id || r.Floor?.id === floor.id));

        const isDirty = hk?.status === 'dirty';
        const isMaint = hk?.status === 'maintenance';
        const isUnassigned = !assigned && !hk;

        if (isDirty) actualDirty++;
        else if (isMaint) actualMaintenance++;
        else if (isUnassigned) actualUnassigned++;
      });
    });

    return {
      total: totalRoomsCount,
      dirty: actualDirty,
      maintenance: actualMaintenance,
      unassigned: actualUnassigned,
      pending: dateFilteredAssignments.filter(a => a.status === 'pending').length,
      inProgress: dateFilteredAssignments.filter(a => a.status === 'in-progress').length,
      completed: dateFilteredAssignments.filter(a => a.status === 'completed').length,
    };
  }, [totalRoomsCount, floors, allRooms, housekeepingRooms, dateFilteredAssignments]);

  const filteredFloors = useMemo(() => {
    return floors.map(floor => {
      const allRoomNos = getFloorRoomLabels(floor, allRooms);
      const filtered = allRoomNos.filter(roomNo => {
        const assigned = allRooms.find(r => roomKey(r.roomNo) === roomKey(roomNo) && r.floorId === floor.id);
        const hk = housekeepingRooms.find(r => roomKey(r.roomNo) === roomKey(roomNo) && (r.floorId === floor.id || r.Floor?.id === floor.id));

        if (searchQuery) {
          const q = searchQuery.toLowerCase();
          const matches = roomLabel(roomNo).toLowerCase().includes(q) ||
            assigned?.RoomType?.name?.toLowerCase().includes(q) ||
            floor.floorName.toLowerCase().includes(q);
          if (!matches) return false;
        }

        if (statusFilter !== 'all') {
          let effectiveStatus = 'unassigned';
          if (hk?.status) effectiveStatus = hk.status;
          else if (assigned) effectiveStatus = assigned.status === 'available' ? 'clean' : 'occupied';

          if (statusFilter === 'dirty' && effectiveStatus !== 'dirty') return false;
          if (statusFilter === 'maintenance' && effectiveStatus !== 'maintenance') return false;
          if (statusFilter === 'clean' && effectiveStatus !== 'clean') return false;
          if (statusFilter === 'occupied' && effectiveStatus !== 'occupied') return false;
          if (statusFilter === 'unassigned' && effectiveStatus !== 'unassigned') return false;
        }

        return true;
      });
      return { ...floor, filteredRooms: filtered };
    }).filter(f => (f.filteredRooms || []).length > 0);
  }, [floors, allRooms, housekeepingRooms, searchQuery, statusFilter]);

  const filteredAssignments = useMemo(() => {
    return dateFilteredAssignments.filter(a => {
      if (statusFilter !== 'all' && a.status !== statusFilter) return false;
      if (staffFilter !== 'all' && a.staff?.id?.toString() !== staffFilter) return false;
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        return roomLabel(a.room?.roomNo).toLowerCase().includes(q) ||
          a.staff?.fullName?.toLowerCase().includes(q) ||
          a.room?.RoomType?.name?.toLowerCase().includes(q);
      }
      return true;
    });
  }, [dateFilteredAssignments, statusFilter, staffFilter, searchQuery]);

  const isSelectedDirty = selectedRoom &&
    ((selectedRoom.status || selectedRoom.roomStatus || '').toLowerCase() === 'dirty' || selectedRoom._localDirty);

  const activeTaskForSelectedRoom = selectedRoom 
    ? assignments.find(a => a.assignedRoomId === selectedRoom.id && ['pending', 'in-progress'].includes(a.status)) 
    : null;

  // ─── Export Helpers ─────────────────────────────────────────────────────
  const getReportTitle = () => {
    if (startDateFilter && endDateFilter) {
      return `Housekeeping Report (${new Date(startDateFilter).toLocaleDateString('en-GB')} to ${new Date(endDateFilter).toLocaleDateString('en-GB')})`;
    } else if (startDateFilter) {
      return `Housekeeping Report (From ${new Date(startDateFilter).toLocaleDateString('en-GB')})`;
    } else if (endDateFilter) {
      return `Housekeeping Report (Until ${new Date(endDateFilter).toLocaleDateString('en-GB')})`;
    }
    return `Housekeeping Report — All Dates`;
  };

  const getExportRows = () =>
    filteredAssignments.map((a, i) => ({
      '#': i + 1,
      'Room No': roomLabel(a.room?.roomNo),
      'Room Type': a.room?.RoomType?.name || '—',
      'Staff': a.staff?.fullName || 'Unassigned',
      'Phone': a.staff?.phone || '—',
      'Status': STATUS_META[a.status]?.label || a.status,
      'Notes': a.notes || '—',
      'End Job': a.endJob ? new Date(a.endJob).toLocaleString() : '—',
      // 'Created At': new Date(a.createdAt).toLocaleString(),
    }));

  const exportExcel = () => {
    const rows = getExportRows();
    if (!rows.length) { toast.error('No data to export'); return; }

    const ws = XLSX.utils.json_to_sheet(rows);

    // Column widths
    ws['!cols'] = [
      { wch: 4 }, { wch: 10 }, { wch: 14 }, { wch: 20 }, { wch: 14 },
      { wch: 12 }, { wch: 28 }, { wch: 20 }, { wch: 20 },
    ];

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Housekeeping');
    XLSX.writeFile(wb, `Housekeeping_${startDateFilter || 'all'}_to_${endDateFilter || 'all'}.xlsx`);
    toast.success('Excel exported successfully');
  };

  const exportPDF = () => {
    const rows = getExportRows();
    if (!rows.length) { toast.error('No data to export'); return; }

    const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });

    // Header bar
    doc.setFillColor(15, 23, 42);
    doc.rect(0, 0, 297, 18, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(13);
    doc.setFont('helvetica', 'bold');
    doc.text(getReportTitle(), 14, 12);

    // Summary line
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(200, 200, 200);
    const summaryLine = `Total: ${filteredAssignments.length}  |  Pending: ${filteredAssignments.filter(a => a.status === 'pending').length}  |  In Progress: ${filteredAssignments.filter(a => a.status === 'in-progress').length}  |  Completed: ${filteredAssignments.filter(a => a.status === 'completed').length}`;
    doc.text(summaryLine, 14, 17);

    autoTable(doc, {
      startY: 22,
      head: [['#', 'Room No', 'Room Type', 'Staff', 'Phone', 'Status', 'Notes', 'End Job']],
      body: rows.map(r => Object.values(r)),
      styles: { fontSize: 8, cellPadding: 2.5 },
      headStyles: { fillColor: [29, 78, 216], textColor: 255, fontStyle: 'bold' },
      alternateRowStyles: { fillColor: [248, 250, 252] },
      columnStyles: {
        0: { halign: 'center', cellWidth: 8 },
        1: { cellWidth: 16 },
        2: { cellWidth: 22 },
        3: { cellWidth: 30 },
        4: { cellWidth: 22 },
        5: { cellWidth: 22 },
        6: { cellWidth: 40 },
        7: { cellWidth: 30 },
        8: { cellWidth: 35 },
      },
      didDrawCell: (data) => {
        // Color status cell
        if (data.section === 'body' && data.column.index === 5) {
          const val = String(data.cell.raw || '');
          if (val === 'Pending') doc.setTextColor(180, 100, 0);
          else if (val === 'In Progress') doc.setTextColor(29, 78, 216);
          else if (val === 'Completed') doc.setTextColor(5, 150, 105);
        }
      },
    });

    // Footer
    const pageCount = (doc as any).internal.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(7);
      doc.setTextColor(150);
      doc.text(`Page ${i} of ${pageCount}  |  Generated on ${new Date().toLocaleString()}`, 14, doc.internal.pageSize.height - 4);
    }

    doc.save(`Housekeeping_${startDateFilter || 'all'}_to_${endDateFilter || 'all'}.pdf`);
    toast.success('PDF exported successfully');
  };

  // ─── Render ─────────────────────────────────────────────────────────────
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-3xl font-bold text-[#0F172A]">Housekeeping</h1>
          <p className="text-gray-600 mt-1">Manage room status, maintenance, and staff tasks</p>
        </div>
        <button
          onClick={fetchData}
          disabled={loading}
          className="flex items-center gap-2 border border-gray-300 text-gray-700 px-4 py-2.5 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
        >
          <RefreshCw size={16} className={loading ? 'animate-spin' : ''} /> Refresh
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
        {[
          { label: 'Total Rooms', count: counts.total, icon: DoorOpen, color: 'text-gray-700 bg-gray-100' },
          { label: 'Dirty', count: counts.dirty, icon: Paintbrush, color: 'text-orange-700 bg-orange-100' },
          { label: 'Maintenance', count: counts.maintenance, icon: Wrench, color: 'text-purple-700 bg-purple-100' },
          { label: 'In Progress', count: counts.inProgress, icon: RefreshCw, color: 'text-blue-700 bg-blue-100' },
          { label: 'Pending', count: counts.pending, icon: Clock, color: 'text-amber-700 bg-amber-100' },
          { label: 'Completed', count: counts.completed, icon: CheckCircle2, color: 'text-emerald-700 bg-emerald-100' },
          { label: 'Unassigned', count: counts.unassigned, icon: AlertTriangle, color: 'text-slate-700 bg-slate-100' },
        ].map(s => (
          <div key={s.label} className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 flex flex-col items-center justify-center text-center">
            <div className={`w-10 h-10 rounded-full flex items-center justify-center mb-2 ${s.color}`}>
              <s.icon size={20} />
            </div>
            <div className="text-2xl font-bold text-gray-900 leading-none">{loading ? '...' : s.count}</div>
            <div className="text-xs text-gray-500 font-medium mt-1">{s.label}</div>
          </div>
        ))}
      </div>

      {/* ── Date Filter + Export Bar (shown on Assignments tab) ── */}
      <div className={`bg-white rounded-xl shadow-sm border border-gray-100 px-5 py-4 flex flex-wrap items-center gap-3 transition-all ${activeTab === 'assignments' ? 'block' : 'hidden'}`}>
        <div className="flex items-center gap-2 text-sm font-semibold text-gray-700">
          <CalendarDays size={16} className="text-[#1D4ED8]" />
          From:
        </div>
        <input
          type="date"
          value={startDateFilter}
          onChange={e => setStartDateFilter(e.target.value)}
          className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-[#1D4ED8] outline-none"
        />

        <div className="flex items-center gap-2 text-sm font-semibold text-gray-700 ml-2">
          To:
        </div>
        <input
          type="date"
          value={endDateFilter}
          onChange={e => setEndDateFilter(e.target.value)}
          className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-[#1D4ED8] outline-none"
        />

        {/* Clear */}
        {(startDateFilter || endDateFilter) && (
          <button
            onClick={() => { setStartDateFilter(''); setEndDateFilter(''); }}
            className="text-xs text-gray-500 hover:text-gray-700 underline ml-1"
          >
            Clear
          </button>
        )}

        <div className="ml-auto flex items-center gap-2">
          {/* Showing count */}
          <span className="text-xs text-gray-500 mr-1">
            {filteredAssignments.length} assignment{filteredAssignments.length !== 1 ? 's' : ''} found
          </span>

          {/* Excel */}
          <button
            onClick={exportExcel}
            className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold rounded-lg shadow-sm transition-colors"
          >
            <FileSpreadsheet size={15} />
            Export Excel
          </button>

          {/* PDF */}
          <button
            onClick={exportPDF}
            className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-sm font-semibold rounded-lg shadow-sm transition-colors"
          >
            <FileText size={15} />
            Export PDF
          </button>
        </div>
      </div>

      {/* Filters & Tabs */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
        <div className="flex flex-col xl:flex-row gap-4 justify-between items-start xl:items-center">

          <div className="flex items-center gap-2 bg-gray-100 p-1 rounded-lg">
            <button
              onClick={() => { setActiveTab('rooms'); setStatusFilter('all'); }}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${activeTab === 'rooms' ? 'bg-white shadow text-[#1D4ED8]' : 'text-gray-600 hover:text-gray-900'}`}
            >
              All Rooms
            </button>
            <button
              onClick={() => { setActiveTab('assignments'); setStatusFilter('all'); }}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${activeTab === 'assignments' ? 'bg-white shadow text-[#1D4ED8]' : 'text-gray-600 hover:text-gray-900'}`}
            >
              Assignments <span className="ml-1.5 bg-[#1D4ED8] text-white text-xs px-2 py-0.5 rounded-full">{dateFilteredAssignments.length}</span>
            </button>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 w-full xl:w-auto">
            {activeTab === 'assignments' && (
              <div className="w-full sm:w-48 z-10">
                <Select
                  options={[
                    { value: 'all', label: 'All Staff' },
                    ...staffList.map(s => ({ value: s.id.toString(), label: s.fullName }))
                  ]}
                  value={{
                    value: staffFilter,
                    label: staffFilter === 'all' ? 'All Staff' : staffList.find(s => s.id.toString() === staffFilter)?.fullName || 'All Staff'
                  }}
                  onChange={(selected) => setStaffFilter(selected?.value || 'all')}
                  className="text-sm"
                  styles={{
                    control: (base) => ({
                      ...base,
                      minHeight: '38px',
                      borderRadius: '0.5rem',
                      borderColor: '#E5E7EB',
                      boxShadow: 'none',
                      '&:hover': {
                        borderColor: '#1D4ED8'
                      }
                    })
                  }}
                />
              </div>
            )}
            <select
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value)}
              className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-[#1D4ED8] outline-none"
            >
              {activeTab === 'rooms' ? (
                <>
                  <option value="all">All Room Statuses</option>
                  <option value="dirty">Dirty</option>
                  <option value="maintenance">Maintenance</option>
                  <option value="occupied">Occupied</option>
                  <option value="clean">Clean</option>
                  <option value="unassigned">Unassigned</option>
                </>
              ) : (
                <>
                  <option value="all">All Task Statuses</option>
                  <option value="pending">Pending</option>
                  <option value="in-progress">In Progress</option>
                  <option value="completed">Completed</option>
                </>
              )}
            </select>

            <div className="relative flex-1 sm:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
              <input
                type="text"
                placeholder="Search..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-[#1D4ED8] outline-none"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="flex flex-col items-center text-gray-500">
            <RefreshCw size={32} className="animate-spin mb-4" />
            <p>Loading housekeeping data...</p>
          </div>
        </div>
      ) : activeTab === 'rooms' ? (
        <div className="space-y-6">
          {filteredFloors.length === 0 ? (
            <div className="bg-white rounded-xl shadow-sm py-16 text-center border border-gray-100">
              <Search size={48} className="mx-auto text-gray-300 mb-4" />
              <h3 className="text-lg font-semibold text-gray-900">No rooms found</h3>
              <p className="text-gray-500">Try adjusting your filters or search query.</p>
            </div>
          ) : (
            filteredFloors.map(floor => (
              <div key={floor.id} className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="bg-slate-50 border-b border-gray-100 px-5 py-3 flex items-center justify-between">
                  <div className="flex items-center gap-2 font-semibold text-[#0F172A]">
                    <Building2 size={18} className="text-[#1D4ED8]" /> {floor.floorName}
                  </div>
                  <div className="text-sm text-gray-500">{floor.filteredRooms?.length} rooms</div>
                </div>
                <div className="p-5">
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 gap-3">
                    {floor.filteredRooms?.map(roomNo => {
                      const assigned = allRooms.find(r => roomKey(r.roomNo) === roomKey(roomNo) && r.floorId === floor.id);
                      const hk = housekeepingRooms.find(r => roomKey(r.roomNo) === roomKey(roomNo) && (r.floorId === floor.id || r.Floor?.id === floor.id));

                      const isDirty = hk?.status === 'dirty';
                      const isMaint = hk?.status === 'maintenance';
                      const isOccupied = assigned && assigned.status !== 'available';
                      const isUnassigned = !assigned && !hk;

                      let bgClass = 'bg-emerald-500 hover:bg-emerald-600';
                      let statusText = 'Clean';

                      if (isDirty) { bgClass = 'bg-orange-500 hover:bg-orange-600'; statusText = 'Dirty'; }
                      else if (isMaint) { bgClass = 'bg-purple-500 hover:bg-purple-600'; statusText = 'Maint.'; }
                      else if (isOccupied) { bgClass = 'bg-red-500 hover:bg-red-600'; statusText = 'Occupied'; }
                      else if (isUnassigned) { bgClass = 'bg-slate-400 hover:bg-slate-500'; statusText = 'Unassigned'; }

                      return (
                        <div
                          key={`${floor.id}-${roomLabel(roomNo)}`}
                          onClick={() => {
                            const room = { ...(assigned || hk || { roomNo, floorId: floor.id, Floor: floor, RoomType: { name: 'Unassigned' } }) } as Room;
                            if (isDirty) room.status = 'dirty';
                            setSelectedRoom(room);
                            resetModal();
                            setIsDirtyChecked(isDirty || !!room._localDirty);
                            setIsMaintenanceChecked(isMaint || room.status === 'maintenance');
                            setShowRoomModal(true);
                          }}
                          className={`${bgClass} text-white p-3 rounded-xl cursor-pointer transition-colors shadow-sm flex flex-col justify-between aspect-square relative group overflow-hidden`}
                        >
                          <div className="flex justify-between items-start">
                            <span className="font-bold text-xl leading-none">{roomLabel(roomNo)}</span>
                            {isDirty && <Paintbrush size={16} className="opacity-80" />}
                            {isMaint && <Wrench size={16} className="opacity-80" />}
                            {!isDirty && !isMaint && <div className="w-5 h-5 rounded-full bg-white/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"><ChevronRight size={14} /></div>}
                          </div>
                          <div>
                            <div className="text-[10px] font-medium uppercase tracking-wider opacity-80 truncate">{assigned?.RoomType?.name || hk?.RoomType?.name || '—'}</div>
                            <div className="text-sm font-bold mt-1">{statusText}</div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          {filteredAssignments.length === 0 ? (
            <div className="py-16 text-center">
              <CalendarDays size={48} className="mx-auto text-gray-200 mb-4" />
              <h3 className="text-lg font-semibold text-gray-900">No assignments found</h3>
              <p className="text-gray-500 text-sm mt-1">
                {startDateFilter || endDateFilter ? `No assignments found for the selected date range.` : 'Try adjusting filters'}
              </p>
            </div>
          ) : (
            <DataTable
              columns={[
                {
                  header: 'Room',
                  cell: (a: Assignment) => (
                    <div className="font-medium text-gray-900">
                      Room {roomLabel(a.room?.roomNo)}
                      <div className="text-xs text-gray-500 font-normal">{a.room?.RoomType?.name || '—'}</div>
                    </div>
                  )
                },
                {
                  header: 'Assigned Staff',
                  cell: (a: Assignment) => (
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-[#1D4ED8]">
                        <PersonStanding size={16} />
                      </div>
                      <div>
                        <div className="text-sm font-medium text-gray-900">{a.staff?.fullName || 'Unassigned'}</div>
                        {a.staff?.phone && <div className="text-xs text-gray-500">{a.staff.phone}</div>}
                      </div>
                    </div>
                  )
                },
                {
                  header: 'Time',
                  cell: (a: Assignment) => (
                    <div>
                      <div className="text-sm text-gray-900">{timeAgo(a.createdAt)}</div>
                      <div className="text-xs text-gray-500">{new Date(a.createdAt).toLocaleDateString()}</div>
                    </div>
                  )
                },
                {
                  header: 'Job End Time',
                  cell: (a: Assignment) => (
                    <div>
                      {a.endJob ? (
                        <>
                          <div className="text-sm text-gray-900">{new Date(a.endJob).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                          <div className="text-xs text-gray-500">{new Date(a.endJob).toLocaleDateString()}</div>
                        </>
                      ) : (
                        <span className="text-gray-400">—</span>
                      )}
                    </div>
                  )
                },
                {
                  header: 'Status',
                  cell: (a: Assignment) => {
                    const meta = STATUS_META[a.status];
                    return meta ? (
                      <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold ${meta.bg} ${meta.color}`}>
                        {meta.label}
                      </span>
                    ) : <span>{a.status}</span>;
                  }
                },
                {
                  header: 'Actions',
                  cell: (a: Assignment) => (
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => { setDetailAssignment(a); setShowDetailModal(true); }}
                        className="p-1.5 text-gray-500 hover:text-[#1D4ED8] hover:bg-blue-50 rounded-lg transition-colors"
                        title="View Details"
                      >
                        <Eye size={16} />
                      </button>
                      {a.status === 'pending' && (
                        <button
                          onClick={() => updateAssignmentStatus(a.id, 'in-progress')}
                          className="px-3 py-1.5 bg-[#1D4ED8] text-white text-xs font-medium rounded-lg hover:bg-[#1E40AF]"
                        >
                          Start
                        </button>
                      )}
                      {a.status === 'in-progress' && (
                        <button
                          onClick={() => updateAssignmentStatus(a.id, 'completed')}
                          className="px-3 py-1.5 bg-emerald-500 text-white text-xs font-medium rounded-lg hover:bg-emerald-600"
                        >
                          Complete
                        </button>
                      )}
                      <button
                        onClick={() => handleDeleteAssignment(a.id)}
                        className="p-1.5 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors ml-auto"
                        title="Delete Assignment"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  )
                }
              ]}
              data={filteredAssignments}
              pageSize={15}
            />
          )}
        </div>
      )}

      {/* ─── Room Modal ──────────────────────────────────────────────────────── */}
      {showRoomModal && selectedRoom && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[9999] p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg flex flex-col max-h-[90vh] overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 bg-[#0F172A] shrink-0">
              <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                <DoorOpen size={18} /> Room {roomLabel(selectedRoom.roomNo)}
                {isSelectedDirty && <span className="bg-red-500 text-white text-[10px] uppercase font-bold px-2 py-0.5 rounded ml-2">Dirty</span>}
              </h2>
              <button onClick={() => setShowRoomModal(false)} className="text-gray-400 hover:text-white"><X size={20} /></button>
            </div>

            <div className="p-6 overflow-y-auto flex-1">
              {/* Room Details Strip */}
              <div className="flex bg-slate-50 border border-slate-100 rounded-xl p-3 mb-5 text-sm divide-x divide-slate-200">
                <div className="flex-1 px-3 text-center">
                  <div className="text-xs text-gray-500 mb-0.5">Type</div>
                  <div className="font-semibold text-gray-900 truncate">{selectedRoom.RoomType?.name || '—'}</div>
                </div>
                <div className="flex-1 px-3 text-center">
                  <div className="text-xs text-gray-500 mb-0.5">Floor</div>
                  <div className="font-semibold text-gray-900">{selectedRoom.Floor?.floorName || floors.find(f => f.id === selectedRoom.floorId)?.floorName || '—'}</div>
                </div>
                <div className="flex-1 px-3 text-center">
                  <div className="text-xs text-gray-500 mb-0.5">Status</div>
                  <div className={`font-semibold ${isSelectedDirty ? 'text-red-600' : 'text-emerald-600'}`}>
                    {isSelectedDirty ? 'Dirty' : (selectedRoom.status || 'Clean')}
                  </div>
                </div>
              </div>

              {activeTaskForSelectedRoom ? (
                <div className="mt-4 bg-blue-50 text-blue-800 text-sm p-4 rounded-xl flex items-start gap-3 border border-blue-100">
                  <div className="mt-0.5"><AlertTriangle size={16} /></div>
                  <div>
                    <div className="font-semibold mb-1">Room Already Assigned</div>
                    <p className="text-blue-700/80">This room is currently assigned to an active task. Please complete or delete the existing task before re-assigning.</p>
                  </div>
                </div>
              ) : (
                <>
                  {/* Status Toggles */}
                  <div className="grid grid-cols-2 gap-4 mb-6">
                    <label className={`flex items-center gap-3 p-3 border rounded-xl cursor-pointer transition-colors ${isDirtyChecked ? 'border-orange-500 bg-orange-50' : 'border-gray-200 hover:bg-gray-50'}`}>
                      <input type="checkbox" className="w-4 h-4 text-orange-600 rounded" checked={isDirtyChecked} onChange={e => { setIsDirtyChecked(e.target.checked); if (e.target.checked) setIsMaintenanceChecked(false); }} />
                      <span className={`text-sm font-semibold ${isDirtyChecked ? 'text-orange-700' : 'text-gray-700'}`}>Mark Dirty</span>
                    </label>
                    <label className={`flex items-center gap-3 p-3 border rounded-xl cursor-pointer transition-colors ${isMaintenanceChecked ? 'border-purple-500 bg-purple-50' : 'border-gray-200 hover:bg-gray-50'}`}>
                      <input type="checkbox" className="w-4 h-4 text-purple-600 rounded" checked={isMaintenanceChecked} onChange={e => { setIsMaintenanceChecked(e.target.checked); if (e.target.checked) setIsDirtyChecked(false); }} />
                      <span className={`text-sm font-semibold ${isMaintenanceChecked ? 'text-purple-700' : 'text-gray-700'}`}>Maintenance</span>
                    </label>
                  </div>

                  {/* Issue Inventory Toggle (Only show if isDirtyChecked) */}
                  {isDirtyChecked && (
                    <div className="mb-6">
                      <label className="flex items-center gap-2 mb-3 cursor-pointer">
                        <input type="checkbox" className="w-4 h-4 text-[#1D4ED8] rounded" checked={issueInventoryChecked} onChange={e => setIssueInventoryChecked(e.target.checked)} />
                        <span className="text-sm font-semibold text-gray-700">Issue Inventory Items</span>
                      </label>
                      {issueInventoryChecked && (
                        <div className="space-y-3 bg-blue-50 p-4 rounded-xl border border-blue-100">
                          {selectedInventoryItems.map((item, index) => (
                            <div key={index} className="flex gap-2 items-center">
                              <select 
                                value={item.itemId} 
                                onChange={(e) => {
                                  const newItems = [...selectedInventoryItems];
                                  newItems[index].itemId = e.target.value;
                                  setSelectedInventoryItems(newItems);
                                }}
                                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none bg-white"
                              >
                                <option value="">Select Item</option>
                                {inventoryItems.map(invItem => (
                                  <option key={invItem.id} value={invItem.id}>
                                    {invItem.title} (Stock: {invItem.stocks?.[0]?.qty ?? 0} {invItem.unit})
                                  </option>
                                ))}
                              </select>
                              <input 
                                type="number" 
                                min="1"
                                value={item.quantity}
                                onChange={(e) => {
                                  const newItems = [...selectedInventoryItems];
                                  newItems[index].quantity = e.target.value;
                                  setSelectedInventoryItems(newItems);
                                }}
                                className="w-20 px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none"
                                placeholder="Qty"
                              />
                              {selectedInventoryItems.length > 1 && (
                                <button 
                                  onClick={() => {
                                    const newItems = selectedInventoryItems.filter((_, i) => i !== index);
                                    setSelectedInventoryItems(newItems);
                                  }}
                                  className="text-red-500 hover:text-red-700 p-1"
                                >
                                  <X size={16} />
                                </button>
                              )}
                            </div>
                          ))}
                          <button 
                            type="button"
                            onClick={() => setSelectedInventoryItems([...selectedInventoryItems, { itemId: '', quantity: '1' }])}
                            className="text-sm text-[#1D4ED8] hover:underline font-medium"
                          >
                            + Add another item
                          </button>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Form */}
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-1.5">Special Instructions</label>
                      <textarea rows={2} value={notes} onChange={e => setNotes(e.target.value)} placeholder="E.g. VIP room, deep clean..."
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#1D4ED8] outline-none resize-none" />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-1.5">End Job Time</label>
                      <input type="datetime-local" value={endJobDateTime} onChange={e => setEndJobDateTime(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#1D4ED8] outline-none" />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-1.5">Assign Staff <span className="text-red-500">*</span></label>
                      <select value={selectedStaffId} onChange={e => setSelectedStaffId(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#1D4ED8] outline-none">
                        <option value="">Select Staff</option>
                        {staffList.map(s => <option key={s.id} value={s.id}>{s.fullName} ({s.role})</option>)}
                      </select>
                    </div>
                  </div>
                </>
              )}
            </div>

            <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex justify-end gap-3 shrink-0">
              <button onClick={() => setShowRoomModal(false)} className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium hover:bg-gray-100">{activeTaskForSelectedRoom ? 'Close' : 'Cancel'}</button>
              {!activeTaskForSelectedRoom && (
                <button
                  onClick={handleSubmit}
                  disabled={assigning || (!isDirtyChecked && !isMaintenanceChecked) || !selectedStaffId}
                  className="px-6 py-2 bg-[#1D4ED8] text-white rounded-lg text-sm font-medium hover:bg-[#1E40AF] disabled:opacity-50 flex items-center gap-2"
                >
                  {assigning ? <RefreshCw size={14} className="animate-spin" /> : <CheckCircle2 size={14} />}
                  {assigning ? 'Saving...' : 'Submit'}
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ─── Detail Modal ──────────────────────────────────────────────────────── */}
      {showDetailModal && detailAssignment && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[9999] p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 bg-[#0F172A]">
              <h2 className="text-lg font-semibold text-white flex items-center gap-2">Task Details</h2>
              <button onClick={() => setShowDetailModal(false)} className="text-gray-400 hover:text-white"><X size={20} /></button>
            </div>
            <div className="p-6 space-y-4">
              <div className="flex justify-between items-center mb-2">
                <span className="text-lg font-bold text-gray-900">Room {roomLabel(detailAssignment.room?.roomNo)}</span>
                <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${STATUS_META[detailAssignment.status]?.bg} ${STATUS_META[detailAssignment.status]?.color}`}>
                  {STATUS_META[detailAssignment.status]?.label}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                  <div className="text-xs text-gray-500 mb-1">Assigned To</div>
                  <div className="font-semibold text-sm text-gray-900">{detailAssignment.staff?.fullName || 'Unassigned'}</div>
                </div>
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                  <div className="text-xs text-gray-500 mb-1">Time Created</div>
                  <div className="font-semibold text-sm text-gray-900">{timeAgo(detailAssignment.createdAt)}</div>
                </div>
                {detailAssignment.endJob && (
                  <div className="col-span-2 bg-slate-50 p-3 rounded-xl border border-slate-100 flex items-center gap-2">
                    <Clock size={16} className="text-gray-400" />
                    <div>
                      <div className="text-xs text-gray-500">End Job Deadline</div>
                      <div className="font-semibold text-sm text-gray-900">{new Date(detailAssignment.endJob).toLocaleString()}</div>
                    </div>
                  </div>
                )}
              </div>

              {detailAssignment.notes && (
                <div className="mt-4 p-4 bg-yellow-50 border border-yellow-100 rounded-xl">
                  <div className="text-xs font-semibold text-yellow-800 uppercase tracking-wider mb-1">Notes / Instructions</div>
                  <div className="text-sm text-yellow-900">{detailAssignment.notes}</div>
                </div>
              )}

              {/* Issued Inventory Section */}
              {(() => {
                const assignmentVouchers = issueVouchers.filter(v => v.issuedToType === 'HousekeepingAssignment' && v.issuedToName === String(detailAssignment.id));
                const allIssuedItems = assignmentVouchers.flatMap(v => v.items || []);

                if (allIssuedItems.length > 0) {
                  return (
                    <div className="mt-4">
                      <div className="text-sm font-semibold text-gray-900 mb-2 flex items-center gap-2">
                        <Package size={16} className="text-[#1D4ED8]" />
                        Issued Inventory
                      </div>
                      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
                        <table className="w-full text-sm text-left">
                          <thead className="bg-gray-50 border-b border-gray-200">
                            <tr>
                              <th className="px-4 py-2 font-medium text-gray-500">Item</th>
                              <th className="px-4 py-2 font-medium text-gray-500 w-24">Qty</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-100">
                            {allIssuedItems.map((issueItem: any, idx: number) => (
                              <tr key={idx}>
                                <td className="px-4 py-2 text-gray-900">{issueItem?.item?.title || 'Unknown Item'}</td>
                                <td className="px-4 py-2 text-gray-700 font-medium">{issueItem.quantityIssued || issueItem.qty}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  );
                }
                return null;
              })()}
            </div>
            <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex justify-end gap-3">
              <button onClick={() => setShowDetailModal(false)} className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium hover:bg-gray-100">Close</button>
              {detailAssignment.status === 'pending' && (
                <button onClick={() => { updateAssignmentStatus(detailAssignment.id, 'in-progress'); setShowDetailModal(false); }} className="px-4 py-2 bg-[#1D4ED8] text-white rounded-lg text-sm font-medium hover:bg-[#1E40AF]">Start Task</button>
              )}
              {detailAssignment.status === 'in-progress' && (
                <button onClick={() => { updateAssignmentStatus(detailAssignment.id, 'completed'); setShowDetailModal(false); }} className="px-4 py-2 bg-emerald-500 text-white rounded-lg text-sm font-medium hover:bg-emerald-600">Mark Complete</button>
              )}
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
