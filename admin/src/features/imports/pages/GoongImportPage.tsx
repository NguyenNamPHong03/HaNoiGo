/**
 * @fileoverview Goong Import Main Page
 * @description Main page for importing places from Goong Maps API
 */

import React from 'react';
import { GoongImportForm } from '../components/GoongImportForm';
import { ImportStatsCard } from '../components/ImportStatsCard';
import { ImportSummary } from '../components/ImportSummary';
import { PredictionsTable } from '../components/PredictionsTable';
import {
    useGoongAutocomplete,
    useGoongImportSelected,
    useValidateGoongApiKey,
} from '../hooks/useGoongImport';
import type { GoongPredictionItem } from '../types/goongImport.types';

export default function GoongImportPage() {
  const [items, setItems] = React.useState<GoongPredictionItem[]>([]);
  const [selectedIds, setSelectedIds] = React.useState<Set<string>>(new Set());
  const [lastResult, setLastResult] = React.useState<any>(null);

  const autocomplete = useGoongAutocomplete();
  const importSelected = useGoongImportSelected();
  const validateKey = useValidateGoongApiKey();

  // Validate API key on mount
  React.useEffect(() => {
    validateKey.mutate();
  }, []);

  const handleSearch = async (payload: { input: string; location?: string; radius?: number }) => {
    setLastResult(null);
    setSelectedIds(new Set());

    try {
      const data = await autocomplete.mutateAsync(payload);
      setItems(data.items || []);
    } catch (error: any) {
      console.error('Autocomplete error:', error?.response?.data || error);
      setItems([]);
    }
  };

  const toggleItem = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const toggleAll = (checked: boolean) => {
    if (!checked) {
      setSelectedIds(new Set());
      return;
    }
    setSelectedIds(new Set(items.map((x) => x.goongPlaceId)));
  };

  const handleImport = async () => {
    const placeIds = Array.from(selectedIds);
    if (placeIds.length === 0) return;

    try {
      const result = await importSelected.mutateAsync({ placeIds });
      setLastResult(result);
      // Clear selections after successful import
      setSelectedIds(new Set());
    } catch (error) {
      console.error('Import error:', error);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Import Data</h1>
          <p className="mt-1 text-sm text-gray-600">
            Tự động import địa điểm từ Goong Maps API vào database
          </p>
        </div>

        {/* API Key Status */}
        {validateKey.data && (
          <div
            className={`inline-flex items-center rounded-full px-3 py-1 text-sm font-medium ${
              validateKey.data.valid
                ? 'bg-green-100 text-green-800'
                : 'bg-red-100 text-red-800'
            }`}
          >
            {validateKey.data.valid ? '✅ API Key Valid' : '❌ API Key Invalid'}
          </div>
        )}
      </div>

      {/* Stats Card */}
      <ImportStatsCard />

      {/* Search Form */}
      <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">🔍 Tìm kiếm địa điểm</h2>
        <GoongImportForm isLoading={autocomplete.isPending} onSearch={handleSearch} />
      </div>

      {/* Error Alert */}
      {autocomplete.isError && (
        <div className="rounded-lg bg-red-50 border border-red-200 p-4">
          <div className="flex items-start">
            <svg
              className="h-5 w-5 text-red-400 mt-0.5"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                fillRule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                clipRule="evenodd"
              />
            </svg>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">Lỗi tìm kiếm</h3>
              <p className="mt-1 text-sm text-red-700">
                Không thể lấy gợi ý từ Goong. Vui lòng kiểm tra:
              </p>
              <ul className="mt-2 text-sm text-red-700 list-disc list-inside">
                <li>Backend server đang chạy</li>
                <li>Goong API key hợp lệ trong .env</li>
                <li>Token admin hợp lệ</li>
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* Results Table */}
      {items.length > 0 && (
        <div className="space-y-4">
          <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm space-y-4">
            <h2 className="text-lg font-semibold text-gray-900">📋 Kết quả tìm kiếm</h2>
            <PredictionsTable
              items={items}
              selectedIds={selectedIds}
              onToggle={toggleItem}
              onToggleAll={toggleAll}
            />

            {/* Import Button */}
            <div className="flex items-center gap-3">
              <button
                onClick={handleImport}
                disabled={importSelected.isPending || selectedIds.size === 0}
                className="inline-flex items-center rounded-lg bg-indigo-600 px-6 py-3 text-sm font-medium text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {importSelected.isPending ? (
                  <>
                    <svg
                      className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      ></circle>
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      ></path>
                    </svg>
                    Đang import...
                  </>
                ) : (
                  <>
                    <svg
                      className="-ml-1 mr-2 h-5 w-5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"
                      />
                    </svg>
                    Import ({selectedIds.size}) địa điểm đã chọn
                  </>
                )}
              </button>

              <span className="text-sm text-gray-600">
                {selectedIds.size === 0
                  ? 'Chọn ít nhất 1 địa điểm để import'
                  : `${selectedIds.size} địa điểm được chọn`}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Import Error */}
      {importSelected.isError && (
        <div className="rounded-lg bg-red-50 border border-red-200 p-4">
          <div className="flex items-start">
            <svg
              className="h-5 w-5 text-red-400 mt-0.5"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                fillRule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                clipRule="evenodd"
              />
            </svg>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">Import thất bại</h3>
              <p className="mt-1 text-sm text-red-700">
                Vui lòng kiểm tra server logs để biết chi tiết lỗi.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Import Success Summary */}
      {lastResult && <ImportSummary result={lastResult} />}
    </div>
  );
}
