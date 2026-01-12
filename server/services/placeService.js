import Place from '../models/Place.js';
import { generateAiTagsFromGoogle, mergeAiTags } from './autoTaggerService.js';

/**
 * PLACE SERVICE
 * Business logic layer cho địa điểm
 * Xử lý: Search, Filter, CRUD, Semantic tags, Validation
 */

// ========== QUERY BUILDERS ==========

/**
 * Build filter query từ request parameters
 * @param {object} filters - Filter parameters
 * @returns {object} MongoDB query object
 */
const buildPlaceQuery = (filters) => {
  const {
    q,
    district,
    category,
    status,
    minPrice,
    maxPrice,
    mood,
    space,
    suitability,
    isActive,
    featured,
  } = filters;

  const query = {};

  // Text search (name, description, address) - using regex for partial matching
  if (q) {
    const searchRegex = { $regex: q.trim(), $options: 'i' }; // Case-insensitive
    query.$or = [
      { name: searchRegex },
      { description: searchRegex },
      { address: searchRegex }
    ];
  }

  // District filter
  if (district) {
    query.district = district;
  }

  // Category filter
  if (category) {
    query.category = category;
  }

  // Status filter
  if (status) {
    query.status = status;
  }

  // Active filter
  if (typeof isActive !== 'undefined') {
    query.isActive = isActive === 'true' || isActive === true;
  }

  // Featured filter
  if (typeof featured !== 'undefined') {
    query.featured = featured === 'true' || featured === true;
  }

  // Price range filter
  if (minPrice || maxPrice) {
    query['priceRange.min'] = {};
    query['priceRange.max'] = {};

    if (minPrice) {
      query['priceRange.min'].$gte = parseInt(minPrice);
    }
    if (maxPrice) {
      query['priceRange.max'].$lte = parseInt(maxPrice);
    }
  }

  // AI Tags - Semantic filters
  if (mood) {
    const moodArray = Array.isArray(mood) ? mood : mood.split(',');
    query['aiTags.mood'] = { $in: moodArray };
  }

  if (space) {
    const spaceArray = Array.isArray(space) ? space : space.split(',');
    query['aiTags.space'] = { $in: spaceArray };
  }

  if (suitability) {
    const suitabilityArray = Array.isArray(suitability)
      ? suitability
      : suitability.split(',');
    query['aiTags.suitability'] = { $in: suitabilityArray };
  }

  return query;
};

/**
 * Build sort object từ parameters
 * @param {string} sortBy - Field to sort by
 * @param {string} sortOrder - asc/desc
 * @returns {object} MongoDB sort object
 */
const buildSortObject = (sortBy = 'updatedAt', sortOrder = 'desc') => {
  const sort = {};
  sort[sortBy] = sortOrder === 'desc' ? -1 : 1;
  return sort;
};

// ========== CRUD OPERATIONS ==========

/**
 * Get all places với filter, sort, pagination
 * @param {object} options - Query options
 * @returns {object} { places, pagination }
 */
export const getAllPlaces = async (options = {}) => {
  const {
    // Filters
    q,
    district,
    category,
    status,
    minPrice,
    maxPrice,
    mood,
    space,
    suitability,
    isActive,
    featured,

    // Sort
    sortBy = 'updatedAt',
    sortOrder = 'desc',

    // Pagination
    page = 1,
    limit = 20,
  } = options;

  // Build query
  const filter = buildPlaceQuery({
    q,
    district,
    category,
    status,
    minPrice,
    maxPrice,
    mood,
    space,
    suitability,
    isActive,
    featured,
  });

  // Build sort
  const sort = buildSortObject(sortBy, sortOrder);

  // Calculate pagination
  const skip = (parseInt(page) - 1) * parseInt(limit);

  // Execute parallel queries
  const [places, total] = await Promise.all([
    Place.find(filter)
      .populate('createdBy', 'displayName username')
      .populate('updatedBy', 'displayName username')
      .sort(sort)
      .skip(skip)
      .limit(parseInt(limit))
      .lean(),
    Place.countDocuments(filter),
  ]);

  // Calculate pagination metadata
  const totalPages = Math.ceil(total / parseInt(limit));
  const currentPage = parseInt(page);

  const pagination = {
    currentPage,
    totalPages,
    totalItems: total,
    itemsPerPage: parseInt(limit),
    hasNextPage: currentPage < totalPages,
    hasPrevPage: currentPage > 1,
  };

  return { places, pagination };
};

/**
 * Get place by ID
 * @param {string} placeId - Place ID
 * @returns {object} Place object
 */
export const getPlaceById = async (placeId) => {
  const place = await Place.findById(placeId)
    .populate('createdBy', 'displayName username email')
    .populate('updatedBy', 'displayName username email');

  if (!place) {
    throw new Error('Không tìm thấy địa điểm');
  }

  return place;
};

/**
 * Create new place
 * @param {object} placeData - Place data
 * @param {string} userId - User ID creating the place (optional)
 * @returns {object} Created place
 */
export const createPlace = async (placeData, userId = null) => {
  // Validate required fields
  if (!placeData.name || !placeData.address || !placeData.district) {
    throw new Error('Name, address, and district are required');
  }

  // 🤖 AUTO-GENERATE AI TAGS từ Google/Goong data
  let aiTags = placeData.aiTags || { mood: [], space: [], suitability: [], crowdLevel: [], music: [], parking: [], specialFeatures: [] };

  // Nếu có Google/Goong data, tự động sinh AI tags
  if (placeData.source === 'google' && (placeData.googleData || placeData.additionalInfo)) {
    console.log('🤖 Auto-generating AI tags for new Google Place...');
    const googleData = placeData.googleData || {
      additionalInfo: placeData.additionalInfo,
      reviews: placeData.additionalInfo?.reviews || [],
      category: placeData.category
    };

    const autoGeneratedTags = generateAiTagsFromGoogle(googleData);
    aiTags = mergeAiTags(aiTags, autoGeneratedTags);
    console.log('✅ AI tags auto-generated:', JSON.stringify(aiTags, null, 2));
  }

  // Chuẩn hóa dữ liệu
  const normalizedData = {
    name: placeData.name,
    address: placeData.address,
    district: placeData.district,
    category: placeData.category,
    description: placeData.description,
    priceRange: placeData.priceRange,
    images: placeData.images || [],
    menu: placeData.menu || [],
    aiTags: aiTags, // ✅ Sử dụng AI tags đã auto-generate
    operatingHours: placeData.operatingHours,

    // Convert coordinates {latitude, longitude} → location GeoJSON
    ...(placeData.coordinates?.latitude && placeData.coordinates?.longitude && {
      location: {
        type: 'Point',
        coordinates: [
          Number(placeData.coordinates.longitude),
          Number(placeData.coordinates.latitude)
        ]
      }
    }),

    // Normalize contact
    contact: {
      phone: placeData.phone || placeData.contact?.phone || '',
      website: placeData.website || placeData.contact?.website || '',
    },

    // Normalize status - schema dùng 'Published' chứ không phải 'published'
    status: normalizeStatus(placeData.status),
    isActive: placeData.isActive !== false,
    featured: placeData.featured || false,
  };

  // Add user references if provided
  if (userId) {
    normalizedData.createdBy = userId;
    normalizedData.updatedBy = userId;
  }

  // Create place
  const place = new Place(normalizedData);
  await place.save();

  // Populate user references
  if (userId) {
    await place.populate('createdBy', 'displayName username');
    await place.populate('updatedBy', 'displayName username');
  }

  return place;
};

/**
 * Update existing place
 * @param {string} placeId - Place ID
 * @param {object} updateData - Updated data
 * @param {string} userId - User ID updating the place (optional)
 * @returns {object} Updated place
 */
export const updatePlace = async (placeId, updateData, userId = null) => {
  // Check if place exists
  const existingPlace = await Place.findById(placeId);
  if (!existingPlace) {
    throw new Error('Không tìm thấy địa điểm');
  }

  // 🤖 AUTO-GENERATE AI TAGS khi update Google/Goong data
  let aiTags = updateData.aiTags || existingPlace.aiTags;

  // Nếu đang update place từ Google/Goong và có additionalInfo
  if (existingPlace.source === 'google' && updateData.additionalInfo) {
    console.log('🤖 Auto-updating AI tags from Google data...');
    const googleData = {
      additionalInfo: updateData.additionalInfo,
      reviews: updateData.additionalInfo?.reviews || existingPlace.additionalInfo?.reviews || [],
      category: updateData.category || existingPlace.category
    };

    const autoGeneratedTags = generateAiTagsFromGoogle(googleData);
    aiTags = mergeAiTags(existingPlace.aiTags, autoGeneratedTags);
    console.log('✅ AI tags merged:', JSON.stringify(aiTags, null, 2));
  }

  // Chuẩn hóa dữ liệu update
  const normalizedData = {
    name: updateData.name,
    address: updateData.address,
    district: updateData.district,
    category: updateData.category,
    description: updateData.description,
    priceRange: updateData.priceRange,
    images: updateData.images,
    menu: updateData.menu,
    aiTags: aiTags, // ✅ Sử dụng AI tags đã merge
    operatingHours: updateData.operatingHours,

    // Convert coordinates {latitude, longitude} → location GeoJSON
    ...(updateData.coordinates?.latitude && updateData.coordinates?.longitude && {
      location: {
        type: 'Point',
        coordinates: [
          Number(updateData.coordinates.longitude),
          Number(updateData.coordinates.latitude)
        ]
      }
    }),

    // Normalize contact
    contact: {
      phone: updateData.phone || updateData.contact?.phone || '',
      website: updateData.website || updateData.contact?.website || '',
    },

    // Normalize status
    status: normalizeStatus(updateData.status),
    isActive: updateData.isActive,
    featured: updateData.featured,
  };

  // Add updatedBy if userId provided
  if (userId) {
    normalizedData.updatedBy = userId;
  }

  // Update place
  const place = await Place.findByIdAndUpdate(placeId, normalizedData, {
    new: true,
    runValidators: true,
  });

  // Populate user references
  if (userId) {
    await place.populate('createdBy', 'displayName username');
    await place.populate('updatedBy', 'displayName username');
  }

  return place;
};

/**
 * Delete place (soft delete recommended)
 * @param {string} placeId - Place ID
 * @returns {object} Deleted place info
 */
export const deletePlace = async (placeId) => {
  const place = await Place.findById(placeId);

  if (!place) {
    throw new Error('Không tìm thấy địa điểm');
  }

  // Option 1: Hard delete
  await Place.findByIdAndDelete(placeId);

  // Option 2: Soft delete (recommended) - set status to archived
  // await Place.findByIdAndUpdate(placeId, { status: 'Archived', isActive: false });

  return {
    _id: place._id,
    name: place.name,
    message: 'Địa điểm đã được xóa',
  };
};

/**
 * Toggle place active status
 * @param {string} placeId - Place ID
 * @param {boolean} isActive - Active status
 * @returns {object} Updated place
 */
export const togglePlaceActive = async (placeId, isActive) => {
  const place = await Place.findByIdAndUpdate(
    placeId,
    { isActive },
    { new: true }
  );

  if (!place) {
    throw new Error('Không tìm thấy địa điểm');
  }

  return place;
};

/**
 * Toggle place featured status
 * @param {string} placeId - Place ID
 * @param {boolean} featured - Featured status
 * @returns {object} Updated place
 */
export const togglePlaceFeatured = async (placeId, featured) => {
  const place = await Place.findByIdAndUpdate(
    placeId,
    { featured },
    { new: true }
  );

  if (!place) {
    throw new Error('Không tìm thấy địa điểm');
  }

  return place;
};

// ========== SEMANTIC TAGS MANAGEMENT ==========

/**
 * Update AI Tags cho place
 * @param {string} placeId - Place ID
 * @param {object} aiTags - { mood, space, suitability }
 * @returns {object} Updated place
 */
export const updateAITags = async (placeId, aiTags) => {
  const place = await Place.findByIdAndUpdate(
    placeId,
    { aiTags },
    { new: true, runValidators: true }
  );

  if (!place) {
    throw new Error('Không tìm thấy địa điểm');
  }

  return place;
};

/**
 * Add tag to specific AI tag category
 * @param {string} placeId - Place ID
 * @param {string} category - mood/space/suitability
 * @param {string} tag - Tag value
 * @returns {object} Updated place
 */
export const addAITag = async (placeId, category, tag) => {
  if (!['mood', 'space', 'suitability'].includes(category)) {
    throw new Error('Invalid AI tag category');
  }

  const place = await Place.findById(placeId);
  if (!place) {
    throw new Error('Không tìm thấy địa điểm');
  }

  // Add tag if not exists
  if (!place.aiTags[category].includes(tag)) {
    place.aiTags[category].push(tag);
    await place.save();
  }

  return place;
};

/**
 * Remove tag from specific AI tag category
 * @param {string} placeId - Place ID
 * @param {string} category - mood/space/suitability
 * @param {string} tag - Tag value
 * @returns {object} Updated place
 */
export const removeAITag = async (placeId, category, tag) => {
  if (!['mood', 'space', 'suitability'].includes(category)) {
    throw new Error('Invalid AI tag category');
  }

  const place = await Place.findById(placeId);
  if (!place) {
    throw new Error('Không tìm thấy địa điểm');
  }

  // Remove tag
  place.aiTags[category] = place.aiTags[category].filter((t) => t !== tag);
  await place.save();

  return place;
};

// ========== STATISTICS & ANALYTICS ==========

/**
 * Get place statistics
 * @returns {object} Statistics data
 */
export const getPlaceStats = async () => {
  const [
    totalPlaces,
    activePlaces,
    featuredPlaces,
    placesByCategory,
    placesByDistrict,
  ] = await Promise.all([
    Place.countDocuments(),
    Place.countDocuments({ isActive: true }),
    Place.countDocuments({ featured: true }),
    Place.aggregate([
      { $group: { _id: '$category', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
    ]),
    Place.aggregate([
      { $group: { _id: '$district', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
    ]),
  ]);

  return {
    totalPlaces,
    activePlaces,
    featuredPlaces,
    byCategory: placesByCategory,
    byDistrict: placesByDistrict,
  };
};

/**
 * Get places by district
 * @param {string} district - District name
 * @returns {array} Places array
 */
export const getPlacesByDistrict = async (district) => {
  const places = await Place.find({
    district,
    isActive: true,
  }).lean();

  return places;
};

/**
 * Get places by category
 * @param {string} category - Category name
 * @returns {array} Places array
 */
export const getPlacesByCategory = async (category) => {
  const places = await Place.find({
    category,
    isActive: true,
  }).lean();

  return places;
};

/**
 * Get featured places
 * @param {number} limit - Number of places to return
 * @returns {array} Places array
 */
export const getFeaturedPlaces = async (limit = 10) => {
  const places = await Place.find({
    featured: true,
    isActive: true,
  })
    .limit(limit)
    .sort({ updatedAt: -1 })
    .lean();

  return places;
};

/**
 * Search places by text (name, description, address)
 * @param {string} searchText - Search query
 * @param {number} limit - Result limit
 * @returns {array} Places array
 */
export const searchPlaces = async (searchText, limit = 20) => {
  const places = await Place.find(
    { $text: { $search: searchText } },
    { score: { $meta: 'textScore' } } // Projection
  )
    .sort({ score: { $meta: 'textScore' } }) // Sort by relevance
    .limit(limit)
    .lean();

  return places;
};

/**
 * Search places by regex on specific field (address)
 * @param {RegExp} regex - Regex to search
 * @param {number} limit
 */
export const searchPlacesByRegex = async (regex, limit = 5) => {
  return await Place.find({ address: regex }).limit(limit).lean();
};

// ========== HELPER FUNCTIONS ==========

/**
 * Normalize status field để match với schema
 * @param {string} status - Raw status value
 * @returns {string} Normalized status
 */
const normalizeStatus = (status) => {
  if (!status) return 'Draft';

  const statusMap = {
    published: 'Published',
    draft: 'Draft',
    archived: 'Archived',
  };

  return statusMap[status.toLowerCase()] || status;
};

/**
 * Validate price range
 * @param {object} priceRange - { min, max }
 * @returns {boolean} Is valid
 */
export const validatePriceRange = (priceRange) => {
  if (!priceRange || typeof priceRange !== 'object') {
    return false;
  }

  const { min, max } = priceRange;

  if (typeof min !== 'number' || typeof max !== 'number') {
    return false;
  }

  if (min < 0 || max < 0 || min > max) {
    return false;
  }

  return true;
};

/**
 * Check if place exists
 * @param {string} placeId - Place ID
 * @returns {boolean} Exists
 */
export const placeExists = async (placeId) => {
  const count = await Place.countDocuments({ _id: placeId });
  return count > 0;
};
