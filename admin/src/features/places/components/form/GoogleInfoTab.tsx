import { Calendar, Info, MapPin, MessageSquare, RefreshCw, Star } from 'lucide-react';
import React, { useState } from 'react';

interface GoogleInfoTabProps {
  formData: any;
  onRefreshAiTags?: (aiTags: any) => void;
  placeId?: string;
}

export const GoogleInfoTab: React.FC<GoogleInfoTabProps> = ({ formData, onRefreshAiTags, placeId }) => {
  const [refreshing, setRefreshing] = useState(false);
  const isGoogleSource = formData.source === 'google';

  const handleRefreshAiTags = async () => {
    if (!placeId || !onRefreshAiTags) return;
    
    setRefreshing(true);
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/admin/places/${placeId}/refresh-google`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      const data = await response.json();
      
      if (data.success) {
        // Callback to parent to update AI tags in form
        onRefreshAiTags(data.data.aiTagsFinal);
        
        // Show toast (nếu có toast provider)
        alert('✅ Đã cập nhật AI Tags tự động từ Google data!');
      } else {
        alert('❌ Lỗi: ' + data.message);
      }
    } catch (error) {
      console.error('Refresh AI tags error:', error);
      alert('❌ Lỗi khi refresh AI tags');
    } finally {
      setRefreshing(false);
    }
  };

  if (!isGoogleSource) {
    return (
      <div className="text-center py-12">
        <Info className="w-16 h-16 text-gray-300 mx-auto mb-4" />
        <p className="text-gray-500">Địa điểm này không phải từ Google Places</p>
        <p className="text-sm text-gray-400 mt-2">
          Source: {formData.source || 'manual'}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header với nút Refresh */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <MapPin className="w-6 h-6 text-blue-600" />
            <div>
              <h3 className="font-semibold text-blue-900">Google Places Data</h3>
              <p className="text-sm text-blue-700">
                Dữ liệu tự động import từ Google Maps (Read-only)
              </p>
            </div>
          </div>
          
          {/* 🤖 Nút Refresh AI Tags */}
          {onRefreshAiTags && placeId && (
            <button
              onClick={handleRefreshAiTags}
              disabled={refreshing}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 transition-all"
              title="Tự động sinh AI Tags từ Google data"
            >
              <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
              {refreshing ? 'Đang xử lý...' : '🤖 Refresh AI Tags'}
            </button>
          )}
        </div>
      </div>

      {/* Google Place ID */}
      {formData.googlePlaceId && (
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Google Place ID
          </label>
          <input
            type="text"
            value={formData.googlePlaceId}
            readOnly
            className="w-full p-3 bg-gray-50 border border-gray-300 rounded-lg text-gray-600 font-mono text-sm"
          />
        </div>
      )}

      {/* Reviews Summary */}
      <div className="bg-white border border-gray-200 rounded-lg p-5">
        <div className="flex items-center gap-2 mb-4">
          <Star className="w-5 h-5 text-yellow-500" />
          <h4 className="font-semibold text-gray-900">Đánh giá</h4>
        </div>
        
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div className="bg-yellow-50 rounded-lg p-4 text-center">
            <div className="text-3xl font-bold text-yellow-600">
              {formData.averageRating || 0}
            </div>
            <div className="text-sm text-gray-600 mt-1">Rating trung bình</div>
          </div>
          <div className="bg-blue-50 rounded-lg p-4 text-center">
            <div className="text-3xl font-bold text-blue-600">
              {formData.totalReviews || 0}
            </div>
            <div className="text-sm text-gray-600 mt-1">Tổng reviews</div>
          </div>
        </div>

        {/* Reviews Distribution */}
        {formData.reviewsDistribution && (
          <div className="space-y-2">
            <h5 className="text-sm font-medium text-gray-700 mb-3">Phân bố đánh giá</h5>
            {[5, 4, 3, 2, 1].map((star) => {
              const key = ['fiveStar', 'fourStar', 'threeStar', 'twoStar', 'oneStar'][5 - star];
              const count = formData.reviewsDistribution[key] || 0;
              const total = formData.totalReviews || 1;
              const percentage = Math.round((count / total) * 100);

              return (
                <div key={star} className="flex items-center gap-3">
                  <div className="flex items-center gap-1 w-16">
                    <span className="text-sm text-gray-600">{star}</span>
                    <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                  </div>
                  <div className="flex-1 bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-yellow-400 h-2 rounded-full transition-all"
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                  <span className="text-sm text-gray-600 w-16 text-right">
                    {count} ({percentage}%)
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Price Display */}
      {formData.priceDisplay && (
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Mức giá (Google)
          </label>
          <input
            type="text"
            value={formData.priceDisplay}
            readOnly
            className="w-full p-3 bg-gray-50 border border-gray-300 rounded-lg text-gray-800 font-medium"
          />
        </div>
      )}

      {/* Opening Hours (Google Format) */}
      {formData.openingHours && formData.openingHours.length > 0 && (
        <div className="bg-white border border-gray-200 rounded-lg p-5">
          <div className="flex items-center gap-2 mb-4">
            <Calendar className="w-5 h-5 text-green-600" />
            <h4 className="font-semibold text-gray-900">Giờ mở cửa (Google)</h4>
          </div>
          <div className="space-y-2">
            {formData.openingHours.map((item: any, index: number) => (
              <div key={index} className="flex justify-between items-center py-2 border-b border-gray-100 last:border-0">
                <span className="font-medium text-gray-700">{item.day}</span>
                <span className="text-gray-600">{item.hours}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Additional Info */}
      {formData.additionalInfo && Object.keys(formData.additionalInfo).length > 0 && (
        <div className="bg-white border border-gray-200 rounded-lg p-5">
          <div className="flex items-center gap-2 mb-4">
            <MessageSquare className="w-5 h-5 text-purple-600" />
            <h4 className="font-semibold text-gray-900">Thông tin bổ sung</h4>
          </div>
          <div className="space-y-4">
            {Object.entries(formData.additionalInfo).map(([category, items]: [string, any]) => (
              <div key={category}>
                <h5 className="text-sm font-semibold text-gray-700 mb-2">{category}</h5>
                <div className="grid grid-cols-2 gap-2">
                  {Array.isArray(items) && items.map((item: any, index: number) => {
                    const [key, value] = Object.entries(item)[0] as [string, boolean];
                    return (
                      <div key={index} className="flex items-center gap-2 text-sm">
                        <div className={`w-2 h-2 rounded-full ${value ? 'bg-green-500' : 'bg-gray-300'}`} />
                        <span className={value ? 'text-gray-700' : 'text-gray-400'}>{key}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Contact Info */}
      <div className="bg-white border border-gray-200 rounded-lg p-4">
        <h4 className="font-semibold text-gray-900 mb-3">Thông tin liên hệ</h4>
        <div className="space-y-3">
          {formData.contact?.phone && (
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1">
                Số điện thoại
              </label>
              <input
                type="text"
                value={formData.contact.phone}
                readOnly
                className="w-full p-2 bg-gray-50 border border-gray-300 rounded text-gray-700"
              />
            </div>
          )}
          {formData.contact?.phoneUnformatted && (
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1">
                SĐT (Chưa format)
              </label>
              <input
                type="text"
                value={formData.contact.phoneUnformatted}
                readOnly
                className="w-full p-2 bg-gray-50 border border-gray-300 rounded text-gray-700 font-mono text-sm"
              />
            </div>
          )}
          {formData.contact?.website && (
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1">
                Website
              </label>
              <a
                href={formData.contact.website}
                target="_blank"
                rel="noopener noreferrer"
                className="block w-full p-2 bg-gray-50 border border-gray-300 rounded text-blue-600 hover:underline"
              >
                {formData.contact.website}
              </a>
            </div>
          )}
        </div>
      </div>

      {/* Raw Google Data (Collapsible) */}
      {formData.googleData && (
        <details className="bg-gray-50 border border-gray-300 rounded-lg p-4">
          <summary className="cursor-pointer font-semibold text-gray-800 hover:text-gray-900">
            📦 Raw Google Data (Developer)
          </summary>
          <pre className="mt-4 p-4 bg-white border border-gray-200 rounded text-xs overflow-x-auto">
            {JSON.stringify(formData.googleData, null, 2)}
          </pre>
        </details>
      )}
    </div>
  );
};
