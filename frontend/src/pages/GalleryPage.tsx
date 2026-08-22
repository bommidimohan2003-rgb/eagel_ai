import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AppHeader } from '@/components/layout/AppHeader';
import { Sidebar } from '@/components/layout/Sidebar';
import { ImageGallery } from '@/components/image-generation/ImageGallery';
import { useConversations } from '@/hooks/useConversations';
import { useSEO } from '@/hooks/useSEO';

export function GalleryPage() {
  const navigate = useNavigate();
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  useSEO({
    title: 'AI Image Studio & Gallery',
    description: 'Explore, manage, download, and inspect your AI generated visuals with Eagle AI.',
  });

  const {
    conversations,
    activeConversationId,
    setActiveConversationId,
    searchQuery,
    setSearchQuery,
    updateConversationTitle,
    deleteConversation,
  } = useConversations();

  const handleSelectConversation = (id: string) => {
    setActiveConversationId(id);
    navigate(`/chat/${id}`);
  };

  const handleNewChat = () => {
    setActiveConversationId(null);
    navigate('/chat');
  };

  const handleSelectPrompt = (prompt: string) => {
    navigate('/chat', { state: { initialPrompt: prompt, initialMode: 'image' } });
  };

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-background">
      {/* Responsive Sidebar */}
      <Sidebar
        conversations={conversations}
        activeId={activeConversationId}
        onSelectConversation={handleSelectConversation}
        onNewChat={handleNewChat}
        onRename={updateConversationTitle}
        onDelete={deleteConversation}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        isOpenMobile={mobileSidebarOpen}
        onCloseMobile={() => setMobileSidebarOpen(false)}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col h-full min-w-0 overflow-hidden bg-background bg-grid relative">
        {/* Dynamic Ambient Background Glows */}
        <div className="absolute -top-24 left-1/2 -translate-x-1/2 w-3/4 max-w-4xl h-72 bg-gradient-to-b from-purple-500/10 via-primary/5 to-transparent blur-3xl pointer-events-none rounded-full" />
        <div className="absolute bottom-10 right-10 w-96 h-96 bg-accent-purple/5 blur-[100px] pointer-events-none rounded-full" />

        <AppHeader onToggleSidebar={() => setMobileSidebarOpen(!mobileSidebarOpen)} />

        <ImageGallery
          onSelectPrompt={handleSelectPrompt}
          onNewGeneration={() => navigate('/chat', { state: { initialMode: 'image' } })}
        />
      </div>
    </div>
  );
}
