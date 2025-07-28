// FollowButton.jsx
import { useEffect, useState } from 'react';
import { useFollowMutation, useSubscriptionsQuery, useUnFollowMutation } from '../features/Follow/followApi';

const FollowButton = ({ subscriberId, subscribedToId }) => {
  const [isFollowing, setIsFollowing] = useState(false);

  // Use RTK Query hook properly with parameters
  const {
    data: subscriptionsData,
    isLoading: subscriptionsLoading,
    error: subscriptionsError
  } = useSubscriptionsQuery({ subscriberId });


  const [follow, { isLoading: followLoading }] = useFollowMutation();
  const [unfollow, { isLoading: unfollowLoading }] = useUnFollowMutation();

  // Update follow status when subscriptions data changes
  useEffect(() => {
    if (subscriptionsData?.data) {
      // Check if subscribedToId exists in the subscriptions array
      const isSubscribed = subscriptionsData.data.some(
        subscription => subscription.subscribedTo._id === subscribedToId
      );
      setIsFollowing(isSubscribed);
    } else {
      // Set to false when no data or data is undefined
      setIsFollowing(false);
    }
  }, [subscriptionsData, subscribedToId]);

  const followUser = async () => {
    try {
      await follow({ subscriberId, subscribedToId }).unwrap();
      setIsFollowing(true);
    } catch (error) {
      console.error("Error following user:", error);
    }
  };

  const unfollowUser = async () => {
    try {
      await unfollow({ subscriberId, subscribedToId }).unwrap();
      setIsFollowing(false);
    } catch (error) {
      console.error("Error unfollowing user:", error);
    }
  };

  // Handle loading and error states
  if (subscriptionsLoading) {
    return <button disabled>Loading...</button>;
  }

  if (subscriptionsError) {
    return <button disabled>Error loading follow status</button>;
  }

  const isLoading = followLoading || unfollowLoading;

  return (
    <button
      onClick={isFollowing ? unfollowUser : followUser}
      disabled={isLoading}
      className={`px-4 py-2 rounded ${isFollowing
          ? 'bg-gray-500 hover:bg-gray-600 text-white'
          : 'bg-blue-500 hover:bg-blue-600 text-white'
        } disabled:opacity-50 disabled:cursor-not-allowed`}
    >
      {isLoading ? 'Loading...' : (isFollowing ? 'Unfollow' : 'Follow')}
    </button>
  );
};

export default FollowButton;