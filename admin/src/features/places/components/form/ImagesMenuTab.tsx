import { Plus } from 'lucide-react';
import React from 'react';
import { ImageUpload } from './ImageUpload';
import { MenuItem } from './MenuItem';

interface ImagesMenuTabProps {
  formData: any;
  errors: Record<string, string>;
  onImagesChange: (images: string[]) => void;
  onAddMenuItem: () => void;
  onUpdateMenuItem: (index: number, field: string, value: any) => void;
  onRemoveMenuItem: (index: number) => void;
}

export const ImagesMenuTab: React.FC<ImagesMenuTabProps> = ({
  formData,
  errors,
  onImagesChange,
  onAddMenuItem,
  onUpdateMenuItem,
  onRemoveMenuItem
}) => {
  return (
    <div className="space-y-8">
      <ImageUpload
        images={formData.images}
        onImagesChange={onImagesChange}
        error={errors.images}
        required={formData.status === 'Published'}
      />

      <div>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-medium text-gray-900">Menu (Tùy chọn)</h3>
          <button
            type="button"
            onClick={onAddMenuItem}
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center gap-2"
          >
            <Plus size={16} />
            Thêm món
          </button>
        </div>

        {formData.menu.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <p>Chưa có món nào trong menu</p>
            <p className="text-sm">Nhấn "Thêm món" để bắt đầu</p>
          </div>
        ) : (
          <div className="space-y-4">
            {formData.menu.map((item: any, index: number) => (
              <MenuItem
                key={index}
                item={item}
                index={index}
                onUpdate={onUpdateMenuItem}
                onRemove={onRemoveMenuItem}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
