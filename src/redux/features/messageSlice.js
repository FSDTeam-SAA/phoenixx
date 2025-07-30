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
  currentChatId: null // FIXED: Track current chat ID
};

const messageSlice = createSlice({
  name: 'message',
  initialState,
  reducers: {
    // Add a new message or update existing one
    addMessage: (state, action) => {
      const existingIndex = state.messages.findIndex(msg => msg._id === action.payload._id);
      if (existingIndex >= 0) {
        state.messages[existingIndex] = action.payload;
      } else {
        state.messages.unshift(action.payload); // Add new messages to the top
      }
    },
    // FIXED: Reset all messages with proper state cleanup
    resetMessages: (state) => {
      state.messages = [];
      state.pinnedMessages = [];
      state.page = 1;
      state.hasMore = true;
      state.isLoading = false;
      state.error = null;
      // Don't reset currentChatId here as it's set in the component
    },
    // FIXED: Set current chat ID when switching chats
    setCurrentChatId: (state, action) => {
      if (state.currentChatId !== action.payload) {
        // Reset state when switching to a different chat
        state.messages = [];
        state.pinnedMessages = [];
        state.page = 1;
        state.hasMore = true;
        state.isLoading = false;
        state.error = null;
        state.currentChatId = action.payload;
      }
    },
    // Set current page for pagination
    setPage: (state, action) => {
      state.page = action.payload;
    },
    // Update message reaction
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
        state.messages.unshift(replyWithReference); // Add new replies to the top
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
        // FIXED: Only set loading if it's for the current chat
        const { chatId } = meta.arg.originalArgs;
        if (chatId === state.currentChatId || !state.currentChatId) {
          state.isLoading = true;
          state.error = null;
        }
      })
      // FIXED: Handle successful message fetch with better chat switching logic
      .addMatcher(messageApi.endpoints.getAllMessages.matchFulfilled, (state, { payload, meta }) => {
        const { chatId, page } = meta.arg.originalArgs;

        // FIXED: Only update state if this response is for the current chat
        if (chatId !== state.currentChatId && state.currentChatId !== null) {
          return; // Ignore responses for old chats
        }

        if (payload?.data) {
          const newMessages = payload.data.messages || [];
          const pinnedMessages = payload.data.pinnedMessages || [];

          if (page === 1) {
            // First page load - replace all messages
            state.messages = newMessages;
            state.pinnedMessages = pinnedMessages;
            state.currentChatId = chatId; // Set current chat ID
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
      // Handle error state for getAllMessages
      .addMatcher(messageApi.endpoints.getAllMessages.matchRejected, (state, { error, meta }) => {
        const { chatId } = meta.arg.originalArgs;
        // FIXED: Only update error state if it's for the current chat
        if (chatId === state.currentChatId || !state.currentChatId) {
          state.isLoading = false;
          state.error = error.message || 'Failed to load messages';
        }
      })
      // FIXED: Handle successful message sending with better state management
      .addMatcher(messageApi.endpoints.messageSend.matchFulfilled, (state, { payload, meta }) => {
        if (payload?.data) {
          // Check if this message is for the current chat
          const existingIndex = state.messages.findIndex(msg => msg._id === payload.data._id);
          if (existingIndex === -1) {
            // Add new message to the top of the list
            state.messages.unshift(payload.data);
          } else {
            // Update existing message (in case of optimistic updates)
            state.messages[existingIndex] = payload.data;
          }
        }
      })
      // FIXED: Handle successful reply with better state management
      .addMatcher(messageApi.endpoints.replyMessage.matchFulfilled, (state, { payload }) => {
        if (payload?.data) {
          // Check if the response contains both originalMessage and reply
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

            // Add reply to messages array with replyTo reference
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
            // If the response structure is different, handle accordingly
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
  updateMessageReaction,
  updateMessagePin,
  updateMessageDelete,
  addReplyMessage,
  updateReplyReaction,
  updateReplyDelete
} = messageSlice.actions;

export default messageSlice.reducer;