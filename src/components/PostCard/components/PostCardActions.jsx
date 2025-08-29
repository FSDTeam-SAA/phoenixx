import Image from 'next/image';
import { useState } from 'react';
import { FaHeart, FaRegHeart } from "react-icons/fa";
import { PostSEEDark, PostSEELight } from '../../../../utils/svgImage';
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

        <div className="flex  items-center  w-full gap-4">
          {/* Like Button */}

          <button
            onClick={handleLikeClick}
            disabled={likePostLoading}
            className={`flex items-center cursor-pointer p-1.5 sm:p-2 rounded-full transition-all ${isDarkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100'
              } ${isLiking ? 'transform scale-110' : ''}`}
            aria-label={postData.isLiked ? 'Unlike post' : 'Like post'}
          >
            {postData.isLiked ? (
              <FaHeart className={`${isMobile ? 'w-4 h-4' : 'w-5 h-5'} text-red-500 transition-colors ${isLiking ? 'animate-pulse' : ''
                }`} />
            ) : (
              <FaRegHeart className={`${isMobile ? 'w-4 h-4' : 'w-5 h-5'} ${isDarkMode ? 'text-gray-400 hover:text-red-400' : 'text-gray-500 hover:text-red-500'
                } transition-colors`} />
            )}
            <span className={`ml-1.5 ${isMobile ? 'text-xs' : 'text-sm'
              } ${isDarkMode ? 'text-gray-300' : 'text-gray-700'
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
            <div className="relative w-4 h-4 sm:w-5 sm:h-5">
              <Image
                src={isDarkMode ? "/icons/commentdark.png" : "/icons/message.png"}
                fill
                sizes="(max-width: 640px) 16px, 20px"
                alt="comment icon"
                className="object-contain"
              />
            </div>
            <span className={`ml-1.5 ${isMobile ? 'text-xs' : 'text-sm'
              } ${isDarkMode ? 'text-gray-300' : 'text-gray-700'
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
          <div className={`flex items-center sm:gap-1 gap-2  ${isMobile ? 'text-xs' : 'text-sm'
            } ${isDarkMode ? 'text-gray-400' : 'text-gray-500'
            }`}>
            <div className="w-4 h-4 sm:w-5 sm:h-5">
              {isDarkMode ? <PostSEEDark /> : <PostSEELight />}
            </div>
            <span>{postData.stats.reads?.toLocaleString() || 0}</span>
          </div>

          {/* Share Button */}
          <button
            onClick={handleShare}
            className={`p-1.5 sm:p-2 cursor-pointer rounded-full transition-colors ${isDarkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100'
              }`}
            aria-label="Share post"
          >
            <div className="relative w-4 h-4 sm:w-5 sm:h-5">
              <Image
                src={isDarkMode ? "/icons/sharedark.png" : "/icons/share.png"}
                fill
                sizes="(max-width: 640px) 16px, 20px"
                alt="share icon"
                className="object-contain"
              />
            </div>
          </button>
        </div>
      </div>
    </>
  );
};

export default PostCardActions;