"use client";
import { useDeleteAllMutation, useDeleteSingleMutation, useGetAllNotificationQuery, useMarkAllAsReadMutation, useMarkSingleReadMutation } from '@/features/notification/noticationApi';
import {
  DeleteOutlined,
  LoadingOutlined,
  MoreOutlined
} from '@ant-design/icons';

import { Avatar, Badge, Button, Dropdown, Layout, List, Menu, Pagination } from 'antd';
import { useRouter } from 'next/navigation';
import { useContext, useState } from 'react';
import toast from 'react-hot-toast';
import { useDispatch, useSelector } from 'react-redux';
import { CommentIcon, DefaultIcon, ErrorIcon, FollowIcon, InfoIcon, LikeIcon, NewFollow, PostIcon, ReplyIcon, SuccessIcon } from '../../../public/images/Notification';
import Loading from '../../components/Loading/Loading';
import { ThemeContext } from '../ClientLayout';
const { Content } = Layout;
// Custom loading icon
const antIcon = <LoadingOutlined style={{ fontSize: 24 }} spin />;
export default function NotificationPage() {
  const router = useRouter();
  const dispatch = useDispatch();
  const [currentPage, setCurrentPage] = useState(1);
  const { isDarkMode } = useContext(ThemeContext);
  // Fetch notifications data with pagination
  const { isLoading: allNotificationLoading, refetch } = useGetAllNotificationQuery({
    page: currentPage
  }, {
    refetchOnMountOrArgChange: true
  });


  const { notifications } = useSelector((state) => state);
  console.log(notifications)
  // Total pages from meta data
  const total = notifications?.meta?.total || 0;
  const limit = notifications?.meta?.limit || 10;
  // Handle page change
  const handlePageChange = (page) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };
  // API mutations
  const [markSingleAsRead, { isLoading: markReadLoading }] = useMarkSingleReadMutation();
  const [markAllAsRead, { isLoading: allmarkLoading }] = useMarkAllAsReadMutation();
  const [deleteSingle, { isLoading: singleDeleteLoading }] = useDeleteSingleMutation();
  const [deleteAll, { isLoading: deleteAllLoading }] = useDeleteAllMutation();
  // Track which notification is being processed
  const [processingNotificationId, setProcessingNotificationId] = useState(null);

  const handleDeleteNotification = async (id, e) => {
    e.stopPropagation(); // Stop event propagation
    try {
      setProcessingNotificationId(id);
      await deleteSingle(id).unwrap();
      toast.success("Deleted notification");
      refetch(); // Refresh the notifications list
    } catch (error) {
      console.error('Failed to delete notification:', error);
      toast.error("Failed to delete notification");
    } finally {
      setProcessingNotificationId(null);
    }
  };

  const handleClearAll = async () => {
    try {
      await deleteAll().unwrap();
      toast.success("Deleted all notifications");
      refetch(); // Refresh the notifications list
    } catch (error) {
      console.error('Failed to clear all notifications:', error);
      toast.error("Failed to clear all notifications");
    }
  };
  const getNotificationIcon = (type) => {
    switch (type) {
      case 'comment':
        return <CommentIcon />;
      case 'new_follower':
        return <NewFollow />;
      case 'like':
        return <LikeIcon />;
      case 'follow':
        return <FollowIcon />;
      case 'error':
        return <ErrorIcon />;
      case 'success':
        return <SuccessIcon />;
      case 'info':
        return <InfoIcon />;
      case 'post':
        return <PostIcon />;
      case 'reply':
        return <ReplyIcon />;
      default:
        return <DefaultIcon />;
    }
  };


  const handleItemClick = async (notification) => {
    console.log("Notification clicked:", notification);
    if (notification.type === "new_follower") {
      router.push(`/profiles/${notification?.followerId}`)
    } else {
      router.push(`/posts/${notification.postId}`)
    }
    if (!notification.read) {
      try {
        const response = await markSingleAsRead(notification.id).unwrap();
        if (response.success) {
          router.push(`/posts/${response?.data?.postId}`);
          toast.success("Notification marked as read");
        }
      } catch (error) {
        console.error('Failed to mark as read:', error);
        toast.error("Failed to mark notification as read");
      }
    }
  };
  const formatNotificationTime = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now - date) / 1000);
    if (diffInSeconds < 60) {
      return 'Just now';
    } else if (diffInSeconds < 3600) {
      const minutes = Math.floor(diffInSeconds / 60);
      return `${minutes} minute${minutes === 1 ? '' : 's'} ago`;
    } else if (diffInSeconds < 86400) {
      const hours = Math.floor(diffInSeconds / 3600);
      return `${hours} hour${hours === 1 ? '' : 's'} ago`;
    } else if (diffInSeconds < 604800) {
      const days = Math.floor(diffInSeconds / 86400);
      return `${days} day${days === 1 ? '' : 's'} ago`;
    } else {
      return date.toLocaleDateString();
    }
  };
  const menu = (id, read) => (
    <Menu className={isDarkMode ? "bg-gray-800 text-gray-200" : ""}>
      <Menu.Item
        key="delete"
        icon={<DeleteOutlined />}
        onClick={(e) => {
          e.domEvent.stopPropagation(); // Stop event propagation
          handleDeleteNotification(id, e.domEvent);
        }}
        danger
        disabled={processingNotificationId === id}
        className={isDarkMode ? "hover:bg-gray-700 text-red-400" : ""}>
        Delete
      </Menu.Item>
    </Menu>
  );
  // Get API notifications
  const apiNotifications = notifications?.notification || [];
  const transformedNotifications = apiNotifications?.map(notification => ({
    id: notification._id,
    followerId: notification.followerId,
    postId: notification.postId,
    commentId: notification.commentId,
    title: notification.type.charAt(0).toUpperCase() + notification.type.slice(1),
    description: notification.message,
    read: notification.read,
    type: notification.type,
    time: formatNotificationTime(notification.createdAt)
  })) || [];
  const unreadCount = transformedNotifications.filter(item => !item.read).length;
  // Define dynamic classes based on dark mode
  const contentClass = isDarkMode ? "bg-gray-800 text-gray-200" : "bg-white";
  const borderClass = isDarkMode ? "border-gray-700" : "border-gray-200";
  const textClass = isDarkMode ? "text-gray-200" : "text-gray-600";
  const textHeaderClass = isDarkMode ? "text-gray-100" : "text-gray-800";
  const textMutedClass = isDarkMode ? "text-gray-400" : "text-gray-500";
  const itemHoverBgClass = isDarkMode ? "hover:bg-gray-700" : "hover:bg-gray-50";
  const unreadBgClass = isDarkMode ? "bg-gray-700" : "bg-blue-50";
  return (
    <>

      <Layout
        style={{ backgroundColor: isDarkMode ? '#101828' : 'white' }}
        className="md:p-6 p-0"
      >
        <Content className="p-2 md:p-2 lg:w-8/12 w-full mx-auto">
          <div className={`${contentClass} p-2 md:p-2 rounded-lg shadow-sm overflow-hidden`}>
            {/* Header with actions */}
            <div className={`p-4 border-b ${borderClass} flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4`}>
              <div className="flex items-center gap-2">
                <h1 className={`text-lg sm:text-xl font-semibold ${textHeaderClass}`}>Notifications</h1>
                {unreadCount > 0 && (
                  <Badge count={unreadCount} className="ml-1" />
                )}
              </div>
              <div className="flex flex-wrap gap-2 w-full sm:w-auto">
                <Button
                  icon={deleteAllLoading ? <LoadingOutlined /> : <DeleteOutlined />}
                  onClick={handleClearAll}
                  danger
                  size="small"
                  className={`flex-1 sm:flex-none ${isDarkMode ? "bg-red-900/70 border-red-800 hover:bg-red-800" : ""}`}
                  disabled={transformedNotifications.length === 0 || deleteAllLoading}
                  loading={deleteAllLoading}
                >
                  <span className="hidden sm:inline">Clear all</span>
                  <span className="sm:hidden">Clear</span>
                </Button>
              </div>
            </div>
            {/* Loading state */}
            {allNotificationLoading && (
              <div className="p-8 text-center">
                <Loading />
              </div>
            )}
            {/* Empty state */}
            {!allNotificationLoading && transformedNotifications.length === 0 && (
              <div className="p-8 text-center">
                <p className={`text-lg pl-2 ${textMutedClass}`}>No notifications</p>
              </div>
            )}
            {/* Notifications List */}
            {!allNotificationLoading && transformedNotifications.length > 0 && (
              <List
                itemLayout="horizontal"
                dataSource={transformedNotifications}
                renderItem={(item) => (
                  <List.Item
                    className={`px-4 py-3 ${itemHoverBgClass} transition-colors cursor-pointer ${!item.read ? unreadBgClass : ''}`}
                    actions={[
                      <Dropdown
                        key="dropdown"
                        overlay={menu(item.id, item.read)}
                        trigger={['click']}
                        placement="bottomRight"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <Button
                          type="text"
                          icon={processingNotificationId === item.id ? <LoadingOutlined /> : <MoreOutlined />}
                          size="small"
                          className={`opacity-70 hover:opacity-100 ${isDarkMode ? "text-gray-300" : ""}`}
                          disabled={processingNotificationId === item.id}
                          onClick={(e) => {
                            e.stopPropagation();
                          }}
                        />
                      </Dropdown>
                    ]}
                    onClick={() => handleItemClick(item)}
                  >
                    <List.Item.Meta
                      style={{ marginLeft: '10px' }}
                      avatar={
                        <Avatar
                          icon={getNotificationIcon(item.type)}
                          size="default"
                          className="flex items-center justify-center"
                          style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                        />
                      }
                      title={
                        <div className="flex flex-col sm:flex-row sm:justify-between">
                          <span className={!item.read ? 'font-semibold' : ''}>
                            {item.title}
                          </span>
                          <span className={`${textMutedClass} text-xs sm:text-sm sm:mt-0`}>
                            {item.time}
                          </span>
                        </div>
                      }
                      description={
                        <span className={`${textClass} text-sm`}>
                          {item.description}
                        </span>
                      }
                    />
                  </List.Item>
                )}
              />
            )}
          </div>
        </Content>
      </Layout>
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
      {/* Add this CSS to style ant-design components in dark mode */}
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
    </>
  );
}