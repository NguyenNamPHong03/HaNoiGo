import { Plus } from 'lucide-react';
import React, { useCallback, useEffect, useState } from 'react';
import { placesApi } from '../api/places.api';
import PaginationControls from '../components/list/PaginationControls';
import PlacesFiltersComponent from '../components/list/PlacesFilters';
import PlacesTable from '../components/list/PlacesTable';
import type { Pagination, Place, PlaceFilters } from '../types/place.types';

interface PlacesListPageProps {
  onCreatePlace: () => void;
  onEditPlace: (id: string) => void;
  onViewPlace: (id: string) => void;
}

const PlacesListPage: React.FC<PlacesListPageProps> = ({ 
  onCreatePlace, 
  onEditPlace, 
  onViewPlace 
}) => {
  const [places, setPlaces] = useState<Place[]>([]);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [loading, setLoading] = useState(false);
  const [selectedPlaces, setSelectedPlaces] = useState<string[]>([]);
  const [searchInput, setSearchInput] = useState('');
  const [districts, setDistricts] = useState<string[]>([]);

  // Filter states
  const [filters, setFilters] = useState<PlaceFilters>({
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

  const loadOptions = useCallback(async () => {
    try {
      const districtsRes = await placesApi.getDistricts();
      setDistricts(districtsRes.data);
    } catch (error) {
      console.error('Error loading options:', error);
    }
  }, []);

  const loadPlaces = useCallback(async () => {
    setLoading(true);
    try {
      const queryParams: any = {
        ...filters,
        minPrice: filters.minPrice ? parseInt(String(filters.minPrice)) : undefined,
        maxPrice: filters.maxPrice ? parseInt(String(filters.maxPrice)) : undefined
      };
      
      const response = await placesApi.getAll(queryParams);
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
      await placesApi.bulkUpdate({
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
        await placesApi.delete(placeId);
        loadPlaces();
      } catch (error) {
        console.error('Delete error:', error);
      }
    }
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

        {/* Filters */}
        <PlacesFiltersComponent
          filters={filters}
          onFilterChange={handleFilterChange}
          searchInput={searchInput}
          onSearchChange={setSearchInput}
          districts={districts}
        />

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
      <PlacesTable
        places={places}
        loading={loading}
        selectedPlaces={selectedPlaces}
        onSelectPlace={handleSelectPlace}
        onSelectAll={handleSelectAll}
        onView={onViewPlace}
        onEdit={onEditPlace}
        onDelete={handleDelete}
      />

      {/* Pagination */}
      {pagination && (
        <PaginationControls
          pagination={pagination}
          onPageChange={handlePageChange}
        />
      )}
    </div>
  );
};

export default PlacesListPage;
