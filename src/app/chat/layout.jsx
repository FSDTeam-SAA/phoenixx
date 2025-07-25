'use client';

import { useContext, useState } from 'react';

import { IoIosArrowBack } from 'react-icons/io';
import { ThemeContext } from '../ClientLayout';
import ChatList from './Component/ChatList';

const ChatLayout = ({ children }) => {
  const [isChatActive, setIsChatActive] = useState(false);
  const { isDarkMode } = useContext(ThemeContext);

  return (
    <div className={`container mx-auto gap-3 my-10 flex flex-col lg:flex-row ${isDarkMode ? 'dark-mode' : 'light-mode'}`}>
      <div className={`w-full lg:w-3/12 ${isDarkMode ? 'bg-gray-800 text-white' : 'bg-white'} ${isChatActive ? 'hidden lg:block' : ''}`}>
        <ChatList status={isChatActive} setIsChatActive={setIsChatActive} />
      </div>

      <div className={`${isChatActive ? '' : 'hidden lg:block'} border rounded-lg shadow w-full lg:w-2/3 flex flex-col ${isDarkMode
        ? 'bg-gray-900 border-gray-700 text-white'
        : 'bg-gray-50 border-gray-200'
        }`}>
        <button
          className={`lg:hidden ${isChatActive ? 'block' : ''} ${isDarkMode ? 'text-gray-200' : ''}`}
          onClick={() => setIsChatActive(false)}
        >
          <IoIosArrowBack className="text-2xl m-2" />
        </button>
        {children}
      </div>


    </div>
  );
};

export default ChatLayout;
