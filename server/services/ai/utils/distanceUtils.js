/**
 * Distance Utilities - Haversine distance calculation
 * Mục đích: Tính khoảng cách giữa 2 điểm GPS và sort places theo khoảng cách
 */

/**
 * Calculate distance between two GPS coordinates using Haversine formula
 * @param {number} lat1 - Latitude of point 1
 * @param {number} lon1 - Longitude of point 1
 * @param {number} lat2 - Latitude of point 2
 * @param {number} lon2 - Longitude of point 2
 * @returns {number} Distance in kilometers
 */
export function haversineKm(lat1, lon1, lat2, lon2) {
  const R = 6371; // Earth's radius in kilometers
  const toRad = (degrees) => (degrees * Math.PI) / 180;

  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);

  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;

  const c = 2 * Math.asin(Math.sqrt(a));

  return R * c;
}

/**
 * Sort places by distance from user location (nearest first)
 * @param {Array} places - Array of place objects
 * @param {number} userLat - User latitude
 * @param {number} userLon - User longitude
 * @returns {Array} Sorted places with distanceKm property
 */
export function sortPlacesByDistance(places, userLat, userLon) {
  if (!Array.isArray(places) || places.length === 0) {
    return [];
  }

  if (typeof userLat !== 'number' || typeof userLon !== 'number') {
    return places;
  }

  return places
    .map((place) => {
      // Handle different coordinate formats
      // MongoDB GeoJSON: { location: { coordinates: [lng, lat] } }
      // Or direct: { lat, lng } / { latitude, longitude }
      let placeLat, placeLon;

      if (place.location?.coordinates) {
        // GeoJSON format: [longitude, latitude]
        [placeLon, placeLat] = place.location.coordinates;
      } else if (place.location?.lat && place.location?.lng) {
        placeLat = place.location.lat;
        placeLon = place.location.lng;
      } else if (place.lat && place.lng) {
        placeLat = place.lat;
        placeLon = place.lng;
      } else if (place.latitude && place.longitude) {
        placeLat = place.latitude;
        placeLon = place.longitude;
      }

      // If coordinates not found, set distance to null (sort to end)
      if (typeof placeLat !== 'number' || typeof placeLon !== 'number') {
        return {
          ...place,
          distanceKm: null,
        };
      }

      const distance = haversineKm(userLat, userLon, placeLat, placeLon);

      return {
        ...place,
        distanceKm: Math.round(distance * 100) / 100, // Round to 2 decimals
      };
    })
    .sort((a, b) => {
      // Sort: null distances go to end, then by distance ascending
      if (a.distanceKm == null && b.distanceKm == null) return 0;
      if (a.distanceKm == null) return 1;
      if (b.distanceKm == null) return -1;
      return a.distanceKm - b.distanceKm;
    });
}

/**
 * Check if query is generic food query (for nearMe fallback)
 * @param {string} query 
 * @returns {boolean}
 */
export function isGenericFoodQuery(query) {
  if (!query || typeof query !== 'string') return false;

  const normalized = query.toLowerCase().trim();
  const genericTerms = [
    'quán ăn',
    'ăn uống',
    'nhà hàng',
    'đồ ăn',
    'quán',
    'food',
    'restaurant',
    'quán ngon',
    'chỗ ăn',
  ];

  return genericTerms.some((term) => normalized === term || normalized.includes(term));
}

export default {
  haversineKm,
  sortPlacesByDistance,
  isGenericFoodQuery,
};
