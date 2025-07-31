'use client';
import {
  addMessage,
  addReplyMessage,
  updateMessageDelete,
  updateMessagePin,
  updateMessageReaction
} from '@/redux/features/messageSlice';
import { addNotification } from '@/redux/features/notificationSlice';
import { useEffect } from 'react';
import { toast } from 'react-hot-toast';
import { useDispatch, useSelector } from 'react-redux';
import { connectSocket } from '../../utils/socket';

const SocketComponent = () => {
  const dispatch = useDispatch();
  const currentChatId = useSelector(state => state.message.currentChatId);

  useEffect(() => {
    const loggedInUserId = localStorage.getItem("login_user_id");
    if (!loggedInUserId) {
      console.error("No user ID found - socket not initialized");
      return;
    }

    console.log("Initializing socket connection for user:", loggedInUserId);
    const socket = connectSocket(loggedInUserId);

    // Connection events with better logging
    socket.on('connect', () => {
      console.log('Socket connected with ID:', socket.id);
      toast.success('Real-time connection established', { position: 'top-right' });
    });

    socket.on('disconnect', (reason) => {
      console.log('Socket disconnected:', reason);
      if (reason === 'io server disconnect') {
        toast.error('Disconnected from server - trying to reconnect...');
      }
    });

    socket.on('connect_error', (err) => {
      console.error('Socket connection error:', err.message);
      toast.error(`Connection error: ${err.message}`);
    });

    // Real-time message handler
    socket.on(`newMessage::${loggedInUserId}`, (message) => {
      console.log('New message received:', message);

      if (!message || !message._id) {
        console.error('Invalid message format:', message);
        return;
      }

      // Only add to state if message is for current chat or no chat is selected
      if (!currentChatId || message.chatId === currentChatId) {
        dispatch(addMessage(message));
      }
    });

    // Message reaction updates
    socket.on(`messageReaction::${loggedInUserId}`, (data) => {
      if (data?.messageId && data?.reaction && data?.userId) {
        dispatch(updateMessageReaction({
          messageId: data.messageId,
          reaction: data.reaction,
          userId: data.userId
        }));
      }
    });

    // Message pin/unpin
    socket.on(`messagePinUpdate::${loggedInUserId}`, (data) => {
      if (data?.messageId) {
        dispatch(updateMessagePin({
          messageId: data.messageId,
          isPinned: data.isPinned,
          pinnedBy: data.userId
        }));
      }
    });

    // Message deletion
    socket.on(`messageDeleted::${loggedInUserId}`, (data) => {
      if (data?.messageId) {
        dispatch(updateMessageDelete({
          messageId: data.messageId
        }));
      }
    });

    // Reply messages
    socket.on(`messageReply::${loggedInUserId}`, (data) => {
      if (data?.reply && data?.originalMessageId) {
        dispatch(addReplyMessage({
          originalMessageId: data.originalMessageId,
          replyMessage: data.reply
        }));
      }
    });

    // Notification handler
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

    // Debug all incoming events
    socket.onAny((event, ...args) => {
      console.log(`[Socket Event] ${event}`, args);
    });

    return () => {
      console.log('Cleaning up socket listeners');
      socket.offAny();
      socket.disconnect();
    };
  }, [dispatch, currentChatId]);

  return null;
};

export default SocketComponent;