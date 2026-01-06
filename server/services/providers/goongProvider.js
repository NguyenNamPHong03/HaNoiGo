import axios from 'axios';

/**
 * @fileoverview Goong API Provider
 * @description Service để gọi Goong Maps API (autocomplete & detail)
 * Tương đương Google Places API nhưng cho Việt Nam
 */

class GoongProvider {
  constructor() {
    this.baseURL = 'https://rsapi.goong.io';
    this.defaultLocation = '21.0278,105.8342'; // Hà Nội
    this.defaultRadius = 5000; // 5km

    // Axios instance cho Goong API
    this.client = axios.create({
      baseURL: this.baseURL,
      timeout: 10000,
      headers: {
        'Content-Type': 'application/json'
      }
    });
  }

  /**
   * Get API key from environment (lazy load)
   */
  getApiKey() {
    if (!process.env.GOONG_API_KEY) {
      console.error('❌ GOONG_API_KEY not found in environment variables');
      throw new Error('GOONG_API_KEY is required');
    }
    return process.env.GOONG_API_KEY;
  }

  /**
   * Get default location from environment
   */
  getDefaultLocation() {
    return process.env.GOONG_DEFAULT_LOCATION || this.defaultLocation;
  }

  /**
   * Get default radius from environment
   */
  getDefaultRadius() {
    return parseInt(process.env.GOONG_DEFAULT_RADIUS) || this.defaultRadius;
  }

  /**
   * @desc Autocomplete API - Gợi ý địa điểm dựa trên keyword
   * @route GET https://rsapi.goong.io/Place/AutoComplete
   * @param {Object} params - { input, location, radius }
   * @returns {Promise<Array>} predictions array
   */
  async autocomplete({ input, location, radius }) {
    try {
      if (!input || input.trim().length === 0) {
        throw new Error('Input keyword is required');
      }

      const apiKey = this.getApiKey();
      const defaultLocation = this.getDefaultLocation();
      const defaultRadius = this.getDefaultRadius();

      console.log('📡 Calling Goong Autocomplete:', {
        input: input.trim(),
        location: location || defaultLocation,
        radius: radius || defaultRadius,
        apiKeyUsed: apiKey ? apiKey.substring(0, 10) + '...' : 'EMPTY'
      });

      const response = await this.client.get('/Place/AutoComplete', {
        params: {
          api_key: apiKey,
          input: input.trim(),
          location: location || defaultLocation,
          radius: radius || defaultRadius
        }
      });

      if (!response.data || !response.data.predictions) {
        return [];
      }

      return response.data.predictions;
    } catch (error) {
      console.error('❌ Goong Autocomplete Error:', error.response?.data || error.message);
      
      if (error.response?.status === 401) {
        throw new Error('Invalid Goong API key');
      }
      
      if (error.response?.status === 429) {
        throw new Error('Goong API rate limit exceeded');
      }

      throw new Error(`Goong autocomplete failed: ${error.message}`);
    }
  }

  /**
   * @desc Place Detail API - Lấy chi tiết địa điểm theo place_id
   * @route GET https://rsapi.goong.io/Place/Detail
   * @param {String} placeId - Goong place_id from autocomplete
   * @returns {Promise<Object>} place detail object
   */
  async detail(placeId) {
    try {
      if (!placeId) {
        throw new Error('Place ID is required');
      }

      const apiKey = this.getApiKey();

      const response = await this.client.get('/Place/Detail', {
        params: {
          api_key: apiKey,
          place_id: placeId
        }
      });

      if (!response.data || !response.data.result) {
        throw new Error('No result from Goong Detail API');
      }

      const result = response.data.result;

      // ✅ Validate required fields
      if (!result.name) {
        throw new Error('Place name missing in Goong response');
      }

      if (!result.geometry || !result.geometry.location) {
        throw new Error('Geometry/location missing in Goong response');
      }

      return result;
    } catch (error) {
      console.error('❌ Goong Detail Error:', error.response?.data || error.message);

      if (error.response?.status === 404) {
        throw new Error(`Place not found: ${placeId}`);
      }

      if (error.response?.status === 401) {
        throw new Error('Invalid Goong API key');
      }

      throw new Error(`Goong detail failed: ${error.message}`);
    }
  }

  /**
   * @desc Batch fetch details for multiple place IDs
   * @param {Array<String>} placeIds - Array of Goong place_ids
   * @returns {Promise<Array>} Array of { placeId, data, error }
   */
  async batchDetail(placeIds) {
    const results = await Promise.allSettled(
      placeIds.map(async (placeId) => {
        try {
          const data = await this.detail(placeId);
          return { placeId, data, error: null };
        } catch (error) {
          return { placeId, data: null, error: error.message };
        }
      })
    );

    return results.map((result) => result.value);
  }

  /**
   * @desc Validate API key
   * @returns {Promise<Boolean>}
   */
  async validateApiKey() {
    try {
      await this.autocomplete({ input: 'test' });
      return true;
    } catch (error) {
      return false;
    }
  }
}

// Singleton instance
export default new GoongProvider();
