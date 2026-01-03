import React from 'react';

interface PreviewTabProps {
  formData: any;
}

export const PreviewTab: React.FC<PreviewTabProps> = ({ formData }) => {
  const generateRAGPreview = () => {
    const tags = [
      ...formData.aiTags.mood,
      ...formData.aiTags.space,
      ...formData.aiTags.suitability
    ].join(', ');

    return `**${formData.name}** - ${formData.district}

**Địa chỉ:** ${formData.address}
**Danh mục:** ${formData.category}
**Giá:** ${formData.priceRange.min.toLocaleString()}₫ - ${formData.priceRange.max.toLocaleString()}₫

**Không gian & Tâm trạng:** ${tags || 'Chưa có tags'}

**Mô tả:** ${formData.description}

${formData.menu.length > 0 ? `**Menu nổi bật:**\n${formData.menu.slice(0, 3).map((item: any) => `- ${item.name}: ${item.price.toLocaleString()}₫`).join('\n')}` : ''}`;
  };

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h3 className="text-lg font-medium text-gray-900 mb-2">Preview cho RAG</h3>
        <p className="text-gray-600 mb-6">
          Đây là cách AI sẽ hiểu về địa điểm này
        </p>
      </div>

      <div className="bg-gray-50 p-6 rounded-lg">
        <div className="prose max-w-none">
          <div className="whitespace-pre-line text-gray-800">
            {generateRAGPreview()}
          </div>
        </div>
      </div>

      <div className="bg-blue-50 p-4 rounded-lg">
        <h4 className="font-medium text-blue-900 mb-2">💡 Gợi ý cải thiện</h4>
        <ul className="text-sm text-blue-800 space-y-1">
          {formData.aiTags.mood.length === 0 && (
            <li>• Thêm tags "Tâm trạng" để AI hiểu được vibe của địa điểm</li>
          )}
          {formData.aiTags.space.length === 0 && (
            <li>• Thêm tags "Không gian" để mô tả môi trường</li>
          )}
          {formData.aiTags.suitability.length === 0 && (
            <li>• Thêm tags "Phù hợp" để biết địa điểm này dành cho ai</li>
          )}
          {formData.images.length === 0 && (
            <li>• Thêm hình ảnh để tăng tính hấp dẫn</li>
          )}
          {formData.description.length < 100 && (
            <li>• Mô tả dài hơn sẽ giúp AI đưa ra gợi ý chính xác hơn</li>
          )}
        </ul>
      </div>
    </div>
  );
};
