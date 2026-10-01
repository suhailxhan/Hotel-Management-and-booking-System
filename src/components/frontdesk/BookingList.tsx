import React, { useState } from 'react';
import { useHotel } from '../../context/HotelContext.tsx';
import { Booking, BookingStatus } from '../../types/index.ts';
import { formatDate, formatRupee, toISODateString } from '../../utils/formatters.ts';
import { Table, Column } from '../common/Table.tsx';
import { StatusLabel } from '../common/StatusLabel.tsx';
import { Button } from '../common/Button.tsx';
import { Input } from '../common/Input.tsx';

interface BookingListProps {
  onSelectBooking: (booking: Booking) => void;
  onCheckInBooking: (booking: Booking) => void;
  onCheckOutBooking: (booking: Booking) => void;
  onOpenFolio: (booking: Booking) => void;
}

export const BookingList: React.FC<BookingListProps> = ({
  onSelectBooking,
  onCheckInBooking,
  onCheckOutBooking,
  onOpenFolio,
}) => {
  const { bookings, rooms, roomTypes, cancelBooking } = useHotel();

  const [activeFilter, setActiveFilter] = useState<'all' | 'arrivals' | 'departures' | 'in_house' | 'reserved'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [cancelModalBooking, setCancelModalBooking] = useState<Booking | null>(null);
  const [cancelReason, setCancelReason] = useState('Guest requested cancellation due to travel schedule change.');

  // Current operational date (2026-10-01)
  const todayStr = '2026-10-01';

  const filteredBookings = bookings.filter((b) => {
    // Search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchName = b.guestName.toLowerCase().includes(q);
      const matchPhone = b.guestPhone.toLowerCase().includes(q);
      const matchRef = b.bookingReference.toLowerCase().includes(q);
      if (!matchName && !matchPhone && !matchRef) return false;
    }

    // Status filter
    if (activeFilter === 'arrivals') {
      return b.checkInDate === todayStr && b.status === 'reserved';
    }
    if (activeFilter === 'departures') {
      return b.checkOutDate === todayStr && b.status === 'checked_in';
    }
    if (activeFilter === 'in_house') {
      return b.status === 'checked_in';
    }
    if (activeFilter === 'reserved') {
      return b.status === 'reserved';
    }

    return true;
  });

  const arrivalsCount = bookings.filter((b) => b.checkInDate === todayStr && b.status === 'reserved').length;
  const departuresCount = bookings.filter((b) => b.checkOutDate === todayStr && b.status === 'checked_in').length;
  const inHouseCount = bookings.filter((b) => b.status === 'checked_in').length;

  const handleConfirmCancel = () => {
    if (!cancelModalBooking) return;
    cancelBooking(cancelModalBooking.id, cancelReason);
    setCancelModalBooking(null);
  };

  const columns: Column<Booking>[] = [
    {
      header: 'Reference',
      accessor: (b) => (
        <span className="font-mono font-bold text-[#0F5E63]">{b.bookingReference}</span>
      ),
      tabular: true,
    },
    {
      header: 'Guest Name & Contact',
      accessor: (b) => (
        <div className="flex flex-col">
          <span className="font-semibold text-[#14202B]">{b.guestName}</span>
          <span className="text-xs text-[#57636E] font-mono">{b.guestPhone}</span>
        </div>
      ),
    },
    {
      header: 'Room',
      accessor: (b) => {
        const room = rooms.find((r) => r.id === b.roomId);
        const rType = roomTypes.find((rt) => rt.id === b.roomTypeId);
        return (
          <div className="flex flex-col">
            <span className="font-mono font-bold text-[#14202B]">
              {room ? `Rm ${room.roomNumber}` : 'Unassigned'}
            </span>
            <span className="text-xs text-[#57636E]">{rType?.name}</span>
          </div>
        );
      },
    },
    {
      header: 'Stay Dates',
      accessor: (b) => (
        <div className="flex flex-col text-xs font-mono">
          <span>In: {formatDate(b.checkInDate)}</span>
          <span className="text-[#57636E]">Out: {formatDate(b.checkOutDate)}</span>
          <span className="text-[#57636E]">({b.totalNights} night{b.totalNights > 1 ? 's' : ''})</span>
        </div>
      ),
      tabular: true,
    },
    {
      header: 'Tariff Total',
      accessor: (b) => (
        <div className="flex flex-col text-right">
          <span className="font-mono font-bold text-[#14202B]">{formatRupee(b.totalAmount)}</span>
          <span className="text-[11px] text-[#57636E] font-mono">Adv: {formatRupee(b.advancePaid)}</span>
        </div>
      ),
      align: 'right',
      tabular: true,
    },
    {
      header: 'Status',
      accessor: (b) => <StatusLabel status={b.status} />,
      align: 'center',
    },
    {
      header: 'Actions',
      accessor: (b) => (
        <div className="flex items-center gap-1.5 justify-end">
          {b.status === 'reserved' && (
            <Button size="sm" variant="primary" onClick={() => onCheckInBooking(b)}>
              Check In
            </Button>
          )}

          {b.status === 'checked_in' && (
            <>
              <Button size="sm" variant="secondary" onClick={() => onOpenFolio(b)}>
                Folio
              </Button>
              <Button size="sm" variant="outline" onClick={() => onCheckOutBooking(b)}>
                Check Out
              </Button>
            </>
          )}

          {b.status === 'checked_out' && (
            <Button size="sm" variant="secondary" onClick={() => onOpenFolio(b)}>
              View Folio / Invoice
            </Button>
          )}

          {b.status === 'reserved' && (
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setCancelModalBooking(b)}
              className="text-[#B42318] hover:text-[#911D13]"
            >
              Cancel
            </Button>
          )}
        </div>
      ),
      align: 'right',
    },
  ];

  return (
    <div className="flex flex-col gap-4 text-left w-full">
      {/* Search and Tabs */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-4 rounded-[6px] border border-[#D8DCD5]">
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setActiveFilter('all')}
            className={`px-3 py-1.5 rounded-[6px] text-xs font-semibold cursor-pointer transition-colors ${
              activeFilter === 'all'
                ? 'bg-[#0F5E63] text-white'
                : 'bg-[#F4F5F2] text-[#14202B] hover:bg-[#E8ECE5]'
            }`}
          >
            All Bookings ({bookings.length})
          </button>
          <button
            onClick={() => setActiveFilter('arrivals')}
            className={`px-3 py-1.5 rounded-[6px] text-xs font-semibold cursor-pointer transition-colors ${
              activeFilter === 'arrivals'
                ? 'bg-[#0F5E63] text-white'
                : 'bg-[#F4F5F2] text-[#14202B] hover:bg-[#E8ECE5]'
            }`}
          >
            Arrivals Today ({arrivalsCount})
          </button>
          <button
            onClick={() => setActiveFilter('departures')}
            className={`px-3 py-1.5 rounded-[6px] text-xs font-semibold cursor-pointer transition-colors ${
              activeFilter === 'departures'
                ? 'bg-[#0F5E63] text-white'
                : 'bg-[#F4F5F2] text-[#14202B] hover:bg-[#E8ECE5]'
            }`}
          >
            Departures Today ({departuresCount})
          </button>
          <button
            onClick={() => setActiveFilter('in_house')}
            className={`px-3 py-1.5 rounded-[6px] text-xs font-semibold cursor-pointer transition-colors ${
              activeFilter === 'in_house'
                ? 'bg-[#0F5E63] text-white'
                : 'bg-[#F4F5F2] text-[#14202B] hover:bg-[#E8ECE5]'
            }`}
          >
            In-House Guests ({inHouseCount})
          </button>
          <button
            onClick={() => setActiveFilter('reserved')}
            className={`px-3 py-1.5 rounded-[6px] text-xs font-semibold cursor-pointer transition-colors ${
              activeFilter === 'reserved'
                ? 'bg-[#0F5E63] text-white'
                : 'bg-[#F4F5F2] text-[#14202B] hover:bg-[#E8ECE5]'
            }`}
          >
            Upcoming Reservations
          </button>
        </div>

        <div className="w-full sm:w-64">
          <Input
            placeholder="Search by name, phone, ref..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="h-8 text-xs"
          />
        </div>
      </div>

      {/* Bookings Table */}
      <Table
        columns={columns}
        data={filteredBookings}
        keyExtractor={(b) => b.id}
        pageSize={8}
        emptyMessage="No reservations match the selected filter or search term."
      />

      {/* Cancel Confirmation Modal */}
      {cancelModalBooking && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#14202B]/60">
          <div className="bg-white border border-[#D8DCD5] rounded-[6px] p-6 max-w-md w-full shadow-lg text-left">
            <h3 className="text-base font-bold text-[#14202B]">
              Cancel Reservation {cancelModalBooking.bookingReference}
            </h3>
            <p className="text-sm text-[#57636E] mt-2">
              Guest: <span className="font-semibold text-[#14202B]">{cancelModalBooking.guestName}</span>
              <br />
              Stay Dates: {formatDate(cancelModalBooking.checkInDate)} to {formatDate(cancelModalBooking.checkOutDate)}
              <br />
              Advance Paid: {formatRupee(cancelModalBooking.advancePaid)}
            </p>

            <div className="mt-4">
              <label className="text-xs font-semibold text-[#14202B] block mb-1">
                Cancellation Reason
              </label>
              <textarea
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                className="w-full h-20 p-2 text-sm border border-[#D8DCD5] rounded-[6px] focus:ring-2 focus:ring-[#0F5E63] outline-none"
              />
            </div>

            <div className="mt-6 flex justify-end gap-3">
              <Button size="sm" variant="secondary" onClick={() => setCancelModalBooking(null)}>
                Keep Reservation
              </Button>
              <Button size="sm" variant="danger" onClick={handleConfirmCancel}>
                Confirm Cancellation
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
