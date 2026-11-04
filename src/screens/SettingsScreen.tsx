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
} from 'react-native';
import AntDesign from '@react-native-vector-icons/ant-design';
import { Colors } from '../constants/colors';
import { useAuth } from '../hooks/useAuth';
import { TabScreenProps } from '../navigation/types';
import Avatar from '../components/Avatar';
import AppButton from '../components/AppButton';

type Props = TabScreenProps<'Settings'>;

export default function SettingsScreen({ navigation: _navigation }: Props) {
  const { currentUser, logout, isLoading } = useAuth();
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);

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
          <Avatar
            name={currentUser?.name}
            size={72}
            showOnline
            isOnline={currentUser?.status?.state === 'online'}
          />
          <View style={styles.profileInfo}>
            <Text style={styles.profileName}>{currentUser?.name || 'Người dùng'}</Text>
            <Text style={styles.profileEmail}>{currentUser?.email || ''}</Text>
            <Text style={styles.profileUid} numberOfLines={1}>
              UID: {currentUser?.uid || ''}
            </Text>
          </View>
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
                <AntDesign name="cloud" size={18} color={Colors.primary} />
              </View>
              <View>
                <Text style={styles.settingLabel}>Cơ sở dữ liệu</Text>
                <Text style={styles.settingDesc}>Firebase Realtime Database</Text>
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
                <Text style={styles.settingDesc}>BlueTalk v2.0 - TH5 Firebase</Text>
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
});
