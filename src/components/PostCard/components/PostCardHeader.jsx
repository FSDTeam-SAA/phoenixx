import { Avatar, Dropdown, Grid } from 'antd';
import { useRouter } from 'next/navigation';
import { AiOutlineEllipsis } from 'react-icons/ai';
import { getImageUrl } from '../../../../utils/getImageUrl';

const { useBreakpoint } = Grid;

const PostCardHeader = ({
  postData,
  currentUser,
  isDarkMode,
  isMobile,
  menuItems,
  handleMenuClick,
  isSaving
}) => {
  const screens = useBreakpoint();
  const router = useRouter();

  const renderAuthorAvatar = () => (
    postData.author.avatar ? (
      <Avatar
        src={getImageUrl(postData.author.avatar)}
        size={screens.xs ? 32 : screens.sm ? 36 : 44}
        style={{ cursor: 'pointer', border: isDarkMode ? '1px solid #333' : 'none' }}
      />
    ) : (
      <div className={`${screens.xs ? 'w-8 h-8' : 'w-10 h-10'} rounded-full ${
        isDarkMode ? 'bg-gray-600' : 'bg-gray-300'
      } flex items-center justify-center text-xs ${
        isDarkMode ? 'text-gray-200' : 'text-white'
      }`}>
        {postData.author.name?.charAt(0).toUpperCase() || 'A'}
      </div>
    )
  );

  return (
    <div className="flex justify-between items-center mb-3">
      <div
        onClick={() => router.push(`profiles/${postData?.author?.username}`)}
        className="flex items-center gap-2 cursor-pointer"
      >
        {renderAuthorAvatar()}
        <div className="flex flex-col justify-start items-start">
          <span className={`font-medium cursor-pointer transition-colors ${
            screens.xs ? 'text-xs' : 'text-base'
          } ${
            isDarkMode
              ? 'text-gray-200 hover:text-blue-400'
              : 'text-gray-800 hover:text-blue-600'
          }`}>
            {postData.author.name === "User" ? postData.author.username : postData.author.name}
          </span>
          <span className={`${screens.xs ? 'text-xs' : 'text-sm'} ${
            isDarkMode ? 'text-gray-400' : 'text-gray-500'
          }`}>
            {postData.timePosted}
          </span>
        </div>
      </div>

      <Dropdown
        menu={{
          items: menuItems,
          onClick: handleMenuClick,
          className: isDarkMode ? 'dark-dropdown' : '',
          style: isDarkMode ? {
            backgroundColor: '#1F2937',
            border: '1px solid #374151'
          } : {}
        }}
        placement="bottomRight"
        trigger={['click']}
        overlayClassName={isDarkMode ? 'dark-dropdown-overlay' : ''}
      >
        <button className={`font-bold p-2 rounded transition-colors ${
          isDarkMode
            ? 'hover:bg-gray-700 text-gray-400 hover:text-gray-200'
            : 'hover:bg-gray-100 text-gray-600 hover:text-gray-800'
        } cursor-pointer`}>
          <AiOutlineEllipsis className={`${screens.xs ? 'w-4 h-4' : 'w-5 h-5'}`} />
        </button>
      </Dropdown>
    </div>
  );
};

export default PostCardHeader;