const PostCardTags = ({ postData, isDarkMode }) => {
  if (!postData.tags?.length) return null;

  return (
    <div className="flex w-full items-center gap-2">
      {postData.tags.map((tag, index) => (
        <div key={index} className='flex text-center py-1 items-center w-full gap-2'>
          <div className='2xl:w-auto xl:w-auto lg:w-auto md:w-auto sm:w-auto w-full space-x-2'>
            {tag.category && (
              <span
                className={`sm:text-xs text-sm w-full py-1 sm:px-4 px-2 rounded-full ${isDarkMode
                  ? 'bg-gradient-to-r from-blue-400 to-blue-600 text-white border border-blue-500'
                  : 'bg-gradient-to-r from-blue-500 to-blue-600 text-white border border-blue-400'
                  }`}
              >
                {tag.category}
              </span>
            )}
            {tag.subcategory && (
              <span
                className={`sm:text-xs text-sm py-1 w-full sm:px-4 px-2 rounded-full ${isDarkMode
                  ? 'bg-gradient-to-r from-blue-700 to-blue-800 text-white border border-blue-600'
                  : 'bg-gradient-to-r from-blue-600 to-blue-800 text-white border border-blue-500'
                  }`}
              >
                {tag.subcategory}
              </span>
            )}
          </div>
        </div>
      ))}
    </div>
  );
};

export default PostCardTags;