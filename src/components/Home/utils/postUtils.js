import moment from 'moment';

// Extract URL parameters with defaults
export const extractUrlParams = (searchParams) => ({
  search: searchParams.get("search"),
  page: parseInt(searchParams.get("page") || "1"),
  category: searchParams.get("category"),
  subcategory: searchParams.get("subcategory"),
  sort: searchParams.get("sort") || "newest",
  limit: parseInt(searchParams.get("limit") || "10")
});

// Create API query params from URL params
export const createQueryParams = (urlParams) => ({
  ...(urlParams.search && { searchTerm: urlParams.search }),
  ...(urlParams.category && { category: urlParams.category }),
  ...(urlParams.subcategory && { subCategory: urlParams.subcategory }),
  sort: urlParams.sort,
  page: urlParams.page,
  limit: urlParams.limit
});

// Sort posts based on sort parameter
export const sortPosts = (posts, sortType) => {
  if (!posts || posts.length === 0) return [];

  const sortedPosts = [...posts]; // Create a copy

  switch (sortType) {
    case 'newest':
      return sortedPosts.sort((a, b) => {
        const dateA = convertToDate(a.createdAt || a.timePosted);
        const dateB = convertToDate(b.createdAt || b.timePosted);
        return dateB - dateA; // Newest first
      });

    case 'oldest':
      return sortedPosts.sort((a, b) => {
        const dateA = convertToDate(a.createdAt || a.timePosted);
        const dateB = convertToDate(b.createdAt || b.timePosted);
        return dateA - dateB; // Oldest first
      });

    case 'popular':
      return sortedPosts.sort((a, b) => {
        const readsA = a.stats?.reads || a.views || 0;
        const readsB = b.stats?.reads || b.views || 0;
        return readsB - readsA; // Most reads first
      });

    default:
      return sortedPosts;
  }
};

// Helper function to convert time strings to Date objects
const convertToDate = (timeString) => {
  // If it's already a Date object
  if (timeString instanceof Date) return timeString;

  // If it's a valid ISO string
  if (typeof timeString === 'string' && !isNaN(Date.parse(timeString))) {
    return new Date(timeString);
  }

  // Handle "X hours/days ago" format
  if (typeof timeString === 'string') {
    const number = parseInt(timeString);
    if (!isNaN(number)) {
      if (timeString.includes('hour')) {
        return new Date(Date.now() - number * 60 * 60 * 1000);
      }
      if (timeString.includes('day')) {
        return new Date(Date.now() - number * 24 * 60 * 60 * 1000);
      }
      if (timeString.includes('minute')) {
        return new Date(Date.now() - number * 60 * 1000);
      }
      if (timeString.includes('second')) {
        return new Date(Date.now() - number * 1000);
      }
    }
  }

  // Fallback to current date if we can't parse
  return new Date();
};

// Format timestamp
export const formatTime = (timestamp) => (
  timestamp ? moment(timestamp).fromNow() : "Just now"
);

// Format post data for consistent structure
export const formatPostData = (post, currentUserId) => ({
  id: post._id || post.id,
  author: {
    id: post?.author?._id || post?.author?.id,
    username: post?.author?.userName || post?.author?.username || "Anonymous",
    avatar: post?.author?.profile || post?.author?.avatar,
    name: post?.author?.name || "User"
  },
  timePosted: post.timePosted || formatTime(post.createdAt),
  title: post.title,
  content: post.content,
  images: post.images,
  tags: post.tags || [{
    category: post.category?.name,
    subcategory: post.subCategory?.name
  }],
  stats: {
    likes: post.stats?.likes || post.likes?.length || 0,
    comments: post.stats?.comments || post.comments?.length || 0,
    reads: post.stats?.reads || post.views || 0,
    likedBy: post.stats?.likedBy || post.likes || []
  },
  isLiked: post.isLiked || post.likes?.includes(currentUserId) || false,
  createdAt: post.createdAt || new Date() // Ensure createdAt exists
});

// Get category display name
export const getCategoryName = (posts, urlParams) => {
  if (urlParams.subcategory) {
    const post = posts.find(p => p.subCategory?._id === urlParams.subcategory);
    return post?.subCategory?.name || "Selected Subcategory";
  }
  if (urlParams.category) {
    const post = posts.find(p => p.category?._id === urlParams.category);
    return post?.category?.name || "Selected Category";
  }
  return "All Posts";
};

// Distribute posts into columns for grid layout
export const distributePostsIntoColumns = (posts, columnCount) => {
  if (!posts.length) return Array(columnCount).fill([]);
  const columns = Array(columnCount).fill().map(() => []);
  posts.forEach((post, index) => columns[index % columnCount].push(post));
  return columns;
};