import axios from 'axios';

/**
 * @fileoverview Apify Provider (formerly Goong)
 * @description Service to call Apify Google Maps Scraper Actor
 * Replaces Goong API with Apify for better data coverage
 * Actor: compass/crawler-google-places
 */

class ApifyProvider {
  constructor() {
    this.baseURL = 'https://api.apify.com/v2';
    this.defaultLocation = 'Hanoi, Vietnam';
    this.defaultMaxResults = 5; // Giảm từ 20 → 5 để nhanh hơn và tiết kiệm credit

    // In-memory cache để lưu kết quả autocomplete (key: URL, value: full item)
    this.autocompleteCache = new Map();

    // Axios instance for Apify API
    this.client = axios.create({
      baseURL: this.baseURL,
      timeout: 60000, // Apify can be slower (actor execution)
      headers: {
        'Content-Type': 'application/json'
      }
    });
  }

  /**
   * Get API token from environment
   */
  getApiToken() {
    if (!process.env.APIFY_TOKEN) {
      console.error('❌ APIFY_TOKEN not found in environment variables');
      throw new Error('APIFY_TOKEN is required');
    }
    return process.env.APIFY_TOKEN;
  }

  /**
   * Get Actor ID from environment
   */
  getActorId() {
    return process.env.APIFY_ACTOR_ID || 'compass/crawler-google-places';
  }

  /**
   * Get default location from environment
   */
  getDefaultLocation() {
    return process.env.APIFY_DEFAULT_LOCATION || this.defaultLocation;
  }

  /**
   * Get default max results from environment
   */
  getDefaultMaxResults() {
    return parseInt(process.env.APIFY_MAX_RESULTS) || this.defaultMaxResults;
  }

  /**
   * @desc Run Apify Actor and get results (autocomplete/search)
   * @param {Object} params - { input, location, maxResults }
   * @returns {Promise<Array>} Dataset items (places)
   */
  async autocomplete({ input, location, maxResults }) {
    try {
      if (!input || input.trim().length === 0) {
        throw new Error('Input keyword is required');
      }

      const token = this.getApiToken();
      const actorId = this.getActorId();
      const defaultLocation = this.getDefaultLocation();
      const defaultMaxResults = this.getDefaultMaxResults();

      console.log('📡 Running Apify Actor:', {
        actorId,
        input: input.trim(),
        location: location || defaultLocation,
        maxResults: maxResults || defaultMaxResults
      });

      // Step 1: Run Actor synchronously
      const runResponse = await this.client.post(
        `/acts/${actorId}/runs`,
        {
          searchStringsArray: [input.trim()],
          locationQuery: location || defaultLocation,
          maxCrawledPlacesPerSearch: maxResults || defaultMaxResults,
          language: 'vi', // Vietnamese
          
          // ⭐ REVIEWS ADD-ON (enable all review scraping options)
          maxReviews: 20, // Số reviews tối đa mỗi quán (tăng lên 20)
          reviewsPerPlace: 20, // Alternative field name
          reviewsSort: 'mostRelevant', // Sort theo: newest, mostRelevant, highestRanking, lowestRanking
          scrapeReviewerName: true,
          scrapeReviewUrl: true,
          scrapeReviewId: true,
          scrapeReviewDate: true,
          scrapeResponseFromOwnerText: true,
          
          // 🖼️ IMAGES ADD-ON
          maxImages: 10, // Số ảnh tối đa mỗi quán (tăng lên 10)
          scrapeImageUrls: true,
          
          // 🚀 ADDITIONAL DETAILS ADD-ON
          scrapeDirectoryInfo: true // Lấy thông tin chi tiết (phone, website, opening hours...)
        },
        {
          headers: {
            Authorization: `Bearer ${token}`
          },
          params: {
            timeout: 300 // 5 minutes max
          }
        }
      );

      const runData = runResponse.data.data;
      const runId = runData.id;
      const datasetId = runData.defaultDatasetId;

      console.log('✅ Actor run started:', { runId, datasetId, status: runData.status });

      // Step 2: Wait for run to finish (poll status)
      await this._waitForRunCompletion(runId, token);

      // Step 3: Get dataset items
      const items = await this._getDatasetItems(datasetId, token);

      console.log(`✅ Retrieved ${items.length} items from Apify`);

      // Cache items for later detail() calls - lưu theo TẤT CẢ các keys
      items.forEach(item => {
        // Cache theo placeId (Google Place ID - quan trọng nhất)
        if (item.placeId) {
          this.autocompleteCache.set(item.placeId, item);
        }
        // Cache theo URL
        if (item.url) {
          this.autocompleteCache.set(item.url, item);
        }
        // Cache theo CID (Google Maps CID)
        if (item.cid) {
          this.autocompleteCache.set(item.cid, item);
        }
      });

      return items;

    } catch (error) {
      console.error('❌ Apify Autocomplete Error:', error.response?.data || error.message);
      
      if (error.response?.status === 401) {
        throw new Error('Invalid Apify API token');
      }
      
      if (error.response?.status === 429) {
        throw new Error('Apify API rate limit exceeded');
      }

      throw new Error(`Apify autocomplete failed: ${error.message}`);
    }
  }

  /**
   * @desc Get place detail by URL (compatible with old interface)
   * @param {String} placeUrl - Google Maps URL or place ID
   * @returns {Promise<Object>} Place detail object
   */
  async detail(placeUrl) {
    try {
      if (!placeUrl) {
        throw new Error('Place URL is required');
      }

      // For Apify, we already have full data from autocomplete
      // This method is just for interface compatibility
      
      if (typeof placeUrl === 'object') {
        // Already a full item, just return it
        return placeUrl;
      }

      // Try to get from cache - lookup theo TẤT CẢ các keys có thể
      let cachedItem = this.autocompleteCache.get(placeUrl);
      
      // Nếu không tìm thấy, log cache keys để debug
      if (!cachedItem) {
        const cacheKeys = Array.from(this.autocompleteCache.keys());
        console.log(`⚠️  Cache miss for: ${placeUrl}`);
        console.log(`📦 Available cache keys (${cacheKeys.length}):`, cacheKeys.slice(0, 5));
        
        throw new Error(`Place not found in cache (${placeUrl}). Cache has ${cacheKeys.length} items. Please run autocomplete search first.`);
      }
      
      console.log(`✅ Retrieved place from cache: ${cachedItem.title || placeUrl}`);
      return cachedItem;
      
    } catch (error) {
      console.error('❌ Apify Detail Error:', error.message);
      throw new Error(`Apify detail failed: ${error.message}`);
    }
  }

  /**
   * @desc Wait for Actor run to complete
   * @param {String} runId - Actor run ID
   * @param {String} token - API token
   * @private
   */
  async _waitForRunCompletion(runId, token) {
    const maxAttempts = 60; // 5 minutes max (5s interval)
    let attempts = 0;

    while (attempts < maxAttempts) {
      const statusResponse = await this.client.get(`/actor-runs/${runId}`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      const status = statusResponse.data.data.status;
      console.log(`⏳ Run status: ${status} (attempt ${attempts + 1}/${maxAttempts})`);

      if (status === 'SUCCEEDED') {
        return;
      }

      if (status === 'FAILED' || status === 'ABORTED' || status === 'TIMED-OUT') {
        throw new Error(`Actor run ${status.toLowerCase()}`);
      }

      // Wait 5 seconds before next poll
      await new Promise(resolve => setTimeout(resolve, 5000));
      attempts++;
    }

    throw new Error('Actor run timeout (max 5 minutes)');
  }

  /**
   * @desc Get dataset items from Apify
   * @param {String} datasetId - Dataset ID
   * @param {String} token - API token
   * @returns {Promise<Array>} Dataset items
   * @private
   */
  async _getDatasetItems(datasetId, token) {
    const response = await this.client.get(`/datasets/${datasetId}/items`, {
      headers: {
        Authorization: `Bearer ${token}`
      },
      params: {
        format: 'json'
      }
    });

    return response.data || [];
  }

  /**
   * @desc Validate API token
   * @returns {Promise<Boolean>}
   */
  async validateApiKey() {
    try {
      const token = this.getApiToken();
      
      // Simple validation: get user info
      const response = await this.client.get('/users/me', {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      return response.status === 200;
    } catch (error) {
      return false;
    }
  }
}

// Singleton instance
export default new ApifyProvider();
