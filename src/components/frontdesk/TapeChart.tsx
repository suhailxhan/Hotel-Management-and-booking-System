import React, { useState } from 'react';
import { useHotel } from '../../context/HotelContext.tsx';
import { Booking, Room } from '../../types/index.ts';
import { formatDate, toISODateString } from '../../utils/formatters.ts';
import { StatusLabel } from '../common/StatusLabel.tsx';
import { Button } from '../common/Button.tsx';

interface TapeChartProps {
  onSelectBooking: (booking: Booking) => void;
  onNewBookingForRoomDate: (roomId: string, date: string) => void;
}

export const TapeChart: React.FC<TapeChartProps> = ({
  onSelectBooking,
  onNewBookingForRoomDate,
}) => {
  const { rooms, roomTypes, bookings } = useHotel();

  // Anchor date: default to 2026-09-28 (which covers current seed bookings nicely)
  const [startDateStr, setStartDateStr] = useState<string>('2026-09-28');
  const [daysCount, setDaysCount] = useState<number>(14);
  const [filterRoomTypeId, setFilterRoomTypeId] = useState<string>('all');
  const [filterFloor, setFilterFloor] = useState<string>('all');

  // Generate date array
  const dates: { dateStr: string; label: string; dayOfWeek: string; isToday: boolean }[] = [];
  const baseDate = new Date(startDateStr);
  const todayStr = toISODateString(new Date());

  for (let i = 0; i < daysCount; i++) {
    const d = new Date(baseDate);
    d.setDate(d.getDate() + i);
    const dateStr = toISODateString(d);
    const dayOfWeek = d.toLocaleDateString('en-IN', { weekday: 'short' });
    const dayOfMonth = d.getDate();
    const month = d.toLocaleDateString('en-IN', { month: 'short' });

    dates.push({
      dateStr,
      label: `${dayOfMonth} ${month}`,
      dayOfWeek,
      isToday: dateStr === todayStr || dateStr === '2026-10-01',
    });
  }

  // Filter rooms
  const filteredRooms = rooms.filter((r) => {
    if (filterRoomTypeId !== 'all' && r.roomTypeId !== filterRoomTypeId) return false;
    if (filterFloor !== 'all' && r.floor !== Number(filterFloor)) return false;
    return true;
  });

  const handleShiftDates = (days: number) => {
    const d = new Date(startDateStr);
    d.setDate(d.getDate() + days);
    setStartDateStr(toISODateString(d));
  };

  const handleJumpToToday = () => {
    setStartDateStr('2026-09-28');
  };

  return (
    <div className="flex flex-col gap-4 text-left w-full">
      {/* Controls Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-3 rounded-[6px] border border-[#D8DCD5]">
        <div className="flex items-center gap-2">
          <Button size="sm" variant="secondary" onClick={() => handleShiftDates(-7)}>
            « -7 Days
          </Button>
          <Button size="sm" variant="secondary" onClick={() => handleShiftDates(-1)}>
            ‹ Prev
          </Button>
          <Button size="sm" variant="primary" onClick={handleJumpToToday}>
            Today (01 Oct)
          </Button>
          <Button size="sm" variant="secondary" onClick={() => handleShiftDates(1)}>
            Next ›
          </Button>
          <Button size="sm" variant="secondary" onClick={() => handleShiftDates(7)}>
            +7 Days »
          </Button>
        </div>

        <div className="flex items-center gap-3">
          {/* Room Type filter */}
          <div className="flex items-center gap-1.5 text-xs">
            <span className="font-semibold text-[#57636E]">Type:</span>
            <select
              value={filterRoomTypeId}
              onChange={(e) => setFilterRoomTypeId(e.target.value)}
              className="h-8 px-2 rounded-[6px] border border-[#D8DCD5] bg-white text-xs font-medium focus:ring-1 focus:ring-[#0F5E63] outline-none"
            >
              <option value="all">All Room Types</option>
              {roomTypes.map((rt) => (
                <option key={rt.id} value={rt.id}>
                  {rt.name}
                </option>
              ))}
            </select>
          </div>

          {/* Floor filter */}
          <div className="flex items-center gap-1.5 text-xs">
            <span className="font-semibold text-[#57636E]">Floor:</span>
            <select
              value={filterFloor}
              onChange={(e) => setFilterFloor(e.target.value)}
              className="h-8 px-2 rounded-[6px] border border-[#D8DCD5] bg-white text-xs font-medium focus:ring-1 focus:ring-[#0F5E63] outline-none"
            >
              <option value="all">All Floors</option>
              <option value="1">Floor 1</option>
              <option value="2">Floor 2</option>
              <option value="3">Floor 3</option>
              <option value="4">Floor 4</option>
            </select>
          </div>

          {/* Days count */}
          <div className="flex items-center gap-1.5 text-xs">
            <span className="font-semibold text-[#57636E]">View:</span>
            <select
              value={daysCount}
              onChange={(e) => setDaysCount(Number(e.target.value))}
              className="h-8 px-2 rounded-[6px] border border-[#D8DCD5] bg-white text-xs font-medium focus:ring-1 focus:ring-[#0F5E63] outline-none"
            >
              <option value={7}>7 Days</option>
              <option value={14}>14 Days</option>
              <option value={21}>21 Days</option>
            </select>
          </div>
        </div>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap items-center gap-3 text-xs text-[#57636E] px-1">
        <span className="font-bold text-[#14202B]">Status Legend:</span>
        <div className="flex items-center gap-1">
          <span className="w-3 h-3 rounded-[3px] bg-[#166534]"></span>
          <span>Checked In</span>
        </div>
        <div className="flex items-center gap-1">
          <span className="w-3 h-3 rounded-[3px] bg-[#0F5E63]"></span>
          <span>Reserved</span>
        </div>
        <div className="flex items-center gap-1">
          <span className="w-3 h-3 rounded-[3px] bg-[#475569]"></span>
          <span>Checked Out</span>
        </div>
        <div className="flex items-center gap-1">
          <span className="w-3 h-3 rounded-[3px] bg-[#B91C1C]"></span>
          <span>Out of Service</span>
        </div>
        <span className="ml-auto text-[11px] text-[#57636E]">
          Click empty date cell to book room. Click occupied bar to view details.
        </span>
      </div>

      {/* Tape Chart Grid */}
      <div className="w-full bg-white border border-[#D8DCD5] rounded-[6px] shadow-xs overflow-x-auto">
        <table className="w-full border-collapse text-xs select-none">
          <thead>
            <tr className="bg-[#F4F5F2] border-b border-[#D8DCD5]">
              {/* Sticky room number column */}
              <th className="sticky left-0 z-20 bg-[#F4F5F2] py-2.5 px-3 text-left font-bold text-[#14202B] border-r border-[#D8DCD5] min-w-[150px]">
                Room & Status
              </th>
              {dates.map((d) => (
                <th
                  key={d.dateStr}
                  className={`py-2 px-1 text-center font-semibold border-r border-[#D8DCD5] min-w-[70px] ${
                    d.isToday ? 'bg-[#E7F3F3] text-[#0F5E63]' : 'text-[#14202B]'
                  }`}
                >
                  <div className="text-[10px] text-[#57636E] uppercase">{d.dayOfWeek}</div>
                  <div className="font-mono font-bold text-xs">{d.label}</div>
                  {d.isToday && (
                    <div className="text-[9px] font-bold text-[#0F5E63] uppercase tracking-wider">
                      Today
                    </div>
                  )}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-[#E8ECE5]">
            {filteredRooms.map((room) => {
              const rType = roomTypes.find((rt) => rt.id === room.roomTypeId);

              return (
                <tr key={room.id} className="hover:bg-[#F9FAF8] transition-colors">
                  {/* Sticky room column */}
                  <td className="sticky left-0 z-10 bg-white py-2 px-3 border-r border-[#D8DCD5] font-mono text-left">
                    <div className="flex items-center justify-between gap-1">
                      <span className="font-bold text-sm text-[#14202B]">
                        Rm {room.roomNumber}
                      </span>
                      <StatusLabel status={room.status} size="sm" />
                    </div>
                    <div className="text-[11px] text-[#57636E] truncate font-sans">
                      {rType?.name}
                    </div>
                  </td>

                  {/* Date Cells */}
                  {dates.map((d) => {
                    // Check if room is out of service on this date
                    const isOOS =
                      room.status === 'out_of_service' &&
                      room.outOfServiceStartDate &&
                      room.outOfServiceEndDate &&
                      d.dateStr >= room.outOfServiceStartDate &&
                      d.dateStr <= room.outOfServiceEndDate;

                    // Find if there is an active booking on this date for this room
                    const booking = bookings.find(
                      (b) =>
                        b.roomId === room.id &&
                        b.status !== 'cancelled' &&
                        d.dateStr >= b.checkInDate &&
                        d.dateStr < b.checkOutDate
                    );

                    const isCheckInDay = booking && booking.checkInDate === d.dateStr;
                    const isCheckOutDay = booking && booking.checkOutDate === d.dateStr;

                    if (isOOS) {
                      return (
                        <td
                          key={d.dateStr}
                          className="p-1 border-r border-[#D8DCD5] bg-[#FEE2E2] text-center"
                          title={`Out of Service: ${room.outOfServiceReason || 'Maintenance'}`}
                        >
                          <div className="w-full py-1.5 px-1 bg-[#B91C1C] text-white text-[10px] font-bold rounded-[4px] truncate">
                            Blocked
                          </div>
                        </td>
                      );
                    }

                    if (booking) {
                      // Booking color scheme
                      const bgClass =
                        booking.status === 'checked_in'
                          ? 'bg-[#166534] text-white'
                          : booking.status === 'checked_out'
                          ? 'bg-[#475569] text-white'
                          : 'bg-[#0F5E63] text-white';

                      return (
                        <td
                          key={d.dateStr}
                          onClick={() => onSelectBooking(booking)}
                          className="p-1 border-r border-[#D8DCD5] cursor-pointer"
                          title={`${booking.guestName} (${booking.bookingReference})\n${formatDate(
                            booking.checkInDate
                          )} to ${formatDate(booking.checkOutDate)}\nStatus: ${booking.status}`}
                        >
                          <div
                            className={`w-full py-1.5 px-1 rounded-[4px] text-[11px] font-semibold text-center truncate shadow-xs transition-opacity hover:opacity-90 ${bgClass}`}
                          >
                            {isCheckInDay ? `▶ ${booking.guestName}` : booking.guestName.split(' ')[0]}
                          </div>
                        </td>
                      );
                    }

                    // Empty cell
                    return (
                      <td
                        key={d.dateStr}
                        onClick={() => onNewBookingForRoomDate(room.id, d.dateStr)}
                        className={`p-1 border-r border-[#D8DCD5] text-center cursor-pointer hover:bg-[#EEF0EB] transition-colors ${
                          d.isToday ? 'bg-[#F4F9F9]' : ''
                        }`}
                        title={`Click to book Room ${room.roomNumber} on ${formatDate(d.dateStr)}`}
                      >
                        <div className="h-6 flex items-center justify-center text-[#A0A79E] text-xs hover:text-[#0F5E63]">
                          +
                        </div>
                      </td>
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
};
