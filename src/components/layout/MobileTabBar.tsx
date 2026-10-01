import React from 'react';
import { useHotel } from '../../context/HotelContext.tsx';

interface MobileTabBarProps {
  currentTab: string;
  onTabChange: (tab: string) => void;
}

export const MobileTabBar: React.FC<MobileTabBarProps> = ({ currentTab, onTabChange }) => {
  const { currentRole, housekeepingTasks } = useHotel();

  const pendingCount = housekeepingTasks.filter(
    (t) => t.status === 'pending' || t.status === 'in_progress'
  ).length;

  const getTabs = () => {
    switch (currentRole) {
      case 'housekeeping':
        return [
          { id: 'tasks', label: 'Tasks', badge: pendingCount },
          { id: 'rooms', label: 'Rooms' },
          { id: 'maintenance', label: 'Maintenance' },
        ];
      case 'guest':
        return [
          { id: 'book', label: 'Reserve' },
          { id: 'my_booking', label: 'My Booking' },
        ];
      case 'restaurant':
        return [
          { id: 'pos', label: 'New Order' },
          { id: 'kitchen', label: 'Kitchen' },
          { id: 'menu', label: 'Menu' },
        ];
      default:
        return [
          { id: 'tape_chart', label: 'Tape Chart' },
          { id: 'bookings', label: 'Bookings' },
          { id: 'folios', label: 'Folios' },
          { id: 'guests', label: 'Directory' },
        ];
    }
  };

  const tabs = getTabs();

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-[#FFFFFF] border-t border-[#D8DCD5] px-2 py-1.5 flex items-center justify-around z-40 shadow-md">
      {tabs.map((tab) => {
        const isActive = currentTab === tab.id;
        return (
          <button
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            className={`flex-1 py-1 px-2 flex flex-col items-center justify-center text-xs font-semibold rounded-[6px] transition-colors relative ${
              isActive ? 'text-[#0F5E63] bg-[#E7F3F3]' : 'text-[#57636E] hover:text-[#14202B]'
            }`}
          >
            <span>{tab.label}</span>
            {Boolean(tab.badge && tab.badge > 0) && (
              <span className="absolute -top-1 right-2 bg-[#B42318] text-white rounded-full text-[10px] w-4 h-4 flex items-center justify-center font-mono">
                {tab.badge}
              </span>
            )}
          </button>
        );
      })}
    </nav>
  );
};
