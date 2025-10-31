import React, { useState, useRef, useCallback } from 'react';
import { UploadIcon } from './icons/UploadIcon';
import { MagicWandIcon } from './icons/MagicWandIcon';
import { DrawingCanvas } from './DrawingCanvas';

interface ImageUploaderProps {
  onImageUpload: (file: File) => void;
  onProcessImage: () => void;
  isLoading: boolean;
  originalImage: File | null;
  editMode: 'watermark' | 'object';
  onEditModeChange: (mode: 'watermark' | 'object') => void;
  maskImage: string | null;
  onMaskImageChange: (value: string | null) => void;
  objectRemovalMode: 'mask' | 'prompt';
  onObjectRemovalModeChange: (mode: 'mask' | 'prompt') => void;
  objectPrompt: string;
  onObjectPromptChange: (value: string) => void;
}

export const ImageUploader: React.FC<ImageUploaderProps> = ({ 
  onImageUpload, 
  onProcessImage, 
  isLoading, 
  originalImage,
  editMode,
  onEditModeChange,
  maskImage,
  onMaskImageChange,
  objectRemovalMode,
  onObjectRemovalModeChange,
  objectPrompt,
  onObjectPromptChange
}) => {
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      onImageUpload(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleDrop = useCallback((event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();
    const file = event.dataTransfer.files?.[0];
    if (file && file.type.startsWith('image/')) {
        onImageUpload(file);
        const reader = new FileReader();
        reader.onloadend = () => {
            setPreviewUrl(reader.result as string);
        };
        reader.readAsDataURL(file);
    }
  }, [onImageUpload]);

  const handleDragOver = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();
  };

  const triggerFileSelect = () => {
    fileInputRef.current?.click();
  };
  
  const handleEditModeChange = (mode: 'watermark' | 'object') => {
    if (!isLoading) {
      onEditModeChange(mode);
    }
  }
  
  const isProcessButtonDisabled = () => {
    if (!originalImage || isLoading) return true;
    if (editMode === 'watermark') return false;
    if (editMode === 'object') {
        if (objectRemovalMode === 'mask') return !maskImage;
        if (objectRemovalMode === 'prompt') return !objectPrompt.trim();
    }
    return true; 
  };

  const showUploadPrompt = !previewUrl;
  const showCanvasMessage = previewUrl && editMode === 'object' && objectRemovalMode === 'mask';
  const showImagePreview = previewUrl && !showCanvasMessage;

  return (
    <div className="bg-gray-800/50 backdrop-blur-sm p-6 rounded-2xl shadow-2xl border border-gray-700 flex flex-col items-center justify-center space-y-4 h-full">
      <h2 className="text-2xl font-bold text-center">1. Tải Lên & Chọn Chế Độ</h2>
      
      <div 
        className="w-full h-64 border-2 border-dashed border-gray-600 rounded-lg flex flex-col items-center justify-center text-gray-400 hover:border-blue-500 hover:bg-gray-800 transition-all duration-300 cursor-pointer bg-gray-900/50"
        onClick={triggerFileSelect}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
      >
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileChange}
          accept="image/png, image/jpeg, image/webp"
          className="hidden"
        />
        {showUploadPrompt && (
          <div className="text-center">
            <UploadIcon className="mx-auto h-12 w-12 text-gray-500" />
            <p className="mt-2">Kéo & thả ảnh của bạn vào đây</p>
            <p className="text-sm">hoặc nhấp để chọn tệp</p>
          </div>
        )}
        {showCanvasMessage && (
            <p className="text-center p-4">Đã tải ảnh. Sử dụng canvas bên dưới để vẽ mặt nạ.</p>
        )}
        {showImagePreview && (
            <img src={previewUrl} alt="Preview" className="max-w-full max-h-full object-contain rounded-md" />
        )}
      </div>

      <div className="w-full space-y-4 pt-2">
        <h3 className="text-lg font-semibold text-center text-gray-300">Chọn một hành động:</h3>
        <div className="grid grid-cols-2 gap-4">
          <button
            onClick={() => handleEditModeChange('watermark')}
            disabled={isLoading}
            className={`flex items-center justify-center text-center p-4 rounded-lg border-2 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed ${
              editMode === 'watermark'
                ? 'bg-blue-500/20 border-blue-500 text-white'
                : 'bg-gray-700/50 border-gray-600 text-gray-300 hover:border-blue-400'
            }`}
          >
            <span className="font-medium">Xóa Chữ / Logo</span>
          </button>
          <button
            onClick={() => handleEditModeChange('object')}
            disabled={isLoading}
            className={`flex items-center justify-center text-center p-4 rounded-lg border-2 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed ${
              editMode === 'object'
                ? 'bg-blue-500/20 border-blue-500 text-white'
                : 'bg-gray-700/50 border-gray-600 text-gray-300 hover:border-blue-400'
            }`}
          >
            <span className="font-medium">Xóa Đối Tượng</span>
          </button>
        </div>

        {editMode === 'object' && originalImage && (
          <div className="w-full space-y-4 pt-4 border-t border-gray-700/50">
            <h3 className="text-lg font-semibold text-center text-gray-300">Làm cách nào để chọn đối tượng?</h3>
            <div className="grid grid-cols-2 gap-4">
              <button
                onClick={() => onObjectRemovalModeChange('mask')}
                disabled={isLoading}
                className={`flex items-center justify-center text-center p-3 rounded-lg border-2 transition-all duration-300 text-sm disabled:opacity-50 disabled:cursor-not-allowed ${
                  objectRemovalMode === 'mask'
                    ? 'bg-purple-500/20 border-purple-500 text-white'
                    : 'bg-gray-700/50 border-gray-600 text-gray-300 hover:border-purple-400'
                }`}
              >
                Vẽ Để Chọn
              </button>
              <button
                onClick={() => onObjectRemovalModeChange('prompt')}
                disabled={isLoading}
                className={`flex items-center justify-center text-center p-3 rounded-lg border-2 transition-all duration-300 text-sm disabled:opacity-50 disabled:cursor-not-allowed ${
                  objectRemovalMode === 'prompt'
                    ? 'bg-purple-500/20 border-purple-500 text-white'
                    : 'bg-gray-700/50 border-gray-600 text-gray-300 hover:border-purple-400'
                }`}
              >
                Mô Tả Đối Tượng
              </button>
            </div>

            {objectRemovalMode === 'mask' && previewUrl && (
              <div className="w-full mt-2 border border-gray-600 rounded-lg overflow-hidden bg-gray-900/50">
                <p className="text-center text-sm text-gray-400 p-2 bg-gray-900/80">Vẽ lên ảnh để chọn một vùng.</p>
                <DrawingCanvas imageUrl={previewUrl} onMaskUpdate={onMaskImageChange} />
              </div>
            )}
            
            {objectRemovalMode === 'prompt' && (
              <div className="w-full mt-2">
                <textarea
                  value={objectPrompt}
                  onChange={(e) => onObjectPromptChange(e.target.value)}
                  placeholder="ví dụ: 'xóa người mặc áo đỏ' hoặc 'xóa chiếc xe hơi bên trái'"
                  rows={3}
                  className="w-full p-3 bg-gray-900/80 border border-gray-600 rounded-lg text-gray-200 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500 transition-colors"
                  disabled={isLoading}
                />
              </div>
            )}
          </div>
        )}
      </div>

      <button
        onClick={onProcessImage}
        disabled={isProcessButtonDisabled()}
        className="w-full flex items-center justify-center gap-3 px-6 py-4 text-lg font-semibold text-white bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg shadow-lg hover:from-blue-600 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transform hover:scale-105 transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-900 focus:ring-blue-500"
      >
        <MagicWandIcon className="h-6 w-6" />
        {isLoading ? 'Đang xử lý...' : (editMode === 'watermark' ? 'Xóa Logo' : 'Xóa Đối Tượng')}
      </button>
    </div>
  );
};