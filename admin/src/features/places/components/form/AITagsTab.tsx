import React from 'react';

interface AITagsTabProps {
  formData: any;
  aiTagsOptions: any;
  onToggleTag: (category: string, tag: string) => void;
}

export const AITagsTab: React.FC<AITagsTabProps> = ({
  formData,
  aiTagsOptions,
  onToggleTag
}) => {
  const categoryLabels: Record<string, string> = {
    space: '🏠 Không gian',
    mood: '😊 Tâm trạng',
    suitability: '👥 Phù hợp',
    crowdLevel: '👫 Mức độ đông đúc',
    music: '🎵 Âm nhạc',
    parking: '🚗 Đậu xe',
    specialFeatures: '✨ Tính năng đặc biệt'
  };

  return (
    <div className="space-y-8">
      <div className="text-center">
        <h3 className="text-lg font-medium text-gray-900 mb-2">AI Semantic Tags</h3>
        <p className="text-gray-600 mb-6">
          Chọn các tags để giúp AI hiểu rõ hơn về địa điểm này
        </p>
      </div>

      {Object.entries(aiTagsOptions).map(([category, options]) => (
        <div key={category}>
          <h4 className="text-md font-medium text-gray-800 mb-3">
            {categoryLabels[category] || category}
          </h4>
          <div className="flex flex-wrap gap-2">
            {(options as string[]).map((option: string) => (
              <button
                key={option}
                type="button"
                onClick={() => onToggleTag(category, option)}
                className={`px-3 py-2 rounded-full border text-sm transition-colors ${
                  formData.aiTags[category as keyof typeof formData.aiTags].includes(option)
                    ? 'bg-blue-600 text-white border-blue-600'
                    : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                }`}
              >
                {option}
              </button>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
};
