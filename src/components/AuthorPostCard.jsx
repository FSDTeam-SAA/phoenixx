"use client";
import { useMyPostQuery } from '@/features/post/postApi';
import { Dropdown } from 'antd';
import { formatDistanceToNow } from 'date-fns';
import { ChevronLeft, ChevronRight, X } from 'lucide-react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import toast from 'react-hot-toast';
import { AiOutlineEllipsis } from 'react-icons/ai';
import { FaHeart, FaRegBookmark, FaRegHeart } from "react-icons/fa";
import { isAuthenticated } from '../../utils/auth';
import { baseURL } from '../../utils/BaseURL';
import { getImageUrl } from '../../utils/getImageUrl';
import { PostSEEDark, PostSEELight } from '../../utils/svgImage';
import { ThemeContext } from '../app/ClientLayout';
import EditPostModal from './EditPostModal';
import ReportPostModal from './ReportPostModal';

const AuthorPostCard = ({
  postData,
  onLike,
  onOptionSelect,
  onUnsave,
  currentUser = { name: "User", avatar: "" }
}) => {
  const router = useRouter();
  const { isDarkMode } = useContext(ThemeContext);
  const [windowSize, setWindowSize] = useState({
    width: typeof window !== 'undefined' ? window.innerWidth : 0,
    height: typeof window !== 'undefined' ? window.innerHeight : 0
  });

  const [editModalVisible, setEditModalVisible] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  const dropdownRef = useRef(null);
  const login_user_id = typeof window !== 'undefined' ? localStorage.getItem("login_user_id") : null;
  const loginUserPost = postData?.author?._id === localStorage.getItem("login_user_id");

  const [showImageModal, setShowImageModal] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  const { data } = useMyPostQuery();

  // Check if the current user has liked this post
  const isLikedByUser = postData?.likes?.some(userId => userId === login_user_id);

  // Function to decode HTML entities
  const decodeHtmlEntities = (text) => {
    if (!text) return '';
    const textArea = document.createElement('textarea');
    textArea.innerHTML = text;
    return textArea.value;
  };

  useEffect(() => {
    const handleResize = () => {
      setWindowSize({
        width: window.innerWidth,
        height: window.innerHeight
      });
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const isMobile = windowSize.width < 640;
  const isTablet = windowSize.width >= 640 && windowSize.width < 1024;

  // Check if we have all the necessary data
  if (!postData) {
    return null;
  }

  const handleImageClick = useCallback((index) => {
    console.log('Image clicked, index:', index); // Debug log
    setCurrentImageIndex(index);
    setShowImageModal(true);
  }, []);

  const handleNextImage = useCallback(() => {
    setCurrentImageIndex((prev) =>
      prev === postData.images.length - 1 ? 0 : prev + 1
    );
  }, [postData.images?.length]);

  const handlePrevImage = useCallback(() => {
    setCurrentImageIndex((prev) =>
      prev === 0 ? postData.images.length - 1 : prev - 1
    );
  }, [postData.images?.length]);

  const handleCloseModal = useCallback(() => {
    setShowImageModal(false);
  }, []);

  const handlePostDetails = () => {
    if (!isAuthenticated()) {
      router.push('/auth/login');
      return;
    } else {
      const postId = postData._id;
      router.push(`/posts/${postId}`);
    }
  };

  const handleCommentClick = () => {
    if (!isAuthenticated()) {
      router.push('/auth/login');
      return;
    } else {
      const postId = postData._id;
      router.push(`/posts/${postId}#comments`);
    }
  };

  const handleLike = () => {
    if (!isAuthenticated()) {
      router.push('/auth/login');
      return;
    } else {
      onLike?.(postData._id)
    }
  };

  const handleShare = () => {
    const postId = postData?._id;
    navigator.clipboard.writeText(`${baseURL}/posts/${postId}`).then(() => {
      toast.success("Link copied successfully");
    }).catch(() => {
      toast.error("Failed to copy link");
    });
  };

  const handleOptionSelect = ({ key }) => {
    if (key === 'edit') {
      setEditModalVisible(true);
    } else if (key === 'report') {
      setShowReportModal(true);
    } else if (key === 'unsave') {
      onUnsave?.(postData._id);
    } else {
      onOptionSelect?.(postData._id, key);
    }
  };

  const renderAuthorAvatar = () => {
    const author = postData?.author || {};
    return (
      author.profile ? (
        <img
          src={getImageUrl(author.profile)}
          alt="Author avatar"
          className={`${isMobile ? 'w-6 h-6' : 'w-8 h-8'} rounded-full cursor-pointer`}
        />
      ) : (
        <div className={`${isMobile ? 'w-6 h-6' : 'w-8 h-8'} rounded-full ${isDarkMode ? 'bg-gray-700' : 'bg-gray-300'} flex items-center justify-center text-xs ${isDarkMode ? 'text-gray-200' : 'text-gray-700'}`}>
          {author.userName?.charAt(0).toUpperCase() || author.name?.charAt(0).toUpperCase() || 'A'}
        </div>
      )
    );
  };

  const cleanContent = (content) => {
    if (!content) return '';

    // Remove Froala "Powered by" footer
    const withoutFroala = content.replace(
      /<p[^>]*>Powered by <a[^>]*>Froala Editor<\/a><\/p>/gi,
      ''
    );

    // Remove all HTML tags
    const withoutTags = withoutFroala.replace(/<[^>]+>/g, '').trim();

    // Decode HTML entities
    let decoded = decodeHtmlEntities(withoutTags);

    // Handle long URLs or continuous text without spaces
    decoded = decoded.replace(/(https?:\/\/[^\s]+)/g, (url) => {
      // Add zero-width spaces to long URLs to allow breaking
      return url.length > 30 ? url.replace(/(.{30})/g, '$1\u200B') : url;
    });

    // Add zero-width spaces after certain characters to allow breaking
    decoded = decoded.replace(/([.,:;!?@#$%^&*()_+=\-\[\]{}|\\:";'<>?,./])/g, '$1\u200B');

    return decoded;
  };

  const renderTitle = () => (
    postData.title && (
      <h2
        onClick={handlePostDetails}
        className={`${isMobile ? 'text-lg' : isTablet ? 'text-xl' : 'text-2xl'} cursor-pointer ${isDarkMode ? 'text-gray-100 hover:text-blue-300' : 'hover:text-blue-700 text-gray-900'} font-bold mb-3`}
        style={{
          wordBreak: 'break-word',
          overflowWrap: 'break-word',
          hyphens: 'auto',
          whiteSpace: 'pre-wrap'
        }}
      >
        {postData.title}
      </h2>
    )
  );

  const renderContent = () => {
    const cleanedContent = cleanContent(postData.content);
    const words = cleanedContent.split(' ');

    return (
      <div
        className={`mb-3 ${isMobile ? 'text-sm' : 'text-base'} ${isDarkMode ? 'text-gray-300' : 'text-gray-800'} leading-relaxed`}
        style={{
          wordBreak: 'break-word',
          overflowWrap: 'break-word',
          hyphens: 'auto',
          whiteSpace: 'pre-wrap'
        }}
      >
        {words.length > 20 ? (
          <>
            <span style={{
              wordBreak: 'break-word',
              overflowWrap: 'break-word'
            }}>
              {words.slice(0, 20).join(' ')}...
            </span>
            <button
              className={`${isDarkMode
                ? 'text-blue-400 hover:text-blue-300'
                : 'text-blue-600 hover:text-blue-800'
                } cursor-pointer font-medium ml-1`}
              onClick={handleCommentClick}
              style={{
                whiteSpace: 'nowrap'
              }}
            >
              See more
            </button>
          </>
        ) : (
          <span style={{
            wordBreak: 'break-word',
            overflowWrap: 'break-word'
          }}>
            {cleanedContent}
          </span>
        )}
      </div>
    );
  };

  const renderTags = () => {
    const tags = postData.tags || [];
    return (
      tags.length > 0 && (
        <div className="flex flex-wrap items-center gap-2">
          {tags.map((tag, index) => (
            <span
              key={index}
              className={`${isDarkMode ? 'bg-primary text-blue-200' : 'bg-[#E6E6FF]'} text-xs py-1 px-2 rounded`}
              style={{
                wordBreak: 'break-word',
                overflowWrap: 'break-word'
              }}
            >
              {tag}
            </span>
          ))}
        </div>
      )
    );
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Just now';
    try {
      return formatDistanceToNow(new Date(dateString), { addSuffix: true });
    } catch (error) {
      return 'Just now';
    }
  };

  // Menu items configuration
  const menuItems = postData.isSavedPost ? [
    {
      key: 'unsave',
      label: (
        <div className={`flex items-center gap-2 py-1 ${isDarkMode ? 'text-gray-300' : 'text-gray-800'}`}>
          <FaRegBookmark className={isDarkMode ? "text-gray-400" : "text-gray-600"} />
          <span>Unsave Post</span>
        </div>
      ),
    }
  ] : loginUserPost ? [
    {
      key: 'edit',
      label: (
        <div className={`flex items-center gap-2 py-1 ${isDarkMode ? 'text-gray-300' : 'text-gray-800'}`}>
          <Image
            src={isDarkMode ? "/icons/DarkEdit.png" : "/icons/LightEdit.png"}
            width={isDarkMode ? 12 : 16}
            height={isDarkMode ? 12 : 16}
            alt="Edit post"
          />
          <span className="-mt-1">Edit Post</span>
        </div>
      ),
    }
  ] : [
    {
      key: 'report',
      label: (
        <div className="flex items-center gap-2 py-1">
          <Image
            src={isDarkMode ? "/icons/reportdark.png" : "/icons/report.png"}
            width={isDarkMode ? 16 : 16}
            height={16}
            alt="Report post"
          />
          <span className={`-mt-1 ${isDarkMode ? 'text-gray-200' : ''}`}>
            Report Post
          </span>
        </div>
      ),
    }
  ];

  const author = postData.author || {};
  const commentsCount = postData.comments?.length || 0;
  const likesCount = postData.likes?.length || 0;
  const readsCount = postData.reads || 0;

  const renderImageGrid = useMemo(() => (
    postData.images && postData.images.length > 0 && (
      <div className="mb-4 rounded-lg overflow-hidden">
        {postData.images.length === 1 ? (
          <img
            src={getImageUrl(postData.images[0])}
            alt="Post content"
            className="w-full max-h-[500px] object-cover"
            onClick={() => handleImageClick(0)}
          />
        ) : postData.images.length === 2 ? (
          <div className="flex gap-1 h-[350px]">
            <img
              src={getImageUrl(postData.images[0])}
              alt="Post content 1"
              className="w-1/2 h-full cursor-pointer object-cover "
              onClick={() => handleImageClick(0)}
            />
            <img
              src={getImageUrl(postData.images[1])}
              alt="Post content 2"
              className="w-1/2 h-full cursor-pointer object-cover "
              onClick={() => handleImageClick(1)}
            />
          </div>
        ) : postData.images.length === 3 ? (
          <div className="flex gap-1 h-[350px]">
            <div className="w-1/2 h-full">
              <img
                src={getImageUrl(postData.images[0])}
                alt="Post content 1"
                className="w-full h-full cursor-pointer object-cover "
                onClick={() => handleImageClick(0)}
              />
            </div>
            <div className="w-1/2 flex flex-col gap-1">
              <img
                src={getImageUrl(postData.images[1])}
                alt="Post content 2"
                className="w-full h-1/2 cursor-pointer object-cover "
                onClick={() => handleImageClick(1)}
              />
              <img
                src={getImageUrl(postData.images[2])}
                alt="Post content 3"
                className="w-full h-1/2 cursor-pointer object-cover"
                onClick={() => handleImageClick(2)}
              />
            </div>
          </div>
        ) : postData.images.length >= 4 ? (
          <div className="grid grid-cols-2 gap-1 h-[350px]">
            {postData.images.slice(0, 4).map((image, index) => (
              <div key={index} className="relative">
                <img
                  src={getImageUrl(image)}
                  alt={`Post content ${index + 1}`}
                  className={`w-full h-full cursor-pointer object-cover ${index === 3 && postData.images.length > 4 ? 'opacity-80' : ''
                    }`}
                  onClick={() => handleImageClick(index)}
                />
                {index === 3 && postData.images.length > 4 && (
                  <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center text-white text-2xl font-bold" onClick={() => handleImageClick(index)}>
                    +{postData.images.length - 4}
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : null}
      </div>
    )
  ), [postData.images, handleImageClick]);

  const ImageModal = ({ images, currentIndex, onClose, onNext, onPrev, isDarkMode = false }) => {
    const [imageLoading, setImageLoading] = useState(true);

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

    useEffect(() => {
      document.addEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'hidden'; // Prevent background scroll

      return () => {
        document.removeEventListener('keydown', handleKeyDown);
        document.body.style.overflow = 'unset'; // Restore scroll
      };
    }, [handleKeyDown]);

    // Reset loading state when image changes
    useEffect(() => {
      setImageLoading(true);
    }, [currentIndex]);

    if (!images || images.length === 0) return null;

    return (
      <div
        className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/80 backdrop-blur-sm"
        onClick={handleBackdropClick}
        style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0 }}
      >
        {/* Modal Container */}
        <div
          className={`relative w-[90vw] max-w-4xl h-[90vh] max-h-[800px] ${isDarkMode ? 'bg-gray-900 border-gray-700' : 'bg-white border-gray-200'
            } rounded-xl shadow-2xl overflow-hidden border`}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header with close button and counter */}
          <div
            className={`flex justify-between items-center p-4 border-b ${isDarkMode
              ? 'bg-gray-800 border-gray-700 text-gray-200'
              : 'bg-gray-50 border-gray-200 text-gray-800'
              }`}
          >
            {images.length > 1 && (
              <div className={`text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-600'
                }`}>
                {currentIndex + 1} / {images.length}
              </div>
            )}
            <div className="flex-1"></div>
            <button
              onClick={onClose}
              className={`p-2 cursor-pointer rounded-full transition-colors ${isDarkMode
                ? 'hover:bg-gray-700 text-gray-300 hover:text-white'
                : 'hover:bg-gray-200 text-gray-500 hover:text-gray-700'
                }`}
              aria-label="Close modal"
            >
              <X size={20} />
            </button>
          </div>

          {/* Image Container */}
          <div className="relative  flex-1 flex items-center justify-center" style={{ height: 'calc(100% - 80px)' }}>
            {imageLoading && (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className={`animate-spin rounded-full h-12 w-12 border-4 border-t-transparent ${isDarkMode ? 'border-gray-400' : 'border-gray-600'
                  }`}></div>
              </div>
            )}

            <img
              src={getImageUrl(images[currentIndex])}
              alt={`Image ${currentIndex + 1}`}
              className={`max-w-full max-h-full  object-contain transition-opacity duration-300 ${imageLoading ? 'opacity-0' : 'opacity-100'
                }`}
              onLoad={() => setImageLoading(false)}
              onError={() => {
                setImageLoading(false);
                console.error('Failed to load image:', images[currentIndex]);
              }}
              style={{ maxHeight: '100%', maxWidth: '100%' }}
            />

            {/* Navigation Arrows - Only show if multiple images */}
            {images.length > 1 && (
              <>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onPrev();
                  }}
                  className={`absolute cursor-pointer left-4 p-3 rounded-full shadow-lg transition-all duration-200 hover:scale-105 ${isDarkMode
                    ? 'bg-gray-800/90 hover:bg-gray-700 text-white border border-gray-600'
                    : 'bg-white/90 hover:bg-white text-gray-700 border border-gray-300'
                    }`}
                  aria-label="Previous image"
                >
                  <ChevronLeft size={24} />
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onNext();
                  }}
                  className={`absolute cursor-pointer right-4 p-3 rounded-full shadow-lg transition-all duration-200 hover:scale-105 ${isDarkMode
                    ? 'bg-gray-800/90 hover:bg-gray-700 text-white border border-gray-600'
                    : 'bg-white/90 hover:bg-white text-gray-700 border border-gray-300'
                    }`}
                  aria-label="Next image"
                >
                  <ChevronRight size={24} />
                </button>
              </>
            )}
          </div>

          {/* Footer with dots indicator */}
          {images.length > 1 && images.length <= 10 && (
            <div className={`flex justify-center items-center p-4 space-x-2 ${isDarkMode
              ? 'bg-gray-800 border-gray-700'
              : 'bg-gray-50 border-gray-200'
              }`}>
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
                  className={`w-3 h-3 rounded-full transition-all duration-200 ${index === currentIndex
                    ? (isDarkMode ? 'bg-blue-400' : 'bg-blue-500')
                    : (isDarkMode ? 'bg-gray-600 hover:bg-gray-500' : 'bg-gray-300 hover:bg-gray-400')
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

  return (
    <>
      {/* Main card container with proper width constraints */}
      <div
        className={`rounded-lg ${isDarkMode ? 'bg-gray-800 shadow-dark' : 'bg-white shadow'} mb-4 ${isMobile ? 'p-3' : isTablet ? 'p-4' : 'p-5'}`}
        style={{
          width: '100%',
          maxWidth: '100%',
          minWidth: 0,
          overflow: 'hidden'
        }}
      >
        {/* Header section */}
        <div className="flex justify-between items-center mb-3" style={{ minWidth: 0, width: '100%' }}>
          <div className="flex items-center gap-2" style={{ minWidth: 0, flex: 1 }}>
            {renderAuthorAvatar()}
            <div className="flex flex-col items-start" style={{ minWidth: 0, flex: 1 }}>
              <span
                className={`font-medium ${isMobile ? 'text-xs' : 'text-base'} ${isDarkMode ? 'text-gray-200' : 'text-gray-900'}`}
                style={{
                  wordBreak: 'break-word',
                  overflowWrap: 'break-word'
                }}
              >
                {author.userName || author.name || "User"}
              </span>
              <span className={`${isMobile ? 'text-xs' : 'text-sm'} ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                {postData.isSavedPost
                  ? `Saved ${postData.savedAt}`
                  : (formatDate(postData.createdAt))}
              </span>
            </div>
          </div>

          <Dropdown
            menu={{
              items: menuItems,
              onClick: handleOptionSelect,
              className: isDarkMode ? 'dark-dropdown' : ''
            }}
            placement="bottomRight"
            trigger={['click']}
          >
            <button className={`font-bold p-1 rounded ${isDarkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100'} cursor-pointer`}>
              <AiOutlineEllipsis className={`${isMobile ? 'w-4 h-4' : 'w-5 h-5'} ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`} />
            </button>
          </Dropdown>
        </div>

        {/* Content section with proper width constraints */}
        <div style={{ width: '100%', minWidth: 0, overflow: 'hidden' }}>
          {renderTitle()}
          {renderContent()}
        </div>

        {renderImageGrid}

        <div className="flex justify-between items-center">
          <div className="flex items-center gap-4 sm:gap-6">
            <button onClick={handleLike} className={`flex items-center cursor-pointer ${isDarkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100'} p-1 rounded`}>
              {isLikedByUser ?
                <FaHeart className={`${isMobile ? 'w-4 h-4' : 'w-5 h-5'} text-red-500`} /> :
                <FaRegHeart className={`${isMobile ? 'w-4 h-4' : 'w-5 h-5'} ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`} />
              }
              <span className={`ml-1 ${isMobile ? 'text-xs' : 'text-sm'} ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>{likesCount}</span>
            </button>

            <button onClick={handleCommentClick} className={`flex items-center cursor-pointer ${isDarkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100'} p-1 rounded`}>
              <Image src={isDarkMode ? "/icons/commentdark.png" : "/icons/message.png"} width={20} height={20} alt="message icons" />
              <span className={`ml-1 -mt-[1px] ${isMobile ? 'text-xs' : 'text-sm'} ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>{commentsCount}</span>
            </button>

            {renderTags()}
          </div>

          <div className="flex items-center gap-3">
            <div className={`flex items-center gap-1 ${isMobile ? 'text-xs' : 'text-sm'} ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
              {isDarkMode ? <PostSEEDark /> : <PostSEELight />}
              <span>{postData?.views}</span>
            </div>

            <button onClick={handleShare} className={`${isDarkMode ? 'text-gray-400 hover:bg-gray-700' : 'text-gray-500 hover:bg-gray-100'} px-2 py-1.5 cursor-pointer rounded-sm`}>
              <Image src={isDarkMode ? "/icons/sharedark.png" : "/icons/share.png"} width={20} height={20} alt="share button" />
            </button>
          </div>
        </div>
      </div>

      <EditPostModal
        visible={editModalVisible}
        onClose={() => setEditModalVisible(false)}
        postData={postData}
        isDarkMode={isDarkMode}
      />

      {showImageModal && postData.images && postData.images.length > 0 && (
        <ImageModal
          images={postData.images}
          currentIndex={currentImageIndex}
          onClose={handleCloseModal}
          onNext={handleNextImage}
          onPrev={handlePrevImage}
          isDarkMode={isDarkMode}
        />
      )}

      <ReportPostModal
        isOpen={showReportModal}
        onClose={() => setShowReportModal(false)}
        postId={postData._id}
        isDarkMode={isDarkMode}
      />
    </>
  );
};

export default AuthorPostCard;