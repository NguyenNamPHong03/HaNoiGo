# 🎯 User Preferences Enhancement - Backend Documentation

## 📋 Tổng quan

Đã thêm 2 fields mới vào User preferences để cá nhân hóa gợi ý AI tốt hơn:
- **`atmosphere`**: Không khí yêu thích (yên tĩnh, sôi động, lãng mạn...)
- **`activities`**: Hoạt động yêu thích (hẹn hò, học bài, tụ tập...)

## 🗄️ Database Schema

### User Model (`server/models/User.js`)

```javascript
preferences: {
  favoriteFoods: [String],
  styles: ['modern', 'traditional', 'cozy', 'elegant', 'casual', 'upscale'],
  dietary: ['vegetarian', 'vegan', 'non-vegetarian', 'healthy', 'low-spicy', 'low-fat', 'low-carb'],
  
  // ✨ NEW FIELDS
  atmosphere: ['quiet', 'lively', 'cheerful', 'romantic', 'cozy', 'elegant', 'outdoor'],
  activities: ['singing', 'live-music', 'watch-football', 'hangout', 'dating', 'work-study'],
  
  priceRange: {
    min: Number,
    max: Number
  }
}
```

## 🔄 API Endpoints

### Update User Profile
**Endpoint**: `PUT /api/auth/profile`

**Request Body**:
```json
{
  "displayName": "Nguyễn Văn A",
  "avatarUrl": "https://...",
  "preferences": {
    "favoriteFoods": ["Phở", "Bún chả"],
    "styles": ["modern", "cozy"],
    "dietary": ["healthy"],
    "atmosphere": ["quiet", "romantic"],
    "activities": ["dating", "work-study"]
  }
}
```

**Response**:
```json
{
  "success": true,
  "data": {
    "_id": "...",
    "email": "user@example.com",
    "displayName": "Nguyễn Văn A",
    "preferences": { ... }
  }
}
```

## 🤖 AI Integration

### 1. System Prompt Enhancement

File: `server/services/ai/prompts/templates/system.v1.txt`

Đã thêm section hiển thị sở thích người dùng:
```
📝 SỞ THÍCH CỦA NGƯỜI DÙNG:
- Món ăn yêu thích: Phở, Bún chả
- Phong cách ưa thích: Hiện đại, Ấm cúng
- Không khí ưa thích: Yên tĩnh, Lãng mạn
- Hoạt động yêu thích: Hẹn hò, Làm việc/học bài
```

### 2. Preferences Mapper Utility

File: `server/services/ai/utils/preferencesMapper.js`

**Functions**:

#### `mapPreferencesToFilters(userPreferences)`
Map user preferences sang Pinecone filters:

```javascript
import { mapPreferencesToFilters } from './utils/preferencesMapper.js';

const filters = mapPreferencesToFilters(user.preferences);
// Returns:
// {
//   'aiTags.mood': { '$in': ['yên tĩnh', 'lãng mạn'] },
//   'aiTags.suitability': { '$in': ['hẹn hò', 'học bài'] }
// }
```

#### `formatPreferencesForPrompt(userPreferences)`
Format preferences thành chuỗi cho AI prompt:

```javascript
const prefContext = formatPreferencesForPrompt(user.preferences);
// "Không khí: Yên tĩnh, Lãng mạn | Hoạt động: Hẹn hò, Làm việc/học bài"
```

#### `calculatePreferenceScore(place, userPreferences)`
Tính điểm khớp giữa place và user preferences:

```javascript
const score = calculatePreferenceScore(placeDoc, user.preferences);
// Returns: 0.75 (75% match)
```

## 🔗 Mapping Logic

### Atmosphere → aiTags

| User Preference | Maps to aiTags.mood/space |
|----------------|---------------------------|
| quiet          | yên tĩnh, yên bình, thư giãn |
| lively         | sôi động, năng động, vui vẻ |
| cheerful       | vui vẻ, sôi động |
| romantic       | lãng mạn, ấm cúng |
| cozy           | ấm cúng, thư giãn |
| elegant        | chuyên nghiệp, thanh lịch |
| outdoor        | ngoài trời, thoáng đãng, rooftop |

### Activities → aiTags.suitability

| User Preference | Maps to aiTags.suitability |
|----------------|---------------------------|
| singing        | karaoke, tụ tập |
| live-music     | sôi động, vui vẻ |
| watch-football | tụ tập, nhóm lớn |
| hangout        | bạn bè, tụ tập, nhóm lớn |
| dating         | hẹn hò, lãng mạn |
| work-study     | học bài, công việc, một mình |

## 📝 Usage Example

### In Chat Pipeline

```javascript
import { mapPreferencesToFilters, formatPreferencesForPrompt } from './utils/preferencesMapper.js';

async function processChatMessage(userId, message) {
  // 1. Get user preferences
  const user = await User.findById(userId);
  
  // 2. Map to retrieval filters
  const filters = mapPreferencesToFilters(user.preferences);
  
  // 3. Search with preferences
  const results = await hybridRetriever.search(message, filters);
  
  // 4. Format for prompt
  const prefContext = formatPreferencesForPrompt(user.preferences);
  
  // 5. Generate AI response with personalized context
  const response = await llm.generate({
    systemPrompt: systemPrompt,
    userPreferences: prefContext,
    context: results,
    question: message
  });
  
  return response;
}
```

## ✅ Migration Checklist

- [x] Update User model schema
- [x] Update system prompt template
- [x] Create preferencesMapper utility
- [x] Document API changes
- [ ] Update chat pipeline to use preferences (TODO)
- [ ] Add preference-based ranking (TODO)
- [ ] Test preference matching accuracy (TODO)

## 🧪 Testing

### Test Cases

1. **User với atmosphere = ['quiet', 'romantic']**
   - Should prefer places với aiTags.mood = ['yên tĩnh', 'lãng mạn']

2. **User với activities = ['work-study']**
   - Should prefer places với aiTags.suitability = ['học bài', 'công việc']

3. **User không có preferences**
   - Should fallback to standard search (no filters)

## 📊 Database Migration (Optional)

Nếu cần set default values cho existing users:

```javascript
// server/scripts/migrateUserPreferences.js
import User from '../models/User.js';

async function migratePreferences() {
  const result = await User.updateMany(
    { 'preferences.atmosphere': { $exists: false } },
    { 
      $set: { 
        'preferences.atmosphere': [],
        'preferences.activities': []
      }
    }
  );
  
  console.log(`Updated ${result.modifiedCount} users`);
}

migratePreferences();
```

## 🎯 Next Steps

1. **Integrate vào Chat Pipeline**: Update `mainChatPipeline.js` để sử dụng preferences
2. **Re-ranking**: Sort results dựa trên `calculatePreferenceScore`
3. **Analytics**: Track xem preferences có improve recommendation quality không
4. **A/B Testing**: Test với/không có preference filtering

---

**Last Updated**: January 13, 2026
**Version**: 1.0.0
