import {
    ArrowLeft,
    Clock,
    Edit,
    Eye,
    Globe,
    MapPin,
    MessageCircle,
    Phone,
    Star,
    TrendingUp,
    User
} from 'lucide-react';
import React, { useEffect, useState } from 'react';
import { placesAPI } from '../services/api';

interface Place {
  _id: string;
  name: string;
  address: string;
  district: string;
  category: string;
  description: string;
  priceRange: { min: number; max: number };
  status: string;
  isActive: boolean;
  averageRating: number;
  totalReviews: number;
  viewCount: number;
  images: string[];
  menu: Array<{ name: string; price: number; description: string; category: string }>;
  aiTags: {
    space: string[];
    mood: string[];
    suitability: string[];
    crowdLevel: string[];
    music: string[];
    parking: string[];
    specialFeatures: string[];
  };
  contact: { phone: string; website: string };
  createdAt: string;
  updatedAt: string;
  createdBy?: { displayName: string; username: string };
  updatedBy?: { displayName: string; username: string };
}

interface Review {
  _id: string;
  userId: string;
  rating: number;
  comment: string;
  createdAt: string;
  user?: { displayName: string; avatarUrl?: string };
}

interface PlaceDetailProps {
  placeId: string;
  onBack: () => void;
  onEdit: () => void;
}

const PlaceDetail: React.FC<PlaceDetailProps> = ({ placeId, onBack, onEdit }) => {
  const [place, setPlace] = useState<Place | null>(null);
  const [reviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('info');

  useEffect(() => {
    loadPlaceDetail();
  }, [placeId]);

  const loadPlaceDetail = async () => {
    setLoading(true);
    try {
      const response = await placesAPI.getById(placeId);
      setPlace(response.data);
      
      // TODO: Load reviews when review API is available
      // const reviewsRes = await reviewsAPI.getByPlaceId(placeId);
      // setReviews(reviewsRes.data);
    } catch (error) {
      console.error('Error loading place detail:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string, isActive: boolean) => {
    if (!isActive) {
      return <span className="px-3 py-1 bg-gray-100 text-gray-600 rounded-full text-sm">Tạm ngưng</span>;
    }
    
    switch (status) {
      case 'Published':
        return <span className="px-3 py-1 bg-green-100 text-green-600 rounded-full text-sm">Đã xuất bản</span>;
      case 'Draft':
        return <span className="px-3 py-1 bg-yellow-100 text-yellow-600 rounded-full text-sm">Bản nháp</span>;
      case 'Archived':
        return <span className="px-3 py-1 bg-gray-100 text-gray-600 rounded-full text-sm">Lưu trữ</span>;
      default:
        return <span className="px-3 py-1 bg-gray-100 text-gray-600 rounded-full text-sm">{status}</span>;
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
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
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
                {getStatusBadge(place.status, place.isActive)}
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

                  {place.contact.phone && (
                    <div className="flex items-start gap-3">
                      <Phone className="w-5 h-5 text-gray-400 mt-0.5" />
                      <div>
                        <div className="font-medium">Điện thoại</div>
                        <div className="text-gray-600">{place.contact.phone}</div>
                      </div>
                    </div>
                  )}

                  {place.contact.website && (
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
                {/* Group menu items by category */}
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
                              <div className="text-sm text-gray-600">{item.description}</div>
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

        {/* Reviews Tab */}
        {activeTab === 'reviews' && (
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-4">Đánh giá từ người dùng</h3>
            
            {/* Rating Distribution (placeholder) */}
            <div className="bg-gray-50 p-4 rounded-lg mb-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="text-center">
                  <div className="text-4xl font-bold text-gray-900">{place.averageRating.toFixed(1)}</div>
                  <div className="mt-1">{renderStarRating(place.averageRating)}</div>
                  <div className="text-sm text-gray-600 mt-1">{place.totalReviews} đánh giá</div>
                </div>
                <div className="space-y-2">
                  {[5, 4, 3, 2, 1].map(star => (
                    <div key={star} className="flex items-center gap-2">
                      <span className="text-sm w-8">{star} ⭐</span>
                      <div className="flex-1 bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-yellow-400 h-2 rounded-full" 
                          style={{ width: '60%' }} // Placeholder data
                        ></div>
                      </div>
                      <span className="text-sm text-gray-600 w-8">60%</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Recent Reviews */}
            <div>
              <h4 className="font-medium text-gray-900 mb-4">Đánh giá gần đây</h4>
              {reviews.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <p>Chưa có đánh giá nào</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {reviews.map((review) => (
                    <div key={review._id} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center">
                            <User size={16} />
                          </div>
                          <div>
                            <div className="font-medium">
                              {review.user?.displayName || 'Người dùng ẩn danh'}
                            </div>
                            <div className="text-sm text-gray-600">
                              {formatDate(review.createdAt)}
                            </div>
                          </div>
                        </div>
                        {renderStarRating(review.rating, 'w-4 h-4')}
                      </div>
                      <p className="text-gray-700">{review.comment}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
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
                    {formatDate(place.createdAt)}
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
                    {formatDate(place.updatedAt)}
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

export default PlaceDetail;