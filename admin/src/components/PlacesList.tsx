import {
    ChevronLeft,
    ChevronRight,
    Edit,
    Eye,
    Filter,
    Plus,
    Search,
    Trash2
} from 'lucide-react';
import React, { useCallback, useEffect, useState } from 'react';
import { placesAPI } from '../services/api';

interface Place {
  _id: string;
  name: string;
  address: string;
  district: string;
  category: string;
  description: string;
  priceRange: { min: number; max: number };
  status: 'Published' | 'Draft' | 'Archived';
  isActive: boolean;
  averageRating: number;
  totalReviews: number;
  images: string[];
  aiTags: {
    space?: string[];
    mood?: string[];
    suitability?: string[];
  };
  updatedAt: string;
  createdBy?: { displayName: string; username: string };
  updatedBy?: { displayName: string; username: string };
}

interface Pagination {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  itemsPerPage: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

interface PlacesListProps {
  onCreatePlace: () => void;
  onEditPlace: (id: string) => void;
  onViewPlace: (id: string) => void;
}

const PlacesList: React.FC<PlacesListProps> = ({ 
  onCreatePlace, 
  onEditPlace, 
  onViewPlace 
}) => {
  const [places, setPlaces] = useState<Place[]>([]);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [loading, setLoading] = useState(false);
  const [selectedPlaces, setSelectedPlaces] = useState<string[]>([]);
  const [searchInput, setSearchInput] = useState('');
  const [showFilters, setShowFilters] = useState(false);

  // Filter and search states
  const [filters, setFilters] = useState({
    q: '',
    district: '',
    category: '',
    status: '',
    minPrice: '',
    maxPrice: '',
    mood: '',
    space: '',
    suitability: '',
    sortBy: 'updatedAt',
    sortOrder: 'desc',
    page: 1,
    limit: 20
  });

  // Options for dropdowns
  const [districts, setDistricts] = useState<string[]>([]);

  const loadOptions = useCallback(async () => {
    try {
      const districtsRes = await placesAPI.getDistricts();
      setDistricts(districtsRes.data);
    } catch (error) {
      console.error('Error loading options:', error);
    }
  }, []);

  const loadPlaces = useCallback(async () => {
    setLoading(true);
    try {
      // Convert string prices to numbers before sending
      const queryParams = {
        ...filters,
        minPrice: filters.minPrice ? parseInt(filters.minPrice) : undefined,
        maxPrice: filters.maxPrice ? parseInt(filters.maxPrice) : undefined
      };
      
      const response = await placesAPI.getAll(queryParams);
      setPlaces(response.data.places);
      setPagination(response.data.pagination);
    } catch (error) {
      console.error('Error loading places:', error);
    } finally {
      setLoading(false);
    }
  }, [filters]);

  // Debounce search input
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      setFilters(prev => ({ ...prev, q: searchInput, page: 1 }));
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [searchInput]);

  useEffect(() => {
    loadOptions();
  }, [loadOptions]);

  useEffect(() => {
    loadPlaces();
  }, [loadPlaces]);

  const handleFilterChange = (key: string, value: string | number) => {
    setFilters(prev => ({ 
      ...prev, 
      [key]: value,
      page: 1 // Reset to first page when filtering
    }));
    setSelectedPlaces([]); // Clear selections
  };

  const handlePageChange = (page: number) => {
    setFilters(prev => ({ ...prev, page }));
    setSelectedPlaces([]); // Clear selections when changing page
  };

  const handleSelectPlace = (placeId: string) => {
    setSelectedPlaces(prev => 
      prev.includes(placeId) 
        ? prev.filter(id => id !== placeId)
        : [...prev, placeId]
    );
  };

  const handleSelectAll = () => {
    setSelectedPlaces(prev => 
      prev.length === places.length 
        ? [] 
        : places.map(place => place._id)
    );
  };

  const handleBulkAction = async (operation: 'updateStatus' | 'delete' | 'toggleActive', updateData?: any) => {
    if (selectedPlaces.length === 0) return;
    
    try {
      await placesAPI.bulkUpdate({
        placeIds: selectedPlaces,
        operation,
        updateData
      });
      
      setSelectedPlaces([]);
      loadPlaces(); // Reload data
    } catch (error) {
      console.error('Bulk operation error:', error);
    }
  };

  const handleDelete = async (placeId: string) => {
    if (window.confirm('Bạn có chắc chắn muốn xóa địa điểm này?')) {
      try {
        await placesAPI.delete(placeId);
        loadPlaces();
      } catch (error) {
        console.error('Delete error:', error);
      }
    }
  };

  const getStatusBadge = (status: string, isActive: boolean) => {
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

  const formatPrice = (min: number, max: number) => {
    if (min === max) {
      return `${min.toLocaleString()}₫`;
    }
    return `${min.toLocaleString()}₫ - ${max.toLocaleString()}₫`;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  return (
    <div className="bg-white rounded-lg shadow">
      {/* Header */}
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Quản lý địa điểm</h1>
            <p className="text-gray-600 mt-1">
              {pagination && `${pagination.totalItems} địa điểm`}
            </p>
          </div>
          <button
            onClick={onCreatePlace}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center gap-2"
          >
            <Plus size={20} />
            Thêm địa điểm
          </button>
        </div>

        {/* Search and Filter Bar */}
        <div className="flex items-center gap-4 mb-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              placeholder="Tìm kiếm theo tên, địa chỉ..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
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
                onChange={(e) => handleFilterChange('district', e.target.value)}
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
                onChange={(e) => handleFilterChange('category', e.target.value)}
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
                onChange={(e) => handleFilterChange('status', e.target.value)}
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
                  handleFilterChange('sortBy', sortBy);
                  handleFilterChange('sortOrder', sortOrder);
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

        {/* Bulk Actions */}
        {selectedPlaces.length > 0 && (
          <div className="bg-blue-50 p-4 rounded-lg mt-4 flex items-center justify-between">
            <span className="text-blue-700 font-medium">
              Đã chọn {selectedPlaces.length} địa điểm
            </span>
            <div className="flex gap-2">
              <button
                onClick={() => handleBulkAction('updateStatus', { status: 'Published' })}
                className="px-3 py-1 bg-green-600 text-white rounded text-sm hover:bg-green-700"
              >
                Xuất bản
              </button>
              <button
                onClick={() => handleBulkAction('updateStatus', { status: 'Draft' })}
                className="px-3 py-1 bg-yellow-600 text-white rounded text-sm hover:bg-yellow-700"
              >
                Chuyển nháp
              </button>
              <button
                onClick={() => handleBulkAction('updateStatus', { status: 'Archived' })}
                className="px-3 py-1 bg-gray-600 text-white rounded text-sm hover:bg-gray-700"
              >
                Lưu trữ
              </button>
              <button
                onClick={() => handleBulkAction('delete')}
                className="px-3 py-1 bg-red-600 text-white rounded text-sm hover:bg-red-700"
              >
                Xóa
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="p-4 text-left">
                <input
                  type="checkbox"
                  checked={places.length > 0 && selectedPlaces.length === places.length}
                  onChange={handleSelectAll}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
              </th>
              <th className="p-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Hình ảnh
              </th>
              <th className="p-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Tên & Địa chỉ
              </th>
              <th className="p-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Quận
              </th>
              <th className="p-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Danh mục
              </th>
              <th className="p-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Giá
              </th>
              <th className="p-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                AI Tags
              </th>
              <th className="p-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Trạng thái
              </th>
              <th className="p-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Cập nhật
              </th>
              <th className="p-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Thao tác
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {loading ? (
              <tr>
                <td colSpan={10} className="p-8 text-center text-gray-500">
                  Đang tải...
                </td>
              </tr>
            ) : places.length === 0 ? (
              <tr>
                <td colSpan={10} className="p-8 text-center text-gray-500">
                  Không có địa điểm nào
                </td>
              </tr>
            ) : (
              places.map((place) => (
                <tr key={place._id} className="hover:bg-gray-50">
                  <td className="p-4">
                    <input
                      type="checkbox"
                      checked={selectedPlaces.includes(place._id)}
                      onChange={() => handleSelectPlace(place._id)}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                  </td>
                  <td className="p-4">
                    {place.images && place.images.length > 0 ? (
                      <img
                        src={place.images[0]}
                        alt={place.name}
                        className="w-12 h-12 object-cover rounded-lg"
                      />
                    ) : (
                      <div className="w-12 h-12 bg-gray-200 rounded-lg flex items-center justify-center">
                        <span className="text-gray-400 text-xs">No image</span>
                      </div>
                    )}
                  </td>
                  <td className="p-4">
                    <div>
                      <div className="font-medium text-gray-900">{place.name}</div>
                      <div className="text-sm text-gray-500 truncate max-w-xs">
                        {place.address}
                      </div>
                    </div>
                  </td>
                  <td className="p-4 text-sm text-gray-900">{place.district}</td>
                  <td className="p-4 text-sm text-gray-900">{place.category}</td>
                  <td className="p-4 text-sm text-gray-900">
                    {formatPrice(place.priceRange.min, place.priceRange.max)}
                  </td>
                  <td className="p-4">
                    <div className="flex flex-wrap gap-1 max-w-xs">
                      {place.aiTags.mood?.slice(0, 2).map(tag => (
                        <span key={tag} className="px-2 py-1 bg-blue-100 text-blue-600 rounded text-xs">
                          {tag}
                        </span>
                      ))}
                      {(place.aiTags.mood?.length || 0) > 2 && (
                        <span className="px-2 py-1 bg-gray-100 text-gray-600 rounded text-xs">
                          +{(place.aiTags.mood?.length || 0) - 2}
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="p-4">
                    {getStatusBadge(place.status, place.isActive)}
                  </td>
                  <td className="p-4 text-sm text-gray-500">
                    {formatDate(place.updatedAt)}
                  </td>
                  <td className="p-4">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => onViewPlace(place._id)}
                        className="p-1 text-gray-400 hover:text-blue-600"
                        title="Xem chi tiết"
                      >
                        <Eye size={16} />
                      </button>
                      <button
                        onClick={() => onEditPlace(place._id)}
                        className="p-1 text-gray-400 hover:text-green-600"
                        title="Chỉnh sửa"
                      >
                        <Edit size={16} />
                      </button>
                      <button
                        onClick={() => handleDelete(place._id)}
                        className="p-1 text-gray-400 hover:text-red-600"
                        title="Xóa"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {pagination && pagination.totalPages > 1 && (
        <div className="p-6 border-t border-gray-200 flex items-center justify-between">
          <div className="text-sm text-gray-700">
            Hiển thị {((pagination.currentPage - 1) * pagination.itemsPerPage) + 1} - {Math.min(pagination.currentPage * pagination.itemsPerPage, pagination.totalItems)} 
            {' '}trong số {pagination.totalItems} kết quả
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => handlePageChange(pagination.currentPage - 1)}
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
                  onClick={() => handlePageChange(pageNumber)}
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
              onClick={() => handlePageChange(pagination.currentPage + 1)}
              disabled={!pagination.hasNextPage}
              className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default PlacesList;