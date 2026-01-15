import { Clock } from 'lucide-react';
import React, { useState } from 'react';
import type { OperatingHours } from '../../types/place.types';

interface OperatingHoursTabProps {
  operatingHours: OperatingHours;
  onUpdate: (day: string, field: 'open' | 'close', value: string) => void;
}

export const OperatingHoursTab: React.FC<OperatingHoursTabProps> = ({
  operatingHours,
  onUpdate
}) => {
  // State cho giờ chung (bulk hours)
  const [bulkOpen, setBulkOpen] = useState('08:00');
  const [bulkClose, setBulkClose] = useState('22:00');
  const [is24h, setIs24h] = useState(false);

  const days = [
    { key: 'monday', label: 'Thứ Hai' },
    { key: 'tuesday', label: 'Thứ Ba' },
    { key: 'wednesday', label: 'Thứ Tư' },
    { key: 'thursday', label: 'Thứ Năm' },
    { key: 'friday', label: 'Thứ Sáu' },
    { key: 'saturday', label: 'Thứ Bảy' },
    { key: 'sunday', label: 'Chủ Nhật' }
  ];

  // Áp dụng giờ chung cho Thứ 2-6
  const applyWeekdayHours = () => {
    const weekdays = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'];
    const openTime = is24h ? '00:00' : bulkOpen;
    const closeTime = is24h ? '23:59' : bulkClose;

    weekdays.forEach(day => {
      onUpdate(day, 'open', openTime);
      onUpdate(day, 'close', closeTime);
    });
  };

  // Áp dụng giờ chung cho tất cả các ngày
  const applyAllDays = () => {
    const openTime = is24h ? '00:00' : bulkOpen;
    const closeTime = is24h ? '23:59' : bulkClose;

    days.forEach(({ key }) => {
      onUpdate(key, 'open', openTime);
      onUpdate(key, 'close', closeTime);
    });
  };

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

      {/* Khối Giờ chung (Thứ 2-6) */}
      <div className="bg-gradient-to-r from-purple-50 to-blue-50 border-2 border-purple-200 rounded-lg p-5">
        <h4 className="font-semibold text-purple-900 mb-4 flex items-center gap-2">
          <Clock className="w-5 h-5" />
          Giờ chung (Thứ 2–6)
        </h4>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Mở cửa
            </label>
            <input
              type="time"
              value={bulkOpen}
              onChange={(e) => setBulkOpen(e.target.value)}
              disabled={is24h}
              className="w-full p-2 border border-purple-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Đóng cửa
            </label>
            <input
              type="time"
              value={bulkClose}
              onChange={(e) => setBulkClose(e.target.value)}
              disabled={is24h}
              className="w-full p-2 border border-purple-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
            />
          </div>
        </div>

        <div className="mb-4">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={is24h}
              onChange={(e) => setIs24h(e.target.checked)}
              className="w-4 h-4 text-purple-600 border-gray-300 rounded focus:ring-purple-500"
            />
            <span className="text-sm font-medium text-gray-700">
              Mở cửa 24/24
            </span>
          </label>
        </div>

        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            onClick={applyWeekdayHours}
            className="px-4 py-2 bg-purple-600 text-white font-medium rounded-lg hover:bg-purple-700 transition-colors flex items-center gap-2"
          >
            <Clock className="w-4 h-4" />
            Áp dụng cho Thứ 2–6
          </button>
          
          <button
            type="button"
            onClick={applyAllDays}
            className="px-4 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
          >
            <Clock className="w-4 h-4" />
            Áp dụng cho tất cả
          </button>
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
                {/* ✨ Hiển thị badge "Mở cửa cả ngày" nếu 00:00-23:59 */}
                {operatingHours[key as keyof OperatingHours]?.open === '00:00' && 
                 operatingHours[key as keyof OperatingHours]?.close === '23:59' && (
                  <span className="inline-block mt-1 text-xs text-green-600 font-medium">
                    ✓ Mở cửa cả ngày
                  </span>
                )}
                {/* Hiển thị "Đóng cửa" nếu trống */}
                {!operatingHours[key as keyof OperatingHours]?.open && 
                 !operatingHours[key as keyof OperatingHours]?.close && (
                  <span className="inline-block mt-1 text-xs text-gray-400">
                    Đóng cửa
                  </span>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
