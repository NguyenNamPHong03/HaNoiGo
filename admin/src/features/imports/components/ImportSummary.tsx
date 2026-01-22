/**
 * @fileoverview Import Result Summary
 * @description Display import operation results
 */

import React from 'react';
import type { ImportResponse } from '../types/goongImport.types';

export const ImportSummary: React.FC<{ result: ImportResponse }> = ({ result }) => {
  const { data } = result;

  return (
    <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900">Kết quả Import</h3>
        <span className="inline-flex items-center rounded-full bg-green-100 px-3 py-1 text-sm font-medium text-green-800">
          ✅ {result.message}
        </span>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-5">
        <div className="rounded-lg bg-gray-50 p-4 text-center">
          <div className="text-2xl font-bold text-gray-900">{data.total}</div>
          <div className="text-xs text-gray-600 mt-1">Tổng số</div>
        </div>

        <div className="rounded-lg bg-green-50 p-4 text-center">
          <div className="text-2xl font-bold text-green-600">{data.imported}</div>
          <div className="text-xs text-green-700 mt-1">✅ Imported</div>
        </div>

        <div className="rounded-lg bg-blue-50 p-4 text-center">
          <div className="text-2xl font-bold text-blue-600">{data.updated}</div>
          <div className="text-xs text-blue-700 mt-1">♻️ Updated</div>
        </div>

        <div className="rounded-lg bg-yellow-50 p-4 text-center">
          <div className="text-2xl font-bold text-yellow-600">{data.skipped}</div>
          <div className="text-xs text-yellow-700 mt-1">⏭️ Skipped</div>
        </div>

        <div className="rounded-lg bg-red-50 p-4 text-center">
          <div className="text-2xl font-bold text-red-600">{data.errors?.length || 0}</div>
          <div className="text-xs text-red-700 mt-1">❌ Errors</div>
        </div>
      </div>

      {/* Success List */}
      {data.places && data.places.length > 0 && (
        <div className="rounded-lg bg-green-50 p-4">
          <div className="text-sm font-medium text-green-800 mb-2">
            ✅ Địa điểm đã import thành công ({data.places.length})
          </div>
          <ul className="text-xs text-green-700 space-y-1 max-h-32 overflow-y-auto">
            {data.places.map((place) => (
              <li key={place._id} className="flex items-start gap-2">
                <span className="text-green-500">•</span>
                <span className="flex-1">
                  <strong>{place.name}</strong> - {place.district} ({place.category})
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Error List */}
      {data.errors && data.errors.length > 0 && (
        <div className="rounded-lg bg-red-50 p-4">
          <div className="text-sm font-medium text-red-800 mb-2">
            ⚠️ Danh sách lỗi ({data.errors.length})
          </div>
          <ul className="text-xs text-red-700 space-y-1 max-h-32 overflow-y-auto">
            {data.errors.slice(0, 10).map((error, idx) => {
              // ✅ Extract placeId string (handle both string and object)
              const placeIdStr = typeof error.placeId === 'string' 
                ? error.placeId 
                : error.placeId?.placeId || error.placeId?.url || error.placeId?.title || JSON.stringify(error.placeId).substring(0, 50);
              
              return (
                <li key={`error-${idx}`} className="flex items-start gap-2">
                  <span className="text-red-500">•</span>
                  <span className="flex-1">
                    <code className="bg-red-100 px-1 rounded text-xs">
                      {placeIdStr.length > 50 ? placeIdStr.substring(0, 50) + '...' : placeIdStr}
                    </code>
                    : {error.message}
                  </span>
                </li>
              );
            })}
            {data.errors.length > 10 && (
              <li className="text-red-600 italic">...và {data.errors.length - 10} lỗi khác</li>
            )}
          </ul>
        </div>
      )}
    </div>
  );
};
