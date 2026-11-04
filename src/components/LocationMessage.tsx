import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import AntDesign from '@react-native-vector-icons/ant-design';
import { Colors } from '../constants/colors';
import { openLocationInMap } from '../services/locationService';
import { formatMessageTime } from '../utils/formatTime';
import { Message } from '../types';

interface LocationMessageProps {
  message: Message;
  isMine: boolean;
}

export default function LocationMessage({ message, isMine }: LocationMessageProps) {
  const { latitude, longitude, createdAt } = message;

  const handlePress = () => {
    let lat = latitude;
    let lng = longitude;

    // Fallback: nếu latitude/longitude không có trực tiếp, trích xuất từ chuỗi text
    if (lat === undefined || lng === undefined) {
      const match = message.text?.match(/(-?\d+\.?\d*)[,\s]+(-?\d+\.?\d*)/);
      if (match) {
        lat = parseFloat(match[1]);
        lng = parseFloat(match[2]);
      }
    }

    if (lat !== undefined && lng !== undefined && !isNaN(Number(lat)) && !isNaN(Number(lng))) {
      openLocationInMap(Number(lat), Number(lng));
    } else {
      Alert.alert('Lỗi', 'Không tìm thấy tọa độ hợp lệ trong tin nhắn.');
    }
  };

  return (
    <TouchableOpacity
      style={[
        styles.card,
        isMine ? styles.cardMine : styles.cardOther,
      ]}
      onPress={handlePress}
      activeOpacity={0.8}>
      <View style={styles.headerRow}>
        <View style={styles.iconCircle}>
          <AntDesign name="environment" size={18} color={isMine ? Colors.white : Colors.primary} />
        </View>
        <View style={styles.titleContainer}>
          <Text style={[styles.title, isMine ? styles.titleMine : styles.titleOther]}>
            Vị trí chia sẻ
          </Text>
          <Text style={[styles.coords, isMine ? styles.coordsMine : styles.coordsOther]}>
            {latitude?.toFixed(5)}, {longitude?.toFixed(5)}
          </Text>
        </View>
      </View>

      <View style={[styles.actionRow, isMine ? styles.actionRowMine : styles.actionRowOther]}>
        <Text style={[styles.actionText, isMine ? styles.actionTextMine : styles.actionTextOther]}>
          Mở bằng Google Maps ↗
        </Text>
        <Text style={[styles.time, isMine ? styles.timeMine : styles.timeOther]}>
          {formatMessageTime(createdAt)}
        </Text>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    maxWidth: '80%',
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
  },
  cardMine: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primaryPressed,
    borderBottomRightRadius: 4,
  },
  cardOther: {
    backgroundColor: Colors.surface,
    borderColor: Colors.border,
    borderBottomLeftRadius: 4,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  iconCircle: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  titleContainer: {
    flex: 1,
  },
  title: {
    fontSize: 14,
    fontWeight: '700',
  },
  titleMine: {
    color: Colors.white,
  },
  titleOther: {
    color: Colors.textMain,
  },
  coords: {
    fontSize: 12,
    marginTop: 2,
  },
  coordsMine: {
    color: 'rgba(255, 255, 255, 0.85)',
  },
  coordsOther: {
    color: Colors.textSecondary,
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 8,
    borderTopWidth: 1,
  },
  actionRowMine: {
    borderTopColor: 'rgba(255, 255, 255, 0.2)',
  },
  actionRowOther: {
    borderTopColor: Colors.border,
  },
  actionText: {
    fontSize: 12,
    fontWeight: '600',
  },
  actionTextMine: {
    color: Colors.white,
  },
  actionTextOther: {
    color: Colors.primary,
  },
  time: {
    fontSize: 10,
  },
  timeMine: {
    color: 'rgba(255, 255, 255, 0.75)',
  },
  timeOther: {
    color: Colors.textSecondary,
  },
});
