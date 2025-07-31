// Modified ChatWindow.js - Same Reply Design as Image

'use client';

import { Avatar, Button, Dropdown, Form, Input, Tooltip, Upload, message as antMessage } from 'antd';
import EmojiPicker from 'emoji-picker-react';
import { AnimatePresence, motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { useContext, useEffect, useRef, useState } from 'react';
import toast from 'react-hot-toast';
import { BsEmojiSmile, BsPinAngleFill } from 'react-icons/bs';
import { FiMoreVertical } from 'react-icons/fi';
import { IoMdSend } from 'react-icons/io';
import { MdClose, MdReply } from 'react-icons/md';
import { TbPinned } from 'react-icons/tb';
import { useDispatch, useSelector } from 'react-redux';
import { getImageUrl } from '../../../../utils/getImageUrl';
import { ImageUplaod } from '../../../../utils/svgImage';
import { useGetAllChatQuery } from '../../../features/chat/chatList/chatApi';
import { useGetAllMessagesQuery, useMessageSendMutation, usePinMessageMutation, useReactMessageMutation, useReplyMessageMutation } from '../../../features/chat/message/messageApi';
import { addMessage, resetMessages, setPage, updateMessagePin, updateMessageReaction } from '../../../redux/features/messageSlice';
import { ThemeContext } from '../../ClientLayout';

const ChatWindow = ({ id }) => {
  const dispatch = useDispatch();
  const router = useRouter();
  const { data: chatData } = useGetAllChatQuery();
  const chatUser = chatData?.data?.chats?.find(user => user._id === id);

  const { messages, pinnedMessages, isLoading, hasMore, page } = useSelector((state) => state.message);

  console.log(messages)

  // FIXED: Add proper dependency array and skip logic
  const { data: allMessage, refetch, isFetching } = useGetAllMessagesQuery(
    { chatId: id, page, limit: 10 },
    {
      skip: !id,
      refetchOnMountOrArgChange: true // This ensures fresh data when component mounts
    }
  );

  // const messages = allMessage?.data?.messages || [];

  const [sendMessage, { isLoading: isSending }] = useMessageSendMutation();
  const [messageReact] = useReactMessageMutation();
  const [pinMessage] = usePinMessageMutation();
  const [replyMessage] = useReplyMessageMutation();
  const loginUserId = localStorage.getItem("login_user_id");
  const [form] = Form.useForm();
  const messagesEndRef = useRef(null);
  const messagesContainerRef = useRef(null);
  const [imagePreview, setImagePreview] = useState(null);
  const { isDarkMode } = useContext(ThemeContext);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showReactionPicker, setShowReactionPicker] = useState({ messageId: null, show: false });
  const [replyingTo, setReplyingTo] = useState(null);
  const inputRef = useRef(null);
  const emojiPickerRef = useRef(null);
  const emojiButtonRef = useRef(null);
  const reactionPickerRef = useRef(null);
  const [isNearBottom, setIsNearBottom] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [initialLoad, setInitialLoad] = useState(true);
  const [sendingMessage, setSendingMessage] = useState(false);

  // FIXED: Track current chat ID to detect changes
  const [currentChatId, setCurrentChatId] = useState(null);

  const reactions = [
    { emoji: '❤️', name: 'love' },
    { emoji: '👍', name: 'thumbs_up' },
    { emoji: '😂', name: 'laugh' },
    { emoji: '😡', name: 'angry' },
    { emoji: '😢', name: 'sad' }
  ];

  // Helper function to check if current user has reacted with a specific reaction
  const hasUserReacted = (message, reactionType) => {
    return message.reactions?.some(reaction =>
      reaction.userId?._id === loginUserId && reaction.reactionType === reactionType
    );
  };

  // Helper function to get the original message for replies
  const getOriginalMessage = (replyToId) => {
    return messages.find(msg => msg._id === replyToId);
  };

  // FIXED: Better chat switching logic
  useEffect(() => {
    if (id && id !== currentChatId) {
      console.log('Switching to new chat:', id);

      // Reset all state when switching chats
      dispatch(resetMessages());
      setCurrentChatId(id);
      setInitialLoad(true);
      setReplyingTo(null);
      setImagePreview(null);
      setShowEmojiPicker(false);
      setShowReactionPicker({ messageId: null, show: false });
      form.resetFields();

      // Force refetch for new chat
      if (refetch) {
        refetch();
      }
    }
  }, [id, dispatch, refetch, currentChatId, form]);

  // FIXED: Scroll to bottom logic
  useEffect(() => {
    if (initialLoad && messages.length > 0) {
      setTimeout(() => {
        scrollToBottom('auto');
        setInitialLoad(false);
      }, 100);
    } else if (isNearBottom && messages.length > 0 && !initialLoad) {
      setTimeout(() => scrollToBottom('smooth'), 100);
    }
  }, [messages, initialLoad, isNearBottom]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (showEmojiPicker && emojiPickerRef.current && !emojiPickerRef.current.contains(event.target) &&
        emojiButtonRef.current && !emojiButtonRef.current.contains(event.target)) {
        setShowEmojiPicker(false);
      }

      if (showReactionPicker.show && reactionPickerRef.current && !reactionPickerRef.current.contains(event.target)) {
        setShowReactionPicker({ messageId: null, show: false });
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showEmojiPicker, showReactionPicker]);

  useEffect(() => {
    const container = messagesContainerRef.current;
    if (!container) return;

    const handleScroll = () => {
      const { scrollTop, scrollHeight, clientHeight } = container;
      const distanceFromBottom = scrollHeight - scrollTop - clientHeight;
      setIsNearBottom(distanceFromBottom < 100);

      if (scrollTop < 100 && hasMore && !loadingMore && !isLoading && !initialLoad && !isFetching) {
        loadMoreMessages();
      }
    };

    container.addEventListener('scroll', handleScroll);
    return () => container.removeEventListener('scroll', handleScroll);
  }, [hasMore, isLoading, loadingMore, initialLoad, isFetching]);

  const loadMoreMessages = async () => {
    if (loadingMore || !hasMore || isLoading || isFetching) return;

    setLoadingMore(true);
    try {
      const container = messagesContainerRef.current;
      const prevScrollHeight = container.scrollHeight;
      const prevScrollTop = container.scrollTop;

      dispatch(setPage(page + 1));
      await new Promise(resolve => setTimeout(resolve, 500));

      const newScrollHeight = container.scrollHeight;
      const heightDifference = newScrollHeight - prevScrollHeight;
      container.scrollTop = prevScrollTop + heightDifference;
    } finally {
      setLoadingMore(false);
    }
  };

  const scrollToBottom = (behavior = 'smooth') => {
    messagesEndRef.current?.scrollIntoView({ behavior });
  };

  const navigateToRepliedMessage = (replyToMessage) => {
    const originalMessageId = replyToMessage._id;
    const originalMsg = document.getElementById(`msg-${originalMessageId}`);

    if (originalMsg) {
      originalMsg.scrollIntoView({
        behavior: 'smooth',
        block: 'center'
      });

      originalMsg.classList.add('message-highlight');

      setTimeout(() => {
        originalMsg.classList.remove('message-highlight');
      }, 2000);
    } else {
      const messageExists = messages.find(msg => msg._id === originalMessageId);

      if (messageExists) {
        antMessage.info('Message found but not visible. Loading more messages...');
      } else {
        antMessage.warning('Original message not found or may have been deleted');
      }
    }
  };

  const handleCreateNewMessage = async (values) => {
    if (sendingMessage || isSending) return; // Prevent multiple submissions
    if (!values.message && (!values?.file?.fileList || values?.file?.fileList.length === 0)) {
      return;
    }

    try {
      setSendingMessage(true);

      let response;
      const formData = new FormData();

      if (values?.file?.fileList?.length > 0) {
        formData.append("image", values?.file?.fileList[0]?.originFileObj);
      }
      if (values.message) {
        formData.append("text", values.message);
      }

      if (replyingTo) {
        if (values?.file?.fileList?.length > 0) {
          response = await replyMessage({
            chatId: id,
            messageId: replyingTo._id,
            body: formData
          }).unwrap();
        } else {
          response = await replyMessage({
            chatId: id,
            messageId: replyingTo._id,
            body: { text: values.message }
          }).unwrap();
        }

        if (response.data) {
          if (response.data.originalMessage && response.data.reply) {
            const replyWithReference = {
              ...response.data.reply,
              replyTo: replyingTo._id,
              sender: {
                ...response.data.reply.sender,
                _id: loginUserId
              }
            };
            dispatch(addMessage(replyWithReference));
          } else {
            const replyWithReference = {
              ...response.data,
              replyTo: replyingTo._id,
              sender: {
                ...response.data.sender,
                _id: loginUserId
              }
            };
            dispatch(addMessage(replyWithReference));
          }
        }
      } else {
        response = await sendMessage({ chatId: id, body: formData }).unwrap();

        if (response.data) {
          const confirmedMessage = {
            ...response.data,
            sender: {
              ...response.data.sender,
              _id: loginUserId
            }
          };
          dispatch(addMessage(confirmedMessage));
        }
      }

      form.resetFields();
      setImagePreview(null);
      setShowEmojiPicker(false);
      setReplyingTo(null);
      setTimeout(() => scrollToBottom('auto'), 100);

    } catch (error) {
      antMessage.error(error?.data?.message || "Failed to send message");
      console.error("Message send error:", error);
    } finally {
      setSendingMessage(false);
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: 'numeric',
      hour12: true
    });
  };

  const handleFileChange = ({ fileList }) => {
    if (fileList.length > 0) {
      const file = fileList[0].originFileObj;
      const reader = new FileReader();
      reader.onload = (e) => setImagePreview(e.target.result);
      reader.readAsDataURL(file);
    } else {
      setImagePreview(null);
    }
    form.setFieldsValue({ file: { fileList } });
  };

  const removeImage = () => {
    setImagePreview(null);
    form.setFieldsValue({ file: { fileList: [] } });
  };

  const onEmojiClick = (emojiData) => {
    const currentMessage = form.getFieldValue('message') || '';
    form.setFieldsValue({ message: currentMessage + emojiData.emoji });
    inputRef.current.focus();
  };

  const handleAddReaction = async (messageId, reaction) => {
    try {
      const message = messages.find(msg => msg._id === messageId);
      const hasReacted = hasUserReacted(message, reaction);

      // Optimistically update the UI
      dispatch(updateMessageReaction({
        messageId,
        reaction,
        userId: loginUserId
      }));

      await messageReact({ messageId, reaction }).unwrap();

      // FIXED: Close reaction picker after successful reaction
      setShowReactionPicker({ messageId: null, show: false });

    } catch (error) {
      antMessage.error(error?.data?.message || "Failed to add reaction");
      // Reset UI state on error
      setShowReactionPicker({ messageId: null, show: false });
      refetch();
    }
  };

  const handlePinMessage = async (messageId, action) => {
    try {
      const response = await pinMessage({ messageId, action }).unwrap();
      console.log(response)
      dispatch(updateMessagePin({
        messageId,
        isPinned: action === 'pin',
        pinnedBy: loginUserId
      }));

      toast.success(`Message ${action === 'pin' ? 'pinned' : 'unpinned'}`);
    } catch (error) {
      antMessage.error(error?.data?.message || `Failed to ${action} message`);
      refetch();
    }
  };

  const toggleReactionPicker = (messageId) => {
    setShowReactionPicker(prev =>
      prev.messageId === messageId && prev.show
        ? { messageId: null, show: false }
        : { messageId, show: true }
    );
  };

  const toggleEmojiPicker = () => {
    setShowEmojiPicker(!showEmojiPicker);
    if (showReactionPicker.show) {
      setShowReactionPicker({ messageId: null, show: false });
    }
  };

  const getReactionEmoji = (reactionType) => {
    const reactionMap = {
      love: "❤️",
      thumbs_up: "👍",
      laugh: "😂",
      angry: "😡",
      sad: "😢"
    };
    return reactionMap[reactionType] || "👍";
  };

  const replyVariants = {
    hidden: { opacity: 0, height: 0 },
    visible: { opacity: 1, height: 'auto' }
  };

  // FIXED: Show loading state when switching chats
  if (!id) {
    return (
      <div className="flex justify-center items-center h-[80vh]">
        <p className="text-gray-500">Select a chat to start messaging</p>
      </div>
    );
  }

  return (
    <div className={`w-full h-[80vh] rounded-lg flex flex-col shadow-lg border ${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
      {/* Header */}
      {chatUser?.participants?.map(item => (
        <div onClick={() => router.push(`/profiles/${item._id}`)} key={item._id} className={`flex items-center cursor-pointer space-x-4 p-4 border-b ${isDarkMode ? 'border-gray-700' : 'border-gray-200'}`}>
          <div className="relative">
            <Avatar
              src={getImageUrl(item?.profile)}
              size={48}
            />
            <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-white"></div>
          </div>
          <div>
            <h2 className={`text-xl font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>{item?.userName}</h2>
            <p className={`text-sm ${isDarkMode ? 'text-green-400' : 'text-green-500'}`}>Online</p>
          </div>
        </div>
      ))}

      {/* Pinned Messages */}
      {pinnedMessages?.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className={`p-3 border-b ${isDarkMode ? 'bg-gray-700 border-gray-600' : 'bg-blue-50 border-blue-200'}`}
        >
          <div className="flex items-center text-sm font-medium text-blue-600">
            <TbPinned className="mr-2" />
            Pinned Messages
          </div>
          <div className="mt-1 space-y-2">
            {pinnedMessages.map(msg => (
              <div key={msg._id} className="flex items-start text-sm">
                <span className="truncate text-gray-600">
                  {msg.text || (msg.images?.length > 0 ? "📷 Image" : "Message")}
                </span>
              </div>
            ))}
          </div>
        </motion.div>
      )}

      {/* Messages Container */}
      <div
        ref={messagesContainerRef}
        className={`flex-1 p-4 overflow-y-auto message-container ${isDarkMode ? 'bg-gray-800' : 'bg-gray-50'}`}
      >
        <style jsx global>{`
          .message-container::-webkit-scrollbar {
            width: 6px;
          }
          .message-container::-webkit-scrollbar-track {
            background: ${isDarkMode ? '#2D3748' : '#F5F5F6'};
            border-radius: 10px;
          }
          .message-container::-webkit-scrollbar-thumb {
            background-color: ${isDarkMode ? '#4A5568' : '#CBD5E0'};
            border-radius: 10px;
          }
          .message-container::-webkit-scrollbar-thumb:hover {
            background-color: ${isDarkMode ? '#718096' : '#A0AEC0'};
          }
          .message-bubble {
            position: relative;
            transition: all 0.3s ease;
            transform-origin: center;
          }
          .message-bubble:hover {
            transform: translateY(-2px);
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
          }
          .message-options {
            opacity: 0;
            transition: all 0.3s ease;
            transform: translateX(10px);
          }
          .message-wrapper:hover .message-options {
            opacity: 1;
            transform: translateX(0);
          }
          .deleted-message {
            background-color: ${isDarkMode ? '#4A5568' : '#F7FAFC'} !important;
            font-style: italic;
            opacity: 0.7;
          }
          
          /* UPDATED REPLY INDICATOR STYLES - Same as Image */
          .reply-indicator {
            background: transparent;
            padding: 0;
            margin-bottom: 8px;
            border: none;
            cursor: pointer;
            transition: all 0.2s ease;
          }
          .reply-indicator:hover {
            background: transparent;
            transform: none;
            border: none;
          }
          
          .reply-preview-bubble {
            background: ${isDarkMode ? '#374151' : '#F3F4F6'};
            border-radius: 12px;
            padding: 8px 12px;
            margin-bottom: 4px;
            font-size: 12px;
            color: ${isDarkMode ? '#9CA3AF' : '#6B7280'};
            line-height: 1.3;
          }
          
          .message-highlight {
            border-radius: 16px !important;
            animation: pulse-bg 2s ease-in-out infinite !important;
            z-index: 10 !important;
            position: relative !important;
          }

          @keyframes pulse-bg {
            0% {
              background-color: rgba(156, 163, 175, 0.1);
            }
            50% {
              background-color: rgba(156, 163, 175, 0.3);
            }
            100% {
              background-color: rgba(156, 163, 175, 0.1);
            }
          }
          
          .reply-preview {
            background: ${isDarkMode ? 'rgba(59, 130, 246, 0.1)' : 'rgba(59, 130, 246, 0.05)'};
            border: 1px solid ${isDarkMode ? 'rgba(59, 130, 246, 0.3)' : 'rgba(59, 130, 246, 0.2)'};
            border-radius: 12px;
            padding: 12px 16px;
            margin-bottom: 8px;
            position: relative;
            overflow: hidden;
          }
          
          .reply-preview::before {
            content: '';
            position: absolute;
            left: 0;
            top: 0;
            bottom: 0;
            width: 4px;
            background: linear-gradient(to bottom, #3B82F6, #1D4ED8);
          }
          
          .reply-content {
            margin-left: 12px;
          }
          
          .reply-close-btn {
            position: absolute;
            top: 8px;
            right: 8px;
            width: 24px;
            height: 24px;
            border-radius: 50%;
            background: ${isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'};
            display: flex;
            align-items: center;
            justify-content: center;
            cursor: pointer;
            transition: all 0.2s ease;
          }
          
          .reply-close-btn:hover {
            background: ${isDarkMode ? 'rgba(255, 255, 255, 0.2)' : 'rgba(0, 0, 0, 0.2)'};
            transform: scale(1.1);
          }
          
          .reaction-selected {
            background: linear-gradient(135deg, #3B82F6, #1D4ED8) !important;
            transform: scale(1.1);
            box-shadow: 0 2px 8px rgba(59, 130, 246, 0.4);
          }
        `}</style>

        {loadingMore && (
          <div className="flex justify-center py-4">
            <div className="flex items-center space-x-2">
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-500"></div>
              <span className="text-sm text-gray-500">Loading more messages...</span>
            </div>
          </div>
        )}

        {(isLoading || isFetching) && messages.length === 0 && (
          <div className="flex justify-center items-center h-full">
            <div className="flex items-center space-x-2">
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-500"></div>
              <span className="text-sm text-gray-500">Loading messages...</span>
            </div>
          </div>
        )}

        {!isLoading && !isFetching && messages.length === 0 && (
          <div className="flex justify-center items-center h-full">
            <p className={isDarkMode ? 'text-gray-400' : 'text-gray-500'}>
              No messages yet. Start the conversation!
            </p>
          </div>
        )}

        <AnimatePresence initial={false}>
          {[...messages]?.reverse()?.map((message) => {
            const isCurrentUser = message.sender?._id === loginUserId;
            const isDeleted = message.isDeleted === true;
            const isPinned = pinnedMessages?.some(pinned => pinned._id === message._id);
            const originalMessage = message.replyTo ? getOriginalMessage(message.replyTo) : null;

            return (
              <motion.div
                id={`msg-${message._id}`}
                key={message._id}
                className={`flex ${isCurrentUser ? 'justify-end' : 'justify-start'} mb-6 message-wrapper`}
              >
                {!isCurrentUser && (
                  <Avatar
                    src={getImageUrl(message.sender?.profile)}
                    size={32}
                    className="mr-3 self-start mt-1"
                  />
                )}

                <div className="relative group max-w-[75%]">
                  {/* Reply Indicator - Updated to match image design */}
                  {originalMessage && !isDeleted && (
                    <div className="mb-2">
                      {/* Reply indicator text */}
                      <div className="flex items-center text-xs text-gray-400 mb-1">
                        <svg className="w-3 h-3 mr-1 rotate-180" fill="currentColor" viewBox="0 0 20 20">
                          <path d="M10 12L4 6h12l-6 6z" />
                        </svg>
                        <span>
                          {isCurrentUser ? 'You' : message.sender?.userName} replied to {originalMessage.sender?.userName}
                        </span>
                      </div>

                      {/* Original message preview bubble */}
                      <div
                        className="reply-preview-bubble cursor-pointer"
                        onClick={() => navigateToRepliedMessage(originalMessage)}
                      >
                        {originalMessage.text || (originalMessage.images?.length > 0 ? "📷 Photo" : "Message")}
                      </div>
                    </div>
                  )}

                  {isPinned && (
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className="absolute -top-5 left-1/2 transform -translate-x-1/2"
                    >
                      <BsPinAngleFill className="text-blue-500 text-sm" />
                    </motion.div>
                  )}

                  <motion.div
                    className={`relative p-4 rounded-2xl ${isDeleted
                      ? 'deleted-message'
                      : isCurrentUser
                        ? 'bg-blue-600 text-white rounded-br-md'
                        : isDarkMode
                          ? 'bg-gray-700 text-gray-200 rounded-bl-md'
                          : 'bg-white text-gray-800 border border-gray-200 rounded-bl-md'
                      }`}
                  >
                    {message.images?.length > 0 && !isDeleted && (
                      <div className="mb-3">
                        <img
                          src={getImageUrl(message.images[0])}
                          alt="Message attachment"
                          className="rounded-lg max-w-full h-auto max-h-64 object-cover cursor-pointer hover:opacity-90 transition-opacity"
                          onClick={() => window.open(getImageUrl(message.images[0]), '_blank')}
                        />
                      </div>
                    )}

                    {!isDeleted && message.text && (
                      <p className="whitespace-pre-wrap break-words">{message.text}</p>
                    )}

                    {isDeleted && (
                      <p className="text-gray-500 italic flex items-center">
                        <span className="mr-2">🗑️</span>
                        This message has been deleted
                      </p>
                    )}

                    <div className="flex items-center justify-between mt-2">
                      <span className={`text-xs ${isCurrentUser
                        ? ''
                        : isDarkMode
                          ? 'text-gray-400'
                          : 'text-gray-500'
                        }`}>
                        {formatDate(message.createdAt)}
                      </span>
                      {message.read && isCurrentUser && (
                        <div className="flex ml-2">
                          <svg className="w-3 h-3 text-green-400" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                          <svg className="w-3 h-3 text-green-400 -ml-1" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                        </div>
                      )}
                    </div>

                    {!isDeleted && message.reactions?.length > 0 && (
                      <motion.div className="flex gap-1 mt-2">
                        <div className={`flex items-center px-2 py-1 rounded-full ${isDarkMode ? 'bg-gray-600' : 'bg-gray-100'} shadow-sm`}>
                          {message.reactions.map((reaction, i) => (
                            <Tooltip key={i} title={reaction?.userId?.userName || 'User'}>
                              <span className="text-sm mr-1">
                                {getReactionEmoji(reaction.reactionType)}
                              </span>
                            </Tooltip>
                          ))}
                          <span className="text-xs text-gray-500 ml-1">
                            {message.reactions.length}
                          </span>
                        </div>
                      </motion.div>
                    )}
                  </motion.div>

                  {!isDeleted && (
                    <div className={`message-options absolute ${isCurrentUser ? 'left-0 -translate-x-full' : 'right-0 translate-x-full'
                      } top-1/2 -translate-y-1/2 flex space-x-1`}>
                      <Button
                        type="text"
                        size="small"
                        icon={<BsEmojiSmile />}
                        className={`flex items-center justify-center p-2 rounded-full transition-all ${isDarkMode
                          ? 'text-gray-300 bg-gray-700 hover:bg-gray-600'
                          : 'text-gray-600 bg-white hover:bg-gray-100'
                          } shadow-md hover:shadow-lg`}
                        onClick={() => toggleReactionPicker(message._id)}
                      />

                      <Dropdown
                        menu={{
                          items: [
                            {
                              key: 'reply',
                              label: (
                                <div className="flex items-center space-x-2">
                                  <MdReply size={16} />
                                  <span>Reply</span>
                                </div>
                              ),
                              onClick: () => setReplyingTo(message)
                            },
                            {
                              key: 'pin',
                              label: isPinned ? 'Unpin Message' : 'Pin Message',
                              icon: <TbPinned size={14} />,
                              onClick: () => handlePinMessage(message._id, isPinned ? 'unpin' : 'pin')
                            }
                          ]
                        }}
                        trigger={['click']}
                        placement={isCurrentUser ? 'bottomLeft' : 'bottomRight'}
                      >
                        <Button
                          type="text"
                          size="small"
                          icon={<FiMoreVertical />}
                          className={`flex items-center justify-center p-2 rounded-full ${isDarkMode
                            ? 'text-gray-300 bg-gray-700 '
                            : 'text-gray-600 bg-white '
                            } shadow-md hover:shadow-lg`}
                        />
                      </Dropdown>
                    </div>
                  )}

                  {/* Enhanced Reaction Picker */}
                  {!isDeleted && showReactionPicker.show && showReactionPicker.messageId === message._id && (
                    <motion.div
                      ref={reactionPickerRef}
                      initial={{ opacity: 0, scale: 0.8, y: 10 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.8, y: 10 }}
                      className={`absolute z-20 p-3 mt-2 rounded-2xl flex items-center gap-2 ${isDarkMode
                        ? 'bg-gray-700 border border-gray-600'
                        : 'bg-white border border-gray-200'
                        } shadow-xl backdrop-blur-sm ${isCurrentUser ? 'right-0' : 'left-0'
                        } -top-16`}
                    >
                      <div className="flex items-center gap-1">
                        {reactions.map((reaction) => {
                          const isSelected = hasUserReacted(message, reaction.name);
                          return (
                            <div
                              key={reaction.name}
                              type="text"
                              size="small"
                              className={`p-2 rounded cursor-pointer  transition-all duration-200 transform ${isSelected
                                ? 'bg-gray-300'
                                : isDarkMode
                                  ? 'hover:bg-gray-600'
                                  : 'hover:bg-gray-100'
                                }`}
                              onClick={() => handleAddReaction(message._id, reaction.name)}
                            >
                              <span className="text-lg">{reaction.emoji}</span>
                            </div>
                          );
                        })}
                      </div>
                      <div className="w-px h-6 bg-gray-300 mx-1"></div>
                      <Button
                        type="text"
                        size="small"
                        icon={<MdClose size={16} />}
                        className={`p-1 rounded-full transition-all ${isDarkMode
                          ? 'text-gray-400 hover:text-white hover:bg-gray-600'
                          : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
                          }`}
                        onClick={() => setShowReactionPicker({ messageId: null, show: false })}
                      />
                    </motion.div>
                  )}
                </div>

                {isCurrentUser && (
                  <div className='flex flex-col justify-end'>
                    <Avatar
                      src={getImageUrl(message.sender?.profile)}
                      size={32}
                      className="ml-3 self-end flex flex-col  mt-1"
                    />
                  </div>
                )}
              </motion.div>
            );
          })}
        </AnimatePresence>
        <div ref={messagesEndRef} />
      </div>

      {/* Enhanced Reply Preview */}
      <AnimatePresence>
        {replyingTo && (
          <motion.div
            initial="hidden"
            animate="visible"
            exit="hidden"
            variants={replyVariants}
            className={`border-t ${isDarkMode ? 'border-gray-700' : 'border-gray-200'}`}
          >
            <div className="reply-preview mx-4 mt-3">
              <div className="reply-content">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center space-x-2">
                    <MdReply className="text-blue-500" size={18} />
                    <span className="text-sm font-medium text-blue-600">
                      Replying to {replyingTo.sender?.userName}
                    </span>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <Avatar
                    src={getImageUrl(replyingTo.sender?.profile)}
                    size={28}
                    className="flex-shrink-0"
                  />
                  <div className="flex-1 min-w-0">
                    {replyingTo.images?.length > 0 && (
                      <div className="mb-2">
                        <img
                          src={getImageUrl(replyingTo.images[0])}
                          alt="Reply preview"
                          className="w-12 h-12 rounded-lg object-cover"
                        />
                      </div>
                    )}
                    <p className="text-sm text-gray-600 line-clamp-2 leading-relaxed">
                      {replyingTo.text || "📷 Photo"}
                    </p>
                  </div>
                </div>
              </div>
              <div
                className="reply-close-btn"
                onClick={() => setReplyingTo(null)}
              >
                <MdClose size={14} />
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Image Preview */}
      <AnimatePresence>
        {imagePreview && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className={`p-3 border-t ${isDarkMode ? 'border-gray-700' : 'border-gray-200'}`}
          >
            <div className="relative inline-block">
              <img
                src={imagePreview}
                alt="Preview"
                className={`h-20 w-auto rounded-lg object-cover border-2 ${isDarkMode ? 'border-gray-600' : 'border-gray-200'
                  }`}
              />
              <Button
                type="text"
                className={`absolute -top-2 -right-2 rounded-full p-0 flex items-center justify-center h-6 w-6 shadow-md ${isDarkMode ? 'bg-gray-700 text-white' : 'bg-white text-gray-800'
                  } hover:bg-red-500 hover:text-white transition-all`}
                onClick={removeImage}
              >
                ✕
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Message Input */}
      <div className={`p-3 border-t ${isDarkMode ? 'border-gray-700' : 'border-gray-200'} flex items-center`}>
        <Form form={form} onFinish={handleCreateNewMessage} className="flex-1 flex items-center">
          <Form.Item name="file" noStyle>
            <div className='flex'>
              <div className="relative">
                <Button
                  ref={emojiButtonRef}
                  type="text"
                  icon={<BsEmojiSmile size={20} />}
                  className={`absolute top-1/2 transform -translate-y-1/2 ${isDarkMode ? 'text-gray-400 hover:text-gray-300' : 'text-gray-500 hover:text-gray-600'}`}
                  onClick={toggleEmojiPicker}
                />
                {showEmojiPicker && (
                  <div ref={emojiPickerRef} className="absolute bottom-12 right-0 z-10">
                    <EmojiPicker
                      onEmojiClick={onEmojiClick}
                      width={300}
                      height={350}
                      theme={isDarkMode ? 'dark' : 'light'}
                    />
                  </div>
                )}
              </div>

              <Upload
                accept="image/*"
                showUploadList={false}
                beforeUpload={() => false}
                onChange={handleFileChange}
                maxCount={1}
              >
                <Button
                  type="text"
                  icon={<ImageUplaod />}
                  className={`mx-2 ${isDarkMode ? 'text-gray-400 hover:text-gray-300' : 'text-gray-500 hover:text-gray-600'}`}
                />
              </Upload>
            </div>
          </Form.Item>

          <Form.Item name="message" noStyle className="flex-1">
            <Input.TextArea
              ref={inputRef}
              disabled={chatUser?.isBlocked}
              placeholder={replyingTo ? `Reply to ${replyingTo.sender?.userName}...` : "Type a message..."}
              autoSize={{ minRows: 1, maxRows: 4 }}
              className={`rounded-full ${isDarkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-gray-100 border-gray-200'}`}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  if (!sendingMessage && !isSending) {
                    form.submit();
                  }
                }
              }}
            />
          </Form.Item>

          <Button
            type="primary"
            htmlType="submit"
            icon={<IoMdSend />}
            iconPosition="end"
            style={{ width: "70px" }}
            className="ml-2"
            loading={sendingMessage || isSending}
            disabled={sendingMessage || isSending || chatUser?.isBlocked} // Disable button during send
          >Send</Button>
        </Form>
      </div>
    </div>
  );
};

export default ChatWindow;