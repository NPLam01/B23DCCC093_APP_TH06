import React from 'react';
import { View, Text, StyleSheet, Image } from 'react-native';
import { Colors } from '../constants/colors';
import { getInitials, getColorForName } from '../utils/avatarHelper';

interface AvatarProps {
  name?: string;
  avatarUrl?: string;
  initials?: string;
  color?: string;
  size?: number;
  showOnline?: boolean;
  isOnline?: boolean;
}

export default function Avatar({
  name,
  avatarUrl,
  initials,
  color,
  size = 48,
  showOnline = false,
  isOnline = false,
}: AvatarProps) {
  const displayInitials = initials || getInitials(name);
  const bgColor = color || getColorForName(name || displayInitials);
  const dotSize = Math.max(10, size * 0.28);

  return (
    <View style={{ width: size, height: size, position: 'relative' }}>
      {avatarUrl ? (
        <Image
          source={{ uri: avatarUrl }}
          style={{
            width: size,
            height: size,
            borderRadius: size / 2,
            backgroundColor: Colors.surfaceLight,
          }}
          resizeMode="cover"
        />
      ) : (
        <View
          style={[
            styles.circle,
            {
              width: size,
              height: size,
              borderRadius: size / 2,
              backgroundColor: bgColor,
            },
          ]}>
          <Text style={[styles.initials, { fontSize: size * 0.38 }]}>
            {displayInitials}
          </Text>
        </View>
      )}

      {showOnline && (
        <View
          style={[
            styles.dot,
            {
              width: dotSize,
              height: dotSize,
              borderRadius: dotSize / 2,
              backgroundColor: isOnline ? Colors.online : Colors.offline,
            },
          ]}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  circle: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  initials: {
    color: Colors.white,
    fontWeight: '700',
  },
  dot: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    borderWidth: 2,
    borderColor: Colors.background,
  },
});
