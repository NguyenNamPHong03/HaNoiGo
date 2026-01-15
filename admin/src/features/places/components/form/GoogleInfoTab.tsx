import { Calendar, Info, MapPin, MessageSquare, RefreshCw, Star } from 'lucide-react';
import React, { useState } from 'react';

interface GoogleInfoTabProps {
  formData: any;
  onRefreshAiTags?: (aiTags: any) => void;
  onRefreshOperatingHours?: (operatingHours: any) => void;
  placeId?: string;
}

export const GoogleInfoTab: React.FC<GoogleInfoTabProps> = ({ formData, onRefreshAiTags, onRefreshOperatingHours, placeId }) => {
  const [refreshing, setRefreshing] = useState(false);
  
  // ✅ Apify cũng có Google data (từ Google Maps Scraper)
  const isGoogleSource = formData.source === 'google' || formData.source === 'apify';
  const sourceLabel = formData.source === 'apify' ? 'Apify (Google Maps Scraper)' : 'Google Places API';

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
        
        // 🕒 Callback to update operating hours if available
        if (data.data.operatingHours && onRefreshOperatingHours) {
          onRefreshOperatingHours(data.data.operatingHours);
        }
        
        // Show toast (nếu có toast provider)
        alert('✅ Đã cập nhật AI Tags và Giờ mở cửa tự động từ Google data!');
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
        <p className="text-gray-500">Địa điểm này không có dữ liệu từ Google</p>
        <p className="text-sm text-gray-400 mt-2">
          Source: {formData.source || 'manual'}
        </p>
        <p className="text-xs text-gray-400 mt-1">
          Chỉ hiển thị cho source: google hoặc apify
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
              <h3 className="font-semibold text-blue-900">Google Maps Data</h3>
              <p className="text-sm text-blue-700">
                Dữ liệu tự động từ {sourceLabel} (Read-only)
              </p>
            </div>
          </div>
          
          {/* Nút Refresh */}
          {onRefreshAiTags && placeId && (
            <button
              onClick={handleRefreshAiTags}
              disabled={refreshing}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 transition-all"
              title="Tự động cập nhật AI Tags và Giờ mở cửa từ Google data"
            >
              <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
              {refreshing ? 'Đang xử lý...' : 'Refresh'}
            </button>
          )}
        </div>
      </div>

      {/* Google/Apify Place ID */}
      {(formData.googlePlaceId || formData.apifyPlaceId) && (
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            {formData.source === 'apify' ? 'Google Place ID (từ Apify)' : 'Google Place ID'}
          </label>
          <input
            type="text"
            value={formData.googlePlaceId || formData.apifyPlaceId}
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
            {Object.entries(formData.additionalInfo)
              .filter(([key]) => key !== 'reviews') // Skip reviews, hiển thị riêng ở dưới
              .map(([category, items]: [string, any]) => (
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

      {/* ✨ Google Reviews Section */}
      {formData.additionalInfo?.reviews && formData.additionalInfo.reviews.length > 0 && (
        <div className="bg-white border border-gray-200 rounded-lg p-5">
          <div className="flex items-center gap-2 mb-4">
            <MessageSquare className="w-5 h-5 text-blue-600" />
            <h4 className="font-semibold text-gray-900">
              Đánh giá từ Google ({formData.additionalInfo.reviews.length})
            </h4>
          </div>
          <div className="space-y-4 max-h-96 overflow-y-auto">
            {formData.additionalInfo.reviews.slice(0, 10).map((review: any, index: number) => (
              <div key={index} className="border-b border-gray-100 pb-4 last:border-0">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                    <span className="text-blue-600 font-semibold text-sm">
                      {review.name?.charAt(0).toUpperCase() || '?'}
                    </span>
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-1">
                      <h6 className="font-semibold text-gray-900">{review.name}</h6>
                      <div className="flex items-center gap-1">
                        {Array.from({ length: 5 }).map((_, i) => (
                          <Star
                            key={i}
                            className={`w-4 h-4 ${
                              i < review.stars
                                ? 'text-yellow-400 fill-yellow-400'
                                : 'text-gray-300'
                            }`}
                          />
                        ))}
                      </div>
                    </div>
                    <p className="text-sm text-gray-500 mb-2">
                      {review.publishedAtDate || review.publishedAt || 'N/A'}
                    </p>
                    <p className="text-gray-700 text-sm leading-relaxed">
                      {review.text}
                    </p>
                    {review.likesCount > 0 && (
                      <p className="text-xs text-gray-500 mt-2">
                        👍 {review.likesCount} người thấy hữu ích
                      </p>
                    )}
                    {review.responseFromOwnerText && (
                      <div className="mt-3 bg-gray-50 p-3 rounded-lg">
                        <p className="text-xs font-semibold text-gray-700 mb-1">
                          Phản hồi từ chủ sở hữu:
                        </p>
                        <p className="text-sm text-gray-600">
                          {review.responseFromOwnerText}
                        </p>
                      </div>
                    )}
                  </div>
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

      {/* Raw Google/Apify Data (Collapsible) */}
      {(formData.googleData || formData.apify) && (
        <details className="bg-gray-50 border border-gray-300 rounded-lg p-4">
          <summary className="cursor-pointer font-semibold text-gray-800 hover:text-gray-900">
            📦 Raw {formData.source === 'apify' ? 'Apify' : 'Google'} Data (Developer)
          </summary>
          <pre className="mt-4 p-4 bg-white border border-gray-200 rounded text-xs overflow-x-auto">
            {JSON.stringify(formData.googleData || formData.apify, null, 2)}
          </pre>
        </details>
      )}
    </div>
  );
};
