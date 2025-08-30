"use client";
import { useGetSaveAllPostQuery, useSavepostMutation } from '@/features/SavePost/savepostApi';
import { Dropdown } from 'antd';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import React, { useCallback, useContext, useEffect, useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import { AiOutlineEllipsis } from 'react-icons/ai';
import { FaHeart, FaRegHeart } from "react-icons/fa";
import { isAuthenticated } from '../../utils/auth';
import { getImageUrl } from '../../utils/getImageUrl';
import { setPosts } from '../../utils/postCache';
import { PostSEEDark, PostSEELight } from '../../utils/svgImage';
import { ThemeContext } from '../app/ClientLayout';
import ImageModal from './PostCard/components/ImageModal';
import ReportPostModal from './ReportPostModal';

const useWindowSize = () => {
  const [windowSize, setWindowSize] = useState({
    width: typeof window !== 'undefined' ? window.innerWidth : 0,
    height: typeof window !== 'undefined' ? window.innerHeight : 0
  });

  const handleResize = useCallback(() => {
    setWindowSize({
      width: window.innerWidth,
      height: window.innerHeight
    });
  }, []);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      window.addEventListener('resize', handleResize);
      return () => window.removeEventListener('resize', handleResize);
    }
  }, [handleResize]);

  return windowSize;
};

// Image Modal Component


const PostCard = ({
  postData,
  onLike,
  onCommentSubmit,
  onRepost,
  currentUser = {}
}) => {

  const router = useRouter();
  const [commentText, setCommentText] = useState('');
  const [showReportModal, setShowReportModal] = useState(false);
  const [showImageModal, setShowImageModal] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const windowSize = useWindowSize();
  const { isDarkMode } = useContext(ThemeContext);

  const [isSaving, setIsSaving] = useState(false);
  const [savepost] = useSavepostMutation();
  const { data: savedPosts } = useGetSaveAllPostQuery();

  const loginUserPost = postData?.author?.id === localStorage.getItem("login_user_id");

  const isSaved = useMemo(() =>
    savedPosts?.data?.some(savedPost => savedPost?.postId?._id === postData?.id),
    [savedPosts, postData]
  );

  const isMobile = windowSize.width < 640;
  const isTablet = windowSize.width >= 640 && windowSize.width < 1024;

  const isOwnPost = useMemo(() =>
    postData?.author?.id === currentUser?.id,
    [postData?.author?.id, currentUser?.id]
  );

  const handleImageClick = useCallback((index) => {
    console.log('Image clicked, index:', index);
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

  const handlePostDetails = useCallback(() => {
    if (!isAuthenticated()) {
      router.push(`/auth/login`);
      return;
    } else {
      router.push(`/posts/${postData.id}`);
      // <Link key={postData._id} href={`/posts/${postData.title}`}>
      //   {postData.title}
      // </Link>
    }
  }, [postData.id, router]);

  setPosts(postData);

  const handleCommentClick = useCallback(() => {
    if (!isAuthenticated()) {
      router.push(`/auth/login`);
      return;
    } else {
      router.push(`/posts/${postData.id}#comments`);
    }
  }, [postData.id, router]);

  const handleLike = useCallback(() => {
    if (!isAuthenticated()) {
      router.push(`/auth/login`);
      return;
    } else {
      onLike?.(postData.id);
    }
  }, [onLike, postData.id]);

  const handleRepost = useCallback(() => {
    if (isOwnPost) return;
    onRepost?.(postData.id);
  }, [onRepost, postData.id, isOwnPost]);

  const handleShare = useCallback(async () => {
    try {
      if (!postData?.id) {
        toast.error("Post ID is missing");
        return;
      }
      const shareUrl = `${window.location.origin}/posts/${postData.id}`;
      if (!navigator.clipboard) {
        const textArea = document.createElement('textarea');
        textArea.value = shareUrl;
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
        toast.success("Link copied to clipboard");
        return;
      }
      await navigator.clipboard.writeText(shareUrl);
      toast.success("Link copied to clipboard");
    } catch (error) {
      console.error("Failed to copy link:", error);
      toast.error("Failed to copy link");
    }
  }, [postData.id]);

  const handleSaveUnsave = useCallback(async () => {
    if (!isAuthenticated()) {
      router.push('/auth/login');
      return;
    } else {
      setIsSaving(true);
      try {
        await savepost({ postId: postData.id }).unwrap();
        toast.success(isSaved ? 'Post removed from saved items' : 'Post saved successfully');
      } catch (error) {
        console.error('Save/Unsave error:', error);
        toast.error('Failed to update saved status');
      } finally {
        setIsSaving(false);
      }
    }
  }, [postData.id, isSaved, savepost]);

  const menuItems = useMemo(() => [
    {
      key: 'save',
      label: (
        <div className="flex items-center gap-2 py-1">
          <Image
            src={isDarkMode ? "/icons/savedark.png" : "/icons/savelight.png"}
            width={isDarkMode ? 13 : 16}
            height={16}
            alt={isSaved ? "Unsave post" : "Save post"}
          />
          <span className={`-mt-1 ${isDarkMode ? 'text-gray-200' : 'text-gray-800'}`}>
            {isSaving ? 'Processing...' : isSaved ? 'Unsave Post' : 'Save Post'}
          </span>
        </div>
      ),
    },

    !loginUserPost && {
      key: 'report',
      label: (
        <div className="flex items-center gap-2 py-1">
          <Image
            src={isDarkMode ? "/icons/reportdark.png" : "/icons/report.png"}
            width={16}
            height={16}
            alt="Report post"
          />
          <span className={`-mt-1 ${isDarkMode ? 'text-gray-200' : 'text-gray-800'}`}>
            Report Post
          </span>
        </div>
      ),
    },
  ].filter(Boolean), [isSaved, isSaving, isDarkMode, loginUserPost]);

  const handleMenuClick = useCallback(({ key }) => {
    if (key === 'save') {
      handleSaveUnsave();
    } else if (key === 'report') {
      setShowReportModal(true);
    }
  }, [handleSaveUnsave]);




  const renderAuthorAvatar = useMemo(() => (
    postData.author.avatar ? (
      <img
        src={getImageUrl(postData.author.avatar)}
        alt="Author avatar"
        className={`${isMobile ? 'w-6 h-6' : 'w-8 h-8'} rounded-full cursor-pointer`}
      />
    ) : (
      <div className={`${isMobile ? 'w-6 h-6' : 'w-8 h-8'} rounded-full ${isDarkMode ? 'bg-gray-600' : 'bg-gray-300'
        } flex items-center justify-center text-xs ${isDarkMode ? 'text-gray-200' : 'text-white'
        }`}>
        {postData.author.username?.charAt(0).toUpperCase() || 'A'}
      </div>
    )
  ), [postData.author, isMobile, isDarkMode]);

  const renderContent = useMemo(() => {
    if (!postData.content) return null;

    // First remove "Powered by Froala Editor" completely
    let cleanedContent = postData.content.replace(/Powered by Froala Editor/gi, '');

    // Then remove all HTML tags
    cleanedContent = cleanedContent.replace(/<[^>]+>/g, '');

    // Handle the word count logic
    if (cleanedContent.split(' ').length > 20) {
      return (
        <>
          {cleanedContent.split(' ').slice(0, 20).join(' ')}...
          <span onClick={handleCommentClick} style={{ color: isDarkMode ? 'lightblue' : 'blue', cursor: 'pointer' }}>
            See more
          </span>
        </>
      );
    }

    return cleanedContent;
  }, [postData.content, isMobile, handleCommentClick, isDarkMode]);

  const renderTags = useMemo(() => (
    postData.tags?.length > 0 && (
      <div className="flex flex-wrap items-center gap-2">
        {postData.tags.map((tag, index) => (
          <div key={index} className='flex items-center gap-2'>
            {tag.category && (
              <span
                className={`text-xs py-1 px-2 rounded ${isDarkMode
                  ? 'bg-gray-700 text-blue-400 border border-gray-600'
                  : 'bg-[#E6E6FF] text-gray-800 border border-gray-200'
                  }`}
              >
                {tag.category}
              </span>
            )}
            {tag.subcategory && (
              <span
                className={`text-xs py-1 px-2 rounded ${isDarkMode
                  ? 'bg-gray-700 text-blue-400 border border-gray-600'
                  : 'bg-[#E6E6FF] text-gray-800 border border-gray-200'
                  }`}
              >
                {tag.subcategory}
              </span>
            )}
          </div>
        ))}
      </div>
    )
  ), [postData.tags, isDarkMode]);

  const renderImageGrid = useMemo(() => (
    postData.images && postData.images.length > 0 && (
      <div className="mb-4 rounded-lg overflow-hidden">
        {postData.images.length === 1 ? (
          <div className="h-[250px]">
            <img
              src={getImageUrl(postData.images[0])}
              alt="Post content"
              className="w-full h-full object-cover cursor-pointer hover:opacity-90 transition-opacity rounded-lg"
              onClick={() => handleImageClick(0)}
            />
          </div>
        ) : postData.images.length === 2 ? (
          <div className="flex gap-2 h-[300px]">
            <img
              src={getImageUrl(postData.images[0])}
              alt="Post content 1"
              className="w-1/2 h-full object-cover cursor-pointer hover:opacity-90 transition-opacity rounded-lg"
              onClick={() => handleImageClick(0)}
            />
            <img
              src={getImageUrl(postData.images[1])}
              alt="Post content 2"
              className="w-1/2 h-full object-cover cursor-pointer hover:opacity-90 transition-opacity rounded-lg"
              onClick={() => handleImageClick(1)}
            />
          </div>
        ) : postData.images.length === 3 ? (
          <div className="flex gap-2 h-[300px]">
            <div className="w-1/2 h-full">
              <img
                src={getImageUrl(postData.images[0])}
                alt="Post content 1"
                className="w-full h-full object-cover cursor-pointer hover:opacity-90 transition-opacity rounded-lg"
                onClick={() => handleImageClick(0)}
              />
            </div>
            <div className="w-1/2 flex flex-col gap-2">
              <img
                src={getImageUrl(postData.images[1])}
                alt="Post content 2"
                className="w-full h-1/2 object-cover cursor-pointer hover:opacity-90 transition-opacity rounded-lg"
                onClick={() => handleImageClick(1)}
              />
              <img
                src={getImageUrl(postData.images[2])}
                alt="Post content 3"
                className="w-full h-1/2 object-cover cursor-pointer hover:opacity-90 transition-opacity rounded-lg"
                onClick={() => handleImageClick(2)}
              />
            </div>
          </div>
        ) : postData.images.length >= 4 ? (
          <div className="grid grid-cols-2 gap-2 h-[300px]">
            {postData.images.slice(0, 4).map((image, index) => (
              <div key={index} className="relative">
                <img
                  src={getImageUrl(image)}
                  alt={`Post content ${index + 1}`}
                  className={`w-full h-full object-cover cursor-pointer hover:opacity-90 transition-opacity rounded-lg ${index === 3 && postData.images.length > 4 ? 'opacity-80' : ''
                    }`}
                  onClick={() => handleImageClick(index)}
                />
                {index === 3 && postData.images.length > 4 && (
                  <div
                    className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center text-white text-2xl font-bold cursor-pointer hover:bg-opacity-40 transition-all rounded-lg"
                    onClick={() => handleImageClick(index)}
                  >
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

  return (
    <>
      <div className={`rounded-lg shadow mb-4 transition-colors ${isMobile ? 'p-3' : isTablet ? 'p-4' : 'p-5'
        } ${isDarkMode
          ? 'bg-gray-800 border border-gray-700 shadow-gray-900/20'
          : 'bg-white border border-gray-200 shadow-gray-200/50'
        }`}>
        <div className="flex justify-between items-center mb-3">
          <div
            onClick={() => router.push(`profiles/${postData?.author?.id}`)}
            className="flex items-center gap-2 cursor-pointer"
          >
            {renderAuthorAvatar}
            <div className="flex flex-col justify-start items-start">
              <span className={`font-medium cursor-pointer transition-colors ${isMobile ? 'text-xs' : 'text-base'
                } ${isDarkMode
                  ? 'text-gray-200 hover:text-blue-400'
                  : 'text-gray-800 hover:text-blue-600'
                }`}>
                {postData.author.username || postData.author.name}
              </span>
              <span className={`${isMobile ? 'text-xs' : 'text-sm'} ${isDarkMode ? 'text-gray-400' : 'text-gray-500'
                }`}>
                {postData.timePosted}
              </span>
            </div>
          </div>

          <Dropdown
            menu={{
              items: menuItems,
              onClick: handleMenuClick,
              className: isDarkMode ? 'dark-dropdown' : '',
              style: isDarkMode ? {
                backgroundColor: '#1F2937',
                border: '1px solid #374151'
              } : {}
            }}
            placement="bottomRight"
            trigger={['click']}
            overlayClassName={isDarkMode ? 'dark-dropdown-overlay' : ''}
          >
            <button className={`font-bold p-2 rounded transition-colors ${isDarkMode
              ? 'hover:bg-gray-700 text-gray-400 hover:text-gray-200'
              : 'hover:bg-gray-100 text-gray-600 hover:text-gray-800'
              } cursor-pointer`}>
              <AiOutlineEllipsis className={`${isMobile ? 'w-4 h-4' : 'w-5 h-5'}`} />
            </button>
          </Dropdown>
        </div>

        {/* {postData.title && (
          <h2
            onClick={handlePostDetails}
            className={`${isMobile ? 'text-lg' : isTablet ? 'text-xl' : 'text-2xl'
              } cursor-pointer transition-colors ${isDarkMode
                ? 'text-gray-100 hover:text-blue-400'
                : 'text-gray-800 hover:text-blue-700'
              } font-bold mb-3`}
          >
            {postData.title}
          </h2>
        )} */}

        {renderContent}

        {renderImageGrid}

        <div className="flex justify-between items-center">
          <div className="flex items-center gap-4 sm:gap-6">
            <button
              onClick={handleLike}
              className={`flex items-center cursor-pointer p-2 rounded transition-colors ${isDarkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100'
                }`}
            >
              {postData.isLiked ? (
                <FaHeart className={`${isMobile ? 'w-4 h-4' : 'w-5 h-5'} text-red-500`} />
              ) : (
                <FaRegHeart className={`${isMobile ? 'w-4 h-4' : 'w-5 h-5'} ${isDarkMode ? 'text-gray-400' : 'text-gray-500'
                  }`} />
              )}
              <span className={`ml-1 ${isMobile ? 'text-xs' : 'text-sm'} ${isDarkMode ? 'text-gray-300' : 'text-gray-700'
                }`}>
                {postData.stats.likes || 0}
              </span>
            </button>

            <button
              onClick={handleCommentClick}
              className={`flex items-center cursor-pointer p-2 rounded transition-colors ${isDarkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100'
                }`}
            >
              <Image
                src={isDarkMode ? "/icons/commentdark.png" : "/icons/message.png"}
                width={20}
                height={20}
                alt="message icon"
              />
              <span className={`ml-1 -mt-[1px] ${isMobile ? 'text-xs' : 'text-sm'} ${isDarkMode ? 'text-gray-300' : 'text-gray-700'
                }`}>
                {postData.stats.comments || 0}
              </span>
            </button>

            {renderTags}
          </div>

          <div className="flex items-center gap-3">
            <div className={`flex items-center gap-1.5 ${isMobile ? 'text-xs' : 'text-sm'} ${isDarkMode ? 'text-gray-400' : 'text-gray-500'
              }`}>
              {isDarkMode ? <PostSEEDark /> : <PostSEELight />}
              <span>{postData.stats.reads}</span>
            </div>

            <button
              onClick={handleShare}
              className={`px-2 py-2 cursor-pointer rounded transition-colors ${isDarkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100'
                }`}
            >
              <Image
                src={isDarkMode ? "/icons/sharedark.png" : "/icons/share.png"}
                width={20}
                height={20}
                alt="share button"
              />
            </button>
          </div>
        </div>
      </div>

      {/* Image Modal */}
      {showImageModal && postData.images && postData.images.length > 0 && (
        <ImageModal
          images={postData.images.map(img => getImageUrl(img))}
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
        postId={postData.id}
        isDarkMode={isDarkMode}
        title={"Post"}
      />
    </>
  );
};

export default React.memo(PostCard);