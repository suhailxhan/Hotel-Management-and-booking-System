import React from 'react';
import { Invoice, Settings } from '../../types/index.ts';
import { formatRupee, formatDate } from '../../utils/formatters.ts';
import { Button } from '../common/Button.tsx';

interface GSTInvoiceViewProps {
  invoice: Invoice;
  settings: Settings;
  onClose: () => void;
  onIssueCreditNote?: (invoiceId: string) => void;
}

export const GSTInvoiceView: React.FC<GSTInvoiceViewProps> = ({
  invoice,
  settings,
  onClose,
  onIssueCreditNote,
}) => {
  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="flex flex-col gap-4 text-left w-full max-w-4xl mx-auto">
      {/* Top action toolbar (hidden during print) */}
      <div className="no-print flex items-center justify-between bg-white border border-[#D8DCD5] rounded-[6px] p-4 shadow-xs">
        <div>
          <span className="font-bold text-sm text-[#14202B]">
            {invoice.isCreditNote ? 'GST Credit Note' : 'Tax Invoice'} Preview
          </span>
          <span className="ml-2 font-mono text-xs text-[#57636E]">{invoice.invoiceNumber}</span>
        </div>
        <div className="flex items-center gap-2">
          {!invoice.isCreditNote && onIssueCreditNote && (
            <Button
              size="sm"
              variant="outline"
              onClick={() => onIssueCreditNote(invoice.id)}
              className="text-[#B42318] border-[#B42318] hover:bg-[#FEE2E2]"
            >
              Issue Credit Note Correction
            </Button>
          )}
          <Button size="sm" variant="primary" onClick={handlePrint}>
            Print / Save as PDF
          </Button>
          <Button size="sm" variant="secondary" onClick={onClose}>
            Back
          </Button>
        </div>
      </div>

      {/* Invoice Document Body */}
      <div className="bg-white border border-[#D8DCD5] rounded-[6px] p-8 shadow-sm text-xs print:p-0 print:border-none print:shadow-none">
        {/* Header */}
        <div className="flex items-start justify-between border-b border-[#14202B] pb-4">
          <div>
            <h1 className="text-xl font-bold text-[#14202B] uppercase tracking-wide">
              {settings.hotelName}
            </h1>
            <div className="text-[#57636E] text-xs mt-1 leading-relaxed">
              {settings.hotelAddress}
              <br />
              {settings.hotelCity}, {settings.hotelState} - {settings.hotelPincode}
              <br />
              Phone: {settings.hotelPhone} • Email: {settings.hotelEmail}
            </div>
            <div className="mt-2 font-mono font-bold text-xs text-[#14202B]">
              GSTIN: {settings.hotelGstin} • State Code: 32 (Kerala)
            </div>
          </div>

          <div className="text-right">
            <div
              className={`inline-block px-3 py-1 font-bold rounded-[4px] uppercase text-xs ${
                invoice.isCreditNote
                  ? 'bg-[#B42318] text-white'
                  : 'bg-[#0F5E63] text-white'
              }`}
            >
              {invoice.isCreditNote ? 'GST CREDIT NOTE' : 'TAX INVOICE'}
            </div>
            <div className="mt-2 font-mono font-bold text-sm text-[#14202B]">
              {invoice.invoiceNumber}
            </div>
            <div className="text-[#57636E] font-mono mt-0.5">
              Date: {formatDate(invoice.date)}
            </div>
            {invoice.originalInvoiceId && (
              <div className="text-[11px] text-[#B42318] font-mono mt-1">
                Ref Inv ID: {invoice.originalInvoiceId}
              </div>
            )}
          </div>
        </div>

        {/* Billed To Guest */}
        <div className="grid grid-cols-2 gap-6 my-4 py-3 border-b border-[#E8ECE5]">
          <div>
            <div className="text-[10px] uppercase font-bold text-[#57636E] tracking-wider">
              Billed To Guest
            </div>
            <div className="font-bold text-sm text-[#14202B] mt-1">{invoice.guestName}</div>
            <div className="text-[#57636E] font-mono mt-0.5">Mobile: {invoice.guestPhone}</div>
            {invoice.guestAddress && (
              <div className="text-[#57636E] mt-0.5">{invoice.guestAddress}</div>
            )}
            {invoice.guestGstin && (
              <div className="font-mono font-semibold text-[#14202B] mt-1">
                Guest GSTIN: {invoice.guestGstin}
              </div>
            )}
          </div>

          <div className="text-right font-mono">
            <div className="text-[10px] uppercase font-bold text-[#57636E] tracking-wider font-sans">
              Stay & Folio Details
            </div>
            <div className="mt-1 text-xs">
              <span className="text-[#57636E]">Folio Ref:</span> {invoice.folioId}
            </div>
            <div className="mt-0.5 text-xs">
              <span className="text-[#57636E]">Place of Supply:</span> 32 - Kerala
            </div>
            <div className="mt-0.5 text-xs">
              <span className="text-[#57636E]">Settlement Status:</span>{' '}
              <span className="font-bold uppercase text-[#15803D]">{invoice.paymentStatus}</span>
            </div>
          </div>
        </div>

        {/* Itemized Table */}
        <table className="w-full text-xs border-collapse my-4">
          <thead>
            <tr className="border-b border-[#14202B] bg-[#F4F5F2] font-semibold text-[#14202B]">
              <th className="py-2 px-2 text-left w-8">#</th>
              <th className="py-2 px-2 text-left">Description of Service / Goods</th>
              <th className="py-2 px-2 text-left font-mono">SAC / HSN</th>
              <th className="py-2 px-2 text-right font-mono">Qty</th>
              <th className="py-2 px-2 text-right font-mono">Rate (₹)</th>
              <th className="py-2 px-2 text-right font-mono">Taxable Amt (₹)</th>
              <th className="py-2 px-2 text-right font-mono">GST %</th>
              <th className="py-2 px-2 text-right font-mono">Tax (₹)</th>
              <th className="py-2 px-2 text-right font-mono font-bold">Total (₹)</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#E8ECE5]">
            {invoice.lines.map((line, idx) => (
              <tr key={idx}>
                <td className="py-2.5 px-2 text-[#57636E] font-mono">{idx + 1}</td>
                <td className="py-2.5 px-2 font-medium text-[#14202B]">{line.description}</td>
                <td className="py-2.5 px-2 font-mono text-[#57636E]">{line.sacCode}</td>
                <td className="py-2.5 px-2 text-right font-mono">{line.qty}</td>
                <td className="py-2.5 px-2 text-right font-mono">{formatRupee(line.rate)}</td>
                <td className="py-2.5 px-2 text-right font-mono">{formatRupee(line.amount)}</td>
                <td className="py-2.5 px-2 text-right font-mono">{line.taxRate}%</td>
                <td className="py-2.5 px-2 text-right font-mono">{formatRupee(line.taxAmount)}</td>
                <td className="py-2.5 px-2 text-right font-mono font-bold text-[#14202B]">
                  {formatRupee(line.amount + line.taxAmount)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* GST Tax Summary Box */}
        <div className="flex justify-between items-start pt-4 border-t border-[#14202B]">
          <div className="w-1/2 text-[11px] text-[#57636E] leading-relaxed">
            <div className="font-bold text-[#14202B] uppercase">GST Tax Compliance Declaration</div>
            <p className="mt-1">
              Certified that the particulars given above are true and correct, and the amount indicated
              represents the price actually charged. Intra-state supply subjected to 50% CGST and 50% SGST.
            </p>
            <div className="mt-6 pt-6 border-t border-dashed border-[#D8DCD5] inline-block font-sans text-xs text-[#14202B]">
              Authorized Signatory / Front Office Cashier
            </div>
          </div>

          <div className="w-80 font-mono text-xs flex flex-col gap-1.5 bg-[#F4F5F2] p-4 rounded-[6px] border border-[#D8DCD5]">
            <div className="flex justify-between">
              <span className="text-[#57636E]">Total Taxable Value:</span>
              <span className="font-semibold">{formatRupee(invoice.subtotal)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[#57636E]">CGST (Central Tax):</span>
              <span className="font-semibold">{formatRupee(invoice.cgst)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[#57636E]">SGST (State Tax):</span>
              <span className="font-semibold">{formatRupee(invoice.sgst)}</span>
            </div>
            <div className="flex justify-between font-bold text-sm text-[#14202B] pt-2 border-t border-[#D8DCD5]">
              <span>Grand Total:</span>
              <span>{formatRupee(invoice.total)}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
