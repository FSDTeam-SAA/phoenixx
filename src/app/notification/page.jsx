"use client";
import {
  useDeleteAllMutation,
  useDeleteSingleMutation,
  useGetAllNotificationQuery,
  useMarkAllAsReadMutation,
  useMarkSingleReadMutation,
} from "@/features/notification/noticationApi";
import {
  DeleteOutlined,
  LoadingOutlined,
  MoreOutlined,
  MessageOutlined,
  UserAddOutlined,
  HeartOutlined,
  InfoCircleOutlined,
  FileTextOutlined,
  CommentOutlined,
  CheckCircleOutlined,
  ExclamationCircleOutlined,
  BellOutlined,
} from "@ant-design/icons";

import { Badge, Button, Dropdown, Layout, List, Menu, Pagination } from "antd";
import { useRouter } from "next/navigation";
import { useContext, useState } from "react";
import toast from "react-hot-toast";
import { useDispatch, useSelector } from "react-redux";
import Loading from "../../components/Loading/Loading";
import { ThemeContext } from "../ClientLayout";

// Import your custom images
import user from "../../../public/icon/multipuluser-removebg-preview.png";
import create from "../../../public/icon/multipuluser-removebg-preview.png";
import love from "../../../public/icon/love-removebg-preview.png";
import info from "../../../public/icon/ChatGPT_Image_Sep_11__2025__02_52_44_PM-removebg-preview-removebg-preview.png";
import comment from "../../../public/icon/message-removebg-preview.png";

import Image from "next/image";

const { Content } = Layout;

export default function NotificationPage() {
  const router = useRouter();
  const dispatch = useDispatch();
  const [currentPage, setCurrentPage] = useState(1);
  const { isDarkMode } = useContext(ThemeContext);

  const { isLoading: allNotificationLoading, refetch } =
    useGetAllNotificationQuery(
      { page: currentPage },
      { refetchOnMountOrArgChange: true }
    );

  const { notifications } = useSelector((state) => state);

  const total = notifications?.meta?.total || 0;
  const limit = notifications?.meta?.limit || 10;

  const handlePageChange = (page) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const [markSingleAsRead, { isLoading: markReadLoading }] =
    useMarkSingleReadMutation();
  const [markAllAsRead, { isLoading: allmarkLoading }] =
    useMarkAllAsReadMutation();
  const [deleteSingle, { isLoading: singleDeleteLoading }] =
    useDeleteSingleMutation();
  const [deleteAll, { isLoading: deleteAllLoading }] = useDeleteAllMutation();

  const [processingNotificationId, setProcessingNotificationId] =
    useState(null);

  const handleDeleteNotification = async (id, e) => {
    e.stopPropagation();
    try {
      setProcessingNotificationId(id);
      await deleteSingle(id).unwrap();
      toast.success("Deleted notification");
      refetch();
    } catch (error) {
      console.error("Failed to delete notification:", error);
      toast.error("Failed to delete notification");
    } finally {
      setProcessingNotificationId(null);
    }
  };

  const handleClearAll = async () => {
    try {
      await deleteAll().unwrap();
      toast.success("Deleted all notifications");
      refetch();
    } catch (error) {
      console.error("Failed to clear all notifications:", error);
      toast.error("Failed to clear all notifications");
    }
  };

  // Enhanced icon function with fallbacks and Ant Design icons
  const getNotificationIcon = (type) => {
    console.log("Getting icon for type:", type);

    const iconStyle = {
      width: 40,
      height: 40,
      borderRadius: "50%",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      fontSize: "18px",
    };

    switch (type?.toLowerCase()) {
      case "comment":
        return (
          <div style={{ ...iconStyle, backgroundColor: "#1890ff20" }}>
            <Image
              src={comment}
              width={30}
              height={30}
              alt="comment"
              style={{ borderRadius: "50%" }}
            />
          </div>
        );
      case "new_follower":
        return (
          <div style={{ ...iconStyle, backgroundColor: "#52c41a20" }}>
            <Image
              src={user}
              width={30}
              height={30}
              alt="new_follower"
              style={{ borderRadius: "50%" }}
            />
          </div>
        );
      case "like":
        return (
          <div style={{ ...iconStyle, backgroundColor: "#ff4d4f20" }}>
            <Image
              src={love}
              width={30}
              height={30}
              alt="like"
              style={{ borderRadius: "50%" }}
            />
          </div>
        );
      case "follow":
        return (
          <div style={{ ...iconStyle, backgroundColor: "#722ed120" }}>
            <UserAddOutlined style={{ color: "#722ed1", fontSize: "18px" }} />
          </div>
        );
      case "error":
        return (
          <div style={{ ...iconStyle, backgroundColor: "#ff4d4f20" }}>
            <ExclamationCircleOutlined
              style={{ color: "#ff4d4f", fontSize: "18px" }}
            />
          </div>
        );
      case "success":
        return (
          <div style={{ ...iconStyle, backgroundColor: "#52c41a20" }}>
            <CheckCircleOutlined
              style={{ color: "#52c41a", fontSize: "18px" }}
            />
          </div>
        );
      case "info":
        return (
          <div style={{ ...iconStyle, backgroundColor: "#1890ff20" }}>
            <Image
              src={info}
              width={30}
              height={30}
              alt="info"
              style={{ borderRadius: "50%" }}
            />
          </div>
        );
      case "post":
        return (
          <div style={{ ...iconStyle, backgroundColor: "#fa8c1620" }}>
            <FileTextOutlined style={{ color: "#fa8c16", fontSize: "18px" }} />
          </div>
        );
      case "reply":
        return (
          <div style={{ ...iconStyle, backgroundColor: "#13c2c220" }}>
            <CommentOutlined style={{ color: "#13c2c2", fontSize: "18px" }} />
          </div>
        );
      default:
        console.log("Unknown notification type:", type, "using default");
        return (
          <div style={{ ...iconStyle, backgroundColor: "#d9d9d920" }}>
            <BellOutlined style={{ color: "#8c8c8c", fontSize: "18px" }} />
          </div>
        );
    }
  };

  const handleItemClick = async (notification) => {
    if (notification.type === "new_follower") {
      router.push(`/profiles/${notification?.followerId}`);
    } else {
      router.push(`/posts/${notification.postId}`);
    }
    if (!notification.read) {
      try {
        const response = await markSingleAsRead(notification.id).unwrap();
        if (response.success) {
          toast.success("Notification marked as read");
        }
      } catch (error) {
        console.error("Failed to mark as read:", error);
        toast.error("Failed to mark notification as read");
      }
    }
  };

  const formatNotificationTime = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now - date) / 1000);
    if (diffInSeconds < 60) return "Just now";
    if (diffInSeconds < 3600)
      return `${Math.floor(diffInSeconds / 60)} minute${
        Math.floor(diffInSeconds / 60) === 1 ? "" : "s"
      } ago`;
    if (diffInSeconds < 86400)
      return `${Math.floor(diffInSeconds / 3600)} hour${
        Math.floor(diffInSeconds / 3600) === 1 ? "" : "s"
      } ago`;
    if (diffInSeconds < 604800)
      return `${Math.floor(diffInSeconds / 86400)} day${
        Math.floor(diffInSeconds / 86400) === 1 ? "" : "s"
      } ago`;
    return date.toLocaleDateString();
  };

  const menu = (id, read) => (
    <Menu className={isDarkMode ? "bg-gray-800 text-gray-200" : ""}>
      <Menu.Item
        key="delete"
        icon={<DeleteOutlined />}
        onClick={(e) => {
          e.domEvent.stopPropagation();
          handleDeleteNotification(id, e.domEvent);
        }}
        danger
        disabled={processingNotificationId === id}
        className={isDarkMode ? "hover:bg-gray-700 text-red-400" : ""}
      >
        Delete
      </Menu.Item>
    </Menu>
  );

  const apiNotifications = notifications?.notification || [];
  const transformedNotifications =
    apiNotifications?.map((notification) => {
      console.log("Processing notification:", notification.type, notification);
      return {
        id: notification._id,
        followerId: notification.userName,
        postId: notification.postSlug,
        commentId: notification.commentId,
        title:
          notification.type.charAt(0).toUpperCase() +
          notification.type.slice(1),
        description: notification.message,
        read: notification.read,
        type: notification.type,
        time: formatNotificationTime(notification.createdAt),
      };
    }) || [];

  console.log(
    "All transformed notifications:",
    transformedNotifications.map((n) => ({ id: n.id, type: n.type }))
  );

  const unreadCount = transformedNotifications.filter(
    (item) => !item.read
  ).length;

  const contentClass = isDarkMode ? "bg-gray-800 text-gray-200" : "bg-white";
  const borderClass = isDarkMode ? "border-gray-700" : "border-gray-200";
  const textClass = isDarkMode ? "text-gray-200" : "text-gray-600";
  const textHeaderClass = isDarkMode ? "text-gray-100" : "text-gray-800";
  const textMutedClass = isDarkMode ? "text-gray-400" : "text-gray-500";
  const itemHoverBgClass = isDarkMode
    ? "hover:bg-gray-700"
    : "hover:bg-gray-50";
  const unreadBgClass = isDarkMode ? "bg-gray-700" : "bg-blue-50";

  return (
    <section className={`${!isDarkMode ? "bg-gray-200" : "dark:bg-[#212121]"}`}>
      <Content className="p-2 md:p-2 lg:w-8/12 w-full mx-auto">
        <div
          className={`${contentClass} p-2 md:p-2 rounded-lg shadow-sm overflow-hidden`}
        >
          {/* Header */}
          <div
            className={`p-4 border-b ${borderClass} flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4`}
          >
            <div className="flex items-center gap-2">
              <h1
                className={`text-lg sm:text-xl font-semibold ${textHeaderClass}`}
              >
                Notifications
              </h1>
              {unreadCount > 0 && (
                <Badge count={unreadCount} className="ml-1" />
              )}
            </div>
            <div className="flex flex-wrap gap-2 w-full sm:w-auto">
              <Button
                icon={
                  deleteAllLoading ? <LoadingOutlined /> : <DeleteOutlined />
                }
                onClick={handleClearAll}
                danger
                size="small"
                className={`flex-1 sm:flex-none ${
                  isDarkMode
                    ? "bg-red-900/70 border-red-800 hover:bg-red-800"
                    : ""
                }`}
                disabled={
                  transformedNotifications.length === 0 || deleteAllLoading
                }
                loading={deleteAllLoading}
              >
                <span className="hidden sm:inline">Clear all</span>
                <span className="sm:hidden">Clear</span>
              </Button>
            </div>
          </div>

          {/* Loading */}
          {allNotificationLoading && (
            <div className="p-8 text-center">
              <Loading />
            </div>
          )}

          {/* Empty */}
          {!allNotificationLoading && transformedNotifications.length === 0 && (
            <div className="p-8 text-center">
              <p className={`text-lg pl-2 ${textMutedClass}`}>
                No notifications
              </p>
            </div>
          )}

          {/* List */}
          {!allNotificationLoading && transformedNotifications.length > 0 && (
            <List
              itemLayout="horizontal"
              dataSource={transformedNotifications}
              renderItem={(item) => (
                <List.Item
                  className={`px-4 py-3 ${itemHoverBgClass} transition-colors cursor-pointer ${
                    !item.read ? unreadBgClass : ""
                  }`}
                  actions={[
                    <Dropdown
                      key="dropdown"
                      overlay={menu(item.id, item.read)}
                      trigger={["click"]}
                      placement="bottomRight"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <Button
                        type="text"
                        icon={
                          processingNotificationId === item.id ? (
                            <LoadingOutlined />
                          ) : (
                            <MoreOutlined />
                          )
                        }
                        size="small"
                        className={`opacity-70 hover:opacity-100 ${
                          isDarkMode ? "text-gray-300" : ""
                        }`}
                        disabled={processingNotificationId === item.id}
                        onClick={(e) => e.stopPropagation()}
                      />
                    </Dropdown>,
                  ]}
                  onClick={() => handleItemClick(item)}
                >
                  <List.Item.Meta
                    avatar={getNotificationIcon(item.type)}
                    title={
                      <div className="flex flex-col sm:flex-row sm:justify-between">
                        <span className={!item.read ? "font-semibold" : ""}>
                          {item.title}
                        </span>
                      </div>
                    }
                    description={
                      <div className="flex flex-col sm:flex-row sm:justify-between">
                        <span className={`${textClass} text-sm`}>
                          {item.description}
                        </span>
                        <span
                          className={`${textMutedClass} flex text-xs sm:text-sm sm:mt-0`}
                        >
                          {item.time}
                        </span>
                      </div>
                    }
                  />
                </List.Item>
              )}
            />
          )}
        </div>
      </Content>

      {/* Pagination */}
      <div className={`flex justify-center pb-10`}>
        {total > limit && (
          <Pagination
            current={currentPage}
            pageSize={limit}
            total={total}
            onChange={handlePageChange}
            className={`mb-4 ${isDarkMode ? "pagination-dark" : ""}`}
          />
        )}
      </div>

      {/* Dark Mode Pagination */}
      {isDarkMode && (
        <style jsx global>{`
          .pagination-dark .ant-pagination-item a {
            color: #e5e7eb;
          }
          .pagination-dark .ant-pagination-item-active {
            background-color: #374151;
            border-color: #4b5563;
          }
          .pagination-dark .ant-pagination-item-active a {
            color: #fff;
          }
          .pagination-dark .ant-pagination-prev button,
          .pagination-dark .ant-pagination-next button {
            color: #e5e7eb;
          }
        `}</style>
      )}
    </section>
  );
}
