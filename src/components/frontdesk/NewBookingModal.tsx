import React, { useState, useEffect } from 'react';
import { useHotel } from '../../context/HotelContext.tsx';
import { Dialog } from '../common/Dialog.tsx';
import { Button } from '../common/Button.tsx';
import { Input } from '../common/Input.tsx';
import { Select } from '../common/Select.tsx';
import { calculateBookingTotal, isRoomAvailableForDates } from '../../utils/calculations.ts';
import { formatRupee, toISODateString, calculateNights } from '../../utils/formatters.ts';

interface NewBookingModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialRoomId?: string;
  initialDate?: string;
}

export const NewBookingModal: React.FC<NewBookingModalProps> = ({
  isOpen,
  onClose,
  initialRoomId,
  initialDate,
}) => {
  const { roomTypes, rooms, bookings, settings, createBooking, addToast } = useHotel();

  const [isWalkIn, setIsWalkIn] = useState(false);
  const [guestName, setGuestName] = useState('');
  const [guestPhone, setGuestPhone] = useState('');
  const [guestEmail, setGuestEmail] = useState('');
  const [guestCity, setGuestCity] = useState('');
  const [roomTypeId, setRoomTypeId] = useState(roomTypes[0]?.id || '');
  const [roomId, setRoomId] = useState<string>(initialRoomId || '');
  const [checkInDate, setCheckInDate] = useState<string>(initialDate || '2026-10-01');
  const [checkOutDate, setCheckOutDate] = useState<string>('2026-10-03');
  const [adults, setAdults] = useState<number>(2);
  const [children, setChildren] = useState<number>(0);
  const [advancePaid, setAdvancePaid] = useState<number>(0);
  const [specialRequests, setSpecialRequests] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  // When initialRoomId is provided, pre-select its room type
  useEffect(() => {
    if (initialRoomId) {
      const room = rooms.find((r) => r.id === initialRoomId);
      if (room) {
        setRoomId(initialRoomId);
        setRoomTypeId(room.roomTypeId);
      }
    }
    if (initialDate) {
      setCheckInDate(initialDate);
      const nextDay = new Date(initialDate);
      nextDay.setDate(nextDay.getDate() + 2);
      setCheckOutDate(toISODateString(nextDay));
    }
  }, [initialRoomId, initialDate, rooms]);

  const selectedRoomType = roomTypes.find((rt) => rt.id === roomTypeId) || roomTypes[0];
  const nights = calculateNights(checkInDate, checkOutDate);
  const pricing = calculateBookingTotal(selectedRoomType?.baseRate || 0, nights, settings.gstSlabs);

  // Available rooms for selected room type and dates
  const availableRooms = rooms.filter((r) => {
    if (r.roomTypeId !== roomTypeId) return false;
    // Check out of service block
    if (
      r.status === 'out_of_service' &&
      r.outOfServiceStartDate &&
      r.outOfServiceEndDate &&
      checkInDate <= r.outOfServiceEndDate &&
      checkOutDate >= r.outOfServiceStartDate
    ) {
      return false;
    }
    return isRoomAvailableForDates(r.id, checkInDate, checkOutDate, bookings);
  });

  const handleRoomTypeChange = (newTypeId: string) => {
    setRoomTypeId(newTypeId);
    setRoomId(''); // Reset room assignment to force valid choice or auto-assign
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    if (!guestName.trim()) {
      setErrorMessage('Guest name is required.');
      return;
    }
    if (!guestPhone.trim()) {
      setErrorMessage('Guest phone number is required.');
      return;
    }
    if (checkOutDate <= checkInDate) {
      setErrorMessage('Check-out date must be after check-in date.');
      return;
    }

    const assignedRoomId = roomId || (availableRooms[0] ? availableRooms[0].id : null);

    const result = createBooking({
      guestName,
      guestPhone,
      guestEmail: guestEmail || `${guestPhone}@guest.grandmalabarhotel.in`,
      guestCity: guestCity || 'India',
      roomTypeId,
      roomId: assignedRoomId,
      checkInDate,
      checkOutDate,
      adults,
      children,
      advancePaid: Number(advancePaid) || 0,
      specialRequests,
    });

    if (result.success) {
      onClose();
      // Reset form
      setGuestName('');
      setGuestPhone('');
      setGuestEmail('');
      setGuestCity('');
      setAdvancePaid(0);
      setSpecialRequests('');
    } else {
      setErrorMessage(result.error || 'Failed to create booking.');
    }
  };

  return (
    <Dialog
      isOpen={isOpen}
      onClose={onClose}
      title={isWalkIn ? 'Quick Walk-In Booking' : 'New Reservation'}
      maxWidth="xl"
    >
      <form onSubmit={handleSubmit} className="flex flex-col gap-4 text-left">
        {errorMessage && (
          <div className="p-3 bg-[#FEE2E2] border border-[#B42318] text-[#B42318] text-xs font-semibold rounded-[6px]">
            {errorMessage}
          </div>
        )}

        {/* Walk-in quick toggle */}
        <div className="flex items-center justify-between p-3 bg-[#F4F5F2] border border-[#D8DCD5] rounded-[6px]">
          <div>
            <div className="text-xs font-bold text-[#14202B]">Walk-In Reservation</div>
            <div className="text-[11px] text-[#57636E]">Guest is present at the front desk for immediate stay.</div>
          </div>
          <button
            type="button"
            onClick={() => {
              setIsWalkIn(!isWalkIn);
              if (!isWalkIn) {
                setCheckInDate('2026-10-01');
                const tomorrow = new Date('2026-10-01');
                tomorrow.setDate(tomorrow.getDate() + 1);
                setCheckOutDate(toISODateString(tomorrow));
              }
            }}
            className={`px-3 py-1 rounded-[6px] text-xs font-bold border transition-colors ${
              isWalkIn
                ? 'bg-[#0F5E63] text-white border-[#0F5E63]'
                : 'bg-white text-[#14202B] border-[#D8DCD5]'
            }`}
          >
            {isWalkIn ? 'Enabled' : 'Enable Walk-In'}
          </button>
        </div>

        {/* Guest Details */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Input
            label="Guest Full Name *"
            placeholder="e.g. Rajesh Nair"
            value={guestName}
            onChange={(e) => setGuestName(e.target.value)}
            required
          />
          <Input
            label="Phone Number (WhatsApp) *"
            placeholder="e.g. +91 98201 22334"
            value={guestPhone}
            onChange={(e) => setGuestPhone(e.target.value)}
            required
            tabular
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Input
            label="Email Address"
            placeholder="rajesh.nair@example.com"
            value={guestEmail}
            onChange={(e) => setGuestEmail(e.target.value)}
          />
          <Input
            label="City / Origin"
            placeholder="e.g. Mumbai, Maharashtra"
            value={guestCity}
            onChange={(e) => setGuestCity(e.target.value)}
          />
        </div>

        {/* Dates & Occupancy */}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 pt-2 border-t border-[#E8ECE5]">
          <div>
            <label className="text-xs font-semibold text-[#14202B] mb-1 block">Check-in Date *</label>
            <input
              type="date"
              value={checkInDate}
              onChange={(e) => setCheckInDate(e.target.value)}
              className="w-full h-9 px-3 text-sm rounded-[6px] border border-[#D8DCD5] bg-white focus:ring-2 focus:ring-[#0F5E63] outline-none font-mono"
              required
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-[#14202B] mb-1 block">Check-out Date *</label>
            <input
              type="date"
              value={checkOutDate}
              onChange={(e) => setCheckOutDate(e.target.value)}
              className="w-full h-9 px-3 text-sm rounded-[6px] border border-[#D8DCD5] bg-white focus:ring-2 focus:ring-[#0F5E63] outline-none font-mono"
              required
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-[#14202B] mb-1 block">Adults</label>
            <select
              value={adults}
              onChange={(e) => setAdults(Number(e.target.value))}
              className="w-full h-9 px-3 text-sm rounded-[6px] border border-[#D8DCD5] bg-white focus:ring-2 focus:ring-[#0F5E63] outline-none"
            >
              {[1, 2, 3, 4].map((n) => (
                <option key={n} value={n}>
                  {n} {n === 1 ? 'Adult' : 'Adults'}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-xs font-semibold text-[#14202B] mb-1 block">Children</label>
            <select
              value={children}
              onChange={(e) => setChildren(Number(e.target.value))}
              className="w-full h-9 px-3 text-sm rounded-[6px] border border-[#D8DCD5] bg-white focus:ring-2 focus:ring-[#0F5E63] outline-none"
            >
              {[0, 1, 2, 3].map((n) => (
                <option key={n} value={n}>
                  {n} {n === 1 ? 'Child' : 'Children'}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Room Type and Room Assignment */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-[#E8ECE5]">
          <div>
            <label className="text-xs font-semibold text-[#14202B] mb-1 block">Room Type *</label>
            <select
              value={roomTypeId}
              onChange={(e) => handleRoomTypeChange(e.target.value)}
              className="w-full h-9 px-3 text-sm rounded-[6px] border border-[#D8DCD5] bg-white focus:ring-2 focus:ring-[#0F5E63] outline-none"
            >
              {roomTypes.map((rt) => (
                <option key={rt.id} value={rt.id}>
                  {rt.name} ({formatRupee(rt.baseRate)}/night)
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-xs font-semibold text-[#14202B] mb-1 block">
              Room Assignment ({availableRooms.length} available)
            </label>
            <select
              value={roomId}
              onChange={(e) => setRoomId(e.target.value)}
              className="w-full h-9 px-3 text-sm rounded-[6px] border border-[#D8DCD5] bg-white focus:ring-2 focus:ring-[#0F5E63] outline-none font-mono"
            >
              <option value="">Auto-Assign Best Available</option>
              {availableRooms.map((r) => (
                <option key={r.id} value={r.id}>
                  Room {r.roomNumber} (Floor {r.floor} • {r.status})
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Advance Deposit & Notes */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Input
            label="Advance Deposit Collected (₹)"
            type="number"
            placeholder="0"
            value={advancePaid}
            onChange={(e) => setAdvancePaid(Number(e.target.value))}
            tabular
          />
          <Input
            label="Special Requests / Notes"
            placeholder="e.g. Late check-in, extra towels, ground floor"
            value={specialRequests}
            onChange={(e) => setSpecialRequests(e.target.value)}
          />
        </div>

        {/* Real-Time Price Calculation Card */}
        <div className="bg-[#F4F5F2] border border-[#D8DCD5] rounded-[6px] p-4 text-xs font-mono">
          <div className="font-bold text-[#14202B] mb-2 font-sans text-sm">
            Tariff Breakdown ({nights} Night{nights > 1 ? 's' : ''})
          </div>
          <div className="flex justify-between py-1 border-b border-[#E8ECE5]">
            <span className="text-[#57636E]">Base Rate:</span>
            <span>{formatRupee(selectedRoomType.baseRate)} × {nights} = {formatRupee(pricing.subtotal)}</span>
          </div>
          <div className="flex justify-between py-1 border-b border-[#E8ECE5]">
            <span className="text-[#57636E]">GST ({pricing.gstRate}% Indian Slab):</span>
            <span>{formatRupee(pricing.taxAmount)}</span>
          </div>
          <div className="flex justify-between py-1 font-bold text-sm text-[#14202B]">
            <span>Total Payable:</span>
            <span>{formatRupee(pricing.totalAmount)}</span>
          </div>
          {advancePaid > 0 && (
            <div className="flex justify-between py-1 text-[#0F5E63] font-semibold">
              <span>Advance Collected Now:</span>
              <span>- {formatRupee(advancePaid)}</span>
            </div>
          )}
        </div>

        {/* Footer actions */}
        <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#D8DCD5]">
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" variant="primary">
            Confirm Reservation
          </Button>
        </div>
      </form>
    </Dialog>
  );
};
