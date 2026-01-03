import React from 'react';
import { FormField } from './FormField';

interface BasicInfoTabProps {
  formData: any;
  districts: string[];
  errors: Record<string, string>;
  onUpdate: (field: string, value: any) => void;
  onUpdateNested: (parent: string, child: string, value: any) => void;
}

export const BasicInfoTab: React.FC<BasicInfoTabProps> = ({
  formData,
  districts,
  errors,
  onUpdate,
  onUpdateNested
}) => {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <FormField label="Tên địa điểm" required error={errors.name}>
          <input
            type="text"
            value={formData.name}
            onChange={(e) => onUpdate('name', e.target.value)}
            className={`w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 ${
              errors.name ? 'border-red-500' : 'border-gray-300'
            }`}
            placeholder="Nhập tên địa điểm"
          />
        </FormField>

        <FormField label="Danh mục" required error={errors.category}>
          <select
            value={formData.category}
            onChange={(e) => onUpdate('category', e.target.value)}
            className={`w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 ${
              errors.category ? 'border-red-500' : 'border-gray-300'
            }`}
          >
            <option value="">Chọn danh mục</option>
            <option value="Ăn uống">Ăn uống</option>
            <option value="Vui chơi">Vui chơi</option>
            <option value="Mua sắm">Mua sắm</option>
            <option value="Dịch vụ">Dịch vụ</option>
            <option value="Khác">Khác</option>
          </select>
        </FormField>
      </div>

      <FormField label="Địa chỉ" required error={errors.address}>
        <input
          type="text"
          value={formData.address}
          onChange={(e) => onUpdate('address', e.target.value)}
          className={`w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 ${
            errors.address ? 'border-red-500' : 'border-gray-300'
          }`}
          placeholder="Nhập địa chỉ đầy đủ"
        />
      </FormField>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <FormField label="Quận" required error={errors.district}>
          <select
            value={formData.district}
            onChange={(e) => onUpdate('district', e.target.value)}
            className={`w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 ${
              errors.district ? 'border-red-500' : 'border-gray-300'
            }`}
          >
            <option value="">Chọn quận</option>
            {districts.map(district => (
              <option key={district} value={district}>{district}</option>
            ))}
          </select>
        </FormField>

        <FormField label="Trạng thái">
          <select
            value={formData.status}
            onChange={(e) => onUpdate('status', e.target.value)}
            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          >
            <option value="Draft">Bản nháp</option>
            <option value="Published">Đã xuất bản</option>
            <option value="Archived">Lưu trữ</option>
          </select>
        </FormField>
      </div>

      <FormField label="Mô tả" required error={errors.description}>
        <textarea
          value={formData.description}
          onChange={(e) => onUpdate('description', e.target.value)}
          rows={4}
          className={`w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 ${
            errors.description ? 'border-red-500' : 'border-gray-300'
          }`}
          placeholder="Mô tả về địa điểm, điều đặc biệt..."
        />
      </FormField>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <FormField label="Giá tối thiểu (₫)" required error={errors.minPrice}>
          <input
            type="number"
            value={formData.priceRange.min}
            onChange={(e) => onUpdateNested('priceRange', 'min', parseInt(e.target.value) || 0)}
            onFocus={(e) => e.target.select()}
            className={`w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none ${
              errors.minPrice ? 'border-red-500' : 'border-gray-300'
            }`}
            placeholder="0"
            min="0"
          />
        </FormField>

        <FormField label="Giá tối đa (₫)" required error={errors.maxPrice}>
          <input
            type="number"
            value={formData.priceRange.max}
            onChange={(e) => onUpdateNested('priceRange', 'max', parseInt(e.target.value) || 0)}
            onFocus={(e) => e.target.select()}
            className={`w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none ${
              errors.maxPrice ? 'border-red-500' : 'border-gray-300'
            }`}
            placeholder="0"
            min="0"
          />
        </FormField>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <FormField label="Số điện thoại">
          <input
            type="text"
            value={formData.contact.phone}
            onChange={(e) => onUpdateNested('contact', 'phone', e.target.value)}
            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            placeholder="0xx xxx xxxx"
          />
        </FormField>

        <FormField label="Website">
          <input
            type="url"
            value={formData.contact.website}
            onChange={(e) => onUpdateNested('contact', 'website', e.target.value)}
            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            placeholder="https://example.com"
          />
        </FormField>
      </div>
    </div>
  );
};
