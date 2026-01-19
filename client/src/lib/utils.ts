import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function getProxiedImageUrl(url: string | null | undefined): string {
  if (!url || !url.trim()) return '/images/default-channel.png'; // Fallback image if needed, or handle in component

  const trimmedUrl = url.trim();

  // Proxy HTTP URLs to avoid Mixed Content
  // Note: HTTPS URLs are safe, but HTTP URLs will be blocked by modern browsers on HTTPS sites
  if (trimmedUrl.toLowerCase().startsWith('http://')) {
    return `/api/proxy/image?url=${encodeURIComponent(trimmedUrl)}`;
  }

  return trimmedUrl;
}
