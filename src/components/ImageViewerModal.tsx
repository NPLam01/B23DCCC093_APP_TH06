import React from 'react';
import {
  Modal,
  View,
  Image,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  StatusBar,
} from 'react-native';
import AntDesign from '@react-native-vector-icons/ant-design';
import { Colors } from '../constants/colors';

interface ImageViewerModalProps {
  visible: boolean;
  imageUrl?: string;
  onClose: () => void;
}

export default function ImageViewerModal({
  visible,
  imageUrl,
  onClose,
}: ImageViewerModalProps) {
  if (!imageUrl) return null;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}>
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="light-content" />
        <TouchableOpacity
          style={styles.closeBtn}
          onPress={onClose}
          activeOpacity={0.8}
          accessibilityLabel="Đóng">
          <AntDesign name="close" size={24} color={Colors.white} />
        </TouchableOpacity>

        <View style={styles.imageWrapper}>
          <Image
            source={{ uri: imageUrl }}
            style={styles.fullImage}
            resizeMode="contain"
          />
        </View>
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  closeBtn: {
    position: 'absolute',
    top: 40,
    right: 20,
    zIndex: 10,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  imageWrapper: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 10,
  },
  fullImage: {
    width: '100%',
    height: '100%',
  },
});
