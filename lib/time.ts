/**
 * Timezone Utility for Indian Standard Time (IST — Asia/Kolkata)
 */

export function formatIST(date: Date | string | null | undefined, includeTime = true): string {
  if (!date) return 'N/A';
  
  const d = typeof date === 'string' ? new Date(date) : date;
  if (isNaN(d.getTime())) return 'N/A';

  const options: Intl.DateTimeFormatOptions = {
    timeZone: 'Asia/Kolkata',
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    ...(includeTime && {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    }),
  };

  const formatted = new Intl.DateTimeFormat('en-IN', options).format(d);
  return includeTime ? `${formatted} IST` : formatted;
}
