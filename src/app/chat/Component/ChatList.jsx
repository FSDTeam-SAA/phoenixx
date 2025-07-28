"use client";
import {
  deleteChatLocally,
  markChatAsRead,
  toggleBlockChat,
  toggleMuteChat
} from '@/redux/features/chatSlice';
import { Avatar, Dropdown, Flex, Input, Skeleton, message } from 'antd';
import { AnimatePresence, motion } from 'framer-motion';
import moment from 'moment';
import { useParams, useRouter } from 'next/navigation';
import { useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import toast from 'react-hot-toast';
import {
  BsBell,
  BsBellSlash,
  BsBlockquoteRight,
  BsCheckAll,
  BsSearch,
  BsThreeDotsVertical,
  BsTrash
} from 'react-icons/bs';
import { useDispatch, useSelector } from 'react-redux';
import { getImageUrl } from '../../../../utils/getImageUrl';
import {
  useChatBlockAndUnblockMutation,
  useDeleteChatMutation,
  useGetAllChatQuery,
  useMarkAsReadMutation,
  useMuteChatMutation
} from '../../../features/chat/chatList/chatApi';
import { useDebounce } from '../../../hooks/useDebounce';
import { ThemeContext } from '../../ClientLayout';

const ChatList = ({ setIsChatActive, status }) => {
  const { isDarkMode } = useContext(ThemeContext);
  const router = useRouter();
  const { id } = useParams();
  const [searchTerm, setSearchTerm] = useState('');
  const debouncedSearchTerm = useDebounce(searchTerm, 500);
  const dispatch = useDispatch();
  const [actionStates, setActionStates] = useState({});
  const chatListRef = useRef(null);
  const [markAsRead] = useMarkAsReadMutation();
  const [deleteChat] = useDeleteChatMutation();
  const [muteChat] = useMuteChatMutation();
  const [blockChat] = useChatBlockAndUnblockMutation();

  // Always fetch all chats, but filter locally when searching
  const { data: apiData, isLoading, isError, error, refetch } = useGetAllChatQuery(undefined, {
    refetchOnMountOrArgChange: true
  });

  // Get chats from Redux store
  const { chats: reduxChats, unreadCount } = useSelector((state) => state.chats);

  const getCurrentUserId = useCallback(() => {
    try {
      return localStorage.getItem("login_user_id") || '';
    } catch (error) {
      console.error('Error accessing localStorage:', error);
      return '';
    }
  }, []);


  // Determine which chats to display
  const chatsToShow = useMemo(() => {
    if (debouncedSearchTerm) {
      // Filter chats locally based on search term
      return reduxChats?.filter(chat => {
        const participant = chat.participants?.find(p => p._id !== getCurrentUserId());
        return participant?.userName?.toLowerCase().includes(debouncedSearchTerm.toLowerCase());
      }) || [];
    } else {
      // Show all chats when not searching
      return reduxChats;
    }
  }, [debouncedSearchTerm, reduxChats]);

  // Memoize chats to prevent unnecessary re-renders
  const memoizedChats = useMemo(() => chatsToShow, [chatsToShow]);

  // Preserve scroll position
  useEffect(() => {
    if (chatListRef.current) {
      const savedPosition = sessionStorage.getItem('chatListScrollPosition');
      if (savedPosition) {
        chatListRef.current.scrollTop = parseInt(savedPosition, 10);
      }
    }
  }, [memoizedChats]);

  const handleScroll = useCallback(() => {
    if (chatListRef.current) {
      sessionStorage.setItem('chatListScrollPosition', chatListRef.current.scrollTop);
    }
  }, []);


  const handleSelectChat = async (chatId) => {
    if (actionStates[chatId]?.loading) return;
    setActionStates(prev => ({ ...prev, [chatId]: { loading: true, action: 'select' } }));
    try {
      // Optimistically update UI first
      dispatch(markChatAsRead(chatId));
      router.push(`/chat/${chatId}`);
      if (setIsChatActive) setIsChatActive(true);
      // Then send the API request
      await markAsRead(chatId).unwrap();
    } catch (error) {
      console.error('Error marking as read:', error);
      toast.error(error?.data?.message || error?.message || 'Failed to mark as read');
      // Re-fetch chats to sync with server state
      refetch();
    } finally {
      setActionStates(prev => ({ ...prev, [chatId]: { loading: false, action: '' } }));
    }
  };

  const handleDeleteChat = async (chatId) => {
    if (actionStates[chatId]?.loading) return;
    setActionStates(prev => ({ ...prev, [chatId]: { loading: true, action: 'delete' } }));
    try {
      await deleteChat(chatId).unwrap();
      dispatch(deleteChatLocally(chatId));
      message.success('Chat deleted successfully');
      if (id === chatId) {
        router.push('/chat');
      }
    } catch (error) {
      console.error('Error deleting chat:', error);
      toast.error(error?.data?.message || error?.message || 'Failed to delete chat');
    } finally {
      setActionStates(prev => ({ ...prev, [chatId]: { loading: false, action: '' } }));
    }
  };

  const handleMuteChat = async (chatId) => {
    if (actionStates[chatId]?.loading) return;
    setActionStates(prev => ({ ...prev, [chatId]: { loading: true, action: 'mute' } }));
    try {
      const chat = memoizedChats.find(c => c._id === chatId);
      if (!chat) throw new Error('Chat not found');
      const currentUserId = getCurrentUserId();
      const isCurrentlyMuted = chat.mutedBy?.includes(currentUserId);
      const action = isCurrentlyMuted ? 'unmute' : 'mute';
      await muteChat({
        id: chatId,
        body: { action }
      }).unwrap();
      dispatch(toggleMuteChat({ chatId, isMuted: !isCurrentlyMuted }));
      message.success(`Chat ${action}d successfully`);
    } catch (error) {
      console.error('Error toggling mute:', error);
      toast.error(error?.data?.message || error?.message || 'Failed to toggle mute status');
    } finally {
      setActionStates(prev => ({ ...prev, [chatId]: { loading: false, action: '' } }));
    }
  };

  const handleBlockChat = async (chatId) => {
    if (actionStates[chatId]?.loading) return;
    setActionStates(prev => ({ ...prev, [chatId]: { loading: true, action: 'block' } }));
    try {
      const chat = memoizedChats.find(c => c._id === chatId);
      if (!chat) throw new Error('Chat not found');
      const currentUserId = getCurrentUserId();
      const isCurrentlyBlocked = chat.blockedUsers?.some(
        block => block.blocker === currentUserId
      );
      const targetUser = chat.participants?.find(p => p._id !== currentUserId);
      if (!targetUser) throw new Error("Target user not found");
      const action = isCurrentlyBlocked ? 'unblock' : 'block';
      await blockChat({
        chatId,
        targetId: targetUser._id,
        body: { action }
      }).unwrap();
      dispatch(toggleBlockChat({ chatId, isBlocked: !isCurrentlyBlocked }));
      toast.success(`User ${action}ed successfully`);
    } catch (error) {
      console.error('Error toggling block:', error);
      toast.error(error?.data?.message || error?.message || 'Failed to toggle block status');
    } finally {
      setActionStates(prev => ({ ...prev, [chatId]: { loading: false, action: '' } }));
    }
  };

  const formatTime = (timestamp) => {
    if (!timestamp) return "Just now";
    try {
      const bangladeshTime = moment.utc(timestamp).utcOffset(6);
      return bangladeshTime.fromNow();
    } catch (error) {
      console.error('Error formatting time:', error);
      return "Just now";
    }
  };

  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
  };

  const getMenuItems = (chat) => {
    const currentUserId = getCurrentUserId();
    const isMuted = chat.mutedBy?.includes(currentUserId);
    const isBlocked = chat.blockedUsers?.some(block => block.blocker === currentUserId);
    return [
      {
        key: 'mute',
        label: isMuted ? 'Unmute Chat' : 'Mute Chat',
        icon: isMuted ? <BsBell size={14} /> : <BsBellSlash size={14} />,
        onClick: () => handleMuteChat(chat._id),
        disabled: actionStates[chat._id]?.loading
      },
      {
        key: 'block',
        label: isBlocked ? 'Unblock User' : 'Block User',
        icon: <BsBlockquoteRight size={14} />,
        onClick: () => handleBlockChat(chat._id),
        disabled: actionStates[chat._id]?.loading
      },
      {
        key: 'delete',
        label: 'Delete Chat',
        icon: <BsTrash size={14} />,
        danger: true,
        onClick: () => handleDeleteChat(chat._id),
        disabled: actionStates[chat._id]?.loading
      }
    ];
  };

  const getParticipantInfo = (chat) => {
    const currentUserId = getCurrentUserId();
    const participant = chat.participants?.find(p => p._id !== currentUserId);
    return participant || { userName: 'User', profile: null };
  };

  const renderLoadingState = () => (
    <div className="space-y-4 p-4">
      {[...Array(5)].map((_, i) => (
        <div key={i} className="flex items-center gap-4">
          <Skeleton.Avatar active size={50} shape="circle" />
          <div className="flex-1">
            <Skeleton.Input active block size="small" />
            <Skeleton.Input active block size="small" className="mt-2" />
          </div>
        </div>
      ))}
    </div>
  );

  const renderErrorState = () => (
    <div className={`w-full h-[80vh] rounded-lg flex flex-col shadow-lg border ${isDarkMode ? 'dark-mode bg-gray-800 border-gray-700' : 'bg-[#f9f9f9] border-gray-200'}`}>
      <div className="p-4">
        <Flex gap={8}>
          <Input
            prefix={<BsSearch className="mx-1 text-subtitle" size={20} />}
            placeholder="Search for..."
            allowClear
            style={{ width: '100%', height: 42 }}
            value={searchTerm}
            onChange={handleSearchChange}
          />
        </Flex>
      </div>
      <div className="flex-1 flex flex-col items-center justify-center gap-4">
        <p className={isDarkMode ? 'text-gray-400' : 'text-gray-500'}>
          Failed to load chats. {error?.data?.message || error?.message}
        </p>
        <button
          onClick={refetch}
          className={`px-4 py-2 rounded-md ${isDarkMode ? 'bg-gray-700 hover:bg-gray-600 text-white' : 'bg-gray-100 hover:bg-gray-200 text-gray-800'}`}
        >
          Retry
        </button>
      </div>
    </div>
  );

  if (isLoading && !reduxChats?.length) return renderLoadingState();
  if (isError) return renderErrorState();

  return (
    <div className={`w-full h-[80vh] rounded-lg flex flex-col shadow-lg border ${isDarkMode ? 'dark-mode bg-gray-800 border-gray-700' : 'bg-[#f9f9f9] border-gray-200'}`}>
      <div className="p-4">
        <Flex gap={8}>
          <Input
            prefix={<BsSearch className={`mx-1 ${isDarkMode ? 'text-gray-300' : 'text-subtitle'}`} size={20} />}
            placeholder="Search for..."
            allowClear
            style={{ width: '100%', height: 42 }}
            value={searchTerm}
            onChange={handleSearchChange}
            className={isDarkMode ? 'bg-gray-700 text-white' : ''}
          />
        </Flex>
      </div>
      <div
        ref={chatListRef}
        onScroll={handleScroll}
        className={`chat-list-container flex-1 overflow-y-auto ${isDarkMode ? 'scrollbar-dark' : 'scrollbar-light'}`}
      >
        <style jsx global>{`
          .chat-list-container::-webkit-scrollbar {
            width: 6px;
          }
          .chat-list-container::-webkit-scrollbar-track {
            background: ${isDarkMode ? '#374151' : '#f1f1f1'};
          }
          .chat-list-container::-webkit-scrollbar-thumb {
            background-color: ${isDarkMode ? '#4B5563' : '#c1c1c1'};
            border-radius: 3px;
          }
        `}</style>
        {memoizedChats?.length > 0 ? (
          <AnimatePresence>
            {memoizedChats.map((chat) => {
              const isActionLoading = actionStates[chat._id]?.loading;
              const participant = getParticipantInfo(chat);
              const currentUserId = getCurrentUserId();
              const isMuted = chat.mutedBy?.includes(currentUserId);
              const isBlocked = chat.blockedUsers?.some(block => block.blocker === currentUserId);
              const isRead = chat.lastMessage?.read || chat.unreadCount === 0;
              const isActiveChat = chat._id === id;
              return (
                <motion.div
                  key={chat._id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.2 }}
                >
                  <div
                    onClick={() => !isActionLoading && handleSelectChat(chat._id)}
                    className={`flex items-center gap-4 p-4 rounded-lg relative group ${isActiveChat
                      ? (isDarkMode ? 'bg-gray-700' : 'bg-blue-50')
                      : (isDarkMode ? 'hover:bg-gray-700' : 'hover:bg-blue-50')
                      } ${isDarkMode ? 'text-gray-200' : 'text-gray-800'} ${isActionLoading ? 'opacity-70 cursor-not-allowed' : 'cursor-pointer'}`}
                  >
                    <div className="relative">
                      <Avatar
                        size={50}
                        src={getImageUrl(participant?.profile)}
                        className={`transition-transform duration-200 group-hover:scale-110 ${isBlocked ? 'opacity-50' : ''}`}
                      />
                      {isBlocked && (
                        <div className="absolute inset-0 bg-black bg-opacity-50 rounded-full flex items-center justify-center">
                          <BsBlockquoteRight className="text-white" size={18} />
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-center">
                        <h3 className={`font-medium truncate ${isBlocked ? 'line-through' : ''} ${isRead ? '' : 'font-semibold'}`}>
                          {participant?.userName || "User"}
                        </h3>
                        <div className="flex items-center gap-2">
                          <span className={`text-xs truncate ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                            {formatTime(chat?.lastMessage?.createdAt)}
                          </span>
                          {isMuted && <BsBellSlash className="text-gray-400" size={14} />}
                        </div>
                      </div>
                      <div className="flex items-center gap-2 mt-1">
                        {isRead && chat.lastMessage?.sender === currentUserId && (
                          <BsCheckAll className={`${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`} size={14} />
                        )}
                        <p className={`text-sm truncate ${isDarkMode ? 'text-gray-300' : 'text-gray-600'} ${isRead ? '' : 'font-medium'}`}>
                          {chat?.lastMessage?.text?.slice(0, 30) || ''}
                          {!chat?.lastMessage?.text && chat?.lastMessage?.image && '📷 Photo'}
                          {!chat?.lastMessage?.text && !chat?.lastMessage?.image && 'No messages yet'}
                        </p>
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      {chat?.unreadCount > 0 && (
                        <motion.span
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          className="bg-blue-500 text-white rounded-full px-2 py-1 text-xs min-w-[20px] text-center"
                        >
                          {chat?.unreadCount}
                        </motion.span>
                      )}
                      <Dropdown
                        menu={{ items: getMenuItems(chat) }}
                        trigger={['click']}
                        placement="bottomRight"
                        disabled={isActionLoading}
                      >
                        <motion.button
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.9 }}
                          className={`opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded-full ${isDarkMode ? 'hover:bg-gray-600' : 'hover:bg-gray-200'} cursor-pointer`}
                          onClick={(e) => e.stopPropagation()}
                          disabled={isActionLoading}
                        >
                          <BsThreeDotsVertical />
                        </motion.button>
                      </Dropdown>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        ) : (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex justify-center items-center h-32"
          >
            <p className={isDarkMode ? 'text-gray-400' : 'text-gray-500'}>
              {searchTerm ? 'No matching chats found' : 'No chats yet. Start a conversation!'}
            </p>
          </motion.div>
        )}
      </div>
      {unreadCount > 0 && (
        <div className="p-2 border-t border-gray-200 dark:border-gray-700">
          <div className="text-center text-sm font-medium">
            <span className={`px-3 py-1 rounded-full ${isDarkMode ? 'bg-blue-900 text-blue-200' : 'bg-blue-100 text-blue-800'}`}>
              {unreadCount} unread {unreadCount === 1 ? 'message' : 'messages'}
            </span>
          </div>
        </div>
      )}
    </div>
  );
};

export default ChatList;