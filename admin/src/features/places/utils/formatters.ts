// Format utilities for Places feature

export const formatPrice = (min: number, max: number): string => {
  if (min === max) {
    return `${min.toLocaleString()}₫`;
  }
  return `${min.toLocaleString()}₫ - ${max.toLocaleString()}₫`;
};

export const formatDate = (dateString: string): string => {
  return new Date(dateString).toLocaleDateString('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  });
};

export const formatDateTime = (dateString: string): string => {
  return new Date(dateString).toLocaleDateString('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

export const getStatusBadge = (status: string, isActive: boolean) => {
  if (!isActive) {
    return { text: 'Tạm ngưng', className: 'px-2 py-1 bg-gray-100 text-gray-600 rounded-full text-xs' };
  }

  switch (status) {
    case 'Published':
      return { text: 'Đã xuất bản', className: 'px-2 py-1 bg-green-100 text-green-600 rounded-full text-xs' };
    case 'Draft':
      return { text: 'Bản nháp', className: 'px-2 py-1 bg-yellow-100 text-yellow-600 rounded-full text-xs' };
    case 'Archived':
      return { text: 'Lưu trữ', className: 'px-2 py-1 bg-gray-100 text-gray-600 rounded-full text-xs' };
    default:
      return { text: status, className: 'px-2 py-1 bg-gray-100 text-gray-600 rounded-full text-xs' };
  }
};
