import { ArrowLeft, Save } from 'lucide-react';
import React, { useState } from 'react';
import { placesAPI } from '../../../services/api';
import { AITagsTab } from '../components/form/AITagsTab';
import { BasicInfoTab } from '../components/form/BasicInfoTab';
import { ImagesMenuTab } from '../components/form/ImagesMenuTab';
import { OperatingHoursTab } from '../components/form/OperatingHoursTab';
import { PreviewTab } from '../components/form/PreviewTab';
import { useFormValidation } from '../hooks/useFormValidation';
import { usePlaceForm } from '../hooks/usePlaceForm';

interface PlaceFormProps {
  placeId?: string;
  onBack: () => void;
  onSave: (place: any) => void;
}

const PlaceForm: React.FC<PlaceFormProps> = ({ placeId, onBack, onSave }) => {
  const [activeTab, setActiveTab] = useState(0);
  
  const {
    formData,
    districts,
    aiTagsOptions,
    loading,
    setLoading,
    updateFormData,
    updateNestedFormData,
    addMenuItem,
    removeMenuItem,
    updateMenuItem,
    toggleAiTag,
    updateOperatingHours
  } = usePlaceForm(placeId);

  const { errors, setErrors, validateForm, clearError } = useFormValidation(formData);

  const tabs = [
    { id: 0, name: 'Thông tin cơ bản', icon: '📝' },
    { id: 1, name: 'Hình ảnh & Menu', icon: '🖼️' },
    { id: 2, name: 'Giờ mở cửa', icon: '🕒' },
    { id: 3, name: 'AI Tags', icon: '🤖' },
    { id: 4, name: 'Xem trước', icon: '👁️' }
  ];

  const canPublish = () => {
    return formData.images && formData.images.length > 0;
  };

  const handleFormDataUpdate = (field: string, value: any) => {
    updateFormData(field, value);
    clearError(field);
  };

  const handleSubmit = async (status?: string) => {
    const finalStatus = status || formData.status;
    const normalizeStatus = (s: string) => {
      const x = (s || "").toLowerCase();
      if (x === "published" || x === "xuất bản") return "published";
      if (x === "draft" || x === "bản nháp") return "draft";
      return "draft";
    };

    const normalizedStatus = normalizeStatus(finalStatus);

    if (normalizedStatus === 'published' && (!formData.images || formData.images.length === 0)) {
      setErrors({ images: 'Cần có ít nhất 1 hình ảnh khi xuất bản' });
      setActiveTab(1);
      return;
    }

    if (!validateForm()) {
      setActiveTab(0);
      return;
    }

    setLoading(true);
    try {
      const minPrice = Number(formData.priceRange?.min);
      const maxPrice = Number(formData.priceRange?.max);
      
      if (isNaN(minPrice) || isNaN(maxPrice) || minPrice < 0 || maxPrice < 0 || maxPrice < minPrice) {
        setErrors({ 
          minPrice: isNaN(minPrice) || minPrice < 0 ? 'Giá phải >= 0' : '',
          maxPrice: isNaN(maxPrice) || maxPrice < 0 ? 'Giá phải >= 0' : maxPrice < minPrice ? 'Giá tối đa phải >= giá tối thiểu' : ''
        });
        setActiveTab(0);
        setLoading(false);
        return;
      }

      const submitData: any = {
        name: formData.name.trim(),
        address: formData.address.trim(),
        district: formData.district,
        category: formData.category,
        description: formData.description.trim(),
        priceRange: { min: minPrice, max: maxPrice },
        images: formData.images || [],
        menu: formData.menu.map(item => ({
          name: item.name.trim(),
          price: Number(item.price) || 0,
          description: item.description?.trim() || '',
          category: item.category?.trim() || 'Khác'
        })),
        aiTags: {
          space: formData.aiTags.space || [],
          mood: formData.aiTags.mood || [],
          suitability: formData.aiTags.suitability || [],
          crowdLevel: formData.aiTags.crowdLevel || [],
          music: formData.aiTags.music || [],
          parking: formData.aiTags.parking || [],
          specialFeatures: formData.aiTags.specialFeatures || []
        },
        phone: formData.contact.phone?.trim() || '',
        website: formData.contact.website?.trim() || '',
        operatingHours: formData.operatingHours,
        status: normalizedStatus,
        isActive: true,
        featured: false
      };

      if (formData.coordinates?.latitude && formData.coordinates?.longitude) {
        const lat = Number(formData.coordinates.latitude);
        const lng = Number(formData.coordinates.longitude);
        if (!isNaN(lat) && !isNaN(lng)) {
          submitData.coordinates = { latitude: lat, longitude: lng };
        }
      }

      console.log('🚀 Payload gửi lên backend:', JSON.stringify(submitData, null, 2));

      let response;
      if (placeId) {
        response = await placesAPI.update(placeId, submitData);
      } else {
        response = await placesAPI.create(submitData);
      }

      console.log('✅ Response từ backend:', response.data);
      onSave(response.data);
    } catch (error: any) {
      console.error('❌ Save error:', error);
      
      if (error?.response?.data?.message) {
        alert('Lỗi: ' + error.response.data.message + '\n\nChi tiết: ' + JSON.stringify(error.response.data.details || error.response.data.errors, null, 2));
      }
      
      if (error.response?.data?.errors) {
        const errorMap: Record<string, string> = {};
        error.response.data.errors.forEach((err: string) => {
          if (err.includes('name')) errorMap.name = err;
          else if (err.includes('address')) errorMap.address = err;
          else if (err.includes('district')) errorMap.district = err;
          else if (err.includes('category')) errorMap.category = err;
          else if (err.includes('description')) errorMap.description = err;
          else if (err.includes('priceRange')) errorMap.maxPrice = err;
        });
        setErrors(errorMap);
        setActiveTab(0);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow">
      {/* Header */}
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center gap-4">
          <button onClick={onBack} className="p-2 hover:bg-gray-100 rounded-lg">
            <ArrowLeft size={20} />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              {placeId ? 'Chỉnh sửa địa điểm' : 'Tạo địa điểm mới'}
            </h1>
            <p className="text-gray-600">
              {placeId ? 'Cập nhật thông tin địa điểm' : 'Thêm địa điểm mới vào hệ thống'}
            </p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="flex px-6">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`py-4 px-6 border-b-2 font-medium text-sm ${
                activeTab === tab.id
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <span className="mr-2">{tab.icon}</span>
              {tab.name}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      <div className="p-6">
        {activeTab === 0 && (
          <BasicInfoTab
            formData={formData}
            districts={districts}
            errors={errors}
            onUpdate={handleFormDataUpdate}
            onUpdateNested={updateNestedFormData}
          />
        )}

        {activeTab === 1 && (
          <ImagesMenuTab
            formData={formData}
            errors={errors}
            onImagesChange={(images) => updateFormData('images', images)}
            onAddMenuItem={addMenuItem}
            onUpdateMenuItem={updateMenuItem}
            onRemoveMenuItem={removeMenuItem}
          />
        )}

        {activeTab === 2 && (
          <OperatingHoursTab
            operatingHours={formData.operatingHours || {
              monday: { open: '', close: '' },
              tuesday: { open: '', close: '' },
              wednesday: { open: '', close: '' },
              thursday: { open: '', close: '' },
              friday: { open: '', close: '' },
              saturday: { open: '', close: '' },
              sunday: { open: '', close: '' }
            }}
            onUpdate={updateOperatingHours}
          />
        )}

        {activeTab === 3 && (
          <AITagsTab
            formData={formData}
            aiTagsOptions={aiTagsOptions}
            onToggleTag={toggleAiTag}
          />
        )}

        {activeTab === 4 && <PreviewTab formData={formData} />}
      </div>

      {/* Footer Actions */}
      <div className="p-6 border-t border-gray-200 flex items-center justify-between">
        <div className="flex gap-2">
          {activeTab > 0 && (
            <button
              onClick={() => setActiveTab(activeTab - 1)}
              className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              Trước
            </button>
          )}
          {activeTab < tabs.length - 1 && (
            <button
              onClick={() => setActiveTab(activeTab + 1)}
              className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
            >
              Tiếp theo
            </button>
          )}
        </div>

        <div className="flex flex-col gap-2">
          {!canPublish() && (
            <div className="text-sm text-amber-600 bg-amber-50 px-3 py-2 rounded-lg border border-amber-200">
              ⚠️ Cần có ít nhất 1 hình ảnh để xuất bản
            </div>
          )}
          <div className="flex gap-2">
            <button
              onClick={() => handleSubmit('Draft')}
              disabled={loading}
              className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50"
            >
              {loading ? 'Đang lưu...' : 'Lưu nháp'}
            </button>
            <button
              onClick={() => handleSubmit('Published')}
              disabled={loading || !canPublish()}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:bg-gray-400 flex items-center gap-2"
              title={!canPublish() ? 'Cần có ít nhất 1 hình ảnh để xuất bản' : ''}
            >
              <Save size={16} />
              {loading ? 'Đang lưu...' : placeId ? 'Cập nhật' : 'Tạo & Xuất bản'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PlaceForm;
