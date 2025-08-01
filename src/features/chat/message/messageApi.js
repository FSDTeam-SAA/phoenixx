import { baseApi } from '../../../../utils/apiBaseQuery';


export const messageApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getAllMessages: builder.query({
      query: ({ chatId, page = 1, limit = 10 }) => ({
        url: `/messages/${chatId}`,
        method: "GET",
        params: { page, limit },
      }),
      providesTags: ['message', "chat"],
    }),

    reactMessage: builder.mutation({
      query: ({ messageId, reaction }) => ({
        url: `/messages/react/${messageId}`,
        method: "POST",
        body: {
          reactionType: reaction, // 'like' | 'love' | 'thumbs_up' | 'laugh' | 'angry' | 'sad'
        },
      }),
      invalidatesTags: ['message', "chat"],
    }),

    messageSend: builder.mutation({
      query: ({ chatId, body }) => ({
        url: `/messages/send-message/${chatId}`,
        method: "POST",
        body,
      }),
      invalidatesTags: ['message', "chat"],
    }),

    pinMessage: builder.mutation({
      query: ({ messageId, action }) => ({
        url: `/messages/pin-unpin/${messageId}`,
        method: "PATCH",
        body: { action }, // { action: 'pin' } or 'unpin'
      }),
      invalidatesTags: ['message', "chat"],
    }),

    replyMessage: builder.mutation({
      query: ({ chatId, messageId, body }) => ({
        url: `/messages/${chatId}/reply/${messageId}`,
        method: "POST",
        body,
      }),
      invalidatesTags: ['message', "chat"],
    }),
  }),
  overrideExisting: true,
});

export const {
  useGetAllMessagesQuery,
  useMessageSendMutation,
  usePinMessageMutation,
  useReactMessageMutation,
  useReplyMessageMutation,
} = messageApi;