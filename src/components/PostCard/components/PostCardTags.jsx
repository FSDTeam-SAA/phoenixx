import Link from 'next/link';

const PostCardTags = ({ postData, isDarkMode }) => {

  if (!postData.tags?.length) return null;

  return (
    <div className="flex flex-wrap w-full gap-2">
      {postData.tags.map((tag, index) => (
        <div key={index} className="flex-shrink-0 max-w-full">
          <div className="flex space-x-2">
            {tag.category && (
              <span
                className={`sm:text-xs text-sm py-1 sm:px-4 px-2 rounded-full truncate ${isDarkMode
                  ? 'bg-gradient-to-r from-blue-400 to-blue-600 text-white border border-blue-500'
                  : 'bg-gradient-to-r from-blue-500 to-blue-600 text-white border border-blue-400'
                  }`}
                style={{ maxWidth: '150px' }}
                title={tag.category} // Show full text on hover
              >
                {/* {tag.category} */}
                <Link href={`https://mehor.com/?category=${postData.category.slug}`}>{tag.category}</Link>
              </span>
            )}
            {tag.subcategory && (
              <span
                className={`sm:text-xs text-sm py-1 sm:px-4 px-2 rounded-full truncate ${isDarkMode
                  ? 'bg-gradient-to-r from-blue-700 to-blue-800 text-white border border-blue-600'
                  : 'bg-gradient-to-r from-blue-600 to-blue-800 text-white border border-blue-500'
                  }`}
                style={{ maxWidth: '150px' }}
                title={tag.subcategory} // Show full text on hover
              >
                {/* {tag.subcategory} */}
                <Link href={`https://mehor.com/?subCategory=${postData.subCategory.slug}`}>{tag.subcategory}</Link>
              </span>
            )}
          </div>
        </div>
      ))}
    </div>
  );
};

export default PostCardTags;