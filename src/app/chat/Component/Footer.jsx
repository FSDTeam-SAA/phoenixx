"use client"
import { Avatar, Button, Form, Input, Upload } from 'antd';
import EmojiPicker from 'emoji-picker-react';
import { AnimatePresence, motion } from 'framer-motion';
import { BsEmojiSmile } from 'react-icons/bs';
import { IoMdSend } from 'react-icons/io';
import { getImageUrl } from '../../../../utils/getImageUrl';

export const Footer = ({
  form,
  isDarkMode,
  handleCreateNewMessage,
  imagePreview,
  removeImage,
  showEmojiPicker,
  toggleEmojiPicker,
  emojiPickerRef,
  emojiButtonRef,
  onEmojiClick,
  handleFileChange,
  inputRef,
  sendingMessage,
  isSending,
  replyingTo,
  setReplyingTo,
  replyVariants
}) => {
  return (
    <>
      {/* Reply Preview Section */}
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
                aria-label="Cancel reply"
              >
                ✕
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Image Preview Section */}
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
                alt="Image preview"
                className={`h-20 w-auto rounded-lg object-cover border-2 ${isDarkMode ? 'border-gray-600' : 'border-gray-200'
                  }`}
              />
              <Button
                type="text"
                className={`absolute -top-2 -right-2 rounded-full p-0 flex items-center justify-center h-6 w-6 shadow-md ${isDarkMode ? 'bg-gray-700 text-white' : 'bg-white text-gray-800'
                  } hover:bg-red-500 hover:text-white transition-all`}
                onClick={removeImage}
                aria-label="Remove image"
              >
                ✕
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Input Section */}
      <div className={`p-3 border-t ${isDarkMode ? 'border-gray-700' : 'border-gray-200'} flex items-center`}>
        <Form form={form} onFinish={handleCreateNewMessage} className="flex-1 flex items-center">
          {/* Action Buttons Container */}
          <div className="flex items-center mr-3">
            {/* Emoji Picker */}
            <div className="relative">
              <Button
                ref={emojiButtonRef}
                type="text"
                icon={<BsEmojiSmile size={20} />}
                className={`${isDarkMode ? 'text-gray-400 hover:text-gray-300' : 'text-gray-500 hover:text-gray-600'}`}
                onClick={toggleEmojiPicker}
                aria-label="Open emoji picker"
              />
              {showEmojiPicker && (
                <div ref={emojiPickerRef} className="absolute bottom-12 left-0 z-10">
                  <EmojiPicker
                    onEmojiClick={onEmojiClick}
                    width={300}
                    height={350}
                    theme={isDarkMode ? 'dark' : 'light'}
                  />
                </div>
              )}
            </div>

            {/* Image Upload */}
            <Upload
              accept="image/*"
              showUploadList={false}
              beforeUpload={() => false}
              onChange={handleFileChange}
              maxCount={1}
            >
              <Button
                type="text"
                // icon={<ImageUpload />}
                className={`ml-2 ${isDarkMode ? 'text-gray-400 hover:text-gray-300' : 'text-gray-500 hover:text-gray-600'}`}
                aria-label="Upload image"
              />
            </Upload>
          </div>

          {/* Message Input */}
          <Form.Item name="message" className="flex-1 mb-0">
            <Input.TextArea
              ref={inputRef}
              placeholder="Type a message..."
              autoSize={{ minRows: 1, maxRows: 4 }}
              className={`rounded-full ${isDarkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-gray-100 border-gray-200'
                }`}
              onKeyPress={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  form.submit();
                }
              }}
              disabled={sendingMessage || isSending}
            />
          </Form.Item>

          {/* Send Button */}
          <Button
            type="primary"
            htmlType="submit"
            icon={<IoMdSend />}
            className="ml-2 flex-shrink-0"
            style={{ width: "40px", height: "40px" }}
            loading={sendingMessage || isSending}
            disabled={sendingMessage || isSending}
            aria-label="Send message"
          />
        </Form>
      </div>
    </>
  );
};