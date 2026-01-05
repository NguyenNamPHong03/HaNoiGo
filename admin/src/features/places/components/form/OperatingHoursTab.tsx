import { Clock } from 'lucide-react';
import React from 'react';
import type { OperatingHours } from '../../types/place.types';

interface OperatingHoursTabProps {
  operatingHours: OperatingHours;
  onUpdate: (day: string, field: 'open' | 'close', value: string) => void;
}

export const OperatingHoursTab: React.FC<OperatingHoursTabProps> = ({
  operatingHours,
  onUpdate
}) => {
  const days = [
    { key: 'monday', label: 'Thứ Hai' },
    { key: 'tuesday', label: 'Thứ Ba' },
    { key: 'wednesday', label: 'Thứ Tư' },
    { key: 'thursday', label: 'Thứ Năm' },
    { key: 'friday', label: 'Thứ Sáu' },
    { key: 'saturday', label: 'Thứ Bảy' },
    { key: 'sunday', label: 'Chủ Nhật' }
  ];

  return (
    <div className="space-y-6">
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <Clock className="w-5 h-5 text-blue-600 mt-0.5" />
          <div>
            <h3 className="font-semibold text-blue-900 mb-1">Giờ mở cửa</h3>
            <p className="text-sm text-blue-700">
              Thiết lập giờ mở cửa và đóng cửa cho từng ngày trong tuần. 
              Để trống nếu ngày đó đóng cửa.
            </p>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        {days.map(({ key, label }) => (
          <div key={key} className="border border-gray-200 rounded-lg p-4 hover:border-blue-300 transition-colors">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-center">
              <div className="font-medium text-gray-700">
                {label}
              </div>
              
              <div>
                <label className="block text-sm text-gray-600 mb-1">Mở cửa (giờ)</label>
                <input
                  type="time"
                  value={operatingHours[key as keyof OperatingHours]?.open || ''}
                  onChange={(e) => onUpdate(key, 'open', e.target.value)}
                  className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 [&::-webkit-calendar-picker-indicator]:cursor-pointer"
                  placeholder="08:00"
                  step="3600"
                />
              </div>
              
              <div>
                <label className="block text-sm text-gray-600 mb-1">Đóng cửa (giờ)</label>
                <input
                  type="time"
                  value={operatingHours[key as keyof OperatingHours]?.close || ''}
                  onChange={(e) => onUpdate(key, 'close', e.target.value)}
                  className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 [&::-webkit-calendar-picker-indicator]:cursor-pointer"
                  placeholder="22:00"
                  step="3600"
                />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
