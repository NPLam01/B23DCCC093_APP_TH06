import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  Switch,
  ScrollView,
  Alert,
  Platform,
  TouchableOpacity,
  Modal,
  TextInput,
  ActivityIndicator,
} from 'react-native';
import AntDesign from '@react-native-vector-icons/ant-design';
import { Colors } from '../constants/colors';
import { useAuth } from '../hooks/useAuth';
import { TabScreenProps } from '../navigation/types';
import Avatar from '../components/Avatar';
import AppButton from '../components/AppButton';
import { updateUserProfile } from '../services/userService';
import { pickFromGallery, pickFromCamera, uploadImageToCloudinary } from '../services/uploadService';

type Props = TabScreenProps<'Settings'>;

export default function SettingsScreen({ navigation: _navigation }: Props) {
  const { currentUser, logout, refreshProfile, isLoading } = useAuth();
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);

  // Edit profile state
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [editName, setEditName] = useState(currentUser?.name || '');
  const [isUpdating, setIsUpdating] = useState(false);

  const handleOpenEdit = () => {
    setEditName(currentUser?.name || '');
    setEditModalVisible(true);
  };

  const handleSaveProfile = async () => {
    if (!currentUser?.uid) return;
    if (!editName.trim()) {
      Alert.alert('Lỗi', 'Họ tên không được để trống.');
      return;
    }
    try {
      setIsUpdating(true);
      await updateUserProfile(currentUser.uid, { name: editName.trim() });
      await refreshProfile();
      setEditModalVisible(false);
      Alert.alert('Thành công', 'Đã cập nhật thông tin cá nhân.');
    } catch (err: any) {
      Alert.alert('Lỗi', err?.message || 'Không thể cập nhật hồ sơ.');
    } finally {
      setIsUpdating(false);
    }
  };

  const handleChangeAvatar = async () => {
    if (!currentUser?.uid) return;
    Alert.alert('Ảnh đại diện', 'Chọn phương thức cập nhật ảnh đại diện:', [
      { text: 'Hủy', style: 'cancel' },
      {
        text: 'Chụp ảnh mới',
        onPress: async () => {
          const asset = await pickFromCamera();
          if (asset?.uri) uploadAndUpdateAvatar(asset.uri);
        },
      },
      {
        text: 'Chọn từ thư viện',
        onPress: async () => {
          const asset = await pickFromGallery();
          if (asset?.uri) uploadAndUpdateAvatar(asset.uri);
        },
      },
    ]);
  };

  const uploadAndUpdateAvatar = async (localUri: string) => {
    if (!currentUser?.uid) return;
    try {
      setIsUpdating(true);
      const url = await uploadImageToCloudinary(localUri);
      await updateUserProfile(currentUser.uid, { avatar: url });
      await refreshProfile();
      Alert.alert('Thành công', 'Đã cập nhật ảnh đại diện mới.');
    } catch (err: any) {
      Alert.alert('Lỗi', err?.message || 'Không thể cập nhật ảnh đại diện.');
    } finally {
      setIsUpdating(false);
    }
  };

  const handleLogout = () => {
    Alert.alert('Xác nhận đăng xuất', 'Bạn có chắc chắn muốn đăng xuất khỏi tài khoản?', [
      { text: 'Hủy', style: 'cancel' },
      {
        text: 'Đăng xuất',
        style: 'destructive',
        onPress: async () => {
          await logout();
        },
      },
    ]);
  };

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="light-content" />
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <Text style={styles.headerTitle}>Cài đặt</Text>

        {/* Profile Card */}
        <View style={styles.profileCard}>
          <TouchableOpacity onPress={handleChangeAvatar} activeOpacity={0.8}>
            <Avatar
              name={currentUser?.name}
              avatarUrl={currentUser?.avatar}
              size={72}
              showOnline
              isOnline={currentUser?.status?.state === 'online'}
            />
            <View style={styles.cameraBadge}>
              <AntDesign name="camera" size={14} color={Colors.white} />
            </View>
          </TouchableOpacity>

          <View style={styles.profileInfo}>
            <Text style={styles.profileName}>{currentUser?.name || 'Người dùng'}</Text>
            <Text style={styles.profileEmail}>{currentUser?.email || ''}</Text>
            <Text style={styles.profileUid} numberOfLines={1}>
              UID: {currentUser?.uid || ''}
            </Text>
          </View>

          <TouchableOpacity
            style={styles.editBtn}
            onPress={handleOpenEdit}
            activeOpacity={0.7}
            accessibilityLabel="Chỉnh sửa thông tin">
            <AntDesign name="edit" size={20} color={Colors.primary} />
          </TouchableOpacity>
        </View>

        {/* Preferences Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Tùy chọn hệ thống</Text>

          <View style={styles.settingRow}>
            <View style={styles.settingLeft}>
              <View style={styles.iconBox}>
                <AntDesign name="bell" size={18} color={Colors.primary} />
              </View>
              <View>
                <Text style={styles.settingLabel}>Thông báo đẩy</Text>
                <Text style={styles.settingDesc}>Nhận thông báo khi có tin nhắn mới</Text>
              </View>
            </View>
            <Switch
              value={notificationsEnabled}
              onValueChange={setNotificationsEnabled}
              trackColor={{ false: Colors.border, true: Colors.primary }}
              thumbColor={Colors.white}
            />
          </View>

          <View style={styles.divider} />

          <View style={styles.settingRow}>
            <View style={styles.settingLeft}>
              <View style={styles.iconBox}>
                <AntDesign name="bulb" size={18} color={Colors.primary} />
              </View>
              <View>
                <Text style={styles.settingLabel}>Giao diện</Text>
                <Text style={styles.settingDesc}>Chế độ tối (Dark Mode mặc định)</Text>
              </View>
            </View>
          </View>

          <View style={styles.divider} />

          <View style={styles.settingRow}>
            <View style={styles.settingLeft}>
              <View style={styles.iconBox}>
                <AntDesign name="picture" size={18} color={Colors.primary} />
              </View>
              <View>
                <Text style={styles.settingLabel}>Đổi ảnh đại diện</Text>
                <Text style={styles.settingDesc}>Chạm vào ảnh để chụp hoặc tải ảnh mới</Text>
              </View>
            </View>
          </View>

          <View style={styles.divider} />

          <View style={styles.settingRow}>
            <View style={styles.settingLeft}>
              <View style={styles.iconBox}>
                <AntDesign name="info-circle" size={18} color={Colors.primary} />
              </View>
              <View>
                <Text style={styles.settingLabel}>Phiên bản</Text>
                <Text style={styles.settingDesc}>BlueTalk v3.0 - TH6 Nhóm, Ảnh & Reactions</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Logout */}
        <AppButton
          label="Đăng xuất"
          onPress={handleLogout}
          loading={isLoading}
          variant="danger"
          style={styles.logoutBtn}
        />
      </ScrollView>

      {/* Modal Chỉnh sửa hồ sơ */}
      <Modal
        visible={editModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setEditModalVisible(false)}>
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setEditModalVisible(false)}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Chỉnh sửa họ tên</Text>
            <TextInput
              style={styles.modalInput}
              value={editName}
              onChangeText={setEditName}
              placeholder="Nhập họ và tên..."
              placeholderTextColor={Colors.textSecondary}
              autoFocus
            />
            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.modalCancelBtn}
                onPress={() => setEditModalVisible(false)}>
                <Text style={styles.modalCancelText}>Hủy</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.modalSaveBtn}
                onPress={handleSaveProfile}
                disabled={isUpdating}>
                {isUpdating ? (
                  <ActivityIndicator size="small" color={Colors.white} />
                ) : (
                  <Text style={styles.modalSaveText}>Lưu</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </TouchableOpacity>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  scroll: {
    padding: 16,
    paddingBottom: 32,
  },
  headerTitle: {
    color: Colors.textMain,
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 20,
    marginTop: 4,
  },
  profileCard: {
    backgroundColor: Colors.surface,
    borderRadius: 14,
    padding: 18,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: 20,
    position: 'relative',
  },
  cameraBadge: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    backgroundColor: Colors.primary,
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: Colors.surface,
  },
  profileInfo: {
    marginLeft: 16,
    flex: 1,
  },
  profileName: {
    color: Colors.textMain,
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 3,
  },
  profileEmail: {
    color: Colors.textSecondary,
    fontSize: 13,
    marginBottom: 3,
  },
  profileUid: {
    color: Colors.primary,
    fontSize: 11,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
  editBtn: {
    padding: 8,
  },
  section: {
    backgroundColor: Colors.surface,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: 24,
    overflow: 'hidden',
  },
  sectionTitle: {
    color: Colors.textSecondary,
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 8,
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  settingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  iconBox: {
    width: 34,
    height: 34,
    borderRadius: 8,
    backgroundColor: 'rgba(22, 139, 255, 0.12)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  settingLabel: {
    color: Colors.textMain,
    fontSize: 15,
    fontWeight: '500',
    marginBottom: 2,
  },
  settingDesc: {
    color: Colors.textSecondary,
    fontSize: 12,
  },
  divider: {
    height: 1,
    backgroundColor: Colors.border,
    marginLeft: 64,
  },
  logoutBtn: {
    width: '100%',
  },
  // Modal Edit
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  modalCard: {
    width: '100%',
    backgroundColor: Colors.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: 20,
  },
  modalTitle: {
    color: Colors.textMain,
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 16,
  },
  modalInput: {
    backgroundColor: Colors.background,
    color: Colors.textMain,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 15,
    marginBottom: 18,
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 12,
  },
  modalCancelBtn: {
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  modalCancelText: {
    color: Colors.textSecondary,
    fontSize: 15,
    fontWeight: '500',
  },
  modalSaveBtn: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  modalSaveText: {
    color: Colors.white,
    fontSize: 15,
    fontWeight: '600',
  },
});
