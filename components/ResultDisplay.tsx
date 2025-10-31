import React from 'react';
import { Loader } from './Loader';
import { DownloadIcon } from './icons/DownloadIcon';
import { ExclamationIcon } from './icons/ExclamationIcon';

interface ResultDisplayProps {
  processedImage: string | null;
  isLoading: boolean;
  error: string | null;
  loadingMessage: string;
}

export const ResultDisplay: React.FC<ResultDisplayProps> = ({ processedImage, isLoading, error, loadingMessage }) => {
  
  const handleDownload = () => {
    if (processedImage) {
      const link = document.createElement('a');
      link.href = processedImage;
      link.download = 'ai-edited-image.png';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  const renderContent = () => {
    if (isLoading) {
      return <div className="flex flex-col items-center justify-center h-full"><Loader /><p className="mt-4 text-gray-300 text-center">{loadingMessage || 'AI đang thực hiện phép màu...'}</p></div>;
    }
    if (error) {
      return (
        <div className="flex flex-col items-center justify-center h-full text-center text-red-400 bg-red-900/20 p-4 rounded-lg">
          <ExclamationIcon className="h-12 w-12 mb-4" />
          <p className="font-semibold">Đã Xảy Ra Lỗi</p>
          <p className="text-sm">{error}</p>
        </div>
      );
    }
    if (processedImage) {
      return (
        <div className="flex flex-col items-center h-full space-y-6">
          <div className="flex-grow w-full flex items-center justify-center">
            <img src={processedImage} alt="Processed Result" className="max-w-full max-h-full object-contain rounded-md shadow-lg" />
          </div>
          <button
            onClick={handleDownload}
            className="w-full flex items-center justify-center gap-3 px-6 py-4 text-lg font-semibold text-white bg-gradient-to-r from-green-500 to-teal-600 rounded-lg shadow-lg hover:from-green-600 hover:to-teal-700 transform hover:scale-105 transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-900 focus:ring-green-500"
          >
            <DownloadIcon className="h-6 w-6"/>
            Tải Về Chất Lượng Cao
          </button>
        </div>
      );
    }
    return (
      <div className="flex items-center justify-center h-full text-gray-500">
        <p>Ảnh đã xử lý của bạn sẽ xuất hiện ở đây.</p>
      </div>
    );
  };
  
  return (
    <div className="bg-gray-800/50 backdrop-blur-sm p-6 rounded-2xl shadow-2xl border border-gray-700 flex flex-col h-full min-h-[400px]">
       <h2 className="text-2xl font-bold text-center mb-6">2. Xem Kết Quả Của Bạn</h2>
      <div className="flex-grow w-full h-64 min-h-[256px] bg-gray-900/50 rounded-lg flex items-center justify-center p-2">
        {renderContent()}
      </div>
    </div>
  );
};