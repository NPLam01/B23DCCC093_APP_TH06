import React from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
} from 'react-native';
import Clipboard from '@react-native-clipboard/clipboard';
import AntDesign from '@react-native-vector-icons/ant-design';
import { Colors } from '../constants/colors';
import { Message } from '../types';

interface MessageActionModalProps {
  visible: boolean;
  message: Message | null;
  isMine: boolean;
  onClose: () => void;
  onRecall: (msgId: string) => void;
  onReact: (msgId: string, emoji: string) => void;
}

const EMOJIS = ['👍', '❤️', '😂', '😮', '😢'];

export default function MessageActionModal({
  visible,
  message,
  isMine,
  onClose,
  onRecall,
  onReact,
}: MessageActionModalProps) {
  if (!message) return null;

  const handleCopy = () => {
    let copyText = message.text || '';
    if (message.type === 'image' && message.imageUrl) {
      copyText = message.imageUrl;
    }
    Clipboard.setString(copyText);
    onClose();
    Alert.alert('Đã sao chép', 'Nội dung tin nhắn đã được lưu vào bộ nhớ tạm.');
  };

  const handleRecall = () => {
    onClose();
    Alert.alert(
      'Thu hồi tin nhắn',
      'Bạn có chắc chắn muốn thu hồi tin nhắn này với tất cả mọi người?',
      [
        { text: 'Hủy', style: 'cancel' },
        {
          text: 'Thu hồi',
          style: 'destructive',
          onPress: () => onRecall(message.id),
        },
      ],
    );
  };

  const handleSelectEmoji = (emoji: string) => {
    onReact(message.id, emoji);
    onClose();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}>
      <TouchableOpacity
        style={styles.overlay}
        activeOpacity={1}
        onPress={onClose}>
        <View style={styles.content}>
          {/* Reaction Bar */}
          {!message.recalled && (
            <View style={styles.reactionBar}>
              {EMOJIS.map(emoji => {
                return (
                  <TouchableOpacity
                    key={emoji}
                    style={styles.emojiBtn}
                    onPress={() => handleSelectEmoji(emoji)}
                    activeOpacity={0.7}>
                    <Text style={styles.emojiText}>{emoji}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          )}

          {/* Action Options */}
          <View style={styles.menuList}>
            {/* Sao chép */}
            {!message.recalled && message.type !== 'location' && (
              <TouchableOpacity
                style={styles.menuItem}
                onPress={handleCopy}
                activeOpacity={0.7}>
                <AntDesign name="copy" size={18} color={Colors.textMain} />
                <Text style={styles.menuItemText}>Sao chép nội dung</Text>
              </TouchableOpacity>
            )}

            {/* Thu hồi - Chỉ hiển thị nếu là tin của mình và chưa bị thu hồi */}
            {isMine && !message.recalled && (
              <TouchableOpacity
                style={styles.menuItem}
                onPress={handleRecall}
                activeOpacity={0.7}>
                <AntDesign name="delete" size={18} color={Colors.error} />
                <Text style={[styles.menuItemText, { color: Colors.error }]}>
                  Thu hồi tin nhắn
                </Text>
              </TouchableOpacity>
            )}

            {/* Hủy */}
            <TouchableOpacity
              style={[styles.menuItem, styles.cancelItem]}
              onPress={onClose}
              activeOpacity={0.7}>
              <Text style={styles.cancelText}>Đóng</Text>
            </TouchableOpacity>
          </View>
        </View>
      </TouchableOpacity>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  content: {
    width: '100%',
    maxWidth: 320,
    backgroundColor: Colors.surface,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  reactionBar: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingVertical: 10,
    backgroundColor: Colors.surfaceLight,
    borderRadius: 24,
    marginBottom: 12,
  },
  emojiBtn: {
    padding: 6,
  },
  emojiText: {
    fontSize: 26,
  },
  menuList: {
    gap: 4,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 10,
    gap: 12,
  },
  menuItemText: {
    color: Colors.textMain,
    fontSize: 15,
    fontWeight: '500',
  },
  cancelItem: {
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    marginTop: 4,
    justifyContent: 'center',
  },
  cancelText: {
    color: Colors.textSecondary,
    fontSize: 15,
    fontWeight: '500',
    textAlign: 'center',
  },
});

