import { baseApi } from "../../../utils/apiBaseQuery";

export const postApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    updateProfile: builder.mutation({
      query: (data) => {
        // Check if data is FormData (has append method)
        const isFormData = data && typeof data.append === 'function';

        return {
          url: "/users/update-profile",
          method: "PATCH",
          body: data,
          // Add this to ensure proper handling of FormData
          formData: isFormData,
        };
      },
      invalidatesTags: ["post", 'profile', "comment", "savepost"],
    }),

    deleteAccount: builder.mutation({
      query: (data) => ({
        url: "/users/delete-account",
        method: "PATCH",
        body: data,
      }),
      invalidatesTags: ['profile'],
    }),

    getProfile: builder.query({
      query: () => ({
        url: "/users/profile",
        method: "GET",
      }),
      providesTags: ['profile'],
    })
  }),
});

// Export hooks for using in components
export const {
  useUpdateProfileMutation,
  useGetProfileQuery,
  useDeleteAccountMutation
} = postApi;