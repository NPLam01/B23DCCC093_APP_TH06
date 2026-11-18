import { getChatId } from '../src/utils/getChatId';
import { getInitials, getColorForName } from '../src/utils/avatarHelper';
import {
  formatMessageTime,
  formatConversationTime,
  formatLastSeen,
} from '../src/utils/formatTime';

describe('TH6 Chat Firebase & Group Tests', () => {
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

  test('TC-LastSeen: displays activity time correctly', () => {
    const now = Date.now();
    expect(formatLastSeen(now)).toBe('Vừa mới hoạt động');
    expect(formatLastSeen(now - 1000 * 60 * 5)).toBe('Hoạt động 5 phút trước');
    expect(formatLastSeen(now - 1000 * 60 * 60 * 2)).toBe('Hoạt động 2 giờ trước');
    expect(formatLastSeen(undefined)).toBe('Ngoại tuyến');
  });

  test('TC-Reactions: groups reactions properly', () => {
    const reactions: Record<string, string> = {
      user1: '❤️',
      user2: '❤️',
      user3: '👍',
    };
    const counts: Record<string, number> = {};
    Object.values(reactions).forEach(e => {
      counts[e] = (counts[e] || 0) + 1;
    });
    expect(counts['❤️']).toBe(2);
    expect(counts['👍']).toBe(1);
  });

  test('TC-Typing: filters out current user and identifies active typing', () => {
    const currentUid = 'user1';
    const typingSnapshot = {
      user1: true,
      user2: true,
      user3: false,
    };
    const activeTyping = Object.entries(typingSnapshot)
      .filter(([uid, isTyping]) => uid !== currentUid && isTyping)
      .map(([uid]) => uid);

    expect(activeTyping).toEqual(['user2']);
    expect(activeTyping.length).toBe(1);
  });

  test('TC-LeaveGroup: formats leave system message and updates members', () => {
    const userName = 'Nguyen Van A';
    const systemMsg = `${userName} đã rời nhóm`;
    expect(systemMsg).toBe('Nguyen Van A đã rời nhóm');

    const members: Record<string, boolean | null> = {
      user1: true,
      user2: true,
      user3: true,
    };
    members['user2'] = null; // user2 leaves
    const remainingMembers = Object.keys(members).filter(uid => members[uid] === true);
    expect(remainingMembers).toEqual(['user1', 'user3']);
  });
});
