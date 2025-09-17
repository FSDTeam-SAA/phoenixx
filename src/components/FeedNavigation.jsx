'use client'
import { AppstoreOutlined, DownOutlined } from '@ant-design/icons';
import { Button, Dropdown } from 'antd';
import { useContext, useEffect, useState } from 'react';
import { FiList } from 'react-icons/fi';
import { RiArrowUpDownLine } from "react-icons/ri";
import { ThemeContext } from '../app/ClientLayout';

const FeedNavigation = ({ handlefeedGrid, onSortChange, currentSort, devices }) => {
  const [clickCount, setClickCount] = useState(1);
  const { isDarkMode } = useContext(ThemeContext);

  useEffect(() => {
    const savedGridState = localStorage.getItem('feedGridState');
    if (savedGridState) {
      setClickCount(parseInt(savedGridState));
    }
  }, []);

  const handleFeedsClick = () => {
    const newCount = (clickCount % 2) + 1;
    setClickCount(newCount);
    localStorage.setItem('feedGridState', newCount.toString());
  };

  useEffect(() => {
    handlefeedGrid(clickCount);
  }, [clickCount, handlefeedGrid]);

  const items = [
    {
      key: 'newest',
      label: 'Newest',
      className: currentSort === 'newest' ? 'bg-blue-100 dark:bg-blue-900/50' : ''
    },
    {
      key: 'oldest',
      label: 'Oldest',
      className: currentSort === 'oldest' ? 'bg-blue-100 dark:bg-blue-900/50' : ''
    },
    {
      key: 'popular',
      label: 'Popular',
      className: currentSort === 'popular' ? 'bg-blue-100 dark:bg-blue-900/50' : ''
    },
  ];

  const handleMenuClick = (e) => {
    onSortChange(e.key);
  };

  const menuProps = {
    items,
    onClick: handleMenuClick,
    className: `rounded-lg py-1 border ${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`,
    selectable: true,
    selectedKeys: [currentSort],
  };

  return (
    <div className={`flex ${devices === "mobile" ? "justify-end" : "justify-between"} justify-between items-center py-4 w-full select-none ${isDarkMode ? 'dark' : ''}`}>
      <div
        onClick={handleFeedsClick}
        className={`${devices === "mobile" ? "hidden" : "block"} cursor-pointer flex items-center gap-1 p-1.5 rounded-lg transition-all duration-200
          ${isDarkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100'} active:scale-95`}
      >
        {clickCount === 1 && <FiList className={`mr-1  text-xl`} />}

        {clickCount === 2 && <AppstoreOutlined className={`mr-1 ${isDarkMode ? 'text-blue-400' : 'text-blue-500'} text-xl`} />}
        <span className={`font-semibold ${isDarkMode ? 'text-gray-200' : 'text-gray-800'} text-base`}>
          {clickCount=== 1 ? 'List view' : 'Grid View'}
        </span>
      </div>

      <Dropdown
        menu={menuProps}
        trigger={['click']}
      >
        <Button
          type="default"
          className={`flex items-center rounded-lg px-4 h-10 text-base
            ${isDarkMode ?
              'bg-gray-700 border-gray-600 text-gray-200 hover:border-blue-400 hover:text-blue-400' :
              'bg-white border-gray-300 text-gray-800 hover:border-blue-500 hover:text-blue-500'}
            transition-colors duration-200`}
        >
          <RiArrowUpDownLine className="text-lg mr-1" />
          <span className="font-medium mx-1">
            {items.find(item => item.key === currentSort)?.label}
          </span>
          <DownOutlined className="text-sm ml-1" />
        </Button>
      </Dropdown>
    </div>
  );
};

export default FeedNavigation;