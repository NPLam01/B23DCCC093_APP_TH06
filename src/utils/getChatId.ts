/**
 * Generates a consistent chatId from two UIDs by sorting them alphabetically.
 */
export const getChatId = (uid1: string, uid2: string): string => {
  return [uid1, uid2].sort().join('_');
};
