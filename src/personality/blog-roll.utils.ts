/**
 * Converts a unix timestamp into a UTC-fomratted date string
 *
 * @param timestamp unix timestamp
 */
export function formatTimestamp(timestamp: number): string {
  const date = new Date(timestamp * 1000);
  const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']
  return `${date.getUTCDate()} ${months[date.getUTCMonth()]} ${date.getUTCFullYear()}`;
}

/**
 * Calculates an estimated read time of a text
 *
 * @param content text content to assess
 */
export function calculateReadTime(content: string): string {
  const wordCount = content.match(/\w+/g).length;
  const wordPerMin = 200;
  const estimatedTime = Math.round(wordCount / wordPerMin);
  const formattedTime = estimatedTime > 0 ? estimatedTime : 'less than a';

  return `${formattedTime} min read`;
}
