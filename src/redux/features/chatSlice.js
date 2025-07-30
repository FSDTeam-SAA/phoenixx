// chatSlice.js
import { createSlice } from '@reduxjs/toolkit';
import { chatApi } from '../../features/chat/chatList/chatApi';

const chatsSlice = createSlice({
  name: 'chats',
  initialState: {
    chats: [],
    unreadCount: 0,
    totalIconUnreadMessages: 0, // This will be used for navbar badge
    loading: false,
    error: null
  },
  reducers: {
    addChats: (state, action) => {
      const existingIndex = state.chats.findIndex(c => c._id === action.payload._id);
      if (existingIndex === -1) {
        state.chats.unshift(action.payload);
      } else {
        state.chats[existingIndex] = action.payload;
      }
    },

    markChatAsRead: (state, action) => {
      const chatId = action.payload;
      const chatIndex = state.chats.findIndex(c => c._id === chatId);

      if (chatIndex !== -1) {
        const chat = state.chats[chatIndex];
        let unreadReduction = 0;

        if (chat.lastMessage && !chat.lastMessage.read) {
          state.chats[chatIndex] = {
            ...chat,
            lastMessage: {
              ...chat.lastMessage,
              read: true
            }
          };
        }
      }
    },

    deleteChatLocally: (state, action) => {
      const chatToDelete = state.chats.find(c => c._id === action.payload);
      if (chatToDelete) {
        const unreadReduction = (chatToDelete.unreadCount || 0) +
          ((chatToDelete.lastMessage && !chatToDelete.lastMessage.read) ? 1 : 0);

        state.unreadCount = Math.max(0, state.unreadCount - unreadReduction);
        state.totalIconUnreadMessages = Math.max(0, state.totalIconUnreadMessages - unreadReduction);
      }
      state.chats = state.chats.filter(chat => chat._id !== action.payload);
    },

    updateLastMessage: (state, action) => {
      const { chatId, message, totalIconUnreadMessages } = action.payload;

      // Handle total unread count update if provided
      if (typeof totalIconUnreadMessages === 'number') {
        state.totalIconUnreadMessages = totalIconUnreadMessages;
        return;
      }

      const chatIndex = state.chats.findIndex(c => c._id === chatId);

      if (chatIndex === -1) {
        // Create new chat if it doesn't exist
        const newChat = {
          _id: chatId,
          participants: message?.participants || [],
          lastMessage: {
            ...message,
            createdAt: message.createdAt || new Date().toISOString()
          },
          unreadCount: message.read ? 0 : 1,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };
        state.chats.unshift(newChat);
      } else {
        // Get the current chat
        const currentChat = state.chats[chatIndex];

        // Update the chat with new last message
        const updatedChat = {
          ...currentChat,
          lastMessage: {
            ...message,
            createdAt: message.createdAt || new Date().toISOString()
          },
          updatedAt: new Date().toISOString()
        };

        // Handle unread count logic
        const wasLastMessageUnread = currentChat.lastMessage && !currentChat.lastMessage.read;
        const isNewMessageUnread = !message.read;

        if (isNewMessageUnread) {
          // New unread message
          updatedChat.unreadCount = (updatedChat.unreadCount || 0) + 1;
          state.unreadCount += 1;
          state.totalIconUnreadMessages += 1;
        } else if (wasLastMessageUnread && message.read) {
          // Previous unread message is now read
          updatedChat.unreadCount = Math.max(0, (updatedChat.unreadCount || 0) - 1);
          state.unreadCount = Math.max(0, state.unreadCount - 1);
          state.totalIconUnreadMessages = Math.max(0, state.totalIconUnreadMessages - 1);
        }

        // Remove chat from current position and add to top
        state.chats.splice(chatIndex, 1);
        state.chats.unshift(updatedChat);
      }
    },

    updateLastMessageOptimistic: (state, action) => {
      const { chatId, message } = action.payload;
      const chatIndex = state.chats.findIndex(c => c._id === chatId);

      if (chatIndex !== -1) {
        const currentChat = state.chats[chatIndex];

        // Optimistically update the last message for immediate UI feedback
        const updatedChat = {
          ...currentChat,
          lastMessage: {
            ...message,
            createdAt: message.createdAt || new Date().toISOString(),
            // Mark as read since user is sending it
            read: true
          },
          updatedAt: new Date().toISOString()
        };

        // Remove chat from current position and add to top
        state.chats.splice(chatIndex, 1);
        state.chats.unshift(updatedChat);
      }
    },

    toggleMuteChat: (state, action) => {
      const { chatId, isMuted } = action.payload;
      const chatIndex = state.chats.findIndex(c => c._id === chatId);

      if (chatIndex !== -1) {
        const currentUserId = localStorage.getItem("login_user_id");
        const mutedBy = state.chats[chatIndex].mutedBy || [];

        if (isMuted) {
          if (!mutedBy.includes(currentUserId)) {
            state.chats[chatIndex].mutedBy = [...mutedBy, currentUserId];
          }
        } else {
          state.chats[chatIndex].mutedBy = mutedBy.filter(id => id !== currentUserId);
        }
      }
    },

    toggleBlockChat: (state, action) => {
      const { chatId, isBlocked } = action.payload;
      const chatIndex = state.chats.findIndex(c => c._id === chatId);

      if (chatIndex !== -1) {
        const currentUserId = localStorage.getItem("login_user_id");
        const blockedUsers = state.chats[chatIndex].blockedUsers || [];

        if (isBlocked) {
          const blockExists = blockedUsers.some(block => block.blocker === currentUserId);
          if (!blockExists) {
            state.chats[chatIndex].blockedUsers = [...blockedUsers, { blocker: currentUserId }];
          }
        } else {
          state.chats[chatIndex].blockedUsers = blockedUsers.filter(block => block.blocker !== currentUserId);
        }
      }
    },

    // New reducer specifically for updating total unread count
    updateTotalUnreadCount: (state, action) => {
      state.totalIconUnreadMessages = action.payload;
    }
  },

  extraReducers: (builder) => {
    builder
      .addMatcher(
        chatApi.endpoints.getAllChat.matchPending,
        (state) => {
          state.loading = true;
          state.error = null;
        }
      )
      .addMatcher(
        chatApi.endpoints.getAllChat.matchFulfilled,
        (state, { payload }) => {
          state.chats = payload?.data?.chats || [];
          state.totalIconUnreadMessages = payload?.data?.totalIconUnreadMessages || 0;
          state.loading = false;
        }
      )
      .addMatcher(
        chatApi.endpoints.getAllChat.matchRejected,
        (state, { error }) => {
          state.loading = false;
          state.error = error.message;
        }
      );
  }
});

export const {
  addChats,
  markChatAsRead,
  deleteChatLocally,
  updateLastMessage,
  updateLastMessageOptimistic,
  toggleMuteChat,
  toggleBlockChat,
  updateTotalUnreadCount
} = chatsSlice.actions;

export default chatsSlice.reducer;