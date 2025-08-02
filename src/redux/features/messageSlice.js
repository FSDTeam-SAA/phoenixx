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
  isRefetching: false,
  lastRefetch: null,
  autoUpdateEnabled: true,
  isAutoUpdating: false,
  updateInterval: 30000
};

const messageSlice = createSlice({
  name: 'message',
  initialState,
  reducers: {
    addMessage: (state, action) => {
      const message = action.payload;
      if (!state.currentChatId || message.chatId === state.currentChatId) {
        const existingIndex = state.messages.findIndex(msg => msg._id === message._id);
        if (existingIndex >= 0) {
          state.messages[existingIndex] = message;
        } else {
          state.messages.unshift(message);
        }
      }
    },

    resetMessages: (state) => {
      state.messages = [];
      state.pinnedMessages = [];
      state.page = 1;
      state.hasMore = true;
      state.isLoading = false;
      state.error = null;
      state.isRefetching = false;
    },

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

    setPage: (state, action) => {
      state.page = action.payload;
    },

    startRefetch: (state) => {
      state.isRefetching = true;
      state.error = null;
    },

    completeRefetch: (state) => {
      state.isRefetching = false;
      state.lastRefetch = new Date().toISOString();
    },

    resetForRefetch: (state) => {
      state.page = 1;
      state.hasMore = true;
      state.error = null;
    },

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

      state.pinnedMessages = state.pinnedMessages.map(msg => {
        if (msg._id === messageId) {
          return { ...msg, reactions: state.messages.find(m => m._id === messageId)?.reactions || [] };
        }
        return msg;
      });
    },

    updateMessagePin: (state, action) => {
      const { messageId, isPinned, pinnedBy } = action.payload;
      const loginUserId = localStorage.getItem("login_user_id");
    
      state.messages = state.messages.map(msg => {
        if (msg._id === messageId) {
          const updatedPinnedByUsers = isPinned
            ? [...(msg.pinnedByUsers || []), { userId: loginUserId, pinnedAt: new Date().toISOString() }]
            : (msg.pinnedByUsers || []).filter(user => user.userId !== loginUserId);
    
          return {
            ...msg,
            isPinned: updatedPinnedByUsers.length > 0,
            pinnedByUsers: updatedPinnedByUsers,
            pinnedAt: isPinned ? new Date().toISOString() : (updatedPinnedByUsers.length > 0 ? msg.pinnedAt : undefined),
            pinnedBy: isPinned ? pinnedBy : (updatedPinnedByUsers.length > 0 ? msg.pinnedBy : undefined),
            isPinnedByCurrentUser: isPinned
          };
        }
        return msg;
      });
    
      if (isPinned) {
        const message = state.messages.find(msg => msg._id === messageId);
        if (message) {
          // Remove any existing pinned message by this user
          state.pinnedMessages = state.pinnedMessages.filter(msg =>
            !msg.pinnedByUsers?.some(user => user.userId === loginUserId)
          );
          state.pinnedMessages = [message, ...state.pinnedMessages];
        }
      } else {
        state.pinnedMessages = state.pinnedMessages.filter(msg =>
          !(msg._id === messageId && msg.pinnedByUsers?.some(user => user.userId === loginUserId))
        );
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
    },

    addReplyMessage: (state, action) => {
      const { originalMessageId, replyMessage } = action.payload;
      state.messages = state.messages.map(msg => {
        if (msg._id === originalMessageId) {
          return {
            ...msg,
            replies: [...(msg.replies || []), replyMessage]
          };
        }
        return msg;
      });

      const existingIndex = state.messages.findIndex(msg => msg._id === replyMessage._id);
      if (existingIndex === -1) {
        const replyWithReference = {
          ...replyMessage,
          replyTo: originalMessageId
        };
        state.messages.unshift(replyWithReference);
      }
    },

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
      .addMatcher(messageApi.endpoints.getAllMessages.matchPending, (state, { meta }) => {
        const { chatId } = meta.arg.originalArgs;
        if (chatId === state.currentChatId || !state.currentChatId) {
          if (state.isRefetching) {
          } else if (state.isAutoUpdating) {
          } else {
            state.isLoading = true;
          }
          state.error = null;
        }
      })
      .addMatcher(messageApi.endpoints.getAllMessages.matchFulfilled, (state, { payload, meta }) => {
        const { chatId, page } = meta.arg.originalArgs;
        if (chatId !== state.currentChatId && state.currentChatId !== null) return;

        if (payload?.data) {
          const newMessages = payload.data.messages || [];
          const pinnedMessages = payload.data.pinnedMessages || [];

          if (page === 1 || state.isRefetching || state.isAutoUpdating) {
            state.messages = newMessages;
            state.pinnedMessages = pinnedMessages;
            state.currentChatId = chatId;

            if (state.isRefetching) {
              state.isRefetching = false;
              state.lastRefetch = new Date().toISOString();
            }

            if (state.isAutoUpdating) {
              state.isAutoUpdating = false;
            }
          } else {
            const existingIds = new Set(state.messages.map(msg => msg._id));
            const uniqueNewMessages = newMessages.filter(msg => !existingIds.has(msg._id));
            state.messages = [...uniqueNewMessages, ...state.messages];

            if (pinnedMessages.length > 0) {
              const existingPinnedIds = new Set(state.pinnedMessages.map(msg => msg._id));
              const uniquePinnedMessages = pinnedMessages.filter(msg => !existingPinnedIds.has(msg._id));
              state.pinnedMessages = [...uniquePinnedMessages, ...state.pinnedMessages];
            }
          }

          state.hasMore = newMessages.length >= state.limit;
          state.isLoading = false;
          state.error = null;
        }
      })
      .addMatcher(messageApi.endpoints.getAllMessages.matchRejected, (state, { meta }) => {
        const { chatId } = meta.arg.originalArgs;
        if (chatId === state.currentChatId || !state.currentChatId) {
          state.isLoading = false;
          state.isRefetching = false;
          state.isAutoUpdating = false;
          state.error = 'Failed to fetch messages';
        }
      })
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
      .addMatcher(messageApi.endpoints.replyMessage.matchFulfilled, (state, { payload }) => {
        if (payload?.data) {
          if (payload.data.originalMessage && payload.data.reply) {
            const { originalMessage, reply } = payload.data;

            state.messages = state.messages.map(msg => {
              if (msg._id === originalMessage._id) {
                return {
                  ...msg,
                  replies: [...(msg.replies || []), reply]
                };
              }
              return msg;
            });

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