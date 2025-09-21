"use client";
import { Avatar, Dropdown, Flex, Input, Skeleton, message, Select } from "antd";
import { AnimatePresence, motion } from "framer-motion";
import moment from "moment";
import { useParams, useRouter } from "next/navigation";
import {
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import toast from "react-hot-toast";
import {
  BsBell,
  BsBellSlash,
  BsBlockquoteRight,
  BsCheckAll,
  BsSearch,
  BsThreeDotsVertical,
  BsTrash,
} from "react-icons/bs";
import { getImageUrl } from "../../../../utils/getImageUrl";
import { connectSocket } from "../../../../utils/socket";
import {
  useChatBlockAndUnblockMutation,
  useDeleteChatMutation,
  useGetAllChatQuery,
  useMarkAsReadMutation,
  useMuteChatMutation,
} from "../../../features/chat/chatList/chatApi";
import { useDebounce } from "../../../hooks/useDebounce";
import { useMessageRefetch } from "../../../redux/features/useMessageRefetch";
import { ThemeContext } from "../../ClientLayout";

const ChatList = ({ setIsChatActive, status }) => {
  const { isDarkMode } = useContext(ThemeContext);
  const router = useRouter();
  const { id } = useParams();
  const [searchTerm, setSearchTerm] = useState("");
  const debouncedSearchTerm = useDebounce(searchTerm, 500);
  const [actionStates, setActionStates] = useState({});
  const [localChats, setLocalChats] = useState([]);
  const chatListRef = useRef(null);
  const socketRef = useRef(null);
  const [markAsRead] = useMarkAsReadMutation();
  const [deleteChat] = useDeleteChatMutation();
  const [muteChat] = useMuteChatMutation();
  const [blockChat] = useChatBlockAndUnblockMutation();
  const [viewMode, setViewMode] = useState("inbox"); // 'inbox' or 'blocked'

  const {
    data: apiData,
    isLoading,
    isError,
    error,
    refetch: chatRefetch,
  } = useGetAllChatQuery();

  const { refetch } = useMessageRefetch();

  const getCurrentUserId = useCallback(() => {
    try {
      return localStorage.getItem("login_user_id") || "";
    } catch (error) {
      console.error("Error accessing localStorage:", error);
      return "";
    }
  }, []);

  useEffect(() => {
    if (apiData?.data?.chats) {
      setLocalChats([...apiData.data.chats]);
    }
  }, [apiData?.data?.chats]);

  useEffect(() => {
    const loggedInUserId = getCurrentUserId();
    if (!loggedInUserId) return;

    const socket = connectSocket(loggedInUserId);
    socketRef.current = socket;

    socket.on("connect", () => {
      console.log("Socket connected to ChatList");
    });

    socket.on("disconnect", () => {
      console.log("Socket disconnected from ChatList");
    });

    socket.on(`newChat::${loggedInUserId}`, (newChat) => {
      console.log("New chat received:", newChat);
      setLocalChats((prevChats) => {
        const exists = prevChats.some((chat) => chat._id === newChat._id);
        if (!exists) {
          return [newChat, ...prevChats];
        }
        return prevChats;
      });
    });

    socket.on(`chatDeletedForUser::${loggedInUserId}`, (data) => {
      console.log("Chat deleted for user:", data);
      setLocalChats((prevChats) =>
        prevChats.filter((chat) => chat._id !== data.chatId)
      );
      if (id === data.chatId) {
        router.push("/chat");
      }
    });

    socket.on(`chatMuteStatus::${loggedInUserId}`, (data) => {
      console.log("Chat mute status:", data);
      setLocalChats((prevChats) =>
        prevChats.map((chat) => {
          if (chat._id === data.chatId) {
            return {
              ...chat,
              mutedBy:
                data.action === "mute"
                  ? [...(chat.mutedBy || []), loggedInUserId]
                  : (chat.mutedBy || []).filter(
                      (userId) => userId !== loggedInUserId
                    ),
            };
          }
          return chat;
        })
      );
    });

    socket.on(`userBlockStatus::${loggedInUserId}`, (data) => {
      console.log("User block status:", data);
      setLocalChats((prevChats) =>
        prevChats.map((chat) => {
          if (chat._id === data.chatId) {
            return {
              ...chat,
              blockedUsers:
                data.action === "block"
                  ? [
                      ...(chat.blockedUsers || []),
                      { blocker: loggedInUserId, blocked: data.targetUserId },
                    ]
                  : (chat.blockedUsers || []).filter(
                      (block) =>
                        !(
                          block.blocker === loggedInUserId &&
                          block.blocked === data.targetUserId
                        )
                    ),
            };
          }
          return chat;
        })
      );
    });

    socket.on(`newMessage::${loggedInUserId}`, (messageData) => {
      console.log("New message received:", messageData);

      setLocalChats((prevChats) =>
        prevChats.map((chat) => {
          if (chat._id === messageData.chatId) {
            const isCurrentlyViewingChat = id === messageData.chatId;
            const isOwnMessage =
              messageData?.sender?._id === loggedInUserId ||
              messageData?.message?.sender === loggedInUserId;

            let newUnreadCount = chat.unreadCount || 0;

            if (!isOwnMessage && !isCurrentlyViewingChat) {
              newUnreadCount = newUnreadCount + 1;
            }

            return {
              ...chat,
              lastMessage: messageData.message || messageData,
              unreadCount: newUnreadCount,
              updatedAt: new Date().toISOString(),
            };
          }
          return chat;
        })
      );
    });

    socket.on(`messageRead::${loggedInUserId}`, (data) => {
      console.log("Message read event:", data);
      setLocalChats((prevChats) =>
        prevChats.map((chat) => {
          if (chat._id === data.chatId) {
            return {
              ...chat,
              unreadCount: data.unreadCount || 0,
              lastMessage: chat.lastMessage
                ? {
                    ...chat.lastMessage,
                    read: true,
                  }
                : null,
            };
          }
          return chat;
        })
      );
    });

    socket.on(`unreadCountUpdate::${loggedInUserId}`, (data) => {
      console.log("Unread count update:", data);

      if (data.chatId && typeof data.unreadCount !== "undefined") {
        setLocalChats((prevChats) =>
          prevChats.map((chat) => {
            if (chat._id === data.chatId) {
              return {
                ...chat,
                unreadCount: data.unreadCount,
              };
            }
            return chat;
          })
        );
      } else {
        chatRefetch();
      }
    });

    socket.on(`chatListUpdate::${loggedInUserId}`, (data) => {
      console.log("Chat list update:", data);
      chatRefetch();
    });

    return () => {
      if (socketRef.current) {
        socketRef.current.off(`newChat::${loggedInUserId}`);
        socketRef.current.off(`chatDeletedForUser::${loggedInUserId}`);
        socketRef.current.off(`chatMuteStatus::${loggedInUserId}`);
        socketRef.current.off(`userBlockStatus::${loggedInUserId}`);
        socketRef.current.off(`newMessage::${loggedInUserId}`);
        socketRef.current.off(`messageRead::${loggedInUserId}`);
        socketRef.current.off(`unreadCountUpdate::${loggedInUserId}`);
        socketRef.current.off(`chatListUpdate::${loggedInUserId}`);
        socketRef.current.off("connect");
        socketRef.current.off("disconnect");
      }
    };
  }, [getCurrentUserId, refetch, id, router]);

  // Filter chats based on view mode
  const chatsToShow = useMemo(() => {
    const chats = localChats || [];
    const currentUserId = getCurrentUserId();
    
    // Filter based on view mode
    let filteredChats = chats;
    if (viewMode === "blocked") {
      filteredChats = chats.filter(chat => 
        chat.blockedUsers?.some(block => block.blocker === currentUserId)
      );
    } else {
      filteredChats = chats.filter(chat => 
        !chat.blockedUsers?.some(block => block.blocker === currentUserId)
      );
    }
    
    // Apply search filter
    if (debouncedSearchTerm) {
      return filteredChats.filter((chat) => {
        const participant = chat.participants?.find(
          (p) => p._id !== getCurrentUserId()
        );
        return participant?.name
          ?.toLowerCase()
          .includes(debouncedSearchTerm.toLowerCase());
      });
    } else {
      return [...filteredChats].sort((a, b) => {
        const timeA = a.lastMessage?.createdAt || a.updatedAt || a.createdAt;
        const timeB = b.lastMessage?.createdAt || b.updatedAt || b.createdAt;
        return new Date(timeB) - new Date(timeA);
      });
    }
  }, [debouncedSearchTerm, localChats, getCurrentUserId, viewMode]);

  const memoizedChats = useMemo(() => chatsToShow, [chatsToShow]);

  useEffect(() => {
    if (chatListRef.current) {
      const savedPosition = sessionStorage.getItem("chatListScrollPosition");
      if (savedPosition) {
        chatListRef.current.scrollTop = parseInt(savedPosition, 10);
      }
    }
  }, [memoizedChats]);

  const handleScroll = useCallback(() => {
    if (chatListRef.current) {
      sessionStorage.setItem(
        "chatListScrollPosition",
        chatListRef.current.scrollTop
      );
    }
  }, []);

  const handleSelectChat = async (chatId) => {
    console.log(chatId);

    if (actionStates[chatId._id]?.loading) return;
    setActionStates((prev) => ({
      ...prev,
      [chatId._id]: { loading: true, action: "select" },
    }));

    try {
      // Navigate first, then handle the read status
      router.push(`/chat/${chatId?.participants[0]?.userName}/${chatId._id}`);
      if (setIsChatActive) setIsChatActive(true);

      // Only mark as read if there are unread messages
      if (chatId.unreadCount > 0) {
        const response = await markAsRead(chatId._id).unwrap();
        console.log("mark as read response:", response);

        if (response.success) {
          // Only update the specific chat that was marked as read
          setLocalChats((prevChats) =>
            prevChats.map((chat) => {
              if (chat._id === chatId._id) {
                return {
                  ...chat,
                  unreadCount: 0,
                  lastMessage: chat.lastMessage
                    ? { ...chat.lastMessage, read: true }
                    : null,
                };
              }
              return chat;
            })
          );
          refetch();
          chatRefetch();
        }
      }
    } catch (error) {
      console.error("Error marking as read:", error);
      chatRefetch();
    } finally {
      setActionStates((prev) => ({
        ...prev,
        [chatId._id]: { loading: false, action: "" },
      }));
    }
  };

  const handleDeleteChat = async (chatId) => {
    if (actionStates[chatId]?.loading) return;
    setActionStates((prev) => ({
      ...prev,
      [chatId]: { loading: true, action: "delete" },
    }));
    try {
      const response = await deleteChat(chatId).unwrap();
      console.log("delete chat", response);

      setLocalChats((prevChats) =>
        prevChats.filter((chat) => chat._id !== chatId)
      );

      message.success("Chat deleted successfully");
      if (id === chatId) {
        router.push("/chat");
      }
    } catch (error) {
      console.error("Error deleting chat:", error);
    } finally {
      setActionStates((prev) => ({
        ...prev,
        [chatId]: { loading: false, action: "" },
      }));
    }
  };

  const handleMuteChat = async (chatId) => {
    if (actionStates[chatId]?.loading) return;
    setActionStates((prev) => ({
      ...prev,
      [chatId]: { loading: true, action: "mute" },
    }));
    try {
      const chat = memoizedChats.find((c) => c._id === chatId);
      if (!chat) throw new Error("Chat not found");
      const currentUserId = getCurrentUserId();
      const isCurrentlyMuted = chat.mutedBy?.includes(currentUserId);
      const action = isCurrentlyMuted ? "unmute" : "mute";
      const response = await muteChat({
        id: chatId,
        body: { action },
      }).unwrap();
      console.log("mute chat", response);

      setLocalChats((prevChats) =>
        prevChats.map((c) => {
          if (c._id === chatId) {
            return {
              ...c,
              mutedBy:
                action === "mute"
                  ? [...(c.mutedBy || []), currentUserId]
                  : (c.mutedBy || []).filter(
                      (userId) => userId !== currentUserId
                    ),
            };
          }
          return c;
        })
      );

      message.success(`Chat ${action}d successfully`);
    } catch (error) {
      console.error("Error toggling mute:", error);
    } finally {
      setActionStates((prev) => ({
        ...prev,
        [chatId]: { loading: false, action: "" },
      }));
    }
  };

  const handleBlockChat = async (chatId) => {
    if (actionStates[chatId]?.loading) return;
    setActionStates((prev) => ({
      ...prev,
      [chatId]: { loading: true, action: "block" },
    }));
    try {
      const chat = memoizedChats.find((c) => c._id === chatId);
      if (!chat) throw new Error("Chat not found");
      const currentUserId = getCurrentUserId();
      const isCurrentlyBlocked = chat.blockedUsers?.some(
        (block) => block.blocker === currentUserId
      );
      const targetUser = chat.participants?.find(
        (p) => p._id !== currentUserId
      );
      if (!targetUser) throw new Error("Target user not found");
      const action = isCurrentlyBlocked ? "unblock" : "block";
      const response = await blockChat({
        chatId,
        targetId: targetUser._id,
        body: { action },
      }).unwrap();
      console.log("block chat", response);

      setLocalChats((prevChats) =>
        prevChats.map((c) => {
          if (c._id === chatId) {
            return {
              ...c,
              blockedUsers:
                action === "block"
                  ? [
                      ...(c.blockedUsers || []),
                      { blocker: currentUserId, blocked: targetUser._id },
                    ]
                  : (c.blockedUsers || []).filter(
                      (block) =>
                        !(
                          block.blocker === currentUserId &&
                          block.blocked === targetUser._id
                        )
                    ),
            };
          }
          return c;
        })
      );

      toast.success(`User ${action}ed successfully`);
      
      // If unblocking, switch back to inbox view
      if (action === "unblock") {
        setViewMode("inbox");
      }
    } catch (error) {
      console.error("Error toggling block:", error);
    } finally {
      setActionStates((prev) => ({
        ...prev,
        [chatId]: { loading: false, action: "" },
      }));
    }
  };

  const formatTime = (timestamp) => {
    if (!timestamp) return "Just now";
    try {
      const bangladeshTime = moment.utc(timestamp).utcOffset(6);
      return bangladeshTime.fromNow();
    } catch (error) {
      console.error("Error formatting time:", error);
      return "Just now";
    }
  };

  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
  };

  const getMenuItems = (chat) => {
    const currentUserId = getCurrentUserId();
    const isMuted = chat.mutedBy?.includes(currentUserId);
    const isBlocked = chat.blockedUsers?.some(
      (block) => block.blocker === currentUserId
    );
    return [
      {
        key: "mute",
        label: isMuted ? "Unmute Chat" : "Mute Chat",
        icon: isMuted ? <BsBell size={14} /> : <BsBellSlash size={14} />,
        onClick: () => handleMuteChat(chat._id),
        disabled: actionStates[chat._id]?.loading,
      },
      {
        key: "block",
        label: isBlocked ? "Unblock User" : "Block User",
        icon: <BsBlockquoteRight size={14} />,
        onClick: () => handleBlockChat(chat._id),
        disabled: actionStates[chat._id]?.loading,
      },
      {
        key: "delete",
        label: "Delete Chat",
        icon: <BsTrash size={14} />,
        danger: true,
        onClick: () => handleDeleteChat(chat._id),
        disabled: actionStates[chat._id]?.loading,
      },
    ];
  };

  const getParticipantInfo = (chat) => {
    const currentUserId = getCurrentUserId();
    const participant = chat.participants?.find((p) => p._id !== currentUserId);
    return participant || { userName: "User", profile: null };
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
    <div
      className={`w-full h-[80vh] rounded-lg flex flex-col shadow-lg border ${
        isDarkMode
          ? "dark-mode bg-gray-800 border-gray-700"
          : "bg-[#f9f9f9] border-gray-200"
      }`}
    >
      <div className="p-4">
        <Flex gap={8}>
          <Input
            prefix={<BsSearch className="mx-1 text-subtitle" size={20} />}
            placeholder="Search for..."
            allowClear
            style={{ width: "100%", height: 42 }}
            value={searchTerm}
            onChange={handleSearchChange}
          />
        </Flex>
      </div>
      <div className="flex-1 flex flex-col items-center justify-center gap-4">
        <p className={isDarkMode ? "text-gray-400" : "text-gray-500"}>
          Failed to load chats. {error?.data?.message || error?.message}
        </p>
        <button
          onClick={refetch}
          className={`px-4 py-2 rounded-md ${
            isDarkMode
              ? "bg-gray-700 hover:bg-gray-600 text-white"
              : "bg-gray-100 hover:bg-gray-200 text-gray-800"
          }`}
        >
          Retry
        </button>
      </div>
    </div>
  );

  if (isLoading && !localChats?.length) return renderLoadingState();
  if (isError) return renderErrorState();

  return (
    <div
      className={`w-full h-[80vh] rounded-lg flex flex-col shadow-lg border ${
        isDarkMode
          ? "dark-mode bg-gray-800 border-gray-700"
          : "bg-[#f9f9f9] border-gray-200"
      }`}
    >
      <div className="p-4">
        <Flex gap={8} align="center">
          <Input
            prefix={
              <BsSearch
                className={`mx-1 ${
                  isDarkMode ? "text-gray-300" : "text-subtitle"
                }`}
                size={20}
              />
            }
            placeholder="Search for..."
            allowClear
            style={{ width: "100%", height: 42 }}
            value={searchTerm}
            onChange={handleSearchChange}
            className={isDarkMode ? "bg-gray-700 text-white" : ""}
          />
          <Select
            value={viewMode}
            onChange={setViewMode}
            style={{ width: 120 }}
            className={isDarkMode ? "bg-gray-700" : ""}
          >
            <Select.Option value="inbox">Inbox</Select.Option>
            <Select.Option value="blocked">Blocked</Select.Option>
          </Select>
        </Flex>
      </div>
      <div
        ref={chatListRef}
        onScroll={handleScroll}
        className={`chat-list-container flex-1 overflow-y-auto ${
          isDarkMode ? "scrollbar-dark" : "scrollbar-light"
        }`}
      >
        <style jsx global>{`
          .chat-list-container::-webkit-scrollbar {
            width: 6px;
          }
          .chat-list-container::-webkit-scrollbar-track {
            background: ${isDarkMode ? "#374151" : "#f1f1f1"};
          }
          .chat-list-container::-webkit-scrollbar-thumb {
            background-color: ${isDarkMode ? "#4B5563" : "#c1c1c1"};
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
              const isBlocked = chat.blockedUsers?.some(
                (block) => block.blocker === currentUserId
              );
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
                    onClick={() => !isActionLoading && handleSelectChat(chat)}
                    className={`flex items-center gap-4 p-4 rounded-lg relative group ${
                      isActiveChat
                        ? isDarkMode
                          ? "bg-gray-700"
                          : "bg-blue-50"
                        : isDarkMode
                        ? "hover:bg-gray-700"
                        : "hover:bg-blue-50"
                    } ${isDarkMode ? "text-gray-200" : "text-gray-800"} ${
                      isActionLoading
                        ? "opacity-70 cursor-not-allowed"
                        : "cursor-pointer"
                    }`}
                  >
                    <div className="relative">
                      <Avatar
                        size={50}
                        src={getImageUrl(participant?.profile)}
                        className={`transition-transform duration-200 group-hover:scale-110 ${
                          isBlocked ? "opacity-50" : ""
                        }`}
                      />
                      {isBlocked && (
                        <div className="absolute inset-0 bg-black bg-opacity-50 rounded-full flex items-center justify-center">
                          <BsBlockquoteRight className="text-white" size={18} />
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-center">
                        <h3
                          className={`font-medium truncate ${
                            isBlocked ? "line-through" : ""
                          } ${isRead ? "" : "font-semibold"}`}
                        >
                          {participant?.name
                            ? participant?.name
                            : participant?.userName}
                        </h3>
                        <div className="flex items-center gap-2">
                          <span
                            className={`text-xs truncate ${
                              isDarkMode ? "text-gray-400" : "text-gray-500"
                            }`}
                          >
                            {formatTime(chat?.lastMessage?.createdAt)}
                          </span>
                          {isMuted && (
                            <BsBellSlash className="text-gray-400" size={14} />
                          )}
                        </div>
                      </div>
                      <div className="flex items-center justify-between gap-2 mt-1">
                        <p
                          className={`text-sm truncate ${
                            isDarkMode ? "text-gray-300" : "text-gray-600"
                          } ${isRead ? "" : "font-bold"}`}
                        >
                          {viewMode === "blocked" 
                            ? "Blocked user" 
                            : chat?.lastMessage?.text?.slice(0, 30) || ""
                          }
                          {chat?.lastMessage?.type === "image" && "Image"}
                          {chat?.lastMessage?.type === "both" && "Image"}
                        </p>
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      {chat?.unreadCount > 0 && viewMode === "inbox" && (
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
                        trigger={["click"]}
                        placement="bottomRight"
                        disabled={isActionLoading}
                      >
                        <motion.button
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.9 }}
                          className={`opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded-full ${
                            isDarkMode
                              ? "hover:bg-gray-600"
                              : "hover:bg-gray-200"
                          } cursor-pointer`}
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
            <p className={isDarkMode ? "text-gray-400" : "text-gray-500"}>
              {searchTerm
                ? "No matching chats found"
                : viewMode === "blocked" 
                  ? "No blocked users" 
                  : "No chats yet. Start a conversation!"}
            </p>
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default ChatList;