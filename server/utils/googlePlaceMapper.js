/**
 * @fileoverview Google Places Mapper Utility
 * @description Transform Google Places dataset → MongoDB Place schema
 */

/**
 * @desc Extract district from Google address (Hà Nội pattern)
 * @param {Object} googleData - Google place data
 * @returns {String} District name
 */
const extractDistrict = (googleData) => {
  const districtMap = {
    'Ba Đình': 'Ba Đình',
    'Hoàn Kiếm': 'Hoàn Kiếm',
    'Tây Hồ': 'Tây Hồ',
    'Long Biên': 'Long Biên',
    'Cầu Giấy': 'Cầu Giấy',
    'Đống Đa': 'Đống Đa',
    'Thanh Xuân': 'Thanh Xuân',
    'Nam Từ Liêm': 'Nam Từ Liêm',
    'Bắc Từ Liêm': 'Bắc Từ Liêm',
    'Hà Đông': 'Hà Đông',
    'Hoàng Mai': 'Hoàng Mai',
    'Hai Bà Trưng': 'Hai Bà Trưng'
  };

  // Check neighborhood first
  if (googleData.neighborhood) {
    for (const [key, value] of Object.entries(districtMap)) {
      if (googleData.neighborhood.includes(key)) {
        return value;
      }
    }
  }

  // Check address
  if (googleData.address) {
    for (const [key, value] of Object.entries(districtMap)) {
      if (googleData.address.includes(key)) {
        return value;
      }
    }
  }

  // Check state
  if (googleData.state) {
    for (const [key, value] of Object.entries(districtMap)) {
      if (googleData.state.includes(key)) {
        return value;
      }
    }
  }

  return 'Hoàn Kiếm'; // Default fallback
};

/**
 * @desc Auto-detect category from Google categoryName
 * @param {String} categoryName - Google category
 * @returns {String} HaNoiGo category
 */
const mapCategory = (categoryName) => {
  const categoryMap = {
    'Nhà hàng': 'Ăn uống',
    'Quán cà phê': 'Ăn uống',
    'Quán bar': 'Ăn uống',
    'Tiệm bánh': 'Ăn uống',
    'Quán ăn': 'Ăn uống',
    'Karaoke': 'Vui chơi',
    'Rạp chiếu phim': 'Vui chơi',
    'Trung tâm giải trí': 'Vui chơi',
    'Khu vui chơi': 'Vui chơi',
    'Trung tâm thương mại': 'Mua sắm',
    'Cửa hàng': 'Mua sắm',
    'Siêu thị': 'Mua sắm',
    'Spa': 'Dịch vụ',
    'Salon': 'Dịch vụ',
    'Phòng tập': 'Dịch vụ'
  };

  return categoryMap[categoryName] || 'Ăn uống';
};

/**
 * @desc Parse price range from Google price display (ví dụ: "200-300 N ₫")
 * @param {String} priceDisplay - Price string from Google
 * @returns {Object} { min, max }
 */
const parsePriceRange = (priceDisplay) => {
  if (!priceDisplay) {
    return { min: 0, max: 100000 };
  }

  // Remove "N ₫" and spaces
  const cleaned = priceDisplay.replace(/N\s*₫/g, '').replace(/\s/g, '');

  // Extract numbers
  const matches = cleaned.match(/(\d+)-(\d+)/);
  if (matches) {
    return {
      min: parseInt(matches[1]) * 1000, // "200" → 200000
      max: parseInt(matches[2]) * 1000  // "300" → 300000
    };
  }

  // Single price
  const singleMatch = cleaned.match(/(\d+)/);
  if (singleMatch) {
    const price = parseInt(singleMatch[1]) * 1000;
    return { min: price, max: price };
  }

  return { min: 0, max: 100000 };
};

/**
 * @desc Generate description from Google data
 * @param {Object} googleData - Google place data
 * @returns {String} Description
 */
const generateDescription = (googleData) => {
  let desc = `${googleData.title || 'Địa điểm'} tại ${googleData.address || 'Hà Nội'}.`;

  if (googleData.totalScore) {
    desc += ` Đánh giá: ${googleData.totalScore}/5 sao (${googleData.reviewsCount || 0} reviews).`;
  }

  if (googleData.additionalInfo) {
    const highlights = googleData.additionalInfo['Điểm nổi bật'];
    if (highlights && highlights.length > 0) {
      const features = highlights
        .filter(h => Object.values(h)[0] === true)
        .map(h => Object.keys(h)[0])
        .slice(0, 3)
        .join(', ');
      
      if (features) {
        desc += ` Nổi bật: ${features}.`;
      }
    }
  }

  return desc;
};

/**
 * @desc Extract AI tags from Google additionalInfo
 * @param {Object} additionalInfo - Google additional info
 * @returns {Object} aiTags
 */
const extractAITags = (additionalInfo) => {
  const aiTags = {
    space: [],
    mood: [],
    suitability: [],
    specialFeatures: []
  };

  if (!additionalInfo) return aiTags;

  // Space tags từ "Bầu không khí"
  const atmosphere = additionalInfo['Bầu không khí'] || [];
  atmosphere.forEach(item => {
    const key = Object.keys(item)[0];
    const value = item[key];
    if (value) {
      if (key === 'Ấm cúng') aiTags.space.push('ấm cúng');
      if (key === 'Thông thường') aiTags.space.push('yên tĩnh');
    }
  });

  // Suitability tags từ "Khách hàng"
  const customers = additionalInfo['Khách hàng'] || [];
  customers.forEach(item => {
    const key = Object.keys(item)[0];
    const value = item[key];
    if (value) {
      if (key === 'Dành cho gia đình') aiTags.suitability.push('gia đình');
      if (key === 'Nhóm') aiTags.suitability.push('nhóm lớn');
    }
  });

  // Special features từ "Tiện nghi"
  const amenities = additionalInfo['Tiện nghi'] || [];
  amenities.forEach(item => {
    const key = Object.keys(item)[0];
    const value = item[key];
    if (value) {
      if (key === 'Wi-Fi miễn phí') aiTags.specialFeatures.push('wifi miễn phí');
      if (key === 'Điều hòa không khí') aiTags.specialFeatures.push('điều hòa');
    }
  });

  // Features từ "Điểm nổi bật"
  const highlights = additionalInfo['Điểm nổi bật'] || [];
  highlights.forEach(item => {
    const key = Object.keys(item)[0];
    const value = item[key];
    if (value) {
      if (key === 'Chỗ ngồi trên sân thượng') aiTags.space.push('rooftop');
      if (key === 'Nhạc sống') aiTags.mood.push('sôi động');
    }
  });

  return aiTags;
};

/**
 * @desc Map Google Places dataset to Place schema
 * @param {Object} googleData - Raw Google Places data
 * @param {Object} options - { createdBy }
 * @returns {Object} Mapped Place object for MongoDB
 */
export const mapGooglePlaceToPlace = (googleData, options = {}) => {
  if (!googleData || !googleData.title) {
    throw new Error('Invalid Google data: title is required');
  }

  const priceRange = parsePriceRange(googleData.price);
  const district = extractDistrict(googleData);
  const category = mapCategory(googleData.categoryName);
  const description = generateDescription(googleData);
  const aiTags = extractAITags(googleData.additionalInfo);

  return {
    // Basic info
    name: googleData.title.trim(),
    address: googleData.address || 'Chưa cập nhật',

    // District & Category
    district,
    category,

    // Description
    description,

    // Location (GeoJSON format)
    location: {
      type: 'Point',
      coordinates: [
        googleData.location?.lng || 105.8342,
        googleData.location?.lat || 21.0278
      ]
    },

    // Price
    priceRange,
    priceDisplay: googleData.price,

    // Images
    images: googleData.imageUrl ? [googleData.imageUrl] : [],

    // Opening hours
    openingHours: googleData.openingHours || [],

    // Contact
    contact: {
      phone: googleData.phone,
      phoneUnformatted: googleData.phoneUnformatted,
      website: googleData.website
    },

    // AI Tags
    aiTags,

    // Reviews
    averageRating: googleData.totalScore || 0,
    totalReviews: googleData.reviewsCount || 0,
    reviewsDistribution: googleData.reviewsDistribution || {},

    // Additional info (bao gồm reviews từ Google)
    additionalInfo: {
      ...(googleData.additionalInfo || {}),
      reviews: googleData.reviews || [] // ✅ Lưu reviews từ Google
    },

    // Google-specific data
    source: 'google',
    googlePlaceId: googleData.placeId,
    googleData: {
      placeId: googleData.placeId,
      cid: googleData.cid,
      fid: googleData.fid,
      kgmid: googleData.kgmid,
      imageUrl: googleData.imageUrl,
      imagesCount: googleData.imagesCount,
      url: googleData.url,
      plusCode: googleData.plusCode,
      locatedIn: googleData.locatedIn,
      neighborhood: googleData.neighborhood,
      street: googleData.street,
      city: googleData.city,
      postalCode: googleData.postalCode,
      state: googleData.state,
      countryCode: googleData.countryCode,
      permanentlyClosed: googleData.permanentlyClosed || false,
      temporarilyClosed: googleData.temporarilyClosed || false,
      scrapedAt: googleData.scrapedAt,
      popularTimesLiveText: googleData.popularTimesLiveText,
      popularTimesLivePercent: googleData.popularTimesLivePercent
    },

    // Flags
    needsEnrich: false, // Already has AI tags from Google
    status: 'Draft',
    isActive: true,

    // Audit
    createdBy: options.createdBy || null,
    updatedBy: options.createdBy || null
  };
};

/**
 * @desc Validate Place object before saving
 * @param {Object} placeData - Place object
 * @returns {Object} { valid, errors }
 */
export const validatePlaceData = (placeData) => {
  const errors = [];

  if (!placeData.name) errors.push('Name is required');
  if (!placeData.address) errors.push('Address is required');
  if (!placeData.district) errors.push('District is required');
  if (!placeData.category) errors.push('Category is required');
  if (!placeData.location?.coordinates?.length) errors.push('Location is required');

  return {
    valid: errors.length === 0,
    errors
  };
};
