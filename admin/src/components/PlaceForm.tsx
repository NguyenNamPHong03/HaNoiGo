import {
  AlertCircle,
  ArrowLeft,
  Minus,
  Plus,
  Save,
  Upload,
  X
} from 'lucide-react';
import React, { useEffect, useState } from 'react';
import { placesAPI, uploadAPI } from '../services/api';
import { compressImage, formatFileSize, needsCompression } from '../utils/imageCompression';

interface PlaceFormData {
  name: string;
  address: string;
  district: string;
  category: string;
  description: string;
  priceRange: { min: number; max: number };
  images: string[];
  menu: Array<{ name: string; price: number; description: string; category: string }>;
  aiTags: {
    space: string[];
    mood: string[];
    suitability: string[];
    crowdLevel: string[];
    music: string[];
    parking: string[];
    specialFeatures: string[];
  };
  coordinates?: { latitude: number; longitude: number };
  contact: { phone: string; website: string };
  status: string;
}

interface PlaceFormProps {
  placeId?: string;
  onBack: () => void;
  onSave: (place: any) => void;
}

const PlaceForm: React.FC<PlaceFormProps> = ({ placeId, onBack, onSave }) => {
  const [activeTab, setActiveTab] = useState(0);
  const [formData, setFormData] = useState<PlaceFormData>({
    name: '',
    address: '',
    district: '',
    category: '',
    description: '',
    priceRange: { min: 0, max: 0 },
    images: [],
    menu: [],
    aiTags: {
      space: [],
      mood: [],
      suitability: [],
      crowdLevel: [],
      music: [],
      parking: [],
      specialFeatures: []
    },
    contact: { phone: '', website: '' },
    status: 'Draft'
  });
  
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [districts, setDistricts] = useState<string[]>([]);
  const [aiTagsOptions, setAiTagsOptions] = useState<any>({});
  const [uploadingImages, setUploadingImages] = useState(false);
  const [uploadProgress, setUploadProgress] = useState({ current: 0, total: 0 });
  const [dragActive, setDragActive] = useState(false);

  const tabs = [
    { id: 0, name: 'Thông tin cơ bản', icon: '📝' },
    { id: 1, name: 'Hình ảnh & Menu', icon: '🖼️' },
    { id: 2, name: 'AI Tags', icon: '🤖' },
    { id: 3, name: 'Xem trước', icon: '👁️' }
  ];

  useEffect(() => {
    loadInitialData();
  }, [placeId]);

  const loadInitialData = async () => {
    try {
      // Load options
      const [districtsRes, aiTagsRes] = await Promise.all([
        placesAPI.getDistricts(),
        placesAPI.getAiTagsOptions()
      ]);
      
      setDistricts(districtsRes.data);
      setAiTagsOptions(aiTagsRes.data);

      // Load place data if editing
      if (placeId) {
        const placeRes = await placesAPI.getById(placeId);
        const place = placeRes.data;
        
        // ✅ Đảm bảo priceRange luôn có cả min và max
        const priceRange = place.priceRange || {};
        const validPriceRange = {
          min: Number(priceRange.min) >= 0 ? Number(priceRange.min) : 0,
          max: Number(priceRange.max) >= 0 ? Number(priceRange.max) : 0
        };
        
        console.log('📝 Loaded place data:', { 
          name: place.name, 
          priceRange: validPriceRange 
        });
        
        setFormData({
          name: place.name || '',
          address: place.address || '',
          district: place.district || '',
          category: place.category || '',
          description: place.description || '',
          priceRange: validPriceRange,
          images: place.images || [],
          menu: place.menu || [],
          aiTags: place.aiTags || {
            space: [],
            mood: [],
            suitability: [],
            crowdLevel: [],
            music: [],
            parking: [],
            specialFeatures: []
          },
          contact: place.contact || { phone: '', website: '' },
          status: place.status || 'Draft'
        });
      }
    } catch (error) {
      console.error('Error loading initial data:', error);
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    // Basic validation
    if (!formData.name.trim()) newErrors.name = 'Tên địa điểm là bắt buộc';
    if (!formData.address.trim()) newErrors.address = 'Địa chỉ là bắt buộc';
    if (!formData.district) newErrors.district = 'Quận là bắt buộc';
    if (!formData.category) newErrors.category = 'Danh mục là bắt buộc';
    if (!formData.description.trim()) newErrors.description = 'Mô tả là bắt buộc';
    
    // Price validation - ensure they are numbers
    const minPrice = Number(formData.priceRange.min);
    const maxPrice = Number(formData.priceRange.max);
    
    if (isNaN(minPrice) || minPrice < 0) newErrors.minPrice = 'Giá tối thiểu phải là số >= 0';
    if (isNaN(maxPrice) || maxPrice < 0) newErrors.maxPrice = 'Giá tối đa phải là số >= 0';
    if (!isNaN(minPrice) && !isNaN(maxPrice) && maxPrice < minPrice) {
      newErrors.maxPrice = 'Giá tối đa phải >= giá tối thiểu';
    }

    // Phone validation (optional but if provided should be valid)
    const phone = formData.contact.phone?.trim();
    if (phone && !/^[\d\s\-\+\(\)]+$/.test(phone)) {
      newErrors.phone = 'Số điện thoại không hợp lệ';
    }

    // Website validation (optional but if provided should be valid URL)
    const website = formData.contact.website?.trim();
    if (website && !website.match(/^https?:\/\/.+/)) {
      newErrors.website = 'Website phải bắt đầu bằng http:// hoặc https://';
    }

    // Menu validation
    formData.menu.forEach((item, index) => {
      if (item.name && !item.name.trim()) {
        newErrors[`menu_${index}_name`] = `Tên món ${index + 1} không được để trống`;
      }
      if (item.name && (isNaN(Number(item.price)) || Number(item.price) < 0)) {
        newErrors[`menu_${index}_price`] = `Giá món ${index + 1} phải là số >= 0`;
      }
    });

    console.log('📝 Validation errors:', newErrors);
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Helper function để check xem có thể publish không
  const canPublish = () => {
    return formData.images && formData.images.length > 0;
  };

  // Upload ảnh lên server/cloudinary với compression
  const uploadImageToServer = async (file: File): Promise<string> => {
    try {
      let fileToUpload = file;
      
      // Compress ảnh trước khi upload nếu cần
      if (needsCompression(file, 1)) {
        console.log(`🗜️ Compressing ${file.name} (${formatFileSize(file.size)})...`);
        fileToUpload = await compressImage(file, {
          maxSizeMB: 1,
          maxWidthOrHeight: 1920,
          quality: 0.85
        });
        console.log(`✅ Compressed to ${formatFileSize(fileToUpload.size)}`);
      } else {
        console.log(`✓ ${file.name} không cần compress (${formatFileSize(file.size)})`);
      }
      
      // Sử dụng upload API riêng cho place images
      const response = await uploadAPI.uploadImage(fileToUpload);
      console.log('✅ Upload response:', response);
      
      // Response structure: { success: true, data: { imageUrl: '...' } }
      return response.data?.imageUrl || response.imageUrl;
    } catch (error) {
      console.error('Upload error:', error);
      throw error;
    }
  };

  // Handle file selection (từ button hoặc drag drop)
  const handleFileUpload = async (files: FileList | File[]) => {
    const fileArray = Array.from(files);
    const validFiles = fileArray.filter(file => {
      // Validate file type và size
      const validTypes = ['image/png', 'image/jpg', 'image/jpeg', 'image/gif', 'image/webp'];
      const maxSize = 5 * 1024 * 1024; // 5MB (đã giảm từ 10MB)

      if (!validTypes.includes(file.type)) {
        console.error('File type không hợp lệ:', file.name);
        setErrors(prev => ({ ...prev, images: `File ${file.name} không hợp lệ. Chỉ chấp nhận PNG, JPG, JPEG, GIF, WebP` }));
        return false;
      }
      
      if (file.size > maxSize) {
        console.error('File quá lớn:', file.name);
        setErrors(prev => ({ ...prev, images: `File ${file.name} quá lớn. Tối đa 5MB (sẽ tự động nén nếu cần)` }));
        return false;
      }

      return true;
    });

    if (validFiles.length === 0) {
      return;
    }

    setUploadingImages(true);
    setUploadProgress({ current: 0, total: validFiles.length });
    setErrors(prev => {
      const newErrors = { ...prev };
      delete newErrors.images;
      return newErrors;
    });

    try {
      console.log(`📤 Bắt đầu upload ${validFiles.length} file(s)...`);
      
      // Upload từng file
      const uploadedUrls: string[] = [];
      
      for (let i = 0; i < validFiles.length; i++) {
        const file = validFiles[i];
        setUploadProgress({ current: i + 1, total: validFiles.length });
        console.log(`📤 Upload file ${i + 1}/${validFiles.length}: ${file.name}`);
        
        try {
          const url = await uploadImageToServer(file);
          uploadedUrls.push(url);
          console.log(`✅ Upload thành công ${i + 1}/${validFiles.length}: ${url}`);
        } catch (error) {
          console.error(`❌ Upload thất bại ${file.name}:`, error);
          // Continue với files khác
        }
      }

      if (uploadedUrls.length > 0) {
        // Thêm URLs vào formData
        setFormData(prev => ({
          ...prev,
          images: [...prev.images, ...uploadedUrls]
        }));

        console.log(`✅ Upload hoàn thành: ${uploadedUrls.length}/${validFiles.length} file(s)`);
        
        if (uploadedUrls.length < validFiles.length) {
          setErrors(prev => ({ 
            ...prev, 
            images: `Upload thành công ${uploadedUrls.length}/${validFiles.length} file(s). Một số file gặp lỗi.` 
          }));
        }
      } else {
        setErrors(prev => ({ ...prev, images: 'Không thể upload file nào. Vui lòng thử lại.' }));
      }
    } catch (error) {
      console.error('❌ Upload error:', error);
      setErrors(prev => ({ ...prev, images: 'Lỗi upload ảnh. Vui lòng thử lại.' }));
    } finally {
      setUploadingImages(false);
      setUploadProgress({ current: 0, total: 0 });
    }
  };

  // Drag and drop handlers
  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFileUpload(e.dataTransfer.files);
    }
  };

  // Handle file input change
  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      handleFileUpload(e.target.files);
    }
  };

  const handleSubmit = async (status?: string) => {
    const finalStatus = status || formData.status;
    
    // Helper function để normalize status
    const normalizeStatus = (s: string) => {
      const x = (s || "").toLowerCase();
      if (x === "published" || x === "xuất bản") return "published";
      if (x === "draft" || x === "bản nháp") return "draft";
      return "draft";
    };

    const normalizedStatus = normalizeStatus(finalStatus);

    // Kiểm tra ảnh trước khi validate form khác
    if (normalizedStatus === 'published' && (!formData.images || formData.images.length === 0)) {
      setErrors({ images: 'Cần có ít nhất 1 hình ảnh khi xuất bản' });
      setActiveTab(1); // Chuyển đến tab hình ảnh
      console.log('❌ Không thể xuất bản: thiếu hình ảnh');
      return;
    }

    if (!validateForm()) {
      setActiveTab(0); // Go to first tab to show errors
      return;
    }

    setLoading(true);
    try {
      // ✅ Validate priceRange trước - CRITICAL để tránh lỗi backend
      const minPrice = Number(formData.priceRange?.min);
      const maxPrice = Number(formData.priceRange?.max);
      
      if (isNaN(minPrice) || isNaN(maxPrice)) {
        setErrors({ minPrice: 'Giá không hợp lệ', maxPrice: 'Giá không hợp lệ' });
        setActiveTab(0);
        setLoading(false);
        return;
      }
      
      if (minPrice < 0 || maxPrice < 0) {
        setErrors({ minPrice: 'Giá phải >= 0', maxPrice: 'Giá phải >= 0' });
        setActiveTab(0);
        setLoading(false);
        return;
      }
      
      if (maxPrice < minPrice) {
        setErrors({ maxPrice: 'Giá tối đa phải >= giá tối thiểu' });
        setActiveTab(0);
        setLoading(false);
        return;
      }

      // Chuẩn hóa dữ liệu trước khi gửi - phải khớp 100% với backend schema
      const submitData: any = {
        name: formData.name.trim(),
        address: formData.address.trim(),
        district: formData.district,
        category: formData.category,
        description: formData.description.trim(),
        // ✅ CRITICAL: Luôn gửi cả min VÀ max để tránh lỗi validator
        priceRange: {
          min: minPrice,
          max: maxPrice
        },
        images: formData.images || [],
        menu: formData.menu.map(item => ({
          name: item.name.trim(),
          price: Number(item.price) || 0,
          description: item.description?.trim() || '',
          category: item.category?.trim() || 'Khác'
        })),
        // ✅ Fix: Thêm đầy đủ tất cả fields trong aiTags
        aiTags: {
          space: formData.aiTags.space || [],
          mood: formData.aiTags.mood || [],
          suitability: formData.aiTags.suitability || [],
          crowdLevel: formData.aiTags.crowdLevel || [],
          music: formData.aiTags.music || [],
          parking: formData.aiTags.parking || [],
          specialFeatures: formData.aiTags.specialFeatures || [] // ✅ CRITICAL: Thiếu field này gây lỗi
        },
        // Backend map phone/website từ top-level về contact object
        phone: formData.contact.phone?.trim() || '',
        website: formData.contact.website?.trim() || '',
        // ✅ Fix: Thêm các fields bắt buộc
        status: normalizedStatus,
        isActive: true,
        featured: false
      };

      // ✅ Fix: Chỉ gửi coordinates nếu có giá trị hợp lệ
      if (formData.coordinates?.latitude && formData.coordinates?.longitude) {
        const lat = Number(formData.coordinates.latitude);
        const lng = Number(formData.coordinates.longitude);
        if (!isNaN(lat) && !isNaN(lng)) {
          submitData.coordinates = { latitude: lat, longitude: lng };
        }
      }

      // Log payload để debug
      console.log('🚀 Payload gửi lên backend:', JSON.stringify(submitData, null, 2));
      console.log('💰 PriceRange details:', {
        min: submitData.priceRange.min,
        max: submitData.priceRange.max,
        minType: typeof submitData.priceRange.min,
        maxType: typeof submitData.priceRange.max,
        minIsNumber: !isNaN(submitData.priceRange.min),
        maxIsNumber: !isNaN(submitData.priceRange.max)
      });

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
      console.error('❌ Error response:', error?.response?.data);
      console.error('❌ Error message:', error?.response?.data?.message);
      console.error('❌ Error details:', error?.response?.data?.details);
      console.error('❌ Full error object:', JSON.stringify(error?.response?.data, null, 2));
      
      // Alert để user thấy lỗi ngay
      if (error?.response?.data?.message) {
        alert('Lỗi: ' + error.response.data.message + '\n\nChi tiết: ' + JSON.stringify(error.response.data.details || error.response.data.errors, null, 2));
      }
      
      if (error.response?.data?.errors) {
        const errorMap: Record<string, string> = {};
        error.response.data.errors.forEach((err: string) => {
          // Map backend validation errors to form fields
          if (err.includes('name')) errorMap.name = err;
          else if (err.includes('address')) errorMap.address = err;
          else if (err.includes('district')) errorMap.district = err;
          else if (err.includes('category')) errorMap.category = err;
          else if (err.includes('description')) errorMap.description = err;
          else if (err.includes('priceRange')) errorMap.maxPrice = err;
          // Add more mappings as needed
        });
        setErrors(errorMap);
        setActiveTab(0); // Show first tab with errors
      }
    } finally {
      setLoading(false);
    }
  };

  const updateFormData = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  const updateNestedFormData = (parentField: string, childField: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [parentField]: {
        ...prev[parentField as keyof PlaceFormData] as any,
        [childField]: value
      }
    }));
  };

  const addMenuItem = () => {
    setFormData(prev => ({
      ...prev,
      menu: [...prev.menu, { name: '', price: 0, description: '', category: '' }]
    }));
  };

  const removeMenuItem = (index: number) => {
    setFormData(prev => ({
      ...prev,
      menu: prev.menu.filter((_, i) => i !== index)
    }));
  };

  const updateMenuItem = (index: number, field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      menu: prev.menu.map((item, i) => 
        i === index ? { ...item, [field]: value } : item
      )
    }));
  };

  const toggleAiTag = (category: string, tag: string) => {
    setFormData(prev => ({
      ...prev,
      aiTags: {
        ...prev.aiTags,
        [category]: prev.aiTags[category as keyof typeof prev.aiTags].includes(tag)
          ? prev.aiTags[category as keyof typeof prev.aiTags].filter(t => t !== tag)
          : [...prev.aiTags[category as keyof typeof prev.aiTags], tag]
      }
    }));
  };

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

${formData.menu.length > 0 ? `**Menu nổi bật:**\n${formData.menu.slice(0, 3).map(item => `- ${item.name}: ${item.price.toLocaleString()}₫`).join('\n')}` : ''}`;
  };

  return (
    <div className="bg-white rounded-lg shadow">
      {/* Header */}
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center gap-4">
          <button
            onClick={onBack}
            className="p-2 hover:bg-gray-100 rounded-lg"
          >
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
        {/* Tab 1: Basic Info */}
        {activeTab === 0 && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tên địa điểm *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => updateFormData('name', e.target.value)}
                  className={`w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 ${
                    errors.name ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="Nhập tên địa điểm"
                />
                {errors.name && (
                  <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
                    <AlertCircle size={16} />
                    {errors.name}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Danh mục *
                </label>
                <select
                  value={formData.category}
                  onChange={(e) => updateFormData('category', e.target.value)}
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
                {errors.category && (
                  <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
                    <AlertCircle size={16} />
                    {errors.category}
                  </p>
                )}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Địa chỉ *
              </label>
              <input
                type="text"
                value={formData.address}
                onChange={(e) => updateFormData('address', e.target.value)}
                className={`w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 ${
                  errors.address ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="Nhập địa chỉ đầy đủ"
              />
              {errors.address && (
                <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
                  <AlertCircle size={16} />
                  {errors.address}
                </p>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Quận *
                </label>
                <select
                  value={formData.district}
                  onChange={(e) => updateFormData('district', e.target.value)}
                  className={`w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 ${
                    errors.district ? 'border-red-500' : 'border-gray-300'
                  }`}
                >
                  <option value="">Chọn quận</option>
                  {districts.map(district => (
                    <option key={district} value={district}>{district}</option>
                  ))}
                </select>
                {errors.district && (
                  <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
                    <AlertCircle size={16} />
                    {errors.district}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Trạng thái
                </label>
                <select
                  value={formData.status}
                  onChange={(e) => updateFormData('status', e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="Draft">Bản nháp</option>
                  <option value="Published">Đã xuất bản</option>
                  <option value="Archived">Lưu trữ</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Mô tả *
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => updateFormData('description', e.target.value)}
                rows={4}
                className={`w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 ${
                  errors.description ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="Mô tả về địa điểm, điều đặc biệt..."
              />
              {errors.description && (
                <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
                  <AlertCircle size={16} />
                  {errors.description}
                </p>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Giá tối thiểu (₫) *
                </label>
                <input
                  type="number"
                  value={formData.priceRange.min}
                  onChange={(e) => updateNestedFormData('priceRange', 'min', parseInt(e.target.value) || 0)}
                  onFocus={(e) => e.target.select()}
                  className={`w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none ${
                    errors.minPrice ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="0"
                  min="0"
                />
                {errors.minPrice && (
                  <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
                    <AlertCircle size={16} />
                    {errors.minPrice}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Giá tối đa (₫) *
                </label>
                <input
                  type="number"
                  value={formData.priceRange.max}
                  onChange={(e) => updateNestedFormData('priceRange', 'max', parseInt(e.target.value) || 0)}
                  onFocus={(e) => e.target.select()}
                  className={`w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none ${
                    errors.maxPrice ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="0"
                  min="0"
                />
                {errors.maxPrice && (
                  <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
                    <AlertCircle size={16} />
                    {errors.maxPrice}
                  </p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Số điện thoại
                </label>
                <input
                  type="text"
                  value={formData.contact.phone}
                  onChange={(e) => updateNestedFormData('contact', 'phone', e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="0xx xxx xxxx"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Website
                </label>
                <input
                  type="url"
                  value={formData.contact.website}
                  onChange={(e) => updateNestedFormData('contact', 'website', e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="https://example.com"
                />
              </div>
            </div>
          </div>
        )}

        {/* Tab 2: Images & Menu */}
        {activeTab === 1 && (
          <div className="space-y-8">
            {/* Images Section */}
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                Hình ảnh {formData.status === 'Published' && <span className="text-red-500">*</span>}
              </h3>
              {errors.images && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-sm text-red-600 flex items-center gap-1">
                    <AlertCircle size={16} />
                    {errors.images}
                  </p>
                </div>
              )}
              <div 
                className={`border-2 border-dashed rounded-lg p-6 transition-colors ${
                  dragActive 
                    ? 'border-blue-500 bg-blue-50' 
                    : uploadingImages 
                      ? 'border-yellow-400 bg-yellow-50'
                      : 'border-gray-300 hover:border-gray-400'
                }`}
                onDragEnter={handleDragEnter}
                onDragLeave={handleDragLeave}
                onDragOver={handleDragOver}
                onDrop={handleDrop}
              >
                <div className="text-center">
                  {uploadingImages ? (
                    <>
                      <div className="mx-auto h-12 w-12 text-yellow-500 animate-spin">
                        ⏳
                      </div>
                      <p className="mt-4 text-yellow-600 font-medium">
                        Đang upload ảnh {uploadProgress.current}/{uploadProgress.total}...
                      </p>
                      {/* Progress bar */}
                      <div className="mt-3 w-full bg-gray-200 rounded-full h-2.5">
                        <div 
                          className="bg-blue-600 h-2.5 rounded-full transition-all duration-300"
                          style={{ width: `${(uploadProgress.current / uploadProgress.total) * 100}%` }}
                        ></div>
                      </div>
                      <p className="mt-2 text-sm text-gray-500">
                        {Math.round((uploadProgress.current / uploadProgress.total) * 100)}% hoàn thành
                      </p>
                    </>
                  ) : (
                    <>
                      <Upload className={`mx-auto h-12 w-12 ${dragActive ? 'text-blue-500' : 'text-gray-400'}`} />
                      <div className="mt-4">
                        <p className={`${dragActive ? 'text-blue-600 font-medium' : 'text-gray-600'}`}>
                          {dragActive ? 'Thả ảnh vào đây' : 'Kéo thả hình ảnh hoặc'}
                        </p>
                        <input
                          type="file"
                          multiple
                          accept="image/png,image/jpg,image/jpeg,image/gif"
                          onChange={handleFileInputChange}
                          className="hidden"
                          id="image-upload"
                          disabled={uploadingImages}
                        />
                        <label
                          htmlFor="image-upload"
                          className="mt-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 cursor-pointer inline-block disabled:opacity-50"
                        >
                          Chọn file
                        </label>
                      </div>
                      <p className="mt-2 text-sm text-gray-500">PNG, JPG, GIF tối đa 10MB</p>
                    </>
                  )}
                </div>
              </div>

              {/* Display existing images */}
              {formData.images.length > 0 && (
                <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-4">
                  {formData.images.map((image, index) => (
                    <div key={index} className="relative group">
                      <img
                        src={image}
                        alt={`Hình ${index + 1}`}
                        className="w-full h-32 object-cover rounded-lg"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          setFormData(prev => ({
                            ...prev,
                            images: prev.images.filter((_, i) => i !== index)
                          }));
                        }}
                        className="absolute top-2 right-2 p-1 bg-red-600 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <X size={16} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Menu Section */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-gray-900">Menu (Tùy chọn)</h3>
                <button
                  type="button"
                  onClick={addMenuItem}
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
                  {formData.menu.map((item, index) => (
                    <div key={index} className="p-4 border border-gray-200 rounded-lg">
                      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Tên món
                          </label>
                          <input
                            type="text"
                            value={item.name}
                            onChange={(e) => updateMenuItem(index, 'name', e.target.value)}
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
                            onChange={(e) => updateMenuItem(index, 'price', parseInt(e.target.value) || 0)}
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
                            onChange={(e) => updateMenuItem(index, 'category', e.target.value)}
                            className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                            placeholder="Món chính, tráng miệng..."
                          />
                        </div>
                        
                        <div className="flex items-end">
                          <button
                            type="button"
                            onClick={() => removeMenuItem(index)}
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
                          onChange={(e) => updateMenuItem(index, 'description', e.target.value)}
                          className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                          placeholder="Mô tả ngắn về món ăn..."
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Tab 3: AI Tags */}
        {activeTab === 2 && (
          <div className="space-y-8">
            <div className="text-center">
              <h3 className="text-lg font-medium text-gray-900 mb-2">AI Semantic Tags</h3>
              <p className="text-gray-600 mb-6">
                Chọn các tags để giúp AI hiểu rõ hơn về địa điểm này
              </p>
            </div>

            {Object.entries(aiTagsOptions).map(([category, options]) => (
              <div key={category}>
                <h4 className="text-md font-medium text-gray-800 mb-3 capitalize">
                  {category === 'space' && '🏠 Không gian'}
                  {category === 'mood' && '😊 Tâm trạng'}
                  {category === 'suitability' && '👥 Phù hợp'}
                  {category === 'crowdLevel' && '👫 Mức độ đông đúc'}
                  {category === 'music' && '🎵 Âm nhạc'}
                  {category === 'parking' && '🚗 Đậu xe'}
                  {category === 'specialFeatures' && '✨ Tính năng đặc biệt'}
                </h4>
                <div className="flex flex-wrap gap-2">
                  {(options as string[]).map((option: string) => (
                    <button
                      key={option}
                      type="button"
                      onClick={() => toggleAiTag(category, option)}
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
        )}

        {/* Tab 4: Preview */}
        {activeTab === 3 && (
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
        )}
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
          {/* Hiển thị cảnh báo nếu thiếu hình ảnh khi muốn publish */}
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