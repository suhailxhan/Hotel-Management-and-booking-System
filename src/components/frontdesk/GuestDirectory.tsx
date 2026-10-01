import React, { useState } from 'react';
import { useHotel } from '../../context/HotelContext.tsx';
import { Guest } from '../../types/index.ts';
import { formatDate, formatRupee } from '../../utils/formatters.ts';
import { Table, Column } from '../common/Table.tsx';
import { Input } from '../common/Input.tsx';
import { Button } from '../common/Button.tsx';
import { Dialog } from '../common/Dialog.tsx';

export const GuestDirectory: React.FC = () => {
  const { guests, bookings } = useHotel();

  const [search, setSearch] = useState('');
  const [selectedGuest, setSelectedGuest] = useState<Guest | null>(null);

  const filteredGuests = guests.filter((g) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      g.name.toLowerCase().includes(q) ||
      g.phone.toLowerCase().includes(q) ||
      g.city.toLowerCase().includes(q) ||
      g.idNumber.toLowerCase().includes(q)
    );
  });

  // Calculate statistics per guest
  const getGuestStats = (guestId: string) => {
    const guestBookings = bookings.filter((b) => b.guestId === guestId);
    const totalSpend = guestBookings.reduce((sum, b) => sum + b.totalAmount, 0);
    return {
      totalStays: guestBookings.length,
      totalSpend,
      bookings: guestBookings,
    };
  };

  const columns: Column<Guest>[] = [
    {
      header: 'Guest Name',
      accessor: (g) => (
        <div className="flex items-center gap-2">
          <span className="font-bold text-[#14202B]">{g.name}</span>
          {g.vip && (
            <span className="px-1.5 py-0.5 bg-[#A16207] text-white text-[10px] font-bold rounded-[3px]">
              VIP
            </span>
          )}
        </div>
      ),
    },
    {
      header: 'Contact Info',
      accessor: (g) => (
        <div className="flex flex-col text-xs">
          <span className="font-mono text-[#14202B]">{g.phone}</span>
          <span className="text-[#57636E]">{g.email}</span>
        </div>
      ),
    },
    {
      header: 'City / Origin',
      accessor: 'city',
    },
    {
      header: 'ID Document',
      accessor: (g) => (
        <div className="flex flex-col text-xs">
          <span className="font-semibold text-[#14202B]">{g.idType}</span>
          <span className="font-mono text-[#57636E]">{g.idNumber || 'Pending verification'}</span>
        </div>
      ),
    },
    {
      header: 'Stays',
      accessor: (g) => {
        const stats = getGuestStats(g.id);
        return <span className="font-mono font-bold">{stats.totalStays}</span>;
      },
      align: 'center',
      tabular: true,
    },
    {
      header: 'Total Spent',
      accessor: (g) => {
        const stats = getGuestStats(g.id);
        return <span className="font-mono font-bold text-[#14202B]">{formatRupee(stats.totalSpend)}</span>;
      },
      align: 'right',
      tabular: true,
    },
    {
      header: 'Action',
      accessor: (g) => (
        <Button size="sm" variant="secondary" onClick={() => setSelectedGuest(g)}>
          View History
        </Button>
      ),
      align: 'right',
    },
  ];

  return (
    <div className="flex flex-col gap-4 text-left w-full">
      {/* Top filter */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-4 rounded-[6px] border border-[#D8DCD5]">
        <div>
          <h2 className="text-base font-bold text-[#14202B]">Guest Directory & CRM</h2>
          <div className="text-xs text-[#57636E] mt-0.5">
            Profiles, stay history, Form C compliance, and guest preferences
          </div>
        </div>
        <div className="w-full sm:w-72">
          <Input
            placeholder="Search by name, phone, city, ID..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-8 text-xs"
          />
        </div>
      </div>

      <Table
        columns={columns}
        data={filteredGuests}
        keyExtractor={(g) => g.id}
        pageSize={8}
        emptyMessage="No guests found matching your search."
      />

      {/* Guest Profile and Stay History Modal */}
      {selectedGuest && (
        <Dialog
          isOpen={true}
          onClose={() => setSelectedGuest(null)}
          title={`Guest Profile: ${selectedGuest.name}`}
          maxWidth="lg"
        >
          <div className="flex flex-col gap-4 text-left text-xs">
            {/* Identity details */}
            <div className="bg-[#F4F5F2] border border-[#D8DCD5] rounded-[6px] p-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <span className="text-[#57636E]">Phone:</span>{' '}
                <span className="font-mono font-bold text-[#14202B]">{selectedGuest.phone}</span>
              </div>
              <div>
                <span className="text-[#57636E]">Email:</span>{' '}
                <span className="text-[#14202B]">{selectedGuest.email}</span>
              </div>
              <div>
                <span className="text-[#57636E]">Govt ID:</span>{' '}
                <span className="font-semibold text-[#14202B]">{selectedGuest.idType}: {selectedGuest.idNumber || 'None'}</span>
              </div>
              <div>
                <span className="text-[#57636E]">City:</span>{' '}
                <span className="text-[#14202B]">{selectedGuest.city}</span>
              </div>
              <div className="sm:col-span-2">
                <span className="text-[#57636E]">Permanent Address:</span>{' '}
                <span className="text-[#14202B]">{selectedGuest.address || 'Not provided'}</span>
              </div>
              {selectedGuest.notes && (
                <div className="sm:col-span-2 pt-2 border-t border-[#D8DCD5]">
                  <span className="font-bold text-[#14202B]">Staff Notes & Preferences:</span>{' '}
                  <span className="text-[#57636E]">{selectedGuest.notes}</span>
                </div>
              )}
            </div>

            {/* Stays History */}
            <div className="border border-[#D8DCD5] rounded-[6px] bg-white overflow-hidden">
              <div className="px-4 py-2 bg-[#F4F5F2] border-b border-[#D8DCD5] font-bold uppercase tracking-wide text-[#57636E]">
                Past & Current Reservations
              </div>
              <div className="divide-y divide-[#E8ECE5]">
                {getGuestStats(selectedGuest.id).bookings.length === 0 ? (
                  <div className="p-4 text-center text-[#57636E]">No bookings on record.</div>
                ) : (
                  getGuestStats(selectedGuest.id).bookings.map((b) => (
                    <div key={b.id} className="p-3 flex items-center justify-between gap-2">
                      <div>
                        <div className="font-mono font-bold text-[#0F5E63]">{b.bookingReference}</div>
                        <div className="text-[#57636E] font-mono mt-0.5">
                          {formatDate(b.checkInDate)} to {formatDate(b.checkOutDate)} ({b.totalNights} nights)
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-mono font-bold text-[#14202B]">{formatRupee(b.totalAmount)}</div>
                        <div className="mt-0.5">
                          <span className="px-1.5 py-0.5 rounded-[4px] bg-[#E8ECE5] text-[#14202B] uppercase font-bold text-[10px]">
                            {b.status}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            <div className="flex justify-end pt-3 border-t border-[#D8DCD5]">
              <Button size="sm" variant="secondary" onClick={() => setSelectedGuest(null)}>
                Close
              </Button>
            </div>
          </div>
        </Dialog>
      )}
    </div>
  );
};
