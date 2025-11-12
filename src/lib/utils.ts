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

// Get initials from a name or phone number
export function getInitials(name: string | null, phoneNumber: string): string {
  if (name && name.trim()) {
    const parts = name.trim().split(/\s+/);
    if (parts.length >= 2) {
      return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  }
  // For phone numbers, use last 2 digits
  const digits = phoneNumber.replace(/\D/g, '');
  return digits.slice(-2);
}

// Get display name with fallback
export function getDisplayName(contextName: string | null, displayName: string | null, phoneNumber: string): string {
  if (contextName && contextName.trim()) return contextName;
  if (displayName && displayName.trim()) return displayName;
  return phoneNumber;
}
