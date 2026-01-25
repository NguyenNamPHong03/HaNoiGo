/**
 * AI Agent - User Scenario Tests
 * Purpose: Test real-world user queries for response quality
 * Coverage: 80+ test cases across different query types
 * 
 * Test Categories:
 * 1. Specific Dish Queries (20 tests)
 * 2. Mood-Based Queries (15 tests)
 * 3. Location Queries (10 tests)
 * 4. Budget Queries (10 tests)
 * 5. Itinerary Queries (15 tests)
 * 6. Dietary Restriction Queries (10 tests)
 * 7. Edge Cases (20 tests)
 */

import { describe, test, expect, beforeAll, afterAll } from '@jest/globals';
import request from 'supertest';
import app from '../../../server.js'; // Assuming server exports app
import { samplePlaces, sampleUserPreferences } from '../fixtures/places.fixture.js';

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

describe('AI Agent - User Scenario Tests', () => {
  
  // ========================================
  // 1. SPECIFIC DISH QUERIES (20 tests)
  // ========================================
  describe('1. Specific Dish Queries', () => {
    
    test('TC001: "Tìm quán phở gần đây"', async () => {
      const response = await makeAIRequest('Tìm quán phở gần đây', {
        latitude: 21.0285,
        longitude: 105.8542
      });
      
      // Debug: Log response if failed
      if (response.status !== 200) {
        console.log('❌ TC001 Failed Response:', {
          status: response.status,
          body: response.body
        });
      }
      
      validateAIResponse(response);
      expect(response.body.data.intent).toBe('FIND_PLACE');
      expect(response.body.data.places.length).toBeGreaterThan(0);
      
      // Should contain "phở" in results
      const hasPhoDish = response.body.data.places.some(p => 
        p.name.toLowerCase().includes('phở') || 
        p.description?.toLowerCase().includes('phở')
      );
      expect(hasPhoDish).toBe(true);
    });

    test('TC002: "Quán bún chả ngon ở Ba Đình"', async () => {
      const response = await makeAIRequest('Quán bún chả ngon ở Ba Đình');
      
      validateAIResponse(response);
      expect(response.body.data.intent).toBe('FIND_PLACE');
      
      // Should filter by district
      const places = response.body.data.places;
      if (places.length > 0) {
        const hasBaDinh = places.some(p => p.district === 'Ba Đình');
        expect(hasBaDinh).toBe(true);
      }
    });

    test('TC003: "Tìm chỗ ăn lẩu Thái dưới 200k"', async () => {
      const response = await makeAIRequest('Tìm chỗ ăn lẩu Thái dưới 200k');
      
      validateAIResponse(response);
      
      // Should filter by price
      const places = response.body.data.places;
      places.forEach(p => {
        if (p.priceRange) {
          expect(p.priceRange.max).toBeLessThanOrEqual(200000);
        }
      });
    });

    test('TC004: "Bánh mì Hà Nội ngon"', async () => {
      const response = await makeAIRequest('Bánh mì Hà Nội ngon');
      
      validateAIResponse(response);
      expect(response.body.data.places.length).toBeGreaterThan(0);
    });

    test('TC005: "Cơm tấm Sài Gòn gần đây"', async () => {
      const response = await makeAIRequest('Cơm tấm Sài Gòn gần đây', {
        latitude: 21.0285,
        longitude: 105.8542
      });
      
      validateAIResponse(response);
      expect(response.body.data.intent).toBe('FIND_PLACE');
    });

    test('TC006: "Tìm quán cà phê pha phin"', async () => {
      const response = await makeAIRequest('Tìm quán cà phê pha phin');
      
      validateAIResponse(response);
      const places = response.body.data.places;
      expect(places.some(p => p.category === 'Quán cafe')).toBe(true);
    });

    test('TC007: "Quán ăn Hàn Quốc có kimchi"', async () => {
      const response = await makeAIRequest('Quán ăn Hàn Quốc có kimchi');
      
      validateAIResponse(response);
      expect(response.body.data.places.length).toBeGreaterThan(0);
    });

    test('TC008: "Sushi Nhật Bản tươi ngon"', async () => {
      const response = await makeAIRequest('Sushi Nhật Bản tươi ngon');
      
      validateAIResponse(response);
      expect(response.body.data.intent).toBe('FIND_PLACE');
    });

    test('TC009: "Pizza Ý authentic"', async () => {
      const response = await makeAIRequest('Pizza Ý authentic');
      
      validateAIResponse(response);
    });

    test('TC010: "Buffet lẩu không giới hạn"', async () => {
      const response = await makeAIRequest('Buffet lẩu không giới hạn');
      
      validateAIResponse(response);
      const answer = response.body.data.answer.toLowerCase();
      expect(answer.includes('buffet') || answer.includes('lẩu')).toBe(true);
    });

    // TC011-TC020: Additional specific dish queries
    const additionalDishes = [
      'Chả cá Lã Vọng',
      'Bún riêu cua',
      'Nem rán Hà Nội',
      'Bánh cuốn Thanh Trì',
      'Bún đậu mắm tôm',
      'Chè Hà Nội',
      'Xôi xéo',
      'Bánh đa cua',
      'Miến lươn',
      'Bún ốc'
    ];

    additionalDishes.forEach((dish, index) => {
      test(`TC${String(11 + index).padStart(3, '0')}: "${dish}"`, async () => {
        const response = await makeAIRequest(dish);
        validateAIResponse(response);
        expect(response.body.data.places.length).toBeGreaterThan(0);
      });
    });
  });

  // ========================================
  // 2. MOOD-BASED QUERIES (15 tests)
  // ========================================
  describe('2. Mood-Based Queries', () => {
    
    test('TC021: "Tìm quán cafe yên tĩnh để học bài"', async () => {
      const response = await makeAIRequest('Tìm quán cafe yên tĩnh để học bài');
      
      validateAIResponse(response);
      const places = response.body.data.places;
      
      // Should have tags related to quiet/study
      const hasRelevantTags = places.some(p => 
        p.aiTags?.suitability?.includes('học bài') ||
        p.aiTags?.space?.includes('yên tĩnh')
      );
      expect(hasRelevantTags).toBe(true);
    });

    test('TC022: "Chỗ lãng mạn để hẹn hò"', async () => {
      const response = await makeAIRequest('Chỗ lãng mạn để hẹn hò');
      
      validateAIResponse(response);
      const places = response.body.data.places;
      
      const hasRomanticTags = places.some(p => 
        p.aiTags?.mood?.includes('lãng mạn') ||
        p.aiTags?.suitability?.includes('hẹn hò')
      );
      expect(hasRomanticTags).toBe(true);
    });

    test('TC023: "Quán ăn sôi động cho nhóm đông"', async () => {
      const response = await makeAIRequest('Quán ăn sôi động cho nhóm đông');
      
      validateAIResponse(response);
      const places = response.body.data.places;
      
      const hasGroupTags = places.some(p => 
        p.aiTags?.suitability?.includes('tụ tập nhóm') ||
        p.aiTags?.mood?.includes('sôi động')
      );
      expect(hasGroupTags).toBe(true);
    });

    test('TC024: "Cafe có view đẹp"', async () => {
      const response = await makeAIRequest('Cafe có view đẹp');
      
      validateAIResponse(response);
      const places = response.body.data.places;
      
      const hasViewTags = places.some(p => 
        p.aiTags?.space?.includes('view đẹp') ||
        p.aiTags?.specialFeatures?.includes('view đẹp')
      );
      expect(hasViewTags).toBe(true);
    });

    test('TC025: "Nơi chill cuối tuần"', async () => {
      const response = await makeAIRequest('Nơi chill cuối tuần');
      
      validateAIResponse(response);
      expect(response.body.data.places.length).toBeGreaterThan(0);
    });

    test('TC026: "Quán cafe vintage retro"', async () => {
      const response = await makeAIRequest('Quán cafe vintage retro');
      
      validateAIResponse(response);
      const places = response.body.data.places;
      
      const hasVintageTags = places.some(p => 
        p.aiTags?.mood?.includes('vintage') ||
        p.aiTags?.mood?.includes('retro') ||
        p.aiTags?.space?.includes('vintage')
      );
      expect(hasVintageTags).toBe(true);
    });

    test('TC027: "Nơi làm việc có wifi mạnh"', async () => {
      const response = await makeAIRequest('Nơi làm việc có wifi mạnh');
      
      validateAIResponse(response);
      const answer = response.body.data.answer.toLowerCase();
      expect(answer.includes('wifi') || answer.includes('làm việc')).toBe(true);
    });

    test('TC028: "Quán ăn truyền thống Hà Nội"', async () => {
      const response = await makeAIRequest('Quán ăn truyền thống Hà Nội');
      
      validateAIResponse(response);
      const places = response.body.data.places;
      
      const hasTraditionalTags = places.some(p => 
        p.aiTags?.mood?.includes('truyền thống') ||
        p.description?.toLowerCase().includes('truyền thống')
      );
      expect(hasTraditionalTags).toBe(true);
    });

    test('TC029: "Nhà hàng sang trọng cao cấp"', async () => {
      const response = await makeAIRequest('Nhà hàng sang trọng cao cấp');
      
      validateAIResponse(response);
      const places = response.body.data.places;
      
      // Should have higher price range
      const hasHighPrice = places.some(p => 
        p.priceRange && p.priceRange.min >= 200000
      );
      expect(hasHighPrice).toBe(true);
    });

    test('TC030: "Quán dân dã bình dân"', async () => {
      const response = await makeAIRequest('Quán dân dã bình dân');
      
      validateAIResponse(response);
      expect(response.body.data.places.length).toBeGreaterThan(0);
    });

    // TC031-TC035: Additional mood queries
    const additionalMoods = [
      'Không gian hiện đại minimalist',
      'Quán ngoài trời thoáng mát',
      'Chỗ ấm cúng mùa đông',
      'Quán có live music',
      'Nơi yên bình đọc sách'
    ];

    additionalMoods.forEach((mood, index) => {
      test(`TC${String(31 + index).padStart(3, '0')}: "${mood}"`, async () => {
        const response = await makeAIRequest(mood);
        validateAIResponse(response);
      });
    });
  });

  // ========================================
  // 3. LOCATION QUERIES (10 tests)
  // ========================================
  describe('3. Location Queries', () => {
    
    test('TC036: "Quán ăn gần đây" (with coordinates)', async () => {
      const response = await makeAIRequest('Quán ăn gần đây', {
        latitude: 21.0285,
        longitude: 105.8542,
        nearMe: true
      });
      
      validateAIResponse(response);
      expect(response.body.data.places.length).toBeGreaterThan(0);
      
      // Should have distance info
      const hasDistance = response.body.data.places.some(p => 
        typeof p.distanceKm === 'number'
      );
      expect(hasDistance).toBe(true);
    });

    test('TC037: "Quán cafe ở quận Hoàn Kiếm"', async () => {
      const response = await makeAIRequest('Quán cafe ở quận Hoàn Kiếm');
      
      validateAIResponse(response);
      const places = response.body.data.places;
      
      if (places.length > 0) {
        const allHoanKiem = places.every(p => p.district === 'Hoàn Kiếm');
        expect(allHoanKiem).toBe(true);
      }
    });

    test('TC038: "Nhà hàng trong bán kính 2km"', async () => {
      const response = await makeAIRequest('Nhà hàng trong bán kính 2km', {
        latitude: 21.0285,
        longitude: 105.8542
      });
      
      validateAIResponse(response);
      const places = response.body.data.places;
      
      // All places should be within 2km
      const withinRadius = places.every(p => 
        !p.distanceKm || p.distanceKm <= 2
      );
      expect(withinRadius).toBe(true);
    });

    test('TC039: "Quán ăn gần hồ Hoàn Kiếm"', async () => {
      const response = await makeAIRequest('Quán ăn gần hồ Hoàn Kiếm');
      
      validateAIResponse(response);
      expect(response.body.data.places.length).toBeGreaterThan(0);
    });

    test('TC040: "Nhà hàng ở phố cổ"', async () => {
      const response = await makeAIRequest('Nhà hàng ở phố cổ');
      
      validateAIResponse(response);
      expect(response.body.data.places.length).toBeGreaterThan(0);
    });

    // TC041-TC045: Additional location queries
    const additionalLocations = [
      'Quán cafe ở Tây Hồ',
      'Nhà hàng ở Ba Đình',
      'Quán ăn ở Đống Đa',
      'Cafe gần Văn Miếu',
      'Nhà hàng gần Lăng Bác'
    ];

    additionalLocations.forEach((location, index) => {
      test(`TC${String(41 + index).padStart(3, '0')}: "${location}"`, async () => {
        const response = await makeAIRequest(location);
        validateAIResponse(response);
      });
    });
  });

  // ========================================
  // 4. BUDGET QUERIES (10 tests)
  // ========================================
  describe('4. Budget Queries', () => {
    
    test('TC046: "Quán ăn dưới 100k"', async () => {
      const response = await makeAIRequest('Quán ăn dưới 100k');
      
      validateAIResponse(response);
      const places = response.body.data.places;
      
      places.forEach(p => {
        if (p.priceRange) {
          expect(p.priceRange.max).toBeLessThanOrEqual(100000);
        }
      });
    });

    test('TC047: "Nhà hàng cao cấp ở Tây Hồ"', async () => {
      const response = await makeAIRequest('Nhà hàng cao cấp ở Tây Hồ');
      
      validateAIResponse(response);
      const places = response.body.data.places;
      
      const hasHighPrice = places.some(p => 
        p.priceRange && p.priceRange.min >= 150000
      );
      expect(hasHighPrice).toBe(true);
    });

    test('TC048: "Buffet giá rẻ"', async () => {
      const response = await makeAIRequest('Buffet giá rẻ');
      
      validateAIResponse(response);
      expect(response.body.data.places.length).toBeGreaterThan(0);
    });

    test('TC049: "Quán cafe giá sinh viên"', async () => {
      const response = await makeAIRequest('Quán cafe giá sinh viên');
      
      validateAIResponse(response);
      const places = response.body.data.places;
      
      const hasBudgetPlaces = places.some(p => 
        p.priceRange && p.priceRange.max <= 60000
      );
      expect(hasBudgetPlaces).toBe(true);
    });

    test('TC050: "Ăn no dưới 50k"', async () => {
      const response = await makeAIRequest('Ăn no dưới 50k');
      
      validateAIResponse(response);
      const places = response.body.data.places;
      
      places.forEach(p => {
        if (p.priceRange) {
          expect(p.priceRange.max).toBeLessThanOrEqual(50000);
        }
      });
    });

    // TC051-TC055: Additional budget queries
    const additionalBudget = [
      'Nhà hàng tầm 200-300k',
      'Quán ăn bình dân',
      'Buffet dưới 200k',
      'Cafe rẻ nhất Hà Nội',
      'Nhà hàng cao cấp nhất'
    ];

    additionalBudget.forEach((budget, index) => {
      test(`TC${String(51 + index).padStart(3, '0')}: "${budget}"`, async () => {
        const response = await makeAIRequest(budget);
        validateAIResponse(response);
      });
    });
  });

  // ========================================
  // 5. ITINERARY QUERIES (15 tests)
  // ========================================
  describe('5. Itinerary Queries', () => {
    
    test('TC056: "Lập lịch trình 1 ngày ở Hà Nội"', async () => {
      const response = await makeAIRequest('Lập lịch trình 1 ngày ở Hà Nội');
      
      validateAIResponse(response);
      expect(response.body.data.intent).toBe('ITINERARY');
      expect(response.body.data.structuredData).toHaveProperty('schedule');
      expect(Array.isArray(response.body.data.structuredData.schedule)).toBe(true);
      
      const schedule = response.body.data.structuredData.schedule;
      expect(schedule.length).toBeGreaterThan(0);
      
      // Each item should have required fields
      schedule.forEach(item => {
        expect(item).toHaveProperty('time');
        expect(item).toHaveProperty('activity');
      });
    });

    test('TC057: "Gợi ý đi chơi 3 ngày cho cặp đôi"', async () => {
      const response = await makeAIRequest('Gợi ý đi chơi 3 ngày cho cặp đôi');
      
      validateAIResponse(response);
      expect(response.body.data.intent).toBe('ITINERARY');
    });

    test('TC058: "Lịch ăn uống cho nhóm 5 người"', async () => {
      const response = await makeAIRequest('Lịch ăn uống cho nhóm 5 người');
      
      validateAIResponse(response);
      expect(response.body.data.intent).toBe('ITINERARY');
    });

    test('TC059: "Du lịch Hà Nội 2 ngày 1 đêm"', async () => {
      const response = await makeAIRequest('Du lịch Hà Nội 2 ngày 1 đêm');
      
      validateAIResponse(response);
      expect(response.body.data.intent).toBe('ITINERARY');
    });

    test('TC060: "Lịch trình cà phê 1 ngày"', async () => {
      const response = await makeAIRequest('Lịch trình cà phê 1 ngày');
      
      validateAIResponse(response);
      expect(response.body.data.intent).toBe('ITINERARY');
    });

    // TC061-TC070: Additional itinerary queries
    const additionalItineraries = [
      'Lập kế hoạch ăn uống cuối tuần',
      'Gợi ý 1 ngày khám phá ẩm thực Hà Nội',
      'Lịch trình hẹn hò 1 ngày',
      'Du lịch ẩm thực 3 ngày',
      'Lịch coffee hopping 1 ngày',
      'Lịch trình cho gia đình 2 ngày',
      'Khám phá phố cổ 1 ngày',
      'Lịch trình cho nhóm bạn 1 ngày',
      'Du lịch Hà Nội tiết kiệm 2 ngày',
      'Lịch ăn uống cao cấp 1 ngày'
    ];

    additionalItineraries.forEach((itinerary, index) => {
      test(`TC${String(61 + index).padStart(3, '0')}: "${itinerary}"`, async () => {
        const response = await makeAIRequest(itinerary);
        validateAIResponse(response);
      });
    });
  });

  // ========================================
  // 6. DIETARY RESTRICTION QUERIES (10 tests)
  // ========================================
  describe('6. Dietary Restriction Queries', () => {
    
    test('TC071: "Quán chay gần đây"', async () => {
      const response = await makeAIRequest('Quán chay gần đây', {
        latitude: 21.0285,
        longitude: 105.8542
      });
      
      validateAIResponse(response);
      const places = response.body.data.places;
      
      const hasVegetarianTag = places.some(p => 
        p.menu?.dietary?.includes('vegetarian') ||
        p.menu?.dietary?.includes('vegan') ||
        p.description?.toLowerCase().includes('chay')
      );
      expect(hasVegetarianTag).toBe(true);
    });

    test('TC072: "Món ăn không cay"', async () => {
      const response = await makeAIRequest('Món ăn không cay');
      
      validateAIResponse(response);
      expect(response.body.data.places.length).toBeGreaterThan(0);
    });

    test('TC073: "Đồ ăn eat-clean"', async () => {
      const response = await makeAIRequest('Đồ ăn eat-clean');
      
      validateAIResponse(response);
      const answer = response.body.data.answer.toLowerCase();
      expect(answer.includes('eat-clean') || answer.includes('healthy')).toBe(true);
    });

    test('TC074: "Quán ăn chay healthy"', async () => {
      const response = await makeAIRequest('Quán ăn chay healthy');
      
      validateAIResponse(response);
    });

    test('TC075: "Đồ ăn không gluten"', async () => {
      const response = await makeAIRequest('Đồ ăn không gluten');
      
      validateAIResponse(response);
      const places = response.body.data.places;
      
      const hasGlutenFree = places.some(p => 
        p.menu?.dietary?.includes('gluten-free')
      );
      expect(hasGlutenFree).toBe(true);
    });

    // TC076-TC080: Additional dietary queries
    const additionalDietary = [
      'Quán ăn organic',
      'Món ăn low carb',
      'Quán chay vegan',
      'Đồ ăn không đường',
      'Quán ăn halal'
    ];

    additionalDietary.forEach((dietary, index) => {
      test(`TC${String(76 + index).padStart(3, '0')}: "${dietary}"`, async () => {
        const response = await makeAIRequest(dietary);
        validateAIResponse(response);
      });
    });
  });

  // ========================================
  // 7. EDGE CASES (20 tests)
  // ========================================
  describe('7. Edge Cases', () => {
    
    test('TC081: Misspelled word - "pho bo"', async () => {
      const response = await makeAIRequest('pho bo');
      
      validateAIResponse(response);
      // Should still find phở bò
      const hasPhoBo = response.body.data.places.some(p => 
        p.name.toLowerCase().includes('phở') ||
        p.description?.toLowerCase().includes('phở')
      );
      expect(hasPhoBo).toBe(true);
    });

    test('TC082: Misspelled word - "bun ca"', async () => {
      const response = await makeAIRequest('bun ca');
      
      validateAIResponse(response);
    });

    test('TC083: Mixed language - "Tìm coffee shop yên tĩnh"', async () => {
      const response = await makeAIRequest('Tìm coffee shop yên tĩnh');
      
      validateAIResponse(response);
      expect(response.body.data.places.some(p => p.category === 'Quán cafe')).toBe(true);
    });

    test('TC084: Ambiguous query - "Quán gần đây" (no location)', async () => {
      const response = await makeAIRequest('Quán gần đây');
      
      validateAIResponse(response);
      // Should still return places or ask for location
      expect(response.body.data.answer).toBeDefined();
    });

    test('TC085: Very specific - "Phở bò Hà Nội chuẩn vị"', async () => {
      const response = await makeAIRequest('Phở bò Hà Nội chuẩn vị với nước dùng ninh xương 24h');
      
      validateAIResponse(response);
      expect(response.body.data.places.length).toBeGreaterThan(0);
    });

    test('TC086: Compound query - Multiple filters', async () => {
      const response = await makeAIRequest('Quán cafe yên tĩnh gần hồ Hoàn Kiếm dưới 50k');
      
      validateAIResponse(response);
      const places = response.body.data.places;
      
      // Should filter by multiple criteria
      const matchesAllCriteria = places.some(p => 
        p.category === 'Quán cafe' &&
        p.aiTags?.space?.includes('yên tĩnh') &&
        p.priceRange?.max <= 50000
      );
      expect(matchesAllCriteria).toBe(true);
    });

    test('TC087: Empty string', async () => {
      const response = await makeAIRequest('');
      
      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });

    test('TC088: Very long query', async () => {
      const longQuery = 'Tôi muốn tìm một quán cafe có không gian yên tĩnh vintage retro với view đẹp gần hồ Hoàn Kiếm giá dưới 50k có wifi mạnh ổ cắm điện phù hợp học bài làm việc mở cửa từ 7h sáng đến 11h tối và có đồ ăn nhẹ'.repeat(3);
      
      const response = await makeAIRequest(longQuery);
      
      // Should handle gracefully (either process or return error)
      expect([200, 400]).toContain(response.status);
    });

    test('TC089: Special characters', async () => {
      const response = await makeAIRequest('Phở @#$% bò');
      
      validateAIResponse(response);
    });

    test('TC090: Numbers only', async () => {
      const response = await makeAIRequest('100000');
      
      expect([200, 400]).toContain(response.status);
    });

    test('TC091: Greeting in Vietnamese', async () => {
      const response = await makeAIRequest('Xin chào');
      
      validateAIResponse(response);
      expect(response.body.data.intent).toBe('GREETING');
    });

    test('TC092: Greeting in English', async () => {
      const response = await makeAIRequest('Hello');
      
      validateAIResponse(response);
      expect(response.body.data.intent).toBe('GREETING');
    });

    test('TC093: Chit-chat query', async () => {
      const response = await makeAIRequest('Hôm nay trời đẹp nhỉ');
      
      validateAIResponse(response);
      expect(response.body.data.intent).toBe('CHIT_CHAT');
    });

    test('TC094: Question about AI', async () => {
      const response = await makeAIRequest('Bạn là ai?');
      
      validateAIResponse(response);
      expect(response.body.data.intent).toBe('CHIT_CHAT');
    });

    test('TC095: SQL injection attempt', async () => {
      const response = await makeAIRequest("'; DROP TABLE places; --");
      
      // Should be handled securely
      expect([200, 400]).toContain(response.status);
      if (response.status === 200) {
        validateAIResponse(response);
      }
    });

    test('TC096: NoSQL injection attempt', async () => {
      const response = await makeAIRequest('{"$ne": null}');
      
      expect([200, 400]).toContain(response.status);
    });

    test('TC097: XSS attempt', async () => {
      const response = await makeAIRequest('<script>alert("xss")</script>');
      
      expect([200, 400]).toContain(response.status);
    });

    test('TC098: Unicode characters', async () => {
      const response = await makeAIRequest('Quán phở 🍜 ngon 😋');
      
      validateAIResponse(response);
    });

    test('TC099: Multiple spaces', async () => {
      const response = await makeAIRequest('Quán     phở     gần     đây');
      
      validateAIResponse(response);
    });

    test('TC100: Case insensitive', async () => {
      const response = await makeAIRequest('QUÁN PHỞ GẦN ĐÂY');
      
      validateAIResponse(response);
      expect(response.body.data.places.length).toBeGreaterThan(0);
    });
  });
});
