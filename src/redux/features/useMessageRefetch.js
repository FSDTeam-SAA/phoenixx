import { useCallback, useEffect, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';

import { messageApi } from '../../features/chat/message/messageApi';
import { resetForRefetch, setAutoUpdateEnabled, startAutoUpdate, startRefetch } from './messageSlice';

export const useMessageRefetch = () => {
  const dispatch = useDispatch();
  const {
    currentChatId,
    isRefetching,
    isAutoUpdating,
    autoUpdateEnabled,
    updateInterval,
    limit
  } = useSelector((state) => state.message);

  const intervalRef = useRef(null);

  // Manual refetch function
  const refetch = useCallback(async () => {
    if (!currentChatId || isRefetching) return;

    try {
      dispatch(startRefetch());
      dispatch(resetForRefetch());

      await dispatch(
        messageApi.endpoints.getAllMessages.initiate(
          {
            chatId: currentChatId,
            page: 1,
            limit: limit
          },
          {
            forceRefetch: true,
          }
        )
      ).unwrap();

    } catch (error) {
      console.error('Failed to refetch messages:', error);
    }
  }, [currentChatId, isRefetching, limit, dispatch]);

  // Auto update function
  const autoUpdate = useCallback(async () => {
    if (!currentChatId || isRefetching || isAutoUpdating) return;

    try {
      dispatch(startAutoUpdate());

      await dispatch(
        messageApi.endpoints.getAllMessages.initiate(
          {
            chatId: currentChatId,
            page: 1,
            limit: limit
          },
          {
            forceRefetch: true,
          }
        )
      ).unwrap();

    } catch (error) {
      console.error('Failed to auto update messages:', error);
    }
  }, [currentChatId, isRefetching, isAutoUpdating, limit, dispatch]);

  // Toggle auto update
  const toggleAutoUpdate = useCallback((enabled) => {
    dispatch(setAutoUpdateEnabled(enabled));
  }, [dispatch]);

  // Setup auto update interval
  useEffect(() => {
    if (autoUpdateEnabled && currentChatId && updateInterval > 0) {
      intervalRef.current = setInterval(() => {
        autoUpdate();
      }, updateInterval);
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    }

    // Cleanup on unmount or dependency change
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [autoUpdateEnabled, currentChatId, updateInterval, autoUpdate]);

  // Cleanup interval when chat changes
  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [currentChatId]);

  return {
    // Manual functions
    refetch,
    isRefetching,

    // Auto update functions
    autoUpdate,
    isAutoUpdating,
    autoUpdateEnabled,
    toggleAutoUpdate,

    // Combined loading state
    isUpdating: isRefetching || isAutoUpdating
  };
};