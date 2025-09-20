"use client";
import AuthorPostCard from "@/components/AuthorPostCard";
import {
  useGetByUserIdQuery,
  useGetProfileByIdQuery,
  useLikePostMutation,
} from "@/features/post/postApi";
import { Grid } from "antd";
import { useParams, useRouter } from "next/navigation";
import { useContext, useState } from "react";
import toast from "react-hot-toast";
import { LuMessageCircle } from "react-icons/lu";
import { isAuthenticated } from "../../../../utils/auth";
import { getImageUrl } from "../../../../utils/getImageUrl";
import FollowButton from "../../../components/FollowButton";
import Loading from "../../../components/Loading/Loading";
import { useCreateChatMutation } from "../../../features/chat/chatList/chatApi";
import { ThemeContext } from "../../ClientLayout";

const ProfileBanner = () => {
  const screens = Grid.useBreakpoint();
  const isMobile = !screens.md;
  const isTablet = screens.md && !screens.lg;
  const isLaptop = screens.lg && !screens.xl;
  const isDesktop = screens.xl;

  const router = useRouter();
  const { id } = useParams();

  const login_user_id =
    typeof window !== "undefined"
      ? localStorage.getItem("login_user_id")
      : null;

  const [createChat] = useCreateChatMutation();
  const [likePost] = useLikePostMutation();
  const {
    data,
    isLoading: getbuyUserLoading,
    refetch,
  } = useGetByUserIdQuery(id);

  const { data: profile, isLoading: profileLoading } =
    useGetProfileByIdQuery(id);
  const isOwnPost = profile?.data?._id === login_user_id;
  const { isDarkMode } = useContext(ThemeContext);
  const [loading, setLoading] = useState(false);

  const handleLike = async (postId) => {
    try {
      await likePost(postId).unwrap();
      refetch();
    } catch (error) {
      toast.error(error?.message || "Failed to like post");
    }
  };

  const handleChat = async (id) => {
    setLoading(true);
    if (!isAuthenticated()) {
      router.push("/auth/login");
      return;
    } else {
      try {
        const response = await createChat({ participant: id }).unwrap();
        console.log(response);
        if (response.success) {
          router.push(
            `/chat/${response.data.participantName}/${response?.data?._id}`
          );
          setLoading(true);
        }
      } catch (error) {
        console.log(error);
      }
    }
  };

  if (profileLoading) {
    return (
      <div
        className={`${
          isDarkMode ? "bg-gray-900" : "bg-gray-200"
        } min-h-screen flex items-center justify-center`}
      >
        <Loading size={isMobile ? "small" : isTablet ? "medium" : "large"} />
      </div>
    );
  }

  return (
    <div
      className={`${
        isDarkMode ? "bg-gray-900" : "bg-gray-200"
      } min-h-screen transition-colors duration-200`}
    >
      {/* Profile Header Section */}
      <div
        className={`${
          isDarkMode ? "bg-gray-800" : "bg-gray-200"
        } pt-16 sm:pt-20 pb-8 sm:pb-1 transition-colors duration-200`}
      >
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div
            className={`${
              isDarkMode
                ? "bg-gray-700 shadow-xl border border-gray-600"
                : "bg-white shadow-lg"
            } rounded-lg mx-auto w-full  transition-all duration-200`}
          >
            <div className="flex flex-col sm:flex-row justify-between items-center px-4 sm:px-6 my-0  relative">
              {/* Profile Image - Positioned differently based on screen size */}
              <div
                className={`${
                  isMobile
                    ? "mx-auto left-[-9%] -translate-x-[-9%] -top-6"
                    : "absolute left-[45%] -translate-x-[45%] -top-24"
                }  relative`}
              >
                <div className=" absolute ">
                  <div
                    className={`${
                      isMobile ? "w-16 h-16" : "w-36 h-36"
                    } rounded-full overflow-hidden border-4 shadow-lg ${
                      isDarkMode
                        ? "bg-gray-600 border-gray-500"
                        : "bg-gray-300 border-white"
                    }`}
                  >
                    <img
                      src={getImageUrl(profile?.data?.profile)}
                      alt={`${profile?.data?.name || "User"}'s profile`}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        e.target.src = "/images/default-profile.png";
                      }}
                    />
                  </div>
                </div>
              </div>

              {/* Follow and Message Buttons - Responsive layout */}

              {isOwnPost ? null : (
                <div
                  className={`${
                    isMobile
                      ? "w-full flex justify-between gap-2"
                      : "ml-auto flex items-center gap-4"
                  }`}
                >
                  <div className={` ${isMobile ? "flex-1 pt-12" : "pt-5 "}`}>
                    <FollowButton
                      subscriberId={localStorage.getItem("login_user_id")}
                      subscribedToId={id}
                      className={isMobile ? "w-full" : ""}
                    />
                  </div>
                  <div className={` ${isMobile ? "flex-1 pt-12" : "pt-5 "}`}>
                    <button
                      loading={loading.toString()}
                      onClick={() => handleChat(id)}
                      className={`
                      ${isMobile ? "w-full px-3 py-2 text-sm" : "px-4 py-2"} 
                      bg-[#1530c7] hover:bg-[#102499] transition-colors cursor-pointer
                      text-white flex items-center justify-center gap-2
                      rounded-md shadow-sm border-none
                    `}
                      aria-label="Send message"
                    >
                      <LuMessageCircle size={isMobile ? 16 : 20} />
                      <span className="font-medium">
                        {isMobile ? "Message" : "Send Message"}
                      </span>
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Profile Info */}
            <div className="text-center pb-1 sm:pb-5 px-4 pt-12 md:pt-24">
              <h1
                className={`${
                  isMobile ? "text-xl" : isTablet ? "text-2xl" : "text-3xl"
                } font-bold ${
                  isDarkMode ? "text-white" : "text-gray-900"
                } mb-2 transition-colors duration-200`}
              >
                {profile?.data?.name || "username"}
              </h1>

              {profile?.data?.userName && (
                <p
                  className={`text-base font-medium mt-1 ${
                    isDarkMode ? "text-gray-300" : "text-gray-600"
                  }`}
                >
                  @{profile.data.userName}
                </p>
              )}

              {profile?.data?.bio && (
                <p
                  className={`${
                    isDarkMode ? "text-gray-300" : "text-gray-700"
                  } ${
                    isMobile ? "text-sm" : "text-base"
                  } mt-3 max-w-2xl mx-auto transition-colors duration-200`}
                >
                  {profile.data.bio}
                </p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Posts Section */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-5">
        {getbuyUserLoading ? (
          <div className="flex justify-center py-10 sm:py-20">
            <div
              className={`${
                isDarkMode ? "bg-gray-800" : "bg-white"
              } rounded-lg p-8 shadow-sm`}
            >
              <Loading
                size={isMobile ? "small" : isTablet ? "medium" : "large"}
              />
            </div>
          </div>
        ) : data?.data?.length > 0 ? (
          <div className="space-y-4 sm:space-y-6">
            {/* Posts Header */}
            <div
              className={`${
                isDarkMode ? "bg-gray-800" : "bg-white"
              } rounded-lg p-4 shadow-sm transition-colors duration-200`}
            >
              <h2
                className={`${isMobile ? "text-lg" : "text-xl"} font-semibold ${
                  isDarkMode ? "text-white" : "text-gray-900"
                }`}
              >
                Recent Posts
              </h2>
              <p
                className={`text-sm ${
                  isDarkMode ? "text-gray-400" : "text-gray-600"
                } mt-1`}
              >
                {data.data.length} post{data.data.length !== 1 ? "s" : ""}{" "}
                available
              </p>
            </div>

            {/* Posts Grid */}
            <div
              className={`grid ${
                isMobile
                  ? "grid-cols-1"
                  : isTablet
                  ? "grid-cols-1"
                  : "grid-cols-1"
              } gap-4 sm:gap-6`}
            >
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
          <div
            className={`text-center py-10 sm:py-20 rounded-lg ${
              isDarkMode ? "bg-gray-800" : "bg-white"
            } shadow-sm transition-colors duration-200`}
          >
            <div className="max-w-md mx-auto">
              <div
                className={`w-16 h-16 mx-auto mb-4 rounded-full ${
                  isDarkMode ? "bg-gray-700" : "bg-gray-100"
                } flex items-center justify-center`}
              >
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
                  className={`${
                    isDarkMode ? "text-gray-500" : "text-gray-400"
                  }`}
                >
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                  <polyline points="14,2 14,8 20,8" />
                  <line x1="16" y1="13" x2="8" y2="13" />
                  <line x1="16" y1="17" x2="8" y2="17" />
                  <polyline points="10,9 9,9 8,9" />
                </svg>
              </div>
              <h3
                className={`${isMobile ? "text-lg" : "text-xl"} font-semibold ${
                  isDarkMode ? "text-white" : "text-gray-900"
                } mb-2`}
              >
                No posts yet
              </h3>
              <p
                className={`${isDarkMode ? "text-gray-400" : "text-gray-600"} ${
                  isMobile ? "text-sm" : "text-base"
                }`}
              >
                {profile?.data?.name || "This user"} hasn't shared any posts
                yet.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProfileBanner;
