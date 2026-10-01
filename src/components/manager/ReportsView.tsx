import React, { useState } from 'react';
import { useHotel } from '../../context/HotelContext.tsx';
import { formatRupee, formatDate } from '../../utils/formatters.ts';
import { exportToExcel } from '../../utils/exportHelpers.ts';
import { Button } from '../common/Button.tsx';

export const ReportsView: React.FC = () => {
  const { rooms, bookings, folios, settings } = useHotel();

  const [startDate, setStartDate] = useState('2026-09-01');
  const [endDate, setEndDate] = useState('2026-10-31');

  // Filter bookings within the date range
  const rangeBookings = bookings.filter(
    (b) => b.checkInDate >= startDate && b.checkInDate <= endDate
  );

  const totalNightsSold = rangeBookings.reduce((sum, b) => sum + b.totalNights, 0);
  const totalRoomRevenue = rangeBookings.reduce((sum, b) => sum + b.roomCharges, 0);
  const totalTaxCollected = rangeBookings.reduce((sum, b) => sum + b.taxAmount, 0);

  // Department revenue from folios
  let diningRevenue = 0;
  let servicesRevenue = 0;

  folios.forEach((f) => {
    f.lines.forEach((l) => {
      if (l.type === 'restaurant') diningRevenue += l.totalAmount;
      if (l.type === 'service') servicesRevenue += l.totalAmount;
    });
  });

  const totalRevenueAll = totalRoomRevenue + diningRevenue + servicesRevenue;
  const totalInventoryRooms = rooms.length; // 40
  const daysInRange = 60; // 2 months
  const totalAvailableRoomNights = totalInventoryRooms * daysInRange;

  const occupancyRate = Math.round((totalNightsSold / totalAvailableRoomNights) * 100);
  const adr = totalNightsSold > 0 ? Math.round(totalRoomRevenue / totalNightsSold) : 0;
  const revpar = Math.round(totalRoomRevenue / totalInventoryRooms);

  const cancellationsCount = rangeBookings.filter((b) => b.status === 'cancelled').length;
  const completedStays = rangeBookings.filter((b) => b.status === 'checked_out').length;

  const handleExportExcel = () => {
    const reportData = rangeBookings.map((b) => ({
      'Booking Ref': b.bookingReference,
      'Guest Name': b.guestName,
      'Phone': b.guestPhone,
      'Check In': formatDate(b.checkInDate),
      'Check Out': formatDate(b.checkOutDate),
      'Nights': b.totalNights,
      'Room Charges (₹)': b.roomCharges,
      'GST Tax (₹)': b.taxAmount,
      'Total Amount (₹)': b.totalAmount,
      'Advance Paid (₹)': b.advancePaid,
      'Status': b.status,
    }));

    exportToExcel(reportData, `Hotel_Management_Report_${startDate}_${endDate}`, 'Bookings_Report');
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="flex flex-col gap-5 text-left w-full max-w-5xl mx-auto pb-12">
      {/* Top Header & Export controls */}
      <div className="no-print flex flex-wrap items-center justify-between gap-3 bg-white p-4 rounded-[6px] border border-[#D8DCD5]">
        <div>
          <h2 className="text-base font-bold text-[#14202B]">Management & Revenue Reports</h2>
          <div className="text-xs text-[#57636E] mt-0.5">
            Audit-ready occupancy, yield metrics, revenue sources, and Excel export
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button size="sm" variant="primary" onClick={handleExportExcel}>
            Export to Excel (.xlsx)
          </Button>
          <Button size="sm" variant="secondary" onClick={handlePrint}>
            Print Report
          </Button>
        </div>
      </div>

      {/* Date Range Selector */}
      <div className="no-print bg-[#F4F5F2] border border-[#D8DCD5] rounded-[6px] p-4 flex flex-wrap items-center gap-4 text-xs font-mono">
        <span className="font-sans font-bold text-[#14202B]">Report Period:</span>
        <div className="flex items-center gap-2">
          <span>From:</span>
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="h-8 px-2 rounded-[4px] border border-[#D8DCD5] bg-white font-mono"
          />
        </div>
        <div className="flex items-center gap-2">
          <span>To:</span>
          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="h-8 px-2 rounded-[4px] border border-[#D8DCD5] bg-white font-mono"
          />
        </div>
      </div>

      {/* Printable Report Summary */}
      <div className="bg-white border border-[#D8DCD5] rounded-[6px] p-6 shadow-2xs text-xs">
        <div className="border-b border-[#14202B] pb-3 mb-4 flex justify-between items-start">
          <div>
            <h1 className="text-base font-bold text-[#14202B] uppercase">
              {settings.hotelName} — Performance Summary
            </h1>
            <div className="text-[#57636E] text-xs">
              Period: {formatDate(startDate)} to {formatDate(endDate)} • Total Room Inventory: 40
            </div>
          </div>
          <div className="text-right font-mono text-[11px] text-[#57636E]">
            GSTIN: {settings.hotelGstin}
          </div>
        </div>

        {/* Metric grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 my-4">
          <div className="p-3 bg-[#F4F5F2] rounded-[6px] border border-[#D8DCD5]">
            <div className="text-[10px] uppercase font-bold text-[#57636E]">Room Nights Sold</div>
            <div className="text-lg font-bold font-mono text-[#14202B] mt-0.5">{totalNightsSold}</div>
          </div>
          <div className="p-3 bg-[#F4F5F2] rounded-[6px] border border-[#D8DCD5]">
            <div className="text-[10px] uppercase font-bold text-[#57636E]">Average Daily Rate (ADR)</div>
            <div className="text-lg font-bold font-mono text-[#14202B] mt-0.5">{formatRupee(adr)}</div>
          </div>
          <div className="p-3 bg-[#F4F5F2] rounded-[6px] border border-[#D8DCD5]">
            <div className="text-[10px] uppercase font-bold text-[#57636E]">RevPAR</div>
            <div className="text-lg font-bold font-mono text-[#14202B] mt-0.5">{formatRupee(revpar)}</div>
          </div>
          <div className="p-3 bg-[#F4F5F2] rounded-[6px] border border-[#D8DCD5]">
            <div className="text-[10px] uppercase font-bold text-[#57636E]">Total Occupancy</div>
            <div className="text-lg font-bold font-mono text-[#14202B] mt-0.5">{occupancyRate}%</div>
          </div>
        </div>

        {/* Financial Breakdown Table */}
        <div className="border border-[#D8DCD5] rounded-[6px] overflow-hidden my-4">
          <div className="px-4 py-2 bg-[#F4F5F2] border-b border-[#D8DCD5] font-bold uppercase text-[11px] text-[#57636E]">
            Revenue Breakdown by Department
          </div>
          <div className="divide-y divide-[#E8ECE5] font-mono">
            <div className="p-3 flex justify-between">
              <span className="font-sans font-medium text-[#14202B]">Accommodation Tariff (Rooms)</span>
              <span className="font-bold text-[#14202B]">{formatRupee(totalRoomRevenue)}</span>
            </div>
            <div className="p-3 flex justify-between">
              <span className="font-sans font-medium text-[#14202B]">Food & Beverage (Restaurant & Room Dining)</span>
              <span className="font-bold text-[#14202B]">{formatRupee(diningRevenue)}</span>
            </div>
            <div className="p-3 flex justify-between">
              <span className="font-sans font-medium text-[#14202B]">Guest Services (Transport, Spa, Laundry)</span>
              <span className="font-bold text-[#14202B]">{formatRupee(servicesRevenue)}</span>
            </div>
            <div className="p-3 flex justify-between">
              <span className="font-sans font-medium text-[#14202B]">GST Taxes Collected</span>
              <span className="font-bold text-[#14202B]">{formatRupee(totalTaxCollected)}</span>
            </div>
            <div className="p-3 flex justify-between bg-[#F4F5F2] font-bold text-sm text-[#14202B]">
              <span className="font-sans">Grand Total Revenue</span>
              <span>{formatRupee(totalRevenueAll + totalTaxCollected)}</span>
            </div>
          </div>
        </div>

        {/* Operational counts */}
        <div className="grid grid-cols-3 gap-3 text-center my-3">
          <div className="p-3 border border-[#D8DCD5] rounded-[6px]">
            <div className="text-[10px] text-[#57636E] uppercase font-bold">Total Reservations</div>
            <div className="text-base font-bold font-mono mt-0.5">{rangeBookings.length}</div>
          </div>
          <div className="p-3 border border-[#D8DCD5] rounded-[6px]">
            <div className="text-[10px] text-[#57636E] uppercase font-bold">Completed Stays</div>
            <div className="text-base font-bold font-mono mt-0.5">{completedStays}</div>
          </div>
          <div className="p-3 border border-[#D8DCD5] rounded-[6px]">
            <div className="text-[10px] text-[#57636E] uppercase font-bold">Cancellations / No-Shows</div>
            <div className="text-base font-bold font-mono mt-0.5 text-[#B42318]">{cancellationsCount}</div>
          </div>
        </div>
      </div>
    </div>
  );
};
