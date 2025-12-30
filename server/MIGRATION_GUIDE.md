# 🔄 MIGRATION GUIDE: Controller-Service Refactoring

## 📋 Tổng quan

Dự án đã được refactor từ kiến trúc **Controller chứa business logic** sang **Controller-Service-Model** pattern chuẩn MERN.

### ✅ Đã hoàn thành

- ✅ Tạo 4 Service files: `authService.js`, `placeService.js`, `userService.js`, `uploadService.js`
- ✅ Tạo 4 Controller refactored files với suffix `.refactored.js`
- ✅ Tách toàn bộ business logic sang Service layer
- ✅ Controllers chỉ xử lý HTTP request/response

---

## 📂 Cấu trúc Files

### Service Layer (HOÀN THÀNH ✅)

```
server/services/
├── authService.js       # Authentication, JWT, OAuth logic
├── placeService.js      # Place CRUD, search, filter logic
├── userService.js       # User management, preferences logic
└── uploadService.js     # File upload, Cloudinary logic
```

### Controller Layer (Refactored - Chưa thay thế)

```
server/controllers/
├── authController.js               # CŨ - Chứa business logic
├── authController.refactored.js    # MỚI - Chỉ xử lý HTTP ✅

├── placesController.js             # CŨ - Chứa business logic
├── placesController.refactored.js  # MỚI - Chỉ xử lý HTTP ✅

├── userController.js               # CŨ - Chứa business logic
├── userController.refactored.js    # MỚI - Chỉ xử lý HTTP ✅

├── uploadController.js             # CŨ - Chứa business logic
└── uploadController.refactored.js  # MỚI - Chỉ xử lý HTTP ✅
```

---

## 🚀 Hướng dẫn Migration

### Bước 1: Backup code hiện tại

```bash
# Tạo branch backup
git checkout -b backup-before-refactor
git add .
git commit -m "Backup before controller-service refactor"
git checkout main
```

### Bước 2: Thay thế Controllers cũ

```bash
# Trong folder server/controllers/
mv authController.js authController.old.js
mv authController.refactored.js authController.js

mv placesController.js placesController.old.js
mv placesController.refactored.js placesController.js

mv userController.js userController.old.js
mv userController.refactored.js userController.js

mv uploadController.js uploadController.old.js
mv uploadController.refactored.js uploadController.js
```

### Bước 3: Test từng module

#### Test Authentication

```bash
# Start server
npm run dev

# Test các endpoints:
# POST /api/auth/register
# POST /api/auth/login
# GET /api/auth/profile
# GET /api/auth/google/url
# POST /api/auth/change-password
```

#### Test Places

```bash
# Test các endpoints:
# GET /api/places
# GET /api/places/:id
# POST /api/places
# PUT /api/places/:id
# DELETE /api/places/:id
# PATCH /api/places/:id/active
```

#### Test Users

```bash
# Test các endpoints:
# GET /api/users
# GET /api/users/:id
# PATCH /api/users/:id
# POST /api/users/:id/ban
# DELETE /api/users/:id
```

#### Test Upload

```bash
# Test các endpoints:
# POST /api/upload/avatar
# POST /api/upload/place-images
# DELETE /api/upload/image
```

### Bước 4: Nếu có lỗi - Rollback

```bash
# Rollback controllers cũ
mv authController.old.js authController.js
mv placesController.old.js placesController.js
mv userController.old.js userController.js
mv uploadController.old.js uploadController.js
```

### Bước 5: Sau khi test thành công - Xóa files backup

```bash
# Xóa controllers cũ
rm authController.old.js
rm placesController.old.js
rm userController.old.js
rm uploadController.old.js
```

---

## 🔍 So sánh Before/After

### ❌ BEFORE (Controller có business logic)

```javascript
// placesController.js (CŨ)
export const createPlace = async (req, res) => {
  try {
    // ❌ Validation logic trong controller
    if (!req.body.name || !req.body.address) {
      return res.status(400).json({ message: 'Missing fields' });
    }

    // ❌ Check duplicate trong controller
    const existing = await Place.findOne({ name: req.body.name });
    if (existing) {
      return res.status(400).json({ message: 'Already exists' });
    }

    // ❌ Data transformation trong controller
    const normalizedData = {
      ...req.body,
      status: req.body.status === 'published' ? 'Published' : 'Draft',
    };

    // ❌ Database operation trong controller
    const place = new Place(normalizedData);
    await place.save();

    res.status(201).json({ success: true, data: place });
  } catch (error) {
    // Error handling
  }
};
```

### ✅ AFTER (Controller gọi Service)

```javascript
// placesController.js (MỚI)
export const createPlace = async (req, res) => {
  try {
    const placeData = req.body;
    const userId = req.user?._id || null;

    // ✅ Chỉ gọi service
    const place = await placeService.createPlace(placeData, userId);

    // ✅ Chỉ format response
    res.status(201).json({
      success: true,
      data: place,
      message: 'Tạo địa điểm thành công',
    });
  } catch (error) {
    // ✅ Minimal error handling - just format
    if (error.name === 'ValidationError') {
      return res.status(400).json({
        success: false,
        message: 'Dữ liệu không hợp lệ',
        errors: Object.values(error.errors).map((e) => e.message),
      });
    }
    res.status(500).json({ success: false, message: error.message });
  }
};
```

```javascript
// placeService.js (MỚI - BUSINESS LOGIC)
export const createPlace = async (placeData, userId = null) => {
  // ✅ Validation logic trong service
  if (!placeData.name || !placeData.address) {
    throw new Error('Name and address are required');
  }

  // ✅ Check duplicate trong service
  const existing = await Place.findOne({ name: placeData.name });
  if (existing) {
    throw new Error('Place already exists');
  }

  // ✅ Data transformation trong service
  const normalizedData = {
    ...placeData,
    status: normalizeStatus(placeData.status),
    createdBy: userId,
  };

  // ✅ Database operation trong service
  const place = new Place(normalizedData);
  await place.save();

  return place;
};
```

---

## 📊 Lợi ích của Refactoring

### 1. **Separation of Concerns** ✅

- **Controller**: Chỉ xử lý HTTP (request/response)
- **Service**: Business logic, validation, data processing
- **Model**: Database schema, validation

### 2. **Testability** ✅

```javascript
// Dễ dàng unit test service
import { createPlace } from '../services/placeService';

describe('placeService.createPlace', () => {
  it('should throw error if name is missing', async () => {
    await expect(createPlace({})).rejects.toThrow('Name and address are required');
  });
});
```

### 3. **Reusability** ✅

```javascript
// Service có thể gọi từ nhiều nơi
import * as placeService from '../services/placeService';

// Từ controller
const place = await placeService.createPlace(data);

// Từ cron job
const place = await placeService.createPlace(importedData);

// Từ service khác
const place = await placeService.createPlace(processedData);
```

### 4. **Maintainability** ✅

- Thay đổi business logic chỉ ở service, không ảnh hưởng controller
- Dễ tìm bugs (business logic tập trung 1 chỗ)
- Code rõ ràng, dễ đọc

---

## ⚠️ Lưu ý quan trọng

### 1. **Import paths trong Routes**

Sau khi thay thế controllers, **KHÔNG CẦN** thay đổi routes vì tên function giữ nguyên:

```javascript
// routes/placeRoutes.js - KHÔNG CẦN SỬA
import { createPlace, getAllPlaces } from '../controllers/placesController.js';

router.post('/', protect, createPlace); // ✅ Vẫn hoạt động
```

### 2. **Error Handling**

Controllers mới vẫn có error handling tương tự controllers cũ, chỉ khác là business logic được move sang service.

### 3. **Middleware không đổi**

Tất cả middleware (auth, upload, validation) vẫn hoạt động bình thường.

---

## 🧪 Testing Checklist

Sau migration, test các chức năng chính:

- [ ] User registration & login
- [ ] Google OAuth login
- [ ] Profile update
- [ ] Avatar upload
- [ ] Place CRUD (create, read, update, delete)
- [ ] Place search & filter
- [ ] AI tags update
- [ ] User management (admin)
- [ ] User ban/unban
- [ ] Statistics endpoints

---

## 📞 Support

Nếu gặp vấn đề trong quá trình migration:

1. Kiểm tra console logs (có nhiều log debug)
2. So sánh với file `.old.js` để xem logic có khác biệt
3. Test từng endpoint riêng lẻ
4. Rollback nếu cần thiết

---

## ✨ Kết luận

Refactoring này giúp codebase:

- **Sạch hơn**: Controller ngắn gọn, dễ đọc
- **Dễ test hơn**: Service độc lập, dễ unit test
- **Dễ maintain hơn**: Business logic tập trung
- **Dễ scale hơn**: Service có thể reuse ở nhiều nơi

**Happy coding! 🚀**
