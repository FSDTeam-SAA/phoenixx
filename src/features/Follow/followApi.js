// followApi.js
import { baseApi } from "../../../utils/apiBaseQuery";

export const followApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    subscriptions: builder.query({
      query: ({ subscriberId }) => ({
        url: `/follow/subscriptions/${subscriberId}`,
        method: "GET",
        headers: {
          Authorization: `Bearer ${localStorage.getItem('loginToken')}`
        },
      }),
    }),

    follow: builder.mutation({
      query: (data) => ({
        url: "/follow/subscribe",
        method: "POST",
        headers: {
          Authorization: `Bearer ${localStorage.getItem('loginToken')}`
        },
        body: data,
      }),
    }),

    unFollow: builder.mutation({
      query: (data) => ({
        url: "/follow/unsubscribe",
        method: "POST",
        headers: {
          Authorization: `Bearer ${localStorage.getItem('loginToken')}`
        },
        body: data,
      }),
    }),
  }),
});

// Export hooks
export const {
  useFollowMutation,
  useUnFollowMutation,
  useSubscriptionsQuery
} = followApi;