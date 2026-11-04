import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Colors } from '../constants/colors';

interface OnlineStatusProps {
  isOnline?: boolean;
  showText?: boolean;
  size?: number;
}

export default function OnlineStatus({
  isOnline = false,
  showText = true,
  size = 8,
}: OnlineStatusProps) {
  return (
    <View style={styles.container}>
      <View
        style={[
          styles.dot,
          {
            width: size,
            height: size,
            borderRadius: size / 2,
            backgroundColor: isOnline ? Colors.online : Colors.offline,
          },
        ]}
      />
      {showText && (
        <Text style={[styles.text, { color: isOnline ? Colors.online : Colors.textSecondary }]}>
          {isOnline ? 'Đang hoạt động' : 'Ngoại tuyến'}
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dot: {
    marginRight: 6,
  },
  text: {
    fontSize: 12,
    fontWeight: '500',
  },
});
