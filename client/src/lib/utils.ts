import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function getProxiedImageUrl(url: string | null | undefined): string {
  if (!url) return '/images/default-channel.png'; // Fallback image if needed, or handle in component

  if (url.startsWith('http://')) {
    return `/api/proxy/image?url=${encodeURIComponent(url)}`;
  }

  return url;
}
