/**
 * Unit Tests - Food Keyword Extractor
 * Purpose: Test Vietnamese food keyword extraction
 */

import { describe, test, expect } from '@jest/globals';
import foodKeywordExtractor from '../../../services/ai/retrieval/extractors/foodKeywordExtractor.js';

describe('Food Keyword Extractor - Unit Tests', () => {
  
  describe('Exact Match Extraction', () => {
    
    test('Should extract "phở" from query', () => {
      const result = foodKeywordExtractor.extract('Tìm quán phở gần đây');
      
      expect(result.keywords).toContain('PHỞ');
      expect(result.matched.length).toBeGreaterThan(0);
    });

    test('Should extract "bún chả"', () => {
      const result = foodKeywordExtractor.extract('Quán bún chả ngon');
      
      expect(result.keywords).toContain('BÚN CHẢ');
    });

    test('Should extract "cà phê"', () => {
      const result = foodKeywordExtractor.extract('Quán cà phê yên tĩnh');
      
      expect(result.keywords).toContain('CÀ PHÊ');
    });

    test('Should extract multiple dishes', () => {
      const result = foodKeywordExtractor.extract('Quán phở và bún chả');
      
      expect(result.keywords.length).toBeGreaterThan(1);
      expect(result.keywords).toContain('PHỞ');
      expect(result.keywords).toContain('BÚN CHẢ');
    });
  });

  describe('Fuzzy Match (Misspellings)', () => {
    
    test('Should match "pho" to "PHỞ"', () => {
      const result = foodKeywordExtractor.extract('pho bo');
      
      expect(result.keywords).toContain('PHỞ');
      expect(result.fuzzyMatches.length).toBeGreaterThan(0);
    });

    test('Should match "bun ca" to "BÚN CÁ"', () => {
      const result = foodKeywordExtractor.extract('bun ca');
      
      expect(result.keywords.length).toBeGreaterThan(0);
    });

    test('Should match "cafe" to "CÀ PHÊ"', () => {
      const result = foodKeywordExtractor.extract('cafe sua da');
      
      expect(result.keywords.length).toBeGreaterThan(0);
    });
  });

  describe('Compound Dish Detection', () => {
    
    test('Should keep "bún chả" as one entity', () => {
      const result = foodKeywordExtractor.extract('bún chả');
      
      // Should have "BÚN CHẢ" as compound, not separate "bún" and "chả"
      expect(result.keywords).toContain('BÚN CHẢ');
    });

    test('Should keep "phở cuốn" as one entity', () => {
      const result = foodKeywordExtractor.extract('phở cuốn');
      
      expect(result.keywords).toContain('PHỞ CUỐN');
    });

    test('Should keep "bánh mì" as one entity', () => {
      const result = foodKeywordExtractor.extract('bánh mì');
      
      expect(result.keywords).toContain('BÁNH MÌ');
    });
  });

  describe('Category Detection', () => {
    
    test('Should detect Vietnamese food category', () => {
      const result = foodKeywordExtractor.extract('Tìm quán phở');
      
      expect(result.category).toBe('VIETNAMESE');
    });

    test('Should detect Korean food category', () => {
      const result = foodKeywordExtractor.extract('Kimchi Hàn Quốc');
      
      expect(result.category).toBe('KOREAN');
    });

    test('Should detect Japanese food category', () => {
      const result = foodKeywordExtractor.extract('Sushi ramen');
      
      expect(result.category).toBe('JAPANESE');
    });

    test('Should detect Western food category', () => {
      const result = foodKeywordExtractor.extract('Pizza burger');
      
      expect(result.category).toBe('WESTERN');
    });
  });

  describe('Edge Cases', () => {
    
    test('Should handle empty string', () => {
      const result = foodKeywordExtractor.extract('');
      
      expect(result.keywords).toEqual([]);
    });

    test('Should handle non-food query', () => {
      const result = foodKeywordExtractor.extract('Hôm nay trời đẹp');
      
      expect(result.keywords.length).toBe(0);
    });

    test('Should handle special characters', () => {
      const result = foodKeywordExtractor.extract('Phở @#$% bò');
      
      expect(result.keywords).toContain('PHỞ');
    });

    test('Should handle all uppercase', () => {
      const result = foodKeywordExtractor.extract('TÌM QUÁN PHỞ');
      
      expect(result.keywords).toContain('PHỞ');
    });
  });
});
