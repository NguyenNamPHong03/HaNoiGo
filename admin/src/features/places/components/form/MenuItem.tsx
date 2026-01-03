import { Minus } from 'lucide-react';
import React from 'react';

interface MenuItemProps {
  item: {
    name: string;
    price: number;
    description: string;
    category: string;
  };
  index: number;
  onUpdate: (index: number, field: string, value: any) => void;
  onRemove: (index: number) => void;
}

export const MenuItem: React.FC<MenuItemProps> = ({ 
  item, 
  index, 
  onUpdate, 
  onRemove 
}) => {
  return (
    <div className="p-4 border border-gray-200 rounded-lg">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Tên món
          </label>
          <input
            type="text"
            value={item.name}
            onChange={(e) => onUpdate(index, 'name', e.target.value)}
            className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
            placeholder="Tên món ăn"
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Giá (₫)
          </label>
          <input
            type="number"
            value={item.price}
            onChange={(e) => onUpdate(index, 'price', parseInt(e.target.value) || 0)}
            onFocus={(e) => e.target.select()}
            className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
            placeholder="0"
            min="0"
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Loại món
          </label>
          <input
            type="text"
            value={item.category}
            onChange={(e) => onUpdate(index, 'category', e.target.value)}
            className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
            placeholder="Món chính, tráng miệng..."
          />
        </div>
        
        <div className="flex items-end">
          <button
            type="button"
            onClick={() => onRemove(index)}
            className="w-full p-2 bg-red-600 text-white rounded hover:bg-red-700 flex items-center justify-center gap-2"
          >
            <Minus size={16} />
            Xóa
          </button>
        </div>
      </div>
      
      <div className="mt-3">
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Mô tả món
        </label>
        <input
          type="text"
          value={item.description}
          onChange={(e) => onUpdate(index, 'description', e.target.value)}
          className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
          placeholder="Mô tả ngắn về món ăn..."
        />
      </div>
    </div>
  );
};
