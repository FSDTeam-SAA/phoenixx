// components/AccountTabs.jsx
"use client";
import ChangePasswordForm from '@/components/ChangePasswordForm';
import CloseAccountSection from '@/components/CloseAccountSection';
import CustomBanner from '@/components/CustomBanner';
import { Tabs } from 'antd';
import { useContext, useState } from 'react';
import { ThemeContext } from '../ClientLayout';

const AccountTabs = () => {
  const [activeKey, setActiveKey] = useState('1');
  const { isDarkMode } = useContext(ThemeContext);
  const primaryColor = isDarkMode ? '#6464FF' : '#4E4EFB'; // ✅ Dynamic color

  const onChange = (key) => {
    setActiveKey(key);
  };

  const items = [
    {
      key: '1',
      label: 'Change Password',
      children: <ChangePasswordForm />,
    },
    {
      key: '2',
      label: 'Account',
      children: <CloseAccountSection />,
    },
  ];

  return (
    <div className={isDarkMode ? 'dark' : ''}>
      <CustomBanner routeName={"Settings"} />
      <div className="max-w-xl mx-auto mt-8 sm:p-0 p-3">
        <Tabs
          activeKey={activeKey}
          items={items}
          onChange={onChange}
          tabBarStyle={{
            marginBottom: 24,
          }}
          className="custom-account-tabs"
        />
      </div>

      <style jsx global>{`
        .custom-account-tabs .ant-tabs-nav {
          margin-bottom: 24px;
        }

        .custom-account-tabs .ant-tabs-tab {
          padding: 12px 16px;
          margin: 0;
          font-weight: 500;
          color: ${isDarkMode ? 'rgba(255, 255, 255, 0.65)' : 'rgba(0, 0, 0, 0.85)'};
          transition: all 0.3s ease;
          border-radius: 6px 6px 0 0;
        }

        .custom-account-tabs .ant-tabs-tab:hover {
          color: ${primaryColor};
        }

        .custom-account-tabs .ant-tabs-tab.ant-tabs-tab-active .ant-tabs-tab-btn {
          color: ${primaryColor};
          font-weight: 600;
        }

        .custom-account-tabs .ant-tabs-ink-bar {
          background: ${primaryColor} !important;
          height: 3px !important;
          border-radius: 3px 3px 0 0 !important;
        }

        .custom-account-tabs .ant-tabs-nav::before {
          border-bottom-color: ${isDarkMode ? '#374151' : '#e5e7eb'} !important;
        }

        .custom-account-tabs .ant-tabs-content {
          padding: 16px;
          background: ${isDarkMode ? '#1f2937' : '#fff'};
          border-radius: 0 0 8px 8px;
        }

        .dark .custom-account-tabs .ant-tabs-tab {
          color: rgba(255, 255, 255, 0.65);
        }

        .dark .custom-account-tabs .ant-tabs-tab:hover {
          color: #6464FF;
        }

        .dark .custom-account-tabs .ant-tabs-tab.ant-tabs-tab-active .ant-tabs-tab-btn {
          color: ${primaryColor};
        }
      `}</style>
    </div>
  );
};

export default AccountTabs;