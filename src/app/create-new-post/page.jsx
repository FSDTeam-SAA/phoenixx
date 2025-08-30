"use client";
import { useCategoriesQuery, useSubCategoriesQuery } from '@/features/Category/CategoriesApi';
import { useCreatePostMutation, useEditPostMutation } from '@/features/post/postApi';
import { SaveOutlined, UploadOutlined } from '@ant-design/icons';
import { Underline } from "@tiptap/extension-underline";
import { EditorContent, useEditor } from '@tiptap/react';
import { StarterKit } from '@tiptap/starter-kit';
import {
  Button,
  Card,
  Col,
  Grid,
  Input,
  Row,
  Select,
  Space,
  Typography,
  Upload,
  message
} from 'antd';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import toast from 'react-hot-toast';
import { MdFormatListBulleted } from 'react-icons/md';
import { VscListOrdered } from "react-icons/vsc";
import { baseURL } from '../../../utils/BaseURL';
import { ThemeContext } from '../ClientLayout';

const { Title, Text } = Typography;
const { useBreakpoint } = Grid;

const BlogPostForm = ({ initialValues, isEditing = false, onSuccess, postId, refetchPosts, myCommentPostRefetch }) => {
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState(null);
  console.log(category)
  const [subcategory, setSubcategory] = useState(null);
  const [categorySlug, setCategorySlug] = useState(null);
  const [subCategorySlug, setSubCategorySlug] = useState(null);
  const [description, setDescription] = useState('');
  const [wordCount, setWordCount] = useState(0);
  const [fileList, setFileList] = useState([]);
  const [loading, setLoading] = useState(false);
  const [formErrors, setFormErrors] = useState({});
  const [initialImages, setInitialImages] = useState([]);
  const debounceTimeoutRef = useRef(null);
  const router = useRouter();
  const screens = useBreakpoint();
  const { isDarkMode } = useContext(ThemeContext);

  // Add refs to track editor state and prevent unnecessary updates
  const editorInitialized = useRef(false);
  const isUpdatingContent = useRef(false);
  const lastCursorPosition = useRef(null);

  // API hooks
  const [createPost, { isLoading: isCreating }] = useCreatePostMutation();
  const { data: categoryData } = useCategoriesQuery();

  const { data: subcategoryData, isLoading: isSubcategoriesLoading } = useSubCategoriesQuery(category, {
    skip: !category,
    refetchOnMountOrArgChange: true,
  });

  const [editPost] = useEditPostMutation();
  const isMobile = !screens.md;

  // FIXED: Improved utility function to count words properly
  const countWords = useCallback((html) => {
    if (!html) return 0;

    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = html;
    const plainText = tempDiv.textContent || tempDiv.innerText || '';

    // Remove all extra whitespace and normalize spaces
    const normalizedText = plainText
      .replace(/\s+/g, ' ') // Replace multiple spaces/whitespace with single space
      .trim(); // Remove leading and trailing spaces

    if (!normalizedText) return 0;

    // Split by single space and filter out empty strings
    const words = normalizedText.split(' ').filter(word => word.length > 0);
    return words.length;
  }, []);

  // FIXED: Improved function to truncate content to 1000 words while preserving HTML structure
  const truncateTo1000Words = useCallback((html) => {
    if (!html) return '';

    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = html;
    const plainText = tempDiv.textContent || tempDiv.innerText || '';

    // Normalize text for word counting
    const normalizedText = plainText.replace(/\s+/g, ' ').trim();
    const words = normalizedText.split(' ').filter(word => word.length > 0);

    if (words.length <= 1000) return html;

    // Create a more sophisticated truncation that preserves HTML structure
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');

    let wordCount = 0;
    const targetWords = 1000;

    const processTextNode = (textNode) => {
      if (wordCount >= targetWords) return '';

      const text = textNode.textContent || '';
      const normalizedNodeText = text.replace(/\s+/g, ' ').trim();

      if (!normalizedNodeText) return text; // Preserve whitespace-only nodes as they might be important for formatting

      const nodeWords = normalizedNodeText.split(' ').filter(word => word.length > 0);
      const remainingWords = targetWords - wordCount;

      if (nodeWords.length <= remainingWords) {
        wordCount += nodeWords.length;
        return text; // Return original text to preserve formatting
      } else {
        // Truncate this text node
        const truncatedWords = nodeWords.slice(0, remainingWords);
        wordCount += truncatedWords.length;

        // Try to preserve the original spacing format as much as possible
        let result = truncatedWords.join(' ');

        // If original text had leading space, preserve it
        if (text.startsWith(' ')) result = ' ' + result;

        return result;
      }
    };

    const processNode = (node) => {
      if (wordCount >= targetWords) return '';

      if (node.nodeType === Node.TEXT_NODE) {
        return processTextNode(node);
      } else if (node.nodeType === Node.ELEMENT_NODE) {
        const tagName = node.tagName.toLowerCase();

        // Get attributes
        let attributes = '';
        for (let i = 0; i < node.attributes.length; i++) {
          const attr = node.attributes[i];
          attributes += ` ${attr.name}="${attr.value}"`;
        }

        const openTag = `<${tagName}${attributes}>`;
        const closeTag = `</${tagName}>`;

        let content = '';
        for (let child of node.childNodes) {
          if (wordCount >= targetWords) break;
          content += processNode(child);
        }

        // Only include the element if it has content or if it's a self-closing element
        if (content.trim() || ['br', 'hr', 'img'].includes(tagName)) {
          return openTag + content + closeTag;
        }
        return '';
      }

      return '';
    };

    let result = '';
    for (let child of doc.body.childNodes) {
      if (wordCount >= targetWords) break;
      result += processNode(child);
    }

    return result;
  }, []);

  // Memoized category options
  const categoryOptions = useMemo(() => (
    categoryData?.data?.result?.map(item => ({
      value: item.category._id,
      label: item.category.name,
      slug: item.category.slug
    })) || []
  ), [categoryData]);

  const getSubcategories = useMemo(() => {
    if (!category || !subcategoryData?.data?.length) return [];
    return subcategoryData.data.map(sub => ({
      value: sub._id,
      label: sub.name,
      slug: sub.slug
    }));
  }, [category, subcategoryData]);

  // FIXED: Improved paste handler
  const handlePaste = useCallback((view, event) => {
    const html = event.clipboardData?.getData('text/html');
    const text = event.clipboardData?.getData('text/plain');

    if (html || text) {
      const currentWordCount = countWords(view.state.doc.textContent);
      const pastedWordCount = countWords(html || text);

      if (currentWordCount + pastedWordCount > 1000) {
        event.preventDefault();
        toast.error(`Pasting this content would exceed the 1000 word limit. You have ${1000 - currentWordCount} words remaining.`);
        return true;
      }
    }
    return false;
  }, [countWords]);

  // FIXED: Improved drop handler
  const handleDrop = useCallback((view, event) => {
    const html = event.dataTransfer?.getData('text/html');
    const text = event.dataTransfer?.getData('text/plain');

    if (html || text) {
      const currentWordCount = countWords(view.state.doc.textContent);
      const droppedWordCount = countWords(html || text);

      if (currentWordCount + droppedWordCount > 1000) {
        event.preventDefault();
        toast.error(`Dropping this content would exceed the 1000 word limit. You have ${1000 - droppedWordCount} words remaining.`);
        return true;
      }
    }
    return false;
  }, [countWords]);

  // FIXED: Updated editor update handler
  const handleEditorUpdate = useCallback(({ editor }) => {
    // Prevent recursive updates
    if (isUpdatingContent.current) return;

    // Store cursor position before processing
    const { from, to } = editor.state.selection;
    lastCursorPosition.current = { from, to };

    const html = editor.getHTML();
    const words = countWords(html);

    // Only handle truncation if word count exceeds limit
    if (words > 1000) {
      isUpdatingContent.current = true;
      const truncatedHtml = truncateTo1000Words(html);

      // Use setTimeout to ensure the update happens after current cycle
      setTimeout(() => {
        editor.commands.setContent(truncatedHtml, false, {
          preserveWhitespace: 'full'
        });

        // Restore cursor position (adjust for truncation)
        const newWords = countWords(truncatedHtml);
        if (newWords < words) {
          // Content was truncated, position cursor at end
          editor.commands.focus('end');
        } else {
          // Try to restore original position
          try {
            editor.commands.setTextSelection({
              from: Math.min(lastCursorPosition.current.from, editor.state.doc.content.size),
              to: Math.min(lastCursorPosition.current.to, editor.state.doc.content.size)
            });
          } catch (e) {
            // Fallback to focus at current position
            editor.commands.focus();
          }
        }

        isUpdatingContent.current = false;
      }, 0);

      setWordCount(1000);
      setDescription(truncatedHtml);
      toast.error('Word limit of 1000 exceeded. Content has been truncated.');
    } else {
      // Normal update without cursor issues
      setDescription(html);
      setWordCount(words);
    }

    if (formErrors.description) {
      setFormErrors(prev => ({ ...prev, description: null }));
    }
  }, [countWords, truncateTo1000Words, formErrors.description]);

  // Tiptap Editor Setup with fixed cursor position handling
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        bulletList: {
          keepMarks: true,
          HTMLAttributes: {
            class: 'list-disc pl-5',
          },
        },
        orderedList: {
          keepMarks: true,
          HTMLAttributes: {
            class: 'list-decimal pl-5',
          },
        },
      }),
      Underline
    ],
    content: description,
    onUpdate: handleEditorUpdate,
    editorProps: {
      attributes: {
        class: `focus:outline-none p-4 min-h-[240px] max-h-[240px] overflow-y-auto ${isDarkMode ? 'bg-gray-700 text-gray-200' : 'bg-white text-gray-800'
          }`,
      },
      handlePaste,
      handleDrop
    },
    // Add onSelectionUpdate to track cursor position
    onSelectionUpdate: ({ editor }) => {
      if (!isUpdatingContent.current) {
        const { from, to } = editor.state.selection;
        lastCursorPosition.current = { from, to };
      }
    }
  });

  // Fixed useEffect to prevent cursor jumping
  useEffect(() => {
    if (editor && editorInitialized.current && !isUpdatingContent.current) {
      // Only update if the content is actually different
      const currentContent = editor.getHTML();
      if (currentContent !== description) {
        isUpdatingContent.current = true;

        // Store current cursor position
        const { from, to } = editor.state.selection;

        editor.commands.setContent(description, false, {
          preserveWhitespace: 'full'
        });

        // Restore cursor position after content update
        setTimeout(() => {
          try {
            editor.commands.setTextSelection({
              from: Math.min(from, editor.state.doc.content.size),
              to: Math.min(to, editor.state.doc.content.size)
            });
          } catch (e) {
            // Fallback: just focus the editor
            editor.commands.focus();
          }
          isUpdatingContent.current = false;
        }, 0);
      }
    } else if (editor && !editorInitialized.current) {
      // Initial setup
      editor.commands.setContent(description);
      editorInitialized.current = true;
    }
  }, [description, editor]);

  // Handle dark mode change
  useEffect(() => {
    if (editor) {
      const updateClasses = () => {
        const editorWrapper = document.querySelector('.tiptap-editor-wrapper');
        if (editorWrapper) {
          editorWrapper.className = `tiptap-editor-wrapper rounded-lg border ${isDarkMode ? 'border-gray-600' : 'border-gray-300'
            }`;
        }
        const content = editor.view.dom;
        content.className = `${isDarkMode ? 'bg-gray-700 text-gray-200' : 'bg-white text-gray-800'
          } p-4 min-h-[240px] max-h-[240px] overflow-y-auto focus:outline-none`;
      };
      updateClasses();
    }
  }, [isDarkMode, editor]);

  // Auto-save draft
  useEffect(() => {
    if (!isEditing && !initialValues) {
      const savedDraft = localStorage.getItem('blogPostDraft');
      if (savedDraft) {
        try {
          const draftData = JSON.parse(savedDraft);
          setTitle(draftData.title || '');
          setCategory(draftData.category || null);
          setSubcategory(draftData.subcategory || null);
          setDescription(draftData.description || '');
          setWordCount(countWords(draftData.description || ''));
          if (draftData.files && draftData.files.length > 0) {
            setFileList(draftData.files.map(file => ({
              uid: file.uid || `-${Math.random().toString(36).substr(2, 9)}`,
              name: file.name,
              status: 'done',
              url: file.url,
              thumbUrl: file.url
            })));
          }
          toast.success('Draft loaded successfully');
        } catch (error) {
          console.error('Error loading draft:', error);
          localStorage.removeItem('blogPostDraft');
        }
      }
    }
  }, [isEditing, initialValues, countWords]);

  // Initialize form with initial values when editing
  useEffect(() => {
    if (initialValues) {
      setTitle(initialValues.title || '');
      setCategory(initialValues.category || null);
      setSubcategory(initialValues.subCategory || null);
      setDescription(initialValues.content || '');
      setWordCount(countWords(initialValues.content || ''));
      if (initialValues.images && Array.isArray(initialValues.images)) {
        const initialImagesList = initialValues.images.map((image, index) => {
          const imageUrl = image.startsWith('http')
            ? image
            : `${baseURL}${image}`;
          return {
            uid: `-${index}`,
            name: `image-${index}`,
            status: 'done',
            url: imageUrl,
            thumbUrl: imageUrl,
            path: image
          };
        });
        setFileList(initialImagesList);
        setInitialImages(initialImagesList);
      } else if (initialValues.image) {
        const imageUrl = initialValues.image.startsWith('http')
          ? initialValues.image
          : `${baseURL}${initialValues.image}`;
        const initialImage = [{
          uid: '-1',
          name: 'current-image',
          status: 'done',
          url: imageUrl,
          thumbUrl: imageUrl,
          path: initialValues.image
        }];
        setFileList(initialImage);
        setInitialImages(initialImage);
      }
    }
  }, [initialValues, countWords]);

  const handleTitleChange = (e) => {
    setTitle(e.target.value);
    if (formErrors.title) {
      setFormErrors(prev => ({ ...prev, title: null }));
    }
  };

  const handleCategoryChange = (value) => {
    const findSlug = categoryOptions.find(cate => cate.value === value)
    setCategorySlug(findSlug?.slug)
    setCategory(value);
    setSubcategory(null);
    if (formErrors.category) {
      setFormErrors(prev => ({ ...prev, category: null }));
    }
  };

  const handleSubcategoryChange = (value) => {
    const findSlug = getSubcategories.find(cate => cate.value === value)
    setSubCategorySlug(findSlug?.slug)
    setSubcategory(value);
    if (formErrors.subcategory) {
      setFormErrors(prev => ({ ...prev, subcategory: null }));
    }
  };

  const handleFileChange = ({ fileList: newFileList }) => {
    const validFiles = newFileList.filter(file => {
      return file.status !== 'error';
    }).slice(0, 3);
    setFileList(validFiles);
  };

  const beforeUpload = (file) => {
    const isImage = file.type.startsWith('image/');
    if (!isImage) {
      message.error('Only image files can be uploaded!');
      return Upload.LIST_IGNORE;
    }
    const fileSizeInMB = file.size / 1024 / 1024;
    if (fileSizeInMB > 500) {
      message.info(`Uploading large files (${fileSizeInMB.toFixed(2)} MB). Please wait...`);
    }
    return false;
  };

  const handleSaveDraft = () => {
    const draftData = {
      title,
      category,
      subcategory,
      description,
      files: fileList.map(file => ({
        uid: file.uid,
        name: file.name,
        size: file.size,
        type: file.type,
        url: file.url || file.thumbUrl
      }))
    };
    localStorage.setItem('blogPostDraft', JSON.stringify(draftData));
    toast.success('Draft saved successfully');
  };

  const handleClearDraft = () => {
    localStorage.removeItem('blogPostDraft');
    setTitle('');
    setCategory(null);
    setSubcategory(null);
    setDescription('');
    setWordCount(0);
    setFileList([]);
    if (editor) {
      isUpdatingContent.current = true;
      editor.commands.clearContent();
      setTimeout(() => {
        isUpdatingContent.current = false;
      }, 0);
    }
    toast.success('Draft cleared successfully');
  };

  const validateForm = () => {
    const errors = {};
    if (!title.trim()) {
      errors.title = 'Title is required';
    }
    if (!category) {
      errors.category = 'Category is required';
    }
    if (category && getSubcategories.length > 0 && !subcategory) {
      errors.subcategory = 'Subcategory is required';
    }
    if (!description.trim()) {
      errors.description = 'Description is required';
    }
    if (wordCount > 1000) {
      errors.description = 'Description exceeds 1000 word limit';
    }
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) {
      if (formErrors.title) {
        toast.error('Please enter a title');
      } else if (formErrors.category) {
        toast.error('Please select a category');
      } else if (formErrors.subcategory) {
        toast.error('Please select a subcategory');
      } else if (formErrors.description) {
        toast.error(formErrors.description);
      }
      return;
    }

    try {
      setLoading(true);
      const formData = new FormData();
      formData.append('title', title);
      formData.append('category', category);
      formData.append('categorySlug', categorySlug);
      if (subcategory) formData.append('subCategory', subcategory);
      if (subCategorySlug) formData.append('subCategorySlug', subCategorySlug);
      formData.append('content', description);

      // Add images for both create and edit cases
      fileList.forEach((file) => {
        if (file.originFileObj) {
          formData.append('image', file.originFileObj);
        }
      });

      if (isEditing && postId) {
        const deletedImages = [];
        initialImages.forEach(initialImage => {
          const stillExists = fileList.some(file =>
            file.path === initialImage.path ||
            file.url === initialImage.url
          );
          if (!stillExists) {
            deletedImages.push(initialImage.path);
          }
        });
        if (deletedImages.length > 0) {
          formData.append('deletedImages', JSON.stringify(deletedImages));
        }
      }

      const response = isEditing && postId
        ? await editPost({ id: postId, body: formData }).unwrap()
        : await createPost(formData).unwrap();

      if (response.success) {
        toast.success(isEditing ? 'Post updated successfully' : 'Post created successfully');
        if (onSuccess) onSuccess();
      } else {
        throw new Error(response.message || 'Operation failed');
      }

      if (!isEditing) {
        router.push('/');
        localStorage.removeItem('blogPostDraft');
      }
    } catch (error) {
      console.error('Error:', error);
      toast.error(
        error.data?.message ||
        error.message ||
        (isEditing ? 'Failed to update post' : 'Failed to create post')
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    return () => {
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current);
      }
    };
  }, []);

  return (
    <>
      <style jsx global>{`
        .tiptap-editor-wrapper {
          border: 1px solid ${isDarkMode ? '#4b5563' : '#d1d5db'};
          border-radius: 0.5rem;
          overflow: hidden;
          transition: border-color 0.2s;
        }
        .tiptap-editor-wrapper .ProseMirror {
          padding: 0.5rem;
          outline: none;
          line-height: 1.6;
          white-space: pre-wrap; /* Preserves spaces but normalizes line breaks */
        }
        .tiptap-editor-wrapper .ProseMirror::-webkit-scrollbar {
          width: 8px;
        }
        .tiptap-editor-wrapper .ProseMirror::-webkit-scrollbar-track {
          background: ${isDarkMode ? '#374151' : '#f1f5f9'};
        }
        .tiptap-editor-wrapper .ProseMirror::-webkit-scrollbar-thumb {
          background: ${isDarkMode ? '#6b7280' : '#cbd5e1'};
          border-radius: 4px;
        }
        .tiptap-editor-wrapper .ProseMirror::-webkit-scrollbar-thumb:hover {
          background: ${isDarkMode ? '#9ca3af' : '#94a3b8'};
        }
        .tiptap-editor-wrapper .ProseMirror {
          scrollbar-width: thin;
          scrollbar-color: ${isDarkMode ? '#6b7280 #374151' : '#cbd5e1 #f1f5f9'};
        }
        .word-count-indicator {
          transition: color 0.2s ease-in-out;
        }
        .word-count-warning {
          color: #f59e0b;
        }
        .word-count-error {
          color: #ef4444;
        }
      `}</style>

      <div className={`min-h-screen ${isEditing ? '' : 'py-4 sm:py-8 px-2 sm:px-4'} transition-colors duration-200 ${isDarkMode ? 'bg-gray-900 text-gray-100' : 'bg-gray-50 text-gray-900'}`}>
        <div className="max-w-4xl mx-auto">
          <Card className={`rounded-xl shadow-lg border-0 overflow-hidden ${isEditing ? 'border-0 shadow-none' : ''} ${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
            {!isEditing && (
              <div className="">
                <Image
                  src={"/images/create-post-image.png"}
                  height={1000}
                  width={1000}
                  alt='Create post header image'
                  priority
                />
              </div>
            )}
            <div className={`${!isEditing && 'py-4 sm:p-6'}`}>
              {/* Title Input */}
              <div className="mb-6 sm:mb-8">
                <Title level={5} className={`mb-2 ${isDarkMode ? 'text-gray-200' : 'text-gray-800'}`}>
                  Title <span className="text-red-500">*</span>
                </Title>
                <Input
                  placeholder="Write your post title here..."
                  value={title}
                  onChange={handleTitleChange}
                  maxLength={300}
                  suffix={`${title.length}/300`}
                  className={`py-2 sm:py-3 px-4 rounded-lg hover:border-blue-400 focus:border-blue-500 transition-colors ${isDarkMode ? 'bg-gray-700 border-gray-600 text-gray-200 placeholder-gray-400' : 'bg-white border-gray-300'} ${formErrors.title ? 'border-red-500' : ''}`}
                  size={isMobile ? "middle" : "large"}
                  status={formErrors.title ? "error" : ""}
                />
                {formErrors.title && (
                  <div className="text-red-500 mt-1 text-sm">{formErrors.title}</div>
                )}
              </div>

              {/* Category and Subcategory */}
              <div className="mb-6 sm:mb-8">
                <Row gutter={[16, 16]}>
                  <Col xs={24} md={12}>
                    <Title level={5} className={`mb-2 ${isDarkMode ? 'text-gray-200' : 'text-gray-800'}`}>
                      Category <span className="text-red-500">*</span>
                    </Title>
                    <Select
                      placeholder="Select a category"
                      value={category}
                      onChange={handleCategoryChange}
                      className={`w-full ${isDarkMode ? 'ant-select-dark' : ''} ${formErrors.category ? 'border-red-500 ant-select-status-error' : ''}`}
                      size={isMobile ? "middle" : "large"}
                      options={categoryOptions}
                      popupClassName={isDarkMode ? 'dark-dropdown' : ''}
                      status={formErrors.category ? "error" : ""}
                    />
                    {formErrors.category && (
                      <div className="text-red-500 mt-1 text-sm">{formErrors.category}</div>
                    )}
                  </Col>
                  <Col xs={24} md={12}>
                    <Title level={5} className={`mb-2 ${isDarkMode ? 'text-gray-200' : 'text-gray-800'}`}>
                      Subcategory <span className="text-red-500">*</span>
                    </Title>
                    <Select
                      placeholder={
                        isSubcategoriesLoading ? "Loading..." :
                          !category ? "Select a category first" :
                            getSubcategories.length === 0 ? "No subcategories available" :
                              "Select a subcategory"
                      }
                      value={subcategory}
                      onChange={handleSubcategoryChange}
                      className={`w-full ${isDarkMode ? 'ant-select-dark' : ''} ${formErrors.subcategory ? 'border-red-500 ant-select-status-error' : ''}`}
                      size={isMobile ? "middle" : "large"}
                      options={getSubcategories}
                      disabled={!category || getSubcategories.length === 0 || isSubcategoriesLoading}
                      notFoundContent={category && "No subcategories found"}
                      popupClassName={isDarkMode ? 'dark-dropdown' : ''}
                      status={formErrors.subcategory ? "error" : ""}
                    />
                    {formErrors.subcategory && (
                      <div className="text-red-500 mt-1 text-sm">{formErrors.subcategory}</div>
                    )}
                  </Col>
                </Row>
              </div>

              {/* Description Editor */}
              <div className="mb-6 sm:mb-8">
                <div className="flex justify-between items-center mb-2">
                  <Title level={5} className={`mb-0 ${isDarkMode ? 'text-gray-200' : 'text-gray-800'}`}>
                    Description <span className="text-red-500">*</span>
                  </Title>
                  <div className={`text-sm font-medium word-count-indicator ${wordCount > 900 ? 'word-count-error' : wordCount > 800 ? 'word-count-warning' : isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                    {wordCount}/1000 words
                  </div>
                </div>
                <div
                  className="tiptap-editor-wrapper"
                  onPaste={(e) => {
                    if (e.clipboardData.files.length > 0) {
                      e.preventDefault();
                      toast.error('Image pasting is not allowed. Please use the image upload section.');
                    }
                  }}
                >
                  {/* Toolbar */}
                  <div
                    className={`flex gap-1 px-1 py-2 border-b ${isDarkMode ? 'bg-gray-800 border-gray-600' : 'bg-gray-50 border-gray-200'}`}
                  >
                    <button
                      type="button"
                      onClick={() => editor?.chain().focus().toggleBold().run()}
                      className={`px-4 py-2 cursor-pointer rounded ${editor?.isActive('bold') ? 'bg-blue-700 text-white' : isDarkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-200'
                        }`}
                    >
                      <strong>B</strong>
                    </button>
                    <button
                      type="button"
                      onClick={() => editor?.chain().focus().toggleItalic().run()}
                      className={`px-[18px] py-2 cursor-pointer rounded ${editor?.isActive('italic') ? 'bg-blue-700 text-white' : isDarkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-200'
                        }`}
                    >
                      <em>I</em>
                    </button>
                    <button
                      type="button"
                      onClick={() => editor?.chain().focus().toggleUnderline().run()}
                      className={`px-4 py-2 cursor-pointer rounded ${editor?.isActive('underline') ? 'bg-blue-700 text-white' : isDarkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-200'
                        }`}
                    >
                      <u>U</u>
                    </button>
                    <button
                      type="button"
                      onClick={() => editor?.chain().focus().toggleBulletList().run()}
                      className={`px-3 py-2 cursor-pointer rounded ${editor?.isActive('bulletList') ? 'bg-blue-700 text-white' : isDarkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-200'
                        }`}
                    >
                      <MdFormatListBulleted size={20} />
                    </button>
                    <button
                      type="button"
                      onClick={() => editor?.chain().focus().toggleOrderedList().run()}
                      className={`px-3 py-2 cursor-pointer rounded ${editor?.isActive('orderedList') ? 'bg-blue-700 text-white' : isDarkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-200'
                        }`}
                    >
                      <VscListOrdered size={20} />
                    </button>
                  </div>

                  {/* Editor */}
                  <EditorContent editor={editor} />
                </div>
                {formErrors.description && (
                  <div className="text-red-500 mt-1 text-sm">{formErrors.description}</div>
                )}
              </div>

              {/* Image Upload */}
              <div className="mb-6 sm:mb-8">
                <Title level={5} className={`mb-2 ${isDarkMode ? 'text-gray-200' : 'text-gray-800'}`}>
                  Featured Images <span className="text-xs font-normal">(Maximum 3)</span>
                </Title>
                <Card className={`border-2 border-dashed rounded-xl hover:border-blue-400 transition-all text-center cursor-pointer ${isDarkMode ? 'bg-gray-700 border-gray-600' : 'bg-gray-50 border-gray-300'}`}>
                  <Upload
                    accept="image/*"
                    listType={isMobile ? "picture" : "picture-card"}
                    fileList={fileList}
                    onChange={handleFileChange}
                    onPreview={false}
                    beforeUpload={beforeUpload}
                    className="flex justify-center"
                    maxCount={3}
                  >
                    {fileList.length < 3 && (
                      isMobile ? (
                        <Button icon={<UploadOutlined />} size="middle" className={isDarkMode ? 'text-gray-200' : 'text-gray-800'}>
                          Add Photos
                        </Button>
                      ) : (
                        <div className={`flex flex-col items-center ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                          <UploadOutlined className="text-2xl mb-2" />
                          <p>Upload</p>
                          <p>Max 500MB</p>
                        </div>
                      )
                    )}
                  </Upload>
                </Card>
              </div>

              {/* Form Actions */}
              <Row justify="end" gutter={[8, 8]}>
                <Col>
                  {!initialValues && (
                    <Space>
                      <Button
                        icon={<SaveOutlined />}
                        size={isMobile ? "middle" : "large"}
                        className={`flex items-center ${isDarkMode ? 'text-gray-200 hover:text-white' : 'text-gray-800'}`}
                        onClick={handleSaveDraft}
                      >
                        {isMobile ? 'Save' : 'Save draft'}
                      </Button>
                      {localStorage.getItem('blogPostDraft') && (
                        <Button
                          danger
                          size={isMobile ? "middle" : "large"}
                          onClick={handleClearDraft}
                        >
                          {isMobile ? 'Clear' : 'Clear draft'}
                        </Button>
                      )}
                    </Space>
                  )}
                </Col>
                <Col>
                  <Button
                    type="primary"
                    size={isMobile ? "middle" : "large"}
                    className="border-0 shadow-md hover:shadow-lg"
                    onClick={handleSubmit}
                    loading={loading}
                    disabled={wordCount > 1000}
                  >
                    {isEditing
                      ? (isMobile ? 'Update' : 'Update Post')
                      : (isMobile ? 'Publish' : 'Publish Post')
                    }
                  </Button>
                </Col>
              </Row>
            </div>
          </Card>
        </div>
      </div>
    </>
  );
};

export default BlogPostForm;