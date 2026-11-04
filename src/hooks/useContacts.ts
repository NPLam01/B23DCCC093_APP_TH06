import { useState, useEffect, useMemo } from 'react';
import { subscribeUsers } from '../services/userService';
import { UserProfile } from '../types';

export const useContacts = (currentUid?: string) => {
  const [contacts, setContacts] = useState<UserProfile[]>([]);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    if (!currentUid) {
      setContacts([]);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    const unsubscribe = subscribeUsers(currentUid, users => {
      setContacts(users);
      setIsLoading(false);
    });

    return () => {
      unsubscribe();
    };
  }, [currentUid]);

  const filteredContacts = useMemo(() => {
    if (!searchQuery.trim()) return contacts;
    const q = searchQuery.toLowerCase().trim();
    return contacts.filter(
      u =>
        (u.name && u.name.toLowerCase().includes(q)) ||
        (u.email && u.email.toLowerCase().includes(q)),
    );
  }, [contacts, searchQuery]);

  return {
    contacts: filteredContacts,
    allContacts: contacts,
    searchQuery,
    setSearchQuery,
    isLoading,
  };
};
