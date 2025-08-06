import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { RiUserFollowFill, RiUserUnfollowLine } from 'react-icons/ri';
import { useFollowMutation, useSubscriptionsQuery, useUnFollowMutation } from '../features/Follow/followApi';

const FollowButton = ({ subscriberId, subscribedToId, className = "" }) => {

  const [isFollowing, setIsFollowing] = useState(false);

  const {
    data: subscriptionsData,
    isLoading: subscriptionsLoading,
    error: subscriptionsError
  } = useSubscriptionsQuery({ subscriberId });

  const [follow, { isLoading: followLoading }] = useFollowMutation();
  const [unfollow, { isLoading: unfollowLoading }] = useUnFollowMutation();

  useEffect(() => {
    if (subscriptionsData?.data) {
      const isSubscribed = subscriptionsData.data.some(
        subscription => subscription.subscribedTo._id === subscribedToId
      );
      setIsFollowing(isSubscribed);
    } else {
      setIsFollowing(false);
    }
  }, [subscriptionsData, subscribedToId]);

  // Check if user is logged in
  const isLoggedIn = () => {
    const token = localStorage.getItem('loginToken');
    return token && token.trim() !== '';
  };

  // Redirect to login page
  const redirectToLogin = () => {
    // You can customize this URL based on your routing setup
    window.location.href = '/auth/login';
    // Or if you're using React Router, you might use:
    // navigate('/login');
  };

  const handleButtonClick = () => {
    // Check if user is logged in first
    if (!isLoggedIn()) {
      toast.error("Please login to follow users");
      redirectToLogin();
      return;
    }

    // Proceed with follow/unfollow action
    if (isFollowing) {
      unfollowUser();
    } else {
      followUser();
    }
  };

  const followUser = async () => {
    try {
      await follow({ subscriberId, subscribedToId }).unwrap();
      setIsFollowing(true);
      toast.success("Following Successfully")
    } catch (error) {
      console.error("Error following user:", error);
      toast.error("Failed to follow user");
    }
  };

  const unfollowUser = async () => {
    try {
      await unfollow({ subscriberId, subscribedToId }).unwrap();
      setIsFollowing(false);
      toast.success("Unfollowing Successfully")
    } catch (error) {
      console.error("Error unfollowing user:", error);
      toast.error("Failed to unfollow user");
    }
  };

  const isLoading = followLoading || unfollowLoading;

  return (
    <button
      onClick={handleButtonClick}
      disabled={isLoading}
      className={`${className} w-full px-4 py-2 bg-[#1530c7] rounded border-blue-[#1530c7] cursor-pointer border disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center`}
      style={{ border: "1px solid #1530c7" }}
    >
      {isLoading ?
        <RiUserFollowFill
          className='text-white'
          size={20}
          style={{
            animation: 'spin 1s linear infinite',
            transformOrigin: 'center'
          }}
        /> :
        (isFollowing ? <RiUserFollowFill className='text-white' size={20} /> : <RiUserUnfollowLine className='text-white' size={20} />)
      }
    </button>
  );
};

export default FollowButton;