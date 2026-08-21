import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { AppHeader } from '@/components/layout/AppHeader';
import { Sidebar } from '@/components/layout/Sidebar';
import { ChatWindow } from '@/components/chat/ChatWindow';
import { useConversations } from '@/hooks/useConversations';
import { useKeyboardShortcuts } from '@/hooks/useKeyboardShortcuts';
import { useSEO } from '@/hooks/useSEO';

export function ChatPage() {
  const { conversationId } = useParams<{ conversationId?: string }>();
  const navigate = useNavigate();
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  useSEO({
    title: 'Chat Workspace',
    description: 'Interact with Nemotron 3 Ultra for reasoning, code architecture, and multi-step tasks.',
  });

  const {
    conversations,
    activeConversationId,
    setActiveConversationId,
    searchQuery,
    setSearchQuery,
    updateConversationTitle,
    updateTitleOptimistic,
    deleteConversation,
  } = useConversations();

  // Sync route param with activeConversationId
  useEffect(() => {
    if (conversationId && conversationId !== activeConversationId) {
      setActiveConversationId(conversationId);
    } else if (!conversationId && activeConversationId) {
      setActiveConversationId(null);
    }
  }, [conversationId]);

  const handleSelectConversation = (id: string) => {
    setActiveConversationId(id);
    navigate(`/chat/${id}`);
  };

  const handleNewChat = () => {
    setActiveConversationId(null);
    navigate('/chat');
  };

  // Global Keyboard Shortcuts
  useKeyboardShortcuts({
    onNewChat: handleNewChat,
    onSearchFocus: () => {
      setMobileSidebarOpen(true);
    },
  });

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-background">
      {/* Responsive Sidebar */}
      <Sidebar
        conversations={conversations}
        activeId={activeConversationId}
        onSelectConversation={handleSelectConversation}
        onNewChat={handleNewChat}
        onRename={updateConversationTitle}
        onDelete={(id) => {
          deleteConversation(id);
          if (conversationId === id) {
            navigate('/chat');
          }
        }}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        isOpenMobile={mobileSidebarOpen}
        onCloseMobile={() => setMobileSidebarOpen(false)}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col h-full min-w-0 overflow-hidden">
        <AppHeader onToggleSidebar={() => setMobileSidebarOpen(!mobileSidebarOpen)} />
        <ChatWindow
          activeConversationId={activeConversationId}
          onConversationCreated={(id) => {
            setActiveConversationId(id);
            navigate(`/chat/${id}`, { replace: true });
          }}
          onTitleGenerated={(id, title) => updateTitleOptimistic(id, title)}
        />
      </div>
    </div>
  );
}
