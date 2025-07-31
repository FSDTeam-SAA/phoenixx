import { Dropdown } from 'antd';
import { useRouter } from 'next/navigation';
import { AiOutlineEllipsis } from 'react-icons/ai';
import { getImageUrl } from '../../../../utils/getImageUrl';


const PostCardHeader = ({
  postData,
  currentUser,
  isDarkMode,
  isMobile,
  menuItems,
  handleMenuClick,
  isSaving
}) => {


  const router = useRouter();

  const renderAuthorAvatar = () => (
    postData.author.avatar ? (
      <img
        src={getImageUrl(postData.author.avatar)}
        alt="Author avatar"
        className={`${isMobile ? 'w-6 h-6' : 'w-8 h-8'} rounded-full cursor-pointer`}
      />
    ) : (
      <div className={`${isMobile ? 'w-6 h-6' : 'w-8 h-8'} rounded-full ${isDarkMode ? 'bg-gray-600' : 'bg-gray-300'
        } flex items-center justify-center text-xs ${isDarkMode ? 'text-gray-200' : 'text-white'
        }`}>
        {postData.author.name?.charAt(0).toUpperCase() || 'A'}
      </div>
    )
  );

  return (
    <div className="flex justify-between items-center mb-3">
      <div
        onClick={() => router.push(`profiles/${postData?.author?.id}`)}
        className="flex items-center gap-2 cursor-pointer"
      >
        {renderAuthorAvatar()}
        <div className="flex flex-col justify-start items-start">
          <span className={`font-medium cursor-pointer transition-colors ${isMobile ? 'text-xs' : 'text-base'
            } ${isDarkMode
              ? 'text-gray-200 hover:text-blue-400'
              : 'text-gray-800 hover:text-blue-600'
            }`}>
            {postData.author.name === "User" ? postData.author.username : postData.author.name}
          </span>
          <span className={`${isMobile ? 'text-xs' : 'text-sm'} ${isDarkMode ? 'text-gray-400' : 'text-gray-500'
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
        <button className={`font-bold p-2 rounded transition-colors ${isDarkMode
          ? 'hover:bg-gray-700 text-gray-400 hover:text-gray-200'
          : 'hover:bg-gray-100 text-gray-600 hover:text-gray-800'
          } cursor-pointer`}>
          <AiOutlineEllipsis className={`${isMobile ? 'w-4 h-4' : 'w-5 h-5'}`} />
        </button>
      </Dropdown>
    </div>
  );
};

export default PostCardHeader;