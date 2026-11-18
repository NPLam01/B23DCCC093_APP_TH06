import { useState, useEffect, useCallback, useRef } from 'react';
import {
  subscribeMessages,
  loadOlderMessages,
  sendMessage,
  recallMessage,
  toggleReaction,
  setTypingStatus,
  subscribeTypingStatus,
  markConversationAsRead,
  subscribeReadStatus,
} from '../services/chatService';
import { getCurrentLocation } from '../services/locationService';
import { uploadImageToCloudinary } from '../services/uploadService';
import { Message } from '../types';

export const useChat = (
  chatId: string,
  currentUid?: string,
  currentUserName: string = 'Tôi',
) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isLoadingOlder, setIsLoadingOlder] = useState<boolean>(false);
  const [hasMoreOlder, setHasMoreOlder] = useState<boolean>(true);
  const [isSending, setIsSending] = useState<boolean>(false);
  const [isSendingLocation, setIsSendingLocation] = useState<boolean>(false);
  const [typingUids, setTypingUids] = useState<string[]>([]);
  const [readStatusMap, setReadStatusMap] = useState<Record<string, number>>({});

  const typingTimerRef = useRef<any>(null);
  const isTypingRef = useRef<boolean>(false);

  // 1. Subscribe to recent 20 messages
  useEffect(() => {
    if (!chatId) return;

    setIsLoading(true);
    const unsubscribe = subscribeMessages(chatId, latestMessages => {
      setMessages(prev => {
        // Merge with any local pending temporary upload messages
        const localUploads = prev.filter(m => m.uploadStatus && m.uploadStatus !== 'success');
        const map = new Map<string, Message>();
        latestMessages.forEach(m => map.set(m.id, m));
        localUploads.forEach(m => {
          if (!map.has(m.id)) {
            map.set(m.id, m);
          }
        });
        const combined = Array.from(map.values());
        combined.sort((a, b) => a.createdAt - b.createdAt);
        return combined;
      });
      setIsLoading(false);
    }, 20);

    return () => {
      unsubscribe();
    };
  }, [chatId]);

  // 2. Subscribe to typing status
  useEffect(() => {
    if (!chatId || !currentUid) return;
    const unsubscribe = subscribeTypingStatus(chatId, currentUid, setTypingUids);
    return () => {
      unsubscribe();
      // Tắt trạng thái typing khi rời màn hình
      isTypingRef.current = false;
      setTypingStatus(chatId, currentUid, false);
      if (typingTimerRef.current) clearTimeout(typingTimerRef.current);
    };
  }, [chatId, currentUid]);

  // 3. Subscribe to read status (để biết tin nhắn đã được xem hay chưa)
  useEffect(() => {
    if (!chatId) return;
    const unsubscribe = subscribeReadStatus(chatId, setReadStatusMap);
    return () => {
      unsubscribe();
    };
  }, [chatId]);

  // 4. Mark conversation as read on entry and when new messages arrive
  useEffect(() => {
    if (currentUid && chatId) {
      markConversationAsRead(chatId, currentUid);
    }
  }, [currentUid, chatId, messages.length]);

  // 5. Tải thêm tin nhắn cũ hơn khi cuộn lên đầu (limitToLast(20))
  const loadMore = useCallback(async () => {
    if (isLoadingOlder || !hasMoreOlder || messages.length === 0) return;
    try {
      setIsLoadingOlder(true);
      const oldestMsg = messages[0];
      const older = await loadOlderMessages(chatId, oldestMsg.id, 20);
      if (older.length === 0) {
        setHasMoreOlder(false);
      } else {
        setMessages(prev => {
          const map = new Map<string, Message>();
          older.forEach(m => map.set(m.id, m));
          prev.forEach(m => map.set(m.id, m));
          const list = Array.from(map.values());
          list.sort((a, b) => a.createdAt - b.createdAt);
          return list;
        });
      }
    } catch (error) {
      console.warn('Error loading older messages:', error);
    } finally {
      setIsLoadingOlder(false);
    }
  }, [chatId, hasMoreOlder, isLoadingOlder, messages]);

  // 6. Xử lý gõ văn bản: tự tắt sau 3 giây không gõ, khi gửi tin hoặc khi rời màn hình
  const handleTyping = useCallback(
    (isTyping: boolean = true) => {
      if (!chatId || !currentUid) return;

      if (typingTimerRef.current) {
        clearTimeout(typingTimerRef.current);
      }

      if (!isTyping) {
        if (isTypingRef.current) {
          isTypingRef.current = false;
          setTypingStatus(chatId, currentUid, false);
        }
        return;
      }

      // Chỉ gửi request setTypingStatus(true) khi chuyển từ false sang true
      if (!isTypingRef.current) {
        isTypingRef.current = true;
        setTypingStatus(chatId, currentUid, true);
      }

      // Hẹn giờ tự tắt sau 3 giây không có thao tác gõ
      typingTimerRef.current = setTimeout(() => {
        isTypingRef.current = false;
        setTypingStatus(chatId, currentUid, false);
      }, 3000);
    },
    [chatId, currentUid],
  );

  // 7. Gửi tin nhắn text
  const sendText = useCallback(
    async (text: string) => {
      if (!currentUid || !text.trim()) return;
      try {
        setIsSending(true);
        if (typingTimerRef.current) clearTimeout(typingTimerRef.current);
        isTypingRef.current = false;
        setTypingStatus(chatId, currentUid, false);
        await sendMessage({
          convId: chatId,
          senderId: currentUid,
          senderName: currentUserName,
          text: text.trim(),
          type: 'text',
        });
      } catch (error) {
        console.error('Error sending message:', error);
        throw error;
      } finally {
        setIsSending(false);
      }
    },
    [chatId, currentUid, currentUserName],
  );

  // 8. Gửi vị trí
  const sendLocation = useCallback(async () => {
    if (!currentUid) return;
    try {
      setIsSendingLocation(true);
      const coords = await getCurrentLocation();
      await sendMessage({
        convId: chatId,
        senderId: currentUid,
        senderName: currentUserName,
        type: 'location',
        latitude: coords.latitude,
        longitude: coords.longitude,
      });
    } catch (error) {
      console.error('Error sending location:', error);
      throw error;
    } finally {
      setIsSendingLocation(false);
    }
  }, [chatId, currentUid, currentUserName]);

  // 9. Gửi ảnh: hiển thị bong bóng tạm thời, upload lên Cloudinary, hỗ trợ Thử lại nếu lỗi
  const sendImage = useCallback(
    async (localUri: string) => {
      if (!currentUid || !localUri) return;
      const tempId = `temp_${Date.now()}`;
      const tempMessage: Message = {
        id: tempId,
        senderId: currentUid,
        senderName: currentUserName,
        text: '📷 Hình ảnh',
        type: 'image',
        createdAt: Date.now(),
        localUri,
        uploadStatus: 'uploading',
      };

      // Thêm ngay bong bóng tạm vào UI với spinner loading
      setMessages(prev => [...prev, tempMessage]);

      const doUpload = async () => {
        try {
          const uploadedUrl = await uploadImageToCloudinary(localUri);
          // Gửi tin thật lên Realtime Database
          await sendMessage({
            convId: chatId,
            senderId: currentUid,
            senderName: currentUserName,
            type: 'image',
            imageUrl: uploadedUrl,
          });
          // Xóa bong bóng tạm sau khi thành công
          setMessages(prev => prev.filter(m => m.id !== tempId));
        } catch (uploadError: any) {
          console.warn('Upload image failed:', uploadError?.message || uploadError);
          // Đánh dấu bong bóng tạm là lỗi để hiển thị nút "Thử lại"
          setMessages(prev =>
            prev.map(m => (m.id === tempId ? { ...m, uploadStatus: 'failed' } : m)),
          );
        }
      };

      await doUpload();
    },
    [chatId, currentUid, currentUserName],
  );

  // Thử lại upload ảnh bị lỗi
  const retryImageUpload = useCallback(
    async (tempId: string) => {
      const msg = messages.find(m => m.id === tempId);
      if (!msg || !msg.localUri || !currentUid) return;

      setMessages(prev =>
        prev.map(m => (m.id === tempId ? { ...m, uploadStatus: 'uploading' } : m)),
      );

      try {
        const uploadedUrl = await uploadImageToCloudinary(msg.localUri);
        await sendMessage({
          convId: chatId,
          senderId: currentUid,
          senderName: currentUserName,
          type: 'image',
          imageUrl: uploadedUrl,
        });
        setMessages(prev => prev.filter(m => m.id !== tempId));
      } catch (err) {
        setMessages(prev =>
          prev.map(m => (m.id === tempId ? { ...m, uploadStatus: 'failed' } : m)),
        );
      }
    },
    [chatId, currentUid, currentUserName, messages],
  );

  // 10. Thu hồi tin nhắn
  const recall = useCallback(
    async (msgId: string) => {
      if (!currentUid) return;
      await recallMessage(chatId, msgId, currentUid);
    },
    [chatId, currentUid],
  );

  // 11. Thả cảm xúc
  const react = useCallback(
    async (msgId: string, emoji: string) => {
      if (!currentUid) return;
      await toggleReaction(chatId, msgId, currentUid, currentUserName, emoji);
    },
    [chatId, currentUid, currentUserName],
  );

  return {
    messages,
    isLoading,
    isLoadingOlder,
    hasMoreOlder,
    loadMore,
    isSending,
    isSendingLocation,
    typingUids,
    readStatusMap,
    handleTyping,
    sendText,
    sendLocation,
    sendImage,
    retryImageUpload,
    recall,
    react,
  };
};
