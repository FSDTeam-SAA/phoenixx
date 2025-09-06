import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { SlUserFollowing, SlUserUnfollow } from "react-icons/sl";
import { useFollowMutation, useSubscriptionsQuery, useUnFollowMutation } from '../features/Follow/followApi';

const FollowButton = ({ subscribedToId, className = "", subscriberId }) => {
  const [isFollowing, setIsFollowing] = useState(false);

  const {
    data: subscriptionsData,
    isLoading: subscriptionsLoading,
    error: subscriptionsError,
    refetch
  } = useSubscriptionsQuery(subscribedToId);


  const [follow, { isLoading: followLoading }] = useFollowMutation();
  const [unfollow, { isLoading: unfollowLoading }] = useUnFollowMutation();

  // Check if user is logged in
  const isLoggedIn = () => {
    const token = localStorage.getItem('loginToken');
    return token && token.trim() !== '';
  };

  const redirectToLogin = () => {
    window.location.href = '/auth/login';
  };

  const handleButtonClick = () => {
    if (!isLoggedIn()) {
      toast.error("Please login to follow users");
      redirectToLogin();
      return;
    }

    if (isFollowing) {
      unfollowUser();
    } else {
      followUser();
    }
  };

  const followUser = async () => {
    try {
      const result = await follow({ userName: subscribedToId }).unwrap();
      if (result.success) {
        toast.success("Following Successfully");
        setIsFollowing(true);
        refetch(); // Refresh the subscriptions list
      } else {
        toast.error(result.message || "Failed to follow user");
      }
    } catch (error) {
      console.error("Error following user:", error);
      // If it's an "already subscribed" error, update the state accordingly
      if (error.data?.message?.includes('already subscribed')) {
        setIsFollowing(true);
        toast.error("You are already following this user");
      } else {
        toast.error(error.data?.message || "Failed to follow user");
      }
    }
  };

  const unfollowUser = async () => {
    try {
      const result = await unfollow({ userName: subscribedToId }).unwrap();
      if (result.success) {
        toast.success("Unfollowed Successfully");
        setIsFollowing(false);
        refetch(); // Refresh the subscriptions list
      } else {
        toast.error(result.message || "Failed to unfollow user");
      }
    } catch (error) {
      console.error("Error unfollowing user:", error);
      toast.error(error.data?.message || "Failed to unfollow user");
    }
  };

  const isLoading = followLoading || unfollowLoading || subscriptionsLoading;

  // Fixed: Added subscriptionsData to dependency array
  // Check if we're following this specific user
  useEffect(() => {
    if (subscriptionsData?.data && subscribedToId) {
      const followingThisUser = subscriptionsData.data.some(
        subscription => subscription.subscribedTo.userName === subscribedToId
      );
      setIsFollowing(followingThisUser);
    } else if (subscriptionsData?.data && !subscriptionsData.data.length) {
      // If subscriptions list is empty, user is not following anyone
      setIsFollowing(false);
    }
  }, [subscriptionsData, subscribedToId]); // Added subscriptionsData dependency

  return (
    <button
      onClick={handleButtonClick}
      disabled={isLoading}
      className={`${className} w-full px-4 py-[7px] font-medium text-white bg-[#1530c7] rounded border-blue-[#1530c7] cursor-pointer border disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center`}
      style={{ border: "1px solid #1530c7" }}
    >
      {isLoading ? (
        <span>Loading...</span>
      ) : isFollowing ? (
        <div className='flex items-center gap-2'><SlUserUnfollow />Unfollow</div>
      ) : (
        <div className='flex items-center gap-2'><SlUserFollowing />Follow</div>
      )}
    </button>
  );
};

export default FollowButton;