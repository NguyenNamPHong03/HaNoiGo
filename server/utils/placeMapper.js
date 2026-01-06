/**
 * @fileoverview Place Mapper Utility
 * @description Flatten Goong API response → Place schema object
 * Transform external API data into internal database format
 */

/**
 * @desc Sanitize phone number from Goong (remove spaces, dots, parentheses)
 * @param {String} phone - Raw phone from Goong
 * @returns {String|undefined} Cleaned phone or undefined if invalid
 */
const sanitizePhone = (phone) => {
  if (!phone || typeof phone !== 'string') return undefined;
  
  // Remove all non-digit characters except + (for international format)
  const cleaned = phone.replace(/[^\d+]/g, '');
  
  // Validate: must have 8-15 digits
  if (/^\+?\d{8,15}$/.test(cleaned)) {
    return cleaned;
  }
  
  return undefined; // Invalid phone → return undefined to skip validation
};

/**
 * @desc Sanitize website URL from Goong (auto-add https:// if missing)
 * @param {String} website - Raw website from Goong
 * @returns {String|undefined} Valid URL or undefined if invalid
 */
const sanitizeWebsite = (website) => {
  if (!website || typeof website !== 'string') return undefined;
  
  const trimmed = website.trim();
  
  try {
    // Auto-add https:// if missing protocol
    const urlString = trimmed.startsWith('http') ? trimmed : `https://${trimmed}`;
    const url = new URL(urlString);
    
    // Must have valid domain (not localhost, not IP)
    if (url.hostname && url.hostname.includes('.')) {
      return url.toString();
    }
  } catch (error) {
    // Invalid URL
  }
  
  return undefined;
};

/**
 * @desc Map Goong Detail response to Place schema
 * @param {Object} goongData - Raw Goong Place Detail response
 * @param {Object} options - { createdBy, category, district, description }
 * @returns {Object} Mapped Place object ready for MongoDB
 */
export const mapGoongDetailToPlace = (goongData, options = {}) => {
  if (!goongData || !goongData.name) {
    throw new Error('Invalid Goong data: name is required');
  }

  if (!goongData.geometry || !goongData.geometry.location) {
    throw new Error('Invalid Goong data: geometry.location is required');
  }

  const { lat, lng } = goongData.geometry.location;

  // Extract district from formatted_address (Hà Nội pattern)
  const district = extractDistrict(goongData.formatted_address) || options.district || 'Hoàn Kiếm';

  // Auto-detect category from place types or name
  const category = options.category || autoDetectCategory(goongData) || 'Khác';

  return {
    // Basic info
    name: goongData.name.trim(),
    address: goongData.formatted_address || goongData.vicinity || 'Chưa cập nhật',

    // District & Category (required fields)
    district,
    category,

    // Description (required - use provided or generate default)
    description: options.description || generateDefaultDescription(goongData),

    // Location (GeoJSON format for MongoDB geospatial queries)
    location: {
      type: 'Point',
      coordinates: [lng, lat] // [longitude, latitude]
    },

    // Price range (default 0-100k - admin can edit later)
    priceRange: {
      min: 0,
      max: 100000
    },

    // Goong-specific data
    source: 'goong',
    goongPlaceId: goongData.place_id,
    goong: {
      lastSyncedAt: new Date(),
      rating: goongData.rating || null,
      raw: goongData // Store full response for debugging
    },

    // AI enrichment flag
    needsEnrich: true,

    // Default status
    status: 'Draft',
    isActive: true,

    // Images (if available)
    images: extractImages(goongData),

    // Contact info (sanitized to pass Mongoose validation)
    contact: {
      phone: sanitizePhone(goongData.formatted_phone_number || goongData.international_phone_number),
      website: sanitizeWebsite(goongData.website)
    },

    // Audit
    createdBy: options.createdBy || null,
    updatedBy: options.createdBy || null
  };
};

/**
 * @desc Extract district from Vietnamese address
 * @param {String} address - Full address string
 * @returns {String|null} District name or null
 */
const extractDistrict = (address) => {
  if (!address) return null;

  const districtPatterns = [
    'Ba Đình', 'Hoàn Kiếm', 'Tây Hồ', 'Long Biên', 'Cầu Giấy',
    'Đống Đa', 'Thanh Xuân', 'Nam Từ Liêm', 'Bắc Từ Liêm',
    'Hà Đông', 'Hoàng Mai', 'Hai Bà Trưng'
  ];

  for (const district of districtPatterns) {
    if (address.includes(district)) {
      return district;
    }
  }

  return null;
};

/**
 * @desc Auto-detect category from Goong place types or name
 * @param {Object} goongData - Goong place detail
 * @returns {String|null} Category or null
 */
const autoDetectCategory = (goongData) => {
  const name = goongData.name?.toLowerCase() || '';
  const types = goongData.types || [];

  // Food & Drink keywords
  const foodKeywords = ['cafe', 'coffee', 'quán', 'nhà hàng', 'restaurant', 'food', 'ăn', 'phở', 'bún', 'cơm', 'bar', 'pub', 'trà'];
  if (types.includes('restaurant') || types.includes('cafe') || types.includes('food') || 
      foodKeywords.some(keyword => name.includes(keyword))) {
    return 'Ăn uống';
  }

  // Entertainment keywords
  const entertainmentKeywords = ['karaoke', 'cinema', 'vui chơi', 'giải trí', 'game', 'bowling', 'billiards'];
  if (types.includes('amusement_park') || types.includes('night_club') || 
      entertainmentKeywords.some(keyword => name.includes(keyword))) {
    return 'Vui chơi';
  }

  // Shopping keywords
  const shoppingKeywords = ['shop', 'store', 'mall', 'cửa hàng', 'siêu thị', 'market'];
  if (types.includes('shopping_mall') || types.includes('store') || 
      shoppingKeywords.some(keyword => name.includes(keyword))) {
    return 'Mua sắm';
  }

  // Service keywords
  const serviceKeywords = ['spa', 'salon', 'gym', 'yoga', 'massage', 'clinic', 'hospital'];
  if (serviceKeywords.some(keyword => name.includes(keyword))) {
    return 'Dịch vụ';
  }

  return null;
};

/**
 * @desc Generate default description from Goong data
 * @param {Object} goongData - Goong place detail
 * @returns {String} Auto-generated description
 */
const generateDefaultDescription = (goongData) => {
  const name = goongData.name;
  const address = goongData.formatted_address || goongData.vicinity;
  const rating = goongData.rating;

  let description = `${name} tọa lạc tại ${address}.`;

  if (rating) {
    description += ` Đánh giá: ${rating}/5 sao.`;
  }

  description += ' (Mô tả chi tiết sẽ được cập nhật sau)';

  return description;
};

/**
 * @desc Extract images from Goong photos
 * @param {Object} goongData - Goong place detail
 * @returns {Array<String>} Array of image URLs
 */
const extractImages = (goongData) => {
  // Goong API might not return direct image URLs
  // This is a placeholder - you may need to use Goong Photo API separately
  if (!goongData.photos || !Array.isArray(goongData.photos)) {
    return [];
  }

  // If Goong provides photo references, construct URLs
  // (This depends on Goong API documentation)
  return goongData.photos.slice(0, 5).map(photo => {
    // Example: construct Goong photo URL (adjust based on API docs)
    if (photo.photo_reference) {
      return `https://rsapi.goong.io/Place/Photo?maxwidth=800&photo_reference=${photo.photo_reference}&api_key=${process.env.GOONG_API_KEY}`;
    }
    return null;
  }).filter(Boolean);
};

/**
 * @desc Map Goong Autocomplete prediction to preview object
 * @param {Object} prediction - Goong autocomplete prediction
 * @returns {Object} { goongPlaceId, name, addressHint }
 */
export const mapGoongPredictionToPreview = (prediction) => {
  return {
    goongPlaceId: prediction.place_id,
    name: prediction.structured_formatting?.main_text || prediction.description,
    addressHint: prediction.structured_formatting?.secondary_text || prediction.description
  };
};

/**
 * @desc Validate Place object before saving
 * @param {Object} placeData - Place object to validate
 * @returns {Object} { valid: Boolean, errors: Array }
 */
export const validatePlaceData = (placeData) => {
  const errors = [];

  if (!placeData.name || placeData.name.trim().length === 0) {
    errors.push('Name is required');
  }

  if (!placeData.address || placeData.address.trim().length === 0) {
    errors.push('Address is required');
  }

  if (!placeData.district) {
    errors.push('District is required');
  }

  if (!placeData.category) {
    errors.push('Category is required');
  }

  if (!placeData.location || !placeData.location.coordinates || placeData.location.coordinates.length !== 2) {
    errors.push('Valid location coordinates are required');
  }

  return {
    valid: errors.length === 0,
    errors
  };
};
