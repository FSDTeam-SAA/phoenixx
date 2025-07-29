import { createSlice } from '@reduxjs/toolkit';
import { messageApi } from '../../features/chat/message/messageApi';

const initialState = {
  messages: [],
  pinnedMessages: [],
  isLoading: false,
  error: null,
  hasMore: true,
  page: 1,
  limit: 10
};

const messageSlice = createSlice({
  name: 'message',
  initialState,
  reducers: {
    addMessage: (state, action) => {
      const existingIndex = state.messages.findIndex(msg => msg._id === action.payload._id);
      
      if (existingIndex >= 0) {
        state.messages[existingIndex] = action.payload;
      } else {
        state.messages.push(action.payload);
      }
    },

    resetMessages: (state) => {
      state.messages = [];
      state.pinnedMessages = [];
      state.page = 1;
      state.hasMore = true;
    },

    setPage: (state, action) => {
      state.page = action.payload;
    },

    updateMessageReaction: (state, action) => {
      const { messageId, reaction, userId } = action.payload;
      state.messages = state.messages.map(msg => {
        if (msg._id === messageId) {
          const existingIndex = msg.reactions?.findIndex(r => r.userId._id === userId) ?? -1;
          if (existingIndex >= 0) {
            const updatedReactions = [...msg.reactions];
            updatedReactions[existingIndex] = {
              ...updatedReactions[existingIndex],
              reactionType: reaction,
              timestamp: new Date().toISOString()
            };
            return { ...msg, reactions: updatedReactions };
          } else {
            return {
              ...msg,
              reactions: [
                ...(msg.reactions || []),
                {
                  userId: { _id: userId },
                  reactionType: reaction,
                  timestamp: new Date().toISOString(),
                  _id: `temp-${Date.now()}`
                }
              ]
            };
          }
        }
        return msg;
      });
    },

    updateMessagePin: (state, action) => {
      const { messageId, isPinned, pinnedBy } = action.payload;
      state.messages = state.messages.map(msg => {
        if (msg._id === messageId) {
          return {
            ...msg,
            isPinned,
            pinnedAt: isPinned ? new Date().toISOString() : undefined,
            pinnedBy: isPinned ? pinnedBy : undefined
          };
        }
        return msg;
      });

      if (isPinned) {
        const message = state.messages.find(msg => msg._id === messageId);
        if (message) {
          state.pinnedMessages = [message, ...state.pinnedMessages.filter(msg => msg._id !== messageId)];
        }
      } else {
        state.pinnedMessages = state.pinnedMessages.filter(msg => msg._id !== messageId);
      }
    },

    updateMessageDelete: (state, action) => {
      const { messageId } = action.payload;
      state.messages = state.messages.map(msg => {
        if (msg._id === messageId) {
          return {
            ...msg,
            text: "This message has been deleted.",
            isDeleted: true,
            images: []
          };
        }
        return msg;
      });
      state.pinnedMessages = state.pinnedMessages.filter(msg => msg._id !== messageId);
    }
  },

  extraReducers: (builder) => {
    builder
      .addMatcher(messageApi.endpoints.getAllMessages.matchPending, (state) => {
        state.isLoading = true;
      })
      .addMatcher(messageApi.endpoints.getAllMessages.matchFulfilled, (state, { payload }) => {
        if (payload.data) {
          const newMessages = payload?.data?.messages || [];

          if (state.page === 1) {
            state.messages = [...newMessages].reverse();
            state.pinnedMessages = payload.data.pinnedMessages || [];
          } else {
            state.messages = [...newMessages].reverse();
          }

          state.hasMore = newMessages.length === state.limit;
          state.isLoading = false;
        }
      })
      .addMatcher(messageApi.endpoints.getAllMessages.matchRejected, (state, { error }) => {
        state.isLoading = false;
        state.error = error.message;
      });
  }
});

export const {
  addMessage,
  resetMessages,
  setPage,
  updateMessageReaction,
  updateMessagePin,
  updateMessageDelete
} = messageSlice.actions;

export default messageSlice.reducer;