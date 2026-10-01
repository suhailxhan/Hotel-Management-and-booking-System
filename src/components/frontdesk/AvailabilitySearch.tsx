import React, { useState } from 'react';
import { useHotel } from '../../context/HotelContext.tsx';
import { RoomType } from '../../types/index.ts';
import { calculateBookingTotal, isRoomAvailableForDates } from '../../utils/calculations.ts';
import { formatRupee, toISODateString, calculateNights } from '../../utils/formatters.ts';
import { Button } from '../common/Button.tsx';

interface AvailabilitySearchProps {
  onBookRoomType: (roomTypeId: string, checkIn: string, checkOut: string, adults: number, children: number) => void;
}

export const AvailabilitySearch: React.FC<AvailabilitySearchProps> = ({ onBookRoomType }) => {
  const { roomTypes, rooms, bookings, settings } = useHotel();

  const [checkInDate, setCheckInDate] = useState<string>('2026-10-01');
  const [checkOutDate, setCheckOutDate] = useState<string>('2026-10-03');
  const [adults, setAdults] = useState<number>(2);
  const [children, setChildren] = useState<number>(0);

  const nights = calculateNights(checkInDate, checkOutDate);

  // Compute availability for each room type
  const roomTypeAvailability = roomTypes.map((rt) => {
    // Rooms of this type
    const roomsOfType = rooms.filter((r) => r.roomTypeId === rt.id);
    const availableRooms = roomsOfType.filter((room) => {
      // Check if out of service during these dates
      if (
        room.status === 'out_of_service' &&
        room.outOfServiceStartDate &&
        room.outOfServiceEndDate &&
        checkInDate <= room.outOfServiceEndDate &&
        checkOutDate >= room.outOfServiceStartDate
      ) {
        return false;
      }
      return isRoomAvailableForDates(room.id, checkInDate, checkOutDate, bookings);
    });

    const pricing = calculateBookingTotal(rt.baseRate, nights, settings.gstSlabs);

    return {
      roomType: rt,
      totalRooms: roomsOfType.length,
      availableCount: availableRooms.length,
      pricing,
    };
  });

  return (
    <div className="flex flex-col gap-6 text-left w-full">
      {/* Search Header Form */}
      <div className="bg-white border border-[#D8DCD5] rounded-[6px] p-5 shadow-xs">
        <h2 className="text-base font-bold text-[#14202B] mb-3">
          Check Room Availability & Tariffs
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 items-end">
          <div>
            <label className="text-xs font-semibold text-[#14202B] mb-1 block">Check-in Date</label>
            <input
              type="date"
              value={checkInDate}
              onChange={(e) => setCheckInDate(e.target.value)}
              className="w-full h-9 px-3 text-sm rounded-[6px] border border-[#D8DCD5] bg-white focus:ring-2 focus:ring-[#0F5E63] outline-none font-mono"
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-[#14202B] mb-1 block">Check-out Date</label>
            <input
              type="date"
              value={checkOutDate}
              onChange={(e) => setCheckOutDate(e.target.value)}
              className="w-full h-9 px-3 text-sm rounded-[6px] border border-[#D8DCD5] bg-white focus:ring-2 focus:ring-[#0F5E63] outline-none font-mono"
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-[#14202B] mb-1 block">Adults (12+ yrs)</label>
            <select
              value={adults}
              onChange={(e) => setAdults(Number(e.target.value))}
              className="w-full h-9 px-3 text-sm rounded-[6px] border border-[#D8DCD5] bg-white focus:ring-2 focus:ring-[#0F5E63] outline-none cursor-pointer"
            >
              {[1, 2, 3, 4, 5].map((n) => (
                <option key={n} value={n}>
                  {n} {n === 1 ? 'Adult' : 'Adults'}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-xs font-semibold text-[#14202B] mb-1 block">Children (0-11 yrs)</label>
            <select
              value={children}
              onChange={(e) => setChildren(Number(e.target.value))}
              className="w-full h-9 px-3 text-sm rounded-[6px] border border-[#D8DCD5] bg-white focus:ring-2 focus:ring-[#0F5E63] outline-none cursor-pointer"
            >
              {[0, 1, 2, 3].map((n) => (
                <option key={n} value={n}>
                  {n} {n === 1 ? 'Child' : 'Children'}
                </option>
              ))}
            </select>
          </div>

          <div className="flex flex-col justify-end">
            <div className="h-9 px-3 bg-[#F4F5F2] border border-[#D8DCD5] rounded-[6px] flex items-center justify-center text-xs font-mono font-bold text-[#14202B]">
              {nights} Night{nights > 1 ? 's' : ''} Stay
            </div>
          </div>
        </div>
      </div>

      {/* Results List */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {roomTypeAvailability.map(({ roomType, totalRooms, availableCount, pricing }) => {
          const isAvailable = availableCount > 0;

          return (
            <div
              key={roomType.id}
              className={`bg-white border rounded-[6px] p-5 flex flex-col justify-between transition-colors ${
                isAvailable ? 'border-[#D8DCD5]' : 'border-[#E8ECE5] opacity-75'
              }`}
            >
              <div>
                {/* Header row */}
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h3 className="text-base font-bold text-[#14202B]">{roomType.name}</h3>
                    <div className="text-xs text-[#57636E] mt-0.5">
                      Max {roomType.capacity} Guests • {roomType.code}
                    </div>
                  </div>
                  <div className="text-right">
                    <span
                      className={`inline-flex px-2 py-0.5 rounded-[4px] text-xs font-bold font-mono ${
                        isAvailable ? 'bg-[#15803D] text-white' : 'bg-[#B42318] text-white'
                      }`}
                    >
                      {isAvailable ? `${availableCount} Available` : 'Sold Out'}
                    </span>
                  </div>
                </div>

                <p className="text-xs text-[#57636E] mt-2 leading-relaxed">
                  {roomType.description}
                </p>

                {/* Amenities */}
                <div className="flex flex-wrap gap-1.5 mt-3">
                  {roomType.amenities.slice(0, 4).map((amenity, idx) => (
                    <span
                      key={idx}
                      className="px-2 py-0.5 bg-[#F4F5F2] text-[#14202B] text-[11px] rounded-[4px] border border-[#E8ECE5]"
                    >
                      {amenity}
                    </span>
                  ))}
                  {roomType.amenities.length > 4 && (
                    <span className="px-2 py-0.5 text-[11px] text-[#57636E]">
                      +{roomType.amenities.length - 4} more
                    </span>
                  )}
                </div>
              </div>

              {/* Price & Action */}
              <div className="mt-4 pt-3 border-t border-[#E8ECE5] flex items-end justify-between">
                <div>
                  <div className="text-xs text-[#57636E]">Base Rate:</div>
                  <div className="text-lg font-bold font-mono text-[#14202B]">
                    {formatRupee(roomType.baseRate)}
                    <span className="text-xs font-normal text-[#57636E]"> / night</span>
                  </div>
                  <div className="text-[11px] text-[#57636E] font-mono">
                    Total for {nights} nights: {formatRupee(pricing.totalAmount)} (incl. {pricing.gstRate}% GST)
                  </div>
                </div>

                <Button
                  size="sm"
                  variant="primary"
                  disabled={!isAvailable}
                  onClick={() =>
                    onBookRoomType(roomType.id, checkInDate, checkOutDate, adults, children)
                  }
                >
                  {isAvailable ? 'Book This Room' : 'Unavailable'}
                </Button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
