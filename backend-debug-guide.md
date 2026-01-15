# 🔧 Hướng dẫn Debug và Fix Backend cho Place Management

## 1. Kiểm tra Log Backend (QUAN TRỌNG NHẤT)

Mở terminal đang chạy Node.js/Express và xem stacktrace khi bạn click "Tạo & Xuất bản".

## 2. Thêm Error Handling tốt hơn

### Trong `server.js` hoặc `app.js`, thêm middleware error handling:

```javascript
// Error handling middleware (đặt cuối cùng)
app.use((err, req, res, next) => {
  console.error("🔥 API ERROR:", err);
  console.error("🔥 Stack trace:", err.stack);
  
  // Validation error từ Mongoose
  if (err.name === 'ValidationError') {
    const errors = Object.values(err.errors).map(e => e.message);
    return res.status(400).json({ 
      message: 'Validation Error', 
      errors: errors 
    });
  }
  
  // Cast error từ Mongoose (ID không hợp lệ)
  if (err.name === 'CastError') {
    return res.status(400).json({ 
      message: 'Invalid ID format' 
    });
  }
  
  res.status(err.status || 500).json({
    message: err.message || "Internal Server Error",
    stack: process.env.NODE_ENV === "development" ? err.stack : undefined,
  });
});
```

## 3. Sửa Controller Places

### Trong `controllers/placesController.js`, thêm logging:

```javascript
const createPlace = async (req, res, next) => {
  try {
    console.log("📝 Request body:", JSON.stringify(req.body, null, 2));
    console.log("👤 Request user:", req.user);
    
    // Validate required fields trước
    const { name, address, district, category, description } = req.body;
    
    if (!name?.trim()) {
      return res.status(400).json({ message: "Tên địa điểm là bắt buộc" });
    }
    
    if (!address?.trim()) {
      return res.status(400).json({ message: "Địa chỉ là bắt buộc" });
    }
    
    if (!district) {
      return res.status(400).json({ message: "Quận là bắt buộc" });
    }
    
    if (!category) {
      return res.status(400).json({ message: "Danh mục là bắt buộc" });
    }

    // Chuẩn hóa dữ liệu
    const placeData = {
      name: name.trim(),
      address: address.trim(),
      district,
      category,
      description: description?.trim() || '',
      priceRange: {
        min: Number(req.body.priceRange?.min) || 0,
        max: Number(req.body.priceRange?.max) || 0
      },
      images: req.body.images || [],
      menu: (req.body.menu || []).map(item => ({
        name: item.name?.trim() || '',
        price: Number(item.price) || 0,
        description: item.description?.trim() || '',
        category: item.category?.trim() || 'Khác'
      })),
      aiTags: req.body.aiTags || {
        space: [],
        mood: [],
        suitability: [],
        crowdLevel: [],
        music: [],
        parking: [],
        specialFeatures: []
      },
      contact: {
        phone: req.body.contact?.phone?.trim() || '',
        website: req.body.contact?.website?.trim() || ''
      },
      status: req.body.status || 'Draft',
      createdBy: req.user?._id, // Nếu có auth
      updatedBy: req.user?._id
    };

    console.log("💾 Data to save:", JSON.stringify(placeData, null, 2));

    const newPlace = new Place(placeData);
    const savedPlace = await newPlace.save();
    
    console.log("✅ Place created successfully:", savedPlace._id);
    
    res.status(201).json({
      success: true,
      data: savedPlace
    });
    
  } catch (error) {
    console.error("❌ Create place error:", error);
    console.error("❌ Error details:", error.message);
    next(error); // Pass to error middleware
  }
};
```

## 4. Kiểm tra Schema Mongoose

### Trong `models/Place.js`, đảm bảo schema đúng:

```javascript
const mongoose = require('mongoose');

const placeSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Tên địa điểm là bắt buộc'],
    trim: true,
    maxlength: [200, 'Tên địa điểm không được quá 200 ký tự']
  },
  address: {
    type: String,
    required: [true, 'Địa chỉ là bắt buộc'],
    trim: true
  },
  district: {
    type: String,
    required: [true, 'Quận là bắt buộc'],
    enum: {
      values: [
        'Ba Đình', 'Hoàn Kiếm', 'Tây Hồ', 'Long Biên', 'Cầu Giấy',
        'Đống Đa', 'Hai Bà Trưng', 'Hoàng Mai', 'Thanh Xuân', 'Sóc Sơn',
        'Đông Anh', 'Gia Lâm', 'Nam Từ Liêm', 'Bắc Từ Liêm', 'Mê Linh',
        'Hà Đông', 'Sơn Tây', 'Ba Vì', 'Phúc Thọ', 'Đan Phượng',
        'Hoài Đức', 'Quốc Oai', 'Thạch Thất', 'Chương Mỹ', 'Thanh Oai',
        'Thường Tín', 'Phú Xuyên', 'Ứng Hòa', 'Mỹ Đức'
      ],
      message: 'Quận không hợp lệ'
    }
  },
  category: {
    type: String,
    required: [true, 'Danh mục là bắt buộc'],
    enum: {
      values: ['Ăn uống', 'Vui chơi', 'Du lịch', 'Mua sắm', 'Thể thao'],
      message: 'Danh mục không hợp lệ'
    }
  },
  description: {
    type: String,
    required: [true, 'Mô tả là bắt buộc'],
    trim: true,
    maxlength: [2000, 'Mô tả không được quá 2000 ký tự']
  },
  priceRange: {
    min: {
      type: Number,
      required: true,
      min: [0, 'Giá tối thiểu phải >= 0']
    },
    max: {
      type: Number,
      required: true,
      min: [0, 'Giá tối đa phải >= 0'],
      validate: {
        validator: function(value) {
          return value >= this.priceRange.min;
        },
        message: 'Giá tối đa phải >= giá tối thiểu'
      }
    }
  },
  images: [{
    type: String,
    validate: {
      validator: function(url) {
        return /^https?:\/\/.+/.test(url);
      },
      message: 'URL hình ảnh không hợp lệ'
    }
  }],
  menu: [{
    name: {
      type: String,
      required: true,
      trim: true
    },
    price: {
      type: Number,
      required: true,
      min: [0, 'Giá món ăn phải >= 0']
    },
    description: {
      type: String,
      trim: true,
      default: ''
    },
    category: {
      type: String,
      trim: true,
      default: 'Khác'
    }
  }],
  aiTags: {
    space: [String],
    mood: [String],
    suitability: [String],
    crowdLevel: [String],
    music: [String],
    parking: [String],
    specialFeatures: [String]
  },
  contact: {
    phone: {
      type: String,
      trim: true,
      validate: {
        validator: function(phone) {
          return !phone || /^[\d\s\-\+\(\)]+$/.test(phone);
        },
        message: 'Số điện thoại không hợp lệ'
      }
    },
    website: {
      type: String,
      trim: true,
      validate: {
        validator: function(url) {
          return !url || /^https?:\/\/.+/.test(url);
        },
        message: 'Website phải bắt đầu bằng http:// hoặc https://'
      }
    }
  },
  status: {
    type: String,
    enum: ['Draft', 'Published', 'Archived'],
    default: 'Draft'
  },
  isActive: {
    type: Boolean,
    default: true
  },
  averageRating: {
    type: Number,
    default: 0,
    min: 0,
    max: 5
  },
  totalReviews: {
    type: Number,
    default: 0,
    min: 0
  },
  viewCount: {
    type: Number,
    default: 0,
    min: 0
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  updatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Place', placeSchema);
```

## 5. Kiểm tra Route và Middleware

### Trong `routes/adminRoutes.js` hoặc `routes/placeRoutes.js`:

```javascript
const express = require('express');
const router = express.Router();
const { createPlace, updatePlace } = require('../controllers/placesController');
const auth = require('../middleware/auth'); // Nếu có

// Đảm bảo có middleware để parse JSON
router.use(express.json({ limit: '10mb' }));

// Route tạo place
router.post('/places', 
  auth, // Nếu cần auth
  createPlace
);

module.exports = router;
```

## 6. Các lỗi thường gặp và cách fix

### A. Lỗi Validation
- Kiểm tra enum values có khớp với FE không
- Đảm bảo required fields được gửi
- Check độ dài string

### B. Lỗi Cast/Type
- Number fields nhận string → dùng Number() để convert
- ObjectId không hợp lệ → validate format

### C. Lỗi Auth
```javascript
// Trong middleware auth.js
const auth = (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({ message: 'No token provided' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    console.error('Auth error:', error);
    return res.status(401).json({ message: 'Invalid token' });
  }
};
```

## 7. Test thử

Sau khi sửa, thử tạo place với data đơn giản:

```json
{
  "name": "Test Place",
  "address": "123 Test Street",
  "district": "Hoàn Kiếm",
  "category": "Ăn uống",
  "description": "Test description",
  "priceRange": { "min": 50000, "max": 200000 },
  "status": "Draft"
}
```

## 8. Debug steps tiếp theo

1. Check log backend khi submit form
2. So sánh payload FE vs backend nhận được
3. Test từng field một để tìm field nào gây lỗi
4. Check database connection và permissions