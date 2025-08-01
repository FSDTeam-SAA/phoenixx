import { createSlice } from '@reduxjs/toolkit';
import { messageApi } from '../../features/chat/message/messageApi';

const initialState = {
  messages: [],
  pinnedMessages: [],
  isLoading: false,
  error: null,
  hasMore: true,
  page: 1,
  limit: 10,
  currentChatId: null,
  isRefetching: false,     // Manual refresh loading
  lastRefetch: null,       // Track last refetch time
  autoUpdateEnabled: true, // Auto update toggle
  isAutoUpdating: false,   // Auto update loading state
  updateInterval: 30000    // Auto update interval (30 seconds)
};

const messageSlice = createSlice({
  name: 'message',
  initialState,
  reducers: {
    // Add or update message with chatId check
    addMessage: (state, action) => {
      const message = action.payload;
      // Only process if message is for current chat or no chat selected
      if (!state.currentChatId || message.chatId === state.currentChatId) {
        const existingIndex = state.messages.findIndex(msg => msg._id === message._id);
        if (existingIndex >= 0) {
          state.messages[existingIndex] = message;
        } else {
          state.messages.unshift(message);
        }
      }
    },

    // Reset all messages
    resetMessages: (state) => {
      state.messages = [];
      state.pinnedMessages = [];
      state.page = 1;
      state.hasMore = true;
      state.isLoading = false;
      state.error = null;
      state.isRefetching = false;
    },

    // Set current chat ID and reset state
    setCurrentChatId: (state, action) => {
      if (state.currentChatId !== action.payload) {
        state.messages = [];
        state.pinnedMessages = [];
        state.page = 1;
        state.hasMore = true;
        state.isLoading = false;
        state.error = null;
        state.isRefetching = false;
        state.currentChatId = action.payload;
      }
    },

    // Set current page for pagination
    setPage: (state, action) => {
      state.page = action.payload;
    },

    // NEW: Trigger refetch state
    startRefetch: (state) => {
      state.isRefetching = true;
      state.error = null;
    },

    // NEW: Complete refetch state
    completeRefetch: (state) => {
      state.isRefetching = false;
      state.lastRefetch = new Date().toISOString();
    },

    // NEW: Reset to first page for refetch
    resetForRefetch: (state) => {
      state.page = 1;
      state.hasMore = true;
      state.error = null;
    },

    // NEW: Auto update actions
    setAutoUpdateEnabled: (state, action) => {
      state.autoUpdateEnabled = action.payload;
    },

    startAutoUpdate: (state) => {
      state.isAutoUpdating = true;
    },

    completeAutoUpdate: (state) => {
      state.isAutoUpdating = false;
    },

    setUpdateInterval: (state, action) => {
      state.updateInterval = action.payload;
    },

    // Update message reaction
    updateMessageReaction: (state, action) => {
      const { messageId, reaction, userId } = action.payload;
      state.messages = state.messages.map(msg => {
        if (msg._id === messageId) {
          const existingIndex = msg.reactions?.findIndex(r => r.userId._id === userId) ?? -1;
          if (existingIndex >= 0) {
            // Update existing reaction
            const updatedReactions = [...msg.reactions];
            updatedReactions[existingIndex] = {
              ...updatedReactions[existingIndex],
              reactionType: reaction,
              timestamp: new Date().toISOString()
            };
            return { ...msg, reactions: updatedReactions };
          } else {
            // Add new reaction
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

      // Update in pinned messages if exists
      state.pinnedMessages = state.pinnedMessages.map(msg => {
        if (msg._id === messageId) {
          return { ...msg, reactions: state.messages.find(m => m._id === messageId)?.reactions || [] };
        }
        return msg;
      });
    },

    // Pin or unpin a message
    updateMessagePin: (state, action) => {
      const { messageId, isPinned, pinnedBy } = action.payload;
      state.messages = state.messages.map(msg => {
        if (msg._id === messageId) {
          return {
            ...msg,
            isPinned: isPinned,
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

    // Mark message as deleted
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
    },

    // Add a reply to a message
    addReplyMessage: (state, action) => {
      const { originalMessageId, replyMessage } = action.payload;

      // Add reply to the original message's replies array
      state.messages = state.messages.map(msg => {
        if (msg._id === originalMessageId) {
          return {
            ...msg,
            replies: [...(msg.replies || []), replyMessage]
          };
        }
        return msg;
      });

      // Add the reply to the main messages array with replyTo reference
      const existingIndex = state.messages.findIndex(msg => msg._id === replyMessage._id);
      if (existingIndex === -1) {
        const replyWithReference = {
          ...replyMessage,
          replyTo: originalMessageId
        };
        state.messages.unshift(replyWithReference);
      }
    },

    // Update reaction on a reply
    updateReplyReaction: (state, action) => {
      const { originalMessageId, replyId, reaction, userId } = action.payload;
      state.messages = state.messages.map(msg => {
        if (msg._id === originalMessageId && msg.replies) {
          const updatedReplies = msg.replies.map(reply => {
            if (reply._id === replyId) {
              const existingIndex = reply.reactions?.findIndex(r => r.userId._id === userId) ?? -1;
              if (existingIndex >= 0) {
                const updatedReactions = [...reply.reactions];
                updatedReactions[existingIndex] = {
                  ...updatedReactions[existingIndex],
                  reactionType: reaction,
                  timestamp: new Date().toISOString()
                };
                return { ...reply, reactions: updatedReactions };
              } else {
                return {
                  ...reply,
                  reactions: [
                    ...(reply.reactions || []),
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
            return reply;
          });
          return { ...msg, replies: updatedReplies };
        }
        return msg;
      });
    },

    // Mark a reply as deleted
    updateReplyDelete: (state, action) => {
      const { originalMessageId, replyId } = action.payload;
      state.messages = state.messages.map(msg => {
        if (msg._id === originalMessageId && msg.replies) {
          const updatedReplies = msg.replies.map(reply => {
            if (reply._id === replyId) {
              return {
                ...reply,
                text: "This reply has been deleted.",
                isDeleted: true,
                images: []
              };
            }
            return reply;
          });
          return { ...msg, replies: updatedReplies };
        }
        return msg;
      });
    }
  },
  extraReducers: (builder) => {
    builder
      // Handle loading state for getAllMessages
      .addMatcher(messageApi.endpoints.getAllMessages.matchPending, (state, { meta }) => {
        const { chatId } = meta.arg.originalArgs;
        if (chatId === state.currentChatId || !state.currentChatId) {
          // Set appropriate loading state based on type of fetch
          if (state.isRefetching) {
            // Keep isRefetching true for manual refetch
          } else if (state.isAutoUpdating) {
            // Keep isAutoUpdating true for auto updates
          } else {
            state.isLoading = true;
          }
          state.error = null;
        }
      })

      // Handle successful message fetch
      .addMatcher(messageApi.endpoints.getAllMessages.matchFulfilled, (state, { payload, meta }) => {
        const { chatId, page } = meta.arg.originalArgs;

        // Only update state if this response is for the current chat
        if (chatId !== state.currentChatId && state.currentChatId !== null) return;

        if (payload?.data) {
          const newMessages = payload.data.messages || [];
          const pinnedMessages = payload.data.pinnedMessages || [];

          if (page === 1 || state.isRefetching || state.isAutoUpdating) {
            // First page load, manual refetch, or auto update - replace all messages
            state.messages = newMessages;
            state.pinnedMessages = pinnedMessages;
            state.currentChatId = chatId;

            // Complete refetch if it was a manual refetch
            if (state.isRefetching) {
              state.isRefetching = false;
              state.lastRefetch = new Date().toISOString();
            }

            // Complete auto update if it was an auto update
            if (state.isAutoUpdating) {
              state.isAutoUpdating = false;
            }
          } else {
            // Pagination - append older messages
            const existingIds = new Set(state.messages.map(msg => msg._id));
            const uniqueNewMessages = newMessages.filter(msg => !existingIds.has(msg._id));
            state.messages = [...uniqueNewMessages, ...state.messages];

            // Update pinned messages if needed
            if (pinnedMessages.length > 0) {
              const existingPinnedIds = new Set(state.pinnedMessages.map(msg => msg._id));
              const uniquePinnedMessages = pinnedMessages.filter(msg => !existingPinnedIds.has(msg._id));
              state.pinnedMessages = [...uniquePinnedMessages, ...state.pinnedMessages];
            }
          }

          // Update pagination state
          state.hasMore = newMessages.length >= state.limit;
          state.isLoading = false;
          state.error = null;
        }
      })

      // Handle fetch errors
      .addMatcher(messageApi.endpoints.getAllMessages.matchRejected, (state, { meta }) => {
        const { chatId } = meta.arg.originalArgs;
        if (chatId === state.currentChatId || !state.currentChatId) {
          state.isLoading = false;
          state.isRefetching = false;
          state.isAutoUpdating = false;
          state.error = 'Failed to fetch messages';
        }
      })

      // Handle successful message sending
      .addMatcher(messageApi.endpoints.messageSend.matchFulfilled, (state, { payload }) => {
        if (payload?.data) {
          const existingIndex = state.messages.findIndex(msg => msg._id === payload.data._id);
          if (existingIndex === -1) {
            state.messages.unshift(payload.data);
          } else {
            state.messages[existingIndex] = payload.data;
          }
        }
      })

      // Handle successful reply
      .addMatcher(messageApi.endpoints.replyMessage.matchFulfilled, (state, { payload }) => {
        if (payload?.data) {
          if (payload.data.originalMessage && payload.data.reply) {
            const { originalMessage, reply } = payload.data;

            // Update original message with reply
            state.messages = state.messages.map(msg => {
              if (msg._id === originalMessage._id) {
                return {
                  ...msg,
                  replies: [...(msg.replies || []), reply]
                };
              }
              return msg;
            });

            // Add reply to messages array
            const replyWithReference = {
              ...reply,
              replyTo: originalMessage._id
            };

            const existingIndex = state.messages.findIndex(msg => msg._id === reply._id);
            if (existingIndex === -1) {
              state.messages.unshift(replyWithReference);
            } else {
              state.messages[existingIndex] = replyWithReference;
            }
          } else {
            // Fallback for different response structure
            const existingIndex = state.messages.findIndex(msg => msg._id === payload.data._id);
            if (existingIndex === -1) {
              state.messages.unshift(payload.data);
            } else {
              state.messages[existingIndex] = payload.data;
            }
          }
        }
      });
  }
});

export const {
  addMessage,
  resetMessages,
  setCurrentChatId,
  setPage,
  startRefetch,
  completeRefetch,
  resetForRefetch,
  setAutoUpdateEnabled,
  startAutoUpdate,
  completeAutoUpdate,
  setUpdateInterval,
  updateMessageReaction,
  updateMessagePin,
  updateMessageDelete,
  addReplyMessage,
  updateReplyReaction,
  updateReplyDelete
} = messageSlice.actions;

export default messageSlice.reducer;