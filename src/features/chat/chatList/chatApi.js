import { baseApi } from '../../../../utils/apiBaseQuery';


export const chatApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getAllChat: builder.query({
      query: (searchTerm = "") => ({
        url: `/chats/?searchTerm=${searchTerm}`,
        method: "GET",
      }),
      providesTags: ["chat"],
    }),

    createChat: builder.mutation({
      query: (data) => ({
        url: "/chats/create-chat",
        method: "POST",
        body: data,   // {"participant": "682df69bcf663fd1911b6d87" }
      }),
      invalidatesTags: ["chat"],
    }),

    markAsRead: builder.mutation({
      query: (id) => ({
        url: `/chats/mark-chat-as-read/${id}`, // need chatId
        method: "PATCH",
      }),
      invalidatesTags: ["chat"],
    }),

    deleteChat: builder.mutation({
      query: (id) => ({
        url: `/chats/delete/${id}`, // need chatId
        method: "DELETE",
      }),
      invalidatesTags: ["chat"],
    }),

    muteChat: builder.mutation({
      query: ({ id, body }) => ({
        url: `/chats/mute-unmute/${id}`, // need chatId
        method: "PATCH",
        body: body // { "action": "mute" } //'unmute'
      }),
      invalidatesTags: ["chat"],
    }),

    chatBlockAndUnblock: builder.mutation({
      query: ({ chatId, targetId, body }) => ({
        url: `/chats/block-unblock/${chatId}/${targetId}`,
        method: "PATCH",
        body: body
      }),
      invalidatesTags: ["chat"],
    }),
  }),
  overrideExisting: true
});

export const {
  useGetAllChatQuery,
  useCreateChatMutation,
  useMarkAsReadMutation,
  useDeleteChatMutation,
  useMuteChatMutation,
  useChatBlockAndUnblockMutation,
} = chatApi;