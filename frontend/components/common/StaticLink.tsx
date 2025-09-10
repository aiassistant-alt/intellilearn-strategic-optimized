/**
 * @fileoverview Static Export Compatible Link Component
 * @created 2025-08-02
 * 
 * @description
 * Custom Link component that handles Next.js static export routing correctly.
 * Automatically appends .html extension for internal navigation while preserving
 * Next.js Link behavior for prefetching and client-side navigation.
 */

'use client'
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import React from 'react';

interface StaticLinkProps {
  href: string;
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
  onClick?: (e: React.MouseEvent<HTMLAnchorElement>) => void;
}

/**
 * Static Export Compatible Link Component
 * 
 * Handles navigation in Next.js static export mode by:
 * 1. Using router.push() for programmatic navigation with .html
 * 2. Preventing default Link behavior that might cause issues
 * 3. Maintaining all styling and UX features
 */
export const StaticLink: React.FC<StaticLinkProps> = ({ 
  href, 
  children, 
  className, 
  style,
  onClick 
}) => {
  const router = useRouter();

  const handleClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault();
    
    // Call custom onClick if provided
    if (onClick) {
      onClick(e);
    }

    // Handle navigation with .html extension for internal routes
    if (href.startsWith('/') && !href.includes('.html')) {
      // Special handling for root paths
      if (href === '/') {
        window.location.href = '/index.html';
      } else if (href === '/dashboard') {
        window.location.href = '/dashboard.html';
      } else if (href.startsWith('/dashboard/')) {
        // For dashboard sub-routes, use direct navigation
        const subPath = href.replace('/dashboard/', '');
        window.location.href = `/dashboard/${subPath}.html`;
      } else if (href.startsWith('/auth/')) {
        // For auth routes, navigate properly
        const authPath = href.replace('/auth/', '');
        window.location.href = `/auth/${authPath}.html`;
      } else {
        // For other routes, append .html
        window.location.href = `${href}.html`;
      }
    } else {
      // External links or already has .html
      window.location.href = href;
    }
  };

  return (
    <a 
      href={href}
      onClick={handleClick}
      className={className}
      style={style}
    >
      {children}
    </a>
  );
};