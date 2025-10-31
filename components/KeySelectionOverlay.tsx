import React, { useState } from 'react';

interface KeySelectionOverlayProps {
  onSelectKey: () => void;
  isAistudioAvailable: boolean;
  onApiKeySubmit: (apiKey: string) => void;
}

export const KeySelectionOverlay: React.FC<KeySelectionOverlayProps> = ({ onSelectKey, isAistudioAvailable, onApiKeySubmit }) => {
  const [keyInput, setKeyInput] = useState('');
  // 'auto' sẽ quyết định dựa trên isAistudioAvailable, 'manual' sẽ buộc hiển thị trường nhập.
  const [mode, setMode] = useState<'auto' | 'manual'>('auto');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (keyInput.trim()) {
      onApiKeySubmit(keyInput.trim());
    }
  };

  const showManualForm = mode === 'manual' || !isAistudioAvailable;

  const ManualForm = () => (
    <form onSubmit={handleSubmit} className="space-y-4">
      <p className="text-gray-400 mb-6">
          Để sử dụng ứng dụng này, vui lòng cung cấp Khóa API Gemini của bạn. Khóa của bạn sẽ được lưu trữ an toàn trong trình duyệt.
      </p>
      <input
        type="password"
        value={keyInput}
        onChange={(e) => setKeyInput(e.target.value)}
        placeholder="Dán Khóa API của bạn vào đây"
        className="w-full px-4 py-3 bg-gray-900 border border-gray-600 rounded-lg text-gray-200 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
        aria-label="Gemini API Key Input"
      />
      <button
        type="submit"
        disabled={!keyInput.trim()}
        className="w-full px-6 py-3 text-lg font-semibold text-white bg-blue-600 rounded-lg shadow-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800 focus:ring-blue-500"
      >
        Lưu và Sử dụng Khóa
      </button>
    </form>
  );

  const AiStudioPrompt = () => (
    <>
      <p className="text-gray-400 mb-6">
        Để sử dụng ứng dụng này, bạn cần chọn một Khóa API Gemini. Việc sử dụng API này có thể phát sinh chi phí.
      </p>
      <button
        onClick={onSelectKey}
        className="w-full px-6 py-3 text-lg font-semibold text-white bg-blue-600 rounded-lg shadow-lg hover:bg-blue-700 transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800 focus:ring-blue-500"
      >
        Chọn Khóa API
      </button>
       <button onClick={() => setMode('manual')} className="mt-4 text-sm text-blue-400 hover:underline">
        Hoặc nhập khóa thủ công
      </button>
    </>
  );

  return (
    <div className="fixed inset-0 bg-gray-900 bg-opacity-90 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-gray-800 border border-gray-700 rounded-2xl shadow-2xl p-6 sm:p-8 max-w-md w-full text-center">
        <h1 className="text-2xl sm:text-3xl font-bold mb-3 text-gray-100">
          {showManualForm ? 'Yêu cầu khóa API' : 'Chọn Khóa API'}
        </h1>
        
        {showManualForm ? <ManualForm /> : <AiStudioPrompt />}
        
        <p className="text-xs text-gray-500 mt-6">
          {showManualForm ? 'Không có khóa? ' : 'Tìm hiểu thêm về giá cả tại '}
          <a href={showManualForm ? "https://aistudio.google.com/app/apikey" : "https://ai.google.dev/gemini-api/docs/billing"} target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:underline">
            {showManualForm ? 'Nhận Khóa API của bạn tại đây' : 'Tài liệu thanh toán'}
          </a>.
        </p>
      </div>
    </div>
  );
};
