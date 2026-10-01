import React, { useState } from 'react';
import { useHotel } from '../../context/HotelContext.tsx';
import { AuditAction, AuditLog } from '../../types/index.ts';
import { formatDateTime } from '../../utils/formatters.ts';
import { Table, Column } from '../common/Table.tsx';

export const AuditLogView: React.FC = () => {
  const { auditLogs } = useHotel();
  const [filterAction, setFilterAction] = useState<string>('all');

  const filteredLogs = auditLogs.filter((log) => {
    if (filterAction !== 'all' && log.action !== filterAction) return false;
    return true;
  });

  const columns: Column<AuditLog>[] = [
    {
      header: 'Timestamp',
      accessor: (l) => (
        <span className="font-mono text-xs text-[#57636E]">{formatDateTime(l.timestamp)}</span>
      ),
      tabular: true,
    },
    {
      header: 'Staff Member',
      accessor: (l) => (
        <div className="flex flex-col">
          <span className="font-semibold text-[#14202B]">{l.staffName}</span>
          <span className="text-[11px] text-[#57636E] uppercase font-bold">{l.staffRole}</span>
        </div>
      ),
    },
    {
      header: 'Action Type',
      accessor: (l) => (
        <span className="px-2 py-0.5 rounded-[4px] bg-[#F4F5F2] border border-[#D8DCD5] text-[11px] font-mono font-semibold text-[#0F5E63] uppercase">
          {l.action.replace('_', ' ')}
        </span>
      ),
    },
    {
      header: 'Audit Event Details',
      accessor: 'details',
      className: 'leading-relaxed text-xs',
    },
    {
      header: 'State Transition',
      accessor: (l) => {
        if (!l.previousValue && !l.newValue) return <span className="text-[#A0A79E]">-</span>;
        return (
          <div className="font-mono text-[11px] text-[#57636E]">
            <span className="text-[#B42318]">{l.previousValue || 'null'}</span>
            <span className="mx-1">→</span>
            <span className="text-[#15803D] font-bold">{l.newValue || 'null'}</span>
          </div>
        );
      },
    },
  ];

  return (
    <div className="flex flex-col gap-4 text-left w-full max-w-6xl mx-auto pb-12">
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-4 rounded-[6px] border border-[#D8DCD5]">
        <div>
          <h2 className="text-base font-bold text-[#14202B]">Immutable Operations Audit Log</h2>
          <div className="text-xs text-[#57636E] mt-0.5">
            Full compliance record of check-ins, check-outs, discounts, cancellations, and tariff modifications
          </div>
        </div>

        <div className="flex items-center gap-2 text-xs">
          <span className="font-semibold text-[#57636E]">Filter Action:</span>
          <select
            value={filterAction}
            onChange={(e) => setFilterAction(e.target.value)}
            className="h-8 px-2 rounded-[6px] border border-[#D8DCD5] bg-white font-semibold"
          >
            <option value="all">All Audit Events</option>
            <option value="check_in">Check-in</option>
            <option value="check_out">Check-out</option>
            <option value="cancellation">Cancellation</option>
            <option value="discount_applied">Discount Applied</option>
            <option value="refund">Refund</option>
            <option value="invoice_credit_note">Credit Note</option>
            <option value="room_status_change">Room Status Change</option>
            <option value="setting_update">Settings Modified</option>
          </select>
        </div>
      </div>

      <Table
        columns={columns}
        data={filteredLogs}
        keyExtractor={(l) => l.id}
        pageSize={12}
        emptyMessage="No audit logs match this filter."
      />
    </div>
  );
};
