"use client";

import CustomBanner from '@/components/CustomBanner';
import { useContext } from 'react';
import { usePrivacyPolicyQuery } from '../../features/About/AboutApi';
import { ThemeContext } from '../ClientLayout';
import Loading from '../../components/Loading/Loading';

const page = () => {
  const { data, isLoading, isError } = usePrivacyPolicyQuery();
  const { isDarkMode } = useContext(ThemeContext);

  const renderContent = () => {
    if (isLoading) {
      return (
        <div className='flex justify-center'>
          {/* <Spin className={isDarkMode ? 'dark-spin' : ''} /> */}
          <Loading />
        </div>
      );
    }

    if (isError) {
      return (
        <div className={`flex justify-center ${isDarkMode ? 'text-red-400' : 'text-red-600'}`}>
          Failed to load content
        </div>
      );
    }

    if (!data?.data?.content) {
      return (
        <span className={`flex justify-center ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
          No Available Content
        </span>
      );
    }

    return (
      <div
        className={`privacy-policy-content ${isDarkMode ? 'dark-content' : ''}`}
        dangerouslySetInnerHTML={{ __html: data.data.content }}
      />
    );
  };

  return (
    <div className={isDarkMode ? 'dark' : ''}>
      <style jsx global>{`
        /* Dark mode styles for dynamically rendered content */
        .dark .privacy-policy-content,
        .dark-content {
          color: #f3f4f6 !important;
          max-width: none !important;
        }
        
        .dark .privacy-policy-content h1,
        .dark .privacy-policy-content h2,
        .dark .privacy-policy-content h3,
        .dark .privacy-policy-content h4,
        .dark .privacy-policy-content h5,
        .dark .privacy-policy-content h6,
        .dark-content h1,
        .dark-content h2,
        .dark-content h3,
        .dark-content h4,
        .dark-content h5,
        .dark-content h6 {
          color: #ffffff !important;
          margin-top: 2.5rem !important;
          margin-bottom: 1.25rem !important;
          font-weight: 700 !important;
        }
        
        .dark .privacy-policy-content h1,
        .dark-content h1 {
          font-size: 2.25rem !important;
          line-height: 2.5rem !important;
        }
        
        .dark .privacy-policy-content h2,
        .dark-content h2 {
          font-size: 1.875rem !important;
          line-height: 2.25rem !important;
        }
        
        .dark .privacy-policy-content h3,
        .dark-content h3 {
          font-size: 1.5rem !important;
          line-height: 2rem !important;
        }
        
        .dark .privacy-policy-content h4,
        .dark-content h4 {
          font-size: 1.25rem !important;
          line-height: 1.75rem !important;
        }
        
        .dark .privacy-policy-content p,
        .dark .privacy-policy-content div,
        .dark .privacy-policy-content span,
        .dark .privacy-policy-content li,
        .dark .privacy-policy-content td,
        .dark-content p,
        .dark-content div,
        .dark-content span,
        .dark-content li,
        .dark-content td {
          color: #e5e7eb !important;
          line-height: 1.75 !important;
          margin-bottom: 1rem !important;
        }
        
        .dark .privacy-policy-content p,
        .dark-content p {
          font-size: 1rem !important;
          margin-top: 1rem !important;
        }
        
        .dark .privacy-policy-content a,
        .dark-content a {
          color: #60a5fa !important;
          text-decoration: underline !important;
          transition: color 0.2s ease !important;
        }
        
        .dark .privacy-policy-content a:hover,
        .dark-content a:hover {
          color: #93c5fd !important;
        }
        
        .dark .privacy-policy-content table,
        .dark-content table {
          border-color: #374151 !important;
          background-color: #1f2937 !important;
          border-collapse: collapse !important;
          width: 100% !important;
          margin: 2rem 0 !important;
          border-radius: 0.5rem !important;
          overflow: hidden !important;
        }
        
        .dark .privacy-policy-content th,
        .dark .privacy-policy-content td,
        .dark-content th,
        .dark-content td {
          border: 1px solid #374151 !important;
          padding: 1rem !important;
          background-color: transparent !important;
          text-align: left !important;
        }
        
        .dark .privacy-policy-content th,
        .dark-content th {
          background-color: #374151 !important;
          font-weight: 600 !important;
          color: #ffffff !important;
        }
        
        .dark .privacy-policy-content blockquote,
        .dark-content blockquote {
          border-left: 4px solid #60a5fa !important;
          background-color: #1f2937 !important;
          padding: 1.5rem !important;
          margin: 2rem 0 !important;
          border-radius: 0.5rem !important;
          font-style: italic !important;
        }
        
        .dark .privacy-policy-content code,
        .dark-content code {
          background-color: #1f2937 !important;
          color: #fbbf24 !important;
          padding: 0.25rem 0.5rem !important;
          border-radius: 0.375rem !important;
          font-size: 0.875em !important;
          font-weight: 500 !important;
        }
        
        .dark .privacy-policy-content pre,
        .dark-content pre {
          background-color: #111827 !important;
          border: 1px solid #374151 !important;
          padding: 1.5rem !important;
          border-radius: 0.5rem !important;
          overflow-x: auto !important;
          margin: 1.5rem 0 !important;
        }
        
        .dark .privacy-policy-content pre code,
        .dark-content pre code {
          background-color: transparent !important;
          padding: 0 !important;
        }
        
        .dark .privacy-policy-content hr,
        .dark-content hr {
          border-color: #374151 !important;
          border-width: 1px !important;
          margin: 3rem 0 !important;
        }
        
        /* Dark mode for Ant Design Spin component */
        .dark-spin .ant-spin-dot-item {
          background-color: #60a5fa !important;
        }
        
        .dark .ant-spin-dot-item {
          background-color: #60a5fa !important;
        }
        
        /* Enhanced text styling */
        .dark .privacy-policy-content strong,
        .dark .privacy-policy-content b,
        .dark-content strong,
        .dark-content b {
          color: #ffffff !important;
          font-weight: 700 !important;
        }
        
        .dark .privacy-policy-content em,
        .dark .privacy-policy-content i,
        .dark-content em,
        .dark-content i {
          color: #d1d5db !important;
          font-style: italic !important;
        }
        
        /* Form elements styling */
        .dark .privacy-policy-content input,
        .dark .privacy-policy-content textarea,
        .dark .privacy-policy-content select,
        .dark-content input,
        .dark-content textarea,
        .dark-content select {
          background-color: #374151 !important;
          color: #f3f4f6 !important;
          border: 1px solid #4b5563 !important;
          border-radius: 0.5rem !important;
          padding: 0.75rem !important;
          transition: border-color 0.2s ease, box-shadow 0.2s ease !important;
        }
        
        .dark .privacy-policy-content input:focus,
        .dark .privacy-policy-content textarea:focus,
        .dark .privacy-policy-content select:focus,
        .dark-content input:focus,
        .dark-content textarea:focus,
        .dark-content select:focus {
          border-color: #60a5fa !important;
          outline: none !important;
          box-shadow: 0 0 0 3px rgba(96, 165, 250, 0.1) !important;
        }
        
        /* Lists styling */
        .dark .privacy-policy-content ul,
        .dark .privacy-policy-content ol,
        .dark-content ul,
        .dark-content ol {
          color: #e5e7eb !important;
          padding-left: 2rem !important;
          margin: 1.5rem 0 !important;
        }
        
        .dark .privacy-policy-content li,
        .dark-content li {
          margin: 0.75rem 0 !important;
          line-height: 1.75 !important;
        }
        
        .dark .privacy-policy-content ul li,
        .dark-content ul li {
          list-style-type: disc !important;
        }
        
        .dark .privacy-policy-content ol li,
        .dark-content ol li {
          list-style-type: decimal !important;
        }
        
        /* Nested lists */
        .dark .privacy-policy-content ul ul,
        .dark .privacy-policy-content ol ol,
        .dark .privacy-policy-content ul ol,
        .dark .privacy-policy-content ol ul,
        .dark-content ul ul,
        .dark-content ol ol,
        .dark-content ul ol,
        .dark-content ol ul {
          margin-top: 0.5rem !important;
          margin-bottom: 0.5rem !important;
        }
        
        /* Images and media */
        .dark .privacy-policy-content img,
        .dark-content img {
          opacity: 0.9 !important;
          border-radius: 0.5rem !important;
          max-width: 100% !important;
          height: auto !important;
          margin: 1.5rem 0 !important;
        }
        
        /* Definition lists */
        .dark .privacy-policy-content dl,
        .dark-content dl {
          color: #e5e7eb !important;
          margin: 1.5rem 0 !important;
        }
        
        .dark .privacy-policy-content dt,
        .dark-content dt {
          color: #ffffff !important;
          font-weight: 700 !important;
          margin-top: 1.5rem !important;
          margin-bottom: 0.5rem !important;
        }
        
        .dark .privacy-policy-content dd,
        .dark-content dd {
          color: #d1d5db !important;
          margin-left: 2rem !important;
          margin-bottom: 1rem !important;
        }
        
        /* Keyboard and mark elements */
        .dark .privacy-policy-content kbd,
        .dark-content kbd {
          background-color: #374151 !important;
          color: #ffffff !important;
          padding: 0.25rem 0.5rem !important;
          border-radius: 0.25rem !important;
          font-size: 0.875em !important;
          border: 1px solid #4b5563 !important;
        }
        
        .dark .privacy-policy-content mark,
        .dark-content mark {
          background-color: #fbbf24 !important;
          color: #111827 !important;
          padding: 0.125rem 0.25rem !important;
          border-radius: 0.25rem !important;
        }
        
        /* Scrollbar styling */
        .dark .privacy-policy-content::-webkit-scrollbar,
        .dark-content::-webkit-scrollbar {
          width: 8px !important;
        }
        
        .dark .privacy-policy-content::-webkit-scrollbar-track,
        .dark-content::-webkit-scrollbar-track {
          background: #1f2937 !important;
          border-radius: 4px !important;
        }
        
        .dark .privacy-policy-content::-webkit-scrollbar-thumb,
        .dark-content::-webkit-scrollbar-thumb {
          background: #4b5563 !important;
          border-radius: 4px !important;
          transition: background 0.2s ease !important;
        }
        
        .dark .privacy-policy-content::-webkit-scrollbar-thumb:hover,
        .dark-content::-webkit-scrollbar-thumb:hover {
          background: #6b7280 !important;
        }
        
        /* Ensure proper spacing for the first element */
        .dark .privacy-policy-content > *:first-child,
        .dark-content > *:first-child {
          margin-top: 0 !important;
        }
        
        /* Ensure proper spacing for the last element */
        .dark .privacy-policy-content > *:last-child,
        .dark-content > *:last-child {
          margin-bottom: 0 !important;
        }
      `}</style>

      <CustomBanner prevRoute="About us" routeName="Privacy Policy" />

      <div className={`min-h-screen transition-colors duration-300 ${isDarkMode ? 'bg-gray-900 text-gray-100' : 'bg-gray-50 text-gray-900'
        }`}>
        <div className="max-w-5xl mx-auto py-8 px-6">
          {renderContent()}
        </div>
      </div>
    </div>
  );
};

export default page;