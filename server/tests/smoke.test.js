/**
 * Smoke Test - Verify Test Setup
 * Purpose: Quick validation that Jest is working correctly
 */

import { describe, test, expect } from '@jest/globals';

describe('Test Setup Validation', () => {
  
  test('Jest is configured correctly', () => {
    expect(true).toBe(true);
  });

  test('Environment variables are loaded', () => {
    expect(process.env.NODE_ENV).toBe('development'); // Updated to match setup.js
  });

  test('Math operations work', () => {
    expect(2 + 2).toBe(4);
  });

  test('Array operations work', () => {
    const arr = [1, 2, 3];
    expect(arr).toHaveLength(3);
    expect(arr).toContain(2);
  });

  test('Object assertions work', () => {
    const obj = { name: 'Test', value: 42 };
    expect(obj).toHaveProperty('name');
    expect(obj.name).toBe('Test');
  });
});
