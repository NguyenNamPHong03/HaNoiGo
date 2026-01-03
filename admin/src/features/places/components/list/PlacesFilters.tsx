import { Filter, Search } from 'lucide-react';
import React, { useState } from 'react';
import type { PlaceFilters } from '../../types/place.types';

interface PlacesFiltersProps {
  filters: PlaceFilters;
  onFilterChange: (key: string, value: string | number) => void;
  searchInput: string;
  onSearchChange: (value: string) => void;
  districts: string[];
}

const PlacesFiltersComponent: React.FC<PlacesFiltersProps> = ({
  filters,
  onFilterChange,
  searchInput,
  onSearchChange,
  districts
}) => {
  const [showFilters, setShowFilters] = useState(false);

  return (
    <>
      {/* Search and Filter Bar */}
      <div className="flex items-center gap-4 mb-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
          <input
            type="text"
            placeholder="Tìm kiếm theo tên, địa chỉ..."
            value={searchInput}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
        <button
          onClick={() => setShowFilters(!showFilters)}
          className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 flex items-center gap-2"
        >
          <Filter size={20} />
          Bộ lọc
        </button>
      </div>

      {/* Advanced Filters */}
      {showFilters && (
        <div className="bg-gray-50 p-4 rounded-lg grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Quận</label>
            <select
              value={filters.district}
              onChange={(e) => onFilterChange('district', e.target.value)}
              className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Tất cả quận</option>
              {districts.map(district => (
                <option key={district} value={district}>{district}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Danh mục</label>
            <select
              value={filters.category}
              onChange={(e) => onFilterChange('category', e.target.value)}
              className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Tất cả danh mục</option>
              <option value="Ăn uống">Ăn uống</option>
              <option value="Vui chơi">Vui chơi</option>
              <option value="Mua sắm">Mua sắm</option>
              <option value="Dịch vụ">Dịch vụ</option>
              <option value="Khác">Khác</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Trạng thái</label>
            <select
              value={filters.status}
              onChange={(e) => onFilterChange('status', e.target.value)}
              className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Tất cả trạng thái</option>
              <option value="Published">Đã xuất bản</option>
              <option value="Draft">Bản nháp</option>
              <option value="Archived">Lưu trữ</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Sắp xếp</label>
            <select
              value={`${filters.sortBy}-${filters.sortOrder}`}
              onChange={(e) => {
                const [sortBy, sortOrder] = e.target.value.split('-');
                onFilterChange('sortBy', sortBy);
                onFilterChange('sortOrder', sortOrder);
              }}
              className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="updatedAt-desc">Cập nhật mới nhất</option>
              <option value="updatedAt-asc">Cập nhật cũ nhất</option>
              <option value="name-asc">Tên A-Z</option>
              <option value="name-desc">Tên Z-A</option>
              <option value="averageRating-desc">Đánh giá cao nhất</option>
              <option value="averageRating-asc">Đánh giá thấp nhất</option>
            </select>
          </div>
        </div>
      )}
    </>
  );
};

export default PlacesFiltersComponent;
