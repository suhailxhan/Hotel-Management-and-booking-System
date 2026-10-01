import React, { useState } from 'react';
import { useHotel } from '../../context/HotelContext.tsx';
import { Dialog } from '../common/Dialog.tsx';
import { Button } from '../common/Button.tsx';
import { formatRupee, formatDate } from '../../utils/formatters.ts';

interface ShiftSummaryModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ShiftSummaryModal: React.FC<ShiftSummaryModalProps> = ({ isOpen, onClose }) => {
  const { folios, bookings, currentUser, users } = useHotel();

  // Filter payments collected today (2026-10-01) or entire active shift
  const [selectedStaff, setSelectedStaff] = useState<string>('all');

  const allPayments = folios.flatMap((f) => f.payments);

  const filteredPayments = allPayments.filter((p) => {
    if (selectedStaff !== 'all' && p.staffName !== selectedStaff) return false;
    return true;
  });

  // Calculate totals by method
  const totalsByMethod = filteredPayments.reduce(
    (acc, p) => {
      acc[p.method] = (acc[p.method] || 0) + p.amount;
      acc.total += p.amount;
      return acc;
    },
    { cash: 0, upi: 0, card: 0, bank_transfer: 0, total: 0 } as Record<string, number>
  );

  // Group by staff member
  const totalsByStaff = allPayments.reduce((acc, p) => {
    acc[p.staffName] = (acc[p.staffName] || 0) + p.amount;
    return acc;
  }, {} as Record<string, number>);

  return (
    <Dialog
      isOpen={isOpen}
      onClose={onClose}
      title="Front Desk Shift Handover & Cashier Summary"
      maxWidth="lg"
    >
      <div className="flex flex-col gap-5 text-left text-xs">
        {/* Controls */}
        <div className="flex items-center justify-between bg-[#F4F5F2] border border-[#D8DCD5] rounded-[6px] p-3">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-[#57636E]">Staff Filter:</span>
            <select
              value={selectedStaff}
              onChange={(e) => setSelectedStaff(e.target.value)}
              className="h-8 px-2 rounded-[6px] border border-[#D8DCD5] bg-white text-xs font-semibold focus:ring-1 focus:ring-[#0F5E63] outline-none"
            >
              <option value="all">All Front Office Staff</option>
              {Object.keys(totalsByStaff).map((name) => (
                <option key={name} value={name}>
                  {name}
                </option>
              ))}
            </select>
          </div>
          <div className="font-mono text-[#57636E]">
            Date: <span className="font-bold text-[#14202B]">{formatDate(new Date())}</span>
          </div>
        </div>

        {/* Grand Total Hero Stat */}
        <div className="p-4 bg-white border border-[#D8DCD5] rounded-[6px] flex items-center justify-between">
          <div>
            <div className="text-[#57636E] uppercase font-bold text-[11px]">Total Collections Recorded</div>
            <div className="text-2xl font-bold font-mono text-[#14202B] mt-0.5">
              {formatRupee(totalsByMethod.total)}
            </div>
          </div>
          <div className="text-right">
            <span className="text-[11px] font-mono text-[#57636E]">
              {filteredPayments.length} Transactions Settled
            </span>
          </div>
        </div>

        {/* Breakdown by Payment Method */}
        <div className="border border-[#D8DCD5] rounded-[6px] bg-white overflow-hidden">
          <div className="px-4 py-2 bg-[#F4F5F2] border-b border-[#D8DCD5] font-bold uppercase tracking-wide text-[#57636E]">
            Breakdown by Tender Method
          </div>
          <div className="divide-y divide-[#E8ECE5] font-mono">
            <div className="p-3 flex justify-between items-center">
              <span className="font-sans font-semibold text-[#14202B]">UPI (GPay / PhonePe / QR)</span>
              <span className="font-bold text-[#14202B]">{formatRupee(totalsByMethod.upi)}</span>
            </div>
            <div className="p-3 flex justify-between items-center">
              <span className="font-sans font-semibold text-[#14202B]">Credit / Debit Card (EDC POS)</span>
              <span className="font-bold text-[#14202B]">{formatRupee(totalsByMethod.card)}</span>
            </div>
            <div className="p-3 flex justify-between items-center">
              <span className="font-sans font-semibold text-[#14202B]">Physical Cash (Cash Drawer)</span>
              <span className="font-bold text-[#14202B]">{formatRupee(totalsByMethod.cash)}</span>
            </div>
            <div className="p-3 flex justify-between items-center">
              <span className="font-sans font-semibold text-[#14202B]">Direct Bank Transfer / NEFT</span>
              <span className="font-bold text-[#14202B]">{formatRupee(totalsByMethod.bank_transfer)}</span>
            </div>
          </div>
        </div>

        {/* Staff Breakdown */}
        <div className="border border-[#D8DCD5] rounded-[6px] bg-white overflow-hidden">
          <div className="px-4 py-2 bg-[#F4F5F2] border-b border-[#D8DCD5] font-bold uppercase tracking-wide text-[#57636E]">
            Collections by Front Office Cashier
          </div>
          <div className="divide-y divide-[#E8ECE5] font-mono">
            {Object.entries(totalsByStaff).map(([staffName, amt]) => (
              <div key={staffName} className="p-3 flex justify-between items-center">
                <span className="font-sans font-medium text-[#14202B]">{staffName}</span>
                <span className="font-bold text-[#0F5E63]">{formatRupee(amt)}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="flex justify-end pt-3 border-t border-[#D8DCD5]">
          <Button size="sm" variant="secondary" onClick={onClose}>
            Close
          </Button>
        </div>
      </div>
    </Dialog>
  );
};
