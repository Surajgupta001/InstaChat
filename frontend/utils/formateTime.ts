export function formatTime(isoString: string | null): string {
    if (!isoString) return ''
    const date = new Date(isoString);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const diffInMinutes = Math.floor(diff / (1000 * 60));
    const diffInHours = Math.floor(diff / (1000 * 60 * 60));
    const diffInDays = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (diffInMinutes < 1) return 'Just now';
    if (diffInHours < 1) return `${diffInMinutes}m ago`;
    if (diffInDays < 1) {
        return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true });
    }
    if (diffInDays === 1) return 'Yesterday';
    if (diffInDays < 7) {
        return date.toLocaleDateString([], { weekday: 'short' });
    }

    return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
}