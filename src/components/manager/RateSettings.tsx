import React, { useState } from 'react';
import { useHotel } from '../../context/HotelContext.tsx';
import { ExtraService } from '../../types/index.ts';
import { formatRupee } from '../../utils/formatters.ts';
import { Button } from '../common/Button.tsx';
import { Input } from '../common/Input.tsx';
import { Dialog } from '../common/Dialog.tsx';

export const RateSettings: React.FC = () => {
  const { extraServices, roomTypes } = useHotel();

  const [weekendMultiplier, setWeekendMultiplier] = useState(1.15); // +15% on weekends
  const [seasonalMultiplier, setSeasonalMultiplier] = useState(1.25); // +25% peak heritage season (Dec-Jan)
  const [editingService, setEditingService] = useState<ExtraService | null>(null);

  return (
    <div className="flex flex-col gap-6 text-left w-full max-w-5xl mx-auto pb-12">
      {/* Seasonal & Weekend Dynamic Yield Controls */}
      <div className="bg-white border border-[#D8DCD5] rounded-[6px] p-5 shadow-2xs">
        <h3 className="font-bold text-base text-[#14202B]">Seasonal & Weekend Dynamic Yield Surcharges</h3>
        <p className="text-xs text-[#57636E] mt-1">
          Automated multipliers applied on base rates during weekend nights (Friday & Saturday) and peak heritage seasons.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
          <div className="p-4 bg-[#F4F5F2] border border-[#D8DCD5] rounded-[6px]">
            <div className="text-xs font-bold text-[#14202B]">Weekend Surcharge (Fri - Sat)</div>
            <div className="flex items-center gap-3 mt-2">
              <input
                type="number"
                step="0.05"
                min="1.0"
                max="2.0"
                value={weekendMultiplier}
                onChange={(e) => setWeekendMultiplier(Number(e.target.value))}
                className="w-24 h-9 px-2 text-sm font-mono border border-[#D8DCD5] rounded-[4px] bg-white font-bold"
              />
              <span className="text-xs text-[#57636E]">
                = {Math.round((weekendMultiplier - 1) * 100)}% surcharge above base
              </span>
            </div>
          </div>

          <div className="p-4 bg-[#F4F5F2] border border-[#D8DCD5] rounded-[6px]">
            <div className="text-xs font-bold text-[#14202B]">Peak Season Multiplier (Cochin Biennale / Dec-Jan)</div>
            <div className="flex items-center gap-3 mt-2">
              <input
                type="number"
                step="0.05"
                min="1.0"
                max="3.0"
                value={seasonalMultiplier}
                onChange={(e) => setSeasonalMultiplier(Number(e.target.value))}
                className="w-24 h-9 px-2 text-sm font-mono border border-[#D8DCD5] rounded-[4px] bg-white font-bold"
              />
              <span className="text-xs text-[#57636E]">
                = {Math.round((seasonalMultiplier - 1) * 100)}% seasonal increase
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Hotel Extras and Incidentals Pricing */}
      <div className="bg-white border border-[#D8DCD5] rounded-[6px] p-5 shadow-2xs">
        <div className="flex justify-between items-center mb-3">
          <div>
            <h3 className="font-bold text-base text-[#14202B]">Hotel Extras & Add-On Services</h3>
            <p className="text-xs text-[#57636E] mt-0.5">
              Configured incidentals and rates posted to guest folios
            </p>
          </div>
        </div>

        <div className="overflow-x-auto border border-[#D8DCD5] rounded-[6px]">
          <table className="w-full text-xs border-collapse">
            <thead>
              <tr className="bg-[#F4F5F2] border-b border-[#D8DCD5] text-[#57636E]">
                <th className="p-3 text-left">Service Name</th>
                <th className="p-3 text-left">Category</th>
                <th className="p-3 text-right font-mono">Price (₹)</th>
                <th className="p-3 text-right font-mono">GST Rate</th>
                <th className="p-3 text-right font-mono font-bold">Total with Tax (₹)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E8ECE5]">
              {extraServices.map((service) => {
                const tax = Math.round((service.price * service.gstRate) / 100);
                return (
                  <tr key={service.id} className="hover:bg-[#F9FAF8]">
                    <td className="p-3 font-semibold text-[#14202B]">{service.name}</td>
                    <td className="p-3 text-[#57636E]">{service.category}</td>
                    <td className="p-3 text-right font-mono">{formatRupee(service.price)}</td>
                    <td className="p-3 text-right font-mono">{service.gstRate}%</td>
                    <td className="p-3 text-right font-mono font-bold text-[#14202B]">
                      {formatRupee(service.price + tax)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
