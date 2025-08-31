'use client'

import { useTransition } from 'react';
import CategoriesSidebar from '../../CategoriesSidebar';
// Note: FeedNavigation is intentionally NOT imported for mobile
import FeedNavigation from '../../FeedNavigation';
import { sortPosts } from '../utils/postUtils';
import FilterIndicator from './FilterIndicator';
import MainContent from './MainContent';

const MobileLayout = ({
  gridNumber,
  setGridNumber,
  urlParams,
  posts,
  pagination,
  currentUser,
  onCategorySelect,
  onSortChange,
  onPageChange,
  onLike,
  likePostLoading,
  onClearFilters,
  isLoading,
}) => {
  const [isPending, startTransition] = useTransition();

  // Sort posts based on current sort parameter
  const sortedPosts = sortPosts(posts, urlParams.sort);

  const handleCategorySelect = (category, subcategory) => {
    startTransition(() => {
      onCategorySelect(category, subcategory);
    });
  };

  const handleSortChange = (sortOption) => {
    startTransition(() => {
      onSortChange(sortOption);
    });
  };

  return (
    <div className="flex flex-col space-y-4">
      {/* Categories Section - Full width on mobile */}
      <div className="w-full">
        <CategoriesSidebar
          onSelectCategory={handleCategorySelect}
          selectedCategory={urlParams.category}
          selectedSubCategory={urlParams.subCategory}
        />
      </div>

      {/* Content Section */}
      <section className="w-full flex flex-col gap-3">
        {/* FeedNavigation is intentionally hidden on mobile */}
        <FeedNavigation
          handlefeedGrid={setGridNumber}
          onSortChange={handleSortChange}
          currentSort={urlParams.sort}
          devices={"mobile"}
        />

        {/* FilterIndicator remains visible on mobile */}
        <FilterIndicator
          urlParams={urlParams}
          posts={posts}
          onClearFilters={onClearFilters}
          onSortChange={handleSortChange}
        />

        <div className="relative transition-opacity duration-300 ease-in-out" style={{ minHeight: '600px' }}>
          <MainContent
            posts={sortedPosts}
            pagination={pagination}
            currentUser={currentUser}
            gridNumber={1} // Force list view (gridNumber = 1) on mobile
            onLike={onLike}
            onPageChange={onPageChange}
            isLoading={isLoading}
            likePostLoading={likePostLoading}
          />
        </div>
      </section>
    </div>
  );
};

export default MobileLayout;