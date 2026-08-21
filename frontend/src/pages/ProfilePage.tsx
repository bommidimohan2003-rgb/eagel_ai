import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Calendar, LogOut, Mail, Shield, User as UserIcon } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { useAuth } from '@/hooks/useAuth';
import { useSEO } from '@/hooks/useSEO';

export function ProfilePage() {
  useSEO({
    title: 'User Profile',
    description: 'Manage personal intelligence account information and security.',
  });

  const { user, logout } = useAuth();

  return (
    <div className="min-h-screen bg-background bg-grid overflow-y-auto p-4 md:p-8 relative">
      <div className="max-w-2xl mx-auto relative z-10">
        {/* Top Navigation */}
        <div className="flex items-center justify-between pb-6 border-b border-border mb-8">
          <div className="flex items-center gap-3.5">
            <Link
              to="/chat"
              className="p-2.5 rounded-2xl bg-surface-100 border border-border text-text-secondary hover:text-text-primary hover:border-primary/40 transition-all hover:scale-105"
            >
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div>
              <h1 className="text-xl md:text-2xl font-bold text-text-primary tracking-tight">
                User Profile
              </h1>
              <p className="text-xs text-text-muted mt-0.5">
                Manage your account details and security settings
              </p>
            </div>
          </div>
        </div>

        {/* Profile Card */}
        <div className="bg-surface-100 p-6 md:p-8 rounded-3xl border border-border shadow-glass backdrop-blur-xl space-y-6">
          <div className="flex items-center gap-4 pb-6 border-b border-border">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-primary/30 to-accent/30 border border-primary/40 flex items-center justify-center text-primary text-2xl font-bold uppercase shadow-glow">
              {user?.full_name ? user.full_name[0] : user?.email?.[0] || 'U'}
            </div>
            <div>
              <h2 className="text-lg font-bold text-text-primary">{user?.full_name || 'Personal User'}</h2>
              <p className="text-xs text-text-muted mt-0.5">{user?.email}</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="p-4 rounded-2xl bg-surface-200 border border-border">
              <div className="flex items-center gap-2 text-text-muted text-xs mb-1">
                <Mail className="w-4 h-4 text-primary" />
                <span>Email Address</span>
              </div>
              <p className="text-sm font-semibold text-text-primary">{user?.email}</p>
            </div>

            <div className="p-4 rounded-2xl bg-surface-200 border border-border">
              <div className="flex items-center gap-2 text-text-muted text-xs mb-1">
                <Shield className="w-4 h-4 text-accent" />
                <span>Account Status</span>
              </div>
              <p className="text-sm font-semibold text-text-primary">
                {user?.is_active ? 'Active & Verified' : 'Inactive'}
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-surface-200 border border-border">
              <div className="flex items-center gap-2 text-text-muted text-xs mb-1">
                <UserIcon className="w-4 h-4 text-accent-purple" />
                <span>Full Name</span>
              </div>
              <p className="text-sm font-semibold text-text-primary">{user?.full_name || 'Not specified'}</p>
            </div>

            <div className="p-4 rounded-2xl bg-surface-200 border border-border">
              <div className="flex items-center gap-2 text-text-muted text-xs mb-1">
                <Calendar className="w-4 h-4 text-sky-500" />
                <span>Member Since</span>
              </div>
              <p className="text-sm font-semibold text-text-primary">
                {user?.created_at ? new Date(user.created_at).toLocaleDateString() : 'Recent'}
              </p>
            </div>
          </div>

          <div className="flex justify-end pt-4 border-t border-border">
            <Button variant="danger" onClick={() => logout()} className="gap-2">
              <LogOut className="w-4 h-4" />
              Sign Out of Workspace
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
