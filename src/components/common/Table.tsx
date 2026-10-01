import React, { useState } from 'react';

export interface Column<T> {
  header: string;
  accessor?: keyof T | ((row: T) => React.ReactNode);
  className?: string;
  headerClassName?: string;
  align?: 'left' | 'center' | 'right';
  tabular?: boolean;
}

interface TableProps<T> {
  columns: Column<T>[];
  data: T[];
  keyExtractor: (row: T) => string;
  pageSize?: number;
  emptyMessage?: string;
  onRowClick?: (row: T) => void;
}

export function Table<T>({
  columns,
  data,
  keyExtractor,
  pageSize = 10,
  emptyMessage = 'No records found to display.',
  onRowClick,
}: TableProps<T>) {
  const [currentPage, setCurrentPage] = useState(1);

  const totalPages = Math.ceil(data.length / pageSize) || 1;
  const startIndex = (currentPage - 1) * pageSize;
  const currentData = data.slice(startIndex, startIndex + pageSize);

  const handlePrev = () => setCurrentPage((p) => Math.max(1, p - 1));
  const handleNext = () => setCurrentPage((p) => Math.min(totalPages, p + 1));

  return (
    <div className="w-full flex flex-col border border-[#D8DCD5] rounded-[6px] bg-white overflow-hidden text-left">
      <div className="overflow-x-auto">
        <table className="w-full text-sm text-[#14202B] border-collapse">
          <thead>
            <tr className="border-b border-[#D8DCD5] bg-[#F4F5F2]">
              {columns.map((col, idx) => (
                <th
                  key={idx}
                  className={`py-2.5 px-3 text-xs font-semibold text-[#57636E] uppercase tracking-wider ${
                    col.align === 'right'
                      ? 'text-right'
                      : col.align === 'center'
                      ? 'text-center'
                      : 'text-left'
                  } ${col.headerClassName || ''}`}
                >
                  {col.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-[#E8ECE5]">
            {currentData.length === 0 ? (
              <tr>
                <td
                  colSpan={columns.length}
                  className="py-8 text-center text-sm text-[#57636E]"
                >
                  {emptyMessage}
                </td>
              </tr>
            ) : (
              currentData.map((row) => (
                <tr
                  key={keyExtractor(row)}
                  onClick={() => onRowClick && onRowClick(row)}
                  className={`hover:bg-[#F8F9F7] transition-colors duration-100 ${
                    onRowClick ? 'cursor-pointer' : ''
                  }`}
                >
                  {columns.map((col, cIdx) => {
                    let content: React.ReactNode;
                    if (typeof col.accessor === 'function') {
                      content = col.accessor(row);
                    } else if (col.accessor) {
                      content = row[col.accessor] as unknown as React.ReactNode;
                    } else {
                      content = null;
                    }

                    return (
                      <td
                        key={cIdx}
                        className={`py-2.5 px-3 ${
                          col.align === 'right'
                            ? 'text-right'
                            : col.align === 'center'
                            ? 'text-center'
                            : 'text-left'
                        } ${col.tabular ? 'font-mono' : ''} ${col.className || ''}`}
                      >
                        {content}
                      </td>
                    );
                  })}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Bar */}
      {data.length > pageSize && (
        <div className="flex items-center justify-between px-4 py-2.5 border-t border-[#D8DCD5] bg-[#F4F5F2] text-xs text-[#57636E]">
          <div>
            Showing <span className="font-mono font-semibold text-[#14202B]">{startIndex + 1}</span> to{' '}
            <span className="font-mono font-semibold text-[#14202B]">
              {Math.min(startIndex + pageSize, data.length)}
            </span>{' '}
            of <span className="font-mono font-semibold text-[#14202B]">{data.length}</span> records
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrev}
              disabled={currentPage === 1}
              className="px-2.5 py-1 rounded-[6px] border border-[#D8DCD5] bg-white text-[#14202B] hover:bg-[#E8ECE5] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              Previous
            </button>
            <span className="font-mono">
              Page {currentPage} of {totalPages}
            </span>
            <button
              onClick={handleNext}
              disabled={currentPage === totalPages}
              className="px-2.5 py-1 rounded-[6px] border border-[#D8DCD5] bg-white text-[#14202B] hover:bg-[#E8ECE5] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
