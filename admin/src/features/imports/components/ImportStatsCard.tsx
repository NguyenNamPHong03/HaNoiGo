/**
 * @fileoverview Import Statistics Card
 * @description Display overall import statistics
 */

import React from 'react';
import { useGoongImportStats } from '../hooks/useGoongImport';

export const ImportStatsCard: React.FC = () => {
  const { data, isLoading, isError } = useGoongImportStats();

  if (isLoading) {
    return (
      <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
        <div className="animate-pulse space-y-4">
          <div className="h-4 bg-gray-200 rounded w-1/3"></div>
          <div className="grid grid-cols-2 gap-4 md:grid-cols-5">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-20 bg-gray-100 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (isError || !data) {
    return null;
  }

  const stats = data.data;

  return (
    <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm space-y-4">
      <h3 className="text-lg font-semibold text-gray-900">📊 Thống kê Database</h3>

      <div className="grid grid-cols-2 gap-4 md:grid-cols-5">
        <div className="rounded-lg bg-indigo-50 p-4 text-center">
          <div className="text-2xl font-bold text-indigo-600">{stats.total}</div>
          <div className="text-xs text-indigo-700 mt-1">Tổng địa điểm</div>
        </div>

        <div className="rounded-lg bg-purple-50 p-4 text-center">
          <div className="text-2xl font-bold text-purple-600">{stats.fromGoong}</div>
          <div className="text-xs text-purple-700 mt-1">Từ Goong</div>
        </div>

        <div className="rounded-lg bg-blue-50 p-4 text-center">
          <div className="text-2xl font-bold text-blue-600">{stats.manual}</div>
          <div className="text-xs text-blue-700 mt-1">Thủ công</div>
        </div>

        <div className="rounded-lg bg-orange-50 p-4 text-center">
          <div className="text-2xl font-bold text-orange-600">{stats.needsEnrich}</div>
          <div className="text-xs text-orange-700 mt-1">Cần AI enrich</div>
        </div>

        <div className="rounded-lg bg-green-50 p-4 text-center">
          <div className="text-2xl font-bold text-green-600">{stats.enriched}</div>
          <div className="text-xs text-green-700 mt-1">Đã enriched</div>
        </div>
      </div>
    </div>
  );
};
