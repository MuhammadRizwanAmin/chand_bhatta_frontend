import { Calendar, User, BedDouble, Clock } from 'lucide-react';

interface Booking {
  id: string;
  guestName: string;
  roomNumber: string;
  checkIn: string;
  checkOut: string;
  status: 'confirmed' | 'checked-in' | 'checked-out' | 'cancelled';
}

const mockBookings: Booking[] = [
  {
    id: '1',
    guestName: 'Rajesh Kumar',
    roomNumber: '101',
    checkIn: '2026-05-16',
    checkOut: '2026-05-18',
    status: 'checked-in',
  },
  {
    id: '2',
    guestName: 'Priya Sharma',
    roomNumber: '205',
    checkIn: '2026-05-17',
    checkOut: '2026-05-20',
    status: 'confirmed',
  },
  {
    id: '3',
    guestName: 'Amit Patel',
    roomNumber: '302',
    checkIn: '2026-05-15',
    checkOut: '2026-05-16',
    status: 'checked-out',
  },
  {
    id: '4',
    guestName: 'Sneha Verma',
    roomNumber: '108',
    checkIn: '2026-05-16',
    checkOut: '2026-05-19',
    status: 'checked-in',
  },
  {
    id: '5',
    guestName: 'Vikram Singh',
    roomNumber: '401',
    checkIn: '2026-05-18',
    checkOut: '2026-05-22',
    status: 'confirmed',
  },
];

const statusColors = {
  confirmed: 'bg-[#3B82F6] text-white',
  'checked-in': 'bg-[#10B981] text-white',
  'checked-out': 'bg-[#64748B] text-white',
  cancelled: 'bg-[#EF4444] text-white',
};

export function RecentBookings() {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-[#E2E8F0]">
      <div className="p-6 border-b border-[#E2E8F0]">
        <h3 className="text-[#0F172A] text-lg font-semibold">Recent Bookings</h3>
        <p className="text-[#64748B] text-sm mt-1">Latest reservation activities</p>
      </div>
      <div className="p-6">
        <div className="space-y-4">
          {mockBookings.map((booking) => (
            <div
              key={booking.id}
              className="flex items-center justify-between p-4 rounded-lg border border-[#E2E8F0] hover:border-[#1D4ED8] hover:shadow-sm transition-all"
            >
              <div className="flex items-center gap-4 flex-1">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#1D4ED8] to-[#D4A017] flex items-center justify-center">
                  <User size={20} className="text-white" />
                </div>
                <div className="flex-1">
                  <h4 className="text-[#0F172A] font-semibold">{booking.guestName}</h4>
                  <div className="flex items-center gap-4 mt-1 text-sm text-[#64748B]">
                    <div className="flex items-center gap-1">
                      <BedDouble size={14} />
                      <span>Room {booking.roomNumber}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Calendar size={14} />
                      <span>{booking.checkIn}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Clock size={14} />
                      <span>{booking.checkOut}</span>
                    </div>
                  </div>
                </div>
              </div>
              <span
                className={`px-3 py-1.5 rounded-full text-xs font-medium ${
                  statusColors[booking.status]
                }`}
              >
                {booking.status.charAt(0).toUpperCase() + booking.status.slice(1)}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
