import React, { useState } from 'react';
import { useHotel } from '../../context/HotelContext.tsx';
import { Settings, GSTSlab } from '../../types/index.ts';
import { Button } from '../common/Button.tsx';
import { Input } from '../common/Input.tsx';
import { formatRupee } from '../../utils/formatters.ts';

export const TaxAndHotelSettings: React.FC = () => {
  const { settings, updateSettings } = useHotel();
  const [formData, setFormData] = useState<Settings>({ ...settings });

  const handleChange = (field: keyof Settings, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleUpdateSlab = (index: number, field: keyof GSTSlab, value: number) => {
    const updatedSlabs = [...formData.gstSlabs];
    updatedSlabs[index] = { ...updatedSlabs[index], [field]: value };
    setFormData((prev) => ({ ...prev, gstSlabs: updatedSlabs }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateSettings(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-6 text-left w-full max-w-4xl mx-auto pb-12">
      {/* Hotel Identity & Legal Details */}
      <div className="bg-white border border-[#D8DCD5] rounded-[6px] p-5 shadow-2xs">
        <h3 className="font-bold text-base text-[#14202B]">Hotel Identity & Official GST Registration</h3>
        <p className="text-xs text-[#57636E] mt-0.5 mb-4">
          Printed on all official GST tax invoices, folios, and registration cards.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Input
            label="Legal Entity Name *"
            value={formData.hotelName}
            onChange={(e) => handleChange('hotelName', e.target.value)}
            required
          />
          <Input
            label="Tagline / Brand"
            value={formData.hotelTagline}
            onChange={(e) => handleChange('hotelTagline', e.target.value)}
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-3">
          <Input
            label="Hotel GSTIN Number *"
            value={formData.hotelGstin}
            onChange={(e) => handleChange('hotelGstin', e.target.value)}
            required
            tabular
          />
          <Input
            label="Official Phone *"
            value={formData.hotelPhone}
            onChange={(e) => handleChange('hotelPhone', e.target.value)}
            required
            tabular
          />
          <Input
            label="Official Email *"
            value={formData.hotelEmail}
            onChange={(e) => handleChange('hotelEmail', e.target.value)}
            required
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-3">
          <Input
            label="Address"
            value={formData.hotelAddress}
            onChange={(e) => handleChange('hotelAddress', e.target.value)}
          />
          <Input
            label="City"
            value={formData.hotelCity}
            onChange={(e) => handleChange('hotelCity', e.target.value)}
          />
          <Input
            label="State & Pincode"
            value={`${formData.hotelState} - ${formData.hotelPincode}`}
            onChange={(e) => handleChange('hotelPincode', e.target.value.split('-')[1]?.trim() || '')}
          />
        </div>
      </div>

      {/* Indian GST Slabs by Room Tariff */}
      <div className="bg-white border border-[#D8DCD5] rounded-[6px] p-5 shadow-2xs">
        <h3 className="font-bold text-base text-[#14202B]">Indian GST Slabs by Room Tariff</h3>
        <p className="text-xs text-[#57636E] mt-0.5 mb-4">
          Statutory Indian GST rates automatically determined based on per-night effective tariff.
        </p>

        <div className="border border-[#D8DCD5] rounded-[6px] overflow-hidden">
          <table className="w-full text-xs border-collapse font-mono">
            <thead>
              <tr className="bg-[#F4F5F2] border-b border-[#D8DCD5] text-[#57636E]">
                <th className="p-3 text-left font-sans">Min Tariff / Night (₹)</th>
                <th className="p-3 text-left font-sans">Max Tariff / Night (₹)</th>
                <th className="p-3 text-left font-sans">GST Rate (%)</th>
                <th className="p-3 text-left font-sans">CGST / SGST Split</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E8ECE5]">
              {formData.gstSlabs.map((slab, idx) => (
                <tr key={idx}>
                  <td className="p-3">
                    <input
                      type="number"
                      value={slab.minTariff}
                      onChange={(e) => handleUpdateSlab(idx, 'minTariff', Number(e.target.value))}
                      className="w-24 h-7 px-2 border border-[#D8DCD5] rounded-[4px] bg-white font-mono"
                    />
                  </td>
                  <td className="p-3">
                    <input
                      type="number"
                      value={slab.maxTariff}
                      onChange={(e) => handleUpdateSlab(idx, 'maxTariff', Number(e.target.value))}
                      className="w-28 h-7 px-2 border border-[#D8DCD5] rounded-[4px] bg-white font-mono"
                    />
                  </td>
                  <td className="p-3">
                    <input
                      type="number"
                      value={slab.gstRate}
                      onChange={(e) => handleUpdateSlab(idx, 'gstRate', Number(e.target.value))}
                      className="w-20 h-7 px-2 border border-[#D8DCD5] rounded-[4px] bg-white font-mono font-bold"
                    />
                    <span className="ml-1">%</span>
                  </td>
                  <td className="p-3 text-[#57636E] font-sans">
                    {slab.gstRate / 2}% CGST + {slab.gstRate / 2}% SGST
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Invoice Sequence & SAC Codes */}
      <div className="bg-white border border-[#D8DCD5] rounded-[6px] p-5 shadow-2xs">
        <h3 className="font-bold text-base text-[#14202B]">Sequential Invoicing & SAC Codes</h3>
        <p className="text-xs text-[#57636E] mt-0.5 mb-4">
          Invoice numbers increment strictly sequentially and cannot be deleted or skipped.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Input
            label="Tax Invoice Prefix"
            value={formData.invoicePrefix}
            onChange={(e) => handleChange('invoicePrefix', e.target.value)}
            tabular
          />
          <Input
            label="Next Invoice Sequence Number"
            type="number"
            value={formData.nextInvoiceNumber}
            onChange={(e) => handleChange('nextInvoiceNumber', Number(e.target.value))}
            tabular
          />
          <Input
            label="Credit Note Prefix"
            value={formData.creditNotePrefix}
            onChange={(e) => handleChange('creditNotePrefix', e.target.value)}
            tabular
          />
          <Input
            label="Next Credit Note Number"
            type="number"
            value={formData.nextCreditNoteNumber}
            onChange={(e) => handleChange('nextCreditNoteNumber', Number(e.target.value))}
            tabular
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-3 pt-3 border-t border-[#E8ECE5]">
          <Input
            label="SAC Accommodation Code"
            value={formData.sacCodeAccommodation}
            onChange={(e) => handleChange('sacCodeAccommodation', e.target.value)}
            tabular
          />
          <Input
            label="SAC Restaurant Code"
            value={formData.sacCodeRestaurant}
            onChange={(e) => handleChange('sacCodeRestaurant', e.target.value)}
            tabular
          />
          <Input
            label="SAC Services Code"
            value={formData.sacCodeServices}
            onChange={(e) => handleChange('sacCodeServices', e.target.value)}
            tabular
          />
        </div>
      </div>

      {/* Operational Policies */}
      <div className="bg-white border border-[#D8DCD5] rounded-[6px] p-5 shadow-2xs">
        <h3 className="font-bold text-base text-[#14202B]">Operational & Cancellation Policies</h3>
        <p className="text-xs text-[#57636E] mt-0.5 mb-4">
          Configurable check-out times, late departure charges, and cancellation window.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <Input
            label="Default Check-In Time"
            value={formData.defaultCheckInTime}
            onChange={(e) => handleChange('defaultCheckInTime', e.target.value)}
            tabular
          />
          <Input
            label="Default Check-Out Time"
            value={formData.defaultCheckOutTime}
            onChange={(e) => handleChange('defaultCheckOutTime', e.target.value)}
            tabular
          />
          <Input
            label="Late Check-Out Fee / Hour (₹)"
            type="number"
            value={formData.lateCheckOutFeePerHour}
            onChange={(e) => handleChange('lateCheckOutFeePerHour', Number(e.target.value))}
            tabular
          />
          <Input
            label="Free Cancellation Hours Before Check-in"
            type="number"
            value={formData.cancellationFreeHours}
            onChange={(e) => handleChange('cancellationFreeHours', Number(e.target.value))}
            tabular
            helperText="e.g. 48 hours before check-in"
          />
          <Input
            label="Max Front Desk Discount without Approval (%)"
            type="number"
            value={formData.maxDiscountPercentWithoutApproval}
            onChange={(e) => handleChange('maxDiscountPercentWithoutApproval', Number(e.target.value))}
            tabular
            helperText="Above this % requires Manager approval"
          />
        </div>
      </div>

      {/* Save Button */}
      <div className="flex justify-end">
        <Button size="lg" variant="primary" type="submit">
          Save Settings & Tax Rules
        </Button>
      </div>
    </form>
  );
};
