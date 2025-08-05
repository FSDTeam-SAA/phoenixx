const PostCardContent = ({
  postData,
  isDarkMode,
  isMobile,
  handlePostDetails,
  handleCommentClick,
  isTablet
}) => {

  // Function to decode HTML entities
  const decodeHtmlEntities = (text) => {
    if (!text) return '';

    const textArea = document.createElement('textarea');
    textArea.innerHTML = text;
    return textArea.value;
  };

  // Function to clean content by removing HTML tags and Froala footer
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
    return decodeHtmlEntities(withoutTags);
  };

  const renderTitle = () => (
    postData.title && (
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
    )
  );

  const renderContent = () => {
    const cleanedContent = cleanContent(postData.content);
    const words = cleanedContent.split(' ');

    return (
      <div className={`mb-3 ${isMobile ? 'text-sm' : 'text-base'} ${isDarkMode ? 'text-gray-300' : 'text-gray-800'
        }`}>
        {words.length > 20 ? (
          <>
            {words.slice(0, 20).join(' ')}...
            <button
              className={`${isDarkMode
                ? 'text-blue-400 hover:text-blue-300'
                : 'text-blue-600 hover:text-blue-800'
                } cursor-pointer font-medium ml-1`}
              onClick={handleCommentClick}
            >
              See more
            </button>
          </>
        ) : (
          cleanedContent
        )}
      </div>
    );
  };

  return (
    <>
      {renderTitle()}
      {renderContent()}
    </>
  );
};

export default PostCardContent;