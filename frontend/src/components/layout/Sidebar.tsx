import React, { useState, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Calendar,
  Edit2,
  Image as ImageIcon,
  LogOut,
  MessageSquare,
  MoreVertical,
  Plus,
  Search,
  Settings,
  Sparkles,
  Trash2,
  User as UserIcon,
  X,
} from 'lucide-react';
import { Dialog } from '@/components/ui/Dialog';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { useAuth } from '@/hooks/useAuth';
import { Conversation } from '@/types';
import { cn } from '@/lib/utils';

interface SidebarProps {
  conversations: Conversation[];
  activeId: string | null;
  onSelectConversation: (id: string) => void;
  onNewChat: () => void;
  onRename: (id: string, newTitle: string) => void;
  onDelete: (id: string) => void;
  searchQuery: string;
  onSearchChange: (q: string) => void;
  isOpenMobile?: boolean;
  onCloseMobile?: () => void;
}

function groupConversationsByDate(conversations: Conversation[]) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  const last7Days = new Date(today);
  last7Days.setDate(last7Days.getDate() - 7);

  const groups: { [key: string]: Conversation[] } = {
    Today: [],
    Yesterday: [],
    'Previous 7 Days': [],
    Older: [],
  };

  conversations.forEach((conv) => {
    const d = new Date(conv.updated_at || conv.created_at);
    d.setHours(0, 0, 0, 0);

    if (d.getTime() >= today.getTime()) {
      groups.Today.push(conv);
    } else if (d.getTime() >= yesterday.getTime()) {
      groups.Yesterday.push(conv);
    } else if (d.getTime() >= last7Days.getTime()) {
      groups['Previous 7 Days'].push(conv);
    } else {
      groups.Older.push(conv);
    }
  });

  return groups;
}

export function Sidebar({
  conversations,
  activeId,
  onSelectConversation,
  onNewChat,
  onRename,
  onDelete,
  searchQuery,
  onSearchChange,
  isOpenMobile,
  onCloseMobile,
}: SidebarProps) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Modals state
  const [editingConv, setEditingConv] = useState<Conversation | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [deletingConv, setDeletingConv] = useState<Conversation | null>(null);
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);

  const handleOpenRename = (conv: Conversation, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingConv(conv);
    setEditTitle(conv.title);
    setActiveMenuId(null);
  };

  const handleSaveRename = () => {
    if (editingConv && editTitle.trim()) {
      onRename(editingConv.id, editTitle.trim());
      setEditingConv(null);
    }
  };

  const handleOpenDelete = (conv: Conversation, e: React.MouseEvent) => {
    e.stopPropagation();
    setDeletingConv(conv);
    setActiveMenuId(null);
  };

  const handleConfirmDelete = () => {
    if (deletingConv) {
      onDelete(deletingConv.id);
      setDeletingConv(null);
    }
  };

  const grouped = groupConversationsByDate(conversations);

  return (
    <>
      {/* Mobile Backdrop */}
      <AnimatePresence>
        {isOpenMobile && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onCloseMobile}
            className="fixed inset-0 bg-black/70 backdrop-blur-md z-30 md:hidden"
          />
        )}
      </AnimatePresence>

      <aside
        className={cn(
          'fixed md:static inset-y-0 left-0 z-40 w-72 md:w-64 lg:w-72 bg-surface-300 md:bg-surface-200 border-r border-border flex flex-col transition-transform duration-300 ease-in-out backdrop-blur-xl',
          isOpenMobile ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        )}
      >
        {/* Workspace Brand Header */}
        <div className="p-4 border-b border-border flex items-center justify-between">
          <Link to="/chat" className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-primary/30 to-primary/10 border border-primary/40 flex items-center justify-center text-primary shadow-sm">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h1 className="text-sm font-bold text-text-primary tracking-tight leading-none">
                Eagle AI
              </h1>
              <p className="text-[11px] text-text-muted mt-0.5 font-medium">Personal Workspace</p>
            </div>
          </Link>
          {isOpenMobile && (
            <button
              onClick={onCloseMobile}
              className="p-1 rounded-lg text-text-muted hover:text-text-primary md:hidden"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Action Controls */}
        <div className="p-3 space-y-2">
          {/* New Chat Button */}
          <Button
            onClick={() => {
              onNewChat();
              onCloseMobile?.();
            }}
            variant="primary"
            className="w-full justify-between py-2.5 transition-all duration-200 font-semibold"
          >
            <span className="flex items-center gap-2 text-xs">
              <Plus className="w-4 h-4 stroke-[2.5]" />
              New Conversation
            </span>
            <kbd className="hidden lg:inline px-1.5 py-0.5 rounded bg-black/20 text-[10px] font-mono font-normal">
              Ctrl+Shift+O
            </kbd>
          </Button>

          {/* AI Image Studio / Gallery Link */}
          <Link
            to="/images"
            onClick={() => onCloseMobile?.()}
            className="flex items-center justify-between px-3 py-2 rounded-xl bg-purple-500/10 hover:bg-purple-500/20 border border-purple-500/30 text-purple-400 hover:text-purple-300 text-xs font-semibold transition-all group"
          >
            <span className="flex items-center gap-2">
              <ImageIcon className="w-4 h-4 text-purple-400 group-hover:scale-110 transition-transform" />
              <span>Image Gallery</span>
            </span>
            <span className="px-1.5 py-0.5 rounded-full bg-purple-500/20 text-[10px] font-mono font-bold">
              AI
            </span>
          </Link>

          {/* Search Box */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
            <input
              ref={searchInputRef}
              type="text"
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="Search conversations..."
              className="w-full pl-8 pr-8 py-2 rounded-xl bg-surface-100 border border-border text-xs text-text-primary placeholder:text-text-muted focus:outline-none focus:border-primary/50 focus:bg-surface-50 transition-all"
            />
            {searchQuery && (
              <button
                onClick={() => onSearchChange('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-primary p-0.5"
              >
                <X className="w-3 h-3" />
              </button>
            )}
          </div>
        </div>

        {/* Conversation List with Chronological Grouping */}
        <div className="flex-1 overflow-y-auto px-2 py-1 space-y-4 scrollbar-thin">
          {conversations.length === 0 ? (
            <div className="px-3 py-10 text-center text-xs text-text-muted">
              {searchQuery ? 'No matching conversations' : 'No conversations yet'}
            </div>
          ) : searchQuery ? (
            // Flat list when searching
            <div className="space-y-1">
              <div className="px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-text-muted">
                Search Results ({conversations.length})
              </div>
              {conversations.map((conv) => (
                <ConversationItem
                  key={conv.id}
                  conv={conv}
                  isActive={activeId === conv.id}
                  activeMenuId={activeMenuId}
                  setActiveMenuId={setActiveMenuId}
                  onSelect={() => {
                    onSelectConversation(conv.id);
                    onCloseMobile?.();
                  }}
                  onOpenRename={(e) => handleOpenRename(conv, e)}
                  onOpenDelete={(e) => handleOpenDelete(conv, e)}
                />
              ))}
            </div>
          ) : (
            // Date-grouped sections
            Object.entries(grouped).map(([groupTitle, list]) => {
              if (list.length === 0) return null;
              return (
                <div key={groupTitle} className="space-y-1">
                  <div className="px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-text-muted">
                    {groupTitle}
                  </div>
                  {list.map((conv) => (
                    <ConversationItem
                      key={conv.id}
                      conv={conv}
                      isActive={activeId === conv.id}
                      activeMenuId={activeMenuId}
                      setActiveMenuId={setActiveMenuId}
                      onSelect={() => {
                        onSelectConversation(conv.id);
                        onCloseMobile?.();
                      }}
                      onOpenRename={(e) => handleOpenRename(conv, e)}
                      onOpenDelete={(e) => handleOpenDelete(conv, e)}
                    />
                  ))}
                </div>
              );
            })
          )}
        </div>

        {/* User Profile Footer */}
        <div className="p-3 border-t border-border bg-surface-300">
          <div className="flex items-center justify-between">
            <Link to="/profile" className="flex items-center gap-2.5 min-w-0 hover:opacity-80 transition-opacity">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-primary/30 to-primary/10 border border-primary/40 flex items-center justify-center text-primary text-xs font-bold uppercase flex-shrink-0 shadow-sm">
                {user?.full_name ? user.full_name[0] : user?.email?.[0] || 'U'}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-medium text-text-primary truncate">
                  {user?.full_name || user?.email}
                </p>
                <p className="text-[10px] text-text-muted truncate">{user?.email}</p>
              </div>
            </Link>

            <div className="flex items-center gap-1">
              <Link
                to="/profile"
                className="p-1.5 rounded-lg text-text-muted hover:text-text-primary hover:bg-surface-100 transition-colors"
                title="Profile"
              >
                <UserIcon className="w-4 h-4" />
              </Link>
              <Link
                to="/settings"
                className="p-1.5 rounded-lg text-text-muted hover:text-text-primary hover:bg-surface-100 transition-colors"
                title="Settings"
              >
                <Settings className="w-4 h-4" />
              </Link>
              <button
                onClick={() => logout()}
                className="p-1.5 rounded-lg text-text-muted hover:text-red-400 hover:bg-surface-100 transition-colors"
                title="Sign out"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </aside>

      {/* Rename Dialog */}
      <Dialog
        isOpen={!!editingConv}
        onClose={() => setEditingConv(null)}
        title="Rename Conversation"
      >
        <div className="space-y-4">
          <Input
            value={editTitle}
            onChange={(e) => setEditTitle(e.target.value)}
            placeholder="Conversation title"
            autoFocus
          />
          <div className="flex justify-end gap-2">
            <Button variant="ghost" onClick={() => setEditingConv(null)}>
              Cancel
            </Button>
            <Button variant="primary" onClick={handleSaveRename}>
              Save
            </Button>
          </div>
        </div>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog
        isOpen={!!deletingConv}
        onClose={() => setDeletingConv(null)}
        title="Delete Conversation"
        description="Are you sure you want to delete this conversation? All messages will be permanently deleted."
      >
        <div className="flex justify-end gap-2 mt-4">
          <Button variant="ghost" onClick={() => setDeletingConv(null)}>
            Cancel
          </Button>
          <Button variant="danger" onClick={handleConfirmDelete}>
            Delete
          </Button>
        </div>
      </Dialog>
    </>
  );
}

function ConversationItem({
  conv,
  isActive,
  activeMenuId,
  setActiveMenuId,
  onSelect,
  onOpenRename,
  onOpenDelete,
}: {
  conv: Conversation;
  isActive: boolean;
  activeMenuId: string | null;
  setActiveMenuId: (id: string | null) => void;
  onSelect: () => void;
  onOpenRename: (e: React.MouseEvent) => void;
  onOpenDelete: (e: React.MouseEvent) => void;
}) {
  return (
    <div
      onClick={onSelect}
      className={cn(
        'group relative flex items-center justify-between px-3 py-2.5 rounded-xl text-xs cursor-pointer transition-all duration-150',
        isActive
          ? 'bg-surface-50 text-text-primary font-semibold border border-primary/40 shadow-sm'
          : 'text-text-secondary hover:bg-surface-100 hover:text-text-primary'
      )}
    >
      <div className="flex items-center gap-2.5 min-w-0 flex-1">
        <MessageSquare
          className={cn(
            'w-3.5 h-3.5 flex-shrink-0 transition-colors',
            isActive ? 'text-primary' : 'text-text-muted group-hover:text-text-secondary'
          )}
        />
        <span className="truncate">{conv.title || 'Untitled'}</span>
      </div>

      <div className="flex items-center gap-1">
        {isActive && <div className="w-1.5 h-1.5 rounded-full bg-primary" />}

        <div className="relative">
          <button
            onClick={(e) => {
              e.stopPropagation();
              setActiveMenuId(activeMenuId === conv.id ? null : conv.id);
            }}
            className="p-1 rounded-md opacity-0 group-hover:opacity-100 hover:bg-surface-200 text-text-muted hover:text-text-primary transition-opacity"
          >
            <MoreVertical className="w-3.5 h-3.5" />
          </button>

          {activeMenuId === conv.id && (
            <div
              onClick={(e) => e.stopPropagation()}
              className="absolute right-0 top-full mt-1 w-32 rounded-xl bg-surface-100 border border-border p-1 shadow-glass z-50 backdrop-blur-xl"
            >
              <button
                onClick={onOpenRename}
                className="w-full flex items-center gap-2 px-2.5 py-1.5 text-xs text-text-secondary hover:text-text-primary hover:bg-surface-50 rounded-lg text-left transition-colors"
              >
                <Edit2 className="w-3 h-3" />
                Rename
              </button>
              <button
                onClick={onOpenDelete}
                className="w-full flex items-center gap-2 px-2.5 py-1.5 text-xs text-red-400 hover:bg-red-500/10 rounded-lg text-left transition-colors"
              >
                <Trash2 className="w-3 h-3" />
                Delete
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
