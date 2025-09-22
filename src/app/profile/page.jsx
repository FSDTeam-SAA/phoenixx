"use client";
import ProfilePostCard from "@/components/ProfilePostCard";
import ProfileBanner from "@/components/profile/ProfileBanner";
import {
  useGetSaveAllPostQuery,
  useSavepostMutation,
} from "@/features/SavePost/savepostApi";
import { useMyCommentPostQuery } from "@/features/comments/commentApi";
import {
  useDeletePostMutation,
  useLikePostMutation,
  useMyPostQuery,
} from "@/features/post/postApi";
import { Button, Card, Form, Grid, Input, message, Modal, Space } from "antd";
import { formatDistanceToNow } from "date-fns";
import React, { useContext, useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import {
  FiBookmark,
  FiFile,
  FiGrid,
  FiList,
  FiMessageSquare,
  FiX,
} from "react-icons/fi";
import Loading from "../../components/Loading/Loading";
import { ThemeContext } from "../ClientLayout";

const { useBreakpoint } = Grid;
const { TextArea } = Input;

const ProfilePage = () => {
  const screens = useBreakpoint();
  const { isDarkMode } = useContext(ThemeContext);
  const {
    data: postsData,
    isLoading: isPostsLoading,
    isError: isPostsError,
    refetch: refetchPosts,
  } = useMyPostQuery();
  const {
    data: savePostData,
    isLoading: isSavePostsLoading,
    isError: isSavePostError,
    refetch: refetchSavedPosts,
  } = useGetSaveAllPostQuery();

  const {
    data: myCommentPost,
    isLoading: myCommentPostLoading,
    refetch: myCommentPostRefetch,
  } = useMyCommentPostQuery();

  const [deletePost, { isLoading: deleteLoading }] = useDeletePostMutation();
  const [savepost, { isLoading: isUnsaving }] = useSavepostMutation();

  // State management
  const [activeTab, setActiveTab] = useState(() =>
    typeof window !== "undefined"
      ? localStorage.getItem("profileActiveTab") || "totalPosts"
      : "totalPosts"
  );
  const [isGridView, setIsGridView] = useState(() =>
    typeof window !== "undefined"
      ? localStorage.getItem("profileGridView") === "true"
      : false
  );
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [postToDelete, setPostToDelete] = useState(null);
  const [editingPost, setEditingPost] = useState(null);
  const [form] = Form.useForm();
  const [likePost] = useLikePostMutation();
  const [isDeleting, setIsDeleting] = useState(false);
  const [showViewDialog, setShowViewDialog] = useState(false);
  const [clickCount, setClickCount] = useState(1);

  // Store active tab in localStorage
  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem("profileActiveTab", activeTab);
    }
  }, [activeTab]);

  // Store grid view preference in localStorage
  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem("profileGridView", isGridView.toString());
    }
  }, [isGridView]);

  // Error handling
  useEffect(() => {
    if (isPostsError) message.error("Failed to load your posts");
    if (isSavePostError) message.error("Failed to load saved posts");
  }, [isPostsError, isSavePostError]);

  // Data preparation
  const userPosts = postsData?.data || [];
  const savedPosts = savePostData?.data || [];
  const myComment = myCommentPost?.data || [];

  // Activity stats
  const stats = {
    totalPosts: userPosts.length || 0,
    savedPosts: savedPosts.filter((post) => post.postId !== null).length || 0,
    comments: myComment.length || 0,
  };

  // Format date helper
  const formatDate = (dateString) => {
    if (!dateString) return "Just now";
    try {
      return formatDistanceToNow(new Date(dateString), { addSuffix: true });
    } catch (error) {
      return "Just now";
    }
  };

  // Transform post data for rendering
  const transformPostData = (post) => ({
    ...post,
    createdAt: formatDate(post.createdAt),
    isSavedPost: false,
    uniqueId: `post-${post._id}`,
  });

  // Transform saved post data - FIXED: Added null check
  const transformSavedPostData = (savedPost) => {
    if (!savedPost || !savedPost.postId) return null;

    return {
      ...savedPost.postId,
      _id: savedPost.postId._id, // Original post ID
      savedPostId: savedPost._id, // Saved post record ID for unsaving
      savedAt: formatDate(savedPost.createdAt),
      isSavedPost: true, // Flag to identify as a saved post
      uniqueId: `saved-${savedPost._id}`,
    };
  };

  // Handle post actions
  const handleEditPost = (postId) => {
    const postToEdit = userPosts.find((post) => post._id === postId);
    if (postToEdit) {
      setEditingPost(postToEdit);
      refetchPosts();
      myCommentPostRefetch();
      form.setFieldsValue({
        title: postToEdit.title,
        content: postToEdit.content?.replace(/<[^>]*>/g, "") || "",
      });
      setIsEditModalOpen(true);
    }
  };

  const handleConfirmDelete = async () => {
    if (!postToDelete) return;

    setIsDeleting(true);
    try {
      await deletePost(postToDelete).unwrap();
      message.success("Post deleted successfully");
      refetchPosts();
      setIsDeleteModalOpen(false);
      setPostToDelete(null);
      refetchSavedPosts();
    } catch (error) {
      message.error("Failed to delete post");
    } finally {
      setIsDeleting(false);
    }
  };

  const handleOptionSelect = (postId, option) => {
    if (option === "edit") {
      handleEditPost(postId);
    } else if (option === "delete") {
      setPostToDelete(postId);
      setIsDeleteModalOpen(true);
    }
  };

  const handleLike = async (postId) => {
    try {
      await likePost(postId).unwrap();
      refetchPosts();
      if (activeTab === "savedPosts") {
        refetchSavedPosts();
      }
    } catch (error) {
      message.error("Failed to like post");
      console.error("Like error:", error);
    }
  };

  // Handle unsaving a post
  const handleUnsave = async (postId) => {
    // Find the saved post record that contains this post
    const savedPostRecord = savedPosts.find(
      (item) => item.postId && item.postId._id === postId
    );

    if (!savedPostRecord) {
      message.error("Could not find saved post record");
      return;
    }

    try {
      // Use the saved post record ID (not the original post ID)
      const response = await savepost({
        postId: savedPostRecord?.postId?._id,
      }).unwrap();
      toast.success("Post removed from saved items");
      refetchSavedPosts();
    } catch (error) {
      console.error("Error unsaving post:", error);
      toast.error("Failed to unsave post");
    }
  };

  const handleFeedsClick = () => {
    const newCount = (clickCount % 2) + 1;
    setClickCount(newCount);
    localStorage.setItem("feedGridState", newCount.toString());
  };

  // Open view selection dialog instead of direct toggle
  const handleViewButtonClick = () => {
    // setShowViewDialog(true);

    setIsGridView(!isGridView);
  };

  // Handle view selection from dialog
  const handleViewSelection = (viewType) => {
    const newGridView = viewType === "grid";
    setIsGridView(newGridView);
    setShowViewDialog(false);
    handleFeedsClick(); // Keep existing logic
  };

  // Use useMemo to prevent unnecessary recalculations and duplication - FIXED: Added filter for null values
  const postsToDisplay = useMemo(() => {
    switch (activeTab) {
      case "totalPosts":
        return [...userPosts].reverse().map(transformPostData);
      case "savedPosts":
        return [...savedPosts]
          .reverse()
          .map(transformSavedPostData)
          .filter((post) => post !== null);
      case "comments":
        return [...myComment].reverse().map(transformPostData);
      default:
        return [...userPosts].reverse().map(transformPostData);
    }
  }, [activeTab, userPosts, savedPosts, myComment]);

  const isLoading =
    isPostsLoading ||
    (activeTab === "savedPosts" && isSavePostsLoading) ||
    (activeTab === "comments" && myCommentPostLoading);

  // Tab configuration
  // Tab configuration with images instead of icons
  // Tab configuration with images instead of icons
  const tabs = [
    {
      key: "totalPosts",
      icon: "/icon/file-text.svg",
      label: "Total Posts",
    },
    {
      key: "savedPosts",
      icon: "/icons/savelight.png",
      label: "Saved Posts",
    },
    {
      key: "comments",
      icon: "/icon/message-square-more.svg",
      label: "Comments",
    },
  ];

  // Dark mode styles
  const themeStyles = {
    backgroundColor: isDarkMode ? "var(--secondary-bg)" : "#E5E7EB",
    cardBackground: isDarkMode ? "var(--card-bg)" : "#ffffff",
    textColor: isDarkMode ? "var(--text-color)" : "inherit",
    borderColor: isDarkMode ? "var(--border-color)" : "#e5e7eb",
    hoverBg: isDarkMode ? "var(--hover-bg)" : "#f9fafb",
    activeTabBg: isDarkMode ? "rgba(59, 130, 246, 0.2)" : "#e0e7ff",
    activeTabText: isDarkMode ? "#93c5fd" : "#4338ca",
    iconColor: isDarkMode ? "var(--icon-color)" : "#6b7280",
  };

  return (
    <div
      className={`min-h-screen ${isDarkMode ? "dark-theme" : "light-theme"}`}
      style={{
        backgroundColor: themeStyles.backgroundColor,
        color: themeStyles.textColor,
      }}
    >
      <ProfileBanner />

      <main className="py-4 sm:py-6 lg:py-8 px-2 sm:px-4 lg:px-4 container mx-auto max-w-screen-xl">
        <div
          className={`flex ${
            screens.md ? "flex-row" : "flex-col"
          } gap-4 sm:gap-6`}
        >
          {/* Sidebar - Activity Stats */}
          <aside
            className={`${
              screens.md ? (screens.lg ? "w-1/4" : "w-1/3") : "w-full"
            } ${!screens.md ? "mb-4" : ""}`}
          >
            <Card
              title="Your Activity"
              className={`shadow-sm hover:shadow transition-shadow text-[#]`}
              style={{
                backgroundColor: themeStyles.cardBackground,
                borderColor: themeStyles.borderColor,
                padding: screens.xs ? "12px" : "16px",
              }}
            >
              <Space direction="vertical" size="middle" className="w-full">
                {tabs.map(({ key, icon, label }) => (
                  <button
                    key={key}
                    onClick={() => setActiveTab(key)}
                    className={`flex items-center justify-between w-full cursor-pointer p-2 sm:p-3 rounded-md transition-all ${
                      activeTab === key
                        ? "font-medium"
                        : `hover:bg-[${themeStyles.hoverBg}] text-[${themeStyles.textColor}]`
                    }`}
                    style={{
                      backgroundColor:
                        activeTab === key
                          ? themeStyles.activeTabBg
                          : "transparent",
                      color:
                        activeTab === key
                          ? themeStyles.activeTabText
                          : themeStyles.textColor,
                      border:
                        activeTab === key
                          ? isDarkMode
                            ? "1px solid rgba(59, 130, 246, 0.3)"
                            : "1px solid rgba(67, 56, 202, 0.2)"
                          : "none",
                    }}
                  >
                    <span className="flex items-center text-sm sm:text-base">
                      <img
                        src={icon}
                        alt={label}
                        className="mr-2 sm:mr-3 w-6 h-6 object-cover"
                      />
                      <span>{label}</span>
                    </span>
                    <span
                      className="font-bold text-sm sm:text-base"
                      style={{
                        color:
                          activeTab === key
                            ? themeStyles.activeTabText
                            : themeStyles.textColor,
                      }}
                    >
                      {stats[key]}
                    </span>
                  </button>
                ))}
              </Space>
            </Card>
          </aside>

          {/* Posts Feed */}
          <section
            className={`${
              screens.md ? (screens.lg ? "w-3/4" : "w-2/3") : "w-full"
            }`}
          >
            {/* Header with Grid View Toggle */}
            <div className="mb-4 sm:mb-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
              <h2
                className="text-lg sm:text-xl font-semibold"
                style={{ color: themeStyles.textColor }}
              >
                {activeTab === "totalPosts" && "Your Posts"}
                {activeTab === "savedPosts" && "Saved Posts"}
                {activeTab === "comments" && "Your Comments"}
              </h2>

              {/* Grid View Toggle Button - Now opens dropdown */}
              {!screens.xs && (
                <div className="relative">
                  <Button
                    type="text"
                    icon={
                      isGridView ? (
                        <FiList size={screens.xs ? 16 : 18} />
                      ) : (
                        <FiGrid size={screens.xs ? 16 : 18} />
                      )
                    }
                    onClick={handleViewButtonClick}
                    className={`flex items-center justify-center cursor-pointer gap-1 sm:gap-2 border px-2 sm:px-3 py-1 sm:py-2 rounded-md transition-all duration-200 active:scale-95 ${
                      isDarkMode ? "hover:bg-gray-700" : "hover:bg-gray-100"
                    }`}
                    style={{
                      backgroundColor: "transparent",
                      color: themeStyles.textColor,
                      border: `1px solid gray`,
                    }}
                  >
                    <span
                      className={`${
                        screens.xs ? "text-sm" : "text-base"
                      } -mt-1 font-semibold`}
                    >
                      {isGridView ? "List View" : "Grid View"}
                    </span>
                  </Button>

                  {/* View Selection Dropdown */}
                  {showViewDialog && (
                    <>
                      {/* Invisible backdrop to close dropdown */}
                      <div
                        className="fixed inset-0 z-40"
                        onClick={() => setShowViewDialog(false)}
                      />

                      {/* Dropdown positioned near the button */}
                      <div
                        className="absolute z-50 mt-2 w-64 rounded-lg shadow-lg border"
                        style={{
                          backgroundColor: themeStyles.cardBackground,
                          borderColor: themeStyles.borderColor,
                          right: "0",
                          top: "100%",
                        }}
                      >
                        {/* View Options */}
                        <div className="p-2">
                          {/* Grid View Option */}
                          <button
                            onClick={() => handleViewSelection("grid")}
                            className={`w-full p-3 rounded-md flex items-center gap-3 transition-all mb-1`}
                            style={{
                              backgroundColor: isGridView
                                ? themeStyles.activeTabBg
                                : "transparent",
                              color: themeStyles.textColor,
                            }}
                            onMouseEnter={(e) => {
                              if (!isGridView) {
                                e.target.style.backgroundColor =
                                  themeStyles.hoverBg;
                              }
                            }}
                            onMouseLeave={(e) => {
                              if (!isGridView) {
                                e.target.style.backgroundColor = isGridView
                                  ? themeStyles.activeTabBg
                                  : "transparent";
                              }
                            }}
                          >
                            <FiGrid
                              size={18}
                              style={{ color: themeStyles.textColor }}
                            />
                            <div className="text-left flex-1">
                              <div
                                className="font-medium text-sm"
                                style={{ color: themeStyles.textColor }}
                              >
                                Grid View
                              </div>
                              <div
                                className="text-xs"
                                style={{
                                  color: themeStyles.textColor,
                                  opacity: 0.7,
                                }}
                              >
                                Display in grid layout
                              </div>
                            </div>
                            {isGridView && (
                              <div
                                className="w-2 h-2 rounded-full"
                                style={{
                                  backgroundColor:
                                    themeStyles.activeTabText || "#3b82f6",
                                }}
                              />
                            )}
                          </button>

                          {/* List View Option */}
                          <button
                            onClick={() => handleViewSelection("list")}
                            className={`w-full p-3 rounded-md flex items-center gap-3 transition-all cursor-pointer`}
                            style={{
                              backgroundColor: !isGridView
                                ? themeStyles.activeTabBg
                                : "transparent",
                              color: themeStyles.textColor,
                            }}
                            onMouseEnter={(e) => {
                              if (isGridView) {
                                e.target.style.backgroundColor =
                                  themeStyles.hoverBg;
                              }
                            }}
                            onMouseLeave={(e) => {
                              if (isGridView) {
                                e.target.style.backgroundColor = !isGridView
                                  ? themeStyles.activeTabBg
                                  : "transparent";
                              }
                            }}
                          >
                            <FiList
                              size={18}
                              style={{ color: themeStyles.textColor }}
                            />
                            <div className="text-left flex-1">
                              <div
                                className="font-medium text-sm"
                                style={{ color: themeStyles.textColor }}
                              >
                                List View
                              </div>
                              <div
                                className="text-xs"
                                style={{
                                  color: themeStyles.textColor,
                                  opacity: 0.7,
                                }}
                              >
                                Display in list layout
                              </div>
                            </div>
                            {!isGridView && (
                              <div
                                className="w-2 h-2 rounded-full"
                                style={{
                                  backgroundColor:
                                    themeStyles.activeTabText || "#3b82f6",
                                }}
                              />
                            )}
                          </button>
                        </div>
                      </div>
                    </>
                  )}
                </div>
              )}
            </div>

            {isLoading ? (
              <div
                className={`text-center p-6 sm:p-8 rounded-lg shadow-sm ${
                  isDarkMode ? "dark-loading" : "light-loading"
                }`}
                style={{
                  backgroundColor: themeStyles.cardBackground,
                  borderColor: themeStyles.borderColor,
                }}
              >
                <p style={{ color: themeStyles.textColor }}>
                  <Loading />
                </p>
              </div>
            ) : postsToDisplay.length > 0 ? (
              <div
                className={`${
                  isGridView
                    ? "columns-1 sm:columns-2 lg:columns-2 xl:columns-2 gap-3 sm:gap-4 space-y-3 sm:space-y-4"
                    : "flex flex-col gap-3 sm:gap-4"
                }`}
              >
                {postsToDisplay.map((post, index) => (
                  <div
                    key={`${activeTab}-${post.uniqueId}-${index}`}
                    className={
                      isGridView ? "break-inside-avoid mb-3 sm:mb-4" : ""
                    }
                  >
                    <ProfilePostCard
                      postData={post}
                      onLike={handleLike}
                      onOptionSelect={handleOptionSelect}
                      onUnsave={handleUnsave}
                      refetchPosts={refetchPosts}
                      myCommentPostRefetch={myCommentPostRefetch}
                      isDarkMode={isDarkMode}
                      isGridView={isGridView}
                    />
                  </div>
                ))}
              </div>
            ) : (
              <div
                className={`text-center p-6 sm:p-8 rounded-lg shadow-sm ${
                  isDarkMode ? "dark-empty" : "light-empty"
                }`}
                style={{
                  backgroundColor: themeStyles.cardBackground,
                  borderColor: themeStyles.borderColor,
                }}
              >
                <p style={{ color: themeStyles.textColor }}>
                  {activeTab === "totalPosts"
                    ? "No posts to display"
                    : activeTab === "savedPosts"
                    ? "No saved posts to display"
                    : "No comments to display"}
                </p>
              </div>
            )}
          </section>
        </div>
      </main>

      {/* Delete Confirmation Modal */}
      <Modal
        title="Delete Post"
        open={isDeleteModalOpen}
        onCancel={() => setIsDeleteModalOpen(false)}
        footer={[
          <Button
            key="cancel"
            onClick={() => setIsDeleteModalOpen(false)}
            style={{
              backgroundColor: themeStyles.cardBackground,
              color: themeStyles.textColor,
              borderColor: themeStyles.borderColor,
            }}
          >
            Cancel
          </Button>,
          <Button
            key="delete"
            type="primary"
            danger
            onClick={handleConfirmDelete}
            loading={isDeleting}
          >
            Delete
          </Button>,
        ]}
        centered
        className={`${isDarkMode ? "dark-modal" : "light-modal"}`}
        styles={{
          header: {
            backgroundColor: themeStyles.cardBackground,
            color: themeStyles.textColor,
            borderBottomColor: themeStyles.borderColor,
          },
          content: {
            backgroundColor: themeStyles.cardBackground,
            color: themeStyles.textColor,
          },
        }}
      >
        <p style={{ color: themeStyles.textColor }}>
          Are you sure you want to delete this post? This action cannot be
          undone.
        </p>
      </Modal>
    </div>
  );
};

export default ProfilePage;
