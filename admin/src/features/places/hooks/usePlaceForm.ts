import { useEffect, useState } from 'react';
import { placesAPI } from '../../../services/api';
import type { OperatingHours } from '../types/place.types';

interface PlaceFormData {
  name: string;
  address: string;
  district: string;
  category: string;
  description: string;
  priceRange: { min: number; max: number };
  images: string[];
  menu: Array<{ name: string; price: number; description: string; category: string }>;
  aiTags: {
    space: string[];
    mood: string[];
    suitability: string[];
    crowdLevel: string[];
    music: string[];
    parking: string[];
    specialFeatures: string[];
  };
  coordinates?: { latitude: number; longitude: number };
  contact: { phone: string; website: string; phoneUnformatted?: string };
  operatingHours?: OperatingHours;
  status: string;
  
  // Google Places fields (read-only)
  source?: string;
  googlePlaceId?: string;
  priceDisplay?: string;
  openingHours?: Array<{ day: string; hours: string }>;
  reviewsDistribution?: {
    oneStar: number;
    twoStar: number;
    threeStar: number;
    fourStar: number;
    fiveStar: number;
  };
  totalReviews?: number;
  averageRating?: number;
  additionalInfo?: Record<string, any>;
  googleData?: Record<string, any>;
}

export const usePlaceForm = (placeId?: string) => {
  const [formData, setFormData] = useState<PlaceFormData>({
    name: '',
    address: '',
    district: '',
    category: '',
    description: '',
    priceRange: { min: 0, max: 0 },
    images: [],
    menu: [],
    aiTags: {
      space: [],
      mood: [],
      suitability: [],
      crowdLevel: [],
      music: [],
      parking: [],
      specialFeatures: []
    },
    contact: { phone: '', website: '' },
    operatingHours: {
      monday: { open: '', close: '' },
      tuesday: { open: '', close: '' },
      wednesday: { open: '', close: '' },
      thursday: { open: '', close: '' },
      friday: { open: '', close: '' },
      saturday: { open: '', close: '' },
      sunday: { open: '', close: '' }
    },
    status: 'Draft'
  });

  const [districts, setDistricts] = useState<string[]>([]);
  const [aiTagsOptions, setAiTagsOptions] = useState<any>({});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadInitialData();
  }, [placeId]);

  const loadInitialData = async () => {
    try {
      const [districtsRes, aiTagsRes] = await Promise.all([
        placesAPI.getDistricts(),
        placesAPI.getAiTagsOptions()
      ]);
      
      setDistricts(districtsRes.data);
      setAiTagsOptions(aiTagsRes.data);

      if (placeId) {
        const placeRes = await placesAPI.getById(placeId);
        const place = placeRes.data;
        
        const priceRange = place.priceRange || {};
        const validPriceRange = {
          min: Number(priceRange.min) >= 0 ? Number(priceRange.min) : 0,
          max: Number(priceRange.max) >= 0 ? Number(priceRange.max) : 0
        };
        
        setFormData({
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
          operatingHours: place.operatingHours || {
            monday: { open: '', close: '' },
            tuesday: { open: '', close: '' },
            wednesday: { open: '', close: '' },
            thursday: { open: '', close: '' },
            friday: { open: '', close: '' },
            saturday: { open: '', close: '' },
            sunday: { open: '', close: '' }
          },
          status: place.status || 'Draft',
          
          // Google Places fields (read-only)
          source: place.source,
          googlePlaceId: place.googlePlaceId,
          priceDisplay: place.priceDisplay,
          openingHours: place.openingHours,
          reviewsDistribution: place.reviewsDistribution,
          totalReviews: place.totalReviews,
          averageRating: place.averageRating,
          additionalInfo: place.additionalInfo,
          googleData: place.googleData
        });
      }
    } catch (error) {
      console.error('Error loading initial data:', error);
    }
  };

  const updateFormData = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const updateNestedFormData = (parentField: string, childField: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [parentField]: {
        ...prev[parentField as keyof PlaceFormData] as any,
        [childField]: value
      }
    }));
  };

  const addMenuItem = () => {
    setFormData(prev => ({
      ...prev,
      menu: [...prev.menu, { name: '', price: 0, description: '', category: '' }]
    }));
  };

  const removeMenuItem = (index: number) => {
    setFormData(prev => ({
      ...prev,
      menu: prev.menu.filter((_, i) => i !== index)
    }));
  };

  const updateMenuItem = (index: number, field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      menu: prev.menu.map((item, i) => 
        i === index ? { ...item, [field]: value } : item
      )
    }));
  };

  const toggleAiTag = (category: string, tag: string) => {
    setFormData(prev => ({
      ...prev,
      aiTags: {
        ...prev.aiTags,
        [category]: prev.aiTags[category as keyof typeof prev.aiTags].includes(tag)
          ? prev.aiTags[category as keyof typeof prev.aiTags].filter(t => t !== tag)
          : [...prev.aiTags[category as keyof typeof prev.aiTags], tag]
      }
    }));
  };

  const updateOperatingHours = (day: string, field: 'open' | 'close', value: string) => {
    setFormData(prev => ({
      ...prev,
      operatingHours: {
        ...prev.operatingHours,
        [day]: {
          ...(prev.operatingHours?.[day as keyof OperatingHours] || { open: '', close: '' }),
          [field]: value
        }
      }
    }));
  };

  return {
    formData,
    districts,
    aiTagsOptions,
    loading,
    setLoading,
    updateFormData,
    updateNestedFormData,
    addMenuItem,
    removeMenuItem,
    updateMenuItem,
    toggleAiTag,
    updateOperatingHours,
    setFormData
  };
};
