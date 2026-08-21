import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Menu, Moon, Settings as SettingsIcon, Sun, Zap } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useTheme } from '@/hooks/useTheme';

interface AppHeaderProps {
  onToggleSidebar?: () => void;
}

export function AppHeader({ onToggleSidebar }: AppHeaderProps) {
  const { user } = useAuth();
  const { theme, toggleTheme } = useTheme();

  return (
    <header className="h-14 border-b border-border bg-surface-200/80 backdrop-blur-xl px-4 flex items-center justify-between z-20 flex-shrink-0">
      <div className="flex items-center gap-3">
        {/* Mobile Sidebar Toggle */}
        <button
          onClick={onToggleSidebar}
          className="md:hidden p-2 rounded-xl text-text-secondary hover:text-text-primary hover:bg-surface-100 transition-all active:scale-95"
          title="Toggle sidebar menu"
        >
          <Menu className="w-5 h-5" />
        </button>

        {/* Model Status Badge */}
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-surface-100 border border-border text-xs shadow-sm hover:border-primary/40 transition-colors">
          <div className="relative flex items-center justify-center">
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            <span className="absolute w-3.5 h-3.5 rounded-full bg-emerald-500/30 animate-ping" />
          </div>
          <span className="font-semibold text-text-primary tracking-tight">Eagle 3 Ultra</span>
          <span className="hidden sm:inline px-1.5 py-0.5 rounded-md bg-surface-200 text-[10px] text-text-muted font-mono">
            550B
          </span>
          <span className="hidden md:flex items-center gap-1 text-[10px] text-emerald-500 font-medium pl-1 border-l border-border">
            <Zap className="w-2.5 h-2.5" />
            Active
          </span>
        </div>
      </div>

      <div className="flex items-center gap-2">
        {/* Dark / Light Theme Toggle */}
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={toggleTheme}
          className="p-2 rounded-xl text-text-secondary hover:text-text-primary hover:bg-surface-100 border border-transparent hover:border-border transition-all"
          title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
        >
          {theme === 'dark' ? (
            <Sun className="w-4 h-4 text-amber-400 hover:rotate-45 transition-transform" />
          ) : (
            <Moon className="w-4 h-4 text-primary hover:-rotate-12 transition-transform" />
          )}
        </motion.button>

        {/* Settings Button */}
        <Link
          to="/settings"
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs text-text-secondary hover:text-text-primary hover:bg-surface-100 border border-transparent hover:border-border transition-all"
          title="Workspace Settings"
        >
          <SettingsIcon className="w-4 h-4" />
          <span className="hidden sm:inline font-medium">Settings</span>
        </Link>

        {user && (
          <Link
            to="/profile"
            className="flex items-center gap-2 pl-2 border-l border-border hover:opacity-80 transition-opacity"
            title="User Profile"
          >
            <div className="w-7 h-7 rounded-xl bg-gradient-to-tr from-primary/30 to-primary/10 border border-primary/40 flex items-center justify-center text-primary text-xs font-bold uppercase shadow-sm">
              {user.full_name ? user.full_name[0] : user.email[0]}
            </div>
          </Link>
        )}
      </div>
    </header>
  );
}
