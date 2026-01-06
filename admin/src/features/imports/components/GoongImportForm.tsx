/**
 * @fileoverview Goong Import Search Form
 * @description Form component for searching places via Goong API
 */

import React from 'react';

type Props = {
  defaultLocation?: string;
  defaultRadius?: number;
  isLoading?: boolean;
  onSearch: (payload: { input: string; location?: string; radius?: number }) => void;
};

export const GoongImportForm: React.FC<Props> = ({
  defaultLocation = '21.0278,105.8342',
  defaultRadius = 5000,
  isLoading,
  onSearch,
}) => {
  const [input, setInput] = React.useState('');
  const [location, setLocation] = React.useState(defaultLocation);
  const [radius, setRadius] = React.useState<number>(defaultRadius);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = input.trim();
    if (!trimmed) return;
    onSearch({ input: trimmed, location: location?.trim() || undefined, radius });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <div className="md:col-span-1">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Từ khóa tìm kiếm <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            placeholder="VD: cafe học bài, bún bò huế, trà sữa..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Location (lat,lng)
          </label>
          <input
            type="text"
            className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            placeholder="21.0278,105.8342"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
          />
          <p className="mt-1 text-xs text-gray-500">Mặc định: Hà Nội</p>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Bán kính (meters)
          </label>
          <input
            type="number"
            className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            value={radius}
            min={100}
            step={100}
            onChange={(e) => setRadius(Number(e.target.value || 0))}
          />
          <p className="mt-1 text-xs text-gray-500">Mặc định: 5000m</p>
        </div>
      </div>

      <button
        type="submit"
        disabled={isLoading}
        className="inline-flex items-center rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-60 disabled:cursor-not-allowed"
      >
        {isLoading ? (
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
            Đang tìm kiếm...
          </>
        ) : (
          <>
            <svg
              className="-ml-1 mr-2 h-4 w-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
            Tìm gợi ý từ Goong
          </>
        )}
      </button>
    </form>
  );
};
