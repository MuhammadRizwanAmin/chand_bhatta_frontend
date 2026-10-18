import React, { useEffect, useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/app/components/ui/card';
import { hrmService } from '@/app/services/hrmService';
import { staffService } from '@/app/services/staffService';
import { Users, UserCheck, Clock, FileText, Calendar, DollarSign, AlertCircle } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend, ResponsiveContainer, LineChart, Line } from 'recharts';

export function HRMDashboard() {
  const [loading, setLoading] = useState(true);
  const [staff, setStaff] = useState([]);
  const [attendances, setAttendances] = useState([]);
  const [leaves, setLeaves] = useState([]);
  const [payrolls, setPayrolls] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [staffRes, attRes, leavesRes, payrollRes] = await Promise.all([
          staffService.getStaffList(),
          hrmService.getAttendances(),
          hrmService.getLeaves(),
          hrmService.getPayrolls(),
        ]);
        
        setStaff(staffRes?.users || staffRes || []);
        setAttendances(attRes?.data || []);
        setLeaves(leavesRes?.data || []);
        setPayrolls(payrollRes?.data || []);
      } catch (err) {
        console.error('Failed to load dashboard data', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const today = new Date();
  const todayStr = today.toLocaleDateString('en-CA'); // 'YYYY-MM-DD' equivalent for local timezone

  const formatShortDate = (dString: any) => {
    if (!dString) return '';
    const d = new Date(dString);
    return d.toLocaleDateString('en-US', { month: 'short', day: '2-digit' });
  };

  // Stats
  const totalStaff = staff.length;
  
  const presentToday = attendances.filter((a: any) => 
    a.date === todayStr && (a.status === 'Present' || a.status === 'On Time' || a.status === 'Late')
  ).length;

  const onLeaveToday = leaves.filter((l: any) => {
    if (l.status !== 'Approved') return false;
    const t = new Date(todayStr).getTime();
    const s = new Date(l.startDate).getTime();
    const e = new Date(l.endDate).getTime();
    return t >= s && t <= e;
  }).length;

  const pendingLeaves = leaves.filter((l: any) => l.status === 'Pending').length;

  // Chart Data: Attendance over last 7 days
  const attendanceChartData = useMemo(() => {
    const data = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateStr = d.toLocaleDateString('en-CA');
      
      const dayAttendances = attendances.filter((a: any) => a.date === dateStr);
      const present = dayAttendances.filter((a: any) => ['Present', 'On Time', 'Late'].includes(a.status)).length;
      const absent = dayAttendances.filter((a: any) => a.status === 'Absent').length;
      data.push({
        date: formatShortDate(dateStr),
        Present: present,
        Absent: absent
      });
    }
    return data;
  }, [attendances]);

  // Chart Data: Payroll over time
  const payrollChartData = useMemo(() => {
    const monthMap: Record<string, number> = {};
    payrolls.forEach((p: any) => {
      const key = `${p.month}-${p.year}`;
      if (!monthMap[key]) monthMap[key] = 0;
      monthMap[key] += Number(p.netPay || 0);
    });

    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    
    const data = Object.keys(monthMap).map(key => {
      const [m, y] = key.split('-');
      const monthStr = monthNames[Number(m) - 1] || m;
      return {
        month: `${monthStr} ${y}`,
        amount: monthMap[key],
        rawDate: new Date(Number(y), Number(m) - 1)
      };
    });
    
    // Sort chronologically and take last 6
    return data.sort((a, b) => a.rawDate.getTime() - b.rawDate.getTime()).slice(-6);
  }, [payrolls]);

  // Today's Attendances
  const todaysAttendances = attendances
    .filter((a: any) => a.date === todayStr)
    .sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 5);

  // Pending Leaves List
  const pendingLeavesList = leaves
    .filter((l: any) => l.status === 'Pending')
    .sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 5);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[50vh]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto min-h-screen">
      <div className="flex justify-between items-center mb-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 tracking-tight">HRM Dashboard</h1>
          <p className="text-gray-500 mt-1">Overview of your workforce metrics and activities</p>
        </div>
      </div>
      
      {/* Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="shadow-sm border-0 border-l-4 border-l-blue-500 bg-white hover:shadow-md transition-shadow">
          <CardContent className="p-6">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm font-medium text-gray-500 mb-1">Total Staff</p>
                <h3 className="text-3xl font-bold text-gray-900">{totalStaff}</h3>
              </div>
              <div className="p-3 bg-blue-50 rounded-xl">
                <Users className="w-5 h-5 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="shadow-sm border-0 border-l-4 border-l-emerald-500 bg-white hover:shadow-md transition-shadow">
          <CardContent className="p-6">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm font-medium text-gray-500 mb-1">Present Today</p>
                <h3 className="text-3xl font-bold text-gray-900">{presentToday}</h3>
              </div>
              <div className="p-3 bg-emerald-50 rounded-xl">
                <UserCheck className="w-5 h-5 text-emerald-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="shadow-sm border-0 border-l-4 border-l-amber-500 bg-white hover:shadow-md transition-shadow">
          <CardContent className="p-6">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm font-medium text-gray-500 mb-1">On Leave Today</p>
                <h3 className="text-3xl font-bold text-gray-900">{onLeaveToday}</h3>
              </div>
              <div className="p-3 bg-amber-50 rounded-xl">
                <Calendar className="w-5 h-5 text-amber-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="shadow-sm border-0 border-l-4 border-l-rose-500 bg-white hover:shadow-md transition-shadow">
          <CardContent className="p-6">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm font-medium text-gray-500 mb-1">Pending Leaves</p>
                <h3 className="text-3xl font-bold text-gray-900">{pendingLeaves}</h3>
              </div>
              <div className="p-3 bg-rose-50 rounded-xl">
                <AlertCircle className="w-5 h-5 text-rose-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-8">
        {/* Attendance Trend Chart */}
        <Card className="shadow-sm border border-gray-100 bg-white">
          <CardHeader className="border-b border-gray-100 pb-4 bg-gray-50/50">
            <CardTitle className="text-lg font-semibold text-gray-800 flex items-center gap-2">
              <Clock className="w-5 h-5 text-gray-500" /> Attendance Trends (Last 7 Days)
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6 h-[300px]">
            {attendanceChartData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={attendanceChartData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                  <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{fill: '#6b7280', fontSize: 12}} dy={10} />
                  <YAxis axisLine={false} tickLine={false} tick={{fill: '#6b7280', fontSize: 12}} dx={-10} allowDecimals={false} />
                  <RechartsTooltip 
                    contentStyle={{borderRadius: '8px', border: '1px solid #e5e7eb', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}}
                    cursor={{stroke: '#e5e7eb', strokeWidth: 2}}
                  />
                  <Legend iconType="circle" wrapperStyle={{paddingTop: '20px'}} />
                  <Line type="monotone" dataKey="Present" stroke="#10b981" strokeWidth={3} dot={{r: 4, strokeWidth: 2}} activeDot={{r: 6}} />
                  <Line type="monotone" dataKey="Absent" stroke="#f43f5e" strokeWidth={3} dot={{r: 4, strokeWidth: 2}} activeDot={{r: 6}} />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-full text-gray-400">No attendance data available</div>
            )}
          </CardContent>
        </Card>

        {/* Payroll Expense Chart */}
        <Card className="shadow-sm border border-gray-100 bg-white">
          <CardHeader className="border-b border-gray-100 pb-4 bg-gray-50/50">
            <CardTitle className="text-lg font-semibold text-gray-800 flex items-center gap-2">
              <DollarSign className="w-5 h-5 text-gray-500" /> Payroll Expenses
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6 h-[300px]">
             {payrollChartData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={payrollChartData}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                    <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{fill: '#6b7280', fontSize: 12}} dy={10} />
                    <YAxis 
                      axisLine={false} 
                      tickLine={false} 
                      tick={{fill: '#6b7280', fontSize: 12}} 
                      dx={-10}
                      tickFormatter={(value) => `PKR ${(value / 1000)}k`}
                    />
                    <RechartsTooltip 
                      formatter={(value: number) => [`PKR ${value.toLocaleString()}`, 'Amount']}
                      contentStyle={{borderRadius: '8px', border: '1px solid #e5e7eb', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}}
                      cursor={{fill: '#f3f4f6'}}
                    />
                    <Bar dataKey="amount" fill="#3b82f6" radius={[4, 4, 0, 0]} barSize={40} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-full text-gray-400">No payroll data available</div>
              )}
          </CardContent>
        </Card>
      </div>

      {/* Lists Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-8">
        {/* Today's Attendance List */}
        <Card className="shadow-sm border border-gray-100 bg-white">
          <CardHeader className="border-b border-gray-100 pb-4 bg-gray-50/50">
            <CardTitle className="text-lg font-semibold text-gray-800 flex items-center gap-2">
              <UserCheck className="w-5 h-5 text-gray-500" /> Today's Check-ins
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {todaysAttendances.length > 0 ? (
              <div className="divide-y divide-gray-100">
                {todaysAttendances.map((att: any) => (
                  <div key={att.id} className="p-4 flex items-center justify-between hover:bg-gray-50 transition-colors">
                    <div className="flex items-center gap-3">
                       <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold text-sm">
                         {att.user?.fullName?.charAt(0).toUpperCase() || 'U'}
                       </div>
                       <div>
                         <p className="text-sm font-medium text-gray-900">{att.user?.fullName}</p>
                         <p className="text-xs text-gray-500">Check In: {att.checkIn || 'N/A'}</p>
                       </div>
                    </div>
                    <div>
                      <span className={`px-2.5 py-1 text-xs font-medium rounded-full ${
                        att.status === 'Present' || att.status === 'On Time' ? 'bg-emerald-100 text-emerald-700' :
                        att.status === 'Late' ? 'bg-amber-100 text-amber-700' : 'bg-rose-100 text-rose-700'
                      }`}>
                        {att.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-8 text-center text-gray-500 flex flex-col items-center">
                <Clock className="w-8 h-8 text-gray-300 mb-2" />
                <p>No check-ins today</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Pending Leaves */}
        <Card className="shadow-sm border border-gray-100 bg-white">
          <CardHeader className="border-b border-gray-100 pb-4 bg-gray-50/50">
            <CardTitle className="text-lg font-semibold text-gray-800 flex items-center gap-2">
              <FileText className="w-5 h-5 text-gray-500" /> Pending Leaves
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
             {pendingLeavesList.length > 0 ? (
                <div className="divide-y divide-gray-100">
                  {pendingLeavesList.map((leave: any) => (
                    <div key={leave.id} className="p-4 flex items-center justify-between hover:bg-gray-50 transition-colors">
                      <div className="flex items-center gap-3">
                         <div className="w-10 h-10 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center font-bold text-sm">
                           {leave.user?.fullName?.charAt(0).toUpperCase() || 'U'}
                         </div>
                         <div>
                           <p className="text-sm font-medium text-gray-900">{leave.user?.fullName}</p>
                           <p className="text-xs text-gray-500">
                             {formatShortDate(leave.startDate)} - {formatShortDate(leave.endDate)} 
                             <span className="mx-1">•</span> {leave.type}
                           </p>
                         </div>
                      </div>
                      <div>
                        <span className="px-2.5 py-1 text-xs font-medium rounded-full bg-amber-100 text-amber-700 border border-amber-200">
                          Pending
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-8 text-center text-gray-500 flex flex-col items-center">
                  <FileText className="w-8 h-8 text-gray-300 mb-2" />
                  <p>No pending leaves</p>
                </div>
              )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
