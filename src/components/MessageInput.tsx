import React, { useState } from 'react';
import {
  View,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import AntDesign from '@react-native-vector-icons/ant-design';
import { Colors } from '../constants/colors';

interface MessageInputProps {
  onSendText: (text: string) => void;
  onSendLocation: () => void;
  isSending?: boolean;
  isSendingLocation?: boolean;
}

export default function MessageInput({
  onSendText,
  onSendLocation,
  isSending = false,
  isSendingLocation = false,
}: MessageInputProps) {
  const [inputText, setInputText] = useState('');

  const handleSend = () => {
    const trimmed = inputText.trim();
    if (!trimmed || isSending) return;
    onSendText(trimmed);
    setInputText('');
  };

  const canSend = inputText.trim().length > 0 && !isSending;

  return (
    <View style={styles.container}>
      {/* Location share button */}
      <TouchableOpacity
        style={styles.locationBtn}
        onPress={onSendLocation}
        disabled={isSendingLocation}
        activeOpacity={0.7}
        accessibilityLabel="Gửi vị trí">
        {isSendingLocation ? (
          <ActivityIndicator size="small" color={Colors.primary} />
        ) : (
          <AntDesign name="environment" size={22} color={Colors.primary} />
        )}
      </TouchableOpacity>

      {/* Text input */}
      <TextInput
        style={styles.input}
        placeholder="Nhập tin nhắn..."
        placeholderTextColor={Colors.textSecondary}
        value={inputText}
        onChangeText={setInputText}
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
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    backgroundColor: Colors.surface,
  },
  locationBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 6,
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
    paddingTop: 10,
    paddingBottom: 10,
    fontSize: 15,
    maxHeight: 100,
    marginRight: 8,
  },
  sendBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 2,
  },
  sendBtnDisabled: {
    backgroundColor: Colors.border,
  },
});
