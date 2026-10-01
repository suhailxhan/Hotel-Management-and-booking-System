import React from 'react';
import {
  RoomStatus,
  BookingStatus,
  OrderStatus,
  HousekeepingTaskStatus,
  HousekeepingPriority,
  MaintenancePriority,
  MaintenanceStatus,
} from '../../types/index.ts';

type AnyStatus =
  | RoomStatus
  | BookingStatus
  | OrderStatus
  | HousekeepingTaskStatus
  | HousekeepingPriority
  | MaintenancePriority
  | MaintenanceStatus
  | 'open'
  | 'settled'
  | 'closed'
  | 'paid'
  | 'credit'
  | 'pending'
  | 'approved'
  | 'rejected';

interface StatusLabelProps {
  status: AnyStatus;
  label?: string;
  size?: 'sm' | 'md';
}

export const StatusLabel: React.FC<StatusLabelProps> = ({ status, label, size = 'sm' }) => {
  const sizeClasses = size === 'sm' ? 'px-2 py-0.5 text-xs font-semibold' : 'px-2.5 py-1 text-xs font-bold';

  // Distinct, high-contrast solid fills with white or high contrast text label
  switch (status) {
    // Room Statuses
    case 'clean':
      return (
        <span className={`inline-flex items-center rounded-[6px] bg-[#15803D] text-white ${sizeClasses}`}>
          {label || 'Clean'}
        </span>
      );
    case 'dirty':
      return (
        <span className={`inline-flex items-center rounded-[6px] bg-[#B45309] text-white ${sizeClasses}`}>
          {label || 'Dirty'}
        </span>
      );
    case 'in_progress':
      return (
        <span className={`inline-flex items-center rounded-[6px] bg-[#0E7490] text-white ${sizeClasses}`}>
          {label || 'In Progress'}
        </span>
      );
    case 'inspected':
      return (
        <span className={`inline-flex items-center rounded-[6px] bg-[#1E293B] text-white ${sizeClasses}`}>
          {label || 'Inspected'}
        </span>
      );
    case 'out_of_service':
      return (
        <span className={`inline-flex items-center rounded-[6px] bg-[#B91C1C] text-white ${sizeClasses}`}>
          {label || 'Out of Service'}
        </span>
      );

    // Booking Statuses
    case 'reserved':
      return (
        <span className={`inline-flex items-center rounded-[6px] bg-[#0F5E63] text-white ${sizeClasses}`}>
          {label || 'Reserved'}
        </span>
      );
    case 'checked_in':
      return (
        <span className={`inline-flex items-center rounded-[6px] bg-[#166534] text-white ${sizeClasses}`}>
          {label || 'Checked In'}
        </span>
      );
    case 'checked_out':
      return (
        <span className={`inline-flex items-center rounded-[6px] bg-[#475569] text-white ${sizeClasses}`}>
          {label || 'Checked Out'}
        </span>
      );
    case 'cancelled':
      return (
        <span className={`inline-flex items-center rounded-[6px] bg-[#991B1B] text-white ${sizeClasses}`}>
          {label || 'Cancelled'}
        </span>
      );
    case 'no_show':
      return (
        <span className={`inline-flex items-center rounded-[6px] bg-[#7F1D1D] text-white ${sizeClasses}`}>
          {label || 'No Show'}
        </span>
      );

    // Approvals / Settlement
    case 'approved':
    case 'paid':
    case 'settled':
    case 'completed':
    case 'delivered':
      return (
        <span className={`inline-flex items-center rounded-[6px] bg-[#15803D] text-white ${sizeClasses}`}>
          {label || status.toUpperCase()}
        </span>
      );
    case 'pending':
    case 'open':
    case 'received':
    case 'preparing':
      return (
        <span className={`inline-flex items-center rounded-[6px] bg-[#D97706] text-white ${sizeClasses}`}>
          {label || status.toUpperCase()}
        </span>
      );
    case 'ready':
      return (
        <span className={`inline-flex items-center rounded-[6px] bg-[#0D9488] text-white ${sizeClasses}`}>
          {label || 'READY'}
        </span>
      );
    case 'rejected':
      return (
        <span className={`inline-flex items-center rounded-[6px] bg-[#B42318] text-white ${sizeClasses}`}>
          {label || 'REJECTED'}
        </span>
      );
    case 'urgent':
      return (
        <span className={`inline-flex items-center rounded-[6px] bg-[#DC2626] text-white ${sizeClasses}`}>
          {label || 'URGENT'}
        </span>
      );
    case 'high':
      return (
        <span className={`inline-flex items-center rounded-[6px] bg-[#EA580C] text-white ${sizeClasses}`}>
          {label || 'HIGH'}
        </span>
      );
    case 'normal':
    case 'low':
      return (
        <span className={`inline-flex items-center rounded-[6px] bg-[#64748B] text-white ${sizeClasses}`}>
          {label || status.toUpperCase()}
        </span>
      );

    default:
      return (
        <span className={`inline-flex items-center rounded-[6px] bg-[#475569] text-white ${sizeClasses}`}>
          {label || String(status)}
        </span>
      );
  }
};
