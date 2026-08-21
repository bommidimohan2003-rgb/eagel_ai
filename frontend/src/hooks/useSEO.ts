import { useEffect } from 'react';

interface SEOProps {
  title?: string;
  description?: string;
}

export function useSEO({ title, description }: SEOProps) {
  useEffect(() => {
    const defaultTitle = 'Eagle AI — Personal Intelligent Assistant & Workspace';
    document.title = title ? `${title} | Eagle AI` : defaultTitle;

    if (description) {
      const metaDescription = document.querySelector('meta[name="description"]');
      if (metaDescription) {
        metaDescription.setAttribute('content', description);
      }
    }
  }, [title, description]);
}
