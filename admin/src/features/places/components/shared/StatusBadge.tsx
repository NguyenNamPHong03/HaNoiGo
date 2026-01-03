import React from 'react';

interface StatusBadgeProps {
  status: 'Published' | 'Draft' | 'Archived';
  isActive: boolean;
}

const StatusBadge: React.FC<StatusBadgeProps> = ({ status, isActive }) => {
  if (!isActive) {
    return <span className="px-2 py-1 bg-gray-100 text-gray-600 rounded-full text-xs">Tạm ngưng</span>;
  }

  switch (status) {
    case 'Published':
      return <span className="px-2 py-1 bg-green-100 text-green-600 rounded-full text-xs">Đã xuất bản</span>;
    case 'Draft':
      return <span className="px-2 py-1 bg-yellow-100 text-yellow-600 rounded-full text-xs">Bản nháp</span>;
    case 'Archived':
      return <span className="px-2 py-1 bg-gray-100 text-gray-600 rounded-full text-xs">Lưu trữ</span>;
    default:
      return <span className="px-2 py-1 bg-gray-100 text-gray-600 rounded-full text-xs">{status}</span>;
  }
};

export default StatusBadge;
