import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Colors } from '../constants/colors';
import { formatMessageTime } from '../utils/formatTime';
import LocationMessage from './LocationMessage';
import { Message } from '../types';

interface ChatBubbleProps {
  message: Message;
  isMine: boolean;
  showDateHeader?: boolean;
}

export default function ChatBubble({
  message,
  isMine,
  showDateHeader = false,
}: ChatBubbleProps) {
  const dateStr = new Date(message.createdAt).toLocaleDateString('vi-VN', {
    weekday: 'short',
    day: 'numeric',
    month: 'numeric',
  });

  return (
    <View style={styles.container}>
      {showDateHeader && (
        <View style={styles.dateHeader}>
          <Text style={styles.dateHeaderText}>{dateStr}</Text>
        </View>
      )}

      <View
        style={[
          styles.bubbleRow,
          isMine ? styles.bubbleRowRight : styles.bubbleRowLeft,
        ]}>
        {message.type === 'location' ? (
          <LocationMessage message={message} isMine={isMine} />
        ) : (
          <View
            style={[
              styles.bubble,
              isMine ? styles.bubbleMine : styles.bubbleOther,
            ]}>
            <Text
              style={[
                styles.bubbleText,
                isMine ? styles.bubbleTextMine : styles.bubbleTextOther,
              ]}>
              {message.text}
            </Text>
            <Text
              style={[
                styles.bubbleTime,
                isMine ? styles.bubbleTimeMine : styles.bubbleTimeOther,
              ]}>
              {formatMessageTime(message.createdAt)}
            </Text>
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginVertical: 3,
  },
  dateHeader: {
    alignItems: 'center',
    marginVertical: 10,
  },
  dateHeaderText: {
    color: Colors.textSecondary,
    fontSize: 12,
    backgroundColor: Colors.surface,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  bubbleRow: {
    flexDirection: 'row',
  },
  bubbleRowRight: {
    justifyContent: 'flex-end',
  },
  bubbleRowLeft: {
    justifyContent: 'flex-start',
  },
  bubble: {
    maxWidth: '75%',
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingTop: 8,
    paddingBottom: 6,
  },
  bubbleMine: {
    backgroundColor: Colors.primary,
    borderBottomRightRadius: 4,
  },
  bubbleOther: {
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    borderBottomLeftRadius: 4,
  },
  bubbleText: {
    fontSize: 15,
    lineHeight: 21,
  },
  bubbleTextMine: {
    color: Colors.white,
  },
  bubbleTextOther: {
    color: Colors.textMain,
  },
  bubbleTime: {
    fontSize: 10,
    marginTop: 3,
    textAlign: 'right',
  },
  bubbleTimeMine: {
    color: 'rgba(255, 255, 255, 0.7)',
  },
  bubbleTimeOther: {
    color: Colors.textSecondary,
  },
});
