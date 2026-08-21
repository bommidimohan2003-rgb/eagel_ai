import { useEffect } from 'react';

interface KeyboardShortcutsOptions {
  onNewChat?: () => void;
  onSearchFocus?: () => void;
  onEscape?: () => void;
}

export function useKeyboardShortcuts({
  onNewChat,
  onSearchFocus,
  onEscape,
}: KeyboardShortcutsOptions) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ctrl+Shift+O / Cmd+Shift+O -> New Chat
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && (e.key === 'O' || e.key === 'o')) {
        e.preventDefault();
        onNewChat?.();
      }

      // Ctrl+K / Cmd+K -> Search
      if ((e.ctrlKey || e.metaKey) && (e.key === 'k' || e.key === 'K')) {
        e.preventDefault();
        onSearchFocus?.();
      }

      // Escape -> Cancel / Close
      if (e.key === 'Escape') {
        onEscape?.();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onNewChat, onSearchFocus, onEscape]);
}
