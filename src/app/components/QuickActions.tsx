import { UserPlus, Calendar, BedDouble, DollarSign } from 'lucide-react';

const actions = [
  {
    icon: <UserPlus size={20} />,
    label: 'New Guest',
    description: 'Register new guest',
    bgColor: 'bg-[#1D4ED8]',
  },
  {
    icon: <Calendar size={20} />,
    label: 'New Booking',
    description: 'Create reservation',
    bgColor: 'bg-[#10B981]',
  },
  {
    icon: <BedDouble size={20} />,
    label: 'Check-in',
    description: 'Guest arrival',
    bgColor: 'bg-[#8B5CF6]',
  },
  {
    icon: <DollarSign size={20} />,
    label: 'Payment',
    description: 'Record payment',
    bgColor: 'bg-[#D4A017]',
  },
];

export function QuickActions() {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-[#E2E8F0] p-6">
      <h3 className="text-[#0F172A] text-lg font-semibold mb-4">Quick Actions</h3>
      <div className="grid grid-cols-2 gap-3">
        {actions.map((action, index) => (
          <button
            key={index}
            className="flex items-center gap-3 p-4 rounded-lg border border-[#E2E8F0] hover:border-[#1D4ED8] hover:shadow-md transition-all group"
          >
            <div className={`w-12 h-12 ${action.bgColor} rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform`}>
              <span className="text-white">{action.icon}</span>
            </div>
            <div className="text-left">
              <p className="text-[#0F172A] font-semibold text-sm">{action.label}</p>
              <p className="text-[#64748B] text-xs">{action.description}</p>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
