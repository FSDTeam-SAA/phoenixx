import CategoriesSidebar from '../../CategoriesSidebar';
import FeedNavigation from '../../FeedNavigation';
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
  onClearFilters,
  isLoading
}) => (

  <div className="flex flex-col">
    <CategoriesSidebar
      onSelectCategory={onCategorySelect}
      selectedCategory={urlParams.category}
      selectedSubCategory={urlParams.subcategory}
    />

    <FeedNavigation
      handlefeedGrid={setGridNumber}
      onSortChange={onSortChange}
      currentSort={urlParams.sort}
    />

    <FilterIndicator
      urlParams={urlParams}
      posts={posts}
      onClearFilters={onClearFilters}
    />

    <MainContent
      posts={posts}
      pagination={pagination}
      currentUser={currentUser}
      gridNumber={gridNumber}
      onLike={onLike}
      onPageChange={onPageChange}
      isLoading={isLoading}
    />
  </div>
);


export default MobileLayout;