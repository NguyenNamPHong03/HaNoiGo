import { Edit, Eye, ImageIcon, Trash2 } from 'lucide-react';
import React from 'react';
import type { Place } from '../../types/place.types';
import { formatDate, formatPrice } from '../../utils/formatters';
import StatusBadge from '../shared/StatusBadge';

interface PlacesTableProps {
  places: Place[];
  loading: boolean;
  selectedPlaces: string[];
  onSelectPlace: (placeId: string) => void;
  onSelectAll: () => void;
  onView: (placeId: string) => void;
  onEdit: (placeId: string) => void;
  onDelete: (placeId: string) => void;
}

const PlacesTable: React.FC<PlacesTableProps> = ({
  places,
  loading,
  selectedPlaces,
  onSelectPlace,
  onSelectAll,
  onView,
  onEdit,
  onDelete
}) => {
  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead className="bg-gray-50">
          <tr>
            <th className="p-4 text-left">
              <input
                type="checkbox"
                checked={places.length > 0 && selectedPlaces.length === places.length}
                onChange={onSelectAll}
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
                    onChange={() => onSelectPlace(place._id)}
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
                      <ImageIcon size={20} className="text-gray-400" />
                    </div>
                  )}
                </td>
                <td className="p-4">
                  <div>
                    <div className="font-medium text-gray-900">{place.name}</div>
                    <div className="text-sm text-gray-500">{place.address}</div>
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
                      <span key={tag} className="px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs">
                        {tag}
                      </span>
                    ))}
                    {place.aiTags.space?.slice(0, 1).map(tag => (
                      <span key={tag} className="px-2 py-1 bg-blue-100 text-blue-700 rounded-full text-xs">
                        {tag}
                      </span>
                    ))}
                  </div>
                </td>
                <td className="p-4">
                  <StatusBadge status={place.status} isActive={place.isActive} />
                </td>
                <td className="p-4 text-sm text-gray-500">
                  {formatDate(place.updatedAt)}
                </td>
                <td className="p-4">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => onView(place._id)}
                      className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg"
                      title="Xem chi tiết"
                    >
                      <Eye size={16} />
                    </button>
                    <button
                      onClick={() => onEdit(place._id)}
                      className="p-2 text-green-600 hover:bg-green-50 rounded-lg"
                      title="Chỉnh sửa"
                    >
                      <Edit size={16} />
                    </button>
                    <button
                      onClick={() => onDelete(place._id)}
                      className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
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
  );
};

export default PlacesTable;
