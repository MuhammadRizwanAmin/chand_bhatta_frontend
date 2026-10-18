import { useState } from 'react';
import { Plus, Edit, Trash2, Package, Clock, Tag, ToggleRight, ToggleLeft } from 'lucide-react';
import { getCurrency } from '../../utils/currency';

interface ServicePackage {
  id: string;
  name: string;
  description: string;
  duration: number;
  price: string;
  discount: string;
  items: string[];
  category: string;
  active: boolean;
}

const packages: ServicePackage[] = [
  { id: 'PKG001', name: 'Honeymoon Bliss', description: 'Romantic getaway with premium amenities', duration: 3, price: '45,000', discount: '10%', items: ['Deluxe Room', 'Breakfast x2', 'Candlelight Dinner', 'Spa Session', 'Flower Decoration'], category: 'Romance', active: true },
  { id: 'PKG002', name: 'Business Traveler', description: 'All essentials for corporate guests', duration: 1, price: '8,500', discount: '5%', items: ['Standard Room', 'Breakfast', 'Airport Transfer', 'High-speed WiFi', 'Late Checkout'], category: 'Corporate', active: true },
  { id: 'PKG003', name: 'Family Fun Package', description: 'Perfect for families with children', duration: 2, price: '22,000', discount: '15%', items: ['2 Connecting Rooms', 'Breakfast x4', 'Kids Activity Kit', 'Pool Access', 'Dinner Buffet'], category: 'Family', active: true },
  { id: 'PKG004', name: 'Weekend Escape', description: 'Quick 2-day relaxation package', duration: 2, price: '14,000', discount: '8%', items: ['Deluxe Room', 'Breakfast x2', `Spa Credit 1000`], category: 'Leisure', active: false },
];

const categoryColors: Record<string, string> = {
  Romance: 'bg-pink-100 text-pink-700',
  Corporate: 'bg-blue-100 text-blue-700',
  Family: 'bg-green-100 text-green-700',
  Leisure: 'bg-purple-100 text-purple-700',
};

export function SettingsPackages() {
  const [showForm, setShowForm] = useState(false);
  const [activePackages, setActivePackages] = useState<string[]>(packages.filter(p => p.active).map(p => p.id));

  const togglePackage = (id: string) => {
    setActivePackages(prev => prev.includes(id) ? prev.filter(p => p !== id) : [...prev, id]);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-[#0F172A]">Service Packages</h1>
          <p className="text-gray-600 mt-1">Create and manage hotel service bundles</p>
        </div>
        <button onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-2 bg-[#1D4ED8] text-white px-5 py-2.5 rounded-lg hover:bg-[#1E40AF] transition-colors">
          <Plus size={18} />New Package
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl p-4 shadow-sm border-l-4 border-[#1D4ED8]">
          <div className="text-gray-500 text-sm">Total Packages</div>
          <div className="text-2xl font-bold text-[#1D4ED8] mt-1">{packages.length}</div>
        </div>
        <div className="bg-white rounded-xl p-4 shadow-sm border-l-4 border-green-500">
          <div className="text-gray-500 text-sm">Active</div>
          <div className="text-2xl font-bold text-green-600 mt-1">{activePackages.length}</div>
        </div>
        <div className="bg-white rounded-xl p-4 shadow-sm border-l-4 border-gray-400">
          <div className="text-gray-500 text-sm">Inactive</div>
          <div className="text-2xl font-bold text-gray-600 mt-1">{packages.length - activePackages.length}</div>
        </div>
        <div className="bg-white rounded-xl p-4 shadow-sm border-l-4 border-[#D4A017]">
          <div className="text-gray-500 text-sm">Categories</div>
          <div className="text-2xl font-bold text-[#D4A017] mt-1">{new Set(packages.map(p => p.category)).size}</div>
        </div>
      </div>

      {/* Add Form */}
      {showForm && (
        <div className="bg-white rounded-xl shadow-sm p-6 border border-[#1D4ED8]/30">
          <h2 className="text-lg font-semibold text-[#0F172A] mb-4">Create New Package</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Package Name</label>
              <input type="text" placeholder="e.g. Honeymoon Suite" className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1D4ED8]" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
              <select className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1D4ED8]">
                <option>Romance</option><option>Corporate</option><option>Family</option><option>Leisure</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Duration (nights)</label>
              <input type="number" placeholder="2" min="1" className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1D4ED8]" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Price ({getCurrency()})</label>
              <input type="number" placeholder="15000" className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1D4ED8]" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Discount (%)</label>
              <input type="number" placeholder="10" min="0" max="100" className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1D4ED8]" />
            </div>
            <div className="md:col-span-3">
              <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
              <input type="text" placeholder="Short description..." className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1D4ED8]" />
            </div>
          </div>
          <div className="flex gap-3 mt-4">
            <button className="bg-[#1D4ED8] text-white px-6 py-2 rounded-lg hover:bg-[#1E40AF] transition-colors">Save Package</button>
            <button onClick={() => setShowForm(false)} className="border border-gray-300 px-6 py-2 rounded-lg hover:bg-gray-50 transition-colors">Cancel</button>
          </div>
        </div>
      )}

      {/* Package Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {packages.map((pkg) => {
          const isActive = activePackages.includes(pkg.id);
          return (
            <div key={pkg.id} className={`bg-white rounded-xl shadow-sm overflow-hidden transition-opacity ${isActive ? '' : 'opacity-70'}`}>
              <div className="p-5">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-11 h-11 bg-[#1D4ED8]/10 rounded-xl flex items-center justify-center">
                      <Package size={20} className="text-[#1D4ED8]" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900">{pkg.name}</h3>
                      <p className="text-xs text-gray-500">{pkg.description}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <button className="p-1.5 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors"><Edit size={14} /></button>
                    <button className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"><Trash2 size={14} /></button>
                  </div>
                </div>

                <div className="flex items-center gap-3 mt-4">
                  <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${categoryColors[pkg.category]}`}>{pkg.category}</span>
                  <span className="flex items-center gap-1 text-xs text-gray-600"><Clock size={12} />{pkg.duration} night(s)</span>
                  <span className="flex items-center gap-1 text-xs text-green-700 font-medium"><Tag size={12} />{pkg.discount} off</span>
                </div>

                <div className="mt-4 flex flex-wrap gap-1.5">
                  {pkg.items.map((item) => (
                    <span key={item} className="bg-gray-100 text-gray-700 text-xs px-2.5 py-1 rounded-full">{item}</span>
                  ))}
                </div>

                <div className="mt-4 pt-4 border-t border-gray-100 flex items-center justify-between">
                  <div className="text-2xl font-bold text-[#0F172A]">{getCurrency()} {pkg.price}</div>
                  <button onClick={() => togglePackage(pkg.id)} className="flex items-center gap-1.5 text-sm font-medium transition-colors">
                    {isActive ? (
                      <><ToggleRight size={28} className="text-[#1D4ED8]" /><span className="text-green-700">Active</span></>
                    ) : (
                      <><ToggleLeft size={28} className="text-gray-400" /><span className="text-gray-500">Inactive</span></>
                    )}
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
