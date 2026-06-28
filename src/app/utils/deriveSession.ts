export type Session = 'EARLY_MORNING' | 'MIDDAY' | 'AFTERNOON' | 'TWILIGHT';

// Buckets match the website's explore-clubs sidebar filters exactly:
// Early Morning (6am-9am) / Midday (9am-2pm) / Afternoon (2pm-5pm) / Twilight (after 5pm)
export const deriveSession = (startTime: string): Session => {
  const [hourStr] = startTime.split(':');
  const hour = Number(hourStr);

  if (hour >= 6 && hour < 9) return 'EARLY_MORNING';
  if (hour >= 9 && hour < 14) return 'MIDDAY';
  if (hour >= 14 && hour < 17) return 'AFTERNOON';
  return 'TWILIGHT';
};
