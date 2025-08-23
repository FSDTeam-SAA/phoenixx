"use client";

import { useContext } from 'react';
import { ThemeContext } from '../../app/ClientLayout';
import Banner from '../Banner';
import Loading from '../Loading/Loading';
import { NotFound } from '../NotFound';
import DesktopLayout from './components/DesktopLayout';
import MobileLayout from './components/MobileLayout';
import { useHomePage } from './hooks/useHomePage';
import { useLayout } from './hooks/useLayout';

const HomePage = () => {
  const { isDarkMode } = useContext(ThemeContext);
  const {
    urlParams,
    data,
    isLoading,
    error,
    currentUser,
    handleCategorySelect,
    handleSortChange,
    handlePageChange,
    handleLike,
    clearAllFilters,
    likePostLoading
  } = useHomePage();

  const { isDesktop, gridNumber, setGridNumber } = useLayout();

  // Show skeleton/loading state while maintaining layout structure
  if (isLoading && !data) {
    return (
      <div className={isDarkMode ? 'dark-mode' : 'light-mode'}>
        <Banner />
        <main className="container mx-auto px-4 py-6">
          <div className='flex justify-center items-center h-[400px]'>
            <Loading />
          </div>
        </main>
      </div>
    );
  }

  if (error) {
    return (
      <div className={isDarkMode ? 'dark-mode' : 'light-mode'}>
        <Banner />
        <main className="container mx-auto px-4 py-6">
          <div className="flex justify-center items-center h-[800px]">
            <NotFound />
          </div>
        </main>
      </div>
    );
  }

  const { posts, pagination } = data || { posts: [], pagination: {} };

  return (
    <div className={isDarkMode ? 'dark-mode' : 'light-mode'}>
      <Banner />
      <main className="container mx-auto px-4 py-6">
        {/* Add a minimum height container to prevent layout jumps */}
        <div className="min-h-[800px]">
          {isDesktop ? (
            <DesktopLayout
              gridNumber={gridNumber}
              setGridNumber={setGridNumber}
              urlParams={urlParams}
              posts={posts}
              pagination={pagination}
              currentUser={currentUser}
              onCategorySelect={handleCategorySelect}
              onSortChange={handleSortChange}
              onPageChange={handlePageChange}
              onLike={handleLike}
              onClearFilters={clearAllFilters}
              isLoading={isLoading}
              likePostLoading={likePostLoading}
            />
          ) : (
            <MobileLayout
              gridNumber={gridNumber}
              setGridNumber={setGridNumber}
              urlParams={urlParams}
              posts={posts}
              pagination={pagination}
              currentUser={currentUser}
              onCategorySelect={handleCategorySelect}
              onSortChange={handleSortChange}
              onPageChange={handlePageChange}
              onLike={handleLike}
              onClearFilters={clearAllFilters}
              isLoading={isLoading}
              likePostLoading={likePostLoading}
            />
          )}
        </div>
      </main>

    </div>
  );
};

export default HomePage;