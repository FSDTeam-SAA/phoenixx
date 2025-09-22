"use client";

import {
  Avatar,
  Button,
  Dropdown,
  Form,
  Input,
  Tooltip,
  Upload,
  message as antMessage,
} from "antd";
import EmojiPicker from "emoji-picker-react";
import { AnimatePresence, motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { useContext, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import toast from "react-hot-toast";
import { BsEmojiSmile, BsPinAngleFill } from "react-icons/bs";
import { FaEllipsisVertical } from "react-icons/fa6";
import { IoMdSend } from "react-icons/io";
import { MdClose, MdReply } from "react-icons/md";
import { TbPinned } from "react-icons/tb";
import { useDispatch, useSelector } from "react-redux";
import { getImageUrl } from "../../../../utils/getImageUrl";
import {
  DarkEmoji,
  DarkImageUpload,
  LightEmoji,
  LightImageUpoload,
} from "../../../../utils/svgImage";
import useOnlineStatus from "../../../../utils/useOnlineStatus";
import { useGetAllChatQuery } from "../../../features/chat/chatList/chatApi";
import {
  useGetAllMessagesQuery,
  useMessageSendMutation,
  usePinMessageMutation,
  useReactMessageMutation,
  useReplyMessageMutation,
} from "../../../features/chat/message/messageApi";
import {
  addMessage,
  resetMessages,
  setCurrentChatId,
  setPage,
  updateMessagePin,
  updateMessageReaction,
} from "../../../redux/features/messageSlice";
import { useMessageRefetch } from "../../../redux/features/useMessageRefetch";
import { ThemeContext } from "../../ClientLayout";

const ChatWindow = ({ id }) => {
  const dispatch = useDispatch();
  const router = useRouter();
  const { data: chatData } = useGetAllChatQuery();
  const chatUser = chatData?.data?.chats?.find((user) => user._id === id);
  console.log("chatUser", chatUser);
  const isOnline = useOnlineStatus();

  const { messages, pinnedMessages, isLoading, hasMore, page, currentChatId } =
    useSelector((state) => state.message);
  const { refetch } = useMessageRefetch();

  const {
    data: allMessage,
    isFetching,
    refetch: refetchMessages,
  } = useGetAllMessagesQuery(
    { chatId: id, page, limit: 10 },
    {
      refetchOnMountOrArgChange: true,
      skip: !id, // ID না থাকলে skip করবে
    }
  );

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
  const [showReactionPicker, setShowReactionPicker] = useState({
    messageId: null,
    show: false,
    position: null,
  });
  const [replyingTo, setReplyingTo] = useState(null);
  const inputRef = useRef(null);
  const emojiPickerRef = useRef(null);
  const emojiButtonRef = useRef(null);
  const reactionPickerRef = useRef(null);
  const [isNearBottom, setIsNearBottom] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [initialLoad, setInitialLoad] = useState(true);
  const [sendingMessage, setSendingMessage] = useState(false);
  const [showAllPinnedMessages, setShowAllPinnedMessages] = useState(false);

  // Improved scroll state management
  const [userScrolled, setUserScrolled] = useState(false);
  const isAutoScrollingRef = useRef(false);
  const lastMessageCountRef = useRef(0);
  const scrollTimeoutRef = useRef(null);

  const reactions = [
    { emoji: "❤️", name: "love" },
    { emoji: "👍", name: "thumbs_up" },
    { emoji: "😂", name: "laugh" },
    { emoji: "😡", name: "angry" },
    { emoji: "😢", name: "sad" },
  ];

  const hasUserReacted = (message, reactionType) => {
    return message.reactions?.some(
      (reaction) =>
        reaction.userId?._id === loginUserId &&
        reaction.reactionType === reactionType
    );
  };

  const getOriginalMessage = (replyToId) => {
    return messages.find((msg) => msg._id === replyToId);
  };

  // Reset state when chat changes
  useEffect(() => {
    if (id && id !== currentChatId) {
      dispatch(setCurrentChatId(id));
      dispatch(resetMessages());
      setInitialLoad(true);
      setReplyingTo(null);
      setImagePreview(null);
      setShowEmojiPicker(false);
      setShowReactionPicker({ messageId: null, show: false, position: null });
      form.resetFields();
      refetchMessages();

      // Redux স্টেট রিসেট করুন
      dispatch(setCurrentChatId(id));
      dispatch(resetMessages());
      setInitialLoad(true);
      setShowAllPinnedMessages(false);
      setUserScrolled(false);
      lastMessageCountRef.current = 0;
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current);
      }
    }
  }, [id, dispatch, form, currentChatId]);

  useEffect(() => {
    if (allMessage && !isFetching) {
      setTimeout(() => {
        scrollToBottom("auto");
      }, 100);
    }
  }, [allMessage, isFetching]);

  // Improved scroll handler with better top detection
  useEffect(() => {
    const container = messagesContainerRef.current;
    if (!container) return;

    const handleScroll = () => {
      // Skip if we're auto-scrolling
      if (isAutoScrollingRef.current) return;

      const { scrollTop, scrollHeight, clientHeight } = container;
      const distanceFromBottom = scrollHeight - scrollTop - clientHeight;
      const isAtBottom = distanceFromBottom < 50;
      const isAtTop = scrollTop <= 1; // Very small threshold for top detection

      setIsNearBottom(isAtBottom);

      // Set user scrolled flag if not at bottom
      if (!isAtBottom && !initialLoad) {
        setUserScrolled(true);
      } else if (isAtBottom) {
        setUserScrolled(false);
      }
    };

    container.addEventListener("scroll", handleScroll, { passive: true });
    return () => container.removeEventListener("scroll", handleScroll);
  }, [hasMore, isLoading, loadingMore, initialLoad, isFetching]);

  // Handle auto-scroll for new messages
  useEffect(() => {
    const container = messagesContainerRef.current;
    if (!container || messages.length === 0) return;

    const hasNewMessages = messages.length > lastMessageCountRef.current;
    lastMessageCountRef.current = messages.length;

    if (initialLoad) {
      // Initial load - always scroll to bottom
      isAutoScrollingRef.current = true;
      container.scrollTop = container.scrollHeight;
      setInitialLoad(false);

      // Reset auto-scroll flag after a brief delay
      setTimeout(() => {
        isAutoScrollingRef.current = false;
      }, 100);
    } else if (hasNewMessages && (!userScrolled || isNearBottom)) {
      // Auto-scroll only if user hasn't manually scrolled up or is near bottom
      isAutoScrollingRef.current = true;
      container.scrollTop = container.scrollHeight;

      // Reset auto-scroll flag after animation completes
      setTimeout(() => {
        isAutoScrollingRef.current = false;
      }, 100);
    }
  }, [messages, initialLoad, userScrolled, isNearBottom]);

  const loadMoreMessages = async () => {
    if (loadingMore || !hasMore || isLoading || isFetching) return;

    setLoadingMore(true);
    try {
      const container = messagesContainerRef.current;
      const prevScrollHeight = container.scrollHeight;
      const prevScrollTop = container.scrollTop;

      dispatch(setPage(page + 1));

      // Wait for new messages to load
      await new Promise((resolve) => setTimeout(resolve, 500));

      // Maintain scroll position with better calculation
      requestAnimationFrame(() => {
        const newScrollHeight = container.scrollHeight;
        const heightDifference = newScrollHeight - prevScrollHeight;
        isAutoScrollingRef.current = true;

        // Ensure we maintain the relative position but allow reaching the very top
        const newScrollTop = Math.max(0, prevScrollTop + heightDifference);
        container.scrollTop = newScrollTop;

        // If this was triggered by being at the very top, ensure we stay there
        if (prevScrollTop === 0) {
          container.scrollTop = 0;
        }

        setTimeout(() => {
          isAutoScrollingRef.current = false;
        }, 100);
      });
    } finally {
      setLoadingMore(false);
    }
  };

  const scrollToBottom = (behavior = "smooth") => {
    const container = messagesContainerRef.current;
    if (container) {
      isAutoScrollingRef.current = true;
      container.scrollTo({
        top: container.scrollHeight,
        behavior,
      });

      setTimeout(
        () => {
          isAutoScrollingRef.current = false;
          setUserScrolled(false);
        },
        behavior === "smooth" ? 300 : 100
      );
    }
  };

  const scrollToPinnedMessage = (messageId) => {
    const messageElement = document.getElementById(`msg-${messageId}`);
    if (messageElement) {
      setUserScrolled(true); // Mark as user-initiated scroll
      messageElement.scrollIntoView({
        behavior: "smooth",
        block: "center",
      });

      messageElement.classList.add("message-highlight");
      setTimeout(() => {
        messageElement.classList.remove("message-highlight");
      }, 2000);
    }
  };

  const navigateToRepliedMessage = (replyToMessage) => {
    const originalMessageId = replyToMessage._id;
    const originalMsg = document.getElementById(`msg-${originalMessageId}`);

    if (originalMsg) {
      setUserScrolled(true); // Mark as user-initiated scroll
      originalMsg.scrollIntoView({
        behavior: "smooth",
        block: "center",
      });

      originalMsg.classList.add("message-highlight");
      setTimeout(() => {
        originalMsg.classList.remove("message-highlight");
      }, 2000);
    } else {
      const messageExists = messages.find(
        (msg) => msg._id === originalMessageId
      );
      if (messageExists) {
        antMessage.info(
          "Message found but not visible. Loading more messages..."
        );
      } else {
        antMessage.warning(
          "Original message not found or may have been deleted"
        );
      }
    }
  };

  const handleCreateNewMessage = async (values) => {
    if (sendingMessage || isSending) return;

    if (!values.message?.trim() && !values?.file?.fileList?.length) {
      antMessage.warning("Message cannot be empty");
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
        response = await replyMessage({
          chatId: id,
          messageId: replyingTo._id,
          body: formData,
        }).unwrap();

        if (response.data) {
          const replyWithReference = {
            ...(response.data.originalMessage && response.data.reply
              ? response.data.reply
              : response.data),
            replyTo: replyingTo._id,
            sender: {
              ...(response.data.originalMessage && response.data.reply
                ? response.data.reply.sender
                : response.data.sender),
              _id: loginUserId,
            },
            chatId: id,
          };
          dispatch(addMessage(replyWithReference));
        }
      } else {
        response = await sendMessage({ chatId: id, body: formData }).unwrap();
        if (response.data) {
          const confirmedMessage = {
            ...response.data,
            sender: {
              ...response.data.sender,
              _id: loginUserId,
            },
          };
          dispatch(addMessage(confirmedMessage));
        }
      }

      form.resetFields();
      setImagePreview(null);
      setShowEmojiPicker(false);
      setReplyingTo(null);

      // Auto-scroll to bottom after sending message
      setTimeout(() => {
        scrollToBottom("auto");
        inputRef.current?.focus();
      }, 100);
    } catch (error) {
      antMessage.error(error?.data?.message || "Failed to send message");
      console.error("Message send error:", error);
    } finally {
      setSendingMessage(false);
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "numeric",
      hour12: true,
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
    const currentMessage = form.getFieldValue("message") || "";
    form.setFieldsValue({ message: currentMessage + emojiData.emoji });
    inputRef.current.focus();
  };

  const handleAddReaction = async (messageId, reaction) => {
    try {
      const message = messages.find((msg) => msg._id === messageId);
      const hasReacted = hasUserReacted(message, reaction);

      dispatch(
        updateMessageReaction({
          messageId,
          reaction,
          userId: loginUserId,
        })
      );

      await messageReact({ messageId, reaction }).unwrap();
      setShowReactionPicker({ messageId: null, show: false, position: null });
    } catch (error) {
      antMessage.error(error?.data?.message || "Failed to add reaction");
      setShowReactionPicker({ messageId: null, show: false, position: null });
      refetch();
    }
  };

  const currentUserPinnedMessages = pinnedMessages.filter((msg) =>
    msg.pinnedByUsers?.some((user) => user.userId === loginUserId)
  );

  const handlePinMessage = async (messageId, action) => {
    try {
      const response = await pinMessage({ messageId, action }).unwrap();
      dispatch(
        updateMessagePin({
          messageId,
          isPinned: action === "pin",
          pinnedBy: loginUserId,
        })
      );

      toast.success(`Message ${action === "pin" ? "pinned" : "unpinned"}`);
    } catch (error) {
      antMessage.error(error?.data?.message || `Failed to ${action} message`);
      refetch();
    }
  };

  const isMessagePinnedByCurrentUser = (message) => {
    return message.pinnedByUsers?.some((user) => user.userId === loginUserId);
  };

  const toggleReactionPicker = (messageId, event) => {
    const buttonRect = event.currentTarget.getBoundingClientRect();
    const position = {
      top: buttonRect.top - 60,
      left: buttonRect.left - 100,
    };

    setShowReactionPicker((prev) =>
      prev.messageId === messageId && prev.show
        ? { messageId: null, show: false, position: null }
        : { messageId, show: true, position }
    );
  };

  const toggleEmojiPicker = () => {
    setShowEmojiPicker(!showEmojiPicker);
    if (showReactionPicker.show) {
      setShowReactionPicker({ messageId: null, show: false, position: null });
    }
  };

  const getReactionEmoji = (reactionType) => {
    const reactionMap = {
      love: "❤️",
      thumbs_up: "👍",
      laugh: "😂",
      angry: "😡",
      sad: "😢",
    };
    return reactionMap[reactionType] || "👍";
  };

  const replyVariants = {
    hidden: { opacity: 0, height: 0 },
    visible: { opacity: 1, height: "auto" },
  };

  if (!id) {
    return (
      <div className="flex justify-center items-center h-[80vh]">
        <p className="text-gray-500">Select a chat to start messaging</p>
      </div>
    );
  }

  return (
    <div
      className={`w-full h-[80vh] rounded-lg flex flex-col shadow-lg border ${
        isDarkMode ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200"
      }`}
    >
      {/* Header */}
      {chatUser?.participants?.map((item) => (
        <div
          onClick={() => router.push(`/profiles/${item?.userName}`)}
          key={item._id}
          className={`flex z-10 items-center cursor-pointer space-x-4 p-4 border-b ${
            isDarkMode ? "border-gray-700" : "border-gray-200"
          }`}
        >
          <div className="relative">
            <Avatar src={getImageUrl(item?.profile)} size={48} />
            <div
              className={`absolute bottom-0 right-0 w-3 h-3 ${
                isOnline ? "bg-green-500" : "bg-gray-500"
              } rounded-full border-2 border-white`}
            ></div>
          </div>
          <div>
            <h2
              className={`text-xl font-semibold ${
                isDarkMode ? "text-white" : "text-gray-900"
              }`}
            >
              {item?.name ? item?.name : item?.userName}
            </h2>
            {/* <p className={`text-sm ${isOnline ? 'text-green-500' : 'text-gray-500'} `}>{isOnline ? ' Online' : ' Offline'}</p> */}
          </div>
        </div>
      ))}

      {/* Pinned Messages Section */}
      {currentUserPinnedMessages.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className={`p-3 border-b ${
            isDarkMode
              ? "bg-gray-900 border-gray-700 text-gray-200"
              : "bg-blue-50 border-blue-200 text-gray-800"
          }`}
        >
          <div
            className={`flex items-center text-sm font-medium ${
              isDarkMode ? "text-blue-400" : "text-blue-600"
            }`}
          >
            <TbPinned className="mr-2" />
            Your Pinned Message
          </div>
          <div
            className={`mt-1 space-y-2 overflow-y-auto ${
              showAllPinnedMessages ? "max-h-[200px]" : ""
            }`}
            style={{ maxHeight: showAllPinnedMessages ? "200px" : "none" }}
          >
            {showAllPinnedMessages ? (
              currentUserPinnedMessages.map((msg) => (
                <div
                  key={msg._id}
                  className={`flex items-start justify-between text-sm cursor-pointer p-2 rounded ${
                    isDarkMode
                      ? "hover:bg-gray-700 text-gray-200"
                      : "hover:bg-blue-100 text-gray-600"
                  }`}
                  onClick={() => scrollToPinnedMessage(msg._id)}
                >
                  <span className="truncate">
                    {msg.text ||
                      (msg.images?.length > 0 ? "📷 Image" : "Message")}
                  </span>
                  <Button
                    type="text"
                    size="small"
                    icon={<TbPinned />}
                    className={
                      isDarkMode
                        ? "text-gray-400 hover:text-blue-400"
                        : "text-gray-500 hover:text-blue-500"
                    }
                    onClick={(e) => {
                      e.stopPropagation();
                      handlePinMessage(msg._id, "unpin");
                    }}
                  />
                </div>
              ))
            ) : (
              <div
                className={`flex items-start justify-between text-sm cursor-pointer p-2 rounded ${
                  isDarkMode
                    ? "hover:bg-gray-700 text-gray-200"
                    : "hover:bg-blue-100 text-gray-600"
                }`}
                onClick={() =>
                  scrollToPinnedMessage(currentUserPinnedMessages[0]._id)
                }
              >
                <span className="truncate">
                  {currentUserPinnedMessages[0].text ||
                    (currentUserPinnedMessages[0].images?.length > 0
                      ? "📷 Image"
                      : "Message")}
                </span>
                <Button
                  type="text"
                  size="small"
                  icon={<TbPinned />}
                  className={
                    isDarkMode
                      ? "text-gray-400 hover:text-blue-400"
                      : "text-gray-500 hover:text-blue-500"
                  }
                  onClick={(e) => {
                    e.stopPropagation();
                    handlePinMessage(currentUserPinnedMessages[0]._id, "unpin");
                  }}
                />
              </div>
            )}
          </div>
          {currentUserPinnedMessages.length > 1 && (
            <div className="mt-2 text-center">
              <Button
                type="link"
                size="small"
                onClick={() => setShowAllPinnedMessages(!showAllPinnedMessages)}
                className={
                  isDarkMode
                    ? "text-blue-400 hover:text-blue-300"
                    : "text-blue-500 hover:text-blue-700"
                }
              >
                {showAllPinnedMessages ? "See less" : "See more"}
              </Button>
            </div>
          )}
        </motion.div>
      )}

      {/* Messages Container */}
      <div
        ref={messagesContainerRef}
        className={`flex-1 overflow-y-auto message-container ${
          isDarkMode ? "bg-gray-800" : "bg-gray-50"
        }`}
        style={{
          padding: "16px",
          paddingTop: "8px", // Reduced top padding to ensure first message is fully visible
          scrollBehavior: "auto", // Prevent smooth scrolling conflicts
        }}
      >
        <style jsx global>{`
          .message-container::-webkit-scrollbar {
            width: 6px;
          }
          .message-container::-webkit-scrollbar-track {
            background: ${isDarkMode ? "#2D3748" : "#F5F5F6"};
            border-radius: 10px;
          }
          .message-container::-webkit-scrollbar-thumb {
            background-color: ${isDarkMode ? "#4A5568" : "#CBD5E0"};
            border-radius: 10px;
          }
          .message-container::-webkit-scrollbar-thumb:hover {
            background-color: ${isDarkMode ? "#718096" : "#A0AEC0"};
          }
          .message-container {
            scroll-padding-top: 0px; /* Ensure no extra padding at top */
            overscroll-behavior: contain; /* Prevent scroll chaining */
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
            background-color: ${isDarkMode ? "#4A5568" : "#F7FAFC"} !important;
            font-style: italic;
            opacity: 0.7;
          }
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
            background: ${isDarkMode ? "#374151" : "#F3F4F6"};
            border-radius: 12px;
            padding: 8px 12px;
            margin-bottom: 4px;
            font-size: 12px;
            color: ${isDarkMode ? "#9CA3AF" : "#6B7280"};
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
            background: ${isDarkMode
              ? "rgba(59, 130, 246, 0.1)"
              : "rgba(59, 130, 246, 0.05)"};
            border: 1px solid
              ${isDarkMode
                ? "rgba(59, 130, 246, 0.3)"
                : "rgba(59, 130, 246, 0.2)"};
            border-radius: 12px;
            margin-bottom: 8px;
            position: relative;
            overflow: hidden;
          }
          .reply-preview::before {
            content: "";
            position: absolute;
            left: 0;
            top: 0;
            bottom: 0;
            width: 4px;
            background: linear-gradient(to bottom, #3b82f6, #1d4ed8);
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
            background: ${isDarkMode
              ? "rgba(255, 255, 255, 0.1)"
              : "rgba(0, 0, 0, 0.1)"};
            display: flex;
            align-items: center;
            justify-content: center;
            cursor: pointer;
            transition: all 0.2s ease;
          }
          .reply-close-btn:hover {
            background: ${isDarkMode
              ? "rgba(255, 255, 255, 0.2)"
              : "rgba(0, 0, 0, 0.2)"};
            transform: scale(1.1);
          }
          .reaction-selected {
            background: linear-gradient(135deg, #3b82f6, #1d4ed8) !important;
            transform: scale(1.1);
            box-shadow: 0 2px 8px rgba(59, 130, 246, 0.4);
          }
        `}</style>

        {loadingMore && (
          <div className="flex justify-center py-2 mb-2">
            <div className="flex items-center space-x-2">
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-500"></div>
              <span className="text-sm text-gray-500">
                Loading more messages...
              </span>
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
          <div className="flex justify-center items-center h-[400px]">
            <p className={isDarkMode ? "text-gray-400" : "text-gray-500"}>
              No messages yet. Start the conversation!
            </p>
          </div>
        )}

        <AnimatePresence initial={false}>
          {[...messages]?.reverse()?.map((message, index) => {
            const isCurrentUser = message.sender?._id === loginUserId;
            const isDeleted = message.isDeleted === true;
            const isPinnedByCurrentUser = isMessagePinnedByCurrentUser(message);
            const originalMessage = message.replyTo
              ? getOriginalMessage(message.replyTo)
              : null;
            console.log(originalMessage);
            const isFirstMessage = index === 0; // Track if this is the first message

            return (
              <motion.div
                id={`msg-${message._id}`}
                key={message._id}
                className={`relative flex ${
                  isCurrentUser ? "justify-end" : "justify-start "
                } ${isFirstMessage ? "mb-6 mt-1" : "mb-6"} message-wrapper`}
                style={{
                  marginTop: isFirstMessage ? "4px" : undefined,
                }}
              >
                {/* Left side avatar */}
                {!isCurrentUser && (
                  <Avatar
                    src={getImageUrl(message.sender?.profile)}
                    size={32}
                    className=" self-start relative top-6 "
                  />
                )}

                {/* Bubble + hover group */}
                <div className="relative max-w-[75%]">
                  <span
                    className={`text-xs flex ${
                      isCurrentUser
                        ? "justify-end pr-3 pb-2 "
                        : "justify-start pl-3 pb-2 "
                    }`}
                  >
                    {formatDate(message.createdAt)}
                  </span>

                  {/* Message Bubble (group) */}
                  <motion.div
                    className={`${isCurrentUser?'rounded-bl-md mr-1':'rounded-br-md ml-1'} relative pl-4 pt-1 pr-4 rounded-t-md  group ${
                      isDeleted
                        ? "deleted-message"
                        : isDarkMode
                        ? "bg-gray-700 text-gray-200 border border-gray-600"
                        : "bg-white text-gray-800 border border-gray-200"
                    } shadow-sm`}
                  >
                    {/* Message Images */}
                    {message.images?.length > 0 && !isDeleted && (
                      <div className="mb-3">
                        <img
                          src={getImageUrl(message.images[0])}
                          alt="Message attachment"
                          className="rounded-lg max-w-full h-auto max-h-64 object-cover cursor-pointer hover:opacity-90 transition-opacity"
                        />
                      </div>
                    )}

                    {/* Message Text */}
                    <div className="flex items-end justify-between">
                      {!isDeleted && message.text && (
                        <p className="whitespace-pre-wrap break-words">
                          {message.text}
                        </p>
                      )}
                      {/* {message.read && isCurrentUser && (
                        <div className="flex ml-2">
                          double check icons
                          <svg
                            className="w-3 h-3 text-green-400"
                            fill="currentColor"
                            viewBox="0 0 20 20"
                          >
                            <path
                              fillRule="evenodd"
                              d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                              clipRule="evenodd"
                            />
                          </svg>
                          <svg
                            className="w-3 h-3 text-green-400 -ml-1"
                            fill="currentColor"
                            viewBox="0 0 20 20"
                          >
                            <path
                              fillRule="evenodd"
                              d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                              clipRule="evenodd"
                            />
                          </svg>
                        </div>
                      )} */}
                    </div>

                    {/* Message Options → hidden until hover */}
                    {!isDeleted && (
                      <div
                        className={`message-options absolute hidden group-hover:flex ${
                          isCurrentUser
                            ? "left-0 -translate-x-full"
                            : "right-0 translate-x-full"
                        } top-1/2 -translate-y-1/2 space-x-1`}
                      >
                        {!chatUser?.isBlocked && (
                          <Button
                            type="text"
                            size="small"
                            icon={<BsEmojiSmile />}
                            className={`flex items-center justify-center p-2 rounded-full transition-all ${
                              isDarkMode
                                ? "text-gray-300 bg-gray-700 hover:bg-gray-600"
                                : "text-gray-600 bg-white hover:bg-gray-100"
                            } shadow-md hover:shadow-lg`}
                            onClick={(e) =>
                              toggleReactionPicker(message._id, e)
                            }
                          />
                        )}

                        {!chatUser?.isBlocked && (
                          <Dropdown
                            menu={{
                              items: [
                                {
                                  key: "reply",
                                  label: (
                                    <div className="flex items-center space-x-2">
                                      <MdReply size={16} />
                                      <span>Reply</span>
                                    </div>
                                  ),
                                  onClick: () => setReplyingTo(message),
                                },
                                {
                                  key: "pin",
                                  label: isPinnedByCurrentUser
                                    ? "Unpin Message"
                                    : "Pin Message",
                                  icon: <TbPinned size={14} />,
                                  onClick: () =>
                                    handlePinMessage(
                                      message._id,
                                      isPinnedByCurrentUser ? "unpin" : "pin"
                                    ),
                                },
                              ],
                            }}
                            trigger={["click"]}
                            placement={
                              isCurrentUser ? "bottomLeft" : "bottomRight"
                            }
                          >
                            <Button
                              type="text"
                              size="small"
                              icon={<FaEllipsisVertical />}
                              className={`flex items-center justify-center p-2 rounded-full ${
                                isDarkMode
                                  ? "text-gray-300 bg-gray-700"
                                  : "text-gray-600 bg-white"
                              } shadow-md hover:shadow-lg`}
                            />
                          </Dropdown>
                        )}
                      </div>
                    )}
                  </motion.div>
                </div>

                {/* Right side avatar */}
                {isCurrentUser && (
                  <div className="flex flex-col justify-end">
                    <Avatar
                      src={getImageUrl(
                        localStorage.getItem("user_profile") ||
                          message.sender?.profile
                      )}
                      size={32}
                      className="ml-3 self-end mt-1"
                    />
                  </div>
                )}
              </motion.div>
            );
          })}
        </AnimatePresence>

        {/* Bottom spacer to ensure last message is fully visible */}
        <div style={{ height: "8px" }} />
        <div ref={messagesEndRef} />
      </div>

      {/* Scroll to bottom button - shows when user scrolled up */}
      {userScrolled && !isNearBottom && (
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.8 }}
          className="absolute bottom-20 right-6 z-10"
        >
          <Button
            type="primary"
            shape="circle"
            size="large"
            icon={
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fillRule="evenodd"
                  d="M10 12L4 6h12l-6 6z"
                  clipRule="evenodd"
                />
              </svg>
            }
            className="shadow-lg"
            onClick={() => scrollToBottom("smooth")}
          />
        </motion.div>
      )}

      {/* Reaction Picker Portal */}
      {showReactionPicker.show &&
        createPortal(
          <motion.div
            ref={reactionPickerRef}
            initial={{ opacity: 0, scale: 0.8, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8, y: 10 }}
            style={{
              position: "fixed",
              top: `${showReactionPicker.position?.top}px`,
              left: `${showReactionPicker.position?.left}px`,
              zIndex: 1000,
            }}
            className={`p-3 rounded-2xl flex items-center gap-2 ${
              isDarkMode
                ? "bg-gray-700 border border-gray-600"
                : "bg-white border border-gray-200"
            } shadow-xl backdrop-blur-sm`}
          >
            <div className="flex items-center gap-1">
              {reactions.map((reaction) => {
                const message = messages.find(
                  (msg) => msg._id === showReactionPicker.messageId
                );
                const isSelected = message
                  ? hasUserReacted(message, reaction.name)
                  : false;
                return (
                  <div
                    key={reaction.name}
                    className={`p-2 rounded cursor-pointer transition-all duration-200 transform ${
                      isSelected
                        ? "bg-gray-300"
                        : isDarkMode
                        ? "hover:bg-gray-600"
                        : "hover:bg-gray-100"
                    }`}
                    onClick={() =>
                      handleAddReaction(
                        showReactionPicker.messageId,
                        reaction.name
                      )
                    }
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
              className={`p-1 rounded-full transition-all ${
                isDarkMode
                  ? "text-gray-400 hover:text-white hover:bg-gray-600"
                  : "text-gray-500 hover:text-gray-700 hover:bg-gray-100"
              }`}
              onClick={() =>
                setShowReactionPicker({
                  messageId: null,
                  show: false,
                  position: null,
                })
              }
            />
          </motion.div>,
          document.body
        )}

      {/* Enhanced Reply Preview */}
      {/* <AnimatePresence>
        {replyingTo && (
          <motion.div
            initial="hidden"
            animate="visible"
            exit="hidden"
            variants={replyVariants}
            className={`border-t ${
              isDarkMode ? "border-gray-700" : "border-gray-200"
            }`}
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
      </AnimatePresence> */}

      {/* Image Preview */}
      <AnimatePresence>
        {imagePreview && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className={`p-3 border-t ${
              isDarkMode ? "border-gray-700" : "border-gray-200"
            }`}
          >
            <div className="relative inline-block">
              <img
                src={imagePreview}
                alt="Preview"
                className={`h-20 w-auto rounded-lg object-cover border-2 ${
                  isDarkMode ? "border-gray-600" : "border-gray-200"
                }`}
              />
              <button
                type="button"
                className={`absolute cursor-pointer -top-2 -right-2 rounded-full p-0 flex items-center justify-center h-6 w-6 shadow-md z-10 ${
                  isDarkMode
                    ? "bg-gray-700 text-white hover:bg-red-500"
                    : "bg-white text-gray-800 hover:bg-red-500 hover:text-white"
                } transition-colors`}
                onClick={removeImage}
                aria-label="Remove image"
              >
                ✕
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Message Input - Hidden if blocked */}
      {chatUser?.isBlocked ? (
        <div
          className={`p-4 text-center ${
            isDarkMode ? "bg-gray-800 text-gray-300" : "bg-white text-gray-600"
          }`}
        >
          You can no longer access this conversation.
        </div>
      ) : (
        <div
          className={`p-3 border-t ${
            isDarkMode ? "border-gray-700" : "border-gray-200"
          } flex items-center`}
        >
          <Form
            form={form}
            onFinish={handleCreateNewMessage}
            className="flex-1 flex items-center"
          >
            <Form.Item name="file" noStyle>
              <div className="flex">
                <div className="relative">
                  <Button
                    ref={emojiButtonRef}
                    type="text"
                    icon={isDarkMode ? <BsEmojiSmile /> : <BsEmojiSmile />}
                    className={`absolute top-1/2 transform -translate-y-1/2 ${
                      isDarkMode
                        ? "text-gray-400 hover:text-gray-300"
                        : "text-gray-500 hover:text-gray-600"
                    }`}
                    onClick={toggleEmojiPicker}
                  />
                  {showEmojiPicker && (
                    <div
                      ref={emojiPickerRef}
                      className="absolute bottom-12 right-0 z-10"
                    >
                      <EmojiPicker
                        onEmojiClick={onEmojiClick}
                        width={300}
                        height={350}
                        theme={isDarkMode ? "dark" : "light"}
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
                    icon={
                      isDarkMode ? <DarkImageUpload /> : <LightImageUpoload />
                    }
                    className={`mx-2 ${
                      isDarkMode
                        ? "text-gray-400 hover:text-gray-300"
                        : "text-gray-500 hover:text-gray-600"
                    }`}
                  />
                </Upload>
              </div>
            </Form.Item>

            <Form.Item name="message" noStyle className="flex-1">
              <Input.TextArea
                ref={inputRef}
                disabled={chatUser?.isBlocked}
                placeholder={
                  replyingTo
                    ? `Reply to ${replyingTo.sender?.userName}...`
                    : "Type a message..."
                }
                autoSize={{ minRows: 1, maxRows: 4 }}
                className={`rounded-full ${
                  isDarkMode
                    ? "bg-gray-700 border-gray-600 text-white"
                    : "bg-gray-100 border-gray-200"
                }`}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
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
              disabled={sendingMessage || isSending || chatUser?.isBlocked}
            >
              Send
            </Button>
          </Form>
        </div>
      )}
    </div>
  );
};

export default ChatWindow;
