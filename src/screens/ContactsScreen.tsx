import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  SafeAreaView,
  StatusBar,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import AntDesign from '@react-native-vector-icons/ant-design';
import { Colors } from '../constants/colors';
import { useAuth } from '../hooks/useAuth';
import { useContacts } from '../hooks/useContacts';
import { TabScreenProps } from '../navigation/types';
import Avatar from '../components/Avatar';
import OnlineStatus from '../components/OnlineStatus';
import AppInput from '../components/AppInput';
import { getChatId } from '../utils/getChatId';
import { UserProfile } from '../types';

type Props = TabScreenProps<'Contacts'>;

export default function ContactsScreen({ navigation }: Props) {
  const { currentUser } = useAuth();
  const { contacts, searchQuery, setSearchQuery, isLoading } = useContacts(
    currentUser?.uid,
  );

  const handleOpenChat = (user: UserProfile) => {
    if (!currentUser?.uid) return;
    const chatId = getChatId(currentUser.uid, user.uid);
    navigation.navigate('Chat', {
      chatId,
      otherUser: user,
    });
  };

  const renderContact = ({ item }: { item: UserProfile }) => {
    const isOnline = item.status?.state === 'online';

    return (
      <TouchableOpacity
        style={styles.contactItem}
        onPress={() => handleOpenChat(item)}
        activeOpacity={0.75}>
        <Avatar
          name={item.name}
          size={50}
          showOnline
          isOnline={isOnline}
        />
        <View style={styles.contactInfo}>
          <Text style={styles.name}>{item.name}</Text>
          <Text style={styles.email} numberOfLines={1}>
            {item.email}
          </Text>
          <View style={styles.statusRow}>
            <OnlineStatus isOnline={isOnline} />
          </View>
        </View>
        <AntDesign name="right" size={14} color={Colors.textSecondary} />
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="light-content" />
      <View style={styles.header}>
        <Text style={styles.title}>Danh bạ</Text>
        <Text style={styles.countText}>{contacts.length} người dùng</Text>
      </View>

      <View style={styles.searchContainer}>
        <AppInput
          placeholder="Tìm theo tên hoặc email..."
          value={searchQuery}
          onChangeText={setSearchQuery}
          autoCapitalize="none"
          autoCorrect={false}
          leftIcon={<AntDesign name="search" size={16} color={Colors.textSecondary} />}
        />
      </View>

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
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <AntDesign name="team" size={44} color={Colors.textSecondary} />
              <Text style={styles.emptyTitle}>
                {searchQuery ? `Không tìm thấy "${searchQuery}"` : 'Chưa có người dùng nào'}
              </Text>
              <Text style={styles.emptySubtitle}>
                {searchQuery
                  ? 'Hãy kiểm tra lại chính tả hoặc từ khóa tìm kiếm'
                  : 'Hãy tạo tài khoản thứ hai trên thiết bị khác để thử nghiệm nhắn tin realtime!'}
              </Text>
            </View>
          }
          contentContainerStyle={contacts.length === 0 ? styles.flexGrow : undefined}
        />
      )}
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
    alignItems: 'baseline',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 4,
  },
  title: {
    color: Colors.textMain,
    fontSize: 24,
    fontWeight: '700',
  },
  countText: {
    color: Colors.textSecondary,
    fontSize: 13,
  },
  searchContainer: {
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  contactItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: Colors.background,
  },
  contactInfo: {
    flex: 1,
    marginLeft: 12,
  },
  name: {
    color: Colors.textMain,
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 2,
  },
  email: {
    color: Colors.textSecondary,
    fontSize: 12,
    marginBottom: 4,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  separator: {
    height: 1,
    backgroundColor: Colors.border,
    marginLeft: 78,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
    gap: 10,
    paddingTop: 40,
  },
  emptyTitle: {
    color: Colors.textMain,
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
  emptySubtitle: {
    color: Colors.textSecondary,
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },
  flexGrow: {
    flexGrow: 1,
  },
});
