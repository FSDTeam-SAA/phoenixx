import Image from 'next/image';
import { useState } from 'react';
import { DarkModeCommentIcon, DarkModeHeartIcon, DarkModeSeeIcon, LightModeCommentIcon, LightModeHeartIcon, LightModeSeeIcon } from '../../../../utils/svgImage';
import PostCardTags from './PostCardTags';


const PostCardActions = ({
  postData,
  isDarkMode,
  isMobile,
  handleLike,
  handleCommentClick,
  handleShare,
  likePostLoading
}) => {
  // Animation state for like button
  const [isLiking, setIsLiking] = useState(false);

  const handleLikeClick = () => {
    setIsLiking(true);
    handleLike(postData.id);
    setTimeout(() => setIsLiking(false), 300);
  };

  return (
    <>
      <div className="sm:hidden block pb-2">
        <PostCardTags postData={postData} isDarkMode={isDarkMode} />
      </div>
      <div className="flex justify-between items-center w-full gap-4">
        {/* Left Actions (Like, Comment, Tags) */}
        <div className="flex items-center w-full gap-4">
          {/* Like Button */}
          <button
            onClick={handleLikeClick}
            disabled={likePostLoading}
            className={`flex items-center cursor-pointer p-1.5 sm:p-2 rounded-full transition-all ${isDarkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100'
              } ${isLiking ? 'transform scale-110' : ''}`}
            aria-label={postData.isLiked ? 'Unlike post' : 'Like post'}
          >
            <div className={`${isMobile ? 'w-4 h-4' : 'w-5 h-5'} md:h-6 md:w-6 flex items-center justify-center transition-colors ${isLiking ? 'animate-pulse' : ''
              }`}>
              {isDarkMode ? 
                <Image className='bg-transparent w-full h-full dark:invert-100 object-cover' src='/icon/love-removebg-preview.png' alt='notification' width={40} height={40} /> :<Image className='bg-transparent w-full h-full  object-cover ' src='/icon/love-removebg-preview.png' alt='notification' width={40} height={40} />
              }
            </div>
            <span className={`ml-1.5 ${isMobile ? 'text-xs' : 'text-sm'} ${isDarkMode ? 'text-gray-300' : 'text-gray-700'
              }`}>
              {postData.stats.likes?.toLocaleString() || 0}
            </span>
          </button>

          {/* Comment Button */}
          <button
            onClick={handleCommentClick}
            className={`flex items-center cursor-pointer p-1.5 sm:p-2 rounded-full transition-colors ${isDarkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100'
              }`}
            aria-label="View comments"
          >
            <div className={`${isMobile ? 'w-4 h-4' : 'w-5 h-5'} md:h-6 md:w-6 flex items-center justify-center`}>
              {isDarkMode ? <Image className='bg-transparent w-full h-full dark:invert-100 object-cover' src='/icon/message-removebg-preview.png' alt='notification' width={40} height={40} /> :<Image className='bg-transparent w-full h-full object-cover' src='/icon/message-removebg-preview.png' alt='notification' width={40} height={40} />}
            </div>
            <span className={`ml-1.5 ${isMobile ? 'text-xs' : 'text-sm'} ${isDarkMode ? 'text-gray-300' : 'text-gray-700'
              }`}>
              {postData.stats.comments?.toLocaleString() || 0}
            </span>
          </button>

          {/* Tags */}
          <div className="2xl:block xl:block lg:block md:block sm:block hidden w-full">
            <PostCardTags postData={postData} isDarkMode={isDarkMode} />
          </div>
        </div>

        {/* Right Actions (Views, Share) */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* View Count */}
          <div className={`flex items-center sm:gap-1 gap-2 ${isMobile ? 'text-xs' : 'text-sm'} ${isDarkMode ? 'text-gray-400' : 'text-gray-500'
            }`}>
            <div className="w-6 h-6 sm:w-6 sm:h-6 flex justify-center items-center">
              <Image
                src={isDarkMode ? "/icon/eye-removebg-preview.png" : "/icon/eye-removebg-preview.png"}
                width={20}
                height={20}
                sizes="(max-width: 40px) 16px, 20px"
                alt="share icon"
                className={`w-[40px] h-[40px]  object-cover ${isDarkMode ? 'dark:invert-100' : ''}`}
              />
            </div>
            <span className=''>{postData.stats.reads?.toLocaleString() || 0}</span>
          </div>

          {/* Share Button */}
          <button
            onClick={handleShare}
            className={`p-1.5 sm:p-2 cursor-pointer rounded-full transition-colors ${isDarkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100'
              }`}
            aria-label="Share post"
          >
            <div className="relative w-4 h-4 sm:w-5 sm:h-5 md:h-6 md:w-6">
              <Image
                src={isDarkMode ? "/icon/shear-removebg-preview.png" : "/icon/shear-removebg-preview.png"}
                fill
                sizes="(max-width: 640px) 16px, 20px"
                alt="share icon"
                className={`object-contain w-full h-full ${isDarkMode ? 'dark:invert-100': ''} `}
              />
            </div>
          </button>
        </div>
      </div>
    </>
  );
};

export default PostCardActions;