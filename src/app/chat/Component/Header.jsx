import { Avatar } from 'antd';
import { useRouter } from 'next/navigation';
import { getImageUrl } from '../../../../utils/getImageUrl';

export const Header = ({ chatUser, isDarkMode }) => {
  const router = useRouter();

  return (
    <>
      {chatUser?.participants?.map(item => (
        <div
          onClick={() => router.push(`/profiles/${item._id}`)}
          key={item._id}
          className={`flex items-center cursor-pointer space-x-4 p-4 border-b ${isDarkMode ? 'border-gray-700' : 'border-gray-200'}`}
        >
          <div className="relative">
            <Avatar
              src={getImageUrl(item?.profile)}
              size={48}
            />
            <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-white"></div>
          </div>
          <div>
            <h2 className={`text-xl font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>{item?.userName}</h2>
            <p className={`text-sm ${isDarkMode ? 'text-green-400' : 'text-green-500'}`}>Online</p>
          </div>
        </div>
      ))}
    </>
  );
};