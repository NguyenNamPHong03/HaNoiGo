/**
 * @fileoverview Goong Import API
 * @description API functions for Goong Auto Import feature
 */

import api from '../../../services/api';
import type {
    AutocompleteParams,
    AutocompleteResponse,
    ImportRequest,
    ImportResponse,
    ImportStats,
} from '../types/goongImport.types';

export const goongImportAPI = {
  /**
   * @desc Get place suggestions from Goong (autocomplete)
   * @route GET /admin/import/goong/autocomplete
   */
  autocomplete: async (params: AutocompleteParams): Promise<AutocompleteResponse> => {
    const response = await api.get('/admin/import/goong/autocomplete', { params });
    return response.data;
  },

  /**
   * @desc Import selected places from Goong to MongoDB
   * @route POST /admin/import/goong
   */
  importSelected: async (payload: ImportRequest): Promise<ImportResponse> => {
    const response = await api.post('/admin/import/goong', payload);
    return response.data;
  },

  /**
   * @desc Get import statistics
   * @route GET /admin/import/stats
   */
  getStats: async (): Promise<ImportStats> => {
    const response = await api.get('/admin/import/stats');
    return response.data;
  },

  /**
   * @desc Validate Goong API key
   * @route GET /admin/import/goong/validate-api-key
   */
  validateApiKey: async (): Promise<{ success: boolean; valid: boolean; message: string }> => {
    const response = await api.get('/admin/import/goong/validate-api-key');
    return response.data;
  },
};
