import { baseApi } from "../../../utils/apiBaseQuery";

export const postApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    createPost: builder.mutation({
      query: (data) => ({
        url: "/posts/create-post",
        method: "POST",
        body: data,
      }),
      invalidatesTags: ["post"],
    }),

    getPost: builder.query({
      query: ({ searchTerm, limit, page, categorySlug, subCategorySlug } = {}) => ({
        url: "/posts",
        method: "GET",
        params: {
          searchTerm,
          limit,
          page,
          categorySlug,
          subCategorySlug
        }
      }),
      providesTags: ["post"],
    }),

    likePost: builder.mutation({
      query: (postId) => ({
        url: `/posts/likes/${postId}`,
        method: "POST",
      }),
      invalidatesTags: ["post"],
    }),

    postDetails: builder.query({
      query: (id) => ({
        url: `/posts/${id}`,
        method: "GET",
      }),
      providesTags: ["post"],
    }),

    myPost: builder.query({
      query: () => ({
        url: `/posts/all-posts/my-posts`,
        method: "GET",
      }),
      providesTags: ["post"],
    }),

    deletePost: builder.mutation({
      query: (postId) => ({
        url: `/posts/${postId}`,
        method: "DELETE",
      }),
      invalidatesTags: ["post"],
    }),


    getByUserId: builder.query({
      query: (id) => ({
        url: `/posts/get-all-post-by-user-id/${id}`,
        method: "GET",
      }),
      providesTags: ["post"],
    }),

    editPost: builder.mutation({
      query: ({ id, body }) => {  // Destructure the id and body
        return {
          url: `/posts/${id}`,  // Use the post ID in the URL
          method: "PATCH",
          body: body,           // Send only the form data as body
        };
      },
      invalidatesTags: ['post'],
    }),

    getProfileById: builder.query({
      query: (id) => ({
        url: `/users/single-user/${id}`,
        method: "GET",
      }),
      providesTags: ["post"],
    }),

  }),
});

export const {
  useCreatePostMutation,
  useGetPostQuery,
  useMyPostQuery,
  useLikePostMutation,
  usePostDetailsQuery,
  useDeletePostMutation,
  useEditPostMutation,
  useGetByUserIdQuery,
  useGetProfileByIdQuery,
} = postApi;
