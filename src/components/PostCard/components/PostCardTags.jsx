const PostCardTags = ({ postData, isDarkMode }) => {
  if (!postData.tags?.length) return null;

  return (
    <div className="flex w-full items-center gap-2">
      {postData.tags.map((tag, index) => (
        <div key={index} className='flex text-center py-1 items-center w-full gap-2'>
         <div className='2xl:w-auto xl:w-auto lg:w-auto md:w-auto sm:w-auto w-full space-x-2'>
           {tag.category && (
            <span
              className={`text-xs w-full py-1 px-2 rounded ${isDarkMode
                ? 'bg-gray-700 text-blue-400 border border-gray-600'
                : ' bg-[#bcbcec] text-gray-800 border border-gray-200'
                }`}
            >
              {tag.category}
            </span>
          )}
          {tag.subcategory && (
            <span
              className={`text-xs py-1 w-full px-2 rounded ${isDarkMode
                ? 'bg-gray-700 text-blue-200 border border-gray-600'
                : 'bg-[#E6E6FF] text-gray-800 border border-gray-200'
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