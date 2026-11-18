import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  ActivityIndicator,
} from 'react-native';
import AntDesign from '@react-native-vector-icons/ant-design';
import { Colors } from '../constants/colors';
import { formatMessageTime } from '../utils/formatTime';
import LocationMessage from './LocationMessage';
import { Message } from '../types';

interface ChatBubbleProps {
  message: Message;
  isMine: boolean;
  showDateHeader?: boolean;
  isGroup?: boolean;
  isLastFromMe?: boolean;
  readTime?: number | null;
  onLongPress?: (msg: Message) => void;
  onPressImage?: (url: string) => void;
  onRetryUpload?: (msgId: string) => void;
}

export default function ChatBubble({
  message,
  isMine,
  showDateHeader = false,
  isGroup = false,
  isLastFromMe = false,
  readTime = null,
  onLongPress,
  onPressImage,
  onRetryUpload,
}: ChatBubbleProps) {
  const dateStr = new Date(message.createdAt).toLocaleDateString('vi-VN', {
    weekday: 'short',
    day: 'numeric',
    month: 'numeric',
  });

  // Gom nhóm các cảm xúc (reactions)
  const reactionsMap = message.reactions || {};
  const reactionCounts: Record<string, number> = {};
  Object.values(reactionsMap).forEach(emoji => {
    if (emoji) {
      reactionCounts[emoji] = (reactionCounts[emoji] || 0) + 1;
    }
  });
  const hasReactions = Object.keys(reactionCounts).length > 0;

  // Trạng thái đã xem hoặc đã gửi
  let statusText = '';
  if (isMine && isLastFromMe && !message.recalled && message.uploadStatus !== 'uploading') {
    if (readTime && readTime >= message.createdAt) {
      statusText = `Đã xem lúc ${formatMessageTime(readTime)}`;
    } else {
      statusText = 'Đã gửi';
    }
  }

  return (
    <View style={styles.container}>
      {showDateHeader && (
        <View style={styles.dateHeader}>
          <Text style={styles.dateHeaderText}>{dateStr}</Text>
        </View>
      )}

      {/* Hiển thị tên người gửi trong nhóm chat nếu không phải tin của mình */}
      {isGroup && !isMine && message.senderName && !message.recalled && (
        <Text style={styles.senderName}>{message.senderName}</Text>
      )}

      <View
        style={[
          styles.bubbleRow,
          isMine ? styles.bubbleRowRight : styles.bubbleRowLeft,
        ]}>
        <TouchableOpacity
          activeOpacity={0.85}
          onLongPress={() => onLongPress && onLongPress(message)}
          delayLongPress={300}
          style={[styles.touchableBubble]}>
          {message.recalled ? (
            /* Tin nhắn đã thu hồi */
            <View style={[styles.bubble, styles.recalledBubble]}>
              <View style={styles.recalledRow}>
                <AntDesign name="info-circle" size={14} color={Colors.textSecondary} />
                <Text style={styles.recalledText}>Tin nhắn đã được thu hồi</Text>
              </View>
              <Text style={styles.bubbleTimeOther}>
                {formatMessageTime(message.createdAt)}
              </Text>
            </View>
          ) : message.type === 'location' ? (
            /* Tin nhắn vị trí */
            <LocationMessage message={message} isMine={isMine} />
          ) : message.type === 'image' ? (
            /* Tin nhắn hình ảnh */
            <View
              style={[
                styles.imageBubble,
                isMine ? styles.imageBubbleMine : styles.imageBubbleOther,
              ]}>
              {message.uploadStatus === 'uploading' ? (
                <View style={styles.uploadingContainer}>
                  <Image
                    source={{ uri: message.localUri }}
                    style={styles.imageThumbnail}
                  />
                  <View style={styles.uploadingOverlay}>
                    <ActivityIndicator size="small" color={Colors.white} />
                    <Text style={styles.uploadingText}>Đang tải ảnh lên...</Text>
                  </View>
                </View>
              ) : message.uploadStatus === 'failed' ? (
                <View style={styles.uploadingContainer}>
                  <Image
                    source={{ uri: message.localUri }}
                    style={styles.imageThumbnail}
                  />
                  <TouchableOpacity
                    style={styles.retryOverlay}
                    onPress={() => onRetryUpload && onRetryUpload(message.id)}
                    activeOpacity={0.8}>
                    <AntDesign name="reload" size={20} color={Colors.white} />
                    <Text style={styles.retryText}>Tải lỗi. Nhấn để thử lại</Text>
                  </TouchableOpacity>
                </View>
              ) : (
                <TouchableOpacity
                  activeOpacity={0.9}
                  onPress={() =>
                    onPressImage && onPressImage(message.imageUrl || message.localUri || '')
                  }>
                  <Image
                    source={{ uri: message.imageUrl || message.localUri }}
                    style={styles.imageThumbnail}
                    resizeMode="cover"
                  />
                </TouchableOpacity>
              )}

              <Text
                style={[
                  styles.imageTime,
                  isMine ? styles.bubbleTimeMine : styles.bubbleTimeOther,
                ]}>
                {formatMessageTime(message.createdAt)}
              </Text>
            </View>
          ) : (
            /* Tin nhắn văn bản */
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

          {/* Dải cảm xúc (reactions) hiển thị dưới bong bóng */}
          {hasReactions && (
            <View
              style={[
                styles.reactionsContainer,
                isMine ? styles.reactionsRight : styles.reactionsLeft,
              ]}>
              {Object.entries(reactionCounts).map(([emoji, count]) => (
                <View key={emoji} style={styles.reactionPill}>
                  <Text style={styles.reactionEmoji}>{emoji}</Text>
                  {count > 1 && (
                    <Text style={styles.reactionCount}>{count}</Text>
                  )}
                </View>
              ))}
            </View>
          )}
        </TouchableOpacity>
      </View>

      {/* Hiển thị trạng thái "Đã gửi" hoặc "Đã xem lúc ..." ở tin cuối của mình */}
      {statusText ? (
        <View style={styles.statusRow}>
          <Text style={styles.statusText}>{statusText}</Text>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginVertical: 4,
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
  senderName: {
    color: Colors.primary,
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 2,
    marginLeft: 6,
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
  touchableBubble: {
    maxWidth: '78%',
  },
  bubble: {
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
    color: 'rgba(255, 255, 255, 0.75)',
  },
  bubbleTimeOther: {
    color: Colors.textSecondary,
  },
  // Recalled
  recalledBubble: {
    backgroundColor: 'rgba(38, 52, 73, 0.4)',
    borderWidth: 1,
    borderColor: Colors.border,
    borderStyle: 'dashed',
  },
  recalledRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 2,
  },
  recalledText: {
    color: Colors.textSecondary,
    fontSize: 13,
    fontStyle: 'italic',
  },
  // Image
  imageBubble: {
    borderRadius: 14,
    overflow: 'hidden',
    padding: 3,
  },
  imageBubbleMine: {
    backgroundColor: Colors.primary,
    borderBottomRightRadius: 4,
  },
  imageBubbleOther: {
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    borderBottomLeftRadius: 4,
  },
  imageThumbnail: {
    width: 220,
    height: 180,
    borderRadius: 12,
    backgroundColor: Colors.surfaceLight,
  },
  imageTime: {
    fontSize: 10,
    marginTop: 4,
    marginRight: 4,
    textAlign: 'right',
  },
  uploadingContainer: {
    position: 'relative',
    width: 220,
    height: 180,
    borderRadius: 12,
    overflow: 'hidden',
  },
  uploadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 6,
  },
  uploadingText: {
    color: Colors.white,
    fontSize: 12,
    fontWeight: '500',
  },
  retryOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(239, 68, 68, 0.85)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 10,
    gap: 6,
  },
  retryText: {
    color: Colors.white,
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'center',
  },
  // Reactions
  reactionsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: -8,
    gap: 4,
  },
  reactionsRight: {
    justifyContent: 'flex-end',
    marginRight: 6,
  },
  reactionsLeft: {
    justifyContent: 'flex-start',
    marginLeft: 6,
  },
  reactionPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surfaceLight,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 12,
    paddingHorizontal: 6,
    paddingVertical: 2,
    gap: 2,
  },
  reactionEmoji: {
    fontSize: 13,
  },
  reactionCount: {
    color: Colors.textMain,
    fontSize: 11,
    fontWeight: '600',
  },
  // Status
  statusRow: {
    alignItems: 'flex-end',
    marginTop: 2,
    marginRight: 4,
  },
  statusText: {
    color: Colors.textSecondary,
    fontSize: 11,
  },
});
