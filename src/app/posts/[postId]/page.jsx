"use client";
import { DeleteOutlined, EditOutlined, EllipsisOutlined, MessageOutlined } from '@ant-design/icons';
import { Avatar, Button, Card, Dropdown, Empty, Input, Menu, message } from 'antd';
import moment from 'moment';
import Image from 'next/image';
import { useParams, useRouter } from 'next/navigation';
import { useCallback, useContext, useEffect, useRef, useState } from 'react';
import toast from 'react-hot-toast';
import { FaChevronDown, FaChevronUp, FaEye, FaHeart, FaRegHeart } from "react-icons/fa";
// API hooks
import {
  useCreateCommentMutation,
  useDeleteCommentMutation,
  useLikeCommentMutation,
  useReplayCommentMutation,
  useUpdateCommentMutation
} from '@/features/comments/commentApi';
import { useLikePostMutation, usePostDetailsQuery } from '@/features/post/postApi';
import { useGetSaveAllPostQuery, useSavepostMutation } from '@/features/SavePost/savepostApi';

// Components
import ReportPostModal from '@/components/ReportPostModal';

// Utils
import { useGetProfileQuery } from '@/features/profile/profileApi';
import { getImageUrl } from '../../../../utils/getImageUrl';
import Loading from '../../../components/Loading/Loading';
import ImageModal from '../../../components/PostCard/components/ImageModal';
import { ThemeContext } from '../../ClientLayout';

const PostDetailsPage = () => {
  const params = useParams();
  const router = useRouter();
  const { postId } = params;
  const { isDarkMode } = useContext(ThemeContext); // Get dark mode state from context
  const [showImageModal, setShowImageModal] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  const commentInputRef = useRef(null);

  const {
    data: postDetails,
    isLoading,
    error: postError,
    refetch
  } = usePostDetailsQuery(postId);

  const [likePost, { isLoading: likePostLoading }] = useLikePostMutation();
  const [savepost] = useSavepostMutation();
  const { data: savedPostsData } = useGetSaveAllPostQuery();
  const [createComment, { isLoading: createCommentLoading }] = useCreateCommentMutation();
  const [deleteComment] = useDeleteCommentMutation();
  const [likeComment, { isLoading: likeCommentLoading }] = useLikeCommentMutation();
  const [replayComment, { isLoading: replayCommentLoading }] = useReplayCommentMutation();
  const [editComment, { isLoading: editCommentLoading }] = useUpdateCommentMutation();
  const { data: profile } = useGetProfileQuery();
  const [showRepliesFor, setShowRepliesFor] = useState({});

  const [commentText, setCommentText] = useState('');
  const [editingCommentId, setEditingCommentId] = useState(null);
  const [editCommentText, setEditCommentText] = useState('');
  const [replyingTo, setReplyingTo] = useState(null);
  const [replyText, setReplyText] = useState('');
  const [commentSort, setCommentSort] = useState('relevant');
  const [windowWidth, setWindowWidth] = useState(0);
  const [showReportModal, setShowReportModal] = useState(false);
  const [login_user_id, setLoginUserId] = useState(null);
  const [collapsedReplies, setCollapsedReplies] = useState({});

  const post = postDetails?.data;
  const comments = post?.comments || [];
  const isSaved = savedPostsData?.data?.some(savedPost => savedPost?.postId?._id === postId);
  const isLiked = post?.likes?.includes(login_user_id);
  const isMobile = windowWidth < 640;
  const isTablet = windowWidth >= 640 && windowWidth < 1024;

  const currentUser = {
    _id: login_user_id || "",
    name: "Current User",
    avatar: "/images/profile2.jpg",
  };

  // Helper function to count words
  const countWords = (text) => {
    if (!text || !text.trim()) return 0;
    return text.trim().split(/\s+/).length;
  };

  useEffect(() => {
    const userId = localStorage.getItem("login_user_id");
    setLoginUserId(userId);
  }, []);

  useEffect(() => {
    const handleResize = () => setWindowWidth(window.innerWidth);
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handleImageClick = useCallback((index) => {
    console.log('Image clicked, index:', index); // Debug log
    setCurrentImageIndex(index);
    setShowImageModal(true);
  }, []);

  const handleNextImage = useCallback(() => {
    setCurrentImageIndex((prev) =>
      prev === post?.images?.length - 1 ? 0 : prev + 1
    );
  }, [post?.images?.length]);

  const handlePrevImage = useCallback(() => {
    setCurrentImageIndex((prev) =>
      prev === 0 ? post?.images?.length - 1 : prev - 1
    );
  }, [post?.images?.length]);

  const handleCloseModal = useCallback(() => {
    setShowImageModal(false);
  }, []);

  const formatDate = (timestamp) => {
    if (!timestamp) return "Just now";
    if (timestamp === "Just now") return timestamp;

    const now = moment();
    const commentTime = moment(timestamp);

    if (now.diff(commentTime, 'seconds') < 60) {
      return "Just now";
    }

    return commentTime.fromNow();
  };

  const sortComments = (commentsToSort) => {
    if (!commentsToSort || !Array.isArray(commentsToSort)) return [];

    const sorted = [...commentsToSort];

    if (commentSort === 'recent') {
      // Sort by creation date, newest first
      return sorted.sort((a, b) => {
        // Handle "Just now" comments
        const aDate = a.createdAt === "Just now" ? new Date() : new Date(a.createdAt);
        const bDate = b.createdAt === "Just now" ? new Date() : new Date(b.createdAt);
        return bDate - aDate; // Newest first
      });
    } else if (commentSort === 'relevant') {
      // Sort by relevance (likes count first, then recency)
      return sorted.sort((a, b) => {
        const bLikes = b.likes?.length || 0;
        const aLikes = a.likes?.length || 0;

        // First sort by likes count
        if (bLikes !== aLikes) return bLikes - aLikes;

        // If likes are equal, sort by recency
        const aDate = a.createdAt === "Just now" ? new Date() : new Date(a.createdAt);
        const bDate = b.createdAt === "Just now" ? new Date() : new Date(b.createdAt);
        return bDate - aDate; // Newer comments are more relevant if likes are equal
      });
    }

    // Default to relevant sorting
    return sorted;
  };

  const handleLike = async () => {
    if (!login_user_id) {
      return message.warning("Please login to like this post");
    }

    try {
      await likePost(postId).unwrap();
      refetch();
      message.success("Post like status updated");
    } catch (error) {
      console.error("Error liking post:", error);
      message.error("Failed to like post");
    }
  };

  const handleSaveUnsave = async () => {
    if (!login_user_id) {
      return message.warning("Please login to save this post");
    }

    try {
      const response = await savepost({ postId }).unwrap();
      message.success(response?.data !== null ? 'Post saved successfully' : 'Post removed from saved items');
    } catch (error) {
      console.error('Save/Unsave error:', error);
      message.error('Failed to update saved status');
    }
  };

  const handleShare = () => {
    const url = `${window.location.origin}/posts/${postId}`;
    navigator.clipboard.writeText(url)
      .then(() => toast.success("URL copied to clipboard"))
      .catch(() => toast.success("Failed to copy URL"));
  };

  const handleCommentButtonClick = () => {
    if (commentInputRef.current) {
      commentInputRef.current.focus();
    }
  };

  const decodeHtmlEntities = (text) => {
    if (!text) return '';
    const textArea = document.createElement('textarea');
    textArea.innerHTML = text;
    return textArea.value;
  };

  // const cleanPostContent = (content) => {
  //   if (!content) return '';

  //   // Remove Froala "Powered by" footer
  //   const withoutFroala = content.replace(
  //     /<p[^>]*>Powered by <a[^>]*>Froala Editor<\/a><\/p>/gi,
  //     ''
  //   );

  //   // Convert empty paragraphs to line breaks to preserve spacing
  //   let processedContent = withoutFroala.replace(/<p[^>]*>\s*<\/p>/gi, '<br><br>');

  //   // Preserve lists - convert to text with proper indentation
  //   processedContent = processedContent.replace(/<ol[^>]*>(.*?)<\/ol>/gis, (match, inner) => {
  //     const items = inner.replace(/<li[^>]*>(.*?)<\/li>/gis, (liMatch, liContent) => {
  //       return `\n1. ${liContent.replace(/<[^>]+>/g, '').trim()}`;
  //     });
  //     return items;
  //   });

  //   processedContent = processedContent.replace(/<ul[^>]*>(.*?)<\/ul>/gis, (match, inner) => {
  //     const items = inner.replace(/<li[^>]*>(.*?)<\/li>/gis, (liMatch, liContent) => {
  //       return `\n• ${liContent.replace(/<[^>]+>/g, '').trim()}`;
  //     });
  //     return items;
  //   });

  //   // Handle basic formatting
  //   processedContent = processedContent.replace(/<strong[^>]*>(.*?)<\/strong>/gi, '**$1**');
  //   processedContent = processedContent.replace(/<b[^>]*>(.*?)<\/b>/gi, '**$1**');
  //   processedContent = processedContent.replace(/<em[^>]*>(.*?)<\/em>/gi, '*$1*');
  //   processedContent = processedContent.replace(/<i[^>]*>(.*?)<\/i>/gi, '*$1*');
  //   processedContent = processedContent.replace(/<u[^>]*>(.*?)<\/u>/gi, '_$1_');

  //   // Convert paragraph breaks to double line breaks for spacing
  //   processedContent = processedContent.replace(/<\/p>\s*<p[^>]*>/gi, '\n\n');
  //   processedContent = processedContent.replace(/<\/?p[^>]*>/gi, '');

  //   // Convert other block elements to line breaks
  //   processedContent = processedContent.replace(/<\/(div|h[1-6]|section|article)>/gi, '\n');
  //   processedContent = processedContent.replace(/<(div|h[1-6]|section|article)[^>]*>/gi, '');

  //   // Convert <br> tags to actual line breaks
  //   processedContent = processedContent.replace(/<br\s*\/?>/gi, '\n');

  //   // Remove any remaining HTML tags (except those we've explicitly handled)
  //   processedContent = processedContent.replace(/<[^>]+>/g, '');

  //   // Decode HTML entities
  //   const decoded = decodeHtmlEntities(processedContent);

  //   // Clean up excessive line breaks (more than 4 consecutive)
  //   const withPreservedSpacing = decoded.replace(/\n{5,}/g, '\n\n\n\n');

  //   return withPreservedSpacing.trim();
  // };






  const cleanPostContent = (content) => {
    if (!content) return '';

    // Only remove Froala "Powered by" footer, keep everything else
    let processedContent = content.replace(
      /<p[^>]*>Powered by <a[^>]*>Froala Editor<\/a><\/p>/gi,
      ''
    );

    // Convert empty paragraphs to <br> tags to show as line breaks
    processedContent = processedContent.replace(/<p[^>]*>\s*<\/p>/gi, '<br>');

    return processedContent.trim();
  };

  const handleCommentSubmit = async (e) => {
    e.preventDefault();
    if (!login_user_id) {
      return message.warning("Please login to add a comment");
    }

    const wordCount = countWords(commentText);
    if (wordCount > 100) {
      return message.error("Comment exceeds 100 word limit");
    }

    if (!commentText.trim()) {
      return;
    }

    try {
      const tempComment = {
        _id: `temp-${Date.now()}`,
        postId,
        author: {
          _id: login_user_id,
          userName: profile?.data?.userName || "You",
          profile: profile?.data?.profile
        },
        content: commentText,
        status: "active",
        likes: [],
        replies: [],
        createdAt: "Just now",
        updatedAt: "Just now"
      };

      const response = await createComment({
        postId,
        content: commentText
      }).unwrap();

      await refetch();
      setCommentText('');
      toast.success("Comment posted successfully");
    } catch (error) {
      console.error("Error creating comment:", error);
      message.error("Failed to add comment");
    }
  };

  const handleCommentLike = async (commentId) => {
    if (!login_user_id) {
      return message.warning("Please login to like this comment");
    }

    try {
      await likeComment(commentId).unwrap();
      refetch();
    } catch (error) {
      console.error("Error liking comment:", error);
      message.error(error.data?.message || "Failed to like comment");
    }
  };

  const handleReplySubmit = async (parentCommentId) => {
    if (!login_user_id) {
      return message.warning("Please login to reply to comments");
    }

    const wordCount = countWords(replyText);
    if (wordCount > 100) {
      return message.error("Reply exceeds 100 word limit");
    }

    if (!replyText.trim()) {
      return;
    }

    try {
      await replayComment({
        id: parentCommentId,
        body: {
          postId,
          content: replyText
        }
      }).unwrap();

      setReplyText('');
      setReplyingTo(null);
      refetch();
    } catch (error) {
      console.error("Error replying to comment:", error);
      message.error(error.data?.message || "Failed to add reply");
    }
  };

  const handleEditComment = (commentId, currentText) => {
    setEditingCommentId(commentId);
    setEditCommentText(currentText);
  };

  const handleUpdateComment = async (commentId) => {
    const wordCount = countWords(editCommentText);
    if (wordCount > 100) {
      return message.error("Comment exceeds 100 word limit");
    }

    if (!editCommentText.trim()) return;

    try {
      await editComment({
        id: commentId,
        body: {
          content: editCommentText
        }
      }).unwrap();

      setEditingCommentId(null);
      setEditCommentText('');
      refetch();
    } catch (error) {
      console.error("Error updating comment:", error);
      toast.error("Failed to update comment");
    }
  };

  const handleDeleteComment = async (commentId) => {
    if (!login_user_id) {
      return message.warning("Please login to delete this comment");
    }

    try {
      await deleteComment(commentId).unwrap();
      toast.success("Comment deleted");
      refetch();
    } catch (error) {
      console.error("Delete comment error:", error);
      toast.error(error.data?.message || "Failed to delete comment");
    }
  };

  const postMenuItems = [
    {
      key: 'save',
      label: (
        <div className="flex items-center gap-2 py-1">
          <Image
            src={isDarkMode ? "/icons/savedark.png" : "/icons/savelight.png"}
            height={13}
            width={13}
            alt="save"
          />
          <span>{isSaved ? "Unsave post" : "Save post"}</span>
        </div>
      ),
    },
    {
      key: 'report',
      label: (
        <div className="flex items-center gap-2 py-1">
          <Image src={isDarkMode ? "/icons/reportdark.png" : "/icons/report.png"} height={16} width={16} alt="report" />
          <span>Report Post</span>
        </div>
      ),
    },
  ];

  const handlePostMenuClick = ({ key }) => {
    if (key === 'save') handleSaveUnsave();
    else if (key === 'report') setShowReportModal(true);
  };

  const renderCommentMenu = (comment) => {
    const isCurrentUserComment = comment.author?._id === login_user_id;

    return (
      <Menu className={isDarkMode ? 'bg-gray-800 text-gray-200' : ''}>
        {isCurrentUserComment && (
          <>
            <Menu.Item
              key="edit"
              onClick={() => {
                setEditingCommentId(comment._id);
                setEditCommentText(comment.content);
              }}
              icon={<EditOutlined />}
            >
              Edit Comment
            </Menu.Item>
            <Menu.Item
              key="delete"
              onClick={() => handleDeleteComment(comment._id)}
              icon={<DeleteOutlined />}
              danger
            >
              Delete Comment
            </Menu.Item>
          </>
        )}
        {!isCurrentUserComment && (
          <Menu.Item key="report">Report Comment</Menu.Item>
        )}
      </Menu>
    );
  };

  const renderComment = (comment) => {
    if (!comment) return null;
    const isCurrentUserComment = comment.author?._id === login_user_id;
    const isEditing = editingCommentId === comment._id;
    const isCommentLiked = comment.likes?.includes(login_user_id);
    const commentAuthor = comment.author || { userName: "Unknown" };
    // console.log(commentAuthor)
    const authorImage = commentAuthor.profile || commentAuthor.avatar;
    const wordCount = countWords(editCommentText);
    const replyWordCount = countWords(replyText);

    return (
      <div key={comment._id} className="w-full mb-4">
        {/* Main Comment */}
        <div className={`flex w-full ${isDarkMode ? 'dark-mode' : ''}`}>
          {/* User Avatar */}
          <div onClick={() => router.push(`/profiles/${commentAuthor._id}`)} className="mr-4 cursor-pointer flex-shrink-0">
            {authorImage ? (
              <Avatar src={getImageUrl(authorImage)} size={40} />
            ) : (
              <Avatar size={40}>{commentAuthor.userName?.charAt(0).toUpperCase() || 'U'}</Avatar>
            )}
          </div>

          {/* Comment Content */}
          <div className="flex-1 w-full">
            {/* Comment Header */}
            <div className="flex items-start justify-between -mb-1">
              <div>
                <span onClick={() => router.push(`/profiles/${commentAuthor._id}`)} className={`font-medium cursor-pointer text-sm ${isDarkMode ? 'text-gray-200' : 'text-gray-900'}`}>
                  {commentAuthor.userName}
                </span>
                <span className={`text-xs ml-2 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                  {formatDate(comment.createdAt)}
                </span>
              </div>

              <div className="ml-auto">
                <Dropdown
                  overlay={renderCommentMenu(comment)}
                  trigger={['click']}
                  placement="bottomRight"
                >
                  {isCurrentUserComment && <Button
                    type="text"
                    icon={<EllipsisOutlined className={isDarkMode ? 'text-gray-300' : ''} />}
                    className={`${isDarkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100'}`}
                  />}
                </Dropdown>
              </div>
            </div>

            {/* Comment Text */}
            {isEditing ? (
              <div className="my-2">
                <Input.TextArea
                  value={editCommentText}
                  onChange={(e) => setEditCommentText(e.target.value)}
                  autoSize={{ minRows: 2, maxRows: 6 }}
                  className={`${isDarkMode ? 'bg-gray-700 text-gray-200 border-gray-600' : ''} ${wordCount > 100 ? 'border-red-500' : ''
                    }`}
                />
                <div className="flex justify-between items-center mt-1">
                  <span className={`text-xs ${wordCount > 100 ? 'text-red-500' :
                    isDarkMode ? 'text-gray-400' : 'text-gray-500'
                    }`}>
                    {wordCount}/100
                  </span>
                  {wordCount > 100 && (
                    <span className="text-red-500 text-xs">
                      Comment exceeds 100 word limit
                    </span>
                  )}
                </div>
                <div className="flex justify-end mt-2">
                  <Button
                    onClick={() => setEditingCommentId(null)}
                    className={`mr-2 ${isDarkMode ? 'bg-gray-700 text-gray-200 border-gray-600 hover:bg-gray-600' : ''}`}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="primary"
                    onClick={() => handleUpdateComment(comment._id)}
                    disabled={!editCommentText.trim() || editCommentLoading || wordCount > 100}
                    loading={editCommentLoading && editingCommentId === comment._id}
                  >
                    Update
                  </Button>
                </div>
              </div>
            ) : (
              <p className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-700'} mb-2 whitespace-pre-wrap break-words overflow-wrap-anywhere`}>
                {comment.content}
              </p>
            )}

            {/* Comment Actions */}
            <div className="flex items-center mt-1">
              <button
                className={`flex items-center cursor-pointer mr-4 px-2 py-1 rounded-full ${isDarkMode ? 'text-gray-400 hover:text-blue-400' : 'hover:text-blue-500'}`}
                onClick={() => handleCommentLike(comment._id)}
                disabled={likeCommentLoading}
              >
                {isCommentLiked ? (
                  <FaHeart className="mr-1 text-red-500" />
                ) : (
                  <FaRegHeart className="mr-1" />
                )}
                <span className={`text-xs ${isDarkMode ? 'text-gray-300' : ''}`}>{comment.likes?.length || 0}</span>
              </button>

              <button
                className={`flex items-center cursor-pointer px-2 py-1 rounded-full ${isDarkMode ? 'text-gray-400 hover:text-blue-400' : 'hover:text-blue-500'}`}
                onClick={() => setReplyingTo(replyingTo === comment._id ? null : comment._id)}
              >
                <MessageOutlined className="mr-1" />
                <span className={`text-xs ${isDarkMode ? 'text-gray-300' : ''}`}>Reply</span>
              </button>
            </div>

            {/* Reply Input */}
            {replyingTo === comment._id && (
              <div className="mt-3">
                <Input.TextArea
                  placeholder="Write your reply..."
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  autoSize={{ minRows: 1, maxRows: 4 }}
                  className={`${isDarkMode ? 'bg-gray-700 text-gray-200 border-gray-600' : ''} ${replyWordCount > 100 ? 'border-red-500' : ''
                    }`}
                />
                <div className="flex justify-between items-center mt-1">
                  <span className={`text-xs ${replyWordCount > 100 ? 'text-red-500' :
                    isDarkMode ? 'text-gray-400' : 'text-gray-500'
                    }`}>
                    {replyWordCount}/100
                  </span>
                  {replyWordCount > 100 && (
                    <span className="text-red-500 text-xs">
                      Reply exceeds 100 word limit
                    </span>
                  )}
                </div>
                <div className="flex gap-2 mt-2">
                  <Button
                    onClick={() => setReplyingTo(null)}
                    className={isDarkMode ? 'bg-gray-700 text-gray-200 border-gray-600 hover:bg-gray-600' : ''}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="primary"
                    onClick={() => handleReplySubmit(comment._id)}
                    loading={replayCommentLoading}
                    disabled={replyWordCount > 100}
                  >
                    Reply
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Replies Toggle Button */}
        {comment.replies?.length > 0 && (
          <>
            <div className="ml-12 mt-1 mb-2">
              <button
                className={`flex items-center cursor-pointer ${isDarkMode ? 'text-blue-400' : 'text-blue-600'}`}
                onClick={() => {
                  // Toggle showing replies for this comment
                  setShowRepliesFor(prevState => ({
                    ...prevState,
                    [comment._id]: !prevState[comment._id]
                  }));
                }}
              >
                {showRepliesFor[comment._id] ? (
                  <>
                    <FaChevronUp className="mr-2 text-xs" />
                    <span className="text-xs">Hide replies</span>
                  </>
                ) : (
                  <>
                    <FaChevronDown className="mr-2 text-xs" />
                    <span className="text-xs">{comment.replies.length} {comment.replies.length === 1 ? 'reply' : 'replies'}</span>
                  </>
                )}
              </button>
            </div>

            {/* Show Replies only when toggled */}
            {showRepliesFor[comment._id] && (
              <div className={` mt-2 pl-3`}>
                {sortComments(comment.replies).map(reply =>
                  renderComment(reply)
                )}
              </div>
            )}
          </>
        )}
      </div>
    );
  };

  if (isLoading) {
    return (
      <div className={`h-[600px] p-4 flex items-center justify-center`}>
        <Loading />
      </div>
    );
  }

  if (postError || !post) {
    return (
      <div className={`min-h-screen ${isDarkMode ? 'bg-gray-900' : 'bg-gray-100'} p-4 flex items-center justify-center`}>
        <Card className={`text-center ${isDarkMode ? 'bg-gray-800 border-gray-700' : ''}`}>
          <Empty
            description={
              <span className="text-red-500">
                {postError?.message || 'Post not found. It may have been deleted.'}
              </span>
            }
          />
          <Button type="primary" onClick={() => router.push('/')} className="mt-4">
            Return to Home
          </Button>
        </Card>
      </div>
    );
  }

  const renderImageGrid = post?.images?.length > 0 ? (
    <div className="mb-4 rounded-lg overflow-hidden">
      {post.images.length === 1 ? (
        <img
          src={getImageUrl(post.images[0])}
          alt="Post content"
          className="w-full max-h-[500px] cursor-pointer object-cover"
          onClick={() => handleImageClick(0)}
        />
      ) : post.images.length === 2 ? (
        <div className="flex gap-1 h-[350px]">
          <img
            src={getImageUrl(post.images[0])}
            alt="Post content 1"
            className="w-1/2 h-full cursor-pointer object-cover"
            onClick={() => handleImageClick(0)}
          />
          <img
            src={getImageUrl(post.images[1])}
            alt="Post content 2"
            className="w-1/2 h-full cursor-pointer object-cover"
            onClick={() => handleImageClick(1)}
          />
        </div>
      ) : post.images.length === 3 ? (
        <div className="flex gap-1 h-[350px]">
          <div className="w-1/2 h-full">
            <img
              src={getImageUrl(post.images[0])}
              alt="Post content 1"
              className="w-full h-full cursor-pointer object-cover"
              onClick={() => handleImageClick(0)}
            />
          </div>
          <div className="w-1/2 flex flex-col gap-1">
            <img
              src={getImageUrl(post.images[1])}
              alt="Post content 2"
              className="w-full h-1/2 cursor-pointer object-cover"
              onClick={() => handleImageClick(1)}
            />
            <img
              src={getImageUrl(post.images[2])}
              alt="Post content 3"
              className="w-full h-1/2 cursor-pointer object-cover"
              onClick={() => handleImageClick(2)}
            />
          </div>
        </div>
      ) : post.images.length >= 4 ? (
        <div className="grid grid-cols-2 gap-1 h-[350px]">
          {post.images.slice(0, 4).map((image, index) => (
            <div key={index} className="relative">
              <img
                src={getImageUrl(image)}
                alt={`Post content ${index + 1}`}
                className={`w-full h-full object-cover ${index === 3 && post.images.length > 4 ? 'opacity-80' : ''
                  }`}
                onClick={() => handleImageClick(index)}
              />
              {index === 3 && post.images.length > 4 && (
                <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center text-white text-2xl font-bold"
                  onClick={() => handleImageClick(index)}
                >
                  +{post.images.length - 4}
                </div>
              )}
            </div>
          ))}
        </div>
      ) : null}
    </div>
  ) : null;

  const commentWordCount = countWords(commentText);

  return (
    <div className={`min-h-screen ${isDarkMode ? 'bg-gray-900' : 'bg-[#F2F4F7]'} p-4`}>
      <main className="max-w-3xl mx-auto">
        <div className="mb-6">
          <div className={`rounded-lg ${isDarkMode ? 'bg-gray-800 shadow-dark' : 'bg-white shadow'} ${isMobile ? 'p-3' : isTablet ? 'p-4' : 'p-5'}`}>
            <div className="flex justify-between items-center mb-3">
              <div onClick={() => router.push(`/profiles/${post?.author?._id}`)} className="flex items-center gap-2">
                {post.author?.profile ? (
                  <img
                    src={getImageUrl(post.author.profile)}
                    alt="Author avatar"
                    className={`${isMobile ? 'w-6 h-6' : 'w-8 h-8'} rounded-full cursor-pointer`}
                  />
                ) : (
                  <div className={`${isMobile ? 'w-6 h-6' : 'w-8 h-8'} ${isDarkMode ? 'bg-gray-600' : 'bg-gray-300'} flex items-center justify-center text-xs`}>
                    {post?.author?.userName?.charAt(0).toUpperCase() || 'A'}
                  </div>
                )}
                <div className="flex flex-col justify-start items-start">
                  <span className={`font-medium cursor-pointer ${isMobile ? 'text-xs' : 'text-base'} ${isDarkMode ? 'text-gray-200' : 'text-gray-900'}`}>
                    {post?.author?.name ? post?.author?.name : post?.author?.userName}
                  </span>
                  <span className={`${isMobile ? 'text-xs' : 'text-sm'} ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                    {formatDate(post.createdAt)}
                  </span>
                </div>
              </div>

              <Dropdown
                menu={{ items: postMenuItems, onClick: handlePostMenuClick }}
                placement="bottomRight"
                trigger={['click']}
              >
                <button className={`font-bold p-1 rounded ${isDarkMode ? 'hover:bg-gray-700 text-gray-300' : 'hover:bg-gray-100'} cursor-pointer`}>
                  <EllipsisOutlined className={`${isMobile ? 'w-4 h-4' : 'w-5 h-5'}`} />
                </button>
              </Dropdown>
            </div>

            {post.title && (
              <h2 className={`${isMobile ? 'text-lg' : isTablet ? 'text-xl' : 'text-2xl'} font-bold mb-3 ${isDarkMode ? 'text-gray-100' : ''}`}>
                {post.title}
              </h2>
            )}

            {/* <div
              className={`mb-3 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'} ${isMobile ? 'text-sm' : 'text-base'}`}
              dangerouslySetInnerHTML={{ __html: cleanPostContent(post.content) }}
            /> */}

            {/* <div
              className={`mb-3 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'} ${isMobile ? 'text-sm' : 'text-base'}`}
              style={{ whiteSpace: 'pre-line' }}
            >
              {cleanPostContent(post.content)}
            </div> */}

            <div
              dangerouslySetInnerHTML={{
                __html: cleanPostContent(post.content)
              }}
            />




            {renderImageGrid}

            <div className="flex justify-between items-center">
              <div className="flex items-center gap-4 sm:gap-6">
                <button onClick={handleLike} className={`flex items-center cursor-pointer ${isDarkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100'} p-1 rounded`}>
                  {isLiked ?
                    <FaHeart className={`${isMobile ? 'w-4 h-4' : 'w-5 h-5'} text-red-500`} /> :
                    <FaRegHeart className={`${isMobile ? 'w-4 h-4' : 'w-5 h-5'} ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`} />
                  }
                  <span className={`ml-1 ${isMobile ? 'text-xs' : 'text-sm'} ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>{post.likes?.length || 0}</span>
                </button>

                <button
                  onClick={() => {
                    handleCommentButtonClick();
                    if (login_user_id) {
                      commentInputRef.current?.scrollIntoView({ behavior: 'smooth' });
                    }
                  }}
                  className={`flex items-center cursor-pointer ${isDarkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100'} p-1 rounded`}
                >
                  <MessageOutlined className={`${isMobile ? 'w-4 h-4' : 'w-5 h-5'} ${isDarkMode ? 'text-gray-400' : ''}`} />
                  <span className={`ml-1 ${isMobile ? 'text-xs' : 'text-sm'} ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>{comments.length}</span>
                </button>

                {post.category && (
                  <span className={`${isDarkMode ? 'bg-blue-900/30 text-blue-300' : 'bg-[#E6E6FF]'} text-xs py-1 px-2 rounded`}>
                    {post.category?.name || "General"}
                  </span>
                )}
              </div>

              <div className="flex items-center gap-3">
                <div className={`flex items-center gap-1.5 ${isMobile ? 'text-xs' : 'text-sm'} ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                  <FaEye className={`${isMobile ? 'w-3 h-3' : 'w-4 h-4'}`} />
                  <span>{post.views || 0}</span>
                </div>

                <button
                  onClick={handleShare}
                  className={`${isDarkMode ? 'text-gray-400 hover:bg-gray-700' : 'text-gray-500 hover:bg-gray-100'} px-2 py-1.5 cursor-pointer rounded-sm`}>
                  <Image src={isDarkMode ? "/icons/sharedark.png" : "/icons/share.png"} width={20} height={20} alt="share button" />
                </button>
              </div>
            </div>
          </div>
        </div>

        <form onSubmit={handleCommentSubmit} className="mb-4">
          <div className="flex gap-3 items-center">
            {login_user_id ? (
              currentUser.avatar ? (
                <Avatar src={getImageUrl(profile?.data?.profile)} size={32} />
              ) : (
                <Avatar size={32}>{currentUser.name?.charAt(0).toUpperCase() || 'U'}</Avatar>
              )
            ) : (
              <Avatar size={32} icon={<MessageOutlined />} />
            )}
            <div className="flex-1 relative">
              <Input.TextArea
                ref={commentInputRef}
                autoSize={{ minRows: 1, maxRows: 4 }}
                placeholder={login_user_id ? "Add a comment..." : "Login to comment"}
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                className={`rounded-full ${isDarkMode ? 'bg-gray-700 text-gray-200 border-gray-600' : 'bg-gray-100 border-gray-200'} ${commentWordCount > 100 ? 'border-red-500' : ''
                  }`}
                disabled={!login_user_id}
              />
              <span
                className={`absolute right-2 bottom-2 text-xs ${commentWordCount > 100 ? 'text-red-500' :
                  isDarkMode ? 'text-gray-400' : 'text-gray-500'
                  }`}
              >
                {commentWordCount}/100
              </span>
            </div>
          </div>
          <Button
            type="primary"
            htmlType="submit"
            className="mt-2 ml-12"
            disabled={
              !commentText.trim() ||
              !login_user_id ||
              createCommentLoading ||
              commentWordCount > 100
            }
            loading={createCommentLoading}
          >
            Post Comment
          </Button>
          {commentWordCount > 100 && (
            <span className="text-red-500 text-sm ml-12 mt-1 block">
              Comment exceeds 100 word limit
            </span>
          )}
          {!login_user_id && (
            <span className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'} ml-12 mt-1 block`}>
              Please login to comment
            </span>
          )}
        </form>

        <div id="comments" className='flex flex-col gap-3'>
          {comments.length === 0 ? (
            <Card className={`text-center p-8 ${isDarkMode ? 'bg-gray-800 border-gray-700' : ''}`}>
              <Empty
                description={
                  <span className={isDarkMode ? 'text-gray-400' : 'text-gray-500'}>
                    No comments yet. Be the first to comment!
                  </span>
                }
              />
            </Card>
          ) : (
            sortComments(comments).map(comment => renderComment(comment))
          )}
        </div>
      </main>

      {showImageModal && post?.images && post?.images.length > 0 && (
        <ImageModal
          images={post?.images.map(img => getImageUrl(img))}
          currentIndex={currentImageIndex}
          onClose={handleCloseModal}
          onNext={handleNextImage}
          onPrev={handlePrevImage}
          isDarkMode={isDarkMode}
        />
      )}

      <ReportPostModal
        isOpen={showReportModal}
        onClose={() => setShowReportModal(false)}
        postId={postId}
      />
    </div>
  );
};

export default PostDetailsPage;