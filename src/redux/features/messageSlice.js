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
    // Add a new message or update existing one
    addMessage: (state, action) => {
      const existingIndex = state.messages.findIndex(msg => msg._id === action.payload._id);

      if (existingIndex >= 0) {
        state.messages[existingIndex] = action.payload;
      } else {
        state.messages.push(action.payload);
      }
    },

    // Reset all messages (used when switching chats)
    resetMessages: (state) => {
      state.messages = [];
      state.pinnedMessages = [];
      state.page = 1;
      state.hasMore = true;
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

    // Add a reply to a message - FIXED VERSION
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
        // Make sure the reply has the replyTo field set
        const replyWithReference = {
          ...replyMessage,
          replyTo: originalMessageId
        };
        state.messages.push(replyWithReference);
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
      .addMatcher(messageApi.endpoints.getAllMessages.matchPending, (state) => {
        state.isLoading = true;
      })
      // Handle successful message fetch
      .addMatcher(messageApi.endpoints.getAllMessages.matchFulfilled, (state, { payload }) => {
        if (payload.data) {
          const newMessages = payload?.data?.messages || [];

          if (state.page === 1) {
            state.messages = [...newMessages];
            state.pinnedMessages = payload.data.pinnedMessages || [];
          } else {
            state.messages = [...newMessages];
          }

          state.hasMore = newMessages.length === state.limit;
          state.isLoading = false;
        }
      })
      // Handle error state for getAllMessages
      .addMatcher(messageApi.endpoints.getAllMessages.matchRejected, (state, { error }) => {
        state.isLoading = false;
        state.error = error.message;
      })
      // Handle successful message sending
      .addMatcher(messageApi.endpoints.messageSend.matchFulfilled, (state, { payload }) => {
        if (payload.data) {
          state.messages.unshift(payload.data);
        }
      })
      // FIXED: Handle successful reply - Updated logic
      .addMatcher(messageApi.endpoints.replyMessage.matchFulfilled, (state, { payload }) => {
        if (payload.data) {
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
            state.messages.unshift(replyWithReference);
          } else {
            // If the response structure is different, handle accordingly
            const replyData = payload.data;
            state.messages.unshift(replyData);
          }
        }
      });
  }
});

export const {
  addMessage,
  resetMessages,
  setPage,
  updateMessageReaction,
  updateMessagePin,
  updateMessageDelete,
  addReplyMessage,
  updateReplyReaction,
  updateReplyDelete
} = messageSlice.actions;

export default messageSlice.reducer;