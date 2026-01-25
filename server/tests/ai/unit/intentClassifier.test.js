/**
 * Unit Tests - Intent Classifier
 * Purpose: Test intent classification accuracy
 */

import { describe, test, expect } from '@jest/globals';
import intentClassifier from '../../../services/ai/retrieval/extractors/intentClassifier.js';

describe('Intent Classifier - Unit Tests', () => {
  
  describe('Primary Intent Classification', () => {
    
    test('Should classify "Tìm quán phở" as FIND_PLACE', async () => {
      const result = await intentClassifier.classify('Tìm quán phở gần đây');
      
      expect(result.primary).toBe('FIND_PLACE');
      expect(result.confidence).toBeGreaterThan(0.7);
    });

    test('Should classify "Xin chào" as GREETING', async () => {
      const result = await intentClassifier.classify('Xin chào');
      
      expect(result.primary).toBe('GREETING');
    });

    test('Should classify itinerary queries as ITINERARY', async () => {
      const result = await intentClassifier.classify('Lập lịch trình 1 ngày ở Hà Nội');
      
      expect(result.primary).toBe('ITINERARY');
    });

    test('Should classify chit-chat as CHIT_CHAT', async () => {
      const result = await intentClassifier.classify('Hôm nay trời đẹp nhỉ');
      
      expect(result.primary).toBe('CHIT_CHAT');
    });
  });

  describe('Secondary Intent Classification', () => {
    
    test('Should detect specific_dish intent', async () => {
      const result = await intentClassifier.classify('Tìm quán phở');
      
      expect(result.secondary).toContain('SPECIFIC_DISH');
    });

    test('Should detect mood_based intent', async () => {
      const result = await intentClassifier.classify('Quán cafe yên tĩnh');
      
      expect(result.secondary).toContain('MOOD_BASED');
    });

    test('Should detect budget_conscious intent', async () => {
      const result = await intentClassifier.classify('Quán ăn dưới 100k');
      
      expect(result.secondary).toContain('BUDGET_CONSCIOUS');
    });

    test('Should detect near_me intent', async () => {
      const result = await intentClassifier.classify('Quán ăn gần đây');
      
      expect(result.secondary).toContain('NEAR_ME');
    });
  });

  describe('Food Type Classification', () => {
    
    test('Should classify as Vietnamese food', async () => {
      const result = await intentClassifier.classify('Tìm quán phở');
      
      expect(result.foodType).toBe('VIETNAMESE');
    });

    test('Should classify as Korean food', async () => {
      const result = await intentClassifier.classify('Nhà hàng Hàn Quốc');
      
      expect(result.foodType).toBe('KOREAN');
    });

    test('Should classify as Japanese food', async () => {
      const result = await intentClassifier.classify('Sushi Nhật Bản');
      
      expect(result.foodType).toBe('JAPANESE');
    });

    test('Should classify as Western food', async () => {
      const result = await intentClassifier.classify('Pizza Ý');
      
      expect(result.foodType).toBe('WESTERN');
    });

    test('Should classify as Cafe', async () => {
      const result = await intentClassifier.classify('Quán cafe');
      
      expect(result.foodType).toBe('CAFE');
    });
  });

  describe('Edge Cases', () => {
    
    test('Should handle empty string', async () => {
      const result = await intentClassifier.classify('');
      
      expect(result).toHaveProperty('primary');
      expect(result).toHaveProperty('confidence');
    });

    test('Should handle very long query', async () => {
      const longQuery = 'Tìm quán phở '.repeat(100);
      const result = await intentClassifier.classify(longQuery);
      
      expect(result.primary).toBeDefined();
    });

    test('Should handle mixed language', async () => {
      const result = await intentClassifier.classify('Tìm coffee shop yên tĩnh');
      
      expect(result.primary).toBe('FIND_PLACE');
    });

    test('Should handle misspellings', async () => {
      const result = await intentClassifier.classify('Tim quan pho'); // Misspelled
      
      expect(result.primary).toBe('FIND_PLACE');
    });
  });
});
