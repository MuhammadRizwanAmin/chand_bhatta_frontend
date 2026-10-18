import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router';
import { format, eachDayOfInterval, startOfMonth, endOfMonth, parseISO, isSameDay, startOfDay, isAfter, isBefore, startOfWeek, endOfWeek } from 'date-fns';
import { DateRangeFilter, DateRange } from '../../components/DateRangeFilter';
import { assignedRoomService } from '../../services/assignedRoomService';
import { reservationService } from '../../services/reservationService';
import { Loader2 } from 'lucide-react';

type DynamicBooking = {
  id: string;
  dbId: number;
  room: string;
  checkIn: string;
  checkOut: string;
  guest: string;
  status?: string;
};

export function ReservationChart() {
  const navigate = useNavigate();
  const [dateRange, setDateRange] = useState<DateRange>({
    startDate: '',
    endDate: ''
  });

  const [days, setDays] = useState<Date[]>([]);
  const [rooms, setRooms] = useState<any[]>([]);
  const [bookings, setBookings] = useState<DynamicBooking[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const now = new Date();
    setDateRange({
      startDate: format(startOfWeek(now, { weekStartsOn: 1 }), 'yyyy-MM-dd'),
      endDate: format(endOfWeek(now, { weekStartsOn: 1 }), 'yyyy-MM-dd')
    });
  }, []);

  useEffect(() => {
    let start = new Date();
    let end = new Date();

    if (dateRange.startDate && dateRange.endDate) {
      start = parseISO(dateRange.startDate);
      end = parseISO(dateRange.endDate);
    } else {
      const now = new Date();
      start = startOfMonth(now);
      end = endOfMonth(now);
    }

    try {
      const intervalDays = eachDayOfInterval({ start, end });
      setDays(intervalDays);
    } catch (e) {
      console.error('Invalid date interval', e);
    }
  }, [dateRange]);

  useEffect(() => {
    const fetchRooms = async () => {
      try {
        const data = await assignedRoomService.getAll();
        setRooms(data || []);
      } catch (e) {
        console.error('Failed to fetch rooms', e);
      }
    };

    fetchRooms();
  }, []);

  useEffect(() => {
    const fetchBookings = async () => {
      if (!dateRange.startDate || !dateRange.endDate) return;

      setLoading(true);

      try {
        const params = {
          limit: 1000,
          startDate: dateRange.startDate,
          endDate: dateRange.endDate,
        };

        const res = await reservationService.getAll(params);

        const mappedData: DynamicBooking[] = [];

        (res.data || []).forEach((r: any) => {
          if (r.status === 'cancelled' || r.status === 'checked_out' || r.status === 'early_checkout') return;
          
          (r.rooms || []).forEach((roomObj: any) => {
            const pivot = roomObj.ReservationRoom || roomObj.reservationRoom;
            if (pivot && pivot.status === 'cancelled') return;

            mappedData.push({
              id: r.refno || String(r.id),
              dbId: r.id,
              room: String(roomObj.roomNo),
              checkIn: pivot?.startDate || r.startDate,
              checkOut: pivot?.endDate || r.endDate,
              guest: r.customer?.name || 'Unknown',
              status: r.status
            });
          });
        });

        setBookings(mappedData);
      } catch (e) {
        console.error('Failed to fetch bookings', e);
      } finally {
        setLoading(false);
      }
    };

    fetchBookings();
  }, [dateRange]);

  const handleDateChange = (range: DateRange) => {
    setDateRange(range);
  };

  const isDayInBooking = (day: Date, checkInStr: string, checkOutStr: string) => {
    if (!checkInStr || !checkOutStr) return false;

    const targetDay = startOfDay(day);
    const checkIn = startOfDay(parseISO(checkInStr));
    const checkOut = startOfDay(parseISO(checkOutStr));

    if (isSameDay(targetDay, checkIn)) return true;
    if (isSameDay(targetDay, checkOut)) return true;
    if (isAfter(targetDay, checkIn) && isBefore(targetDay, checkOut)) return true;

    return false;
  };

  const getBookingsForRoomAndDate = (roomNo: string, date: Date) => {
    return bookings.filter(
      b => b.room === roomNo && isDayInBooking(date, b.checkIn, b.checkOut)
    );
  };

  // Build a list of {booking, startColIdx, span} for a given room row
  const getBookingBars = (roomNo: string) => {
    const roomBookings = bookings.filter(b => b.room === roomNo);
    const bars: { booking: DynamicBooking; startColIdx: number; span: number }[] = [];

    for (const b of roomBookings) {
      const checkIn  = startOfDay(parseISO(b.checkIn));
      const checkOut = startOfDay(parseISO(b.checkOut));

      // Find first visible day that overlaps this booking
      const firstIdx = days.findIndex(d => {
        const day = startOfDay(d);
        return isSameDay(day, checkIn) ||
          (isAfter(day, checkIn) && (isBefore(day, checkOut) || isSameDay(day, checkOut)));
      });
      if (firstIdx === -1) continue;

      // Count how many visible days the booking spans
      let span = 0;
      for (let i = firstIdx; i < days.length; i++) {
        const day = startOfDay(days[i]);
        if (isSameDay(day, checkIn) || isSameDay(day, checkOut) ||
          (isAfter(day, checkIn) && isBefore(day, checkOut))) {
          span++;
        } else break;
      }

      bars.push({ booking: b, startColIdx: firstIdx, span });
    }
    return bars;
  };

  const uniqueRoomTypes = useMemo(() => {
    const types = new Set(rooms.map(r => r.RoomType?.name).filter(Boolean));
    return Array.from(types);
  }, [rooms]);

  return (
    <div className="p-6 bg-slate-50 min-h-screen font-sans">
      <div className="relative z-50 flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
        <div className="flex items-center gap-4">
          <div>
            <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
              Reservation Chart
            </h1>
            <p className="text-sm text-slate-500 mt-1">
              Room-wise booking overview by selected date range
            </p>
          </div>

          {loading && <Loader2 className="w-5 h-5 text-blue-600 animate-spin" />}
        </div>

        <DateRangeFilter
          onChange={handleDateChange}
          defaultLabel="This Week"
        />
      </div>

      <div className="overflow-x-auto border border-slate-200 shadow-lg rounded-xl max-h-[80vh] bg-white">
        <table className="w-full border-collapse table-fixed bg-white relative">
          <thead className="sticky top-0 z-20">
            <tr className="bg-gradient-to-r from-blue-700 via-blue-600 to-cyan-500 shadow-sm">
              <th className="sticky left-0 z-30 bg-blue-800 min-w-[130px] w-[130px] px-4 py-4 text-left text-xs font-extrabold text-white border-b border-blue-400/40 border-r border-blue-400/40 uppercase tracking-widest">
                Room
              </th>

              {days.map((day, idx) => (
                <th
                  key={idx}
                  className="min-w-[95px] w-[95px] px-2 py-4 text-center text-xs font-extrabold text-white border-b border-blue-400/40 border-r border-blue-400/20 bg-transparent uppercase tracking-wide"
                >
                  <div className="flex flex-col items-center leading-tight">
                    <span className="text-[13px] font-black">
                      {format(day, 'dd-MM')}
                    </span>
                    <span className="text-[10px] font-bold text-blue-100 mt-1">
                      {format(day, 'yyyy')}
                    </span>
                  </div>
                </th>
              ))}
            </tr>
          </thead>

          <tbody>
            {rooms.length === 0 && !loading && (
              <tr>
                <td
                  colSpan={days.length + 1}
                  className="p-10 text-center text-slate-500 text-sm font-medium"
                >
                  No rooms assigned or available.
                </td>
              </tr>
            )}

            {uniqueRoomTypes.map(type => (
              <React.Fragment key={type}>
                <tr className="bg-blue-50">
                  <td
                    colSpan={days.length + 1}
                    className="sticky left-0 z-10 px-4 py-3 text-xs font-black text-blue-800 border-b border-blue-100 uppercase tracking-[0.16em]"
                  >
                    {type}
                  </td>
                </tr>

                {rooms.filter(r => r.RoomType?.name === type).map((room, rowIdx) => {
                  const roomStr = String(room.roomNo);
                  const bars = getBookingBars(roomStr);
                  // Build a map of colIdx -> bar for quick lookup
                  const barByStart = new Map(bars.map(b => [b.startColIdx, b]));
                  // Track which col indices are occupied (non-start) by a spanning bar
                  const occupiedCols = new Set<number>();
                  bars.forEach(b => {
                    for (let i = b.startColIdx + 1; i < b.startColIdx + b.span; i++) occupiedCols.add(i);
                  });

                  return (
                    <tr key={`${room.id}-${rowIdx}`} className="hover:bg-blue-50/40 transition-colors">
                      <td
                        className="sticky left-0 z-10 bg-white min-w-[130px] px-4 py-0 text-sm font-extrabold text-slate-800 border-b border-r border-slate-200 align-middle shadow-[4px_0_8px_rgba(15,23,42,0.04)] cursor-pointer hover:bg-slate-50 transition-colors h-[56px]"
                        onClick={() => navigate(`/rooms/occupancy?roomNo=${roomStr}`)}
                      >
                        <span className="inline-flex items-center justify-center min-w-[48px] rounded-lg bg-slate-100 px-3 py-1 text-slate-900 border border-slate-200">
                          {roomStr}
                        </span>
                      </td>

                      {days.map((_, colIdx) => {
                        if (occupiedCols.has(colIdx)) return null;
                        const bar = barByStart.get(colIdx);
                        if (bar) {
                          return (
                            <td
                              key={colIdx}
                              colSpan={bar.span}
                              className="px-0.5 py-1 border-b border-r border-slate-100 align-middle h-[56px]"
                            >
                              <div
                                className={`flex flex-col justify-center cursor-pointer transition-colors rounded-lg px-2 py-1.5 h-full shadow-sm ${
                                  bar.booking.status === 'reserved'
                                    ? 'bg-amber-500 hover:bg-amber-600'
                                    : 'bg-blue-600 hover:bg-blue-700'
                                }`}
                                onClick={() => navigate(`/booking/${bar.booking.dbId}`)}
                              >
                                <span className="text-white text-[11px] font-extrabold leading-tight truncate">{bar.booking.id}</span>
                                <span className={`text-[10px] font-medium leading-tight truncate ${bar.booking.status === 'reserved' ? 'text-amber-100' : 'text-blue-100'}`}>{bar.booking.guest}</span>
                              </div>
                            </td>
                          );
                        }
                        return (
                          <td key={colIdx} className="min-w-[95px] border-b border-r border-slate-100 h-[56px] bg-white" />
                        );
                      })}
                    </tr>
                  );
                })}
              </React.Fragment>
            ))}

            {rooms.filter(r => !r.RoomType?.name).map((room, rowIdx) => {
              const roomStr = String(room.roomNo);
              const bars = getBookingBars(roomStr);
              const barByStart = new Map(bars.map(b => [b.startColIdx, b]));
              const occupiedCols = new Set<number>();
              bars.forEach(b => {
                for (let i = b.startColIdx + 1; i < b.startColIdx + b.span; i++) occupiedCols.add(i);
              });

              return (
                <tr key={`untyped-${room.id}-${rowIdx}`} className="hover:bg-blue-50/40 transition-colors">
                  <td
                    className="sticky left-0 z-10 bg-white min-w-[130px] px-4 py-0 text-sm font-extrabold text-slate-800 border-b border-r border-slate-200 align-middle shadow-[4px_0_8px_rgba(15,23,42,0.04)] cursor-pointer hover:bg-slate-50 transition-colors h-[56px]"
                    onClick={() => navigate(`/rooms/occupancy?roomNo=${roomStr}`)}
                  >
                    <span className="inline-flex items-center justify-center min-w-[48px] rounded-lg bg-slate-100 px-3 py-1 text-slate-900 border border-slate-200">
                      {roomStr}
                    </span>
                  </td>

                  {days.map((_, colIdx) => {
                    if (occupiedCols.has(colIdx)) return null;
                    const bar = barByStart.get(colIdx);
                    if (bar) {
                      return (
                        <td
                          key={colIdx}
                          colSpan={bar.span}
                          className="px-0.5 py-1 border-b border-r border-slate-100 align-middle h-[56px]"
                        >
                          <div
                            className={`flex flex-col justify-center cursor-pointer transition-colors rounded-lg px-2 py-1.5 h-full shadow-sm ${
                              bar.booking.status === 'reserved'
                                ? 'bg-amber-500 hover:bg-amber-600'
                                : 'bg-blue-600 hover:bg-blue-700'
                            }`}
                            onClick={() => navigate(`/booking/${bar.booking.dbId}`)}
                          >
                            <span className="text-white text-[11px] font-extrabold leading-tight truncate">{bar.booking.id}</span>
                            <span className={`text-[10px] font-medium leading-tight truncate ${bar.booking.status === 'reserved' ? 'text-amber-100' : 'text-blue-100'}`}>{bar.booking.guest}</span>
                          </div>
                        </td>
                      );
                    }
                    return (
                      <td key={colIdx} className="min-w-[95px] border-b border-r border-slate-100 h-[56px] bg-white" />
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}