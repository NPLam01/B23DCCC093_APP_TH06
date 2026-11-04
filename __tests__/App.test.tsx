import { getChatId } from '../src/utils/getChatId';
import { getInitials, getColorForName } from '../src/utils/avatarHelper';
import { formatMessageTime, formatConversationTime } from '../src/utils/formatTime';

describe('TH5 Chat Firebase Unit Tests', () => {
  test('TC-ChatId: generates consistent chatId regardless of order', () => {
    const id1 = getChatId('userA', 'userB');
    const id2 = getChatId('userB', 'userA');
    expect(id1).toBe('userA_userB');
    expect(id1).toBe(id2);
  });

  test('TC-Avatar: extracts initials correctly', () => {
    expect(getInitials('Nguyen Van A')).toBe('NA');
    expect(getInitials('John')).toBe('JO');
    expect(getColorForName('Nguyen')).toBeDefined();
  });

  test('TC-Time: formats timestamp correctly', () => {
    const now = Date.now();
    expect(formatMessageTime(now)).toMatch(/^\d{2}:\d{2}$/);
    expect(formatConversationTime(now)).toBeDefined();
  });
});
