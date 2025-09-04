import { useGetPostQuery, useLikePostMutation } from '@/features/post/postApi';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { createQueryParams, extractUrlParams, formatPostData } from '../utils/postUtils';

export const useHomePage = () => {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState({ id: null });

  // Initialize user from localStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      setCurrentUser({ id: localStorage.getItem("login_user_id") });
    }
  }, []);

  // Extract URL parameters (now using category/subCategory)
  const urlParams = useMemo(() => extractUrlParams(searchParams), [searchParams]);

  // API query params with fixed limit of 30 (maps category -> categorySlug, subCategory -> subCategorySlug)
  const queryParams = useMemo(() => {
    const params = createQueryParams(urlParams);
    // Always set limit to 30 for posts per page
    params.limit = 30;
    return params;
  }, [urlParams]);

  // API calls
  const { data: apiData, isLoading, error, refetch } = useGetPostQuery(queryParams);

  const [likePost, { isLoading: likePostLoading }] = useLikePostMutation();

  // Process API data
  const data = useMemo(() => {
    const posts = apiData?.data?.data || [];
    const meta = apiData?.data?.meta || {};

    return {
      posts: posts.map(post => formatPostData(post, currentUser.id)),
      pagination: {
        currentPage: meta.page || urlParams.page,
        postsPerPage: 30, // Fixed to 30 posts per page
        totalPosts: meta.total || 0,
        totalPages: meta.totalPage || Math.ceil((meta.total || 0) / 30) // Use 30 for calculation
      }
    };
  }, [apiData, urlParams, currentUser.id]);


  // URL update helper
  const updateUrlParams = useCallback((params) => {
    const newParams = new URLSearchParams(searchParams.toString());
    Object.entries(params).forEach(([key, value]) => {
      value ? newParams.set(key, value) : newParams.delete(key);
    });
    router.push(`${pathname}?${newParams.toString()}`, { scroll: false });
  }, [searchParams, router, pathname]);

  // Event handlers - UPDATED to use new parameter names
  const handleCategorySelect = useCallback((categoryValue, subCategoryValue = null) => {
    console.log(categoryValue);

    // Create a new URLSearchParams object to ensure proper ordering
    const newParams = new URLSearchParams();

    // Add category and subCategory FIRST (using new parameter names)
    if (categoryValue) newParams.set('category', categoryValue); // Changed from categorySlug
    if (subCategoryValue) newParams.set('subCategory', subCategoryValue); // Changed from subCategorySlug

    // Then add all other existing parameters (except old category/subcategory params)
    for (const [key, value] of searchParams.entries()) {
      if (key !== 'category' && key !== 'subCategory') { // Updated parameter names
        newParams.set(key, value);
      }
    }

    router.push(`${pathname}?${newParams.toString()}`, { scroll: false });
  }, [searchParams, router, pathname]);

  const handleSortChange = useCallback((sortOption) => {
    updateUrlParams({ sort: sortOption, page: 1 });
  }, [updateUrlParams]);

  const handlePageChange = useCallback((page) => {
    updateUrlParams({ page });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [updateUrlParams]);

  const handleLike = useCallback(async (postId) => {
    try {
      await likePost(postId).unwrap();
    } catch (error) {
      console.error("Like error:", error);
    }
  }, [likePost]);

  const clearAllFilters = useCallback(() => {
    router.push(pathname, { scroll: false });
  }, [router, pathname]);

  return {
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
    likePostLoading,
    refetch
  };
};