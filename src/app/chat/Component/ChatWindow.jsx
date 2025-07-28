'use client';

import { Avatar, Button, Dropdown, Form, Input, Tooltip, Upload, message as antMessage } from 'antd';
import EmojiPicker from 'emoji-picker-react';
import { AnimatePresence, motion } from 'framer-motion';
import { useContext, useEffect, useRef, useState } from 'react';
import toast from 'react-hot-toast';
import { BsEmojiSmile, BsPinAngleFill } from 'react-icons/bs';
import { FiMoreVertical } from 'react-icons/fi';
import { IoMdSend } from 'react-icons/io';
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
  const { data: chatData } = useGetAllChatQuery();
  const chatUser = chatData?.data?.chats?.find(user => user._id === id);
  const { messages, pinnedMessages, isLoading, hasMore, page } = useSelector((state) => state.message);

  const { data: messagesData, refetch } = useGetAllMessagesQuery({ chatId: id, page, limit: 10 });
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
  const [sendingMessage, setSendingMessage] = useState(false); // New state for send button loading

  const reactions = [
    { emoji: '❤️', name: 'love' },
    { emoji: '👍', name: 'thumbs_up' },
    { emoji: '😂', name: 'laugh' },
    { emoji: '😡', name: 'angry' },
    { emoji: '😢', name: 'sad' }
  ];

  // Reset messages when chat changes
  useEffect(() => {
    dispatch(resetMessages());
    setInitialLoad(true);
  }, [id, dispatch]);

  // Scroll to bottom on initial load or new messages
  useEffect(() => {
    if (initialLoad && messages.length > 0) {
      setTimeout(() => {
        scrollToBottom('auto');
        setInitialLoad(false);
      }, 100);
    } else if (isNearBottom && messages.length > 0) {
      setTimeout(() => scrollToBottom('smooth'), 100);
    }
  }, [messages, initialLoad, isNearBottom]);

  // Handle click outside emoji and reaction pickers
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

  // Handle scroll events for infinite loading
  useEffect(() => {
    const container = messagesContainerRef.current;
    if (!container) return;

    const handleScroll = () => {
      const { scrollTop, scrollHeight, clientHeight } = container;
      const distanceFromBottom = scrollHeight - scrollTop - clientHeight;
      setIsNearBottom(distanceFromBottom < 100);

      if (scrollTop < 100 && hasMore && !loadingMore && !isLoading && !initialLoad) {
        loadMoreMessages();
      }
    };

    container.addEventListener('scroll', handleScroll);
    return () => container.removeEventListener('scroll', handleScroll);
  }, [hasMore, isLoading, loadingMore, initialLoad]);

  const loadMoreMessages = async () => {
    if (loadingMore || !hasMore || isLoading) return;

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

  const handleCreateNewMessage = async (values) => {
    if (!values.message && (!values?.file?.fileList || values?.file?.fileList.length === 0)) {
      return;
    }

    try {
      setSendingMessage(true); // Start loading

      let response;
      const formData = new FormData();

      if (values?.file?.fileList?.length > 0) {
        formData.append("image", values?.file?.fileList[0]?.originFileObj);
      }
      formData.append("text", values.message || "");

      if (replyingTo) {
        response = await replyMessage({
          chatId: id,
          messageId: replyingTo._id,
          body: formData
        }).unwrap();
      } else {
        response = await sendMessage({ chatId: id, body: formData }).unwrap();
      }

      if (response.data) {
        // Ensure the sender ID matches before adding to the store
        const confirmedMessage = {
          ...response.data,
          sender: {
            ...response.data.sender,
            _id: loginUserId // Force the sender ID to match current user
          }
        };

        dispatch(addMessage(confirmedMessage));
        form.resetFields();
        setImagePreview(null);
        setShowEmojiPicker(false);
        setReplyingTo(null);
        setTimeout(() => scrollToBottom('auto'), 100);
      }
    } catch (error) {
      antMessage.error(error?.data?.message || "Failed to send message");
    } finally {
      setSendingMessage(false); // Stop loading regardless of outcome
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
      // Optimistic update
      dispatch(updateMessageReaction({
        messageId,
        reaction,
        userId: loginUserId
      }));

      await messageReact({ messageId, reaction }).unwrap();
      setShowReactionPicker({ messageId: null, show: false });
    } catch (error) {
      antMessage.error(error?.data?.message || "Failed to add reaction");
      // Re-fetch to sync with server
      refetch();
    }
  };

  const handlePinMessage = async (messageId, action) => {
    try {
      // Optimistic update
      dispatch(updateMessagePin({
        messageId,
        isPinned: action === 'pin',
        pinnedBy: loginUserId
      }));

      await pinMessage({ messageId, action }).unwrap();
      toast.success(`Message ${action === 'pin' ? 'pinned' : 'unpinned'}`);
    } catch (error) {
      antMessage.error(error?.data?.message || `Failed to ${action} message`);
      // Re-fetch to sync with server
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

  const messageVariants = {
    hidden: { opacity: 0, y: 20, scale: 0.8 },
    visible: { opacity: 1, y: 0, scale: 1 },
    exit: { opacity: 0, scale: 0.8, transition: { duration: 0.2 } }
  };

  const replyVariants = {
    hidden: { opacity: 0, height: 0 },
    visible: { opacity: 1, height: 'auto' }
  };

  return (
    <div className={`w-full h-[80vh] rounded-lg flex flex-col shadow-lg border ${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
      {/* Header */}
      {chatUser?.participants?.map(item => (
        <div key={item._id} className={`flex items-center space-x-4 p-4 border-b ${isDarkMode ? 'border-gray-700' : 'border-gray-200'}`}>
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
          .reply-indicator {
            border-left: 3px solid #3B82F6;
            padding-left: 8px;
            margin-bottom: 8px;
            background: ${isDarkMode ? 'rgba(59, 130, 246, 0.1)' : 'rgba(59, 130, 246, 0.05)'};
            border-radius: 4px;
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

        {isLoading && messages.length === 0 && (
          <div className="flex justify-center items-center h-full">
            <div className="flex items-center space-x-2">
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-500"></div>
              <span className="text-sm text-gray-500">Loading messages...</span>
            </div>
          </div>
        )}

        {!isLoading && messages.length === 0 && (
          <div className="flex justify-center items-center h-full">
            <p className={isDarkMode ? 'text-gray-400' : 'text-gray-500'}>
              No messages yet. Start the conversation!
            </p>
          </div>
        )}

        <AnimatePresence initial={false}>
          {messages?.map((message) => {
            const isCurrentUser = message.sender?._id === loginUserId;
            const isDeleted = message.isDeleted === true;
            const isPinned = pinnedMessages?.some(pinned => pinned._id === message._id);

            return (
              <motion.div
                id={`msg-${message._id}`}
                key={message._id}
                initial="hidden"
                animate="visible"
                exit="exit"
                variants={messageVariants}
                transition={{ duration: 0.3, type: "spring", stiffness: 100 }}
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
                  {/* Pin indicator */}
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
                        ? 'bg-blue-500 text-white'
                        : isDarkMode
                          ? 'bg-gray-700 text-gray-200'
                          : 'bg-white text-gray-800 border border-gray-200'
                      } shadow-sm message-bubble`}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    {/* Reply indicator */}
                    {message.replyTo && !isDeleted && (
                      <div
                        className="reply-indicator p-2 mb-2 text-xs rounded-lg cursor-pointer"
                        onClick={() => {
                          const originalMsg = document.getElementById(`msg-${message.replyTo._id}`);
                          if (originalMsg) {
                            originalMsg.scrollIntoView({ behavior: 'smooth' });
                          }
                        }}
                      >
                        <div className="flex items-center space-x-2">
                          <div className="w-6 h-6 rounded-full bg-gray-300 flex items-center justify-center">
                            <Avatar
                              src={getImageUrl(message.replyTo.sender?.profile)}
                              size={20}
                            />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-blue-600 truncate">
                              {message.replyTo.sender?.userName || 'User'}
                            </p>
                            <p className="truncate text-gray-500">
                              {message.replyTo.text || "📷 Image"}
                            </p>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Message content */}
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

                    {/* Message meta */}
                    <div className="flex items-center justify-between mt-2">
                      <span className={`text-xs ${isCurrentUser
                        ? 'text-blue-100'
                        : isDarkMode
                          ? 'text-gray-400'
                          : 'text-gray-500'
                        }`}>
                        {formatDate(message.createdAt)}
                      </span>
                      {message.read && isCurrentUser && (
                        <span className="text-xs text-blue-200 ml-2">✓✓</span>
                      )}
                    </div>

                    {/* Reactions */}
                    {!isDeleted && message.reactions?.length > 0 && (
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        className="flex gap-1 mt-2"
                      >
                        <div className={`flex items-center px-2 py-1 rounded-full ${isDarkMode ? 'bg-gray-600' : 'bg-gray-100'
                          } shadow-sm`}>
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

                  {/* Message options */}
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
                              label: 'Reply',
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
                          className={`flex items-center justify-center p-2 rounded-full transition-all ${isDarkMode
                            ? 'text-gray-300 bg-gray-700 hover:bg-gray-600'
                            : 'text-gray-600 bg-white hover:bg-gray-100'
                            } shadow-md hover:shadow-lg`}
                        />
                      </Dropdown>
                    </div>
                  )}

                  {/* Reaction picker */}
                  {!isDeleted && showReactionPicker.show && showReactionPicker.messageId === message._id && (
                    <motion.div
                      ref={reactionPickerRef}
                      initial={{ opacity: 0, scale: 0.8, y: 10 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.8, y: 10 }}
                      className={`absolute z-20 p-2 mt-2 rounded-full flex items-center gap-1 ${isDarkMode
                        ? 'bg-gray-700 border border-gray-600'
                        : 'bg-white border border-gray-200'
                        } shadow-lg ${isCurrentUser ? 'right-0' : 'left-0'
                        } -top-12`}
                    >
                      {reactions.map((reaction) => (
                        <Button
                          key={reaction.name}
                          type="text"
                          size="small"
                          className="p-1 hover:bg-gray-100 rounded-full transition-all hover:scale-110"
                          onClick={() => handleAddReaction(message._id, reaction.name)}
                        >
                          <span className="text-lg">{reaction.emoji}</span>
                        </Button>
                      ))}
                    </motion.div>
                  )}
                </div>

                {isCurrentUser && (
                  <Avatar
                    src={getImageUrl(message.sender?.profile)}
                    size={32}
                    className="ml-3 self-start mt-1"
                  />
                )}
              </motion.div>
            );
          })}
        </AnimatePresence>
        <div ref={messagesEndRef} />
      </div>

      {/* Reply indicator */}
      <AnimatePresence>
        {replyingTo && (
          <motion.div
            initial="hidden"
            animate="visible"
            exit="hidden"
            variants={replyVariants}
            className={`p-3 border-t ${isDarkMode ? 'border-gray-700 bg-gray-700' : 'border-gray-200 bg-blue-50'}`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3 flex-1">
                <div className="w-1 h-8 bg-blue-500 rounded-full"></div>
                <Avatar
                  src={getImageUrl(replyingTo.sender?.profile)}
                  size={24}
                />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-blue-600">
                    Replying to {replyingTo.sender?.userName}
                  </p>
                  <p className="text-xs text-gray-500 truncate">
                    {replyingTo.text || "📷 Image"}
                  </p>
                </div>
              </div>
              <Button
                type="text"
                size="small"
                onClick={() => setReplyingTo(null)}
                className="text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-full p-1"
              >
                ✕
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Image preview */}
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

      {/* Message input */}
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
              placeholder="Type a message..."
              autoSize={{ minRows: 1, maxRows: 4 }}
              className={`rounded-full ${isDarkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-gray-100 border-gray-200'}`}
              onKeyPress={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  form.submit();
                }
              }}
            />
          </Form.Item>

          <Button
            type="primary"
            htmlType="submit"
            icon={<IoMdSend />}
            style={{ width: "40px" }}
            className="ml-2"
            loading={sendingMessage || isSending} // Use our new loading state
          />
        </Form>
      </div>
    </div>
  );
};

export default ChatWindow;