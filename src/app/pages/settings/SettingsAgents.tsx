import { useState } from 'react';
import { Plus, Search, Edit, Trash2, Star, Globe, Phone, Mail, TrendingUp } from 'lucide-react';
import { getCurrency } from '../../utils/currency';

interface Agent {
  id: string;
  name: string;
  type: 'ota' | 'corporate' | 'travel-agency' | 'direct';
  contact: string;
  email: string;
  phone: string;
  commission: string;
  totalBookings: number;
  totalRevenue: string;
  rating: number;
  status: 'active' | 'inactive';
}

const agents: Agent[] = [
  { id: 'AGT001', name: 'Booking.com', type: 'ota', contact: 'Partner Support', email: 'partner@booking.com', phone: '+1 800 123456', commission: '15%', totalBookings: 142, totalRevenue: '18,40,000', rating: 4.8, status: 'active' },
  { id: 'AGT002', name: 'Expedia', type: 'ota', contact: 'Account Manager', email: 'accounts@expedia.com', phone: '+1 800 654321', commission: '18%', totalBookings: 87, totalRevenue: '11,20,000', rating: 4.5, status: 'active' },
  { id: 'AGT003', name: 'TravelGuru Pvt Ltd', type: 'travel-agency', contact: 'Zara Khan', email: 'zara@travelguru.pk', phone: '+92 21 8887766', commission: '10%', totalBookings: 34, totalRevenue: '4,50,000', rating: 4.2, status: 'active' },
  { id: 'AGT004', name: 'Pakistan Airlines Corp', type: 'corporate', contact: 'HR Dept', email: 'hr@pac.pk', phone: '+92 51 9991234', commission: '8%', totalBookings: 56, totalRevenue: '7,20,000', rating: 4.0, status: 'active' },
  { id: 'AGT005', name: 'SunTravel Agency', type: 'travel-agency', contact: 'Ahmed Siddiqui', email: 'ahmed@suntravel.pk', phone: '+92 42 5554433', commission: '12%', totalBookings: 19, totalRevenue: '2,10,000', rating: 3.8, status: 'inactive' },
];

const typeColors: Record<string, string> = {
  ota: 'bg-blue-100 text-blue-700',
  corporate: 'bg-purple-100 text-purple-700',
  'travel-agency': 'bg-green-100 text-green-700',
  direct: 'bg-gray-100 text-gray-700',
};

const typeLabels: Record<string, string> = {
  ota: 'OTA',
  corporate: 'Corporate',
  'travel-agency': 'Travel Agency',
  direct: 'Direct',
};

export function SettingsAgents() {
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [showForm, setShowForm] = useState(false);

  const filtered = agents.filter((a) => {
    const matchSearch = a.name.toLowerCase().includes(search.toLowerCase()) || a.id.toLowerCase().includes(search.toLowerCase());
    const matchType = typeFilter === 'all' || a.type === typeFilter;
    return matchSearch && matchType;
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-[#0F172A]">Agents & Channels</h1>
          <p className="text-gray-600 mt-1">Manage booking agents, OTAs, and corporate accounts</p>
        </div>
        <button onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-2 bg-[#1D4ED8] text-white px-5 py-2.5 rounded-lg hover:bg-[#1E40AF] transition-colors">
          <Plus size={18} />Add Agent
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl p-4 shadow-sm border-l-4 border-[#1D4ED8]">
          <div className="text-gray-500 text-sm">Total Agents</div>
          <div className="text-2xl font-bold text-[#1D4ED8] mt-1">{agents.length}</div>
        </div>
        <div className="bg-white rounded-xl p-4 shadow-sm border-l-4 border-green-500">
          <div className="text-gray-500 text-sm">Active</div>
          <div className="text-2xl font-bold text-green-600 mt-1">{agents.filter(a => a.status === 'active').length}</div>
        </div>
        <div className="bg-white rounded-xl p-4 shadow-sm border-l-4 border-[#D4A017]">
          <div className="text-gray-500 text-sm">Total Bookings</div>
          <div className="text-2xl font-bold text-[#D4A017] mt-1">{agents.reduce((s, a) => s + a.totalBookings, 0)}</div>
        </div>
        <div className="bg-gradient-to-br from-[#1D4ED8] to-[#3B82F6] rounded-xl p-4 text-white">
          <div className="text-white/80 text-sm flex items-center gap-1"><TrendingUp size={13} />Agent Revenue</div>
          <div className="text-xl font-bold mt-1">{getCurrency()} 43,40,000</div>
        </div>
      </div>

      {/* Add Form */}
      {showForm && (
        <div className="bg-white rounded-xl shadow-sm p-6 border border-[#1D4ED8]/30">
          <h2 className="text-lg font-semibold text-[#0F172A] mb-4">Add New Agent</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[
              { label: 'Agent / Company Name', placeholder: 'e.g. Booking.com' },
              { label: 'Contact Person', placeholder: 'Full name' },
              { label: 'Email', placeholder: 'partner@example.com' },
              { label: 'Phone', placeholder: '+92 ...' },
              { label: 'Commission (%)', placeholder: '10' },
            ].map((f) => (
              <div key={f.label}>
                <label className="block text-sm font-medium text-gray-700 mb-1">{f.label}</label>
                <input type="text" placeholder={f.placeholder} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1D4ED8]" />
              </div>
            ))}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
              <select className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1D4ED8]">
                <option value="ota">OTA</option>
                <option value="corporate">Corporate</option>
                <option value="travel-agency">Travel Agency</option>
                <option value="direct">Direct</option>
              </select>
            </div>
          </div>
          <div className="flex gap-3 mt-4">
            <button className="bg-[#1D4ED8] text-white px-6 py-2 rounded-lg hover:bg-[#1E40AF] transition-colors">Save Agent</button>
            <button onClick={() => setShowForm(false)} className="border border-gray-300 px-6 py-2 rounded-lg hover:bg-gray-50 transition-colors">Cancel</button>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-sm p-4">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input type="text" placeholder="Search agent..." value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1D4ED8]" />
          </div>
          <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1D4ED8]">
            <option value="all">All Types</option>
            <option value="ota">OTA</option>
            <option value="corporate">Corporate</option>
            <option value="travel-agency">Travel Agency</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-[#0F172A] text-white">
              <tr>
                <th className="px-6 py-4 text-left text-sm font-semibold">Agent ID</th>
                <th className="px-6 py-4 text-left text-sm font-semibold">Agent / Company</th>
                <th className="px-6 py-4 text-left text-sm font-semibold">Type</th>
                <th className="px-6 py-4 text-left text-sm font-semibold">Contact</th>
                <th className="px-6 py-4 text-left text-sm font-semibold">Commission</th>
                <th className="px-6 py-4 text-left text-sm font-semibold">Bookings</th>
                <th className="px-6 py-4 text-left text-sm font-semibold">Revenue</th>
                <th className="px-6 py-4 text-left text-sm font-semibold">Rating</th>
                <th className="px-6 py-4 text-left text-sm font-semibold">Status</th>
                <th className="px-6 py-4 text-left text-sm font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filtered.map((agent) => (
                <tr key={agent.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 text-sm font-medium text-[#1D4ED8]">{agent.id}</td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 bg-[#1D4ED8]/10 rounded-lg flex items-center justify-center">
                        <Globe size={16} className="text-[#1D4ED8]" />
                      </div>
                      <span className="text-sm font-medium text-gray-900">{agent.name}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${typeColors[agent.type]}`}>{typeLabels[agent.type]}</span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-gray-900">{agent.contact}</div>
                    <div className="flex items-center gap-2 text-xs text-gray-500 mt-0.5">
                      <Mail size={10} />{agent.email}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm font-semibold text-orange-700">{agent.commission}</td>
                  <td className="px-6 py-4 text-sm font-medium text-gray-900">{agent.totalBookings}</td>
                  <td className="px-6 py-4 text-sm font-medium text-green-700">{getCurrency()} {agent.totalRevenue}</td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-1">
                      <Star size={14} fill="#D4A017" className="text-[#D4A017]" />
                      <span className="text-sm font-medium text-gray-900">{agent.rating}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${agent.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}>
                      {agent.status}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex gap-1">
                      <button className="p-2 text-gray-500 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors"><Edit size={15} /></button>
                      <button className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"><Trash2 size={15} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
