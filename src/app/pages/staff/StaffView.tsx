import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router';
import { ChevronLeft, Mail, Phone, MapPin, Building2, Calendar, ShieldCheck, DoorOpen, CheckCircle2, RefreshCw, FileText } from 'lucide-react';
import { toast } from 'sonner';

import { hrmService } from '../../services/hrmService';
import { staffService } from '../../services/staffService';
import { formatRoleName } from './StaffManagement';

const PLACEHOLDER_IMG = 'https://placehold.co/200';

export function StaffView() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [staff, setStaff] = useState<any>(null);
  const [payrolls, setPayrolls] = useState<any[]>([]);

  useEffect(() => {
    const fetchDetails = async () => {
      try {
        const [res, payrollRes] = await Promise.all([
          staffService.getStaffDetails(id!),
          hrmService.getPayrolls()
        ]);
        setStaff(res.user);
        
        // Filter payrolls for this user
        const userPayrolls = (payrollRes.data || []).filter((p: any) => String(p.userId) === String(id));
        // Sort by year and month (descending)
        userPayrolls.sort((a: any, b: any) => {
          if (a.year !== b.year) return Number(b.year) - Number(a.year);
          return Number(b.month) - Number(a.month);
        });
        setPayrolls(userPayrolls);
      } catch (err: any) {
        toast.error('Failed to load staff details');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    if (id) fetchDetails();
  }, [id]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-gray-500">
        <RefreshCw size={32} className="animate-spin mb-4 text-[#1D4ED8]" />
        <p>Loading staff profile...</p>
      </div>
    );
  }

  if (!staff) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-gray-500">
        <p>Staff member not found.</p>
        <button onClick={() => navigate(-1)} className="mt-4 text-[#1D4ED8] hover:underline">Go Back</button>
      </div>
    );
  }

  const privData = staff.privileges || staff.rights;
  const privileges = privData ? (Array.isArray(privData) ? privData[0] : privData) : {};
  const activePrivileges = Object.keys(privileges).filter(key => privileges[key] === true && key !== 'id' && key !== 'userId' && key !== 'createdAt' && key !== 'updatedAt');

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-20">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button 
            onClick={() => navigate(-1)}
            className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50 text-gray-600 transition-colors"
          >
            <ChevronLeft size={20} />
          </button>
          <div>
            <h1 className="text-3xl font-bold text-[#0F172A]">Staff Profile</h1>
            <p className="text-gray-500 mt-1">Viewing detailed profile and privileges</p>
          </div>
        </div>
        <button 
          onClick={() => navigate(`/staff/edit/${staff.id}`)}
          className="px-6 py-2.5 bg-[#1D4ED8] text-white rounded-lg text-sm font-medium hover:bg-[#1E40AF] transition-colors shadow-sm"
        >
          Edit Profile
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Column: Basic Info */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 flex flex-col items-center text-center">
            <div className="w-32 h-32 rounded-full border-4 border-slate-50 shadow-md overflow-hidden mb-4">
              <img src={staff.profile_image || PLACEHOLDER_IMG} alt="Profile" className="w-full h-full object-cover" />
            </div>
            <h2 className="text-xl font-bold text-[#0F172A]">{staff.fullName}</h2>
            <p className="text-sm font-semibold text-[#1D4ED8] mt-1 px-3 py-1 bg-blue-50 rounded-full inline-block">
              {formatRoleName(staff.role)}
            </p>
            
            <div className="w-full mt-6 space-y-3 text-left">
              <div className="flex items-center gap-3 text-sm text-gray-700">
                <div className="w-8 h-8 rounded-full bg-slate-50 flex items-center justify-center text-gray-500"><Mail size={14} /></div>
                <div className="flex-1 truncate">{staff.email}</div>
              </div>
              <div className="flex items-center gap-3 text-sm text-gray-700">
                <div className="w-8 h-8 rounded-full bg-slate-50 flex items-center justify-center text-gray-500"><Phone size={14} /></div>
                <div>{staff.phone || '—'}</div>
              </div>
              <div className="flex items-center gap-3 text-sm text-gray-700">
                <div className="w-8 h-8 rounded-full bg-slate-50 flex items-center justify-center text-gray-500"><ShieldCheck size={14} /></div>
                <div>CNIC: <span className="font-medium">{staff.cnic || '—'}</span></div>
              </div>
              <div className="flex items-center gap-3 text-sm text-gray-700">
                <div className="w-8 h-8 rounded-full bg-red-50 flex items-center justify-center text-red-500"><Phone size={14} /></div>
                <div><span className="text-xs text-gray-500 block">Emergency Contact</span> {staff.emergency_contact || '—'}</div>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
             <div className="bg-slate-50 border-b border-gray-100 px-5 py-3 font-semibold text-[#0F172A] text-sm">
              Employment Details
             </div>
             <div className="p-5 space-y-4">
               <div>
                 <div className="text-xs text-gray-500 mb-1">Salary</div>
                 <div className="font-semibold text-gray-900">{staff.salary ? `Rs ${Number(staff.salary).toLocaleString()}` : '—'}</div>
               </div>
               <div>
                 <div className="text-xs text-gray-500 mb-1">Payment Date / Cycle</div>
                 <div className="font-semibold text-gray-900">{staff.payout_date ? `Day ${staff.payout_date} of month` : '—'}</div>
               </div>
               <div>
                 <div className="text-xs text-gray-500 mb-1">Joined On</div>
                 <div className="font-semibold text-gray-900">{new Date(staff.createdAt).toLocaleDateString()}</div>
               </div>
               {staff.letter && (
                 <div className="pt-2">
                   <a href={staff.letter} target="_blank" rel="noreferrer" className="text-sm text-[#1D4ED8] hover:underline font-medium">
                     View Offer Letter / Document
                   </a>
                 </div>
               )}
             </div>
          </div>
        </div>

        {/* Right Column: Privileges & Rooms */}
        <div className="lg:col-span-2 space-y-6">

          {/* Payslips */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
             <div className="bg-slate-50 border-b border-gray-100 px-6 py-4 font-semibold text-[#0F172A] flex items-center gap-2">
               <FileText size={18} className="text-[#1D4ED8]" /> Recent Payslips
             </div>
             <div className="p-0">
               {payrolls.length === 0 ? (
                 <div className="p-6 text-sm text-gray-500 italic">No payslips found for this employee.</div>
               ) : (
                 <table className="w-full text-sm text-left">
                   <thead className="bg-gray-50 text-gray-500 border-b">
                     <tr>
                       <th className="px-6 py-3 font-medium">Month</th>
                       <th className="px-6 py-3 font-medium">Net Salary</th>
                       <th className="px-6 py-3 font-medium">Status</th>
                     </tr>
                   </thead>
                   <tbody>
                     {payrolls.slice(0, 5).map(payroll => {
                       const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
                       const monthLabel = monthNames[(Number(payroll.month) || 1) - 1] || payroll.month;
                       return (
                         <tr key={payroll.id} className="border-b last:border-0 hover:bg-gray-50/50">
                           <td className="px-6 py-3 font-medium text-gray-900">
                             {monthLabel} {payroll.year}
                           </td>
                           <td className="px-6 py-3 font-semibold text-gray-700">
                             Rs {Number(payroll.netPay || 0).toLocaleString()}
                           </td>
                           <td className="px-6 py-3">
                             <span className={`px-2 py-1 rounded-md text-[10px] font-bold uppercase ${
                               (payroll.status || '').toLowerCase() === 'paid' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
                             }`}>
                               {payroll.status || 'Pending'}
                             </span>
                           </td>
                         </tr>
                       );
                     })}
                   </tbody>
                 </table>
               )}
             </div>
          </div>
          
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
             <div className="bg-slate-50 border-b border-gray-100 px-6 py-4 font-semibold text-[#0F172A] flex items-center gap-2">
               <ShieldCheck size={18} className="text-[#1D4ED8]" /> Access Privileges
             </div>
             <div className="p-6">
               {activePrivileges.length === 0 ? (
                 <p className="text-sm text-gray-500 italic">No special privileges assigned to this user.</p>
               ) : (
                 <div className="flex flex-wrap gap-2">
                   {activePrivileges.map(priv => (
                     <div key={priv} className="px-3 py-1.5 bg-emerald-50 border border-emerald-100 text-emerald-700 rounded-lg text-sm font-medium flex items-center gap-2 capitalize">
                       <CheckCircle2 size={14} /> {priv}
                     </div>
                   ))}
                 </div>
               )}
             </div>
          </div>

          {staff.role === 'housekeeping' && staff.rooms && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
               <div className="bg-slate-50 border-b border-gray-100 px-6 py-4 font-semibold text-[#0F172A] flex items-center gap-2">
                 <DoorOpen size={18} className="text-[#1D4ED8]" /> Assigned Rooms
               </div>
               <div className="p-6">
                 {staff.rooms.length === 0 ? (
                   <p className="text-sm text-gray-500 italic">No rooms assigned to this staff member yet.</p>
                 ) : (
                   <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-3">
                     {staff.rooms.map((room: any) => (
                       <div key={room.id} className="bg-slate-50 border border-slate-200 rounded-xl p-3 text-center">
                         <div className="text-lg font-bold text-gray-900">{room.roomNo}</div>
                         <div className="text-[10px] font-medium text-gray-500 uppercase mt-0.5 truncate">{room.RoomType?.name || 'Room'}</div>
                       </div>
                     ))}
                   </div>
                 )}
               </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
