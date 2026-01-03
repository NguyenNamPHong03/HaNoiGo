// Map form data to API payload
import type { PlaceFormData } from '../types/place.types';

export const normalizePlacePayload = (formData: PlaceFormData) => {
  // Validate priceRange
  const minPrice = Number(formData.priceRange?.min);
  const maxPrice = Number(formData.priceRange?.max);

  if (isNaN(minPrice) || isNaN(maxPrice) || minPrice < 0 || maxPrice < 0) {
    throw new Error('Invalid price range');
  }

  if (maxPrice < minPrice) {
    throw new Error('Max price must be >= min price');
  }

  // Normalize status
  const normalizeStatus = (s: string) => {
    const x = (s || '').toLowerCase();
    if (x === 'published' || x === 'xuất bản') return 'published';
    if (x === 'draft' || x === 'bản nháp') return 'draft';
    return 'draft';
  };

  // Build payload matching backend schema exactly
  const payload: any = {
    name: formData.name.trim(),
    address: formData.address.trim(),
    district: formData.district,
    category: formData.category,
    description: formData.description.trim(),
    priceRange: {
      min: minPrice,
      max: maxPrice
    },
    images: formData.images || [],
    menu: formData.menu.map(item => ({
      name: item.name.trim(),
      price: Number(item.price) || 0,
      description: item.description?.trim() || '',
      category: item.category?.trim() || 'Khác'
    })),
    aiTags: {
      space: formData.aiTags.space || [],
      mood: formData.aiTags.mood || [],
      suitability: formData.aiTags.suitability || [],
      crowdLevel: formData.aiTags.crowdLevel || [],
      music: formData.aiTags.music || [],
      parking: formData.aiTags.parking || [],
      specialFeatures: formData.aiTags.specialFeatures || []
    },
    phone: formData.contact.phone?.trim() || '',
    website: formData.contact.website?.trim() || '',
    status: normalizeStatus(formData.status),
    isActive: true,
    featured: false
  };

  // Add coordinates if valid
  if (formData.coordinates?.latitude && formData.coordinates?.longitude) {
    const lat = Number(formData.coordinates.latitude);
    const lng = Number(formData.coordinates.longitude);
    if (!isNaN(lat) && !isNaN(lng)) {
      payload.coordinates = { latitude: lat, longitude: lng };
    }
  }

  return payload;
};

// Map API response to form default values
export const mapPlaceToFormData = (place: any): PlaceFormData => {
  const priceRange = place.priceRange || {};
  const validPriceRange = {
    min: Number(priceRange.min) >= 0 ? Number(priceRange.min) : 0,
    max: Number(priceRange.max) >= 0 ? Number(priceRange.max) : 0
  };

  return {
    name: place.name || '',
    address: place.address || '',
    district: place.district || '',
    category: place.category || '',
    description: place.description || '',
    priceRange: validPriceRange,
    images: place.images || [],
    menu: place.menu || [],
    aiTags: place.aiTags || {
      space: [],
      mood: [],
      suitability: [],
      crowdLevel: [],
      music: [],
      parking: [],
      specialFeatures: []
    },
    contact: place.contact || { phone: '', website: '' },
    status: place.status || 'Draft'
  };
};
