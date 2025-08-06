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

  // Enhanced function to clean content and handle special characters
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
        className={`${isMobile ? 'text-lg' : isTablet ? 'text-xl' : 'text-2xl'
          } cursor-pointer transition-colors ${isDarkMode
            ? 'text-gray-100 hover:text-blue-400'
            : 'text-gray-800 hover:text-blue-700'
          } font-bold mb-3`}
        style={{
          wordBreak: 'break-word',
          overflowWrap: 'break-word',
          hyphens: 'auto',
          maxWidth: '100%',
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
        className={`mb-3 ${isMobile ? 'text-sm' : 'text-base'} ${isDarkMode ? 'text-gray-300' : 'text-gray-800'
          } leading-relaxed`}
        style={{
          wordBreak: 'break-word',
          overflowWrap: 'anywhere',
          hyphens: 'auto',
          maxWidth: '100%',
          whiteSpace: 'pre-wrap',
          minWidth: 0, // Important for flex containers
          width: '100%'
        }}
      >
        {words.length > 20 ? (
          <>
            <span style={{
              wordBreak: 'break-word',
              overflowWrap: 'anywhere',
              display: 'inline-block',
              maxWidth: '100%'
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
                wordBreak: 'break-word',
                whiteSpace: 'nowrap'
              }}
            >
              See more
            </button>
          </>
        ) : (
          <span style={{
            wordBreak: 'break-word',
            overflowWrap: 'anywhere',
            display: 'inline-block',
            maxWidth: '100%'
          }}>
            {cleanedContent}
          </span>
        )}
      </div>
    );
  };

  return (
    <div style={{
      maxWidth: '100%',
      minWidth: 0,
      width: '100%',
      overflow: 'hidden'
    }}>
      {renderTitle()}
      {renderContent()}
    </div>
  );
};

export default PostCardContent;