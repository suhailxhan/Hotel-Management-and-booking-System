import React, { useState } from 'react';
import { useHotel } from '../../context/HotelContext.tsx';
import { Booking, Folio, PaymentMethod, FolioLineType } from '../../types/index.ts';
import { Dialog } from '../common/Dialog.tsx';
import { Button } from '../common/Button.tsx';
import { Input } from '../common/Input.tsx';
import { StatusLabel } from '../common/StatusLabel.tsx';
import { formatRupee, formatDate, formatDateTime, toISODateString } from '../../utils/formatters.ts';

interface FolioModalProps {
  isOpen: boolean;
  onClose: () => void;
  booking: Booking | null;
  onCheckOut: (booking: Booking) => void;
  onViewInvoice?: (bookingId: string) => void;
}

export const FolioModal: React.FC<FolioModalProps> = ({
  isOpen,
  onClose,
  booking,
  onCheckOut,
  onViewInvoice,
}) => {
  const {
    getFolioByBookingId,
    addFolioLine,
    addPayment,
    rooms,
    roomTypes,
    extraServices,
    settings,
  } = useHotel();

  const [activeTab, setActiveTab] = useState<'bill' | 'add_charge' | 'add_payment'>('bill');

  // Form states for adding custom charge
  const [selectedServiceId, setSelectedServiceId] = useState('');
  const [chargeDescription, setChargeDescription] = useState('');
  const [chargeAmount, setChargeAmount] = useState<number>(0);
  const [chargeTaxRate, setChargeTaxRate] = useState<number>(18);
  const [chargeType, setChargeType] = useState<FolioLineType>('service');

  // Form states for recording payment
  const [paymentAmount, setPaymentAmount] = useState<number>(0);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('upi');
  const [paymentReference, setPaymentReference] = useState('');
  const [paymentNotes, setPaymentNotes] = useState('');

  if (!booking) return null;

  const folio = getFolioByBookingId(booking.id);
  const room = rooms.find((r) => r.id === booking.roomId);
  const rType = roomTypes.find((rt) => rt.id === booking.roomTypeId);

  const totalCharges = folio ? folio.lines.reduce((sum, l) => sum + l.totalAmount, 0) : 0;
  const totalTax = folio ? folio.lines.reduce((sum, l) => sum + l.taxAmount, 0) : 0;
  const totalSubtotal = folio ? folio.lines.reduce((sum, l) => sum + l.unitPrice * l.quantity, 0) : 0;
  const totalPaid = folio ? folio.payments.reduce((sum, p) => sum + p.amount, 0) : 0;
  const balanceDue = totalCharges - totalPaid;

  const handleSelectPredefinedService = (serviceId: string) => {
    setSelectedServiceId(serviceId);
    const service = extraServices.find((s) => s.id === serviceId);
    if (service) {
      setChargeDescription(service.name);
      setChargeAmount(service.price);
      setChargeTaxRate(service.gstRate);
      setChargeType('service');
    }
  };

  const handleAddChargeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!folio || chargeAmount <= 0) return;

    const taxAmount = Math.round((chargeAmount * chargeTaxRate) / 100);
    const totalAmount = chargeAmount + taxAmount;

    addFolioLine(folio.id, {
      folioId: folio.id,
      date: toISODateString(new Date()),
      type: chargeType,
      description: chargeDescription || 'Extra Service / Incidental',
      quantity: 1,
      unitPrice: chargeAmount,
      taxRate: chargeTaxRate,
      taxAmount,
      totalAmount,
    });

    // Reset
    setChargeDescription('');
    setChargeAmount(0);
    setSelectedServiceId('');
    setActiveTab('bill');
  };

  const handleAddPaymentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!folio || paymentAmount <= 0) return;

    addPayment(folio.id, {
      folioId: folio.id,
      amount: paymentAmount,
      method: paymentMethod,
      reference: paymentReference || `${paymentMethod.toUpperCase()}/${Date.now().toString().slice(-6)}`,
      notes: paymentNotes,
      isRefund: false,
    });

    setPaymentAmount(0);
    setPaymentReference('');
    setPaymentNotes('');
    setActiveTab('bill');
  };

  return (
    <Dialog
      isOpen={isOpen}
      onClose={onClose}
      title={`Guest Folio: ${booking.guestName} (${booking.bookingReference})`}
      maxWidth="2xl"
    >
      <div className="flex flex-col gap-4 text-left">
        {/* Folio Metadata header */}
        <div className="bg-[#F4F5F2] border border-[#D8DCD5] rounded-[6px] p-4 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div>
            <div className="font-bold text-sm text-[#14202B]">{booking.guestName}</div>
            <div className="text-[#57636E] font-mono mt-0.5">
              Phone: {booking.guestPhone} • City: {booking.guestCity || 'India'}
            </div>
          </div>
          <div>
            <div className="font-bold text-sm text-[#14202B]">
              {room ? `Room ${room.roomNumber}` : 'Unassigned'} ({rType?.name})
            </div>
            <div className="text-[#57636E] font-mono mt-0.5">
              {formatDate(booking.checkInDate)} to {formatDate(booking.checkOutDate)} ({booking.totalNights} nights)
            </div>
          </div>
          <div className="text-right">
            <div className="text-xs text-[#57636E]">Status</div>
            <StatusLabel status={booking.status} />
          </div>
        </div>

        {/* Tab switcher */}
        <div className="flex items-center gap-2 border-b border-[#D8DCD5] pb-2">
          <button
            onClick={() => setActiveTab('bill')}
            className={`px-3 py-1.5 rounded-[6px] text-xs font-semibold cursor-pointer transition-colors ${
              activeTab === 'bill'
                ? 'bg-[#0F5E63] text-white'
                : 'bg-white text-[#14202B] border border-[#D8DCD5] hover:bg-[#F4F5F2]'
            }`}
          >
            Itemized Folio Bill
          </button>
          {booking.status === 'checked_in' && (
            <>
              <button
                onClick={() => setActiveTab('add_charge')}
                className={`px-3 py-1.5 rounded-[6px] text-xs font-semibold cursor-pointer transition-colors ${
                  activeTab === 'add_charge'
                    ? 'bg-[#0F5E63] text-white'
                    : 'bg-white text-[#14202B] border border-[#D8DCD5] hover:bg-[#F4F5F2]'
                }`}
              >
                + Post Charge / Service
              </button>
              <button
                onClick={() => {
                  setPaymentAmount(balanceDue > 0 ? balanceDue : 0);
                  setActiveTab('add_payment');
                }}
                className={`px-3 py-1.5 rounded-[6px] text-xs font-semibold cursor-pointer transition-colors ${
                  activeTab === 'add_payment'
                    ? 'bg-[#0F5E63] text-white'
                    : 'bg-white text-[#14202B] border border-[#D8DCD5] hover:bg-[#F4F5F2]'
                }`}
              >
                + Collect Payment
              </button>
            </>
          )}
        </div>

        {/* TAB 1: Itemized Bill */}
        {activeTab === 'bill' && (
          <div className="flex flex-col gap-4">
            {/* Charges Table */}
            <div className="border border-[#D8DCD5] rounded-[6px] bg-white overflow-hidden">
              <div className="px-4 py-2 bg-[#F4F5F2] border-b border-[#D8DCD5] font-bold text-xs uppercase tracking-wide text-[#57636E]">
                Charges & Itemized Folio Lines
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-[#E8ECE5] text-[#57636E] text-left">
                      <th className="p-2.5">Date</th>
                      <th className="p-2.5">Type</th>
                      <th className="p-2.5">Description</th>
                      <th className="p-2.5 text-right">Qty</th>
                      <th className="p-2.5 text-right">Rate</th>
                      <th className="p-2.5 text-right">GST %</th>
                      <th className="p-2.5 text-right">Tax (₹)</th>
                      <th className="p-2.5 text-right font-bold">Total (₹)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#E8ECE5]">
                    {!folio || folio.lines.length === 0 ? (
                      <tr>
                        <td colSpan={8} className="p-4 text-center text-[#57636E]">
                          No charges posted to folio yet.
                        </td>
                      </tr>
                    ) : (
                      folio.lines.map((l) => (
                        <tr key={l.id} className="hover:bg-[#F9FAF8]">
                          <td className="p-2.5 font-mono">{formatDate(l.date)}</td>
                          <td className="p-2.5 uppercase font-semibold text-[10px] text-[#57636E]">
                            {l.type}
                          </td>
                          <td className="p-2.5 font-medium text-[#14202B]">{l.description}</td>
                          <td className="p-2.5 text-right font-mono">{l.quantity}</td>
                          <td className="p-2.5 text-right font-mono">{formatRupee(l.unitPrice)}</td>
                          <td className="p-2.5 text-right font-mono">{l.taxRate}%</td>
                          <td className="p-2.5 text-right font-mono">{formatRupee(l.taxAmount)}</td>
                          <td className="p-2.5 text-right font-mono font-bold text-[#14202B]">
                            {formatRupee(l.totalAmount)}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Payments Table */}
            <div className="border border-[#D8DCD5] rounded-[6px] bg-white overflow-hidden">
              <div className="px-4 py-2 bg-[#F4F5F2] border-b border-[#D8DCD5] font-bold text-xs uppercase tracking-wide text-[#57636E]">
                Payments & Deposits Collected
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-[#E8ECE5] text-[#57636E] text-left">
                      <th className="p-2.5">Date / Time</th>
                      <th className="p-2.5">Method</th>
                      <th className="p-2.5">Reference No</th>
                      <th className="p-2.5">Staff</th>
                      <th className="p-2.5">Notes</th>
                      <th className="p-2.5 text-right font-bold">Amount (₹)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#E8ECE5]">
                    {!folio || folio.payments.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="p-4 text-center text-[#57636E]">
                          No payments recorded yet.
                        </td>
                      </tr>
                    ) : (
                      folio.payments.map((p) => (
                        <tr key={p.id} className="hover:bg-[#F9FAF8]">
                          <td className="p-2.5 font-mono">{formatDateTime(p.createdAt)}</td>
                          <td className="p-2.5 uppercase font-semibold text-[10px] text-[#0F5E63]">
                            {p.method}
                          </td>
                          <td className="p-2.5 font-mono">{p.reference || '-'}</td>
                          <td className="p-2.5 text-[#57636E]">{p.staffName}</td>
                          <td className="p-2.5 text-[#57636E]">{p.notes || '-'}</td>
                          <td
                            className={`p-2.5 text-right font-mono font-bold ${
                              p.isRefund ? 'text-[#B42318]' : 'text-[#15803D]'
                            }`}
                          >
                            {formatRupee(p.amount)}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Financial Summary Box */}
            <div className="bg-[#F4F5F2] border border-[#D8DCD5] rounded-[6px] p-4 font-mono text-xs flex flex-col gap-1.5 max-w-sm ml-auto w-full">
              <div className="flex justify-between">
                <span className="text-[#57636E]">Subtotal (Taxable):</span>
                <span>{formatRupee(totalSubtotal)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#57636E]">CGST + SGST:</span>
                <span>{formatRupee(totalTax)}</span>
              </div>
              <div className="flex justify-between font-bold text-sm text-[#14202B] pt-1 border-t border-[#D8DCD5]">
                <span>Total Charges:</span>
                <span>{formatRupee(totalCharges)}</span>
              </div>
              <div className="flex justify-between font-semibold text-[#15803D]">
                <span>Total Paid / Received:</span>
                <span>{formatRupee(totalPaid)}</span>
              </div>
              <div
                className={`flex justify-between font-bold text-base pt-1 border-t border-[#D8DCD5] ${
                  balanceDue > 0 ? 'text-[#B42318]' : 'text-[#15803D]'
                }`}
              >
                <span>Balance Due:</span>
                <span>{formatRupee(balanceDue)}</span>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: Post Charge Form */}
        {activeTab === 'add_charge' && (
          <form onSubmit={handleAddChargeSubmit} className="flex flex-col gap-4 bg-white border border-[#D8DCD5] rounded-[6px] p-4">
            <h3 className="text-sm font-bold text-[#14202B]">Post Incidentals or Hotel Extra Services</h3>

            <div>
              <label className="text-xs font-semibold text-[#14202B] mb-1 block">
                Quick Select Hotel Service
              </label>
              <select
                value={selectedServiceId}
                onChange={(e) => handleSelectPredefinedService(e.target.value)}
                className="w-full h-9 px-3 text-sm rounded-[6px] border border-[#D8DCD5] bg-white focus:ring-2 focus:ring-[#0F5E63] outline-none"
              >
                <option value="">Custom Entry...</option>
                {extraServices.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name} ({formatRupee(s.price)} + {s.gstRate}% GST)
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Input
                label="Description *"
                placeholder="e.g. Cochin Airport Pickup (Innova)"
                value={chargeDescription}
                onChange={(e) => setChargeDescription(e.target.value)}
                required
              />
              <Input
                label="Taxable Amount (₹) *"
                type="number"
                placeholder="0"
                value={chargeAmount}
                onChange={(e) => setChargeAmount(Number(e.target.value))}
                required
                tabular
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-semibold text-[#14202B] mb-1 block">Category</label>
                <select
                  value={chargeType}
                  onChange={(e) => setChargeType(e.target.value as FolioLineType)}
                  className="w-full h-9 px-3 text-sm rounded-[6px] border border-[#D8DCD5] bg-white focus:ring-2 focus:ring-[#0F5E63] outline-none"
                >
                  <option value="service">Hotel Service (Transport, Laundry, Spa)</option>
                  <option value="restaurant">Restaurant / Room Dining</option>
                  <option value="room">Room Charge Adjustment</option>
                  <option value="late_checkout">Late Check-Out Fee</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold text-[#14202B] mb-1 block">GST Rate (%)</label>
                <select
                  value={chargeTaxRate}
                  onChange={(e) => setChargeTaxRate(Number(e.target.value))}
                  className="w-full h-9 px-3 text-sm rounded-[6px] border border-[#D8DCD5] bg-white focus:ring-2 focus:ring-[#0F5E63] outline-none font-mono"
                >
                  <option value={18}>18% GST (Standard Services & Transport)</option>
                  <option value={12}>12% GST (Accommodation Slabs)</option>
                  <option value={5}>5% GST (Restaurant & Dining)</option>
                  <option value={0}>0% (Tax Exempt)</option>
                </select>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#E8ECE5]">
              <Button type="button" variant="secondary" onClick={() => setActiveTab('bill')}>
                Cancel
              </Button>
              <Button type="submit" variant="primary">
                Add to Folio
              </Button>
            </div>
          </form>
        )}

        {/* TAB 3: Add Payment Form */}
        {activeTab === 'add_payment' && (
          <form onSubmit={handleAddPaymentSubmit} className="flex flex-col gap-4 bg-white border border-[#D8DCD5] rounded-[6px] p-4">
            <h3 className="text-sm font-bold text-[#14202B]">Collect Payment or Interim Deposit</h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Input
                label="Amount to Collect (₹) *"
                type="number"
                value={paymentAmount}
                onChange={(e) => setPaymentAmount(Number(e.target.value))}
                required
                tabular
              />

              <div>
                <label className="text-xs font-semibold text-[#14202B] mb-1 block">Payment Method *</label>
                <select
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value as PaymentMethod)}
                  className="w-full h-9 px-3 text-sm rounded-[6px] border border-[#D8DCD5] bg-white focus:ring-2 focus:ring-[#0F5E63] outline-none"
                >
                  <option value="upi">UPI (BHIM / GPay / PhonePe / Paytm)</option>
                  <option value="card">Credit Card / Debit Card (POS)</option>
                  <option value="cash">Cash (Front Desk Till)</option>
                  <option value="bank_transfer">Bank Transfer / NEFT / RTGS</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Input
                label="Transaction / Approval Reference"
                placeholder="e.g. UPI/482910482910 or HDFC-POS-9921"
                value={paymentReference}
                onChange={(e) => setPaymentReference(e.target.value)}
                tabular
              />
              <Input
                label="Staff Notes"
                placeholder="e.g. Split payment part 1 or dinner deposit"
                value={paymentNotes}
                onChange={(e) => setPaymentNotes(e.target.value)}
              />
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#E8ECE5]">
              <Button type="button" variant="secondary" onClick={() => setActiveTab('bill')}>
                Cancel
              </Button>
              <Button type="submit" variant="primary">
                Record Payment
              </Button>
            </div>
          </form>
        )}

        {/* Footer actions */}
        <div className="flex items-center justify-between pt-3 border-t border-[#D8DCD5]">
          <div className="text-xs text-[#57636E]">
            Folio ID: <span className="font-mono">{folio?.id}</span>
          </div>

          <div className="flex items-center gap-2">
            {booking.status === 'checked_out' && onViewInvoice && (
              <Button size="sm" variant="outline" onClick={() => onViewInvoice(booking.id)}>
                View Tax Invoice
              </Button>
            )}

            {booking.status === 'checked_in' && (
              <Button
                size="sm"
                variant="primary"
                onClick={() => {
                  onClose();
                  onCheckOut(booking);
                }}
              >
                Proceed to Check-Out
              </Button>
            )}

            <Button size="sm" variant="secondary" onClick={onClose}>
              Close
            </Button>
          </div>
        </div>
      </div>
    </Dialog>
  );
};
