import { Card, Typography } from 'antd';
import dynamic from 'next/dynamic';
import { useEffect, useMemo } from 'react';

const JoditEditor = dynamic(() => import('jodit-react'), {
  ssr: false,
  loading: () => <p>Loading editor...</p>
});

const { Title } = Typography;

const JoditEditorWrapper = ({
  description,
  handleDescriptionChange,
  editorRef,
  isMobile,
  isDarkMode,
  formErrors
}) => {
  const joditConfig = useMemo(() => ({
    height: isMobile ? 300 : 400,
    placeholder: "Write your post description here...",
    theme: isDarkMode ? 'dark' : 'default',
    buttons: ['bold', 'italic', 'underline', '|', 'ul', 'ol'],
    buttonsMD: ['bold', 'italic', 'underline', '|', 'ul', 'ol'],
    buttonsSM: ['bold', 'italic', 'underline', '|', 'ul', 'ol'],
    buttonsXS: ['bold', 'italic', 'underline', '|', 'ul', 'ol'],
    extraPlugins: ['list'],
    style: {
      padding: "20px",
      backgroundColor: isDarkMode ? '#1f2937' : '#fff',
      color: isDarkMode ? '#e5e7eb' : '#374151',
      'ol': {
        listStyleType: 'decimal',
        paddingLeft: '20px',
      },
      'ol[type="a"]': { listStyleType: 'lower-alpha' },
      'ol[type="g"]': { listStyleType: 'lower-greek' },
    },
    toolbarAdaptive: false,
    toolbarSticky: true,
    showCharsCounter: true,
    showWordsCounter: true,
  }), [isMobile, isDarkMode]);

  useEffect(() => {
    if (isDarkMode) {
      const style = document.createElement('style');
      style.id = 'jodit-dark-mode-styles';
      style.innerHTML = `
        .jodit-container.jodit-dark-theme,
        .jodit-container.jodit-dark-theme .jodit-workplace,
        .jodit-container.jodit-dark-theme .jodit-wysiwyg {
          background-color: #1f2937 !important;
          color: #e5e7eb !important;
        }
        .jodit-dark-theme .jodit-toolbar__box {
          background-color: #374151 !important;
          border-color: #4b5563 !important;
        }
        .jodit-dark-theme .jodit-toolbar {
          background-color: #374151 !important;
          border-color: #4b5563 !important;
        }
        .jodit-dark-theme .jodit-wysiwyg {
          color: #e5e7eb !important;
        }
        .dark-editor .jodit-container {
          border-color: #4b5563 !important;
        }
        /* Toolbar styling */
        .jodit-toolbar__box {
          flex-wrap: nowrap !important;
          overflow-x: auto !important;
        }
        .jodit-toolbar-button {
          flex-shrink: 0 !important;
        }
        /* Force ol with decimal numbers */
        .jodit-wysiwyg ol {
          list-style-type: decimal !important;
          padding-left: 20px !important;
        }
      `;
      document.head.appendChild(style);
      return () => {
        const existingStyle = document.getElementById('jodit-dark-mode-styles');
        if (existingStyle) {
          document.head.removeChild(existingStyle);
        }
      };
    }
  }, [isDarkMode]);

  return (
    <div className="mb-6 sm:mb-8">
      <Title level={5} className={`mb-2 ${isDarkMode ? 'text-gray-200' : 'text-gray-800'}`}>
        Description <span className="text-red-500">*</span>
      </Title>
      <Card
        className={`border rounded-lg overflow-hidden hover:border-blue-300 transition-all p-0 ${isDarkMode ? 'border-gray-600' : 'border-gray-300'
          } ${formErrors.description ? 'border-red-500' : ''}`}
      >
        <div className={`${isDarkMode ? 'jodit-dark-theme' : ''}`}>
          <JoditEditor
            ref={editorRef}
            value={description}
            config={joditConfig}
            tabIndex={1}
            onBlur={handleDescriptionChange}
            className={isDarkMode ? 'jodit-dark-mode' : ''}
          />
        </div>
      </Card>
      {formErrors.description && (
        <div className="text-red-500 mt-1 text-sm">{formErrors.description}</div>
      )}
    </div>
  );
};

export default JoditEditorWrapper;