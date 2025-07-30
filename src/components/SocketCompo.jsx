// SocketComponent.js
'use client';
import {
  deleteChatLocally,
  markChatAsRead,
  toggleBlockChat,
  toggleMuteChat,
  updateLastMessage,
  updateTotalUnreadCount
} from '@/redux/features/chatSlice';
import {
  updateMessagePin
} from '@/redux/features/messageSlice';
import { addNotification } from '@/redux/features/notificationSlice';
import { useEffect } from 'react';
import { toast } from 'react-hot-toast';
import { useDispatch } from 'react-redux';
import { connectSocket } from '../../utils/socket';

const SocketComponent = () => {
  const dispatch = useDispatch();

  useEffect(() => {
    const loggedInUserId = localStorage.getItem("login_user_id");
    if (!loggedInUserId) return;

    const socket = connectSocket(loggedInUserId);

    // Connection events
    socket.on('connect', () => {
      console.log('Socket connected');
    });

    socket.on('disconnect', () => {
      console.log('Socket disconnected');
    });

    socket.on('connect_error', (err) => {
      console.error('Socket connection error:', err);
      toast.error('Connection error. Trying to reconnect...');
    });

    // New chat creation - newChat::684bf353ab2c6e754f995d88
    socket.on(`newChat::${loggedInUserId}`, (chat) => {
      if (!chat?._id) return;

      // Ensure participants are properly formatted
      if (!Array.isArray(chat.participants)) {
        chat.participants = [];
      }

      // Ensure lastMessage is properly formatted
      if (chat.lastMessage && !chat.lastMessage.sender) {
        chat.lastMessage = {
          ...chat.lastMessage,
          sender: chat.lastMessage.senderId ? {
            _id: chat.lastMessage.senderId,
            userName: 'Unknown',
            profile: null
          } : null,
          read: chat.lastMessage.read || false
        };
      }
      console.log("socket compo", chat)
      // dispatch(addChats(chat));
    });

    // Chat deleted for user - chatDeletedForUser::684bf353ab2c6e754f995d88
    socket.on(`chatDeletedForUser::${loggedInUserId}`, (data) => {
      if (!data?.chatId) return;
      dispatch(deleteChatLocally(data.chatId));
    });

    // Chat mute status - chatMuteStatus::684bf353ab2c6e754f995d88
    socket.on(`chatMuteStatus::${loggedInUserId}`, (data) => {
      if (!data?.chatId) return;
      dispatch(toggleMuteChat({
        chatId: data.chatId,
        isMuted: data.isMuted
      }));
    });

    // User block status - userBlockStatus::684bf353ab2c6e754f995d88
    socket.on(`userBlockStatus::${loggedInUserId}`, (data) => {
      if (!data?.chatId) return;
      dispatch(toggleBlockChat({
        chatId: data.chatId,
        isBlocked: data.isBlocked
      }));
    });

    // New message - newMessage::684bf353ab2c6e754f995d88
    socket.on(`newMessage::${loggedInUserId}`, (message) => {

      console.log(message)
      if (!message) return;

      const enhancedMessage = {
        ...message,
        sender: message.sender || {
          _id: message.senderId || 'unknown',
          userName: 'Unknown',
          profile: null
        },
        createdAt: message.createdAt || new Date().toISOString(),
        read: message.read || false
      };




      // dispatch(addMessage(enhancedMessage));
      // dispatch(updateLastMessage({
      //   chatId: message.chatId,
      //   message: enhancedMessage,
      //   participants: message.participants || []
      // }));
    });

    // Unread count update - unreadCountUpdate::684bf353ab2c6e754f995d88
    socket.on(`unreadCountUpdate::${loggedInUserId}`, (data) => {
      if (!data?.chatId) return;
      dispatch(markChatAsRead(data.chatId));
    });

    // Message pinned - messagePinned::684bf353ab2c6e754f995d88
    socket.on(`messagePinned::${loggedInUserId}`, (data) => {
      if (!data?.messageId) return;
      dispatch(updateMessagePin({
        messageId: data.messageId,
        isPinned: true,
        pinnedBy: data.pinnedBy
      }));
    });

    // Message unpinned - messageUnpinned::684bf353ab2c6e754f995d88
    socket.on(`messageUnpinned::${loggedInUserId}`, (data) => {
      if (!data?.messageId) return;
      dispatch(updateMessagePin({
        messageId: data.messageId,
        isPinned: false
      }));
    });

    // Chat list update - chatListUpdate::684bf353ab2c6e754f995d88
    socket.on(`chatListUpdate::${loggedInUserId}`, (data) => {
      if (!data) return;

      // Update total unread count for navbar badge
      if (typeof data.totalIconUnreadMessages === 'number') {
        dispatch(updateTotalUnreadCount(data.totalIconUnreadMessages));
      }

      // Update specific chat if chatId provided
      if (data.chatId && data.lastMessage) {
        dispatch(updateLastMessage({
          chatId: data.chatId,
          message: data.lastMessage,
          participants: data.participants || []
        }));
      }
    });

    // Notification - notification::6865514465af5ad34a9027c2
    socket.on(`notification::${loggedInUserId}`, (notification) => {
      if (!notification) return;
      dispatch(addNotification({
        _id: notification._id || Date.now().toString(),
        message: notification.message,
        postId: notification.postId || '',
        commentId: notification.commentId || '',
        type: notification.type || 'info',
        read: false,
        createdAt: notification.createdAt || new Date().toISOString()
      }));
    });

    return () => {
      socket.off('connect');
      socket.off('disconnect');
      socket.off('connect_error');
      socket.off(`newChat::${loggedInUserId}`);
      socket.off(`chatDeletedForUser::${loggedInUserId}`);
      socket.off(`chatMuteStatus::${loggedInUserId}`);
      socket.off(`userBlockStatus::${loggedInUserId}`);
      socket.off(`newMessage::${loggedInUserId}`);
      socket.off(`unreadCountUpdate::${loggedInUserId}`);
      socket.off(`messagePinned::${loggedInUserId}`);
      socket.off(`messageUnpinned::${loggedInUserId}`);
      socket.off(`chatListUpdate::${loggedInUserId}`);
      socket.off(`notification::${loggedInUserId}`);
      socket.disconnect();
    };
  }, [dispatch]);

  return null;
};

export default SocketComponent;