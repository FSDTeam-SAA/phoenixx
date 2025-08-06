import { ChevronLeft, ChevronRight, X } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import { getImageUrl } from '../../../../utils/getImageUrl';

const ImageModal = ({ images, currentIndex, onClose, onNext, onPrev, isDarkMode = false }) => {
  const [imageLoading, setImageLoading] = useState(true);
  const [touchStart, setTouchStart] = useState(null);
  const [touchEnd, setTouchEnd] = useState(null);

  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  const handleKeyDown = useCallback((e) => {
    if (e.key === 'Escape') {
      onClose();
    } else if (e.key === 'ArrowRight' && images.length > 1) {
      onNext();
    } else if (e.key === 'ArrowLeft' && images.length > 1) {
      onPrev();
    }
  }, [onClose, onNext, onPrev, images.length]);

  // Touch event handlers for swipe navigation
  const handleTouchStart = (e) => {
    setTouchStart(e.targetTouches[0].clientX);
  };

  const handleTouchMove = (e) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const handleTouchEnd = () => {
    if (!touchStart || !touchEnd) return;
    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > 50;
    const isRightSwipe = distance < -50;

    if (isLeftSwipe && images.length > 1) {
      onNext();
    } else if (isRightSwipe && images.length > 1) {
      onPrev();
    }

    setTouchStart(null);
    setTouchEnd(null);
  };

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    document.body.style.overflow = 'hidden';

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'unset';
    };
  }, [handleKeyDown]);

  useEffect(() => {
    setImageLoading(true);
  }, [currentIndex]);

  if (!images || images.length === 0) return null;

  return (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/20 backdrop-blur-md p-4"
      onClick={handleBackdropClick}
      style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0 }}
    >
      {/* Modal Container - Fixed centering with proper responsive sizing */}
      <div
        className={`relative w-full max-w-4xl h-full max-h-[90vh] ${isDarkMode ? 'bg-gray-900 border-gray-700' : 'bg-white border-gray-200'
          } rounded-lg md:rounded-xl shadow-2xl overflow-hidden border flex flex-col mx-auto my-auto`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header with close button and counter */}
        <div
          className={`flex justify-between items-center p-3 sm:p-4 border-b shrink-0 ${isDarkMode
            ? 'bg-gray-800 border-gray-700 text-gray-200'
            : 'bg-gray-50 border-gray-200 text-gray-800'
            }`}
        >
          {images.length > 1 && (
            <div
              className={`text-xs sm:text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-600'
                }`}
            >
              {currentIndex + 1} / {images.length}
            </div>
          )}
          <div className="flex-1"></div>
          <button
            onClick={onClose}
            className={`p-1 sm:p-2 cursor-pointer rounded-full transition-colors ${isDarkMode
              ? 'hover:bg-gray-700 text-gray-300 hover:text-white'
              : 'hover:bg-gray-200 text-gray-500 hover:text-gray-700'
              }`}
            aria-label="Close modal"
          >
            <X size={20} />
          </button>
        </div>

        {/* Image Container with touch events - Properly centered */}
        <div
          className="relative flex-1 flex items-center justify-center w-full min-h-0 p-4"
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
        >
          {imageLoading && (
            <div className="absolute inset-0 flex items-center justify-center">
              <div
                className={`animate-spin rounded-full h-8 w-8 sm:h-12 sm:w-12 border-4 border-t-transparent ${isDarkMode ? 'border-gray-400' : 'border-gray-600'
                  }`}
              ></div>
            </div>
          )}

          <img
            src={getImageUrl(images[currentIndex])}
            alt={`Image ${currentIndex + 1}`}
            className={`max-w-full max-h-full w-auto h-auto object-contain transition-opacity duration-300 ${imageLoading ? 'opacity-0' : 'opacity-100'
              }`}
            onLoad={() => setImageLoading(false)}
            onError={() => {
              setImageLoading(false);
              console.error('Failed to load image:', images[currentIndex]);
            }}
            style={{
              display: 'block',
              margin: '0 auto'
            }}
          />

          {/* Navigation Arrows - Properly positioned */}
          {images.length > 1 && (
            <>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onPrev();
                }}
                className={`absolute cursor-pointer left-2 sm:left-4 top-1/2 transform -translate-y-1/2 p-2 sm:p-3 rounded-full shadow-lg transition-all duration-200 hover:scale-105 ${isDarkMode
                  ? 'bg-gray-800/90 hover:bg-gray-700 text-white border border-gray-600'
                  : 'bg-white/90 hover:bg-white text-gray-700 border border-gray-300'
                  }`}
                aria-label="Previous image"
              >
                <ChevronLeft size={20} className="sm:w-6 sm:h-6" />
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onNext();
                }}
                className={`absolute cursor-pointer right-2 sm:right-4 top-1/2 transform -translate-y-1/2 p-2 sm:p-3 rounded-full shadow-lg transition-all duration-200 hover:scale-105 ${isDarkMode
                  ? 'bg-gray-800/90 hover:bg-gray-700 text-white border border-gray-600'
                  : 'bg-white/90 hover:bg-white text-gray-700 border border-gray-300'
                  }`}
                aria-label="Next image"
              >
                <ChevronRight size={20} className="sm:w-6 sm:h-6" />
              </button>
            </>
          )}
        </div>

        {/* Footer with dots indicator - Properly centered */}
        {images.length > 1 && (
          <div
            className={`flex justify-center items-center p-3 sm:p-4 space-x-2 shrink-0 ${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-gray-50 border-gray-200'
              }`}
          >
            {images.map((_, index) => (
              <button
                key={index}
                onClick={(e) => {
                  e.stopPropagation();
                  const diff = index - currentIndex;
                  if (diff > 0) {
                    for (let i = 0; i < diff; i++) onNext();
                  } else if (diff < 0) {
                    for (let i = 0; i < Math.abs(diff); i++) onPrev();
                  }
                }}
                className={`w-2 h-2 sm:w-3 sm:h-3 rounded-full transition-all duration-200 ${index === currentIndex
                  ? isDarkMode
                    ? 'bg-blue-400'
                    : 'bg-blue-500'
                  : isDarkMode
                    ? 'bg-gray-600 hover:bg-gray-500'
                    : 'bg-gray-300 hover:bg-gray-400'
                  }`}
                aria-label={`Go to image ${index + 1}`}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ImageModal;