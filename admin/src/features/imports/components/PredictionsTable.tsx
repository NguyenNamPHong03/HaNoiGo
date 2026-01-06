/**
 * @fileoverview Predictions Table with Checkboxes
 * @description Table showing Goong autocomplete results with selection
 */

import React from 'react';
import type { GoongPredictionItem } from '../types/goongImport.types';

type Props = {
  items: GoongPredictionItem[];
  selectedIds: Set<string>;
  onToggle: (id: string) => void;
  onToggleAll: (checked: boolean) => void;
};

export const PredictionsTable: React.FC<Props> = ({
  items,
  selectedIds,
  onToggle,
  onToggleAll,
}) => {
  const allChecked = items.length > 0 && items.every((x) => selectedIds.has(x.goongPlaceId));
  const someChecked = items.some((x) => selectedIds.has(x.goongPlaceId));

  if (items.length === 0) {
    return (
      <div className="text-center py-12 bg-gray-50 rounded-lg border border-gray-200">
        <svg
          className="mx-auto h-12 w-12 text-gray-400"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M12 12h.01M12 12h.01M12 12h.01M12 12h.01M12 12h.01"
          />
        </svg>
        <p className="mt-2 text-sm text-gray-500">Không tìm thấy kết quả nào</p>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm">
      {/* Header with Select All */}
      <div className="flex items-center justify-between border-b border-gray-200 bg-gray-50 px-4 py-3">
        <div className="flex items-center gap-3">
          <input
            type="checkbox"
            checked={allChecked}
            ref={(el) => {
              if (el) el.indeterminate = !allChecked && someChecked;
            }}
            onChange={(e) => onToggleAll(e.target.checked)}
            className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
          />
          <span className="text-sm font-medium text-gray-700">
            Chọn tất cả ({selectedIds.size}/{items.length})
          </span>
        </div>
        <span className="text-xs text-gray-500">{items.length} địa điểm tìm thấy</span>
      </div>

      {/* List */}
      <div className="divide-y divide-gray-200 max-h-96 overflow-y-auto">
        {items.map((item) => (
          <label
            key={item.goongPlaceId}
            className="flex cursor-pointer items-start gap-3 px-4 py-3 hover:bg-gray-50 transition-colors"
          >
            <input
              type="checkbox"
              checked={selectedIds.has(item.goongPlaceId)}
              onChange={() => onToggle(item.goongPlaceId)}
              className="mt-1 h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
            />
            <div className="min-w-0 flex-1">
              <div className="font-medium text-gray-900 truncate">{item.name}</div>
              {item.addressHint && (
                <div className="text-sm text-gray-600 truncate mt-1">{item.addressHint}</div>
              )}
              <div className="text-xs text-gray-400 truncate mt-1 font-mono">
                ID: {item.goongPlaceId}
              </div>
            </div>
          </label>
        ))}
      </div>
    </div>
  );
};
