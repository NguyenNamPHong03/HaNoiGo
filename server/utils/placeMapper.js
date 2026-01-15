/**
 * @fileoverview Place Mapper Utility
 * @description Flatten Apify/Goong API response → Place schema object
 * Transform external API data into internal database format
 * Now supports Apify Google Maps Scraper (compass/crawler-google-places)
 */

/**
 * @desc Sanitize phone number from Apify/Goong (remove spaces, dots, parentheses)
 * @param {String} phone - Raw phone from API
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
 * @desc Sanitize website URL from API (auto-add https:// if missing)
 * @param {String} website - Raw website from API
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
 * @desc Map Apify Google Maps Scraper item to Place schema
 * @param {Object} apifyItem - Raw Apify dataset item
 * @param {Object} options - { createdBy, category, district, description }
 * @returns {Object} Mapped Place object ready for MongoDB
 */
export const mapApifyItemToPlace = (apifyItem, options = {}) => {
  if (!apifyItem || !apifyItem.title) {
    throw new Error('Invalid Apify data: title is required');
  }

  if (!apifyItem.location || !apifyItem.location.lat || !apifyItem.location.lng) {
    throw new Error('Invalid Apify data: location.lat/lng is required');
  }

  const { lat, lng } = apifyItem.location;

  // Extract district from address (Hà Nội pattern)
  const district = extractDistrict(apifyItem.address) || options.district || 'Hoàn Kiếm';

  // Auto-detect category from category or title
  const category = options.category || autoDetectCategory(apifyItem) || 'Khác';

  // Extract opening hours if available
  const openingHours = extractOpeningHours(apifyItem);

  return {
    // Basic info
    name: apifyItem.title.trim(),
    address: apifyItem.address || apifyItem.neighborhood || 'Chưa cập nhật',

    // District & Category (required fields)
    district,
    category,

    // Description (required - use provided or generate default)
    description: options.description || generateDefaultDescription(apifyItem),

    // Location (GeoJSON format for MongoDB geospatial queries)
    location: {
      type: 'Point',
      coordinates: [lng, lat] // [longitude, latitude]
    },

    // Price range (from Apify or default 0-100k)
    priceRange: extractPriceRange(apifyItem),
    priceDisplay: apifyItem.price || undefined,

    // Apify-specific data
    source: 'apify',
    apifyPlaceId: apifyItem.url || apifyItem.placeId || apifyItem.cid,
    apify: {
      lastSyncedAt: new Date(),
      rating: apifyItem.totalScore || apifyItem.rating || null,
      reviewsCount: apifyItem.reviewsCount || 0,
      raw: apifyItem // Store full response for debugging
    },

    // Google-specific fields (if available from Apify)
    googlePlaceId: apifyItem.placeId || undefined,

    // AI enrichment flag
    needsEnrich: true,

    // Default status
    status: 'Draft',
    isActive: true,

    // Images (if available)
    images: extractImages(apifyItem),

    // Opening hours
    openingHours,

    // Contact info (sanitized to pass Mongoose validation)
    contact: {
      phone: sanitizePhone(apifyItem.phone),
      phoneUnformatted: apifyItem.phone || undefined,
      website: sanitizeWebsite(apifyItem.website)
    },

    // Average rating
    averageRating: apifyItem.totalScore || 0,
    
    // Total reviews count
    totalReviews: apifyItem.reviewsCount || 0,

    // Reviews distribution (if available)
    reviewsDistribution: extractReviewsDistribution(apifyItem),

    // Google Reviews content (reviews từ Apify Actor)
    googleReviews: extractReviews(apifyItem),

    // AI Tags (auto-generate từ category, reviews, description)
    aiTags: generateAITags(apifyItem, category),

    // Additional info
    additionalInfo: {
      ...apifyItem.additionalInfo, // Merge Google's additionalInfo (amenities, atmosphere, etc.) FIRST
      // Then override/add specific fields
      categoryName: apifyItem.categoryName,
      subCategories: apifyItem.subCategories,
      permanentlyClosed: apifyItem.permanentlyClosed,
      temporarilyClosed: apifyItem.temporarilyClosed,
      rank: apifyItem.rank,
      searchString: apifyItem.searchString,
      popularTimesHistogram: apifyItem.popularTimesHistogram, // Thời gian đông khách
      popularTimesLiveText: apifyItem.popularTimesLiveText,
      peopleAlsoSearch: apifyItem.peopleAlsoSearch, // Địa điểm liên quan
      questionsAndAnswers: apifyItem.questionsAndAnswers,
      reviews: extractReviews(apifyItem) // ✅ MUST BE LAST để không bị override
    },

    // Audit
    createdBy: options.createdBy || null,
    updatedBy: options.createdBy || null
  };
};

/**
 * @desc Extract opening hours from Apify data
 * @param {Object} apifyItem - Apify item
 * @returns {Array} Opening hours array
 */
const extractOpeningHours = (apifyItem) => {
  if (!apifyItem.openingHours) return [];

  const dayMap = {
    'Monday': 'Thứ Hai',
    'Tuesday': 'Thứ Ba',
    'Wednesday': 'Thứ Tư',
    'Thursday': 'Thứ Năm',
    'Friday': 'Thứ Sáu',
    'Saturday': 'Thứ Bảy',
    'Sunday': 'Chủ Nhật'
  };

  return apifyItem.openingHours.map(entry => ({
    day: dayMap[entry.day] || entry.day,
    hours: entry.hours
  }));
};

/**
 * @desc Extract price range from Apify data
 * @param {Object} apifyItem - Apify item
 * @returns {Object} { min, max }
 */
const extractPriceRange = (apifyItem) => {
  // Default range
  let min = 0;
  let max = 100000;

  // Parse from price string (e.g., "100-200 ₫", "$10-$20")
  if (apifyItem.price && typeof apifyItem.price === 'string') {
    const priceMatch = apifyItem.price.match(/(\d+)[\s\-]+(\d+)/);
    if (priceMatch) {
      min = parseInt(priceMatch[1]) * 1000; // Convert to VND
      max = parseInt(priceMatch[2]) * 1000;
    }
  }

  // Parse from priceLevel (Google's 0-4 scale)
  if (apifyItem.priceLevel !== undefined) {
    const ranges = [
      { min: 0, max: 50000 },      // Level 0
      { min: 50000, max: 150000 }, // Level 1
      { min: 150000, max: 300000 },// Level 2
      { min: 300000, max: 500000 },// Level 3
      { min: 500000, max: 1000000 }// Level 4
    ];
    const range = ranges[apifyItem.priceLevel] || ranges[0];
    min = range.min;
    max = range.max;
  }

  return { min, max };
};

/**
 * @desc Extract reviews distribution from Apify data
 * @param {Object} apifyItem - Apify item
 * @returns {Object} Reviews distribution
 */
const extractReviewsDistribution = (apifyItem) => {
  return {
    oneStar: apifyItem.reviewsDistribution?.oneStar || 0,
    twoStar: apifyItem.reviewsDistribution?.twoStars || 0,
    threeStar: apifyItem.reviewsDistribution?.threeStars || 0,
    fourStar: apifyItem.reviewsDistribution?.fourStars || 0,
    fiveStar: apifyItem.reviewsDistribution?.fiveStars || 0
  };
};

/**
 * @desc Extract Google reviews from Apify data
 * @param {Object} apifyItem - Apify item
 * @returns {Array} Reviews array
 */
const extractReviews = (apifyItem) => {
  if (!apifyItem.reviews || !Array.isArray(apifyItem.reviews)) {
    console.log(`⚠️  No reviews found in Apify data for: ${apifyItem.title}`);
    return [];
  }

  console.log(`📝 Extracting ${apifyItem.reviews.length} reviews for: ${apifyItem.title}`);
  
  return apifyItem.reviews.slice(0, 20).map(review => ({
    name: review.name || review.authorName,
    text: review.text || review.reviewText,
    stars: review.stars || review.rating,
    publishedAtDate: review.publishedAtDate || review.publishedAt,
    likesCount: review.likesCount || 0,
    reviewUrl: review.reviewUrl || review.url,
    reviewImageUrls: review.reviewImageUrls || review.images || [],
    responseFromOwnerText: review.responseFromOwnerText || review.ownerResponse
  })).filter(r => r.text); // Chỉ lấy reviews có nội dung
};

/**
 * @desc Auto-generate AI tags từ category, title, reviews, additionalInfo
 * @param {Object} apifyItem - Apify item
 * @param {String} category - Detected category
 * @returns {Object} AI tags object
 */
const generateAITags = (apifyItem, category) => {
  const tags = {
    space: [],
    mood: [],
    suitability: [],
    specialFeatures: []
  };
  
  console.log(`🏷️  Generating AI tags for: ${apifyItem.title}`);
  console.log(`   Category: ${category}`);
  console.log(`   Reviews count: ${apifyItem.reviews?.length || 0}`);
  console.log(`   CategoryName: ${apifyItem.categoryName}`);

  const title = (apifyItem.title || '').toLowerCase();
  const reviewTexts = (apifyItem.reviews || [])
    .map(r => (r.text || '').toLowerCase())
    .join(' ');
  const categoryName = (apifyItem.categoryName || '').toLowerCase();
  const additionalInfo = apifyItem.additionalInfo || {};
  
  // ============= MAP TỪ ADDITIONAL INFO =============
  
  // 🏠 SPACE TAGS - từ "Bầu không khí"
  const atmosphere = additionalInfo['Bầu không khí'] || [];
  atmosphere.forEach(item => {
    const key = Object.keys(item)[0];
    const value = item[key];
    if (value) {
      if (key === 'Ấm cúng') tags.space.push('ấm cúng');
      if (key === 'Thông thường') tags.space.push('yên tĩnh');
      if (key === 'Sành điệu') tags.space.push('hiện đại');
      if (key === 'Thời thượng') tags.space.push('hiện đại');
    }
  });
  
  // 👥 SUITABILITY TAGS - từ "Khách hàng"
  const customers = additionalInfo['Khách hàng'] || [];
  customers.forEach(item => {
    const key = Object.keys(item)[0];
    const value = item[key];
    if (value) {
      if (key === 'Nhóm') tags.suitability.push('nhóm lớn');
      if (key === 'Dành cho gia đình') tags.suitability.push('gia đình');
    }
  });
  
  // 👶 SUITABILITY - từ "Trẻ em"
  const children = additionalInfo['Trẻ em'] || [];
  children.forEach(item => {
    const key = Object.keys(item)[0];
    const value = item[key];
    if (value) {
      if (key === 'Phù hợp cho trẻ em') {
        if (!tags.suitability.includes('gia đình')) {
          tags.suitability.push('gia đình');
        }
      }
    }
  });
  
  // ⭐ SPECIAL FEATURES - từ "Tiện nghi"
  const amenities = additionalInfo['Tiện nghi'] || [];
  amenities.forEach(item => {
    const key = Object.keys(item)[0];
    const value = item[key];
    if (value) {
      if (key === 'Wi-Fi miễn phí') tags.specialFeatures.push('wifi miễn phí');
      if (key === 'Điều hòa không khí') tags.specialFeatures.push('điều hòa');
      // 'Nhà vệ sinh' - không có trong enum, bỏ qua
    }
  });
  
  // ⭐ SPECIAL FEATURES - từ "Dịch vụ"
  const services = additionalInfo['Dịch vụ'] || [];
  services.forEach(item => {
    const key = Object.keys(item)[0];
    const value = item[key];
    if (value) {
      if (key === 'Giao hàng') tags.specialFeatures.push('delivery');
      if (key === 'Đồ ăn mang đi') tags.specialFeatures.push('delivery'); // Tương tự delivery
      // 'Phục vụ tại bàn' - không có trong enum, bỏ qua
    }
  });
  
  // 🕒 SUITABILITY - từ "Lên kế hoạch"
  const planning = additionalInfo['Lên kế hoạch'] || [];
  planning.forEach(item => {
    const key = Object.keys(item)[0];
    const value = item[key];
    if (value) {
      if (key === 'Ghé nhanh') tags.suitability.push('thư giãn');
    }
  });
  
  // 🚗 SPECIAL FEATURES - từ "Đậu xe" (nếu có trong additionalInfo)
  const parking = additionalInfo['Đậu xe'] || [];
  parking.forEach(item => {
    const key = Object.keys(item)[0];
    const value = item[key];
    if (value) {
      // 'Có chỗ đậu xe' - không có trong enum, bỏ qua
    }
  });
  
  // ♿ SPECIAL FEATURES - từ "Phù hợp cho người khuyết tật"
  const accessibility = additionalInfo['Phù hợp cho người khuyết tật'] || [];
  accessibility.forEach(item => {
    const key = Object.keys(item)[0];
    const value = item[key];
    if (value) {
      // Note: wheelchair accessibility không có trong enum, bỏ qua hoặc map vào field khác
      // if (key === 'Lối vào cho xe lăn') tags.specialFeatures.push('ngoài trời');
    }
  });
  
  // ============= FALLBACK: MAP TỪ TITLE & REVIEWS =============
  
  // Space tags (dựa vào title, categoryName)
  if (title.includes('rooftop') || reviewTexts.includes('rooftop')) {
    if (!tags.space.includes('rooftop')) tags.space.push('rooftop');
  }
  if (title.includes('outdoor') || title.includes('ngoài trời')) {
    if (!tags.space.includes('ngoài trời')) tags.space.push('ngoài trời');
  }
  if (reviewTexts.includes('ấm cúng') || reviewTexts.includes('cozy')) {
    if (!tags.space.includes('ấm cúng')) tags.space.push('ấm cúng');
  }
  if (reviewTexts.includes('rộng rãi') || reviewTexts.includes('spacious')) {
    if (!tags.space.includes('rộng rãi')) tags.space.push('rộng rãi');
  }
  if (reviewTexts.includes('yên tĩnh') || reviewTexts.includes('quiet')) {
    if (!tags.space.includes('yên tĩnh')) tags.space.push('yên tĩnh');
  }
  if (title.includes('vintage') || categoryName.includes('vintage')) {
    if (!tags.space.includes('vintage')) tags.space.push('vintage');
  }

  // Mood tags (dựa vào reviews)
  if (reviewTexts.includes('lãng mạn') || reviewTexts.includes('romantic')) {
    if (!tags.mood.includes('lãng mạn')) tags.mood.push('lãng mạn');
  }
  if (reviewTexts.includes('chill') || reviewTexts.includes('relax')) {
    if (!tags.mood.includes('chill')) tags.mood.push('chill');
  }
  if (reviewTexts.includes('sôi động') || reviewTexts.includes('vibrant')) {
    if (!tags.mood.includes('sôi động')) tags.mood.push('sôi động');
  }
  if (reviewTexts.includes('thư giãn') || reviewTexts.includes('peaceful')) {
    if (!tags.mood.includes('thư giãn')) tags.mood.push('thư giãn');
  }

  // Suitability tags (dựa vào category + title)
  if (category === 'Ăn uống') {
    if (title.includes('cafe') || title.includes('cà phê')) {
      ['học bài', 'công việc', 'hẹn hò'].forEach(tag => {
        if (!tags.suitability.includes(tag)) tags.suitability.push(tag);
      });
    }
    if (title.includes('restaurant') || title.includes('nhà hàng')) {
      ['gia đình', 'bạn bè', 'họp mặt'].forEach(tag => {
        if (!tags.suitability.includes(tag)) tags.suitability.push(tag);
      });
    }
    if (title.includes('bar') || title.includes('pub')) {
      ['bạn bè', 'tụ tập'].forEach(tag => {
        if (!tags.suitability.includes(tag)) tags.suitability.push(tag);
      });
    }
  }

  // Special features (fallback từ reviews)
  if (reviewTexts.includes('wifi')) {
    if (!tags.specialFeatures.includes('wifi miễn phí')) {
      tags.specialFeatures.push('wifi miễn phí');
    }
  }
  if (reviewTexts.includes('view đẹp') || reviewTexts.includes('nice view')) {
    if (!tags.specialFeatures.includes('view đẹp')) {
      tags.specialFeatures.push('view đẹp');
    }
  }
  if (reviewTexts.includes('pet friendly') || reviewTexts.includes('thú cưng')) {
    if (!tags.specialFeatures.includes('pet friendly')) {
      tags.specialFeatures.push('pet friendly');
    }
  }

  console.log(`   ✅ Generated tags:`, JSON.stringify(tags));
  
  return tags;
};

/**
 * @desc Map Apify item to preview format (for autocomplete UI)
 * @param {Object} apifyItem - Apify dataset item
 * @returns {Object} { goongPlaceId, name, addressHint }
 */
export const mapApifyItemToPreview = (apifyItem) => {
  return {
    goongPlaceId: apifyItem.placeId || apifyItem.url || apifyItem.cid, // placeId ưu tiên (Google Place ID)
    name: apifyItem.title || apifyItem.name,
    addressHint: `${apifyItem.categoryName || ''} • ${apifyItem.address || apifyItem.neighborhood || ''}`.trim()
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
 * @desc Auto-detect category from Apify/Goong place data
 * @param {Object} placeData - Place data from API
 * @returns {String|null} Category or null
 */
const autoDetectCategory = (placeData) => {
  const name = (placeData.title || placeData.name || '').toLowerCase();
  const categoryName = (placeData.categoryName || '').toLowerCase();
  const types = placeData.types || [];

  // Food & Drink keywords
  const foodKeywords = ['cafe', 'coffee', 'quán', 'nhà hàng', 'restaurant', 'food', 'ăn', 'phở', 'bún', 'cơm', 'bar', 'pub', 'trà'];
  if (types.includes('restaurant') || types.includes('cafe') || types.includes('food') || 
      foodKeywords.some(keyword => name.includes(keyword) || categoryName.includes(keyword))) {
    return 'Ăn uống';
  }

  // Entertainment keywords
  const entertainmentKeywords = ['karaoke', 'cinema', 'vui chơi', 'giải trí', 'game', 'bowling', 'billiards'];
  if (types.includes('amusement_park') || types.includes('night_club') || 
      entertainmentKeywords.some(keyword => name.includes(keyword) || categoryName.includes(keyword))) {
    return 'Vui chơi';
  }

  // Shopping keywords
  const shoppingKeywords = ['shop', 'store', 'mall', 'cửa hàng', 'siêu thị', 'market'];
  if (types.includes('shopping_mall') || types.includes('store') || 
      shoppingKeywords.some(keyword => name.includes(keyword) || categoryName.includes(keyword))) {
    return 'Mua sắm';
  }

  // Service keywords
  const serviceKeywords = ['spa', 'salon', 'gym', 'yoga', 'massage', 'clinic', 'hospital'];
  if (serviceKeywords.some(keyword => name.includes(keyword) || categoryName.includes(keyword))) {
    return 'Dịch vụ';
  }

  return null;
};

/**
 * @desc Generate default description from place data
 * @param {Object} placeData - Place data from API
 * @returns {String} Auto-generated description
 */
const generateDefaultDescription = (placeData) => {
  const name = placeData.title || placeData.name;
  const address = placeData.address || placeData.formatted_address || placeData.vicinity;
  const rating = placeData.totalScore || placeData.rating;

  let description = `${name} tọa lạc tại ${address}.`;

  if (rating) {
    description += ` Đánh giá: ${rating}/5 sao.`;
  }

  description += ' (Mô tả chi tiết sẽ được cập nhật sau)';

  return description;
};

/**
 * @desc Extract images from place data
 * @param {Object} placeData - Place data from API
 * @returns {Array<String>} Array of image URLs
 */
const extractImages = (placeData) => {
  const images = [];

  // ✅ Ưu tiên imageUrls (full resolution URLs từ Apify)
  if (placeData.imageUrls && Array.isArray(placeData.imageUrls) && placeData.imageUrls.length > 0) {
    images.push(...placeData.imageUrls.slice(0, 10)); // Lấy tối đa 10 ảnh
    return images;
  }
  
  // Fallback: 'images' field (array of objects với imageUrl property)
  if (placeData.images && Array.isArray(placeData.images)) {
    const imageObjects = placeData.images.slice(0, 10);
    imageObjects.forEach(img => {
      if (img.imageUrl) {
        images.push(img.imageUrl);
      } else if (typeof img === 'string') {
        images.push(img); // Fallback nếu là string thay vì object
      }
    });
  }

  // From Goong photos (legacy support)
  if (images.length === 0 && placeData.photos && Array.isArray(placeData.photos)) {
    placeData.photos.slice(0, 5).forEach(photo => {
      if (photo.photo_reference) {
        images.push(`https://rsapi.goong.io/Place/Photo?maxwidth=800&photo_reference=${photo.photo_reference}&api_key=${process.env.GOONG_API_KEY}`);
      }
    });
  }

  console.log(`📸 Extracted ${images.length} images from place data`);
  return images.filter(Boolean);
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

// Legacy Goong mapper (for backward compatibility)
export const mapGoongDetailToPlace = (goongData, options = {}) => {
  console.warn('⚠️ mapGoongDetailToPlace is deprecated. Use mapApifyItemToPlace instead.');
  
  // Transform Goong format to Apify-like format
  const apifyLike = {
    title: goongData.name,
    address: goongData.formatted_address || goongData.vicinity,
    location: goongData.geometry?.location || {},
    rating: goongData.rating,
    phone: goongData.formatted_phone_number || goongData.international_phone_number,
    website: goongData.website,
    placeId: goongData.place_id,
    types: goongData.types,
    photos: goongData.photos
  };

  return mapApifyItemToPlace(apifyLike, options);
};

export const mapGoongPredictionToPreview = (prediction) => {
  console.warn('⚠️ mapGoongPredictionToPreview is deprecated. Use mapApifyItemToPreview instead.');
  return {
    goongPlaceId: prediction.place_id,
    name: prediction.structured_formatting?.main_text || prediction.description,
    addressHint: prediction.structured_formatting?.secondary_text || prediction.description
  };
};

// Export helper functions để sử dụng trong refresh logic
export { extractImages, extractOpeningHours, extractReviews, generateAITags };

