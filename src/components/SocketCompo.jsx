// SocketComponent.js
'use client';
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
      console.log("all chat",chat)
    });

    // Chat deleted for user - chatDeletedForUser::684bf353ab2c6e754f995d88
    socket.on(`chatDeletedForUser::${loggedInUserId}`, (data) => {
        console.log("chat delete for user" , data)
    });

    // Chat mute status - chatMuteStatus::684bf353ab2c6e754f995d88
    socket.on(`chatMuteStatus::${loggedInUserId}`, (data) => {
        console.log("chat mute status" ,data )
    });

    // User block status - userBlockStatus::684bf353ab2c6e754f995d88
    socket.on(`userBlockStatus::${loggedInUserId}`, (data) => {
          console.log("user block status" , data)
    });

    // New message - newMessage::684bf353ab2c6e754f995d88
    socket.on(`newMessage::${loggedInUserId}`, (message) => {
            console.log("new message" , message)
    });

    // Unread count update - unreadCountUpdate::684bf353ab2c6e754f995d88
    socket.on(`unreadCountUpdate::${loggedInUserId}`, (data) => {
        console.log("unread count update" , data)
    });

    // Message pinned - messagePinned::684bf353ab2c6e754f995d88
    socket.on(`messagePinned::${loggedInUserId}`, (data) => {
          console.log("message pinned", data)
    });

    // Message unpinned - messageUnpinned::684bf353ab2c6e754f995d88
    socket.on(`messageUnpinned::${loggedInUserId}`, (data) => {
        console.log("message Unpinned" , data)
    });

    // Chat list update - chatListUpdate::684bf353ab2c6e754f995d88
    socket.on(`chatListUpdate::${loggedInUserId}`, (data) => {
        console.log("chat list update" ,data )
      
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