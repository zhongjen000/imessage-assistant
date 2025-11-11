import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Format iMessage timestamp (nanoseconds since 2001-01-01)
export function formatIMessageTimestamp(timestamp: number): Date {
  // iMessage timestamps are in nanoseconds since 2001-01-01
  const APPLE_EPOCH = new Date('2001-01-01T00:00:00Z').getTime();
  return new Date(APPLE_EPOCH + timestamp / 1000000);
}

// Format date for display
export function formatMessageDate(date: Date): string {
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const daysDiff = Math.floor(diff / (1000 * 60 * 60 * 24));

  if (daysDiff === 0) {
    return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
  } else if (daysDiff === 1) {
    return 'Yesterday';
  } else if (daysDiff < 7) {
    return date.toLocaleDateString('en-US', { weekday: 'long' });
  } else {
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  }
}
