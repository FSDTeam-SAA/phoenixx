import { Card } from 'antd';
import { useContext } from 'react';
import { ThemeContext } from '../../../app/ClientLayout';
import { getCategoryName } from '../utils/postUtils';

const FilterIndicator = ({ urlParams, posts, onClearFilters, onSortChange }) => {
  const { isDarkMode } = useContext(ThemeContext);

  if (!urlParams.category && !urlParams.subcategory && !urlParams.search) {
    return null;
  }

  const displayName = urlParams.search
    ? `Search results for "${urlParams.search}"`
    : getCategoryName(posts, urlParams);

  const getSortDisplay = (sortType) => {
    switch (sortType) {
      case "oldest":
        return "Oldest first";
      case "popular":
        return "Most popular";
      case "newest":
      default:
        return "Newest first";
    }
  };

  const handleSortChange = (sortType) => {
    if (onSortChange) {
      onSortChange(sortType);
    }
  };

  const sortDisplay = urlParams.sort !== "newest"
    ? `(Sorted by: ${getSortDisplay(urlParams.sort)})`
    : "";

  return (
    <Card className="mb-4 shadow-md">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-0">
        <div className="flex flex-col sm:flex-row items-start sm:items-center sm:flex-wrap gap-2 sm:gap-0">
          <span className={`${isDarkMode ? 'text-white' : 'text-gray-800'} mr-2 whitespace-nowrap`}>
            Viewing:
          </span>
          <span className="font-medium text-blue-600 break-words max-w-full">
            {displayName}
          </span>
          {sortDisplay && (
            <span className="text-gray-500 text-sm  sm:ml-2 whitespace-nowrap">
              {sortDisplay}
            </span>
          )}
        </div>

        <div className="flex items-center gap-4 self-stretch sm:self-auto justify-start sm:justify-start">
          <span
            className='font-medium text-blue-600 break-words max-w-ful cursor-pointer hover:underline  whitespace-nowrap'
            onClick={onClearFilters}
          >
            Clear All Filters
          </span>
        </div>
      </div>
    </Card>
  );
};

export default FilterIndicator;