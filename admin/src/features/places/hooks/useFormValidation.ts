import { useState } from 'react';

interface ValidationErrors {
  [key: string]: string;
}

export const useFormValidation = (formData: any) => {
  const [errors, setErrors] = useState<ValidationErrors>({});

  const validateForm = (): boolean => {
    const newErrors: ValidationErrors = {};

    // Basic validation
    if (!formData.name.trim()) newErrors.name = 'Tên địa điểm là bắt buộc';
    if (!formData.address.trim()) newErrors.address = 'Địa chỉ là bắt buộc';
    if (!formData.district) newErrors.district = 'Quận là bắt buộc';
    if (!formData.category) newErrors.category = 'Danh mục là bắt buộc';
    if (!formData.description.trim()) newErrors.description = 'Mô tả là bắt buộc';
    
    // Price validation
    const minPrice = Number(formData.priceRange.min);
    const maxPrice = Number(formData.priceRange.max);
    
    if (isNaN(minPrice) || minPrice < 0) newErrors.minPrice = 'Giá tối thiểu phải là số >= 0';
    if (isNaN(maxPrice) || maxPrice < 0) newErrors.maxPrice = 'Giá tối đa phải là số >= 0';
    if (!isNaN(minPrice) && !isNaN(maxPrice) && maxPrice < minPrice) {
      newErrors.maxPrice = 'Giá tối đa phải >= giá tối thiểu';
    }

    // Phone validation
    const phone = formData.contact.phone?.trim();
    if (phone && !/^[\d\s\-\+\(\)]+$/.test(phone)) {
      newErrors.phone = 'Số điện thoại không hợp lệ';
    }

    // Website validation
    const website = formData.contact.website?.trim();
    if (website && !website.match(/^https?:\/\/.+/)) {
      newErrors.website = 'Website phải bắt đầu bằng http:// hoặc https://';
    }

    // Menu validation
    formData.menu.forEach((item: any, index: number) => {
      if (item.name && !item.name.trim()) {
        newErrors[`menu_${index}_name`] = `Tên món ${index + 1} không được để trống`;
      }
      if (item.name && (isNaN(Number(item.price)) || Number(item.price) < 0)) {
        newErrors[`menu_${index}_price`] = `Giá món ${index + 1} phải là số >= 0`;
      }
    });

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const clearError = (field: string) => {
    setErrors(prev => {
      const newErrors = { ...prev };
      delete newErrors[field];
      return newErrors;
    });
  };

  return { errors, setErrors, validateForm, clearError };
};
