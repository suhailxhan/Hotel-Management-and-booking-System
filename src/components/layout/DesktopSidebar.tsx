import React from 'react';
import { useHotel } from '../../context/HotelContext.tsx';
import { StaffRole } from '../../types/index.ts';

interface DesktopSidebarProps {
  currentTab: string;
  onTabChange: (tab: string) => void;
}

export const DesktopSidebar: React.FC<DesktopSidebarProps> = ({ currentTab, onTabChange }) => {
  const { currentRole, housekeepingTasks, approvals } = useHotel();

  const pendingHousekeepingCount = housekeepingTasks.filter(
    (t) => t.status === 'pending' || t.status === 'in_progress'
  ).length;

  const pendingApprovalsCount = approvals.filter((a) => a.status === 'pending').length;

  interface NavItem {
    id: string;
    label: string;
    badge?: number;
  }

  const getNavItems = (role: StaffRole): NavItem[] => {
    switch (role) {
      case 'front_desk':
        return [
          { id: 'tape_chart', label: 'Tape Chart (Grid)' },
          { id: 'bookings', label: 'Bookings & Arrivals' },
          { id: 'folios', label: 'Folios & Billing' },
          { id: 'guests', label: 'Guest Directory' },
          { id: 'housekeeping_overview', label: 'Housekeeping Status' },
        ];
      case 'manager':
        return [
          { id: 'dashboard', label: 'Executive Dashboard' },
          { id: 'rooms', label: 'Room Types & Rooms' },
          { id: 'rates', label: 'Seasonal Rates & Taxes' },
          { id: 'approvals', label: 'Approvals & Discounts', badge: pendingApprovalsCount },
          { id: 'reports', label: 'Reports & Exports' },
          { id: 'staff', label: 'Staff Accounts' },
          { id: 'settings', label: 'Hotel & GST Settings' },
          { id: 'audit', label: 'Audit Log' },
        ];
      case 'housekeeping':
        return [
          { id: 'tasks', label: 'Task List (Departures First)', badge: pendingHousekeepingCount },
          { id: 'rooms', label: 'Room Status Board' },
          { id: 'maintenance', label: 'Maintenance Issues' },
        ];
      case 'restaurant':
        return [
          { id: 'pos', label: 'Order & Room Billing' },
          { id: 'kitchen', label: 'Kitchen Display (KDS)' },
          { id: 'menu', label: 'Menu Items & Rates' },
        ];
      case 'guest':
        return [
          { id: 'book', label: 'Book a Room' },
          { id: 'my_booking', label: 'My Reservation' },
        ];
      default:
        return [];
    }
  };

  const navItems = getNavItems(currentRole);

  return (
    <aside className="w-60 bg-[#FFFFFF] border-r border-[#D8DCD5] min-h-[calc(100vh-61px)] p-4 flex flex-col justify-between shrink-0 text-left">
      <div className="flex flex-col gap-1">
        <div className="px-3 py-2 text-xs font-bold uppercase tracking-wider text-[#57636E]">
          Navigation
        </div>
        {navItems.map((item) => {
          const isActive = currentTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onTabChange(item.id)}
              className={`flex items-center justify-between px-3 py-2 rounded-[6px] text-sm font-medium transition-colors duration-100 cursor-pointer ${
                isActive
                  ? 'bg-[#0F5E63] text-white'
                  : 'text-[#14202B] hover:bg-[#F4F5F2]'
              }`}
            >
              <span>{item.label}</span>
              {Boolean(item.badge && item.badge > 0) && (
                <span
                  className={`text-xs px-1.5 py-0.2 rounded-[6px] font-mono font-bold ${
                    isActive ? 'bg-white text-[#0F5E63]' : 'bg-[#B42318] text-white'
                  }`}
                >
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Footer Info in Sidebar */}
      <div className="pt-4 border-t border-[#D8DCD5] text-xs text-[#57636E]">
        <div className="font-semibold text-[#14202B]">Quiet Hospitality PMS</div>
        <div>Compliant with Indian GST & Sac codes</div>
      </div>
    </aside>
  );
};
