import React, { useState, useEffect } from 'react';
import { useHotel } from '../../context/HotelContext.tsx';
import { Booking, IDType, PaymentMethod, Room } from '../../types/index.ts';
import { Dialog } from '../common/Dialog.tsx';
import { Button } from '../common/Button.tsx';
import { Input } from '../common/Input.tsx';
import { Select } from '../common/Select.tsx';
import { canRoomBeAssignedForCheckIn, isRoomAvailableForDates } from '../../utils/calculations.ts';
import { formatRupee, formatDate } from '../../utils/formatters.ts';

interface CheckInModalProps {
  isOpen: boolean;
  onClose: () => void;
  booking: Booking | null;
  onSuccess: (bookingId: string) => void;
}

export const CheckInModal: React.FC<CheckInModalProps> = ({
  isOpen,
  onClose,
  booking,
  onSuccess,
}) => {
  const { rooms, roomTypes, bookings, checkInGuest } = useHotel();

  const [idType, setIdType] = useState<IDType>('Aadhaar');
  const [idNumber, setIdNumber] = useState('');
  const [idPhotoUrl, setIdPhotoUrl] = useState('');
  const [roomId, setRoomId] = useState<string>('');
  const [depositAmount, setDepositAmount] = useState<number>(0);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('upi');
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    if (booking) {
      setIdType(booking.idType || 'Aadhaar');
      setIdNumber(booking.idNumber || '');
      setIdPhotoUrl(booking.idPhotoUrl || '');
      setRoomId(booking.roomId || '');
      setDepositAmount(0);
      setErrorMessage('');
    }
  }, [booking]);

  if (!booking) return null;

  const roomType = roomTypes.find((rt) => rt.id === booking.roomTypeId);

  // Filter available rooms of matching room type
  const eligibleRooms = rooms.filter((r) => {
    if (r.roomTypeId !== booking.roomTypeId) return false;
    // Must be available for booking dates (ignore this booking's own hold)
    return isRoomAvailableForDates(r.id, booking.checkInDate, booking.checkOutDate, bookings, booking.id);
  });

  const selectedRoom = rooms.find((r) => r.id === roomId);

  const handleSimulateIdPhotoCapture = () => {
    // Generate clean simulated document thumbnail
    setIdPhotoUrl('https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=300&q=80');
  };

  const handleCheckIn = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    if (!idNumber.trim()) {
      setErrorMessage('Guest ID document number is mandatory as per Indian law.');
      return;
    }

    if (!roomId) {
      setErrorMessage('Please assign a specific room for check-in.');
      return;
    }

    // Check room status
    if (selectedRoom) {
      const check = canRoomBeAssignedForCheckIn(selectedRoom);
      if (!check.allowed) {
        setErrorMessage(check.reason || 'This room is not ready for guest arrival.');
        return;
      }
    }

    const res = checkInGuest(
      booking.id,
      { idType, idNumber, idPhotoUrl },
      roomId,
      Number(depositAmount) || 0,
      paymentMethod
    );

    if (res.success) {
      onSuccess(booking.id);
      onClose();
    } else {
      setErrorMessage(res.error || 'Check-in failed.');
    }
  };

  return (
    <Dialog
      isOpen={isOpen}
      onClose={onClose}
      title={`Check In Guest: ${booking.guestName}`}
      maxWidth="lg"
    >
      <form onSubmit={handleCheckIn} className="flex flex-col gap-4 text-left">
        {errorMessage && (
          <div className="p-3 bg-[#FEE2E2] border border-[#B42318] text-[#B42318] text-xs font-semibold rounded-[6px]">
            {errorMessage}
          </div>
        )}

        {/* Booking summary card */}
        <div className="bg-[#F4F5F2] border border-[#D8DCD5] rounded-[6px] p-3 text-xs flex flex-wrap items-center justify-between gap-2">
          <div>
            <span className="font-semibold text-[#14202B]">Ref:</span>{' '}
            <span className="font-mono font-bold text-[#0F5E63]">{booking.bookingReference}</span>
          </div>
          <div>
            <span className="font-semibold text-[#14202B]">Stay:</span>{' '}
            <span className="font-mono">{formatDate(booking.checkInDate)} to {formatDate(booking.checkOutDate)}</span>
          </div>
          <div>
            <span className="font-semibold text-[#14202B]">Category:</span> {roomType?.name}
          </div>
          <div>
            <span className="font-semibold text-[#14202B]">Advance Paid:</span>{' '}
            <span className="font-mono font-bold">{formatRupee(booking.advancePaid)}</span>
          </div>
        </div>

        {/* Mandatory ID Document Capture (Indian Hospitality Norms) */}
        <div className="border border-[#D8DCD5] rounded-[6px] p-4 bg-white">
          <div className="text-xs font-bold uppercase tracking-wider text-[#14202B] mb-2">
            1. Identity Verification (Mandatory Govt Form C/ID)
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-[#14202B] mb-1 block">ID Document Type *</label>
              <select
                value={idType}
                onChange={(e) => setIdType(e.target.value as IDType)}
                className="w-full h-9 px-3 text-sm rounded-[6px] border border-[#D8DCD5] bg-white focus:ring-2 focus:ring-[#0F5E63] outline-none"
              >
                <option value="Aadhaar">Aadhaar Card (UIDAI)</option>
                <option value="Passport">Passport</option>
                <option value="Driving License">Driving License</option>
                <option value="Voter ID">Election Voter ID</option>
              </select>
            </div>

            <Input
              label="ID Document Number *"
              placeholder={idType === 'Aadhaar' ? 'e.g. 4829 3301 9284' : 'e.g. P1234567'}
              value={idNumber}
              onChange={(e) => setIdNumber(e.target.value)}
              required
              tabular
            />
          </div>

          {/* Photo / Scan preview */}
          <div className="mt-3 pt-3 border-t border-[#E8ECE5] flex items-center justify-between">
            <div className="flex items-center gap-3">
              {idPhotoUrl ? (
                <div className="flex items-center gap-2">
                  <img
                    src={idPhotoUrl}
                    alt="ID Document Preview"
                    className="w-12 h-8 object-cover rounded-[4px] border border-[#D8DCD5]"
                  />
                  <span className="text-xs font-medium text-[#15803D]">ID photo verified & stored</span>
                </div>
              ) : (
                <span className="text-xs text-[#57636E]">No ID scan attached</span>
              )}
            </div>
            <Button
              type="button"
              size="sm"
              variant="secondary"
              onClick={handleSimulateIdPhotoCapture}
            >
              {idPhotoUrl ? 'Re-scan Document' : 'Capture / Upload ID Scan'}
            </Button>
          </div>
        </div>

        {/* Room Assignment */}
        <div className="border border-[#D8DCD5] rounded-[6px] p-4 bg-white">
          <div className="text-xs font-bold uppercase tracking-wider text-[#14202B] mb-2">
            2. Room Allocation
          </div>
          <div>
            <label className="text-xs font-semibold text-[#14202B] mb-1 block">
              Select Room (Must be Clean or Inspected)
            </label>
            <select
              value={roomId}
              onChange={(e) => setRoomId(e.target.value)}
              className="w-full h-9 px-3 text-sm rounded-[6px] border border-[#D8DCD5] bg-white focus:ring-2 focus:ring-[#0F5E63] outline-none font-mono"
              required
            >
              <option value="">Select clean room...</option>
              {eligibleRooms.map((r) => (
                <option key={r.id} value={r.id}>
                  Room {r.roomNumber} (Floor {r.floor} • Status: {r.status.toUpperCase()})
                </option>
              ))}
            </select>
          </div>

          {selectedRoom && (
            <div className="mt-2 text-xs flex items-center gap-2">
              <span className="text-[#57636E]">Selected Room Status:</span>
              <span
                className={`font-bold uppercase ${
                  selectedRoom.status === 'clean' || selectedRoom.status === 'inspected'
                    ? 'text-[#15803D]'
                    : 'text-[#B42318]'
                }`}
              >
                {selectedRoom.status}
              </span>
              {(selectedRoom.status === 'dirty' ||
                selectedRoom.status === 'in_progress' ||
                selectedRoom.status === 'out_of_service') && (
                <span className="text-[#B42318] text-[11px]">
                  (Cannot assign. Please choose a Clean or Inspected room)
                </span>
              )}
            </div>
          )}
        </div>

        {/* Security Deposit Collection */}
        <div className="border border-[#D8DCD5] rounded-[6px] p-4 bg-white">
          <div className="text-xs font-bold uppercase tracking-wider text-[#14202B] mb-2">
            3. Incidental Deposit (Optional)
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Input
              label="Deposit Amount (₹)"
              type="number"
              placeholder="0"
              value={depositAmount}
              onChange={(e) => setDepositAmount(Number(e.target.value))}
              tabular
            />
            <div>
              <label className="text-xs font-semibold text-[#14202B] mb-1 block">Payment Method</label>
              <select
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value as PaymentMethod)}
                className="w-full h-9 px-3 text-sm rounded-[6px] border border-[#D8DCD5] bg-white focus:ring-2 focus:ring-[#0F5E63] outline-none"
              >
                <option value="upi">UPI (GPay / PhonePe / Paytm)</option>
                <option value="card">Credit / Debit Card</option>
                <option value="cash">Cash</option>
                <option value="bank_transfer">Bank Transfer / NEFT</option>
              </select>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#D8DCD5]">
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" variant="primary">
            Complete Check-In & Open Folio
          </Button>
        </div>
      </form>
    </Dialog>
  );
};
