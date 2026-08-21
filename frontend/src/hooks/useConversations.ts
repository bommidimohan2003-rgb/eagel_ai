import { useState, useEffect, useCallback } from 'react';
import { conversationService } from '@/services/conversations';
import { Conversation } from '@/types';

export function useConversations() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  const loadConversations = useCallback(async () => {
    try {
      setIsLoading(true);
      const list = await conversationService.list();
      setConversations(list);
    } catch (err) {
      console.error('Failed to load conversations:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadConversations();
  }, [loadConversations]);

  const createConversation = async (title?: string) => {
    try {
      const newConv = await conversationService.create(title);
      setConversations((prev) => [newConv, ...prev]);
      setActiveConversationId(newConv.id);
      return newConv;
    } catch (err) {
      console.error('Failed to create conversation:', err);
      throw err;
    }
  };

  const updateConversationTitle = async (id: string, title: string) => {
    try {
      const updated = await conversationService.update(id, { title });
      setConversations((prev) => prev.map((c) => (c.id === id ? updated : c)));
    } catch (err) {
      console.error('Failed to rename conversation:', err);
    }
  };

  const updateTitleOptimistic = (id: string, title: string) => {
    setConversations((prev) => prev.map((c) => (c.id === id ? { ...c, title } : c)));
  };

  const deleteConversation = async (id: string) => {
    try {
      await conversationService.delete(id);
      setConversations((prev) => prev.filter((c) => c.id !== id));
      if (activeConversationId === id) {
        setActiveConversationId(null);
      }
    } catch (err) {
      console.error('Failed to delete conversation:', err);
    }
  };

  const filteredConversations = conversations.filter((c) =>
    c.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return {
    conversations: filteredConversations,
    allConversations: conversations,
    activeConversationId,
    setActiveConversationId,
    isLoading,
    searchQuery,
    setSearchQuery,
    loadConversations,
    createConversation,
    updateConversationTitle,
    updateTitleOptimistic,
    deleteConversation,
  };
}
