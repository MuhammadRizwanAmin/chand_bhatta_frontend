import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router';
import {
  Save, X, Camera, Image as ImageIcon, DoorOpen,
  CheckCircle2, AlertTriangle, RefreshCw, ChevronLeft, Building2
} from 'lucide-react';
import { toast } from 'sonner';

import { staffService } from '../../services/staffService';
import { housekeepingService } from '../../services/housekeepingService';
import { roleService, Role } from '../../services/roleService';
import { locationService, Location } from '../../services/locationService';
import { authService } from '../../services/authService';
import { useModule } from '../../context/ModuleContext';
import { privilegeToModuleMap } from '../../hooks/usePermissions';

// ─── Interfaces ─────────────────────────────────────────────────────────
interface Room {
  id: number;
  roomNo: number;
  floorId: number;
  status: string;
  RoomType?: { name: string };
  Floor?: { floorName: string };
  floorName?: string;
}

interface PrivilegeState {
  reservations: boolean; staff: boolean; reports: boolean; rooms: boolean;
  assets: boolean; passwords: boolean; accounts: boolean; housekeeping: boolean;
  extra: boolean; groups: boolean; customers: boolean; lostfound: boolean;
  floor: boolean; bed: boolean; agent: boolean; organization: boolean;
  transportation: boolean; reputation: boolean; membership: boolean; kitchen: boolean;
  hrm: boolean; edit: boolean;
  [key: string]: boolean;
}

const DEFAULT_PRIVILEGES: PrivilegeState = {
  reservations: false, staff: false, reports: false, rooms: false,
  assets: false, passwords: false, accounts: false, housekeeping: false,
  extra: false, groups: false, customers: false, lostfound: false,
  floor: false, bed: false, agent: false, organization: false,
  transportation: false, reputation: false, membership: false, kitchen: false,
  hrm: false, edit: false,
};

const PAYMENT_CYCLE_OPTIONS = Array.from({ length: 31 }, (_, i) => {
  const day = (i + 1).toString().padStart(2, "0");
  return { value: day, label: day };
});

const ROLE_OPTIONS = [
  { value: "admin", label: "Admin" },
  { value: "housekeeping", label: "House Keeping" },
];

const ROLE_PRIVILEGES_PRESETS: Record<string, PrivilegeState> = {
  admin: {
    reservations: true, staff: true, reports: true, rooms: true,
    assets: true, passwords: true, accounts: true, housekeeping: true,
    extra: true, groups: true, customers: true, lostfound: true,
    floor: true, bed: true, agent: true, organization: true,
    transportation: true, reputation: true, membership: true, kitchen: true,
    hrm: true, edit: true,
  },
  housekeeping: {
    ...DEFAULT_PRIVILEGES,
    housekeeping: true, rooms: true, lostfound: true,
  },
};

const PLACEHOLDER_IMG = 'https://placehold.co/200';

// ─── RoomPicker Component ───────────────────────────────────────────────
const RoomPicker = ({
  rooms,
  selectedIds,
  onChange,
  loading
}: {
  rooms: Room[],
  selectedIds: number[],
  onChange: (ids: number[]) => void,
  loading: boolean
}) => {
  const toggleRoom = (id: number) => {
    const updated = selectedIds.includes(id)
      ? selectedIds.filter(r => r !== id)
      : [...selectedIds, id];
    onChange(updated);
  };

  const selectAll = () => onChange(rooms.map(r => r.id));
  const clearAll = () => onChange([]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-10 text-gray-500">
        <RefreshCw className="animate-spin mb-3 text-[#1D4ED8]" size={24} />
        <p className="text-sm">Loading available rooms...</p>
      </div>
    );
  }

  if (!rooms.length) {
    return (
      <div className="flex flex-col items-center justify-center py-10 text-gray-400 bg-gray-50 rounded-xl border border-dashed border-gray-200">
        <DoorOpen size={32} className="mb-2 opacity-50" />
        <p className="text-sm">No available rooms found</p>
      </div>
    );
  }

  // Group by floor
  const byFloor = rooms.reduce((acc: Record<string, Room[]>, room) => {
    const key = room.Floor?.floorName || room.floorName || `Floor ${room.floorId}`;
    if (!acc[key]) acc[key] = [];
    acc[key].push(room);
    return acc;
  }, {});

  return (
    <div className="bg-slate-50 border border-slate-200 rounded-xl p-5">
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 font-semibold text-[#0F172A]">
            <DoorOpen size={18} className="text-[#1D4ED8]" /> All Rooms
          </div>
          {selectedIds.length > 0 && (
            <span className="bg-[#1D4ED8] text-white text-xs font-bold px-2 py-0.5 rounded-full">
              {selectedIds.length} Selected
            </span>
          )}
        </div>
        <div className="flex gap-2">
          <button type="button" onClick={selectAll} className="text-xs font-semibold px-3 py-1.5 bg-white border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50">Select All</button>
          <button type="button" onClick={clearAll} className="text-xs font-semibold px-3 py-1.5 bg-white border border-gray-300 rounded-lg text-red-600 hover:bg-red-50">Clear</button>
        </div>
      </div>

      <div className="space-y-6">
        {Object.entries(byFloor).map(([floorName, floorRooms]) => (
          <div key={floorName}>
            <div className="flex items-center gap-2 text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">
              <Building2 size={14} /> {floorName}
            </div>
            <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 lg:grid-cols-10 gap-2">
              {floorRooms.map(room => {
                const isSelected = selectedIds.includes(room.id);
                return (
                  <div
                    key={room.id}
                    onClick={() => toggleRoom(room.id)}
                    className={`relative p-2 rounded-xl cursor-pointer transition-all border-2 select-none flex flex-col justify-center items-center h-16 ${
                      isSelected 
                        ? 'bg-[#1D4ED8] border-[#1D4ED8] text-white shadow-md transform -translate-y-0.5' 
                        : 'bg-white border-gray-200 text-gray-700 hover:border-gray-300 hover:shadow-sm'
                    }`}
                  >
                    {isSelected && (
                      <div className="absolute top-1 right-1">
                        <CheckCircle2 size={12} className="text-white" />
                      </div>
                    )}
                    <div className="font-bold text-lg leading-none">{room.roomNo}</div>
                    <div className={`text-[9px] mt-1 truncate w-full text-center ${isSelected ? 'text-blue-100' : 'text-gray-400'}`}>
                      {room.RoomType?.name || "—"}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

// ─── Main Page Component ────────────────────────────────────────────────
export function StaffForm() {
  const { id } = useParams<{ id?: string }>();
  const navigate = useNavigate();
  const isEditMode = !!id;
  
  const { modules } = useModule();

  const [loading, setLoading] = useState(isEditMode);
  const [submitting, setSubmitting] = useState(false);

  // Form State
  const [fullName, setFullName] = useState('');
  const [cnic, setCnic] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [salary, setSalary] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [paymentCycle, setPaymentCycle] = useState('');
  const [role, setRole] = useState('');
  const [emergencyContact, setEmergencyContact] = useState('');
  const [selectedRooms, setSelectedRooms] = useState<number[]>([]);
  const [privileges, setPrivileges] = useState<PrivilegeState>({ ...DEFAULT_PRIVILEGES });

  // Location Access Control State
  const [hasAllLocationsAccess, setHasAllLocationsAccess] = useState(true);
  const [locationAccessType, setLocationAccessType] = useState<'all' | 'specific'>('all');
  const [selectedLocationId, setSelectedLocationId] = useState<string>('');
  const [selectedLocationIds, setSelectedLocationIds] = useState<string[]>([]);

  const toggleLocationSelection = (locIdStr: string) => {
    setSelectedLocationIds(prev => {
      if (prev.includes(locIdStr)) {
        const filtered = prev.filter(id => id !== locIdStr);
        if (filtered.length > 0) setSelectedLocationId(filtered[0]);
        else setSelectedLocationId('');
        return filtered;
      } else {
        const updated = [...prev, locIdStr];
        setSelectedLocationId(updated[0]);
        return updated;
      }
    });
  };

  // Dynamic Roles & Locations Data
  const [availableRoles, setAvailableRoles] = useState<Role[]>([]);
  const [locations, setLocations] = useState<Location[]>([]);
  const [dataLoading, setDataLoading] = useState(true);
  const [roleId, setRoleId] = useState<number | string>('');

  // Files & Images
  const [profilePreview, setProfilePreview] = useState<string>(PLACEHOLDER_IMG);
  const [profileFile, setProfileFile] = useState<File | null>(null);
  const [letterFile, setLetterFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Room Picker Data
  const [allRooms, setAllRooms] = useState<Room[]>([]);
  const [roomsLoading, setRoomsLoading] = useState(false);

  const isHousekeeping = role.toLowerCase() === 'housekeeping';

  useEffect(() => {
    loadInitialData();
  }, []);

  const loadInitialData = async () => {
    setDataLoading(true);
    try {
      const [fetchedRoles, fetchedLocs] = await Promise.all([
        roleService.getRoles(),
        locationService.getAll().catch(() => [])
      ]);
      setAvailableRoles(fetchedRoles);

      const currentUser = authService.getUser();
      let allowedList: string[] = [];
      if (currentUser?.allowedLocations) {
        if (typeof currentUser.allowedLocations === 'string') {
          try { allowedList = JSON.parse(currentUser.allowedLocations).map(String); } catch { allowedList = []; }
        } else if (Array.isArray(currentUser.allowedLocations)) {
          allowedList = currentUser.allowedLocations.map(String);
        }
      } else if (currentUser?.locationId && String(currentUser.locationId) !== 'all') {
        allowedList = [String(currentUser.locationId)];
      }

      const hasSpecificLocation = allowedList.length > 0;
      setHasAllLocationsAccess(!hasSpecificLocation);
      
      // If user doesn't have All Locations access, force the form to Specific Locations
      if (hasSpecificLocation) {
         setLocationAccessType('specific');
      }

      const filteredLocs = hasSpecificLocation
        ? fetchedLocs.filter(l => allowedList.includes(String(l.id)))
        : fetchedLocs;

      setLocations(filteredLocs);
    } catch (e) {
      console.error("Error loading roles/locations", e);
    } finally {
      setDataLoading(false);
    }
  };

  const parsePrivileges = (privs: any): Record<string, boolean> => {
    if (!privs) return {};
    if (typeof privs === 'string') {
      try {
        const parsed = JSON.parse(privs);
        return typeof parsed === 'object' && parsed !== null ? parsed : {};
      } catch {
        return {};
      }
    }
    if (typeof privs === 'object' && privs !== null) {
      return privs;
    }
    return {};
  };

  const handleRoleChange = (selectedVal: string) => {
    const targetRole = availableRoles.find(
      r => String(r.id) === selectedVal || r.name.toLowerCase() === selectedVal.toLowerCase()
    );
    if (targetRole) {
      setRole(targetRole.name);
      setRoleId(targetRole.id);
      if (targetRole.privileges) {
        setPrivileges({ ...DEFAULT_PRIVILEGES, ...parsePrivileges(targetRole.privileges) });
      }
    } else {
      setRole(selectedVal);
      setRoleId('');
    }
  };

  const visiblePrivilegeKeys = Object.keys(DEFAULT_PRIVILEGES).filter((key) => {
    const mappedModule = privilegeToModuleMap[key];
    if (modules && mappedModule && modules[mappedModule] === false) {
      return false;
    }
    return true;
  });

  const toggleAllPrivileges = (checked: boolean) => {
    setPrivileges((prev) => {
      const updated = { ...prev };
      visiblePrivilegeKeys.forEach((key) => {
        updated[key] = checked;
      });
      return updated;
    });
  };

  const isAllVisibleSelected =
    visiblePrivilegeKeys.length > 0 && visiblePrivilegeKeys.every((key) => !!privileges[key]);

  // ─── Initial Data Load ────────────────────────────────────────────────
  useEffect(() => {
    if (isEditMode && id) {
      loadStaffDetails(id);
    }
  }, [id, isEditMode]);

  const loadStaffDetails = async (staffId: string) => {
    setLoading(true);
    try {
      const res = await staffService.getStaffDetails(staffId);
      const user = res.user;

      setFullName(user.fullName || '');
      setCnic(user.cnic || '');
      setPhone(user.phone || '');
      setEmail(user.email || '');
      setSalary(user.salary || '');
      setPaymentCycle(user.payout_date || '');
      setRole(user.role || (user.roleDetails ? user.roleDetails.name : ''));
      if (user.roleId) {
        setRoleId(user.roleId);
      } else if (user.roleDetails) {
        setRoleId(user.roleDetails.id);
      }
      setEmergencyContact(user.emergency_contact || '');
      
      if (user.profile_image) {
        setProfilePreview(user.profile_image);
      }

      const privData = user.privileges || user.rights;
      if (privData && Object.keys(privData).length > 0) {
        const p = Array.isArray(privData) ? privData[0] : privData;
        setPrivileges({ ...DEFAULT_PRIVILEGES, ...p });
      }

      let allowedLocs: string[] = [];
      if (user.allowedLocations) {
        if (typeof user.allowedLocations === 'string') {
          try { allowedLocs = JSON.parse(user.allowedLocations).map(String); } catch { allowedLocs = []; }
        } else if (Array.isArray(user.allowedLocations)) {
          allowedLocs = user.allowedLocations.map(String);
        }
      } else if (user.locationId !== undefined && user.locationId !== null && user.locationId !== '' && String(user.locationId) !== 'all') {
        allowedLocs = [String(user.locationId)];
      }

      if (allowedLocs.length > 0) {
        setLocationAccessType('specific');
        setSelectedLocationIds(allowedLocs);
        setSelectedLocationId(allowedLocs[0]);
      } else {
        setLocationAccessType('all');
        setSelectedLocationIds([]);
        setSelectedLocationId('');
      }

      if (user.rooms && Array.isArray(user.rooms)) {
        setSelectedRooms(user.rooms.map((r: any) => r.id));
      }

    } catch (error) {
      toast.error('Failed to load staff details');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  // ─── Rooms Loading for Housekeeping ───────────────────────────────────
  useEffect(() => {
    if (!isHousekeeping) {
      setAllRooms([]);
      if (!isEditMode) setSelectedRooms([]);
      return;
    }

    const fetchRooms = async () => {
      setRoomsLoading(true);
      try {
        const [roomsRes, staffRes] = await Promise.all([
          housekeepingService.getAssignedRooms(),
          staffService.getStaffList()
        ]);

        const fetchedRooms = roomsRes?.data || roomsRes || [];
        const allUsers = staffRes?.users || [];

        // Gather all room IDs that are already assigned to SOME housekeeping staff
        const assignedRoomIds = new Set<number>();
        allUsers.forEach((u: any) => {
          // If editing, ignore the current user's rooms so they stay available in the picker
          if (isEditMode && u.id === Number(id)) return;
          
          if (u.role === 'housekeeping' && Array.isArray(u.rooms)) {
            u.rooms.forEach((r: any) => {
              if (r && r.id) assignedRoomIds.add(r.id);
            });
          }
        });

        // Filter out assigned rooms
        const availableRooms = fetchedRooms.filter((r: Room) => !assignedRoomIds.has(r.id));
        setAllRooms(availableRooms);
      } catch (err) {
        console.error(err);
        toast.error("Error loading rooms for assignment");
      } finally {
        setRoomsLoading(false);
      }
    };

    fetchRooms();
  }, [isHousekeeping, isEditMode, id]);

  // ─── Handlers ─────────────────────────────────────────────────────────
  const handleCnicChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value.replace(/\D/g, '');
    if (value.length > 13) value = value.slice(0, 13);
    const formatted = value
      .replace(/^(\d{5})(\d{7})(\d{1})$/, '$1-$2-$3')
      .replace(/^(\d{5})(\d{1,7})$/, '$1-$2')
      .replace(/^(\d{1,5})$/, '$1');
    setCnic(formatted);
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value.replace(/\D/g, '');
    if (value.length > 11) value = value.slice(0, 11);
    const formatted = value
      .replace(/^(\d{4})(\d{1,7})$/, '$1-$2')
      .replace(/^(\d{1,4})$/, '$1');
    setPhone(formatted);
  };

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setProfileFile(file);
      const reader = new FileReader();
      reader.onload = () => setProfilePreview(reader.result as string);
      reader.readAsDataURL(file);
    }
  };



  // ─── Submit ───────────────────────────────────────────────────────────
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validation
    if (!fullName) return toast.error("Full Name is required");
    if (!email) return toast.error("Email is required");
    if (!role) return toast.error("Role is required");
    
    if (!isEditMode) {
      if (!password) return toast.error("Password is required");
      if (password !== confirmPassword) return toast.error("Passwords do not match");
    } else {
      if (password && password !== confirmPassword) return toast.error("Passwords do not match");
    }

    if (isHousekeeping && selectedRooms.length === 0) {
      return toast.error("Please assign at least one room to housekeeping staff");
    }

    if (locationAccessType === 'specific' && selectedLocationIds.length === 0) {
      return toast.error("Please select at least one branch location checkbox");
    }

    setSubmitting(true);
    
    try {
      const fd = new FormData();
      fd.append("fullName", fullName);
      fd.append("cnic", cnic);
      fd.append("phone", phone);
      fd.append("emergency_contact", emergencyContact);
      fd.append("email", email);
      fd.append("salary", salary);
      if (paymentCycle) fd.append("payout_date", paymentCycle);
      if (paymentCycle && !isEditMode) fd.append("paymentCycle", paymentCycle); // API expects different keys sometimes
      
      fd.append("role", role);
      if (roleId) fd.append("roleId", String(roleId));
      fd.append("privileges", JSON.stringify(privileges));

      // Append location scope assignment (null/empty for ALL, numeric ID + array for SPECIFIC)
      if (locationAccessType === 'specific' && selectedLocationIds.length > 0) {
        fd.append("locationId", selectedLocationIds[0]);
        fd.append("allowedLocations", JSON.stringify(selectedLocationIds));
      } else {
        fd.append("locationId", "");
        fd.append("allowedLocations", JSON.stringify([]));
      }
      
      if (password) fd.append("password", password);

      if (isHousekeeping && selectedRooms.length > 0) {
        fd.append("rooms", JSON.stringify(selectedRooms));
      } else if (!isHousekeeping) {
        fd.append("rooms", JSON.stringify([]));
      }

      if (profileFile) {
        fd.append("profile_image", profileFile);
      }
      
      if (letterFile) {
        fd.append("letter", letterFile);
      }

      if (isEditMode) {
        await staffService.updateStaff(id!, fd);
        toast.success("Staff profile updated successfully");

        // If updating the currently logged-in user, sync auth_user session immediately
        const currentUser = authService.getUser();
        if (currentUser && String(currentUser.id) === String(id)) {
          const updatedLocId = locationAccessType === 'specific' && selectedLocationIds.length > 0 ? Number(selectedLocationIds[0]) : null;
          const updatedUser = {
            ...currentUser,
            locationId: updatedLocId,
            allowedLocations: locationAccessType === 'specific' ? selectedLocationIds : null,
            role
          };
          localStorage.setItem('auth_user', JSON.stringify(updatedUser));
          if (updatedLocId) {
            localStorage.setItem('locationId', String(updatedLocId));
          } else {
            localStorage.removeItem('locationId');
          }
        }
      } else {
        await staffService.createStaff(fd);
        toast.success("Staff added successfully");
        navigate('/staff');
      }

    } catch (err: any) {
      console.error(err);
      toast.error(err.response?.data?.message || "Failed to save staff");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-gray-500">
        <RefreshCw size={32} className="animate-spin mb-4 text-[#1D4ED8]" />
        <p>Loading staff details...</p>
      </div>
    );
  }

  // ─── Render ───────────────────────────────────────────────────────────
  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-20">
      {/* Header */}
      <div className="flex items-center gap-4">
        <button 
          onClick={() => navigate(-1)}
          className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50 text-gray-600 transition-colors"
        >
          <ChevronLeft size={20} />
        </button>
        <div>
          <h1 className="text-3xl font-bold text-[#0F172A]">{isEditMode ? 'Edit Staff Profile' : 'Add New Staff'}</h1>
          <p className="text-gray-500 mt-1">Configure personal details, roles, and access controls</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        
        {/* Personal Details Card */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="bg-slate-50 border-b border-gray-100 px-6 py-4 font-semibold text-[#0F172A]">
            Personal Information
          </div>
          <div className="p-6">
            <div className="flex flex-col md:flex-row gap-8">
              
              {/* Profile Image Column */}
              <div className="flex flex-col items-center space-y-4 md:w-1/4">
                <div 
                  className="w-32 h-32 rounded-full border-4 border-white shadow-lg overflow-hidden bg-gray-100 relative group cursor-pointer"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <img src={profilePreview} alt="Profile" className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <Camera size={24} className="text-white" />
                  </div>
                </div>
                <button type="button" onClick={() => fileInputRef.current?.click()} className="text-sm text-[#1D4ED8] font-semibold hover:underline">
                  Change Photo
                </button>
                <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleImageSelect} />
              </div>

              {/* Form Grid */}
              <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">Full Name <span className="text-red-500">*</span></label>
                  <input type="text" value={fullName} onChange={e => setFullName(e.target.value)} required className="w-full px-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#1D4ED8] outline-none" />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">Email <span className="text-red-500">*</span></label>
                  <input type="email" value={email} onChange={e => setEmail(e.target.value)} required className="w-full px-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#1D4ED8] outline-none" />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">CNIC</label>
                  <input type="text" value={cnic} onChange={handleCnicChange} placeholder="00000-0000000-0" className="w-full px-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#1D4ED8] outline-none" />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">Phone</label>
                  <input type="text" value={phone} onChange={handlePhoneChange} placeholder="0300-0000000" className="w-full px-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#1D4ED8] outline-none" />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">Emergency Contact</label>
                  <input type="text" value={emergencyContact} onChange={e => setEmergencyContact(e.target.value)} className="w-full px-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#1D4ED8] outline-none" />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Employment & Role Card */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="bg-slate-50 border-b border-gray-100 px-6 py-4 font-semibold text-[#0F172A]">
            Employment Details
          </div>
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-6">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Salary</label>
                <input type="text" value={salary} onChange={e => setSalary(e.target.value)} placeholder="0.00" className="w-full px-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#1D4ED8] outline-none" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Payment Date</label>
                <select value={paymentCycle} onChange={e => setPaymentCycle(e.target.value)} className="w-full px-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#1D4ED8] outline-none bg-white">
                  <option value="">Select Day</option>
                  {PAYMENT_CYCLE_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Assigned Role <span className="text-red-500">*</span></label>
                <select 
                  value={roleId ? String(roleId) : (availableRoles.find(r => r.name.toLowerCase() === role.toLowerCase())?.id || role)} 
                  onChange={e => handleRoleChange(e.target.value)} 
                  required 
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#1D4ED8] outline-none bg-white font-medium"
                >
                  <option value="">Select Role</option>
                  {availableRoles.map(r => (
                    <option key={r.id} value={r.id}>
                      {r.name} {r.isSystem ? '(System)' : ''}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Location Access Assignment Section */}
            <div className="mb-6 p-4 bg-slate-50 border border-slate-200 rounded-xl">
              <label className="block text-sm font-bold text-gray-800 mb-1">Location Access Scope <span className="text-red-500">*</span></label>
              <p className="text-xs text-gray-500 mb-3">Specify if this user can access all hotel branches or specific selected branches.</p>
              
              <div className="flex flex-col sm:flex-row sm:items-center gap-4 mb-3">
                {hasAllLocationsAccess && (
                  <label className="flex items-center gap-2 cursor-pointer text-sm font-medium text-gray-800 bg-white px-4 py-2 rounded-lg border border-gray-300">
                    <input
                      type="radio"
                      name="locationAccess"
                      value="all"
                      checked={locationAccessType === 'all'}
                      onChange={() => {
                        setLocationAccessType('all');
                        setSelectedLocationId('');
                        setSelectedLocationIds([]);
                      }}
                      className="text-[#1D4ED8] focus:ring-[#1D4ED8]"
                    />
                    <span>All Locations (Full Branch Access)</span>
                  </label>
                )}

                <label className="flex items-center gap-2 cursor-pointer text-sm font-medium text-gray-800 bg-white px-4 py-2 rounded-lg border border-gray-300">
                  <input
                    type="radio"
                    name="locationAccess"
                    value="specific"
                    checked={locationAccessType === 'specific'}
                    onChange={() => setLocationAccessType('specific')}
                    className="text-[#1D4ED8] focus:ring-[#1D4ED8]"
                  />
                  <span>Specific Locations (Multi-Select Checkboxes)</span>
                </label>
              </div>

              {locationAccessType === 'specific' && (
                <div className="mt-3 p-3 bg-white rounded-lg border border-gray-200">
                  <span className="block text-xs font-semibold text-gray-700 mb-2 uppercase tracking-wider">
                    Select Branch Access Checkboxes <span className="text-red-500">*</span>
                  </span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5">
                    {locations.map(loc => {
                      const locIdStr = String(loc.id);
                      const isChecked = selectedLocationIds.includes(locIdStr);
                      return (
                        <label
                          key={loc.id}
                          className={`flex items-center gap-2.5 p-2.5 rounded-lg border text-xs cursor-pointer transition ${
                            isChecked
                              ? 'bg-blue-50 border-blue-400 text-blue-900 font-semibold shadow-sm'
                              : 'bg-gray-50 border-gray-200 text-gray-700 hover:bg-gray-100'
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={() => toggleLocationSelection(locIdStr)}
                            className="w-4 h-4 text-[#1D4ED8] rounded border-gray-300 focus:ring-[#1D4ED8]"
                          />
                          <Building2 className="w-3.5 h-3.5 text-gray-500" />
                          <span>{loc.name} {loc.city ? `(${loc.city})` : ''}</span>
                        </label>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-6">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">{isEditMode ? 'New Password' : 'Password'} {isEditMode ? '' : <span className="text-red-500">*</span>}</label>
                <input type="password" value={password} onChange={e => setPassword(e.target.value)} className="w-full px-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#1D4ED8] outline-none" placeholder={isEditMode ? "Leave blank to keep unchanged" : "Create password"} />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Confirm Password {isEditMode ? '' : <span className="text-red-500">*</span>}</label>
                <input type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} className="w-full px-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#1D4ED8] outline-none" />
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">Offer Letter / Document</label>
              <div className="flex items-center gap-3">
                <input type="file" accept=".pdf,image/*" onChange={e => setLetterFile(e.target.files?.[0] || null)} className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-[#1D4ED8] hover:file:bg-blue-100" />
              </div>
            </div>
          </div>
        </div>

        {/* Housekeeping Specific Options */}
        {isHousekeeping && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
             <div className="bg-slate-50 border-b border-gray-100 px-6 py-4 font-semibold text-[#0F172A] flex justify-between items-center">
              <span>Room Assignments</span>
              {selectedRooms.length > 0 && <span className="text-xs text-emerald-600 bg-emerald-100 px-3 py-1 rounded-full">{selectedRooms.length} Rooms Assigned</span>}
            </div>
            <div className="p-6">
              <RoomPicker 
                rooms={allRooms}
                selectedIds={selectedRooms}
                onChange={setSelectedRooms}
                loading={roomsLoading}
              />
            </div>
          </div>
        )}



        {/* Actions */}
        <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-200">
          <button type="button" onClick={() => navigate(-1)} className="px-6 py-2.5 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50">
            Cancel
          </button>
          <button type="submit" disabled={submitting} className="px-6 py-2.5 bg-[#1D4ED8] text-white rounded-lg text-sm font-medium hover:bg-[#1E40AF] disabled:opacity-50 flex items-center gap-2 shadow-sm">
            {submitting ? <RefreshCw size={18} className="animate-spin" /> : <Save size={18} />}
            {isEditMode ? 'Save Changes' : 'Create Staff'}
          </button>
        </div>
      </form>
    </div>
  );
}
