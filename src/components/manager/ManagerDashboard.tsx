import React from 'react';
import { useHotel } from '../../context/HotelContext.tsx';
import { StatNumber } from '../common/StatNumber.tsx';
import { formatRupee, formatPercent, formatDate } from '../../utils/formatters.ts';

export const ManagerDashboard: React.FC = () => {
  const { rooms, bookings, folios, restaurantOrders, housekeepingTasks, approvals } = useHotel();

  // Total rooms in inventory
  const totalRoomsCount = rooms.length; // 40
  const occupiedRoomsCount = rooms.filter((r) => r.status === 'clean' || r.status === 'inspected' ? false : true).length; // or active checked in bookings
  const checkedInBookings = bookings.filter((b) => b.status === 'checked_in');
  const inHouseCount = checkedInBookings.length;

  // Occupancy rate
  const occupancyPercent = Math.round((inHouseCount / totalRoomsCount) * 100);

  // Revenue by source
  let roomRevenue = 0;
  let restaurantRevenue = 0;
  let serviceRevenue = 0;
  let totalRevenue = 0;

  folios.forEach((f) => {
    f.lines.forEach((l) => {
      if (l.type === 'room') roomRevenue += l.totalAmount;
      else if (l.type === 'restaurant') restaurantRevenue += l.totalAmount;
      else serviceRevenue += l.totalAmount;
      totalRevenue += l.totalAmount;
    });
  });

  // Calculate ADR (Average Daily Rate): Room Revenue / Occupied Room Nights
  const occupiedNights = checkedInBookings.reduce((sum, b) => sum + b.totalNights, 0) || 1;
  const adr = Math.round(roomRevenue / Math.max(1, occupiedNights));

  // Calculate RevPAR (Revenue Per Available Room): Room Revenue / Total Available Rooms
  const revpar = Math.round(roomRevenue / totalRoomsCount);

  // Arrivals & departures for today (2026-10-01)
  const todayStr = '2026-10-01';
  const arrivalsToday = bookings.filter((b) => b.checkInDate === todayStr && b.status === 'reserved').length;
  const departuresToday = bookings.filter((b) => b.checkOutDate === todayStr && b.status === 'checked_in').length;
  const cancellationsCount = bookings.filter((b) => b.status === 'cancelled').length;

  // Outstanding guest dues across all open folios
  const totalCharges = folios.reduce((sum, f) => sum + f.lines.reduce((s, l) => s + l.totalAmount, 0), 0);
  const totalPaid = folios.reduce((sum, f) => sum + f.payments.reduce((s, p) => s + p.amount, 0), 0);
  const outstandingDues = Math.max(0, totalCharges - totalPaid);

  const pendingApprovalsCount = approvals.filter((a) => a.status === 'pending').length;

  return (
    <div className="flex flex-col gap-6 text-left w-full max-w-6xl mx-auto pb-12">
      {/* Header Info */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-5 rounded-[6px] border border-[#D8DCD5]">
        <div>
          <h2 className="text-lg font-bold text-[#14202B]">Executive Performance Dashboard</h2>
          <div className="text-xs text-[#57636E] mt-0.5">
            Key hospitality KPIs, room yield metrics, revenue apportionment, and operational health
          </div>
        </div>
        <div className="text-xs font-mono font-bold bg-[#F4F5F2] px-3 py-1.5 rounded-[6px] border border-[#D8DCD5]">
          Date: {formatDate(new Date())}
        </div>
      </div>

      {/* Primary KPI Strip: Plain numbers with labels, sized by importance (No icon-in-a-box vibecoding!) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white border border-[#D8DCD5] rounded-[6px] p-5 shadow-2xs">
          <StatNumber
            label="Occupancy Rate"
            value={formatPercent(occupancyPercent)}
            subtext={`${inHouseCount} of ${totalRoomsCount} rooms occupied`}
            size="lg"
          />
        </div>

        <div className="bg-white border border-[#D8DCD5] rounded-[6px] p-5 shadow-2xs">
          <StatNumber
            label="ADR (Average Daily Rate)"
            value={formatRupee(adr)}
            subtext="Revenue per occupied room night"
            size="lg"
          />
        </div>

        <div className="bg-white border border-[#D8DCD5] rounded-[6px] p-5 shadow-2xs">
          <StatNumber
            label="RevPAR"
            value={formatRupee(revpar)}
            subtext="Revenue per total inventory room"
            size="lg"
          />
        </div>

        <div className="bg-white border border-[#D8DCD5] rounded-[6px] p-5 shadow-2xs">
          <StatNumber
            label="Outstanding Dues"
            value={formatRupee(outstandingDues)}
            subtext="Unsettled in-house guest balances"
            size="lg"
          />
        </div>
      </div>

      {/* Revenue Breakdown by Source */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 bg-white border border-[#D8DCD5] rounded-[6px] p-5">
          <h3 className="text-sm font-bold text-[#14202B] uppercase tracking-wide text-[#57636E] mb-4">
            Revenue Apportionment by Department
          </h3>

          <div className="flex flex-col gap-3 font-mono text-xs">
            {/* Room Revenue */}
            <div>
              <div className="flex justify-between font-sans text-xs text-[#14202B] mb-1">
                <span className="font-semibold">Room Accommodation</span>
                <span className="font-mono font-bold">{formatRupee(roomRevenue)}</span>
              </div>
              <div className="w-full bg-[#EEF0EC] h-2.5 rounded-[3px] overflow-hidden">
                <div
                  className="bg-[#0F5E63] h-full"
                  style={{ width: `${Math.round((roomRevenue / Math.max(1, totalRevenue)) * 100)}%` }}
                />
              </div>
            </div>

            {/* Restaurant Revenue */}
            <div>
              <div className="flex justify-between font-sans text-xs text-[#14202B] mb-1">
                <span className="font-semibold">Restaurant & Room Dining (Spice Harbour)</span>
                <span className="font-mono font-bold">{formatRupee(restaurantRevenue)}</span>
              </div>
              <div className="w-full bg-[#EEF0EC] h-2.5 rounded-[3px] overflow-hidden">
                <div
                  className="bg-[#0E7490] h-full"
                  style={{ width: `${Math.round((restaurantRevenue / Math.max(1, totalRevenue)) * 100)}%` }}
                />
              </div>
            </div>

            {/* Services */}
            <div>
              <div className="flex justify-between font-sans text-xs text-[#14202B] mb-1">
                <span className="font-semibold">Transport, Laundry & Hotel Services</span>
                <span className="font-mono font-bold">{formatRupee(serviceRevenue)}</span>
              </div>
              <div className="w-full bg-[#EEF0EC] h-2.5 rounded-[3px] overflow-hidden">
                <div
                  className="bg-[#A16207] h-full"
                  style={{ width: `${Math.round((serviceRevenue / Math.max(1, totalRevenue)) * 100)}%` }}
                />
              </div>
            </div>

            <div className="pt-3 border-t border-[#E8ECE5] flex justify-between font-bold text-sm text-[#14202B]">
              <span className="font-sans">Total Billed Revenue:</span>
              <span>{formatRupee(totalRevenue)}</span>
            </div>
          </div>
        </div>

        {/* Daily Front Desk Health */}
        <div className="bg-white border border-[#D8DCD5] rounded-[6px] p-5 flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-bold text-[#14202B] uppercase tracking-wide text-[#57636E] mb-3">
              Today's Movement
            </h3>
            <div className="flex flex-col divide-y divide-[#E8ECE5] text-xs">
              <div className="py-2.5 flex justify-between">
                <span className="text-[#57636E]">Arrivals Scheduled Today:</span>
                <span className="font-mono font-bold text-sm text-[#14202B]">{arrivalsToday}</span>
              </div>
              <div className="py-2.5 flex justify-between">
                <span className="text-[#57636E]">Departures Scheduled Today:</span>
                <span className="font-mono font-bold text-sm text-[#14202B]">{departuresToday}</span>
              </div>
              <div className="py-2.5 flex justify-between">
                <span className="text-[#57636E]">Pending Manager Approvals:</span>
                <span className={`font-mono font-bold text-sm ${pendingApprovalsCount > 0 ? 'text-[#B42318]' : 'text-[#15803D]'}`}>
                  {pendingApprovalsCount}
                </span>
              </div>
              <div className="py-2.5 flex justify-between">
                <span className="text-[#57636E]">Total Cancellations / No-shows:</span>
                <span className="font-mono font-bold text-sm text-[#57636E]">{cancellationsCount}</span>
              </div>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-[#E8ECE5] text-[11px] text-[#57636E]">
            All revenues calculated strictly in compliance with Indian GST slabs.
          </div>
        </div>
      </div>
    </div>
  );
};
