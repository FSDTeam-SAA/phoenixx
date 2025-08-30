// utils/postCache.js
let postCache = [];

export const setPosts = (posts) => {
  postCache = posts;
};

export const getPosts = () => postCache;
