import { ChevronLeft, ChevronRight } from 'lucide-react';
import React from 'react';
import type { Pagination } from '../../types/place.types';

interface PaginationControlsProps {
  pagination: Pagination;
  onPageChange: (page: number) => void;
}

const PaginationControls: React.FC<PaginationControlsProps> = ({ pagination, onPageChange }) => {
  if (!pagination || pagination.totalPages <= 1) return null;

  return (
    <div className="p-6 border-t border-gray-200 flex items-center justify-between">
      <div className="text-sm text-gray-700">
        Hiển thị {((pagination.currentPage - 1) * pagination.itemsPerPage) + 1} - {Math.min(pagination.currentPage * pagination.itemsPerPage, pagination.totalItems)} 
        {' '}trong số {pagination.totalItems} kết quả
      </div>
      <div className="flex items-center gap-2">
        <button
          onClick={() => onPageChange(pagination.currentPage - 1)}
          disabled={!pagination.hasPrevPage}
          className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <ChevronLeft size={16} />
        </button>
        
        {Array.from({ length: Math.min(5, pagination.totalPages) }).map((_, index) => {
          let pageNumber;
          if (pagination.totalPages <= 5) {
            pageNumber = index + 1;
          } else if (pagination.currentPage <= 3) {
            pageNumber = index + 1;
          } else if (pagination.currentPage >= pagination.totalPages - 2) {
            pageNumber = pagination.totalPages - 4 + index;
          } else {
            pageNumber = pagination.currentPage - 2 + index;
          }
          
          return (
            <button
              key={pageNumber}
              onClick={() => onPageChange(pageNumber)}
              className={`px-3 py-2 rounded-lg ${
                pageNumber === pagination.currentPage
                  ? 'bg-blue-600 text-white'
                  : 'border border-gray-300 hover:bg-gray-50'
              }`}
            >
              {pageNumber}
            </button>
          );
        })}
        
        <button
          onClick={() => onPageChange(pagination.currentPage + 1)}
          disabled={!pagination.hasNextPage}
          className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <ChevronRight size={16} />
        </button>
      </div>
    </div>
  );
};

export default PaginationControls;
