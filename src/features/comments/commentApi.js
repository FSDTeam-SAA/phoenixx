import { baseApi } from "../../../utils/apiBaseQuery";

export const commentApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    createComment: builder.mutation({
      query: (data) => ({
        url: "/comments/create-comment",
        method: "POST",
        body: data,
      }),
      invalidatesTags: ["comment", "post"],
    }),

    replayComment: builder.mutation({
      query: ({ id, body }) => ({
        url: `/comments/replay-comments/${id}`,
        method: "POST",
        body: body,
      }),
      invalidatesTags: ["comment", "post"],
    }),

    likeComment: builder.mutation({
      query: (id) => ({
        url: `/comments/likes/${id}`,
        method: "POST",
      }),
      invalidatesTags: ["comment", "post"],
    }),

    myCommentPost: builder.query({
      query: () => ({
        url: `/comments/my-comments`,
        method: "GET",
      }),
      providesTags: ["comment"],
    }),

    deleteComment: builder.mutation({
      query: (commentId) => ({
        url: `/comments/${commentId}`,
        method: "DELETE",
      }),
      invalidatesTags: ["comment", "post"],
    }),

    updateComment: builder.mutation({
      query: ({ id, body }) => ({
        url: `/comments/${id}`,
        method: "PATCH",
        body: body,
      }),
      invalidatesTags: ["comment", "post"],
    }),

    reportComment: builder.mutation({
      query: (body) => ({
        url: `/reports-comments/create`,
        method: "POST",
        body: body,
      }),
      invalidatesTags: ["comment", "post"],
    }),


  }),
});

export const {
  useCreateCommentMutation,
  useDeleteCommentMutation,
  useLikeCommentMutation,
  useMyCommentPostQuery,
  useReplayCommentMutation,
  useUpdateCommentMutation,
  useReportCommentMutation
} = commentApi;