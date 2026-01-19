# 🎯 FIX: User Preferences Personalization

## 📋 Vấn đề

Khi user tạo tài khoản mới và set preferences (thuần chay) trong Profile, nhưng khi tìm kiếm thì AI không nhận diện được preferences. Tài khoản cũ có preferences thì hoạt động bình thường.

## 🔍 Root Cause

Frontend **KHÔNG GỬI** `userPreferences` trong AI chat request. Backend có sẵn logic nhận preferences từ:
1. Request body (`userPreferences`)
2. Logged-in user (`req.user.preferences`)

Nhưng frontend chỉ gọi AI chat mà không truyền preferences vào context.

## ✅ Solution Implemented

### 1. **Frontend - SearchResult.jsx**

#### Import useUser hook
```jsx
import { useUser } from "../../contexts/UserContext";
```

#### Lấy user preferences
```jsx
const { user } = useUser();
const userPreferences = user?.preferences || null;
```

#### Gửi preferences trong AI chat
```jsx
// Auto-trigger search
aiChat.mutate({ 
    question: initialQuery,
    context: {
        userPreferences,
        usePersonalization: true
    }
});

// Manual search
const handleAISearch = useCallback((query, context = {}) => {
    if (query.trim()) {
        aiChat.mutate({ 
            question: query, 
            context: {
                ...context,
                userPreferences,
                usePersonalization: true
            }
        });
    }
}, [aiChat, userPreferences]);
```

### 2. **Backend - Debug Logging**

#### authService.js
```javascript
console.log('🔄 Updating user profile:', {
    userId,
    preferences: preferences ? {
        favoriteFoods: preferences.favoriteFoods?.length || 0,
        dietary: preferences.dietary?.length || 0,
        // ...
    } : 'null'
});
```

#### aiRoutes.js
```javascript
console.log('🤖 AI Chat Request:', {
    question: question.substring(0, 50) + '...',
    hasBodyPreferences: !!bodyPreferences,
    finalPreferences: userPreferences ? {
        dietary: userPreferences.dietary || [],
        // ...
    } : 'null',
    usePersonalization
});
```

#### mainChatPipeline.js
```javascript
console.log('🍽️ DIETARY FILTER DEBUG:', {
    shouldIncludePersonalization,
    hasUserPreferences: !!userPreferences,
    userDietary,
    queryLower: queryLower.substring(0, 50)
});
```

### 3. **Client - ProfilePreferences.jsx**

```javascript
console.log('📤 Saving preferences:', {
    dietary: formData.dietary,
    // ...
});
```

## 🧪 Testing Steps

### 1. Test Save Preferences

1. Đăng nhập với tài khoản mới
2. Vào `/profile`
3. Click **"Chỉnh sửa"** ở phần **"Cá nhân hóa"**
4. Chọn **"Thuần chay"** trong phần **"Chế độ ăn"**
5. Click **"Lưu thay đổi"**
6. **Kiểm tra Console:**
   ```
   📤 Saving preferences: { dietary: ['vegan'], ... }
   ✅ Preferences saved successfully: { ...preferences... }
   🔄 Updating user profile: { userId: ..., dietary: 1, ... }
   ✅ User profile updated successfully: { dietary: ['vegan'] }
   ```

### 2. Test AI Personalization

1. Sau khi lưu preferences, vào trang `/search`
2. Gõ query: **"tìm quán ăn cho tôi"** (generic food query)
3. **Kiểm tra Console:**
   ```
   🤖 AI Chat Request: {
     question: "tìm quán ăn cho tôi",
     hasBodyPreferences: true,
     finalPreferences: { dietary: ['vegan'], ... },
     usePersonalization: true
   }
   
   🍽️ DIETARY FILTER DEBUG: {
     shouldIncludePersonalization: true,
     hasUserPreferences: true,
     userDietary: ['vegan'],
     queryLower: "tìm quán ăn cho tôi"
   }
   
   🥗 Vegetarian check: {
     isVegetarian: true,
     isGenericFoodQueryForDietary: true,
     isSpecificFoodQuery: false
   }
   
   ✅ Augmenting query to vegetarian
   🥗 DIETARY FILTER: Vegetarian/Vegan user + generic food query -> Forcing "quán chay"
   ```

4. **Expected Result:** AI trả về danh sách **quán chay** (vegetarian/vegan places)

### 3. Test Specific Food Query (Should NOT override)

1. Gõ query: **"tìm quán phở"** (specific food)
2. **Expected:** AI trả về quán phở bình thường (không bị force thành "quán chay")
3. **Console:**
   ```
   🥗 Vegetarian check: {
     isVegetarian: true,
     isSpecificFoodQuery: true,  ← Specific query
     isGenericFoodQueryForDietary: false
   }
   ```

## 🎯 Expected Behavior

| User Dietary | Query | Result |
|-------------|-------|--------|
| **Vegan** | "tìm quán ăn cho tôi" | ✅ Quán chay |
| **Vegan** | "tìm quán phở" | ⚠️ Quán phở (không force) |
| **Vegetarian** | "gợi ý đồ ăn" | ✅ Quán chay |
| **None** | "tìm quán ăn" | ❌ Quán ăn bình thường |

## 🚀 Deployment Checklist

- [x] Frontend gửi `userPreferences` trong AI requests
- [x] Backend logging để debug preferences flow
- [x] AI Pipeline sử dụng preferences đúng cách
- [x] Test với tài khoản mới + preferences mới
- [ ] Remove console logs sau khi verify hoạt động

## 🔄 Next Steps

1. **Test thoroughly** với các scenarios:
   - Tài khoản mới + set preferences
   - Update preferences nhiều lần
   - Các dietary khác: Vegetarian, Healthy, Low-fat
   - Các preferences khác: Atmosphere, Activities

2. **Monitor logs** trong production để xác nhận flow đúng

3. **Remove debug logs** sau khi confirm hoạt động ổn định

4. **Document** behavior trong User Guide

## 📝 Notes

- `usePersonalization` flag **BẮT BUỘC** để enable dietary filtering
- Preferences được lưu trong User model MongoDB
- Backend middleware `optionalAuth` tự động fetch user.preferences
- Frontend PHẢI gửi preferences trong context để override cached user data
