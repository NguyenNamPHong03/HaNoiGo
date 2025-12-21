# 6. React Query Best Practices

## 🔑 Query Keys Structure (Hierarchical)

```javascript
// ✅ GOOD: Tổ chức query keys theo hierarchy
['places'] // Base key
['places', 'list'] // All places
['places', 'list', { district: 'Ba Dinh' }] // Filtered places
['places', 'detail', placeId] // Single place
['places', 'reviews', placeId] // Place's reviews

['chat', 'history', userId] // Chat history
['chat', 'message', messageId] // Single message

['user', 'profile'] // Current user
['user', 'preferences'] // User preferences
```

**Lợi ích:**

- Dễ invalidate queries: `invalidateQueries(['places'])` → clear tất cả place-related
- Consistent và predictable

---

## 💾 Caching Strategy

```javascript
// hooks/usePlaces.js
export const usePlaces = (filters = {}) => {
  return useQuery({
    queryKey: ['places', 'list', filters],
    queryFn: () => placeService.getPlaces(filters),
    
    // Caching config
    staleTime: 5 * 60 * 1000, // 5 phút - data còn "fresh"
    gcTime: 10 * 60 * 1000, // 10 phút - giữ trong cache
    
    // Refetch behavior
    refetchOnWindowFocus: false, // Không refetch khi switch tab
    refetchOnReconnect: true, // Refetch khi reconnect internet
    
    // Retry
    retry: 2, // Retry 2 lần khi fail
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
  });
};
```

**Caching rules theo data type:**


| Data Type | staleTime | gcTime | Lý do |
| :-- | :-- | :-- | :-- |
| Static data (categories, districts) | 30 mins | 1 hour | Ít thay đổi |
| User profile | 10 mins | 30 mins | Thay đổi trung bình |
| Place details | 5 mins | 15 mins | Có thể update |
| Search results | 2 mins | 5 mins | Thay đổi thường xuyên |
| Chat messages | 0 | 2 mins | Real-time data |

---

## 🔄 Optimistic Updates (UX Tốt hơn)

```javascript
// hooks/useReviews.js
export const useSubmitReview = (placeId) => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (reviewData) => reviewService.submitReview(placeId, reviewData),
    
    // OPTIMISTIC UPDATE
    onMutate: async (newReview) => {
      // 1. Cancel outgoing refetches (tránh race condition)
      await queryClient.cancelQueries(['places', 'reviews', placeId]);
      
      // 2. Snapshot current data (để rollback nếu fail)
      const previousReviews = queryClient.getQueryData(['places', 'reviews', placeId]);
      
      // 3. Optimistically update UI (user thấy ngay)
      queryClient.setQueryData(['places', 'reviews', placeId], (old) => {
        return [...(old || []), { ...newReview, _id: 'temp-id', createdAt: new Date() }];
      });
      
      return { previousReviews };
    },
    
    onError: (err, newReview, context) => {
      // 4. Rollback nếu API fail
      queryClient.setQueryData(
        ['places', 'reviews', placeId],
        context.previousReviews
      );
      toast.error('Không thể gửi đánh giá');
    },
    
    onSuccess: () => {
      toast.success('Đánh giá đã được gửi');
    },
    
    onSettled: () => {
      // 5. Refetch để sync với server
      queryClient.invalidateQueries(['places', 'reviews', placeId]);
      queryClient.invalidateQueries(['places', 'detail', placeId]); // Update avg rating
    },
  });
};
```

---

## 📡 Prefetching (Tăng Performance)

```javascript
// Prefetch place details khi hover PlaceCard
const PlaceCard = ({ place }) => {
  const queryClient = useQueryClient();
  
  const handleMouseEnter = () => {
    queryClient.prefetchQuery({
      queryKey: ['places', 'detail', place._id],
      queryFn: () => placeService.getPlaceById(place._id),
      staleTime: 60000, // Cache 1 phút
    });
  };
  
  return (
    <div onMouseEnter={handleMouseEnter}>
      <Link to={`/places/${place._id}`}>{place.name}</Link>
    </div>
  );
};
```

---

## 🔁 Pagination với keepPreviousData

```javascript
export const usePlaces = (page, filters) => {
  return useQuery({
    queryKey: ['places', 'list', page, filters],
    queryFn: () => placeService.getPlaces({ page, ...filters }),
    keepPreviousData: true, // Giữ data cũ khi chuyển trang → không blink
  });
};

// Usage trong component
const PlacesPage = () => {
  const [page, setPage] = useState(1);
  const { data, isLoading, isFetching } = usePlaces(page, filters);
  
  return (
    <>
      <PlaceList places={data?.places} />
      {isFetching && <LoadingOverlay />} // Show loading khi fetch page mới
      <Pagination page={page} onPageChange={setPage} />
    </>
  );
};
```
