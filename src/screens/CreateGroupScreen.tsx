import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  Alert,
} from 'react-native';
import AntDesign from '@react-native-vector-icons/ant-design';
import { Colors } from '../constants/colors';
import { useAuth } from '../hooks/useAuth';
import { useContacts } from '../hooks/useContacts';
import { createGroupConversation } from '../services/groupService';
import { RootStackScreenProps } from '../navigation/types';
import Avatar from '../components/Avatar';
import AppInput from '../components/AppInput';
import AppButton from '../components/AppButton';
import { UserProfile } from '../types';

type Props = RootStackScreenProps<'CreateGroup'>;

export default function CreateGroupScreen({ navigation }: Props) {
  const { currentUser } = useAuth();
  const { contacts, searchQuery, setSearchQuery, isLoading } = useContacts(currentUser?.uid);

  const [groupName, setGroupName] = useState('');
  const [selectedUids, setSelectedUids] = useState<Record<string, UserProfile>>({});
  const [isCreating, setIsCreating] = useState(false);

  const toggleSelect = (user: UserProfile) => {
    setSelectedUids(prev => {
      const next = { ...prev };
      if (next[user.uid]) {
        delete next[user.uid];
      } else {
        next[user.uid] = user;
      }
      return next;
    });
  };

  const selectedCount = Object.keys(selectedUids).length;
  const canCreate = groupName.trim().length > 0 && selectedCount >= 2 && !isCreating;

  const handleCreateGroup = async () => {
    if (!currentUser?.uid) return;
    if (!groupName.trim()) {
      Alert.alert('Thiếu thông tin', 'Vui lòng nhập tên nhóm.');
      return;
    }
    if (selectedCount < 2) {
      Alert.alert('Chưa đủ thành viên', 'Vui lòng chọn tối thiểu 2 người ngoài bản thân.');
      return;
    }

    try {
      setIsCreating(true);
      const membersList = Object.values(selectedUids);
      const groupId = await createGroupConversation(
        currentUser.uid,
        currentUser.name || 'Người dùng',
        groupName.trim(),
        membersList,
      );

      // Điều hướng ngay tới màn hình Chat nhóm
      navigation.replace('Chat', {
        chatId: groupId,
        isGroup: true,
        groupName: groupName.trim(),
      });
    } catch (error: any) {
      Alert.alert('Lỗi tạo nhóm', error?.message || 'Không thể tạo nhóm chat.');
    } finally {
      setIsCreating(false);
    }
  };

  const renderContact = ({ item }: { item: UserProfile }) => {
    const isSelected = !!selectedUids[item.uid];

    return (
      <TouchableOpacity
        style={[styles.contactItem, isSelected ? styles.contactItemSelected : null]}
        onPress={() => toggleSelect(item)}
        activeOpacity={0.75}>
        <Avatar name={item.name} size={46} showOnline isOnline={item.status?.state === 'online'} />
        <View style={styles.contactInfo}>
          <Text style={styles.contactName}>{item.name}</Text>
          <Text style={styles.contactEmail} numberOfLines={1}>
            {item.email}
          </Text>
        </View>

        {/* Checkbox circle */}
        <View style={[styles.checkbox, isSelected ? styles.checkboxChecked : null]}>
          {isSelected && <AntDesign name="check" size={14} color={Colors.white} />}
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="light-content" />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backBtn}
          activeOpacity={0.7}>
          <AntDesign name="arrow-left" size={22} color={Colors.primary} />
        </TouchableOpacity>
        <Text style={styles.title}>Tạo nhóm mới</Text>
      </View>

      {/* Form Input Group Name */}
      <View style={styles.formContainer}>
        <AppInput
          label="Tên nhóm chat"
          placeholder="Ví dụ: Nhóm học React Native..."
          value={groupName}
          onChangeText={setGroupName}
          leftIcon={<AntDesign name="team" size={16} color={Colors.textSecondary} />}
        />

        <View style={styles.membersHeader}>
          <Text style={styles.membersTitle}>Chọn thành viên từ danh bạ</Text>
          <Text style={styles.membersCount}>
            Đã chọn {selectedCount} (tối thiểu 2)
          </Text>
        </View>

        <AppInput
          placeholder="Tìm theo tên hoặc email..."
          value={searchQuery}
          onChangeText={setSearchQuery}
          leftIcon={<AntDesign name="search" size={16} color={Colors.textSecondary} />}
        />
      </View>

      {/* Contacts List */}
      {isLoading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={Colors.primary} />
        </View>
      ) : (
        <FlatList
          data={contacts}
          keyExtractor={item => item.uid}
          renderItem={renderContact}
          ItemSeparatorComponent={() => <View style={styles.separator} />}
          contentContainerStyle={styles.listContainer}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>Chưa có người dùng nào trong danh bạ.</Text>
            </View>
          }
        />
      )}

      {/* Footer Create Button */}
      <View style={styles.footer}>
        <AppButton
          label={`Tạo nhóm (${selectedCount} thành viên)`}
          onPress={handleCreateGroup}
          disabled={!canCreate}
          loading={isCreating}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  backBtn: {
    padding: 6,
    marginRight: 6,
  },
  title: {
    color: Colors.textMain,
    fontSize: 20,
    fontWeight: '700',
  },
  formContainer: {
    padding: 16,
    paddingBottom: 8,
  },
  membersHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 14,
    marginBottom: 8,
  },
  membersTitle: {
    color: Colors.textMain,
    fontSize: 14,
    fontWeight: '600',
  },
  membersCount: {
    color: Colors.primary,
    fontSize: 12,
    fontWeight: '500',
  },
  listContainer: {
    paddingBottom: 20,
  },
  contactItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: Colors.background,
  },
  contactItemSelected: {
    backgroundColor: 'rgba(22, 139, 255, 0.08)',
  },
  contactInfo: {
    flex: 1,
    marginLeft: 12,
  },
  contactName: {
    color: Colors.textMain,
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 2,
  },
  contactEmail: {
    color: Colors.textSecondary,
    fontSize: 12,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: Colors.border,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxChecked: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  separator: {
    height: 1,
    backgroundColor: Colors.border,
    marginLeft: 74,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyContainer: {
    alignItems: 'center',
    paddingTop: 30,
  },
  emptyText: {
    color: Colors.textSecondary,
    fontSize: 14,
  },
  footer: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    backgroundColor: Colors.surface,
  },
});

