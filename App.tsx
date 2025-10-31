import React, { useState, useCallback, useEffect } from 'react';
import { ImageUploader } from './components/ImageUploader';
import { ResultDisplay } from './components/ResultDisplay';
import { processImage, describeImage } from './services/geminiService';
import { fileToBase64 } from './utils/imageUtils';
import { KeySelectionOverlay } from './components/KeySelectionOverlay';

// Fix: By moving the AIStudio interface inside the `declare global` block,
// we ensure it's treated as a single, global type declaration. This resolves
// a TypeScript error where duplicate or conflicting type definitions for
// 'window.aistudio' could occur across different modules or scopes.
declare global {
  interface AIStudio {
    hasSelectedApiKey: () => Promise<boolean>;
    openSelectKey: () => Promise<void>;
  }
  interface Window {
    aistudio?: AIStudio;
  }
}

function App() {
  const [apiKey, setApiKey] = useState<string | null>(null);
  const [hasSelectedAiStudioKey, setHasSelectedAiStudioKey] = useState<boolean>(false);
  const [isAistudioAvailable, setIsAistudioAvailable] = useState<boolean>(true);
  const [originalImage, setOriginalImage] = useState<File | null>(null);
  const [processedImage, setProcessedImage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [loadingMessage, setLoadingMessage] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [editMode, setEditMode] = useState<'watermark' | 'object'>('watermark');
  const [maskImage, setMaskImage] = useState<string | null>(null);
  const [objectRemovalMode, setObjectRemovalMode] = useState<'mask' | 'prompt'>('mask');
  const [objectPrompt, setObjectPrompt] = useState<string>('');

  useEffect(() => {
    const checkStatus = async () => {
      if (window.aistudio && typeof window.aistudio.hasSelectedApiKey === 'function') {
          setIsAistudioAvailable(true);
          const keyStatus = await window.aistudio.hasSelectedApiKey();
          setHasSelectedAiStudioKey(keyStatus);
      } else {
          console.warn("AI Studio context not found. Using manual key input mode.");
          setIsAistudioAvailable(false);
          const storedKey = localStorage.getItem('gemini-api-key');
          if (storedKey) {
            setApiKey(storedKey);
          }
      }
    };
    checkStatus();
  }, []);

  const handleSelectKey = async () => {
    if (window.aistudio && typeof window.aistudio.openSelectKey === 'function') {
        try {
            await window.aistudio.openSelectKey();
            // Check status again to be sure
            const keyStatus = await window.aistudio.hasSelectedApiKey();
            setHasSelectedAiStudioKey(keyStatus);
        } catch (e) {
            console.error("Lỗi khi mở hộp thoại chọn khóa:", e);
            setHasSelectedAiStudioKey(false);
        }
    }
  };
  
  const handleApiKeySubmit = (key: string) => {
    localStorage.setItem('gemini-api-key', key);
    setApiKey(key);
  };

  const handleChangeKey = () => {
    if (isAistudioAvailable) {
      handleSelectKey();
    } else {
      // Clear the stored key and show the overlay again
      localStorage.removeItem('gemini-api-key');
      setApiKey(null);
    }
  };

  const handleImageUpload = (file: File) => {
    setOriginalImage(file);
    setProcessedImage(null);
    setError(null);
    setMaskImage(null);
    setObjectPrompt('');
  };

  const handleEditModeChange = (mode: 'watermark' | 'object') => {
    setEditMode(mode);
    setMaskImage(null);
    setObjectPrompt('');
    if (mode === 'object') {
      setObjectRemovalMode('mask');
    }
  };

  const handleObjectRemovalModeChange = (mode: 'mask' | 'prompt') => {
    setObjectRemovalMode(mode);
    if (mode === 'mask') {
      setObjectPrompt('');
    } else {
      setMaskImage(null);
    }
  };

  const handleProcessImage = useCallback(async () => {
    if (!originalImage) {
      setError("Vui lòng tải ảnh lên trước.");
      return;
    }
    
    const isReady = (isAistudioAvailable && hasSelectedAiStudioKey) || (!isAistudioAvailable && !!apiKey);
    if (!isReady) {
        setError("Vui lòng chọn hoặc cung cấp một Khóa API trước khi xử lý hình ảnh.");
        return;
    }

    setIsLoading(true);
    setError(null);
    setProcessedImage(null);
    
    const keyForApi = isAistudioAvailable ? undefined : apiKey;

    try {
      const base64Image = await fileToBase64(originalImage);
      let finalPrompt: string;
      let maskBase64: string | undefined = undefined;

      if (editMode === 'watermark') {
        setLoadingMessage("Đang xóa logo...");
        finalPrompt = `Remove all text, watermarks, and logos from the image seamlessly. Reconstruct the cleared areas by inpainting with perfect visual consistency, meticulously matching the original lighting, color grading, texture, and grain. The final image must look untouched, with photorealistic details and no visible editing marks, blur, or artifacts. The output must only be the edited image.`;
      } else { // object mode
        let removalTarget: string;

        if (objectRemovalMode === 'mask') {
          if (!maskImage) {
            throw new Error("Vui lòng vẽ một mặt nạ lên đối tượng bạn muốn xóa.");
          }
          removalTarget = "the masked object";
          maskBase64 = maskImage ? maskImage.split(',')[1] : undefined;
        } else { // prompt mode
          if (!objectPrompt.trim()) {
            throw new Error("Vui lòng mô tả đối tượng bạn muốn xóa.");
          }
          removalTarget = objectPrompt.trim();
        }

        setLoadingMessage("Bước 1/2: Đang phân tích bối cảnh ảnh...");
        const imageContext = await describeImage(base64Image, originalImage.type, keyForApi);

        setLoadingMessage("Bước 2/2: Đang xóa đối tượng...");
        finalPrompt = `Remove ${removalTarget} from the image seamlessly. Reconstruct the missing area with perfect visual consistency, matching the original lighting, color grading, texture, and depth of field. The background context is: ${imageContext}. Maintain the original composition, photorealistic details, and ensure there are no visible editing marks or blur transitions. The final image must look untouched and of high-end quality, as if the removed subject never existed. The output must only be the edited image.`;
      }
      
      const { base64: processedBase64 } = await processImage(base64Image, originalImage.type, finalPrompt, keyForApi, maskBase64);
      
      if (processedBase64) {
        setProcessedImage(`data:image/png;base64,${processedBase64}`);
      } else {
        throw new Error("AI không thể xử lý hình ảnh. Vui lòng thử một hình ảnh khác.");
      }

    } catch (err) {
      console.error(err);
      const errorMessage = err instanceof Error ? err.message : "Đã xảy ra lỗi không xác định.";
      if (errorMessage.includes('API key not valid')) {
        setError("Khóa API đã cung cấp không hợp lệ. Vui lòng kiểm tra lại.");
        if (!isAistudioAvailable) {
          localStorage.removeItem('gemini-api-key');
          setApiKey(null);
        }
      } else if (errorMessage.includes('Requested entity was not found')) {
        setHasSelectedAiStudioKey(false);
        setError("Khóa API đã chọn không hợp lệ hoặc không có quyền truy cập. Vui lòng chọn một khóa khác.");
      } else {
        setError(errorMessage);
      }
    } finally {
      setIsLoading(false);
      setLoadingMessage('');
    }
  }, [originalImage, editMode, maskImage, objectRemovalMode, objectPrompt, isAistudioAvailable, hasSelectedAiStudioKey, apiKey]);
  
  const showOverlay = isAistudioAvailable ? !hasSelectedAiStudioKey : !apiKey;

  return (
    <>
      {showOverlay && (
        <KeySelectionOverlay 
          onSelectKey={handleSelectKey} 
          isAistudioAvailable={isAistudioAvailable} 
          onApiKeySubmit={handleApiKeySubmit}
        />
      )}
      <div className="min-h-screen bg-gray-900 text-gray-100 flex flex-col items-center p-4 sm:p-6 lg:p-8">
        <div className="w-full max-w-6xl mx-auto">
          <header className="text-center mb-8">
            <h1 className="text-4xl sm:text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-500">
              Trình Chỉnh Sửa Ảnh AI
            </h1>
            <p className="mt-2 text-lg text-gray-400">
              Tải ảnh lên để xóa logo, văn bản hoặc đối tượng một cách kỳ diệu trong vài giây.
            </p>
            <div className="mt-4">
              <button 
                  onClick={handleChangeKey}
                  className="px-4 py-2 text-sm font-medium text-blue-300 bg-gray-800/80 border border-gray-700 rounded-lg hover:bg-gray-700 transition-colors"
              >
                  Thay đổi khóa API
              </button>
            </div>
          </header>

          <main className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <ImageUploader 
              onImageUpload={handleImageUpload} 
              onProcessImage={handleProcessImage} 
              isLoading={isLoading} 
              originalImage={originalImage}
              editMode={editMode}
              onEditModeChange={handleEditModeChange}
              maskImage={maskImage}
              onMaskImageChange={setMaskImage}
              objectRemovalMode={objectRemovalMode}
              onObjectRemovalModeChange={handleObjectRemovalModeChange}
              objectPrompt={objectPrompt}
              onObjectPromptChange={setObjectPrompt}
            />
            <ResultDisplay 
              processedImage={processedImage} 
              isLoading={isLoading} 
              error={error}
              loadingMessage={loadingMessage}
            />
          </main>
        </div>
      </div>
    </>
  );
}

export default App;