import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { HiMiniBellAlert, HiOutlineBell } from "react-icons/hi2";
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

  const followUser = async () => {
    try {
      await follow({ subscriberId, subscribedToId }).unwrap();
      setIsFollowing(true);
      toast.success("Following Successfully")
    } catch (error) {
      console.error("Error following user:", error);
    }
  };

  const unfollowUser = async () => {
    try {
      await unfollow({ subscriberId, subscribedToId }).unwrap();
      setIsFollowing(false);
      toast.success("Unfollowing Successfully")
    } catch (error) {
      console.error("Error unfollowing user:", error);
    }
  };

  if (subscriptionsError) {
    return <button disabled>Error loading follow status</button>;
  }

  const isLoading = followLoading || unfollowLoading;

  return (
    <button
      onClick={isFollowing ? unfollowUser : followUser}
      disabled={isLoading}
      className={`${className} w-full px-4 py-2 bg-[#1530c7] rounded border-blue-[#1530c7] cursor-pointer border disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center`}
      style={{ border: "1px solid #1530c7" }}
    >
      {isLoading ?
        <HiMiniBellAlert
          className='text-white'
          size={20}
          style={{
            animation: 'spin 1s linear infinite',
            transformOrigin: 'center'
          }}
        /> :
        (isFollowing ? <HiMiniBellAlert className='text-white' size={20} /> : <HiOutlineBell className='text-white' size={20} />)
      }
    </button>
  );
};

export default FollowButton;