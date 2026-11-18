import React, { useState } from 'react';
import {
  View,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  ActionSheetIOS,
  Platform,
  Modal,
  Text,
} from 'react-native';
import AntDesign from '@react-native-vector-icons/ant-design';
import { Colors } from '../constants/colors';

interface MessageInputProps {
  onSendText: (text: string) => void;
  onSendLocation: () => void;
  onPickCamera: () => void;
  onPickGallery: () => void;
  onTyping?: (isTyping?: boolean) => void;
  isSending?: boolean;
  isSendingLocation?: boolean;
}

export default function MessageInput({
  onSendText,
  onSendLocation,
  onPickCamera,
  onPickGallery,
  onTyping,
  isSending = false,
  isSendingLocation = false,
}: MessageInputProps) {
  const [inputText, setInputText] = useState('');
  const [pickerModalVisible, setPickerModalVisible] = useState(false);

  const handleSend = () => {
    const trimmed = inputText.trim();
    if (!trimmed || isSending) return;
    if (onTyping) {
      onTyping(false);
    }
    onSendText(trimmed);
    setInputText('');
  };

  const handleTextChange = (text: string) => {
    setInputText(text);
    if (onTyping) {
      onTyping(text.trim().length > 0);
    }
  };

  const handleOpenPhotoOptions = () => {
    if (Platform.OS === 'ios') {
      ActionSheetIOS.showActionSheetWithOptions(
        {
          options: ['Hủy', 'Chụp ảnh mới', 'Chọn từ thư viện'],
          cancelButtonIndex: 0,
        },
        buttonIndex => {
          if (buttonIndex === 1) onPickCamera();
          else if (buttonIndex === 2) onPickGallery();
        },
      );
    } else {
      setPickerModalVisible(true);
    }
  };

  const canSend = inputText.trim().length > 0 && !isSending;

  return (
    <View style={styles.container}>
      {/* Photo Picker button */}
      <TouchableOpacity
        style={styles.actionBtn}
        onPress={handleOpenPhotoOptions}
        activeOpacity={0.7}
        accessibilityLabel="Gửi ảnh">
        <AntDesign name="camera" size={20} color={Colors.primary} />
      </TouchableOpacity>

      {/* Location share button */}
      <TouchableOpacity
        style={styles.actionBtn}
        onPress={onSendLocation}
        disabled={isSendingLocation}
        activeOpacity={0.7}
        accessibilityLabel="Gửi vị trí">
        {isSendingLocation ? (
          <ActivityIndicator size="small" color={Colors.primary} />
        ) : (
          <AntDesign name="environment" size={20} color={Colors.primary} />
        )}
      </TouchableOpacity>

      {/* Text input */}
      <TextInput
        style={styles.input}
        placeholder="Nhập tin nhắn..."
        placeholderTextColor={Colors.textSecondary}
        value={inputText}
        onChangeText={handleTextChange}
        multiline
        maxLength={1000}
        selectionColor={Colors.primary}
        returnKeyType="send"
        blurOnSubmit={false}
        onSubmitEditing={handleSend}
      />

      {/* Send button */}
      <TouchableOpacity
        style={[styles.sendBtn, !canSend ? styles.sendBtnDisabled : null]}
        onPress={handleSend}
        disabled={!canSend}
        activeOpacity={0.8}
        accessibilityLabel="Gửi tin nhắn">
        {isSending ? (
          <ActivityIndicator size="small" color={Colors.white} />
        ) : (
          <AntDesign name="arrow-up" size={20} color={Colors.white} />
        )}
      </TouchableOpacity>

      {/* Modal chọn ảnh cho Android */}
      <Modal
        visible={pickerModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setPickerModalVisible(false)}>
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setPickerModalVisible(false)}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Gửi hình ảnh</Text>
            <TouchableOpacity
              style={styles.modalOption}
              onPress={() => {
                setPickerModalVisible(false);
                setTimeout(onPickCamera, 200);
              }}>
              <AntDesign name="camera" size={20} color={Colors.primary} />
              <Text style={styles.modalOptionText}>Chụp ảnh từ máy ảnh</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.modalOption}
              onPress={() => {
                setPickerModalVisible(false);
                setTimeout(onPickGallery, 200);
              }}>
              <AntDesign name="picture" size={20} color={Colors.primary} />
              <Text style={styles.modalOptionText}>Chọn ảnh từ thư viện</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.modalOption, styles.modalCancel]}
              onPress={() => setPickerModalVisible(false)}>
              <Text style={styles.modalCancelText}>Hủy</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: 8,
    paddingVertical: 8,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    backgroundColor: Colors.surface,
  },
  actionBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 4,
    marginBottom: 2,
    backgroundColor: 'rgba(22, 139, 255, 0.1)',
  },
  input: {
    flex: 1,
    backgroundColor: Colors.background,
    color: Colors.textMain,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingHorizontal: 14,
    paddingTop: 9,
    paddingBottom: 9,
    fontSize: 15,
    maxHeight: 100,
    marginRight: 6,
  },
  sendBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 2,
  },
  sendBtnDisabled: {
    backgroundColor: Colors.border,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: Colors.surface,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderTopWidth: 1,
    borderColor: Colors.border,
  },
  modalTitle: {
    color: Colors.textSecondary,
    fontSize: 13,
    fontWeight: '600',
    textTransform: 'uppercase',
    marginBottom: 12,
  },
  modalOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    gap: 12,
  },
  modalOptionText: {
    color: Colors.textMain,
    fontSize: 16,
    fontWeight: '500',
  },
  modalCancel: {
    marginTop: 8,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    justifyContent: 'center',
    paddingTop: 14,
  },
  modalCancelText: {
    color: Colors.error,
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
});
