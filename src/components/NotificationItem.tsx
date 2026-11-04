import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Colors } from '../constants/colors';
import { formatNotificationTime } from '../utils/formatTime';
import { NotificationItem as NotificationType } from '../types';

interface NotificationItemProps {
  item: NotificationType;
  onPress: () => void;
}

export default function NotificationItem({ item, onPress }: NotificationItemProps) {
  return (
    <TouchableOpacity
      style={[styles.container, !item.isRead ? styles.unread : null]}
      onPress={onPress}
      activeOpacity={0.75}>
      <View style={styles.left}>
        {!item.isRead && <View style={styles.dot} />}
      </View>
      <View style={styles.content}>
        <Text style={[styles.text, !item.isRead ? styles.textUnread : null]}>
          {item.content}
        </Text>
        <Text style={styles.time}>{formatNotificationTime(item.timestamp)}</Text>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: Colors.background,
  },
  unread: {
    backgroundColor: Colors.surface,
  },
  left: {
    width: 14,
    alignItems: 'center',
    paddingTop: 5,
    marginRight: 10,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.primary,
  },
  content: {
    flex: 1,
  },
  text: {
    color: Colors.textSecondary,
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 4,
  },
  textUnread: {
    color: Colors.textMain,
    fontWeight: '500',
  },
  time: {
    color: Colors.textSecondary,
    fontSize: 12,
  },
});
