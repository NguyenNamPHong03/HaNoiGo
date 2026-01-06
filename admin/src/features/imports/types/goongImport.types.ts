/**
 * @fileoverview Goong Import Types
 * @description TypeScript types for Goong Auto Import feature
 */

export type GoongPredictionItem = {
  goongPlaceId: string;
  name: string;
  addressHint?: string;
};

export type AutocompleteParams = {
  input: string;
  location?: string; // "21.0278,105.8342"
  radius?: number;   // 5000
};

export type AutocompleteResponse = {
  success: boolean;
  count: number;
  items: GoongPredictionItem[];
};

export type ImportRequest = {
  placeIds: string[];
};

export type ImportErrorItem = {
  placeId: string;
  message: string;
};

export type ImportedPlace = {
  _id: string;
  name: string;
  address: string;
  district: string;
  category: string;
};

export type ImportResponse = {
  success: boolean;
  message: string;
  data: {
    total: number;
    imported: number;
    updated: number;
    skipped: number;
    success: number;
    errors: ImportErrorItem[];
    places: ImportedPlace[];
  };
};

export type ImportStats = {
  success: boolean;
  data: {
    total: number;
    fromGoong: number;
    manual: number;
    needsEnrich: number;
    enriched: number;
  };
};
