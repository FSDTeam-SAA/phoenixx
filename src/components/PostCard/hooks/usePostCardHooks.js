import { useGetSaveAllPostQuery, useSavepostMutation } from '@/features/SavePost/savepostApi';
import { useRouter } from 'next/navigation';
import { useCallback, useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import { isAuthenticated } from '../../../../utils/auth';


export const usePostCardHooks = (postData, onLike, onRepost, currentUser) => {
  const router = useRouter();
  const [showReportModal, setShowReportModal] = useState(false);
  const [showImageModal, setShowImageModal] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isSaving, setIsSaving] = useState(false);

  const [savepost] = useSavepostMutation();
  const { data: savedPosts } = useGetSaveAllPostQuery();

  const loginUserPost = postData?.author?.id === localStorage.getItem("login_user_id");

  const isSaved = useMemo(() =>
    savedPosts?.data?.some(savedPost => savedPost?.postId?._id === postData?.id),
    [savedPosts, postData]
  );

  const isOwnPost = useMemo(() =>
    postData?.author?.id === currentUser?.id,
    [postData?.author?.id, currentUser?.id]
  );

  const handleImageClick = useCallback((index) => {
    console.log('Image clicked, index:', index);
    setCurrentImageIndex(index);
    setShowImageModal(true);
  }, []);

  const handleNextImage = useCallback(() => {
    setCurrentImageIndex((prev) =>
      prev === postData.images.length - 1 ? 0 : prev + 1
    );
  }, [postData.images?.length]);

  const handlePrevImage = useCallback(() => {
    setCurrentImageIndex((prev) =>
      prev === 0 ? postData.images.length - 1 : prev - 1
    );
  }, [postData.images?.length]);

  const handleCloseModal = useCallback(() => {
    setShowImageModal(false);
  }, []);

  const handlePostDetails = useCallback(() => {
    if (!isAuthenticated()) {
      router.push(`/auth/login`);
      return;
    } else {
      router.push(`/posts/${postData.slug}`);
    }
  }, [postData.id, router]);

  const handleCommentClick = useCallback(() => {
    if (!isAuthenticated()) {
      router.push(`/auth/login`);
      return;
    } else {
      router.push(`/posts/${postData.slug}#comments`);
    }
  }, [postData.id, router]);

  const handleLike = useCallback(() => {
    if (!isAuthenticated()) {
      router.push(`/auth/login`);
      return;
    } else {
      onLike?.(postData.id);
    }
  }, [onLike, postData.id]);

  const handleRepost = useCallback(() => {
    if (isOwnPost) return;
    onRepost?.(postData.id);
  }, [onRepost, postData.id, isOwnPost]);

  const handleShare = useCallback(async () => {
    try {
      if (!postData?.id) {
        toast.error("Post ID is missing");
        return;
      }
      const shareUrl = `${window.location.origin}/posts/${postData.id}`;
      if (!navigator.clipboard) {
        const textArea = document.createElement('textarea');
        textArea.value = shareUrl;
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
        toast.success("Link copied to clipboard");
        return;
      }
      await navigator.clipboard.writeText(shareUrl);
      toast.success("Link copied to clipboard");
    } catch (error) {
      console.error("Failed to copy link:", error);
      toast.error("Failed to copy link");
    }
  }, [postData.id]);

  const handleSaveUnsave = useCallback(async () => {
    if (!isAuthenticated()) {
      router.push('/auth/login');
      return;
    } else {
      setIsSaving(true);
      try {
        await savepost({ postId: postData.id }).unwrap();
        toast.success(isSaved ? 'Post removed from saved items' : 'Post saved successfully');
      } catch (error) {
        console.error('Save/Unsave error:', error);
        toast.error('Failed to update saved status');
      } finally {
        setIsSaving(false);
      }
    }
  }, [postData.id, isSaved, savepost]);

  const handleMenuClick = useCallback(({ key }) => {
    if (key === 'save') {
      handleSaveUnsave();
    } else if (key === 'report') {
      setShowReportModal(true);
    }
  }, [handleSaveUnsave]);

  return {
    showReportModal,
    setShowReportModal,
    showImageModal,
    currentImageIndex,
    isSaving,
    loginUserPost,
    isSaved,
    isOwnPost,
    handleImageClick,
    handleNextImage,
    handlePrevImage,
    handleCloseModal,
    handlePostDetails,
    handleCommentClick,
    handleLike,
    handleRepost,
    handleShare,
    handleSaveUnsave,
    handleMenuClick
  };
};