/**
 * Generates a unique, non-sequential complaint identifier.
 * Format: CIVIC-YYYY-XXXXX (alphanumeric uppercase, omitting ambiguous characters)
 */
export function generateComplaintId(): string {
  const year = new Date().getFullYear();
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // No 0/O, 1/I to prevent reading errors
  let randomPart = '';
  for (let i = 0; i < 5; i++) {
    const randomIndex = Math.floor(Math.random() * chars.length);
    randomPart += chars[randomIndex];
  }
  return `CIVIC-${year}-${randomPart}`;
}

export function isValidComplaintId(id: string): boolean {
  return /^CIVIC-\d{4}-[A-Z2-9]{5}$/.test(id.trim());
}
