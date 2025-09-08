"use client";
import { useMyPostQuery } from '@/features/post/postApi';
import { Dropdown, Form, Input } from 'antd';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useEffect, useMemo, useRef, useState } from 'react';
import toast from 'react-hot-toast';
import { AiOutlineEllipsis } from 'react-icons/ai';
import { FaRegBookmark } from "react-icons/fa";
import { FiFlag } from "react-icons/fi";
import { getImageUrl } from '../../utils/getImageUrl';
import { DarkModeCommentIcon, DarkModeHeartIcon, DarkModeSeeIcon, LightModeCommentIcon, LightModeHeartIcon, LightModeSeeIcon } from '../../utils/svgImage';
import EditPostModal from './EditPostModal';
import ReportPostModal from './ReportPostModal';

const { TextArea } = Input;

const ProfilePostCard = ({
  postData,
  onLike,
  onOptionSelect,
  onUnsave,
  currentUser = { name: "User", avatar: "" },
  isDarkMode,
  refetchPosts,
  myCommentPostRefetch,
  isGridView = false // Add this prop to determine if it's in grid view
}) => {

  const router = useRouter();
  const [windowSize, setWindowSize] = useState({
    width: typeof window !== 'undefined' ? window.innerWidth : 0,
    height: typeof window !== 'undefined' ? window.innerHeight : 0
  });

  const loginUserPost = postData?.author?._id === localStorage.getItem("login_user_id");
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [reportModalVisible, setReportModalVisible] = useState(false);
  const [reportForm] = Form.useForm();
  const dropdownRef = useRef(null);
  const login_user_id = typeof window !== 'undefined' ? localStorage.getItem("login_user_id") : null;

  const { data } = useMyPostQuery();

  const isLikedByUser = postData?.likes?.some(userId => userId === login_user_id);
  const isOwnPost = postData?.author?._id === login_user_id;

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

  if (!postData) {
    return null;
  }

  const handlePostDetails = () => {
    const postSlug = postData.slug;
    router.push(`/posts/${postSlug}`);
  };

  const handleCommentClick = () => {
    const postSlug = postData?.slug;
    router.push(`/posts/${postSlug}#comments`);
  };

  const handleLike = () => onLike?.(postData._id);

  const handleShare = async () => {
    const postId = postData._id;
    const url = `https://mehor.com/posts/${postData?.slug}`;

    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(url);
        toast.success("Link copied successfully");
      } else {
        // Fallback for browsers that don't support clipboard API
        const textArea = document.createElement('textarea');
        textArea.value = url;
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
        toast.success("Link copied successfully");
      }
    } catch (err) {
      toast.error("Failed to copy link");
      console.error('Failed to copy: ', err);
    }
  };

  const handleOptionSelect = ({ key }) => {
    if (key === 'edit') {
      setEditModalVisible(true);
    } else if (key === 'unsave') {
      onUnsave?.(postData._id);
    } else if (key === 'report') {
      setReportModalVisible(true);
    } else {
      onOptionSelect?.(postData._id, key);
    }
  };

  // Add this function at the top of your component
  const cleanPostContent = (content) => {
    if (!content) return '';

    // Remove Froala "Powered by" footer
    return content.replace(
      /<p[^>]*>Powered by <a[^>]*>Froala Editor<\/a><\/p>/gi,
      ''
    ).trim();
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
        <div className={`${isMobile ? 'w-6 h-6' : 'w-8 h-8'} rounded-full ${isDarkMode ? 'bg-gray-600' : 'bg-gray-300'} flex items-center justify-center text-xs`}>
          {author?.name?.charAt(0).toUpperCase() || author.name?.charAt(0).toUpperCase() || 'A'}
        </div>
      )
    );
  };

  const renderContent = () => {
    const content = cleanPostContent(postData.content) || '';
    const plainContent = content.replace(/<[^>]+>/g, '');

    // If in grid view, show limited content
    if (isGridView) {
      return (
        <div className={`mb-3 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'} text-sm`}>
          {plainContent.split(' ').length > 15 ? (
            <>
              {plainContent.split(' ').slice(0, 15).join(' ')}...
              <button
                className={`${isDarkMode ? 'text-blue-400 hover:text-blue-300' : 'text-blue-600 hover:text-blue-800'} cursor-pointer font-medium ml-1`}
                onClick={handlePostDetails}
              >
                See more
              </button>
            </>
          ) : (
            plainContent
          )}
        </div>
      );
    }

    return (
      <div className={`mb-3 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'} ${isMobile ? 'text-sm' : 'text-base'}`}>
        {plainContent.split(' ').length > 20 ? (
          <>
            {plainContent.split(' ').slice(0, 20).join(' ')}...
            <button
              className={`${isDarkMode ? 'text-blue-400 hover:text-blue-300' : 'text-blue-600 hover:text-blue-800'} cursor-pointer font-medium ml-1`}
              onClick={handleCommentClick}
            >
              See more
            </button>
          </>
        ) : (
          plainContent
        )}
      </div>
    );
  };

  const renderImageGrid = useMemo(() => (
    postData.images && postData.images.length > 0 && (
      <div className="mb-4 rounded-lg overflow-hidden">
        {postData.images.length === 1 ? (
          <img
            src={getImageUrl(postData.images[0])}
            alt="Post content"
            className={`w-full ${isGridView ? 'max-h-[250px]' : 'max-h-[500px]'} object-cover cursor-pointer`}
            onClick={handlePostDetails}
          />
        ) : postData.images.length === 2 ? (
          <div className={`flex gap-1 ${isGridView ? 'h-[200px]' : 'h-[350px]'}`}>
            <img
              src={getImageUrl(postData.images[0])}
              alt="Post content 1"
              className="w-1/2 h-full object-cover cursor-pointer"
              onClick={handlePostDetails}
            />
            <img
              src={getImageUrl(postData.images[1])}
              alt="Post content 2"
              className="w-1/2 h-full object-cover cursor-pointer"
              onClick={handlePostDetails}
            />
          </div>
        ) : postData.images.length === 3 ? (
          <div className={`flex gap-1 ${isGridView ? 'h-[200px]' : 'h-[350px]'}`}>
            <div className="w-1/2 h-full">
              <img
                src={getImageUrl(postData.images[0])}
                alt="Post content 1"
                className="w-full h-full object-cover cursor-pointer"
                onClick={handlePostDetails}
              />
            </div>
            <div className="w-1/2 flex flex-col gap-1">
              <img
                src={getImageUrl(postData.images[1])}
                alt="Post content 2"
                className="w-full h-1/2 object-cover cursor-pointer"
                onClick={handlePostDetails}
              />
              <img
                src={getImageUrl(postData.images[2])}
                alt="Post content 3"
                className="w-full h-1/2 object-cover cursor-pointer"
                onClick={handlePostDetails}
              />
            </div>
          </div>
        ) : postData.images.length >= 4 ? (
          <div className={`grid grid-cols-2 gap-1 ${isGridView ? 'h-[200px]' : 'h-[350px]'}`}>
            {postData.images.slice(0, 4).map((image, index) => (
              <div key={index} className="relative">
                <img
                  src={getImageUrl(image)}
                  alt={`Post content ${index + 1}`}
                  className={`w-full h-full object-cover cursor-pointer ${index === 3 && postData.images.length > 4 ? 'opacity-80' : ''}`}
                  onClick={handlePostDetails}
                />
                {index === 3 && postData.images.length > 4 && (
                  <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center text-white text-2xl font-bold cursor-pointer" onClick={handlePostDetails}>
                    +{postData.images.length - 4}
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : null}
      </div>
    )
  ), [postData.images, isGridView]);

  const renderTags = () => {
    return (
      <div className="flex-shrink-0 max-w-full">
        <div className="flex space-x-2">
          {postData?.category && (
            <span
              className={`text-xs py-1 px-2 rounded-full truncate ${isDarkMode
                ? 'bg-gradient-to-r from-blue-400 to-blue-600 text-white border border-blue-500'
                : 'bg-gradient-to-r from-blue-500 to-blue-600 text-white border border-blue-400'
                }`}
              style={{ maxWidth: isGridView ? '100px' : '280px' }}
              title={postData?.category.name} // Show full text on hover
            >
              {postData?.category.name}
            </span> 
          )}
          {postData?.subCategory && (
            <span
              className={`text-xs py-1 px-2 rounded-full truncate ${isDarkMode
                ? 'bg-gradient-to-r from-blue-700 to-blue-800 text-white border border-blue-600'
                : 'bg-gradient-to-r from-blue-600 to-blue-800 text-white border border-blue-500'
                }`}
              style={{ maxWidth: isGridView ? '100px' : '280px' }}
              title={postData?.subCategory.name} // Show full text on hover
            >
              {postData?.subCategory.name}
            </span>
          )}
        </div>
      </div>
    );
  };

  const menuItems = isOwnPost ? [
    {
      key: 'delete',
      label: (
        <div className={`flex items-center gap-2 py-1 ${isDarkMode ? '' : 'hover:bg-gray-100'}`}>
          <span>✕</span>
          <span className={isDarkMode ? 'text-gray-200' : ''}>Delete Post</span>
        </div>
      ),
    },
    {
      key: 'edit',
      label: (
        <div className={`flex items-center gap-2 py-1 ${isDarkMode ? '' : 'hover:bg-gray-100'}`}>
          <Image
            src={isDarkMode ? "/icons/DarkEdit.png" : "/icons/LightEdit.png"}
            width={17}
            height={17}
            alt="Edit post"
          />
          <span className={`-mt-1 ${isDarkMode ? 'text-gray-200' : ''}`}>Edit Post</span>
        </div>
      ),
    },
    // Add unsave option if it's a saved post
    ...(postData.isSavedPost ? [{
      key: 'unsave',
      label: (
        <div className={`flex items-center gap-2 py-1 ${isDarkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100'}`}>
          <FaRegBookmark className={isDarkMode ? 'text-gray-300' : 'text-gray-600'} />
          <span className={isDarkMode ? 'text-gray-200' : ''}>Unsave Post</span>
        </div>
      ),
    }] : [])
  ] : postData.isSavedPost ? [
    {
      key: 'unsave',
      label: (
        <div className={`flex items-center gap-2 py-1 ${isDarkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100'}`}>
          <FaRegBookmark className={isDarkMode ? 'text-gray-300' : 'text-gray-600'} />
          <span className={isDarkMode ? 'text-gray-200' : ''}>Unsave Post</span>
        </div>
      ),
    },
    {
      key: 'report',
      label: (
        <div className={`flex items-center gap-2 py-1 ${isDarkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100'}`}>
          <FiFlag className={isDarkMode ? 'text-gray-300' : 'text-gray-600'} />
          <span className={isDarkMode ? 'text-gray-200' : ''}>Report Post</span>
        </div>
      ),
    }
  ] : [
    {
      key: 'report',
      label: (
        <div className={`flex items-center gap-2 py-1 ${isDarkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100'}`}>
          <FiFlag className={isDarkMode ? 'text-gray-300' : 'text-gray-600'} />
          <span className={isDarkMode ? 'text-gray-200' : ''}>Report Post</span>
        </div>
      ),
    }
  ];

  const author = postData.author || {};
  const commentsCount = postData.comments?.length || 0;
  const likesCount = postData.likes?.length || 0;
  const readsCount = postData.reads || 0;

  return (
    <>
      <div className={`rounded-lg shadow mb-4 h-fit ${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} ${isGridView ? 'p-3' : isMobile ? 'p-3' : isTablet ? 'p-4' : 'p-5'}`}>
        <div className="flex justify-between items-center mb-3">
          <div className="flex items-center gap-2">
            {renderAuthorAvatar()}
            <div className="flex flex-col items-start">
              <span className={`font-medium ${isGridView ? 'text-xs' : isMobile ? 'text-xs' : 'text-base'} ${isDarkMode ? 'text-gray-200' : 'text-gray-900'}`}>
                {author.name ? author.name : author.username || author.userName}
              </span>
              <span className={`${isGridView ? 'text-xs' : isMobile ? 'text-xs' : 'text-sm'} ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                {postData.isSavedPost
                  ? `Saved ${postData.savedAt}`
                  : (postData.createdAt || postData.timePosted || "Just now")}
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
            overlayClassName={isDarkMode ? 'dark-dropdown-overlay' : ''}
          >
            <button className={`font-bold p-1 rounded ${isDarkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100'} cursor-pointer`}>
              <AiOutlineEllipsis className={`${isGridView ? 'w-4 h-4' : isMobile ? 'w-4 h-4' : 'w-5 h-5'} ${isDarkMode ? 'text-gray-200' : 'text-gray-900'}`} />
            </button>
          </Dropdown>
        </div>

        {postData.title && (
          <h2
            onClick={handlePostDetails}
            className={`${isGridView ? 'text-base' : isMobile ? 'text-lg' : isTablet ? 'text-xl' : 'text-2xl'} cursor-pointer ${isDarkMode ? 'text-white hover:text-blue-300' : 'text-black hover:text-blue-800'} font-bold mb-3`}
          >
            {postData.title}
          </h2>
        )}

        {renderContent()}

        {renderImageGrid}

        {/* Mobile view tags - only show in list view */}
        {!isGridView && (
          <div className='sm:hidden block mb-3'>
            <div className='flex justify-center items-center text-center gap-2 py-2'>
              {postData?.category && (
                <span
                  className={`text-xs py-1 px-2 rounded-full ${isDarkMode
                    ? 'bg-gradient-to-r from-blue-400 to-blue-600 text-white border border-blue-500'
                    : 'bg-gradient-to-r from-blue-500 to-blue-600 text-white border border-blue-400'
                    }`}
                >
                  {postData?.category.name}
                </span>
              )}
              {postData?.subCategory && (
                <span
                  className={`text-xs py-1 px-2 rounded-full ${isDarkMode
                    ? 'bg-gradient-to-r from-blue-700 to-blue-800 text-white border border-blue-600'
                    : 'bg-gradient-to-r from-blue-600 to-blue-800 text-white border border-blue-500'
                    }`}
                >
                  {postData?.subCategory.name}
                </span>
              )}
            </div>
          </div>
        )}

        <div className="flex justify-between items-center">
          <div className="flex items-center gap-4 sm:gap-6">
            <button
              onClick={handleLike}
              className={`flex items-center cursor-pointer ${isDarkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100'} p-1 rounded`}
            >
              <div className={`${isGridView ? 'w-4 h-4' : isMobile ? 'w-4 h-4' : 'w-5 h-5'} flex items-center justify-center`}>
                {isDarkMode ? (
                  <DarkModeHeartIcon filled={isLikedByUser} />
                ) : (
                  <LightModeHeartIcon filled={isLikedByUser} />
                )}
              </div>
              <span className={`ml-1 ${isGridView ? 'text-xs' : isMobile ? 'text-xs' : 'text-sm'} ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>{likesCount}</span>
            </button>

            <button
              onClick={handleCommentClick}
              className={`flex items-center cursor-pointer ${isDarkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100'} p-1 rounded`}
            >
              {isDarkMode ? <DarkModeCommentIcon /> : <LightModeCommentIcon />}
              <span className={`ml-1 -mt-[1px] ${isGridView ? 'text-xs' : isMobile ? 'text-xs' : 'text-sm'} ${isDarkMode ? '' : 'text-gray-700'}`}>{commentsCount}</span>
            </button>

            {/* Desktop view tags - only show in list view */}
            {(
              <div className=''>
                {renderTags()}
              </div>
            )}
          </div>

          <div className="flex items-center gap-3">
            <div className={`flex items-center gap-1 ${isGridView ? 'text-xs' : isMobile ? 'text-xs' : 'text-sm'} ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
              {isDarkMode ? <DarkModeSeeIcon /> : <LightModeSeeIcon />}
              <span>{postData?.views}</span>
            </div>

            <button
              onClick={handleShare}
              className={`${isDarkMode ? 'text-gray-400 hover:bg-gray-700' : 'text-gray-500 hover:bg-gray-100'} px-2 py-1.5 cursor-pointer rounded-sm`}
            >
              <Image
                src={isDarkMode ? "/icons/action/darkShare.png" : "/icons/action/lightShare.png"}
                width={isGridView ? 16 : 20}
                height={isGridView ? 16 : 20}
                alt="share button"
              />
            </button>
          </div>
        </div>
      </div>

      <EditPostModal
        visible={editModalVisible}
        onClose={() => setEditModalVisible(false)}
        postData={postData}
        isDarkMode={isDarkMode}
        refetchPosts={refetchPosts}
        myCommentPostRefetch={myCommentPostRefetch}
      />

      <ReportPostModal
        isOpen={reportModalVisible}
        onClose={() => setReportModalVisible(false)}
        postId={postData._id}
        isDarkMode={isDarkMode}
        title={"Post"}
      />
    </>
  );
};

export default ProfilePostCard;