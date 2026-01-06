/**
 * @fileoverview Goong Import React Query Hooks
 * @description Custom hooks for Goong Import API with React Query
 */

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { goongImportAPI } from '../api/goongImport.api';
import type { AutocompleteParams, ImportRequest } from '../types/goongImport.types';

/**
 * @desc Hook for Goong autocomplete
 * Uses mutation because it's triggered by user action (not auto-fetch)
 */
export const useGoongAutocomplete = () => {
  return useMutation({
    mutationFn: (params: AutocompleteParams) => goongImportAPI.autocomplete(params),
  });
};

/**
 * @desc Hook for importing selected places
 */
export const useGoongImportSelected = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: ImportRequest) => goongImportAPI.importSelected(payload),
    onSuccess: () => {
      // Invalidate stats query to refresh after import
      queryClient.invalidateQueries({ queryKey: ['goong-import-stats'] });
      // Invalidate places list if user navigates to Places page
      queryClient.invalidateQueries({ queryKey: ['places'] });
    },
  });
};

/**
 * @desc Hook for fetching import statistics
 */
export const useGoongImportStats = () => {
  return useQuery({
    queryKey: ['goong-import-stats'],
    queryFn: () => goongImportAPI.getStats(),
    staleTime: 30 * 1000, // 30 seconds
  });
};

/**
 * @desc Hook for validating Goong API key
 */
export const useValidateGoongApiKey = () => {
  return useMutation({
    mutationFn: () => goongImportAPI.validateApiKey(),
  });
};
