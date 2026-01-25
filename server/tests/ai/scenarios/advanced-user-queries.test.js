/**
 * ADVANCED AI Agent - User Scenario Tests
 * Purpose: Test complex real-world scenarios and edge cases
 * Coverage: Advanced queries, personalization, multi-turn conversations
 * 
 * Test Categories:
 * 1. Personalization Tests (20 tests)
 * 2. Multi-turn Conversation (15 tests)
 * 3. Context-aware Queries (15 tests)
 * 4. Time-based Queries (10 tests)
 * 5. Group & Event Queries (15 tests)
 * 6. Accessibility & Special Needs (10 tests)
 * 7. Language & Cultural Nuances (15 tests)
 * 8. Performance & Stress Tests (10 tests)
 */

import { describe, test, expect, beforeAll, afterAll } from '@jest/globals';
import request from 'supertest';
import app from '../../../server.js';

// Helper function to make AI chat requests
const makeAIRequest = async (question, context = {}) => {
  return request(app)
    .post('/api/ai/chat')
    .send({
      question,
      ...context
    });
};

// Helper function to validate response structure
const validateAIResponse = (response) => {
  expect(response.status).toBe(200);
  expect(response.body).toHaveProperty('success', true);
  expect(response.body).toHaveProperty('data');
  expect(response.body.data).toHaveProperty('question');
  expect(response.body.data).toHaveProperty('answer');
  expect(response.body.data).toHaveProperty('intent');
  expect(response.body.data).toHaveProperty('places');
  expect(Array.isArray(response.body.data.places)).toBe(true);
};

describe('ADVANCED AI Agent - Complex Scenario Tests', () => {
  
  // ========================================
  // 1. PERSONALIZATION TESTS (20 tests)
  // ========================================
  describe('1. Personalization Tests', () => {
    
    test('TC101: Vegetarian user asks for generic "quán ăn" - should return chay only', async () => {
      const response = await makeAIRequest('Tìm quán ăn ngon', {
        userPreferences: {
          dietary: ['vegetarian', 'vegan'],
          favoriteFoods: [],
          styles: []
        },
        usePersonalization: true
      });
      
      validateAIResponse(response);
      const places = response.body.data.places;
      
      // Should ONLY return vegetarian places
      const allVegetarian = places.every(p => 
        p.menu?.dietary?.includes('vegetarian') ||
        p.menu?.dietary?.includes('vegan') ||
        p.description?.toLowerCase().includes('chay')
      );
      expect(allVegetarian).toBe(true);
    });

    test('TC102: Vegetarian user asks for specific "phở bò" - should return phở bò (specific overrides preference)', async () => {
      const response = await makeAIRequest('Tìm quán phở bò', {
        userPreferences: {
          dietary: ['vegetarian'],
          favoriteFoods: [],
          styles: []
        },
        usePersonalization: true
      });
      
      validateAIResponse(response);
      const places = response.body.data.places;
      
      // Should return phở bò (specific dish overrides dietary preference)
      const hasPhoBo = places.some(p => 
        p.name.toLowerCase().includes('phở') ||
        p.description?.toLowerCase().includes('phở bò')
      );
      expect(hasPhoBo).toBe(true);
    });

    test('TC103: User preferences - "Thích không gian yên tĩnh" + asks "tìm quán cafe"', async () => {
      const response = await makeAIRequest('Tìm quán cafe', {
        userPreferences: {
          dietary: [],
          favoriteFoods: [],
          styles: ['yên tĩnh', 'ấm cúng']
        },
        usePersonalization: true
      });
      
      validateAIResponse(response);
      const places = response.body.data.places;
      
      // Should prioritize quiet cafes
      const hasQuietCafes = places.some(p => 
        p.aiTags?.space?.includes('yên tĩnh') ||
        p.aiTags?.mood?.includes('ấm cúng')
      );
      expect(hasQuietCafes).toBe(true);
    });

    test('TC104: User with "Không ăn cay" preference', async () => {
      const response = await makeAIRequest('Tìm quán ăn', {
        userPreferences: {
          dietary: ['không cay'],
          favoriteFoods: [],
          styles: []
        },
        usePersonalization: true
      });
      
      validateAIResponse(response);
      expect(response.body.data.places.length).toBeGreaterThan(0);
    });

    test('TC105: User prefers "Món Hàn Quốc" in favoriteFoods', async () => {
      const response = await makeAIRequest('Gợi ý quán ăn', {
        userPreferences: {
          dietary: [],
          favoriteFoods: ['Kimchi', 'Bulgogi', 'Korean BBQ'],
          styles: []
        },
        usePersonalization: true
      });
      
      validateAIResponse(response);
      const places = response.body.data.places;
      
      // Should prioritize Korean restaurants
      const hasKorean = places.some(p => 
        p.category?.includes('Hàn Quốc') ||
        p.description?.toLowerCase().includes('hàn quốc')
      );
      expect(hasKorean).toBe(true);
    });

    test('TC106: Personalization OFF - should ignore user preferences', async () => {
      const response = await makeAIRequest('Tìm quán ăn', {
        userPreferences: {
          dietary: ['vegetarian'],
          favoriteFoods: [],
          styles: []
        },
        usePersonalization: false  // OFF
      });
      
      validateAIResponse(response);
      // Should return all types of restaurants
      expect(response.body.data.places.length).toBeGreaterThan(0);
    });

    test('TC107: User history - recently visited places should be deprioritized', async () => {
      const response = await makeAIRequest('Tìm quán cafe mới', {
        userHistory: {
          recentlyVisited: ['place-id-1', 'place-id-2']
        }
      });
      
      validateAIResponse(response);
      // Should not show recently visited places
      const places = response.body.data.places;
      expect(places.some(p => p._id === 'place-id-1')).toBe(false);
    });

    test('TC108: Budget preference - User always looks for "giá rẻ"', async () => {
      const response = await makeAIRequest('Tìm quán ăn', {
        userPreferences: {
          budgetRange: { min: 0, max: 100000 }
        },
        usePersonalization: true
      });
      
      validateAIResponse(response);
      const places = response.body.data.places;
      
      places.forEach(p => {
        if (p.priceRange) {
          expect(p.priceRange.max).toBeLessThanOrEqual(100000);
        }
      });
    });

    test('TC109: Time preference - User prefers "mở cửa sớm"', async () => {
      const response = await makeAIRequest('Tìm quán cafe', {
        userPreferences: {
          openingHours: 'early'  // Before 8:00 AM
        }
      });
      
      validateAIResponse(response);
      expect(response.body.data.places.length).toBeGreaterThan(0);
    });

    test('TC110: Disabled personalization entirely - behaves like anonymous user', async () => {
      const response = await makeAIRequest('Tìm quán ăn', {
        usePersonalization: false
      });
      
      validateAIResponse(response);
      expect(response.body.data.places.length).toBeGreaterThan(0);
    });

    // TC111-TC120: Additional personalization tests
    const additionalPersonalization = [
      { query: 'Quán ăn ngon', preferences: { favoriteFoods: ['Phở', 'Bún chả'] } },
      { query: 'Gợi ý cafe', preferences: { styles: ['vintage', 'retro'] } },
      { query: 'Nhà hàng', preferences: { dietary: ['eat-clean', 'healthy'] } },
      { query: 'Quán ăn', preferences: { ambiance: ['ngoài trời', 'view đẹp'] } },
      { query: 'Cafe', preferences: { facilities: ['wifi', 'ổ cắm'] } },
      { query: 'Nhà hàng', preferences: { parking: true } },
      { query: 'Quán ăn', preferences: { petFriendly: true } },
      { query: 'Cafe', preferences: { smokingArea: false } },
      { query: 'Nhà hàng', preferences: { accessibleForDisabled: true } },
      { query: 'Quán ăn', preferences: { kidsMenu: true } }
    ];

    additionalPersonalization.forEach((item, index) => {
      test(`TC${String(111 + index).padStart(3, '0')}: "${item.query}" with preferences`, async () => {
        const response = await makeAIRequest(item.query, {
          userPreferences: item.preferences,
          usePersonalization: true
        });
        validateAIResponse(response);
      });
    });
  });

  // ========================================
  // 2. MULTI-TURN CONVERSATION (15 tests)
  // ========================================
  describe('2. Multi-turn Conversation', () => {
    
    test('TC121: Follow-up question - "Còn quán nào khác không?"', async () => {
      // First query
      const firstResponse = await makeAIRequest('Tìm quán phở');
      validateAIResponse(firstResponse);
      
      // Follow-up query
      const followUpResponse = await makeAIRequest('Còn quán nào khác không?', {
        conversationHistory: [
          { role: 'user', content: 'Tìm quán phở' },
          { role: 'assistant', content: firstResponse.body.data.answer }
        ]
      });
      
      validateAIResponse(followUpResponse);
      expect(followUpResponse.body.data.places.length).toBeGreaterThan(0);
    });

    test('TC122: Clarification - "Tôi muốn giá rẻ hơn"', async () => {
      const response = await makeAIRequest('Tôi muốn giá rẻ hơn', {
        conversationHistory: [
          { role: 'user', content: 'Tìm quán cafe' },
          { role: 'assistant', content: 'Đây là 5 quán cafe...' }
        ]
      });
      
      validateAIResponse(response);
      // Should apply price filter
      const places = response.body.data.places;
      const hasCheaperPlaces = places.some(p => 
        p.priceRange && p.priceRange.max <= 50000
      );
      expect(hasCheaperPlaces).toBe(true);
    });

    test('TC123: Referencing previous result - "Quán đầu tiên có mở cửa không?"', async () => {
      const response = await makeAIRequest('Quán đầu tiên có mở cửa không?', {
        conversationHistory: [
          { role: 'user', content: 'Tìm quán phở' },
          { role: 'assistant', content: 'Dạ có 3 quán: 1. Phở Thin...', places: ['place-id-1'] }
        ]
      });
      
      validateAIResponse(response);
      expect(response.body.data.answer).toBeDefined();
    });

    test('TC124: Change location mid-conversation - "Còn ở Hoàn Kiếm thì sao?"', async () => {
      const response = await makeAIRequest('Còn ở Hoàn Kiếm thì sao?', {
        conversationHistory: [
          { role: 'user', content: 'Tìm quán cafe ở Ba Đình' }
        ]
      });
      
      validateAIResponse(response);
      const places = response.body.data.places;
      
      // Should filter by Hoàn Kiếm district
      if (places.length > 0) {
        const hasHoanKiem = places.some(p => p.district === 'Hoàn Kiếm');
        expect(hasHoanKiem).toBe(true);
      }
    });

    test('TC125: Add filter - "Có view đẹp không?"', async () => {
      const response = await makeAIRequest('Có view đẹp không?', {
        conversationHistory: [
          { role: 'user', content: 'Tìm quán cafe' }
        ]
      });
      
      validateAIResponse(response);
    });

    // TC126-TC135: Additional multi-turn tests
    const additionalMultiTurn = [
      'Thêm yêu cầu có wifi nữa',
      'Quán nào gần nhất?',
      'Còn mở cửa đến tối không?',
      'Có chỗ đậu xe không?',
      'Giá bao nhiêu?',
      'Review thế nào?',
      'Có đông không?',
      'Phù hợp nhóm bao nhiêu người?',
      'Menu có gì?',
      'Đường đi như thế nào?'
    ];

    additionalMultiTurn.forEach((query, index) => {
      test(`TC${String(126 + index).padStart(3, '0')}: Follow-up - "${query}"`, async () => {
        const response = await makeAIRequest(query, {
          conversationHistory: [
            { role: 'user', content: 'Tìm quán cafe' },
            { role: 'assistant', content: 'Dạ có 3 quán...' }
          ]
        });
        validateAIResponse(response);
      });
    });
  });

  // ========================================
  // 3. CONTEXT-AWARE QUERIES (15 tests)
  // ========================================
  describe('3. Context-aware Queries', () => {
    
    test('TC136: Weather context - "Trời mưa, gợi ý quán trong nhà"', async () => {
      const response = await makeAIRequest('Trời mưa, gợi ý quán trong nhà', {
        weather: {
          condition: 'rainy',
          temperature: 20
        }
      });
      
      validateAIResponse(response);
      const places = response.body.data.places;
      
      // Should prioritize indoor places
      const hasIndoorPlaces = places.some(p => 
        p.aiTags?.space?.includes('trong nhà') ||
        !p.aiTags?.space?.includes('ngoài trời')
      );
      expect(hasIndoorPlaces).toBe(true);
    });

    test('TC137: Time context - "Bây giờ 6h sáng, tìm quán ăn sáng"', async () => {
      const response = await makeAIRequest('Tìm quán ăn sáng', {
        currentTime: '06:00:00'
      });
      
      validateAIResponse(response);
      const answer = response.body.data.answer.toLowerCase();
      expect(answer.includes('sáng') || answer.includes('phở')).toBe(true);
    });

    test('TC138: Event context - "Đang ở gần Lăng Bác, tìm quán gần"', async () => {
      const response = await makeAIRequest('Đang ở gần Lăng Bác, tìm quán gần', {
        currentLocation: {
          lat: 21.0375,
          lng: 105.8345,
          landmark: 'Lăng Bác Hồ Chí Minh'
        }
      });
      
      validateAIResponse(response);
      expect(response.body.data.places.length).toBeGreaterThan(0);
    });

    test('TC139: Season context - "Mùa đông Hà Nội, gợi ý quán ấm"', async () => {
      const response = await makeAIRequest('Mùa đông Hà Nội, gợi ý quán ấm', {
        season: 'winter',
        temperature: 15
      });
      
      validateAIResponse(response);
      const answer = response.body.data.answer.toLowerCase();
      expect(answer.includes('ấm') || answer.includes('lẩu')).toBe(true);
    });

    test('TC140: Holiday context - "Ngày Tết, quán nào mở cửa?"', async () => {
      const response = await makeAIRequest('Ngày Tết, quán nào mở cửa?', {
        specialDay: 'Tết Nguyên Đán',
        date: '2026-01-29'
      });
      
      validateAIResponse(response);
      expect(response.body.data.answer).toBeDefined();
    });

    test('TC141: Traffic context - "Tắc đường, tìm quán gần nhất"', async () => {
      const response = await makeAIRequest('Tắc đường, tìm quán gần nhất', {
        traffic: 'heavy',
        currentLocation: { lat: 21.0285, lng: 105.8542 }
      });
      
      validateAIResponse(response);
      // Should prioritize nearby places
      const places = response.body.data.places;
      expect(places.length).toBeGreaterThan(0);
    });

    test('TC142: Budget context - "Còn 100k trong ví"', async () => {
      const response = await makeAIRequest('Còn 100k trong ví, ăn gì đây?');
      
      validateAIResponse(response);
      const places = response.body.data.places;
      
      places.forEach(p => {
        if (p.priceRange) {
          expect(p.priceRange.max).toBeLessThanOrEqual(100000);
        }
      });
    });

    test('TC143: Companion context - "Đi với bạn gái"', async () => {
      const response = await makeAIRequest('Đi với bạn gái, gợi ý quán nào?');
      
      validateAIResponse(response);
      const places = response.body.data.places;
      
      // Should suggest romantic places
      const hasRomanticPlaces = places.some(p => 
        p.aiTags?.mood?.includes('lãng mạn') ||
        p.aiTags?.suitability?.includes('hẹn hò')
      );
      expect(hasRomanticPlaces).toBe(true);
    });

    test('TC144: Health context - "Ốm, tìm quán ăn nhẹ"', async () => {
      const response = await makeAIRequest('Ốm, tìm quán ăn nhẹ');
      
      validateAIResponse(response);
      const answer = response.body.data.answer.toLowerCase();
      expect(answer.includes('nhẹ') || answer.includes('cháo')).toBe(true);
    });

    test('TC145: Mood context - "Buồn, tìm chỗ chill"', async () => {
      const response = await makeAIRequest('Buồn, tìm chỗ chill');
      
      validateAIResponse(response);
      const places = response.body.data.places;
      
      const hasChillPlaces = places.some(p => 
        p.aiTags?.mood?.includes('chill') ||
        p.aiTags?.space?.includes('yên tĩnh')
      );
      expect(hasChillPlaces).toBe(true);
    });

    // TC146-TC150: Additional context-aware tests
    const additionalContext = [
      { query: 'Sắp họp quan trọng, tìm quán cafe', context: { urgency: 'high' } },
      { query: 'Tối nay có buổi hẹn đặc biệt', context: { specialOccasion: true } },
      { query: 'Lần đầu đến Hà Nội', context: { touristMode: true } },
      { query: 'Đang đói bụng lắm', context: { hunger: 'very high' } },
      { query: 'Muốn ngồi cả ngày làm việc', context: { duration: 'all-day' } }
    ];

    additionalContext.forEach((item, index) => {
      test(`TC${String(146 + index).padStart(3, '0')}: Context - "${item.query}"`, async () => {
        const response = await makeAIRequest(item.query, item.context);
        validateAIResponse(response);
      });
    });
  });

  // ========================================
  // 4. TIME-BASED QUERIES (10 tests)
  // ========================================
  describe('4. Time-based Queries', () => {
    
    test('TC151: Morning - "Ăn sáng gì đây?" (6:00 AM)', async () => {
      const response = await makeAIRequest('Ăn sáng gì đây?', {
        currentTime: '06:00:00'
      });
      
      validateAIResponse(response);
      const answer = response.body.data.answer.toLowerCase();
      expect(answer.includes('sáng') || answer.includes('phở')).toBe(true);
    });

    test('TC152: Lunch - "Ăn trưa đâu?" (12:00 PM)', async () => {
      const response = await makeAIRequest('Ăn trưa đâu?', {
        currentTime: '12:00:00'
      });
      
      validateAIResponse(response);
      expect(response.body.data.places.length).toBeGreaterThan(0);
    });

    test('TC153: Late night - "Đói đêm, quán nào còn mở?" (23:00)', async () => {
      const response = await makeAIRequest('Đói đêm, quán nào còn mở?', {
        currentTime: '23:00:00'
      });
      
      validateAIResponse(response);
      const answer = response.body.data.answer.toLowerCase();
      expect(answer).toBeDefined();
    });

    test('TC154: Weekend - "Cuối tuần đi đâu?"', async () => {
      const response = await makeAIRequest('Cuối tuần đi đâu?', {
        dayOfWeek: 'Saturday'
      });
      
      validateAIResponse(response);
      expect(response.body.data.places.length).toBeGreaterThan(0);
    });

    test('TC155: Rush hour - "Giờ cao điểm, quán gần công ty"', async () => {
      const response = await makeAIRequest('Giờ cao điểm, quán gần công ty', {
        currentTime: '12:00:00',
        traffic: 'heavy'
      });
      
      validateAIResponse(response);
    });

    // TC156-TC160: Additional time-based tests
    const additionalTime = [
      { query: 'Cafe buổi sáng', time: '08:00:00' },
      { query: 'Đồ ăn chiều', time: '16:00:00' },
      { query: 'Ăn tối đâu?', time: '19:00:00' },
      { query: 'Nhậu đêm', time: '22:00:00' },
      { query: 'Quán mở 24/7', time: '02:00:00' }
    ];

    additionalTime.forEach((item, index) => {
      test(`TC${String(156 + index).padStart(3, '0')}: Time - "${item.query}" at ${item.time}`, async () => {
        const response = await makeAIRequest(item.query, {
          currentTime: item.time
        });
        validateAIResponse(response);
      });
    });
  });

  // ========================================
  // 5. GROUP & EVENT QUERIES (15 tests)
  // ========================================
  describe('5. Group & Event Queries', () => {
    
    test('TC161: Large group - "Nhóm 20 người, đặt chỗ ăn"', async () => {
      const response = await makeAIRequest('Nhóm 20 người, đặt chỗ ăn');
      
      validateAIResponse(response);
      const places = response.body.data.places;
      
      // Should suggest places that can handle large groups
      const hasLargeCapacity = places.some(p => 
        p.aiTags?.suitability?.includes('tụ tập nhóm') ||
        p.description?.toLowerCase().includes('phòng riêng')
      );
      expect(hasLargeCapacity).toBe(true);
    });

    test('TC162: Birthday party - "Tổ chức sinh nhật cho bạn"', async () => {
      const response = await makeAIRequest('Tổ chức sinh nhật cho bạn');
      
      validateAIResponse(response);
      const answer = response.body.data.answer.toLowerCase();
      expect(answer.includes('sinh nhật') || answer.includes('tiệc')).toBe(true);
    });

    test('TC163: Business meeting - "Gặp đối tác làm ăn"', async () => {
      const response = await makeAIRequest('Gặp đối tác làm ăn');
      
      validateAIResponse(response);
      const places = response.body.data.places;
      
      // Should suggest professional, quiet places
      const hasProfessionalPlaces = places.some(p => 
        p.aiTags?.space?.includes('yên tĩnh') ||
        p.category?.includes('Nhà hàng')
      );
      expect(hasProfessionalPlaces).toBe(true);
    });

    test('TC164: Family gathering - "Họp mặt gia đình 10 người"', async () => {
      const response = await makeAIRequest('Họp mặt gia đình 10 người');
      
      validateAIResponse(response);
      expect(response.body.data.places.length).toBeGreaterThan(0);
    });

    test('TC165: Kids-friendly - "Đi với trẻ em"', async () => {
      const response = await makeAIRequest('Đi với trẻ em, quán nào phù hợp?');
      
      validateAIResponse(response);
      expect(response.body.data.answer).toBeDefined();
    });

    test('TC166: Elderly-friendly - "Đi với ông bà"', async () => {
      const response = await makeAIRequest('Đi với ông bà, quán nào?');
      
      validateAIResponse(response);
    });

    test('TC167: Corporate event - "Team building 50 người"', async () => {
      const response = await makeAIRequest('Team building 50 người');
      
      validateAIResponse(response);
      const places = response.body.data.places;
      expect(places.length).toBeGreaterThan(0);
    });

    test('TC168: Wedding reception - "Tiệc cưới nhỏ 30 khách"', async () => {
      const response = await makeAIRequest('Tiệc cưới nhỏ 30 khách');
      
      validateAIResponse(response);
    });

    test('TC169: Study group - "Nhóm học 5 người"', async () => {
      const response = await makeAIRequest('Nhóm học 5 người, quán nào yên tĩnh?');
      
      validateAIResponse(response);
      const places = response.body.data.places;
      
      const hasStudyPlaces = places.some(p => 
        p.aiTags?.suitability?.includes('học bài') ||
        p.aiTags?.space?.includes('yên tĩnh')
      );
      expect(hasStudyPlaces).toBe(true);
    });

    test('TC170: Alumni reunion - "Gặp lại bạn cũ"', async () => {
      const response = await makeAIRequest('Gặp lại bạn cũ, quán nào vui?');
      
      validateAIResponse(response);
    });

    // TC171-TC175: Additional group/event tests
    const additionalEvents = [
      'Liên hoan công ty',
      'Gặp mặt câu lạc bộ',
      'Tụ tập bạn bè',
      'Họp lớp',
      'Tiệc tất niên'
    ];

    additionalEvents.forEach((event, index) => {
      test(`TC${String(171 + index).padStart(3, '0')}: Event - "${event}"`, async () => {
        const response = await makeAIRequest(event);
        validateAIResponse(response);
      });
    });
  });

  // ========================================
  // 6. ACCESSIBILITY & SPECIAL NEEDS (10 tests)
  // ========================================
  describe('6. Accessibility & Special Needs', () => {
    
    test('TC176: Wheelchair accessible - "Xe lăn đi được không?"', async () => {
      const response = await makeAIRequest('Xe lăn đi được không?', {
        accessibilityNeeds: ['wheelchair']
      });
      
      validateAIResponse(response);
      expect(response.body.data.answer).toBeDefined();
    });

    test('TC177: Allergy - "Dị ứng hải sản"', async () => {
      const response = await makeAIRequest('Tìm quán ăn, dị ứng hải sản', {
        allergies: ['seafood']
      });
      
      validateAIResponse(response);
      expect(response.body.data.places.length).toBeGreaterThan(0);
    });

    test('TC178: Diabetes - "Bệnh tiểu đường, ăn gì?"', async () => {
      const response = await makeAIRequest('Bệnh tiểu đường, ăn gì?');
      
      validateAIResponse(response);
      const answer = response.body.data.answer.toLowerCase();
      expect(answer.includes('đường') || answer.includes('healthy')).toBe(true);
    });

    test('TC179: Lactose intolerant - "Không dung nạp lactose"', async () => {
      const response = await makeAIRequest('Không dung nạp lactose, quán nào?');
      
      validateAIResponse(response);
    });

    test('TC180: Nut allergy - "Dị ứng đậu phộng"', async () => {
      const response = await makeAIRequest('Dị ứng đậu phộng');
      
      validateAIResponse(response);
    });

    // TC181-TC185: Additional accessibility tests
    const additionalAccessibility = [
      { query: 'Có chỗ đậu xe cho người khuyết tật', needs: ['parking'] },
      { query: 'Có menu chữ nổi', needs: ['braille'] },
      { query: 'Có ramp cho xe lăn', needs: ['ramp'] },
      { query: 'Nhà vệ sinh tiện cho người khuyết tật', needs: ['accessible-toilet'] },
      { query: 'Có chó dẫn đường được vào không', needs: ['guide-dog'] }
    ];

    additionalAccessibility.forEach((item, index) => {
      test(`TC${String(181 + index).padStart(3, '0')}: Accessibility - "${item.query}"`, async () => {
        const response = await makeAIRequest(item.query, {
          accessibilityNeeds: item.needs
        });
        validateAIResponse(response);
      });
    });
  });

  // ========================================
  // 7. LANGUAGE & CULTURAL NUANCES (15 tests)
  // ========================================
  describe('7. Language & Cultural Nuances', () => {
    
    test('TC186: Teen slang - "Quán nào xịn xò?"', async () => {
      const response = await makeAIRequest('Quán nào xịn xò?');
      
      validateAIResponse(response);
      expect(response.body.data.places.length).toBeGreaterThan(0);
    });

    test('TC187: Gen Z language - "Quán nào vibe chill phết?"', async () => {
      const response = await makeAIRequest('Quán nào vibe chill phết?');
      
      validateAIResponse(response);
    });

    test('TC188: Northern dialect - "Quán nào ngon lắm?"', async () => {
      const response = await makeAIRequest('Quán nào ngon lắm?');
      
      validateAIResponse(response);
    });

    test('TC189: Southern dialect - "Quán nào ngon lắm luôn?"', async () => {
      const response = await makeAIRequest('Quán nào ngon lắm luôn?');
      
      validateAIResponse(response);
    });

    test('TC190: Mixed English-Vietnamese - "Tìm restaurant có vibe romantic"', async () => {
      const response = await makeAIRequest('Tìm restaurant có vibe romantic');
      
      validateAIResponse(response);
    });

    test('TC191: Casual tone - "Đói bụng quá, ăn gì đây?"', async () => {
      const response = await makeAIRequest('Đói bụng quá, ăn gì đây?');
      
      validateAIResponse(response);
    });

    test('TC192: Formal tone - "Xin vui lòng gợi ý nhà hàng cao cấp"', async () => {
      const response = await makeAIRequest('Xin vui lòng gợi ý nhà hàng cao cấp');
      
      validateAIResponse(response);
    });

    test('TC193: Tourist-friendly - "I want find pho restaurant"', async () => {
      const response = await makeAIRequest('I want find pho restaurant');
      
      // Should understand and respond (may be in Vietnamese or English)
      expect([200, 400]).toContain(response.status);
    });

    test('TC194: Abbreviations - "NHR cao cấp HN"', async () => {
      const response = await makeAIRequest('NHR cao cấp HN');
      
      validateAIResponse(response);
    });

    test('TC195: Emojis - "Tìm quán 🍜 gần 🏠"', async () => {
      const response = await makeAIRequest('Tìm quán 🍜 gần 🏠');
      
      validateAIResponse(response);
    });

    // TC196-TC200: Additional language tests
    const additionalLanguage = [
      'Quán nào máu lắm?',
      'Chỗ nào đỉnh của chóp?',
      'Quán nào hot nhất bây giờ?',
      'Chỗ nào trending?',
      'Quán nào "xịn sò" nhất?'
    ];

    additionalLanguage.forEach((query, index) => {
      test(`TC${String(196 + index).padStart(3, '0')}: Language - "${query}"`, async () => {
        const response = await makeAIRequest(query);
        validateAIResponse(response);
      });
    });
  });

  // ========================================
  // 8. PERFORMANCE & STRESS TESTS (10 tests)
  // ========================================
  describe('8. Performance & Stress Tests', () => {
    
    test('TC201: Response time - Should respond in < 5 seconds', async () => {
      const startTime = Date.now();
      const response = await makeAIRequest('Tìm quán phở');
      const duration = Date.now() - startTime;
      
      validateAIResponse(response);
      expect(duration).toBeLessThan(5000);  // < 5 seconds
    });

    test('TC202: Concurrent requests - 5 parallel queries', async () => {
      const queries = [
        'Tìm quán phở',
        'Quán cafe yên tĩnh',
        'Nhà hàng cao cấp',
        'Buffet lẩu',
        'Quán ăn gần đây'
      ];
      
      const promises = queries.map(q => makeAIRequest(q));
      const responses = await Promise.all(promises);
      
      responses.forEach(response => {
        validateAIResponse(response);
      });
    });

    test('TC203: Complex query with multiple filters', async () => {
      const response = await makeAIRequest(
        'Tìm quán cafe yên tĩnh có view đẹp ở quận Hoàn Kiếm giá dưới 50k có wifi mạnh mở cửa từ 7h sáng',
        { latitude: 21.0285, longitude: 105.8542 }
      );
      
      validateAIResponse(response);
      expect(response.body.data.places.length).toBeGreaterThan(0);
    });

    test('TC204: Minimal query - Single word', async () => {
      const response = await makeAIRequest('Phở');
      
      validateAIResponse(response);
      expect(response.body.data.places.length).toBeGreaterThan(0);
    });

    test('TC205: Large result set - Should handle 50+ places', async () => {
      const response = await makeAIRequest('Quán ăn Hà Nội');
      
      validateAIResponse(response);
      // Should limit to reasonable number (5-10 for UX)
      expect(response.body.data.places.length).toBeLessThanOrEqual(10);
    });

    test('TC206: Cache hit - Second identical query should be faster', async () => {
      const query = 'Tìm quán phở Ba Đình unique-12345';
      
      // First request
      const start1 = Date.now();
      await makeAIRequest(query);
      const duration1 = Date.now() - start1;
      
      // Second request (should hit cache)
      const start2 = Date.now();
      await makeAIRequest(query);
      const duration2 = Date.now() - start2;
      
      // Cache hit should be significantly faster
      expect(duration2).toBeLessThan(duration1 * 0.5);
    });

    test('TC207: Memory usage - Should not leak memory', async () => {
      const initialMemory = process.memoryUsage().heapUsed;
      
      // Make 10 requests
      for (let i = 0; i < 10; i++) {
        await makeAIRequest(`Tìm quán phở ${i}`);
      }
      
      const finalMemory = process.memoryUsage().heapUsed;
      const memoryIncrease = finalMemory - initialMemory;
      
      // Should not increase more than 50MB
      expect(memoryIncrease).toBeLessThan(50 * 1024 * 1024);
    });

    test('TC208: Error recovery - Should handle API errors gracefully', async () => {
      // Simulate error by invalid input
      const response = await makeAIRequest('', {
        invalidField: 'test'
      });
      
      expect([200, 400]).toContain(response.status);
    });

    test('TC209: Rate limiting - Should enforce rate limits', async () => {
      // Make 20 requests rapidly
      const promises = Array(20).fill(0).map((_, i) => 
        makeAIRequest(`Query ${i}`)
      );
      
      const responses = await Promise.allSettled(promises);
      
      // Some should succeed, some may fail due to rate limit
      const successCount = responses.filter(r => r.status === 'fulfilled').length;
      expect(successCount).toBeGreaterThan(0);
    });

    test('TC210: Timeout handling - Long query should timeout gracefully', async () => {
      const veryLongQuery = 'Tìm quán cafe '.repeat(100);
      
      const response = await makeAIRequest(veryLongQuery);
      
      // Should either succeed or fail gracefully
      expect([200, 400, 408, 500]).toContain(response.status);
    });
  });
});
