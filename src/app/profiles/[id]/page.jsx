"use client";
import AuthorPostCard from '@/components/AuthorPostCard';
import { useGetByUserIdQuery, useGetProfileByIdQuery, useLikePostMutation } from '@/features/post/postApi';
import { Grid } from 'antd';
import { useParams, useRouter } from 'next/navigation';
import { useContext, useState } from 'react';
import toast from 'react-hot-toast';
import { LuMessageCircle } from "react-icons/lu";
import { isAuthenticated } from '../../../../utils/auth';
import { getImageUrl } from '../../../../utils/getImageUrl';
import FollowButton from '../../../components/FollowButton';
import Loading from '../../../components/Loading/Loading';
import { useCreateChatMutation } from '../../../features/chat/chatList/chatApi';
import { ThemeContext } from '../../ClientLayout';

const ProfileBanner = () => {
  const screens = Grid.useBreakpoint();
  const isMobile = !screens.md;
  const isTablet = screens.md && !screens.lg;
  const router = useRouter();
  const { id } = useParams();
  const [createChat] = useCreateChatMutation();
  const [likePost] = useLikePostMutation();
  const { data, isLoading: getbuyUserLoading, refetch } = useGetByUserIdQuery(id);
  const { data: profile, isLoading: profileLoading } = useGetProfileByIdQuery(id);
  const { isDarkMode } = useContext(ThemeContext);
  const [loading, setLoading] = useState(false);

  const handleLike = async (postId) => {
    try {
      await likePost(postId).unwrap();
      refetch()
    } catch (error) {
      toast.error(error?.message || 'Failed to like post');
    }
  };

  const handleChat = async (id) => {
    setLoading(true)
    if (!isAuthenticated()) {
      router.push('/auth/login');
      return;
    } else {
      try {
        const response = await createChat({ participant: id }).unwrap();
        if (response.success) {
          router.push(`/chat/${response?.data?._id}`)
          setLoading(true)
        }
      } catch (error) {
        console.log(error)
      }
    }
  }

  // Show loading state while profile is loading
  if (profileLoading) {
    return (
      <div className={`${isDarkMode ? 'bg-gray-900' : 'bg-[#F2F4F7]'} min-h-screen flex items-center justify-center`}>
        <Loading size={isMobile ? 'medium' : 'large'} />
      </div>
    );
  }

  return (
    <div className={`${isDarkMode ? 'bg-gray-900' : 'bg-[#F2F4F7]'} min-h-screen transition-colors duration-200`}>
      {/* Profile Header Section */}
      <div className={`${isDarkMode ? 'bg-gray-800' : 'bg-[#EBEBFF]'} pt-16 sm:pt-20 pb-8 sm:pb-10 transition-colors duration-200`}>
        <div className="container mx-auto px-4 sm:px-6">
          <div className={`${isDarkMode ? 'bg-gray-700 shadow-xl border border-gray-600' : 'bg-white shadow-lg'} rounded-lg mx-auto w-full container transition-all duration-200`}>
            <div className="flex justify-between items-center px-4 sm:px-6 py-4 relative">
              {/* Profile Image */}
              <div className="absolute left-1/2 -translate-x-1/2 -top-12 sm:-top-16">
                <div className="relative">
                  <div className={`w-20 h-20 sm:w-24 sm:h-24 rounded-full overflow-hidden border-4 shadow-lg ${isDarkMode ? 'bg-gray-600 border-gray-500' : 'bg-gray-300 border-white'}`}>
                    <img
                      src={getImageUrl(profile?.data?.profile)}
                      alt={`${profile?.data?.name || 'User'}'s profile`}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        e.target.src = '/images/default-profile.png';
                      }}
                    />
                  </div>
                  {/* Online status indicator - optional */}

                </div>
              </div>

              {/* Message Button - Right Aligned */}
              <div className="flex-1"></div>
              {/* <Button
                loading={loading.toString()}
                onClick={() => handleChat(id)}
                className={`
                  ${isMobile ? 'px-3 py-1.5 text-sm' : 'px-4 py-2 text-base'} 
                  rounded-lg bg-[#1C37E0] hover:bg-[#1530C7] transition-all duration-200 cursor-pointer
                  text-white font-medium shadow-md hover:shadow-lg transform hover:-translate-y-0.5
                  flex items-center justify-center gap-2 border-none
                  focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 
                  ${isDarkMode ? 'focus:ring-offset-gray-700' : 'focus:ring-offset-white'}
                `}
                style={{ padding: "20px" }}
                aria-label="Send message"
                disabled={!profile?.data}
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width={isMobile ? 16 : 18}
                  height={isMobile ? 16 : 18}
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="m3 21 1.9-5.7a8.5 8.5 0 1 1 3.8 3.8z" />
                </svg>
                <span>Send Message</span>
              </Button> */}

              <div className='pr-3'>
                <FollowButton subscriberId={localStorage.getItem("login_user_id")} subscribedToId={id} />
              </div>

              <div className={`flex ${isMobile ? 'justify-center mt-4' : 'justify-end'}`}>
                <button
                  loading={loading.toString()}
                  onClick={() => handleChat(id)}
                  className={`
                  ${isMobile ? 'px-3 py-1.5 text-sm' : 'px-4 py-2'} 
                  bg-[#1530c7] transition-colors cursor-pointer
                  text-white flex items-center justify-center gap-2
                  rounded-md shadow-sm border-none
                `}
                  aria-label="Edit profile"
                >
                  <LuMessageCircle size={20} />
                  <span className="font-medium">Send Message</span>
                </button>
              </div>


            </div>

            {/* Profile Info */}
            <div className="text-center pb-6 sm:pb-10 px-4">
              <h1 className={`text-xl sm:text-2xl lg:text-3xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'} mb-2 transition-colors duration-200`}>
                {profile?.data?.name || 'Anonymous User'}
              </h1>
              <p className={`${isDarkMode ? 'text-gray-400' : 'text-gray-600'} text-sm sm:text-base lg:text-lg transition-colors duration-200`}>
                @{profile?.data?.userName || 'username'}
              </p>

              {/* Optional: Additional profile info */}
              {profile?.data?.bio && (
                <p className={`${isDarkMode ? 'text-gray-300' : 'text-gray-700'} text-sm sm:text-base mt-3 max-w-2xl mx-auto transition-colors duration-200`}>
                  {profile.data.bio}
                </p>
              )}

              {/* Optional: Stats */}
              {/* <div className="flex justify-center gap-6 mt-4">
                <div className="text-center">
                  <div className={`text-lg sm:text-xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                    {data?.data?.length || 0}
                  </div>
                  <div className={`text-xs sm:text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                    Posts
                  </div>
                </div>
              </div> */}
            </div>
          </div>
        </div>
      </div>

      {/* Posts Section */}
      <div className='max-w-5xl mx-auto px-4 sm:px-6 py-5'>
        {getbuyUserLoading ? (
          <div className='flex justify-center py-10 sm:py-20'>
            <div className={`${isDarkMode ? 'bg-gray-800' : 'bg-white'} rounded-lg p-8 shadow-sm`}>
              <Loading size={isMobile ? 'medium' : 'large'} />
            </div>
          </div>
        ) : data?.data?.length > 0 ? (
          <div className="space-y-4 sm:space-y-6">
            {/* Posts Header */}
            <div className={`${isDarkMode ? 'bg-gray-800' : 'bg-white'} rounded-lg p-4 shadow-sm transition-colors duration-200`}>
              <h2 className={`text-lg sm:text-xl font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                Recent Posts
              </h2>
              <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'} mt-1`}>
                {data.data.length} post{data.data.length !== 1 ? 's' : ''} available
              </p>
            </div>

            {/* Posts Grid */}
            <div className="grid gap-4 sm:gap-6">
              {[...(data?.data || [])].reverse().map((post, index) => (
                <div
                  key={post._id || index}
                  className="transform transition-all duration-200"
                >
                  <AuthorPostCard
                    postData={post}
                    onLike={handleLike}
                    isDarkMode={isDarkMode}
                    isMobile={isMobile}
                  />
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className={`text-center py-10 sm:py-20 rounded-lg ${isDarkMode ? 'bg-gray-800' : 'bg-white'} shadow-sm transition-colors duration-200`}>
            <div className="max-w-md mx-auto">
              <div className={`w-16 h-16 mx-auto mb-4 rounded-full ${isDarkMode ? 'bg-gray-700' : 'bg-gray-100'} flex items-center justify-center`}>
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className={`${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`}
                >
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                  <polyline points="14,2 14,8 20,8" />
                  <line x1="16" y1="13" x2="8" y2="13" />
                  <line x1="16" y1="17" x2="8" y2="17" />
                  <polyline points="10,9 9,9 8,9" />
                </svg>
              </div>
              <h3 className={`text-lg sm:text-xl font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'} mb-2`}>
                No posts yet
              </h3>
              <p className={`${isDarkMode ? 'text-gray-400' : 'text-gray-600'} text-sm sm:text-base`}>
                {profile?.data?.name || 'This user'} hasn't shared any posts yet.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProfileBanner;