# 📍 Places Feature

## 📁 Cấu trúc

```
features/places/
├── pages/                      # Route-level pages (mỏng, compose components)
│   ├── PlacesListPage.tsx     # Danh sách địa điểm (list + filter + pagination)
│   ├── PlaceFormPage.tsx      # Form tạo/sửa địa điểm (tabs)
│   └── PlaceDetailPage.tsx    # Xem chi tiết địa điểm (read-only)
│
├── components/                 # UI components nhỏ
│   ├── list/                  # Components cho PlacesList
│   │   ├── PlacesFilters.tsx  # Search + Filter bar
│   │   ├── PlacesTable.tsx    # Bảng danh sách
│   │   └── PaginationControls.tsx
│   │
│   └── shared/                # Shared components
│       └── StatusBadge.tsx    # Badge trạng thái
│
├── api/                       # API layer
│   └── places.api.ts          # Wrapper around placesAPI from services/api.ts
│
├── types/                     # TypeScript types
│   └── place.types.ts         # Place, PlaceFormData, Pagination, etc.
│
├── utils/                     # Helper functions
│   ├── formatters.ts          # formatPrice, formatDate, getStatusBadge
│   └── mapPlaceForm.ts        # mapPlaceToFormData, normalizePlacePayload
│
└── index.ts                   # Public exports
```

## 🎯 Pages

### PlacesListPage
- Danh sách địa điểm với filter, search, pagination
- Bulk actions (xuất bản, chuyển nháp, xóa)
- Gọi components: PlacesFilters, PlacesTable, PaginationControls

### PlaceFormPage
- Form tạo/sửa địa điểm (1 form cho 2 mục đích)
- 4 tabs: Basic Info, Images & Menu, AI Tags, Preview
- Validate, upload ảnh, normalize payload trước khi submit

### PlaceDetailPage
- Hiển thị chi tiết địa điểm (read-only)
- 5 tabs: Info, Menu, AI Tags, Reviews, History
- Có nút "Chỉnh sửa" → chuyển sang PlaceFormPage

## 🔄 Data Flow

```
PlacesListPage
  ├─ Click "Thêm" → PlaceFormPage (mode: CREATE)
  ├─ Click "Xem" → PlaceDetailPage
  │   └─ Click "Sửa" → PlaceFormPage (mode: EDIT)
  └─ Click "Sửa" → PlaceFormPage (mode: EDIT)
```

## 🛠️ Utils

### formatters.ts
- `formatPrice(min, max)`: "50,000₫ - 100,000₫"
- `formatDate(string)`: "01/01/2024"
- `formatDateTime(string)`: "01/01/2024, 10:30"
- `getStatusBadge(status, isActive)`: { text, className }

### mapPlaceForm.ts
- `mapPlaceToFormData(place)`: API → Form default values
- `normalizePlacePayload(formData)`: Form → API payload
  - Validate priceRange
  - Normalize status
  - Map menu items
  - Ensure aiTags complete

## 📝 Types

### Place
Full place object từ backend

### PlaceFormData
Form state data (cho PlaceFormPage)

### PlaceFilters
Filter state (cho PlacesListPage)

### Pagination
Pagination metadata từ backend

## 🔗 API

Tất cả API calls đi qua `placesApi` (wrapper của `placesAPI` từ `services/api.ts`)

```ts
import { placesApi } from '../features/places';

const places = await placesApi.getAll(filters);
const place = await placesApi.getById(id);
await placesApi.create(formData);
await placesApi.update(id, formData);
await placesApi.delete(id);
await placesApi.bulkUpdate({ placeIds, operation, updateData });
```

## ✅ Benefits

- **Modular**: Mỗi file có responsibility rõ ràng
- **Reusable**: Components nhỏ có thể tái sử dụng
- **Maintainable**: Dễ tìm code, dễ debug
- **Scalable**: Thêm features mới không ảnh hưởng code cũ
- **Type-safe**: TypeScript types tập trung
