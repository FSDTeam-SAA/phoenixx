import { Avatar, Button, Dropdown, Tooltip } from 'antd';
import { AnimatePresence, motion } from 'framer-motion';
import { BsEmojiSmile, BsPinAngleFill } from 'react-icons/bs';
import { FiMoreVertical } from 'react-icons/fi';
import { TbPinned } from 'react-icons/tb';
import { getImageUrl } from '../../../../utils/getImageUrl';

export const MessageBody = ({
  messages,
  pinnedMessages,
  isDarkMode,
  loginUserId,
  loadingMore,
  isLoading,
  messagesContainerRef,
  messagesEndRef,
  navigateToRepliedMessage,
  formatDate,
  getReactionEmoji,
  hasUserReacted,
  toggleReactionPicker,
  showReactionPicker,
  setReplyingTo,
  handlePinMessage,
  messageVariants,
  replyVariants
}) => {
  return (
    <div
      ref={messagesContainerRef}
      className={`flex-1 p-4 overflow-y-auto message-container ${isDarkMode ? 'bg-gray-800' : 'bg-gray-50'}`}
    >
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
              variants={messageVariants}
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
                  {message.replyTo && !isDeleted && (
                    <div
                      className="reply-indicator p-2 mb-2 text-xs rounded-lg cursor-pointer"
                      onClick={() => navigateToRepliedMessage(message.replyTo)}
                    >
                      <div className="flex items-center space-x-2">
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-blue-600 truncate">
                            {message.replyTo.sender?.userName || 'User'}
                          </p>
                          <p className="truncate text-gray-500">
                            {message.replyTo.text || (message.replyTo.images?.length > 0 ? "📷 Image" : "Message")}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

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
                    {reactions.map((reaction) => {
                      const isSelected = hasUserReacted(message, reaction.name);
                      return (
                        <Button
                          key={reaction.name}
                          type="text"
                          size="small"
                          className={`p-1 rounded-full transition-all hover:scale-110 ${isSelected
                            ? isDarkMode
                              ? 'bg-blue-600 hover:bg-blue-700'
                              : 'bg-blue-500 hover:bg-blue-600'
                            : isDarkMode
                              ? 'hover:bg-gray-600'
                              : 'hover:bg-gray-100'
                            }`}
                          onClick={() => handleAddReaction(message._id, reaction.name)}
                        >
                          <span className="text-lg">{reaction.emoji}</span>
                        </Button>
                      );
                    })}
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
  );
};