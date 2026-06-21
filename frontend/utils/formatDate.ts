export function formatDateSeparator(isoString: string): string {
    const date = new Date(isoString);
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const messageDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    const diffDays = Math.floor((today.getTime() - messageDate.getTime()) / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) {
        return date.toLocaleDateString([], { weekday: 'long' });
    }
    return date.toLocaleDateString([], { month: 'long', day: 'numeric', year: 'numeric' });
}

export function isSameDay(iso1: string, iso2: string): boolean {
    const d1 = new Date(iso1);
    const d2 = new Date(iso2);
    return (
        d1.getFullYear() === d2.getFullYear() &&
        d1.getMonth() === d2.getMonth() &&
        d1.getDate() === d2.getDate()
    );
}
