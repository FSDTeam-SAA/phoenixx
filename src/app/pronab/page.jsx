'use client';
import 'froala-editor/css/froala_editor.pkgd.min.css';
import 'froala-editor/css/froala_style.min.css';
import 'froala-editor/css/themes/dark.min.css';
import { useEffect, useMemo, useRef, useState } from 'react';
import FroalaEditor from 'react-froala-wysiwyg';

const Page = () => {
  const editorRef = useRef(null);
  const [header, setHeader] = useState('');
  const [description, setDescription] = useState('');
  const [formErrors, setFormErrors] = useState({});
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
    return () => setIsMounted(false);
  }, []);

  const headerConfig = useMemo(() => ({
    placeholderText: 'Enter your header here...',
    toolbarInline: true,
    toolbarVisibleWithoutSelection: true,
    charCounterCount: false,
    toolbarButtons: ['bold', 'italic', 'underline'],
    height: 50, // Smaller height for header
    events: {
      'contentChanged': function () {
        setHeader(this.html.get());
      }
    }
  }), []);

  const descriptionConfig = useMemo(() => ({
    placeholderText: 'Write your post description here...',
    height: 250, // Adjusted height to account for header
    scrollableContainer: true,
    toolbarButtons: ['bold', 'italic', 'underline', 'formatOL', 'formatUL', 'insertImage'],
    pluginsEnabled: ['lists', 'emoticons', 'image'],
    quickInsertTags: [],
    listAdvancedTypes: false,
    toolbarInline: false,
    charCounterCount: false,
    toolbarSticky: false,
    events: {
      'initialized': function () {
        setTimeout(() => {
          const editor = this;
          if (editor.$tb) {
            editor.$tb.find('.fr-command[data-cmd="formatOL"]').show();
            editor.$tb.find('.fr-command[data-cmd="formatUL"]').show();
            editor.$tb.find('.fr-command[data-cmd="formatOL"]').removeClass('fr-dropdown');
            editor.$tb.find('.fr-command[data-cmd="formatUL"]').removeClass('fr-dropdown');
          }
        }, 100);
      },
      'contentChanged': function () {
        const content = this.html.get();
        if (content !== description) {
          setDescription(content);
        }
      }
    }
  }), [description]);

  if (!isMounted) {
    return null;
  }

  return (
    <div className="editor-container" style={{ height: '300px', display: 'flex', flexDirection: 'column' }}>
      {/* Header Editor */}
      <div style={{ flex: '0 0 auto', borderBottom: '1px solid #eee' }}>
        <FroalaEditor
          tag="textarea"
          config={headerConfig}
          model={header}
          onModelChange={setHeader}
        />
      </div>

      {/* Description Editor */}
      <div style={{ flex: '1 1 auto', overflow: 'hidden' }}>
        <FroalaEditor
          key={`editor-${description.length}`}
          ref={editorRef}
          tag="textarea"
          config={descriptionConfig}
          model={description}
          onModelChange={setDescription}
        />
      </div>
    </div>
  );
};

export default Page;