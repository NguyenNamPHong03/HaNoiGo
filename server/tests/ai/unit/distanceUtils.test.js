/**
 * Unit Tests - Distance Utilities
 * Purpose: Test geospatial calculations
 */

import { describe, test, expect } from '@jest/globals';
import { haversineKm, sortPlacesByDistance } from '../../../services/ai/utils/distanceUtils.js';

describe('Distance Utils - Unit Tests', () => {
  
  describe('Haversine Distance Calculation', () => {
    
    test('Should calculate distance between two points', () => {
      // Hồ Hoàn Kiếm to Văn Miếu (approx 2.5km)
      const lat1 = 21.0285;
      const lon1 = 105.8542;
      const lat2 = 21.0267;
      const lon2 = 105.8354;
      
      const distance = haversineKm(lat1, lon1, lat2, lon2);
      
      expect(distance).toBeGreaterThan(0);
      expect(distance).toBeLessThan(5); // Should be < 5km
      expect(typeof distance).toBe('number');
    });

    test('Should return 0 for same point', () => {
      const distance = haversineKm(21.0285, 105.8542, 21.0285, 105.8542);
      
      expect(distance).toBe(0);
    });

    test('Should handle negative coordinates', () => {
      const distance = haversineKm(-21.0285, -105.8542, -21.0267, -105.8354);
      
      expect(distance).toBeGreaterThan(0);
    });

    test('Should return reasonable distance for far points', () => {
      // Hanoi to Ho Chi Minh City (approx 1600km)
      const distance = haversineKm(21.0285, 105.8542, 10.8231, 106.6297);
      
      expect(distance).toBeGreaterThan(1000);
      expect(distance).toBeLessThan(2000);
    });
  });

  describe('Sort Places by Distance', () => {
    
    test('Should sort places by proximity', () => {
      const userLat = 21.0285;
      const userLng = 105.8542;
      
      const places = [
        {
          _id: '1',
          name: 'Far Place',
          location: { coordinates: [105.7192, 21.0654] } // Far from user
        },
        {
          _id: '2',
          name: 'Near Place',
          location: { coordinates: [105.8536, 21.0278] } // Near user
        },
        {
          _id: '3',
          name: 'Medium Place',
          location: { coordinates: [105.8354, 21.0267] } // Medium distance
        }
      ];
      
      const sorted = sortPlacesByDistance(places, userLat, userLng);
      
      // First place should be nearest
      expect(sorted[0].name).toBe('Near Place');
      expect(sorted[0].distanceKm).toBeDefined();
      expect(sorted[0].distanceKm).toBeLessThan(sorted[1].distanceKm);
      expect(sorted[1].distanceKm).toBeLessThan(sorted[2].distanceKm);
    });

    test('Should add distanceKm property to each place', () => {
      const places = [
        {
          _id: '1',
          name: 'Test Place',
          location: { coordinates: [105.8542, 21.0285] }
        }
      ];
      
      const sorted = sortPlacesByDistance(places, 21.0285, 105.8542);
      
      expect(sorted[0]).toHaveProperty('distanceKm');
      expect(typeof sorted[0].distanceKm).toBe('number');
    });

    test('Should handle places without location', () => {
      const places = [
        { _id: '1', name: 'No Location' },
        {
          _id: '2',
          name: 'With Location',
          location: { coordinates: [105.8542, 21.0285] }
        }
      ];
      
      const sorted = sortPlacesByDistance(places, 21.0285, 105.8542);
      
      // Should not throw error
      expect(sorted.length).toBe(2);
      // Place without location should have null distance and be sorted last
      expect(sorted[1].distanceKm).toBeNull();
    });

    test('Should handle empty array', () => {
      const sorted = sortPlacesByDistance([], 21.0285, 105.8542);
      
      expect(sorted).toEqual([]);
    });

    test('Should handle invalid user coordinates', () => {
      const places = [
        {
          _id: '1',
          name: 'Test Place',
          location: { coordinates: [105.8542, 21.0285] }
        }
      ];
      
      // Invalid coordinates - should return original array
      const sorted = sortPlacesByDistance(places, null, null);
      expect(sorted).toEqual(places);
    });
  });

  describe('Edge Cases', () => {
    
    test('Should return distance as a number', () => {
      const distance = haversineKm(21.0285, 105.8542, 21.0267, 105.8354);
      
      expect(typeof distance).toBe('number');
      expect(distance).toBeGreaterThan(0);
    });

    test('Should handle NaN coordinates gracefully', () => {
      const distance = haversineKm(NaN, NaN, 21.0285, 105.8542);
      expect(isNaN(distance)).toBe(true);
    });
  });
});
