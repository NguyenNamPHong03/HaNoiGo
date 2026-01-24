import { Calendar, MessageSquare, Search, Star, User } from 'lucide-react';
import React, { useMemo, useState } from 'react';
import { Input } from '../../../components/ui/input';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '../../../components/ui/table';
import { ReviewerInfo } from '../components/ReviewerInfo';
import { StarRating } from '../components/StarRating';
import { useReviews } from '../hooks/useReviews';

const ReviewsListPage: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');

  // Fetch reviews
  const { data, isLoading, isError, error } = useReviews();

  // Filter reviews based on search query
  const filteredReviews = useMemo(() => {
    if (!data?.data) return [];
    if (!searchQuery.trim()) return data.data;

    const query = searchQuery.toLowerCase();
    return data.data.filter((review: any) => {
      const userName = review.user?.displayName?.toLowerCase() || review.user?.email?.toLowerCase() || '';
      const comment = review.comment?.toLowerCase() || '';
      const placeName = review.place?.name?.toLowerCase() || '';
      
      return userName.includes(query) || 
             comment.includes(query) || 
             placeName.includes(query);
    });
  }, [data, searchQuery]);

  // Format date to Vietnamese format
  const formatDate = (dateString: Date | string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('vi-VN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    }).format(date);
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Quản lý Đánh giá</h1>
        <p className="text-gray-600 mt-2">
          Xem và quản lý tất cả đánh giá của người dùng trong hệ thống
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Tổng đánh giá</p>
              <p className="text-2xl font-bold text-gray-900">{data?.data?.length || 0}</p>
            </div>
            <MessageSquare className="w-8 h-8 text-blue-500" />
          </div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Kết quả tìm kiếm</p>
              <p className="text-2xl font-bold text-gray-900">{filteredReviews.length}</p>
            </div>
            <Search className="w-8 h-8 text-green-500" />
          </div>
        </div>
      </div>

      {/* Search Bar */}
      <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <Input
            type="text"
            placeholder="Tìm kiếm theo tên người dùng, nội dung đánh giá, hoặc tên địa điểm..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 w-full"
          />
        </div>
      </div>

      {/* Reviews Table */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        {isLoading ? (
          <div className="p-8 text-center">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
            <p className="mt-2 text-gray-600">Đang tải dữ liệu...</p>
          </div>
        ) : isError ? (
          <div className="p-8 text-center">
            <p className="text-red-600">
              Lỗi: {error instanceof Error ? error.message : 'Không thể tải dữ liệu'}
            </p>
          </div>
        ) : filteredReviews.length === 0 ? (
          <div className="p-8 text-center">
            <MessageSquare className="w-12 h-12 text-gray-400 mx-auto mb-3" />
            <p className="text-gray-600">
              {searchQuery ? 'Không tìm thấy đánh giá phù hợp' : 'Chưa có đánh giá nào'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[200px]">
                    <div className="flex items-center gap-2">
                      <User className="w-4 h-4" />
                      Người đánh giá
                    </div>
                  </TableHead>
                  <TableHead className="w-[200px]">Địa điểm</TableHead>
                  <TableHead className="w-[120px]">
                    <div className="flex items-center gap-2">
                      <Star className="w-4 h-4" />
                      Số sao
                    </div>
                  </TableHead>
                  <TableHead className="min-w-[300px]">
                    <div className="flex items-center gap-2">
                      <MessageSquare className="w-4 h-4" />
                      Nội dung
                    </div>
                  </TableHead>
                  <TableHead className="w-[180px]">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4" />
                      Ngày đánh giá
                    </div>
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredReviews.map((review: any) => (
                  <TableRow key={review._id}>
                    {/* Người đánh giá */}
                    <TableCell>
                      <ReviewerInfo review={review} />
                    </TableCell>

                    {/* Địa điểm */}
                    <TableCell>
                      <p className="font-medium text-gray-900 truncate">
                        {review.place?.name || 'N/A'}
                      </p>
                    </TableCell>

                    {/* Số sao */}
                    <TableCell>
                      <StarRating rating={review.rating} />
                    </TableCell>

                    {/* Nội dung */}
                    <TableCell>
                      <p className="text-sm text-gray-700 line-clamp-2">
                        {review.comment}
                      </p>
                    </TableCell>

                    {/* Ngày đánh giá */}
                    <TableCell>
                      <p className="text-sm text-gray-900">
                        {formatDate(review.createdAt)}
                      </p>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </div>

      {/* Footer */}
      {filteredReviews.length > 0 && (
        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
          <p className="text-sm text-gray-600 text-center">
            Hiển thị <span className="font-semibold">{filteredReviews.length}</span> đánh giá
            {searchQuery && (
              <span>
                {' '}
                từ tìm kiếm "<span className="font-semibold">{searchQuery}</span>"
              </span>
            )}
          </p>
        </div>
      )}
    </div>
  );
};

export default ReviewsListPage;
