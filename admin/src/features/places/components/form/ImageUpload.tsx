import { AlertCircle, Upload, X } from 'lucide-react';
import React, { useState } from 'react';
import { uploadAPI } from '../../../../services/api';
import { compressImage, formatFileSize, needsCompression } from '../../../../utils/imageCompression';

interface ImageUploadProps {
  images: string[];
  onImagesChange: (images: string[]) => void;
  error?: string;
  required?: boolean;
}

export const ImageUpload: React.FC<ImageUploadProps> = ({ 
  images, 
  onImagesChange, 
  error,
  required 
}) => {
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState({ current: 0, total: 0 });
  const [dragActive, setDragActive] = useState(false);

  const uploadImageToServer = async (file: File): Promise<string> => {
    try {
      let fileToUpload = file;
      
      if (needsCompression(file, 1)) {
        console.log(`🗜️ Compressing ${file.name} (${formatFileSize(file.size)})...`);
        fileToUpload = await compressImage(file, {
          maxSizeMB: 1,
          maxWidthOrHeight: 1920,
          quality: 0.85
        });
        console.log(`✅ Compressed to ${formatFileSize(fileToUpload.size)}`);
      }
      
      const response = await uploadAPI.uploadImage(fileToUpload);
      return response.data?.imageUrl || response.imageUrl;
    } catch (error) {
      console.error('Upload error:', error);
      throw error;
    }
  };

  const handleFileUpload = async (files: FileList | File[]) => {
    const fileArray = Array.from(files);
    const validFiles = fileArray.filter(file => {
      const validTypes = ['image/png', 'image/jpg', 'image/jpeg', 'image/gif', 'image/webp'];
      const maxSize = 5 * 1024 * 1024; // 5MB

      if (!validTypes.includes(file.type)) {
        console.error('File type không hợp lệ:', file.name);
        return false;
      }
      
      if (file.size > maxSize) {
        console.error('File quá lớn:', file.name);
        return false;
      }

      return true;
    });

    if (validFiles.length === 0) return;

    setUploading(true);
    setUploadProgress({ current: 0, total: validFiles.length });

    try {
      const uploadedUrls: string[] = [];
      
      for (let i = 0; i < validFiles.length; i++) {
        const file = validFiles[i];
        setUploadProgress({ current: i + 1, total: validFiles.length });
        
        try {
          const url = await uploadImageToServer(file);
          uploadedUrls.push(url);
        } catch (error) {
          console.error(`❌ Upload thất bại ${file.name}:`, error);
        }
      }

      if (uploadedUrls.length > 0) {
        onImagesChange([...images, ...uploadedUrls]);
      }
    } finally {
      setUploading(false);
      setUploadProgress({ current: 0, total: 0 });
    }
  };

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

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      handleFileUpload(e.target.files);
    }
  };

  const removeImage = (index: number) => {
    onImagesChange(images.filter((_, i) => i !== index));
  };

  return (
    <div>
      <h3 className="text-lg font-medium text-gray-900 mb-4">
        Hình ảnh {required && <span className="text-red-500">*</span>}
      </h3>
      
      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-sm text-red-600 flex items-center gap-1">
            <AlertCircle size={16} />
            {error}
          </p>
        </div>
      )}
      
      <div 
        className={`border-2 border-dashed rounded-lg p-6 transition-colors ${
          dragActive 
            ? 'border-blue-500 bg-blue-50' 
            : uploading 
              ? 'border-yellow-400 bg-yellow-50'
              : 'border-gray-300 hover:border-gray-400'
        }`}
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
      >
        <div className="text-center">
          {uploading ? (
            <>
              <div className="mx-auto h-12 w-12 text-yellow-500 animate-spin">
                ⏳
              </div>
              <p className="mt-4 text-yellow-600 font-medium">
                Đang upload ảnh {uploadProgress.current}/{uploadProgress.total}...
              </p>
              <div className="mt-3 w-full bg-gray-200 rounded-full h-2.5">
                <div 
                  className="bg-blue-600 h-2.5 rounded-full transition-all duration-300"
                  style={{ width: `${(uploadProgress.current / uploadProgress.total) * 100}%` }}
                />
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
                  accept="image/png,image/jpg,image/jpeg,image/gif,image/webp"
                  onChange={handleFileInputChange}
                  className="hidden"
                  id="image-upload"
                  disabled={uploading}
                />
                <label
                  htmlFor="image-upload"
                  className="mt-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 cursor-pointer inline-block disabled:opacity-50"
                >
                  Chọn file
                </label>
              </div>
              <p className="mt-2 text-sm text-gray-500">PNG, JPG, GIF tối đa 5MB</p>
            </>
          )}
        </div>
      </div>

      {images.length > 0 && (
        <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-4">
          {images.map((image, index) => (
            <div key={index} className="relative group">
              <img
                src={image}
                alt={`Hình ${index + 1}`}
                className="w-full h-32 object-cover rounded-lg"
              />
              <button
                type="button"
                onClick={() => removeImage(index)}
                className="absolute top-2 right-2 p-1 bg-red-600 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <X size={16} />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
