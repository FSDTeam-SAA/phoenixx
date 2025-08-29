"use client";
import { useGetProfileQuery } from '@/features/profile/profileApi';
import {
  CloseOutlined,
  CommentOutlined,
  LogoutOutlined,
  MenuOutlined,
  MessageOutlined,
  MoonOutlined,
  PlusOutlined,
  SearchOutlined,
  SettingOutlined,
  SunOutlined,
  UserOutlined
} from '@ant-design/icons';
import {
  Avatar,
  Badge,
  Button,
  Drawer,
  Dropdown,
  Flex,
  Grid,
  Input,
  Layout,
  Menu,
  Space,
  Typography
} from 'antd';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useCallback, useContext, useEffect, useRef, useState } from 'react';
import { IoNotificationsSharp } from "react-icons/io5";
import { useSelector } from 'react-redux';

import { isAuthenticated } from '../../utils/auth';
import { baseURL } from '../../utils/BaseURL';
import { getImageUrl } from '../../utils/getImageUrl';
import { connectSocket } from '../../utils/socket';
import { MessageDark, MessageLight, NotificationDark, NotificationLight } from '../../utils/svgImage';
import { ThemeContext } from '../app/ClientLayout';
import { useGetAllChatQuery, useUnreadIconCountMutation } from '../features/chat/chatList/chatApi';
import { useGetAllNotificationQuery, useMarkAllAsReadMutation } from '../features/notification/noticationApi';
import { useGetPostQuery } from '../features/post/postApi';
import { useLogoQuery } from '../features/report/reportApi';
import SocketComponent from './SocketCompo';

const { Header } = Layout;
const { Text } = Typography;
const { useBreakpoint } = Grid;

export default function Navbar() {
  const screens = useBreakpoint();
  const [drawerVisible, setDrawerVisible] = useState(false);
  const [showMobileSearch, setShowMobileSearch] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isAccountSuspended, setIsAccountSuspended] = useState(false);
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const searchRef = useRef(null);
  const suggestionsRef = useRef(null);
  const router = useRouter();
  const searchParams = useSearchParams();
  const [readCound] = useUnreadIconCountMutation();
  const socketRef = useRef(null);

  const { isDarkMode, toggleTheme } = useContext(ThemeContext);

  const { isLoading: allNotificationLoading, refetch } = useGetAllNotificationQuery({});
  const [readNotification] = useMarkAllAsReadMutation();
  const { data: pronab, isLoading: allChatLoading, refetch: refetchChat } = useGetAllChatQuery("");

  // Get all posts (for suggestion matching)
  const { data: postData } = useGetPostQuery({ searchTerm: '', limit: 100, page: 1 });

  const getCurrentUserId = useCallback(() => {
    try {
      return localStorage.getItem("login_user_id") || '';
    } catch (error) {
      console.error('Error accessing localStorage:', error);
      return '';
    }
  }, []);

  useEffect(() => {
    const loggedInUserId = getCurrentUserId();
    if (!loggedInUserId) return;

    const socket = connectSocket(loggedInUserId);
    socketRef.current = socket;

    socket.on('connect', () => {
      // console.log('Socket connected');
    });

    socket.on('disconnect', () => {
      // console.log('Socket disconnected');
    });

    socket.on(`unreadCountUpdate::${loggedInUserId}`, (data) => {
      refetchChat();
    });

    socket.on(`chatListUpdate::${loggedInUserId}`, (data) => {
      refetchChat();
    });

    return () => {
      if (socketRef.current) {
        socketRef.current.off(`unreadCountUpdate::${loggedInUserId}`);
        socketRef.current.off(`chatListUpdate::${loggedInUserId}`);
        socketRef.current.off('connect');
        socketRef.current.off('disconnect');
      }
    };
  }, [refetch, router]);

  // Click outside to close suggestions
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        showSuggestions &&
        suggestionsRef.current &&
        !suggestionsRef.current.contains(event.target) &&
        searchRef.current &&
        !searchRef.current.input.contains(event.target)
      ) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showSuggestions]);

  const clearLogin = () => {
    localStorage.removeItem('loginToken');
    localStorage.removeItem('login_user_id');
    localStorage.removeItem('rememberedCredentials');
    localStorage.setItem('theme', 'light');
    localStorage.removeItem('isLoggedIn');
  }

  const { notifications } = useSelector((state) => state);
  const { data: profileData, isLoading: profileLoading } = useGetProfileQuery();
  const { data: logo, isLoading: logoLoading } = useLogoQuery();

  const filteredLogo = logo?.data?.find(item =>
    (isDarkMode && item.status === 'dark') || (!isDarkMode && item.status === 'light')
  );

  useEffect(() => {
    const query = searchParams.get('search');
    if (query) {
      const cleanQuery = query.replace(/^"|"$/g, '');
      setSearchQuery(cleanQuery);
    } else {
      setSearchQuery('');
    }
  }, [searchParams]);

  // -----------------------------
  // 🔍 Strict Word-Start Matching Helper
  // -----------------------------
  const startsWithWord = (text, query) => {
    if (!query) return false;
    const regex = new RegExp(`\\b${query}`, 'i'); // Matches word boundary + query
    return regex.test(text);
  };

  const getMatchingWord = (text, query) => {
    if (!query) return null;
    const regex = new RegExp(`(\\b${query}\\w*)`, 'i');
    const match = text?.match(regex);
    return match ? match[1] : null;
  };

  // -----------------------------
  // 🔍 Auto-Suggestions Logic (Strict Word Matching)
  // -----------------------------
  useEffect(() => {
    if (searchQuery.length < 2) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    const posts = postData?.data?.data || [];
    const authorMap = new Map();
    const matchedPosts = [];
    const matchedAuthors = [];

    posts.forEach(post => {
      // Match post title (strict word start)
      if (startsWithWord(post.title, searchQuery)) {
        matchedPosts.push({
          type: 'post',
          id: post._id,
          title: post.title,
          image: post.images?.[0] || null,
        });
      }

      // Match author name (strict word start) - check both userName and name
      if (startsWithWord(post.author.userName, searchQuery) ||
        startsWithWord(post.author.name, searchQuery)) {
        const authorKey = post.author._id;
        if (!authorMap.has(authorKey)) {
          authorMap.set(authorKey, true);
          matchedAuthors.push({
            type: 'user',
            id: post.author._id,
            name: post.author.name,
            userName: post.author.userName,
            profile: post.author.profile,
          });
        }
      }
    });

    // Combine results: Posts first, then users
    const combined = [...matchedPosts, ...matchedAuthors];
    const limited = combined.slice(0, 5);

    setSuggestions(limited);
    setShowSuggestions(true);
  }, [searchQuery, postData]);

  const handleNavigation = async (path) => {
    if (isAccountSuspended) return;
    if (!isAuthenticated()) {
      router.push('/auth/login');
      return;
    } else {
      router.push(path);
      await readNotification().unwrap();
      setDrawerVisible(false);
    }
  };

  const handleChatNavigation = async (path) => {
    if (isAccountSuspended) return;
    if (!isAuthenticated()) {
      router.push('/auth/login')
      return;
    } else {
      try {
        const response = await readCound().unwrap();
        router.push(path);
        localStorage.removeItem("messageCount")
        setDrawerVisible(false);
      } catch (error) {
        console.log(error)
      }
    }
  }

  const handleNotificationNavigate = async (path) => {
    if (isAccountSuspended) return;
    if (!isAuthenticated()) {
      router.push('/auth/login');
      return;
    } else {
      router.push(path);
      await readNotification().unwrap();
      setDrawerVisible(false);
    }
  }

  const items = [
    {
      key: 'profile-header',
      label: (
        <Flex gap="small" align="center" className={`p-2 cursor-pointer ${isDarkMode ? 'text-black' : ''}`}>
          <Avatar src={getImageUrl(profileData?.data?.profile)} size={44} />
          <Space direction="vertical" size={0}>
            <Text strong>{profileData?.data?.name}</Text>
            <Text>@{profileData?.data?.userName}</Text>
          </Space>
        </Flex>
      ),
      onClick: () => handleNavigation("/profile"),
    },
    { type: 'divider' },
    {
      key: 'about',
      icon: <UserOutlined />,
      label: 'About us',
      onClick: () => handleNavigation('/about'),
      className: isDarkMode ? 'hover:bg-gray-800' : 'hover:bg-gray-50'
    },
    {
      key: 'feedback',
      icon: <CommentOutlined />,
      label: 'Feedback',
      onClick: () => handleNavigation('/feedback'),
      className: isDarkMode ? 'hover:bg-gray-800' : 'hover:bg-gray-50'
    },
    {
      key: 'settings',
      icon: <SettingOutlined />,
      label: 'Settings',
      onClick: () => handleNavigation('/settings'),
      className: isDarkMode ? 'hover:bg-gray-800' : 'hover:bg-gray-50'
    },
    {
      key: 'darkmode',
      icon: isDarkMode ? <SunOutlined /> : <MoonOutlined />,
      label: isDarkMode ? "Switch to light mode" : "Switch to dark mode",
      className: isDarkMode ? 'hover:bg-gray-800' : 'hover:bg-gray-50',
      onClick: toggleTheme,
    },
    { type: 'divider' },
    {
      key: 'signout',
      icon: <LogoutOutlined />,
      label: 'Sign Out',
      danger: true,
      onClick: () => {
        router.push('/auth/login');
        clearLogin();
      },
      style: { color: '#ff4d4f' },
      className: 'hover:!bg-gray-100 hover:!text-red-600',
    }
  ];

  // -----------------------------
  // 🔎 Search Handlers
  // -----------------------------
  const handleSearch = (value) => {
    if (isAccountSuspended) return;
    const trimmed = value.trim();
    if (trimmed) {
      router.push(`/?search=${encodeURIComponent(trimmed)}`);
    } else {
      router.push('/');
    }
    setShowSuggestions(false);
  };

  const handleInputChange = (e) => {
    if (isAccountSuspended) return;
    const value = e.target.value;
    setSearchQuery(value);
    if (!value) {
      router.push('/');
    }
  };

  const handleKeyDown = (e) => {
    if (isAccountSuspended) return;
    if (e.key === 'Enter') {
      handleSearch(searchQuery);
    }
  };

  const handleClear = () => {
    if (isAccountSuspended) return;
    setSearchQuery('');
    router.push('/');
    setShowSuggestions(false);
  };

  const showDrawer = () => {
    if (isAccountSuspended) return;
    setDrawerVisible(true);
  };

  const onClose = () => {
    setDrawerVisible(false);
  };

  const toggleMobileSearch = () => {
    if (isAccountSuspended) return;
    setShowMobileSearch(!showMobileSearch);
    if (!showMobileSearch) {
      setSearchQuery('');
      router.push('/');
      setShowSuggestions(false);
    }
  };

  // -----------------------------
  // 🎯 Suggestion Item Click
  // -----------------------------
  const handleSuggestionClick = (type, id) => {
    setShowSuggestions(false);

    if (type === 'user') {
      if (!isAuthenticated()) {
        router.push('/auth/login');
        return;
      } else {
        router.push(`/profiles/${id}`);
      }
    } else if (type === 'post') {
      if (!isAuthenticated()) {
        router.push('/auth/login');
        return;
      } else {
        router.push(`/posts/${id}`);
      }
    }
  };

  // -----------------------------
  // 🔍 Highlight Matching Word Only
  // -----------------------------
  const highlightMatch = (text, query) => {
    if (!text) return <span>Unknown</span>;
    if (!query || query.length < 2) return <span>{text}</span>;

    const matchWord = getMatchingWord(text, query);
    if (!matchWord) return <span>{text}</span>;

    const regex = new RegExp(`(${matchWord})`, 'gi');
    const parts = text.split(regex);

    return (
      <span>
        {parts.filter(Boolean).map((part, i) =>
          regex.test(part) ? (
            <span key={i} className="font-semibold" style={{ color: '#2563eb' }}>{part}</span>
          ) : (
            <span key={i}>{part}</span>
          )
        )}
      </span>
    );
  };

  // -----------------------------
  // 🖼️ Get Avatar Content (Image or Initial)
  // -----------------------------
  const getAvatarContent = (item) => {
    if (item.type === 'user') {
      if (item.profile) {
        return <Avatar src={getImageUrl(item.profile)} size={36} />;
      } else {
        // Show first character of the name
        const displayName = item.name || item.userName || '';
        const initial = displayName.charAt(0).toUpperCase() || 'U';
        return (
          <Avatar
            size={36}
            style={{
              backgroundColor: isDarkMode ? '#424242' : '#d9d9d9',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            {initial}
          </Avatar>
        );
      }
    } else {
      if (item.image) {
        return <Avatar src={getImageUrl(item.image)} size={36} style={{ objectFit: 'cover' }} />;
      } else {
        // Show first character of the first word of the title
        const firstWord = item.title ? item.title.split(' ')[0] : '';
        const initial = firstWord.charAt(0)?.toUpperCase() || 'P';
        return (
          <Avatar
            size={36}
            style={{
              backgroundColor: isDarkMode ? '#424242' : '#d9d9d9',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            {initial}
          </Avatar>
        );
      }
    }
  };

  // -----------------------------
  // 📝 Render Suggestions (Same Width as Search Bar)
  // -----------------------------
  const renderSuggestions = () => {
    if (!showSuggestions) return null;

    return (
      <div
        ref={suggestionsRef}
        role="listbox"
        aria-label="Search suggestions"
        style={{
          position: 'absolute',
          top: '100%',
          left: 0,
          width: '100%',
          backgroundColor: isDarkMode ? '#1f1f1f' : '#fff',
          borderRadius: '5px',
          boxShadow: isDarkMode ? '0 4px 12px rgba(0,0,0,0.3)' : '0 4px 12px rgba(0,0,0,0.1)',
          zIndex: 1000,
          maxHeight: '300px',
          overflowY: 'auto',
        }}
      >
        {suggestions.length === 0 ? (
          <div
            style={{
              padding: '12px 16px',
              textAlign: 'center',
              color: '#888',
              fontStyle: 'italic',
            }}
          >
            No results found
          </div>
        ) : (
          suggestions.map((item, index) => (
            <div
              key={`${item.type}-${item.id}`} // More specific key
              role="option"
              tabIndex={0}
              onClick={() => handleSuggestionClick(item.type, item.id)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  handleSuggestionClick(item.type, item.id);
                }
              }}
              className="suggestion-item" // Use CSS class for hover states
              style={{
                padding: '8px 16px', // Increased for better touch targets
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                cursor: 'pointer',
                borderRadius: '3px',
                margin: '2px',
              }}
            >
              {getAvatarContent(item)}
              <div style={{ display: 'flex', justifyContent: 'space-between', flex: 1 }}>
                <div
                  style={{
                    fontWeight: 500,
                    color: isDarkMode ? '#fff' : '#000',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                    maxWidth: '70%'
                  }}
                >
                  {item.type === 'user'
                    ? highlightMatch(item.name || item.userName || 'Unknown', searchQuery)
                    : highlightMatch(item.title || 'Untitled', searchQuery)
                  }
                </div>
                <div style={{
                  fontSize: '12px',
                  color: '#888',
                  flexShrink: 0,
                  marginLeft: '8px'
                }}>
                  {item.type === 'user' ? item.userName || 'User' : 'Post'}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    );
  };

  // -----------------------------
  // 🖋️ Search Input Styles
  // -----------------------------
  const iconButtonStyles = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    border: `1px solid ${isDarkMode ? '#424242' : '#e5e7eb'}`,
    padding: '8px',
    width: '40px',
    height: '40px',
    borderRadius: '50%',
    backgroundColor: isDarkMode ? '#1f1f1f' : '#f9fafb'
  };

  const renderDesktopSearch = () => (
    <div
      style={{
        width: screens.lg ? '35%' : '30%',
        minWidth: '200px',
        marginLeft: screens.lg ? '160px' : screens.md ? '80px' : '20px',
        flex: '1 1 auto',
        maxWidth: '600px',
        position: 'relative' // ✅ Required for absolute positioning of suggestions
      }}
    >
      <Flex
        align="center"
        style={{
          width: '100%',
          height: '50px',
          backgroundColor: isDarkMode ? '#1f1f1f' : '#ffffff',
          borderRadius: '12px',
          border: `1px solid ${isDarkMode ? '#424242' : '#D8D8D8'}`,
          boxShadow: isDarkMode ? '0 2px 6px rgba(0,0,0,0.4)' : '0 2px 6px rgba(0,0,0,0.05)',
          overflow: 'hidden',
          transition: 'all 0.2s ease-in-out',
        }}
      >
        <Input
          ref={searchRef}
          value={searchQuery}
          placeholder="Search topics..."
          prefix={<SearchOutlined style={{ color: isDarkMode ? '#bbbbbb' : '#888888' }} />}
          style={{
            height: '100%',
            flex: 1,
            padding: '0 16px',
            border: 'none',
            outline: 'none',
            backgroundColor: 'transparent',
            color: isDarkMode ? 'rgba(255, 255, 255, 0.9)' : 'rgba(0, 0, 0, 0.85)',
            fontSize: '14px'
          }}
          onChange={handleInputChange}
          onPressEnter={handleKeyDown}
          allowClear={{
            clearIcon: <CloseOutlined onClick={handleClear} style={{ color: isDarkMode ? '#888' : '#aaa' }} />
          }}
        />
        <Button
          type="primary"
          icon={<SearchOutlined />}
          onClick={() => handleSearch(searchQuery)}
          style={{
            height: '100%',
            width: '50px',
            borderRadius: '0 12px 12px 0',
            border: 'none',
            backgroundColor: isDarkMode ? '#0001FB' : '#0001FB',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        />
      </Flex>

      {/* Suggestions dropdown now matches input width */}
      {renderSuggestions()}
    </div>
  );

  const renderMobileSearch = () => (
    <div style={{
      flex: 1,
      display: 'flex',
      alignItems: 'center',
      height: '100%',
      padding: '0 8px',
      position: 'relative'
    }}>
      <Input
        ref={searchRef}
        value={searchQuery}
        placeholder="Search topics"
        prefix={<SearchOutlined style={{ color: isDarkMode ? '#bbbbbb' : '#888888' }} />}
        style={{
          width: '100%',
          height: '40px',
          background: isDarkMode ? '#1f1f1f' : '#f3f2fa',
          borderRadius: '10px',
          border: `1px solid ${isDarkMode ? '#424242' : '#ddd'}`,
          color: isDarkMode ? 'rgba(255, 255, 255, 0.85)' : 'inherit',
          padding: '0 12px',
        }}
        autoFocus
        onChange={handleInputChange}
        onPressEnter={handleKeyDown}
        allowClear={{
          clearIcon: <CloseOutlined onClick={handleClear} style={{ color: isDarkMode ? '#888' : '#aaa' }} />
        }}
        suffix={
          <Button
            type="text"
            icon={<CloseOutlined />}
            onClick={toggleMobileSearch}
            style={{
              border: 'none',
              background: 'transparent',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          />
        }
      />
      {renderSuggestions()}
    </div>
  );

  return (
    <>
      <SocketComponent />
      <div style={{ position: 'relative' }}>
        {isAccountSuspended && (
          <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            backdropFilter: 'blur(5px)',
            zIndex: 9999,
            pointerEvents: 'auto'
          }} />
        )}
        <Header
          className={`theme-transition ${isDarkMode ? 'dark-mode' : 'light-mode'}`}
          style={{
            background: isDarkMode ? '#101828' : '#fff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: screens.xs ? '0 8px' : screens.sm ? '0 12px' : '0 16px',
            height: screens.xs ? '60px' : '75px',
            boxShadow: isDarkMode ? '0 1px 2px 0 rgba(0, 0, 0, 0.15)' : '0 1px 2px 0 rgba(0, 0, 0, 0.03)',
            position: 'sticky',
            top: 0,
            zIndex: 100,
            color: isDarkMode ? 'var(--text-color)' : 'inherit',
            borderBottom: `1px solid ${isDarkMode ? '#333' : 'transparent'}`,
            overflow: 'visible',
            filter: isAccountSuspended ? 'blur(2px)' : 'none',
            pointerEvents: isAccountSuspended ? 'none' : 'auto'
          }}
        >
          {/* Left Side - Logo and Menu */}
          {!showMobileSearch && (
            <Flex align="center" style={{ height: '100%', minWidth: 'fit-content', flex: '0 0 auto' }}>
              {!screens.md && (
                <Button
                  type="text"
                  icon={<MenuOutlined />}
                  onClick={showDrawer}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    height: '100%',
                    padding: '0 8px',
                    color: isDarkMode ? 'var(--text-color)' : 'inherit',
                    minWidth: '40px'
                  }}
                />
              )}
              <Link
                href="/"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  height: '100%',
                  lineHeight: 0,
                  minWidth: 'fit-content',
                  paddingLeft: screens.xs ? '4px' : '8px',
                  paddingRight: screens.xs ? '8px' : '12px'
                }}
              >
                {!logoLoading && filteredLogo && (
                  <Image
                    src={filteredLogo?.logo && `${baseURL}${filteredLogo.logo}`}
                    width={screens.xs ? 80 : screens.sm ? 100 : 130}
                    height={screens.xs ? 35 : screens.sm ? 45 : 55}
                    alt='logo'
                    style={{
                      objectFit: 'contain',
                      width: 'auto',
                      height: 'auto',
                      maxHeight: screens.xs ? '40px' : '65px',
                      minWidth: screens.xs ? '80px' : screens.sm ? '100px' : '130px',
                      filter: isDarkMode ? 'brightness(0.9) contrast(1.1)' : 'none'
                    }}
                    priority
                  />
                )}
              </Link>
            </Flex>
          )}

          {/* Middle - Search */}
          {screens.md ? renderDesktopSearch() : (showMobileSearch && renderMobileSearch())}

          {/* Right Side */}
          {!showMobileSearch && (
            <Flex align="center" gap={screens.xs ? '8px' : 'middle'} style={{ height: '100%', flex: '0 0 auto' }}>
              {screens.md ? (
                <>
                  <Button
                    onClick={() => handleNavigation('/new')}
                    type="primary"
                    icon={<PlusOutlined />}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      height: '40px',
                      minWidth: screens.lg ? '100px' : '40px',
                      fontSize: screens.lg ? '14px' : '12px'
                    }}
                  >
                    {screens.lg ? 'New Post' : ''}
                  </Button>

                  <Badge style={{ backgroundColor: "#2930FF", marginTop: "5px", marginRight: "5px" }} count={pronab?.data?.totalIconUnreadMessages || 0}>
                    <Button
                      onClick={() => handleChatNavigation("/chat")}
                      type="text"
                      icon={isDarkMode ? <MessageDark /> : <MessageLight />}
                      style={{
                        ...iconButtonStyles,
                        width: screens.lg ? '40px' : '36px',
                        height: screens.lg ? '40px' : '36px'
                      }}
                    />
                  </Badge>

                  <Badge style={{ backgroundColor: "#2930FF", marginTop: "5px", marginRight: "5px" }} count={notifications?.unreadCount || 0}>
                    <Button
                      onClick={() => handleNotificationNavigate("/notification")}
                      type="text"
                      icon={isDarkMode ? <NotificationDark /> : <NotificationLight />}
                      style={{
                        ...iconButtonStyles,
                        width: screens.lg ? '40px' : '36px',
                        height: screens.lg ? '40px' : '36px'
                      }}
                    />
                  </Badge>
                </>
              ) : (
                <Button
                  type="text"
                  icon={<SearchOutlined />}
                  onClick={toggleMobileSearch}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    height: '100%',
                    padding: '0 12px',
                    color: isDarkMode ? 'var(--text-color)' : 'inherit'
                  }}
                />
              )}

              {localStorage.getItem('isLoggedIn') === 'true' ? (
                <Dropdown menu={{ items }} trigger={['click']} placement="bottomRight" arrow={{ pointAtCenter: true }}>
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    height: '100%',
                    padding: screens.xs ? '0 4px' : '0 8px'
                  }}>
                    <Avatar
                      src={getImageUrl(profileData?.data?.profile)}
                      size={screens.xs ? 32 : screens.sm ? 36 : 44}
                      style={{ cursor: 'pointer', border: isDarkMode ? '1px solid #333' : 'none' }}
                    />
                  </div>
                </Dropdown>
              ) : (
                <Button
                  type="primary"
                  style={{
                    height: screens.xs ? "32px" : "38px",
                    width: screens.xs ? "70px" : screens.sm ? "90px" : "100px",
                    fontSize: screens.xs ? "12px" : "14px"
                  }}
                  onClick={() => router.push('/auth/login')}
                >
                  Sign In
                </Button>
              )}
            </Flex>
          )}
        </Header>

        <Drawer
          title="Menu"
          placement="left"
          closable={true}
          onClose={onClose}
          open={drawerVisible}
          width={screens.xs ? 250 : 300}
          className={`theme-transition ${isDarkMode ? 'dark-mode' : 'light-mode'}`}
          styles={{ body: { padding: 0 } }}
        >
          <Menu
            mode="inline"
            theme={isDarkMode ? "dark" : "light"}
            items={[
              { key: 'new-post', icon: <PlusOutlined />, label: 'New Post', onClick: () => handleNavigation("/new") },
              { key: 'messages', icon: <MessageOutlined />, label: 'Messages', onClick: () => handleChatNavigation('/chat') },
              { key: 'notifications', icon: <IoNotificationsSharp />, label: 'Notifications', onClick: () => handleNotificationNavigate('/notification') },
              { type: 'divider' },
              ...items.filter(item => item.key !== 'profile-header').map(item => ({ ...item, onClick: item.onClick || (() => { }) }))
            ]}
          />
        </Drawer>
      </div>
    </>
  );
}