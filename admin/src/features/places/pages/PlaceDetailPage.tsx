import { ArrowLeft, Clock, Edit, Eye, Globe, MapPin, MessageCircle, Phone, Star, TrendingUp } from 'lucide-react';
import React, { useEffect, useState } from 'react';
import { placesApi } from '../api/places.api';
import { reviewsApi } from '../api/reviews.api';
import ReviewList from '../components/reviews/ReviewList';
import StatusBadge from '../components/shared/StatusBadge';
import type { Place } from '../types/place.types';
import { formatDateTime, formatPrice } from '../utils/formatters';

interface PlaceDetailPageProps {
  placeId: string;
  onBack: () => void;
  onEdit: () => void;
}

const PlaceDetailPage: React.FC<PlaceDetailPageProps> = ({ placeId, onBack, onEdit }) => {
  const [place, setPlace] = useState<Place | null>(null);
  const [reviews, setReviews] = useState<any[]>([]);
  const [reviewsLoading, setReviewsLoading] = useState(false);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('info');

  useEffect(() => {
    loadPlaceDetail();
  }, [placeId]);

  useEffect(() => {
    if (activeTab === 'reviews') {
      loadReviews();
    }
  }, [activeTab, placeId]);

  const loadPlaceDetail = async () => {
    setLoading(true);
    try {
      const response = await placesApi.getById(placeId);
      setPlace(response.data);
    } catch (error) {
      console.error('Error loading place detail:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadReviews = async () => {
    setReviewsLoading(true);
    try {
      // ✅ Debug: Log place data structure
      console.log('📊 Place data:', {
        hasAdditionalInfo: !!place?.additionalInfo,
        additionalInfoKeys: place?.additionalInfo ? Object.keys(place.additionalInfo) : [],
        reviewsInAdditionalInfo: place?.additionalInfo?.reviews,
        reviewsCount: place?.additionalInfo?.reviews?.length || 0,
        hasGoogleReviews: !!place?.googleReviews,
        googleReviewsCount: place?.googleReviews?.length || 0
      });
      
      // ✅ Ưu tiên reviews từ Apify/Google (stored in additionalInfo.reviews hoặc googleReviews)
      const apifyReviews = place?.additionalInfo?.reviews;
      const googleReviews = place?.googleReviews;
      
      if (apifyReviews && Array.isArray(apifyReviews) && apifyReviews.length > 0) {
        // Apify reviews (primary source)
        console.log(`📝 Loading ${apifyReviews.length} Apify reviews`, apifyReviews[0]);
        setReviews(apifyReviews);
      } else if (googleReviews && Array.isArray(googleReviews) && googleReviews.length > 0) {
        // Google reviews (fallback 1)
        console.log(`📝 Loading ${googleReviews.length} Google reviews`, googleReviews[0]);
        setReviews(googleReviews);
      } else {
        // User-generated reviews from Review collection (fallback 2)
        console.log('📝 Loading user-generated reviews from database');
        const response = await reviewsApi.getByPlace(placeId);
        setReviews(response.data.data.reviews || []);
      }
    } catch (error) {
      console.error('Error loading reviews:', error);
      setReviews([]);
    } finally {
      setReviewsLoading(false);
    }
  };

  const renderStarRating = (rating: number, size = 'w-5 h-5') => {
    return (
      <div className="flex items-center">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`${size} ${
              star <= rating ? 'text-yellow-400 fill-current' : 'text-gray-300'
            }`}
          />
        ))}
      </div>
    );
  };

  const renderAiTagsSection = (tags: any) => {
    const tagCategories = [
      { key: 'space', label: '🏠 Không gian', color: 'bg-blue-100 text-blue-700' },
      { key: 'mood', label: '😊 Tâm trạng', color: 'bg-green-100 text-green-700' },
      { key: 'suitability', label: '👥 Phù hợp', color: 'bg-purple-100 text-purple-700' },
      { key: 'crowdLevel', label: '👫 Mức độ đông đúc', color: 'bg-orange-100 text-orange-700' },
      { key: 'music', label: '🎵 Âm nhạc', color: 'bg-pink-100 text-pink-700' },
      { key: 'parking', label: '🚗 Đậu xe', color: 'bg-indigo-100 text-indigo-700' },
      { key: 'specialFeatures', label: '✨ Tính năng đặc biệt', color: 'bg-yellow-100 text-yellow-700' }
    ];

    return (
      <div className="space-y-4">
        {tagCategories.map((category) => {
          const categoryTags = tags[category.key];
          if (!categoryTags || categoryTags.length === 0) return null;

          return (
            <div key={category.key}>
              <h4 className="font-medium text-gray-900 mb-2">{category.label}</h4>
              <div className="flex flex-wrap gap-2">
                {categoryTags.map((tag: string) => (
                  <span
                    key={tag}
                    className={`px-3 py-1 rounded-full text-sm ${category.color}`}
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow p-8">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="h-4 bg-gray-200 rounded w-2/3 mb-2"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2"></div>
        </div>
      </div>
    );
  }

  if (!place) {
    return (
      <div className="bg-white rounded-lg shadow p-8 text-center">
        <p className="text-gray-500">Không tìm thấy địa điểm</p>
        <button
          onClick={onBack}
          className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          Quay lại
        </button>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow">
      {/* Header */}
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={onBack}
              className="p-2 hover:bg-gray-100 rounded-lg"
            >
              <ArrowLeft size={20} />
            </button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{place.name}</h1>
              <div className="flex items-center gap-4 mt-1">
                <span className="text-gray-600">{place.district} • {place.category}</span>
                <StatusBadge status={place.status} isActive={place.isActive} />
              </div>
            </div>
          </div>
          <button
            onClick={onEdit}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
          >
            <Edit size={16} />
            Chỉnh sửa
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="p-6 border-b border-gray-200">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="bg-blue-50 p-4 rounded-lg">
            <div className="flex items-center gap-3">
              <Star className="w-8 h-8 text-blue-600" />
              <div>
                <div className="text-2xl font-bold text-blue-900">{place.averageRating.toFixed(1)}</div>
                <div className="text-sm text-blue-600">Đánh giá trung bình</div>
              </div>
            </div>
          </div>
          
          <div className="bg-green-50 p-4 rounded-lg">
            <div className="flex items-center gap-3">
              <MessageCircle className="w-8 h-8 text-green-600" />
              <div>
                <div className="text-2xl font-bold text-green-900">{place.totalReviews}</div>
                <div className="text-sm text-green-600">Lượt đánh giá</div>
              </div>
            </div>
          </div>
          
          <div className="bg-purple-50 p-4 rounded-lg">
            <div className="flex items-center gap-3">
              <Eye className="w-8 h-8 text-purple-600" />
              <div>
                <div className="text-2xl font-bold text-purple-900">{place.viewCount}</div>
                <div className="text-sm text-purple-600">Lượt xem</div>
              </div>
            </div>
          </div>
          
          <div className="bg-orange-50 p-4 rounded-lg">
            <div className="flex items-center gap-3">
              <TrendingUp className="w-8 h-8 text-orange-600" />
              <div>
                <div className="text-2xl font-bold text-orange-900">
                  {formatPrice(place.priceRange.min, place.priceRange.max)}
                </div>
                <div className="text-sm text-orange-600">Khoảng giá</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="border-b border-gray-200">
        <nav className="flex px-6">
          {[
            { id: 'info', name: 'Thông tin chung', icon: '📝' },
            { id: 'menu', name: 'Menu', icon: '🍽️' },
            { id: 'hours', name: 'Giờ mở cửa', icon: '🕒' },
            { id: 'ai-tags', name: 'AI Tags', icon: '🤖' },
            { id: 'reviews', name: 'Đánh giá', icon: '⭐' },
            { id: 'audit', name: 'Lịch sử', icon: '📊' }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`py-4 px-6 border-b-2 font-medium text-sm ${
                activeTab === tab.id
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <span className="mr-2">{tab.icon}</span>
              {tab.name}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      <div className="p-6">
        {/* Info Tab */}
        {activeTab === 'info' && (
          <div className="space-y-8">
            {/* Basic Info */}
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">Thông tin cơ bản</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="flex items-start gap-3">
                    <MapPin className="w-5 h-5 text-gray-400 mt-0.5" />
                    <div>
                      <div className="font-medium">Địa chỉ</div>
                      <div className="text-gray-600">{place.address}</div>
                    </div>
                  </div>

                  {place.contact?.phone && (
                    <div className="flex items-start gap-3">
                      <Phone className="w-5 h-5 text-gray-400 mt-0.5" />
                      <div>
                        <div className="font-medium">Điện thoại</div>
                        <div className="text-gray-600">{place.contact.phone}</div>
                      </div>
                    </div>
                  )}

                  {place.contact?.website && (
                    <div className="flex items-start gap-3">
                      <Globe className="w-5 h-5 text-gray-400 mt-0.5" />
                      <div>
                        <div className="font-medium">Website</div>
                        <a 
                          href={place.contact.website}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:underline"
                        >
                          {place.contact.website}
                        </a>
                      </div>
                    </div>
                  )}
                </div>

                <div className="space-y-4">
                  <div>
                    <div className="font-medium">Danh mục</div>
                    <div className="text-gray-600">{place.category}</div>
                  </div>

                  <div>
                    <div className="font-medium">Quận</div>
                    <div className="text-gray-600">{place.district}</div>
                  </div>

                  <div>
                    <div className="font-medium">Khoảng giá</div>
                    <div className="text-gray-600">{formatPrice(place.priceRange.min, place.priceRange.max)}</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Description */}
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">Mô tả</h3>
              <p className="text-gray-700 whitespace-pre-line">{place.description}</p>
            </div>

            {/* Images */}
            {place.images && place.images.length > 0 && (
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">Hình ảnh</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {place.images.map((image, index) => (
                    <img
                      key={index}
                      src={image}
                      alt={`${place.name} - Hình ${index + 1}`}
                      className="w-full h-48 object-cover rounded-lg"
                    />
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Menu Tab */}
        {activeTab === 'menu' && (
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-4">Menu</h3>
            {place.menu && place.menu.length > 0 ? (
              <div className="space-y-4">
                {Object.entries(
                  place.menu.reduce((acc, item) => {
                    const category = item.category || 'Khác';
                    if (!acc[category]) acc[category] = [];
                    acc[category].push(item);
                    return acc;
                  }, {} as Record<string, typeof place.menu>)
                ).map(([category, items]) => (
                  <div key={category} className="border border-gray-200 rounded-lg p-4">
                    <h4 className="font-medium text-gray-900 mb-3">{category}</h4>
                    <div className="space-y-2">
                      {items.map((item, index) => (
                        <div key={index} className="flex justify-between items-start">
                          <div>
                            <div className="font-medium">{item.name}</div>
                            {item.description && (
                              <div className="text-sm text-gray-500">{item.description}</div>
                            )}
                          </div>
                          <div className="text-lg font-bold text-blue-600 ml-4">
                            {item.price.toLocaleString()}₫
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <p>Chưa có menu</p>
              </div>
            )}
          </div>
        )}

        {/* AI Tags Tab */}
        {activeTab === 'ai-tags' && (
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-4">AI Semantic Tags</h3>
            <div className="space-y-6">
              {renderAiTagsSection(place.aiTags)}
              {Object.values(place.aiTags).every(tags => !tags || tags.length === 0) && (
                <div className="text-center py-8 text-gray-500">
                  <p>Chưa có AI tags</p>
                  <p className="text-sm">Hãy chỉnh sửa để thêm tags và giúp AI hiểu rõ hơn về địa điểm này</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Operating Hours Tab */}
        {activeTab === 'hours' && (
          <div className="space-y-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Giờ mở cửa</h3>
            
            {/* Operating Hours (User-set format) */}
            {place.operatingHours && (
              <div className="bg-white border border-gray-200 rounded-lg p-5">
                <h4 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <Clock className="w-5 h-5 text-blue-600" />
                  Giờ hoạt động (Theo thiết lập)
                </h4>
                <div className="space-y-3">
                  {[
                    { key: 'monday', label: 'Thứ Hai' },
                    { key: 'tuesday', label: 'Thứ Ba' },
                    { key: 'wednesday', label: 'Thứ Tư' },
                    { key: 'thursday', label: 'Thứ Năm' },
                    { key: 'friday', label: 'Thứ Sáu' },
                    { key: 'saturday', label: 'Thứ Bảy' },
                    { key: 'sunday', label: 'Chủ Nhật' }
                  ].map(({ key, label }) => {
                    const hours = place.operatingHours?.[key as keyof typeof place.operatingHours];
                    const isOpen = hours?.open && hours?.close;
                    
                    return (
                      <div key={key} className="flex justify-between items-center py-2 border-b border-gray-100 last:border-0">
                        <span className="font-medium text-gray-700 w-32">{label}</span>
                        {isOpen ? (
                          <span className="text-gray-600">
                            {hours.open} - {hours.close}
                          </span>
                        ) : (
                          <span className="text-red-500 text-sm">Đóng cửa</span>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Google Opening Hours (if available) */}
            {place.openingHours && place.openingHours.length > 0 && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-5">
                <h4 className="font-semibold text-blue-900 mb-4 flex items-center gap-2">
                  <Globe className="w-5 h-5" />
                  Giờ mở cửa (Google Places)
                </h4>
                <div className="space-y-2">
                  {place.openingHours.map((item: any, index: number) => (
                    <div key={index} className="flex justify-between items-center py-2 border-b border-blue-100 last:border-0">
                      <span className="font-medium text-blue-800">{item.day}</span>
                      <span className="text-blue-700">{item.hours}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* No hours data */}
            {!place.operatingHours && (!place.openingHours || place.openingHours.length === 0) && (
              <div className="text-center py-8 text-gray-500 bg-gray-50 rounded-lg">
                <Clock className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <p>Chưa có thông tin giờ mở cửa</p>
                <p className="text-sm mt-2">Hãy chỉnh sửa để thêm giờ hoạt động</p>
              </div>
            )}
          </div>
        )}

        {/* Reviews Tab */}
        {activeTab === 'reviews' && (
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-4 text-center">Đánh giá từ người dùng</h3>
            
            {/* Rating Distribution */}
            <div className="bg-gray-50 p-4 rounded-lg mb-6 flex justify-center">
              <div className="text-center">
                {reviews.length > 0 ? (
                  <>
                    <div className="text-4xl font-bold text-gray-900">
                      {(reviews.reduce((sum, r) => sum + (r.stars || r.rating || 0), 0) / reviews.length).toFixed(1)}
                    </div>
                    <div className="mt-1 flex justify-center">
                      {renderStarRating(reviews.reduce((sum, r) => sum + (r.stars || r.rating || 0), 0) / reviews.length)}
                    </div>
                    <div className="text-sm text-gray-600 mt-1">{reviews.length} đánh giá</div>
                  </>
                ) : (
                  <>
                    <div className="text-4xl font-bold text-gray-900">{place.averageRating.toFixed(1)}</div>
                    <div className="mt-1 flex justify-center">{renderStarRating(place.averageRating)}</div>
                    <div className="text-sm text-gray-600 mt-1">{place.totalReviews} đánh giá</div>
                  </>
                )}
              </div>
            </div>

            {/* Reviews List */}
            {reviewsLoading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                <p className="text-gray-500 mt-2">Đang tải đánh giá...</p>
              </div>
            ) : (
              <ReviewList reviews={reviews} showSource={true} />
            )}
          </div>
        )}

        {/* Audit Tab */}
        {activeTab === 'audit' && (
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-4">Lịch sử thay đổi</h3>
            <div className="space-y-4">
              <div className="flex items-start gap-3 p-4 bg-gray-50 rounded-lg">
                <Clock className="w-5 h-5 text-gray-400 mt-0.5" />
                <div>
                  <div className="font-medium">Được tạo</div>
                  <div className="text-sm text-gray-600">
                    {formatDateTime(place.createdAt)}
                    {place.createdBy && (
                      <span> bởi {place.createdBy.displayName || place.createdBy.username}</span>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex items-start gap-3 p-4 bg-gray-50 rounded-lg">
                <Clock className="w-5 h-5 text-gray-400 mt-0.5" />
                <div>
                  <div className="font-medium">Cập nhật lần cuối</div>
                  <div className="text-sm text-gray-600">
                    {formatDateTime(place.updatedAt)}
                    {place.updatedBy && (
                      <span> bởi {place.updatedBy.displayName || place.updatedBy.username}</span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default PlaceDetailPage;
