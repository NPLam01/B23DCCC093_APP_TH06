import { useState, useEffect, useCallback } from 'react';
import {
  subscribeMessages,
  sendTextMessage,
  sendLocationMessage,
  markConversationAsRead,
} from '../services/chatService';
import { getCurrentLocation } from '../services/locationService';
import { Message } from '../types';

export const useChat = (chatId: string, currentUid?: string, otherUid?: string) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isSending, setIsSending] = useState<boolean>(false);
  const [isSendingLocation, setIsSendingLocation] = useState<boolean>(false);

  // Subscribe to messages and cleanup listener
  useEffect(() => {
    if (!chatId) return;

    setIsLoading(true);
    const unsubscribe = subscribeMessages(chatId, newMessages => {
      setMessages(newMessages);
      setIsLoading(false);
    });

    return () => {
      unsubscribe();
    };
  }, [chatId]);

  // Mark conversation as read on entry and when new messages arrive
  useEffect(() => {
    if (currentUid && chatId) {
      markConversationAsRead(currentUid, chatId);
    }
  }, [currentUid, chatId, messages.length]);

  const sendText = useCallback(
    async (text: string) => {
      if (!currentUid || !otherUid || !text.trim()) return;
      try {
        setIsSending(true);
        await sendTextMessage(currentUid, otherUid, text);
      } catch (error) {
        console.error('Error sending message:', error);
        throw error;
      } finally {
        setIsSending(false);
      }
    },
    [currentUid, otherUid],
  );

  const sendLocation = useCallback(async () => {
    if (!currentUid || !otherUid) return;
    try {
      setIsSendingLocation(true);
      const coords = await getCurrentLocation();
      await sendLocationMessage(currentUid, otherUid, coords.latitude, coords.longitude);
    } catch (error) {
      console.error('Error sending location:', error);
      throw error;
    } finally {
      setIsSendingLocation(false);
    }
  }, [currentUid, otherUid]);

  return {
    messages,
    isLoading,
    isSending,
    isSendingLocation,
    sendText,
    sendLocation,
  };
};
