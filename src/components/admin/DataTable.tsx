// src/components/admin/DataTable.tsx
import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface Column {
  key: string;
  label: string;
  render?: (value: any, row: any) => React.ReactNode;
}

interface DataTableProps {
  columns: Column[];
  data: any[];
  loading?: boolean;
  pagination?: {
    currentPage: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
  };
  onPageChange?: (page: number) => void;
}

export const DataTable: React.FC<DataTableProps> = ({
  columns,
  data,
  loading,
  pagination,
  onPageChange,
}) => {
  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              {columns.map((col) => (
                <th
                  key={col.key}
                  className="text-left py-3 px-4 text-sm font-semibold text-gray-700"
                >
                  {col.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={columns.length} className="text-center py-12">
                  <div className="flex justify-center">
                    <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600"></div>
                  </div>
                </td>
              </tr>
            ) : data.length === 0 ? (
              <tr>
                <td
                  colSpan={columns.length}
                  className="text-center py-12 text-gray-500"
                >
                  No data available
                </td>
              </tr>
            ) : (
              data.map((row, idx) => (
                <tr key={idx} className="border-b border-gray-100 hover:bg-gray-50">
                  {columns.map((col) => (
                    <td key={col.key} className="py-3 px-4 text-sm text-gray-900">
                      {col.render ? col.render(row[col.key], row) : row[col.key]}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {pagination && (
        <div className="flex items-center justify-between px-4 py-3 bg-gray-50 border-t border-gray-200">
          <p className="text-sm text-gray-600">
            Page {pagination.currentPage} of {pagination.totalPages}
          </p>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => onPageChange?.(pagination.currentPage - 1)}
              disabled={!pagination.hasPrevPage}
              className="p-2 rounded-lg border border-gray-200 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ChevronLeft size={18} />
            </button>
            <button
              onClick={() => onPageChange?.(pagination.currentPage + 1)}
              disabled={!pagination.hasNextPage}
              className="p-2 rounded-lg border border-gray-200 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ChevronRight size={18} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
