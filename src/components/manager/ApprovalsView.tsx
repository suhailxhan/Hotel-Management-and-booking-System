import React from 'react';
import { useHotel } from '../../context/HotelContext.tsx';
import { ApprovalRequest } from '../../types/index.ts';
import { formatRupee, formatDateTime } from '../../utils/formatters.ts';
import { StatusLabel } from '../common/StatusLabel.tsx';
import { Button } from '../common/Button.tsx';

export const ApprovalsView: React.FC = () => {
  const { approvals, respondToApproval } = useHotel();

  return (
    <div className="flex flex-col gap-5 text-left w-full max-w-4xl mx-auto pb-12">
      <div className="bg-white p-4 rounded-[6px] border border-[#D8DCD5]">
        <h2 className="text-base font-bold text-[#14202B]">Manager Authorizations & Approvals</h2>
        <div className="text-xs text-[#57636E] mt-0.5">
          Review exceptions, corporate discounts exceeding limits, manual refunds, and invoice adjustments
        </div>
      </div>

      <div className="flex flex-col gap-3">
        {approvals.length === 0 ? (
          <div className="bg-white border border-[#D8DCD5] rounded-[6px] p-8 text-center text-sm text-[#57636E]">
            No pending approval requests.
          </div>
        ) : (
          approvals.map((req) => (
            <div
              key={req.id}
              className="bg-white border border-[#D8DCD5] rounded-[6px] p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs"
            >
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-bold text-sm text-[#14202B] uppercase">
                    {req.type.replace('_', ' ')}
                  </span>
                  <span className="font-mono font-bold text-sm text-[#0F5E63]">
                    {formatRupee(req.amount)}
                  </span>
                  <StatusLabel status={req.status} />
                </div>
                <p className="text-xs text-[#14202B] mt-1.5">{req.details}</p>
                <div className="text-[11px] text-[#57636E] mt-1">
                  Requested by: <span className="font-semibold">{req.requestedBy}</span> on{' '}
                  <span className="font-mono">{formatDateTime(req.requestedAt)}</span>
                  {req.reviewedBy && (
                    <span className="ml-2">
                      • Reviewed by: {req.reviewedBy} ({formatDateTime(req.reviewedAt)})
                    </span>
                  )}
                </div>
              </div>

              {req.status === 'pending' && (
                <div className="flex items-center gap-2 shrink-0">
                  <Button
                    size="sm"
                    variant="primary"
                    onClick={() => respondToApproval(req.id, true)}
                  >
                    Approve
                  </Button>
                  <Button
                    size="sm"
                    variant="danger"
                    onClick={() => respondToApproval(req.id, false)}
                  >
                    Reject
                  </Button>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
};
