"use client";
import Image from 'next/image';
import React, { useContext, useMemo } from 'react';
import { getImageUrl } from '../../../../utils/getImageUrl';
import { ThemeContext } from '../../../app/ClientLayout';
import ReportPostModal from '../../ReportPostModal';
import { usePostCardHooks } from '../hooks/usePostCardHooks';
import useWindowSize from '../hooks/useWindowSize';
import ImageModal from './ImageModal';
import PostCardActions from './PostCardActions';
import PostCardContent from './PostCardContent';
import PostCardImageGrid from './PostCardImageGrid';
import PostCardHeader from './PostCardHeader';


const PostCard = ({
  postData,
  onLike,
  onCommentSubmit,
  onRepost,
  currentUser = {},
  likePostLoading
}) => {
  const windowSize = useWindowSize();
  const { isDarkMode } = useContext(ThemeContext);

  const {
    showReportModal,
    setShowReportModal,
    showImageModal,
    currentImageIndex,
    isSaving,
    loginUserPost,
    isSaved,
    isOwnPost,
    handleImageClick,
    handleNextImage,
    handlePrevImage,
    handleCloseModal,
    handlePostDetails,
    handleCommentClick,
    handleLike,
    handleRepost,
    handleShare,
    handleSaveUnsave,
    handleMenuClick
  } = usePostCardHooks(postData, onLike, onRepost, currentUser);

  const isMobile = windowSize.width < 640;
  const isTablet = windowSize.width >= 640 && windowSize.width < 1024;

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


  return (
    <>
      <div className={`rounded-lg shadow mb-4 transition-colors ${isMobile ? 'p-3' : isTablet ? 'p-4' : 'p-5'
        } ${isDarkMode
          ? 'bg-gray-800 border border-gray-700 shadow-gray-900/20'
          : 'bg-white border border-gray-200 shadow-gray-200/50'
        }`}>
        <PostCardHeader
          postData={postData}
          currentUser={currentUser}
          isDarkMode={isDarkMode}
          isMobile={isMobile}
          menuItems={menuItems}
          handleMenuClick={handleMenuClick}
          isSaving={isSaving}
        />

        <PostCardContent
          postData={postData}
          isDarkMode={isDarkMode}
          isMobile={isMobile}
          handlePostDetails={handlePostDetails}
          handleCommentClick={handleCommentClick}
          isTablet={isTablet}
        />

        <PostCardImageGrid
          postData={postData}
          handleImageClick={handleImageClick}
        />

        <PostCardActions
          postData={postData}
          isDarkMode={isDarkMode}
          isMobile={isMobile}
          handleLike={handleLike}
          handleCommentClick={handleCommentClick}
          handleShare={handleShare}
          likePostLoading={likePostLoading}
        />
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
      />
    </>
  );
};

export default React.memo(PostCard);