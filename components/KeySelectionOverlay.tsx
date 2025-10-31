import React from 'react';

interface KeySelectionOverlayProps {
  onSelectKey: () => void;
}

export const KeySelectionOverlay: React.FC<KeySelectionOverlayProps> = ({ onSelectKey }) => {
  return (
    <div className="fixed inset-0 bg-gray-900 bg-opacity-90 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-gray-800 border border-gray-700 rounded-2xl shadow-2xl p-6 sm:p-8 max-w-md w-full text-center">
        <h1 className="text-2xl sm:text-3xl font-bold mb-3 text-gray-100">
          Chọn Khóa API
        </h1>
        <p className="text-gray-400 mb-6">
          Để sử dụng ứng dụng này, bạn cần chọn một Khóa API Gemini. Việc sử dụng API này có thể phát sinh chi phí.
        </p>
        <button
          onClick={onSelectKey}
          className="w-full px-6 py-3 text-lg font-semibold text-white bg-blue-600 rounded-lg shadow-lg hover:bg-blue-700 transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800 focus:ring-blue-500"
        >
          Chọn Khóa API
        </button>
        <p className="text-xs text-gray-500 mt-6">
          Tìm hiểu thêm về giá cả tại{' '}
          <a href="https://ai.google.dev/gemini-api/docs/billing" target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:underline">
            Tài liệu thanh toán
          </a>.
        </p>
      </div>
    </div>
  );
};
