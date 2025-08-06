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
      <div className="flex items-center justify-between">
        <div className="flex items-center">
          <span className={`${isDarkMode ? 'text-white' : 'text-gray-800'} mr-2`}>
            Viewing:
          </span>
          <span className="font-medium text-blue-600">
            {displayName}
          </span>
          {sortDisplay && (
            <span className="ml-2 text-gray-500">
              {sortDisplay}
            </span>
          )}
        </div>
        <div className="flex items-center gap-4">

          <span
            className='text-blue-600 font-medium cursor-pointer'
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