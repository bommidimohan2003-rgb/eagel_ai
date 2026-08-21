import React from 'react';
import { Link } from 'react-router-dom';
import { Bot, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/Button';

export function NotFoundPage() {
  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4 text-center">
      <div className="w-16 h-16 rounded-2xl bg-surface-100 border border-primary/40 flex items-center justify-center text-primary shadow-glow mb-4">
        <Bot className="w-8 h-8" />
      </div>
      <h2 className="text-2xl font-bold text-text-primary mb-2">Page Not Found</h2>
      <p className="text-sm text-text-muted max-w-sm mb-6">
        The workspace page or route you are looking for does not exist.
      </p>
      <Link to="/chat">
        <Button variant="primary" className="gap-2">
          <ArrowLeft className="w-4 h-4" />
          Return to Workspace
        </Button>
      </Link>
    </div>
  );
}
