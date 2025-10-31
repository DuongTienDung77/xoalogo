import React, { useState } from 'react';

interface ApiKeyPromptProps {
  onApiKeySubmit: (apiKey: string) => void;
}

export const ApiKeyPrompt: React.FC<ApiKeyPromptProps> = ({ onApiKeySubmit }) => {
  const [key, setKey] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (key.trim()) {
      onApiKeySubmit(key.trim());
    }
  };

  return (
    <div className="fixed inset-0 bg-gray-900 bg-opacity-90 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-gray-800 border border-gray-700 rounded-2xl shadow-2xl p-6 sm:p-8 max-w-md w-full text-center">
        <h1 className="text-2xl sm:text-3xl font-bold mb-3 text-gray-100">Yêu cầu khóa API</h1>
        <p className="text-gray-400 mb-6">
          Vui lòng cung cấp Khóa API Gemini của bạn để sử dụng ứng dụng.
        </p>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          <input
            type="password"
            value={key}
            onChange={(e) => setKey(e.target.value)}
            placeholder="Dán Khóa API của bạn vào đây"
            className="w-full px-4 py-3 bg-gray-900 border border-gray-600 rounded-lg text-gray-200 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
            aria-label="Gemini API Key Input"
          />
          <button
            type="submit"
            disabled={!key.trim()}
            className="w-full px-6 py-3 text-lg font-semibold text-white bg-blue-600 rounded-lg shadow-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800 focus:ring-blue-500"
          >
            Lưu và Sử dụng Khóa
          </button>
        </form>
        <p className="text-xs text-gray-500 mt-6">
          Khóa của bạn được lưu trữ an toàn trong trình duyệt của bạn và không bao giờ được gửi đi nơi khác.
          {' '}
          <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:underline">
            Nhận Khóa API của bạn tại đây
          </a>
        </p>
      </div>
    </div>
  );
};