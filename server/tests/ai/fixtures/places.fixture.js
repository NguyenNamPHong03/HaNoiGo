/**
 * Test Fixtures - Sample Places Data
 * Purpose: Provide consistent test data for AI agent testing
 */

export const samplePlaces = [
  // PHỞ - Vietnamese Noodle Soup
  {
    _id: '507f1f77bcf86cd799439011',
    name: 'Phở Thìn Bờ Hồ',
    address: '13 Lò Đúc, Hoàn Kiếm, Hà Nội',
    district: 'Hoàn Kiếm',
    category: 'Quán ăn',
    description: 'Phở bò truyền thống Hà Nội với nước dùng ninh xương 24h, thịt bò tươi mỏng.',
    priceRange: { min: 40000, max: 70000 },
    averageRating: 4.5,
    totalReviews: 320,
    images: ['https://example.com/pho.jpg'],
    aiTags: {
      space: ['ấm cúng', 'gần hồ'],
      mood: ['truyền thống', 'gia đình'],
      suitability: ['ăn sáng', 'ăn trưa', 'du lịch']
    },
    location: {
      type: 'Point',
      coordinates: [105.8542, 21.0285]
    },
    status: 'Published',
    isActive: true
  },
  // Add 9 more places (truncated for brevity)
];

export const sampleUserPreferences = {
  withPreferences: {
    _id: 'user_001',
    preferences: {
      favoriteFoods: ['Phở', 'Bún chả'],
      styles: ['yên tĩnh', 'vintage'],
      dietary: []
    }
  },
  vegetarian: {
    _id: 'user_002',
    preferences: {
      dietary: ['vegetarian', 'vegan']
    }
  }
};

export default { samplePlaces, sampleUserPreferences };
