import React, { useState } from 'react';
import { useHotel } from '../../context/HotelContext.tsx';
import { StaffRole } from '../../types/index.ts';
import { formatDate } from '../../utils/formatters.ts';
import { Button } from '../common/Button.tsx';

interface AppHeaderProps {
  onOpenNewBooking: () => void;
  onOpenGuestLookup: () => void;
  onOpenShiftSummary: () => void;
}

export const AppHeader: React.FC<AppHeaderProps> = ({
  onOpenNewBooking,
  onOpenGuestLookup,
  onOpenShiftSummary,
}) => {
  const {
    settings,
    currentUser,
    currentRole,
    setCurrentRole,
    users,
    switchUser,
    resetToSeedData,
  } = useHotel();

  const [isRoleDropdownOpen, setIsRoleDropdownOpen] = useState(false);

  const roleLabels: Record<StaffRole, string> = {
    front_desk: 'Front Desk',
    manager: 'Manager',
    housekeeping: 'Housekeeping',
    restaurant: 'Restaurant Staff',
    guest: 'Guest Portal',
  };

  const handleRoleSelect = (role: StaffRole) => {
    setCurrentRole(role);
    setIsRoleDropdownOpen(false);
  };

  const todayStr = formatDate(new Date());

  return (
    <header className="w-full bg-[#FFFFFF] border-b border-[#D8DCD5] px-4 md:px-6 py-3 flex flex-wrap items-center justify-between gap-3 sticky top-0 z-40">
      {/* Brand & Hotel Info */}
      <div className="flex items-center gap-4">
        <div>
          <h1 className="text-base md:text-lg font-bold text-[#14202B] leading-none tracking-tight">
            {settings.hotelName}
          </h1>
          <div className="flex items-center gap-2 mt-1 text-xs text-[#57636E]">
            <span>{settings.hotelCity}, {settings.hotelState}</span>
            <span>•</span>
            <span className="font-mono text-[#14202B] font-semibold">{todayStr}</span>
            <span>•</span>
            <span className="font-mono text-[#57636E]">GSTIN: {settings.hotelGstin}</span>
          </div>
        </div>
      </div>

      {/* Right controls: Quick Actions & Role Switcher */}
      <div className="flex items-center flex-wrap gap-2">
        {currentRole === 'front_desk' && (
          <>
            <Button size="sm" variant="primary" onClick={onOpenNewBooking}>
              New Booking
            </Button>
            <Button size="sm" variant="secondary" onClick={onOpenGuestLookup}>
              Guest Search
            </Button>
            <Button size="sm" variant="secondary" onClick={onOpenShiftSummary}>
              Shift Summary
            </Button>
          </>
        )}

        {currentRole === 'manager' && (
          <Button size="sm" variant="secondary" onClick={resetToSeedData}>
            Reset Seed Data
          </Button>
        )}

        {/* Role Switcher Pill */}
        <div className="relative">
          <div className="flex items-center rounded-[6px] border border-[#D8DCD5] bg-[#F4F5F2] p-1">
            <span className="text-xs font-semibold text-[#57636E] px-2">Role:</span>
            <select
              value={currentRole}
              onChange={(e) => handleRoleSelect(e.target.value as StaffRole)}
              className="text-xs font-bold text-[#0F5E63] bg-transparent border-none focus:outline-none cursor-pointer pr-2"
              aria-label="Select staff role"
            >
              <option value="front_desk">Front Desk</option>
              <option value="manager">Manager</option>
              <option value="housekeeping">Housekeeping</option>
              <option value="restaurant">Restaurant Staff</option>
              <option value="guest">Guest Portal</option>
            </select>
          </div>
        </div>

        {/* Current User details */}
        <div className="hidden lg:flex items-center pl-2 border-l border-[#D8DCD5] text-left">
          <div className="flex flex-col text-xs">
            <span className="font-bold text-[#14202B] leading-none">{currentUser.name}</span>
            <span className="text-[#57636E] mt-0.5">{roleLabels[currentRole]}</span>
          </div>
        </div>
      </div>
    </header>
  );
};
