import { useState, useEffect, useMemo } from 'react';
import { subscribeUserConversations } from '../services/chatService';
import { UserConversationItem } from '../types';

export const useConversations = (currentUid?: string) => {
  const [conversations, setConversations] = useState<UserConversationItem[]>([]);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    if (!currentUid) {
      setConversations([]);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    const unsubscribe = subscribeUserConversations(currentUid, convs => {
      setConversations(convs);
      setIsLoading(false);
    });

    return () => {
      unsubscribe();
    };
  }, [currentUid]);

  const totalUnread = useMemo(() => {
    return conversations.reduce((sum, c) => sum + (c.unreadCount || 0), 0);
  }, [conversations]);

  const filteredConversations = useMemo(() => {
    if (!searchQuery.trim()) return conversations;
    const q = searchQuery.toLowerCase().trim();
    return conversations.filter(c => {
      const groupName = c.name || '';
      const name = c.otherUser?.name || '';
      const email = c.otherUser?.email || '';
      const lastMsg = c.lastMessageText || '';
      return (
        groupName.toLowerCase().includes(q) ||
        name.toLowerCase().includes(q) ||
        email.toLowerCase().includes(q) ||
        lastMsg.toLowerCase().includes(q)
      );
    });
  }, [conversations, searchQuery]);

  return {
    conversations: filteredConversations,
    allConversations: conversations,
    totalUnread,
    searchQuery,
    setSearchQuery,
    isLoading,
  };
};
