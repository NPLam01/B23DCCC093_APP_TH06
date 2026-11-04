import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  TouchableWithoutFeedback,
  Keyboard,
  TouchableOpacity,
  Alert,
} from 'react-native';
import AntDesign from '@react-native-vector-icons/ant-design';
import { Colors } from '../../constants/colors';
import AppInput from '../../components/AppInput';
import AppButton from '../../components/AppButton';
import { useAuth } from '../../hooks/useAuth';
import { AuthScreenProps } from '../../navigation/types';

type Props = AuthScreenProps<'Register'>;

export default function RegisterScreen({ navigation }: Props) {
  const { register, isLoading } = useAuth();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [nameError, setNameError] = useState('');
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [confirmPasswordError, setConfirmPasswordError] = useState('');
  const [generalError, setGeneralError] = useState('');

  const validate = (): boolean => {
    let valid = true;
    setNameError('');
    setEmailError('');
    setPasswordError('');
    setConfirmPasswordError('');
    setGeneralError('');

    if (!name.trim()) {
      setNameError('Họ tên không được để trống.');
      valid = false;
    }

    const trimmedEmail = email.trim();
    if (!trimmedEmail) {
      setEmailError('Email không được để trống.');
      valid = false;
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) {
      setEmailError('Email không hợp lệ.');
      valid = false;
    }

    if (!password) {
      setPasswordError('Mật khẩu không được để trống.');
      valid = false;
    } else if (password.length < 6) {
      setPasswordError('Mật khẩu phải có ít nhất 6 ký tự.');
      valid = false;
    }

    if (!confirmPassword) {
      setConfirmPasswordError('Vui lòng nhập lại mật khẩu.');
      valid = false;
    } else if (password !== confirmPassword) {
      setConfirmPasswordError('Mật khẩu xác nhận không trùng khớp.');
      valid = false;
    }

    return valid;
  };

  const handleRegister = async () => {
    Keyboard.dismiss();
    if (!validate()) return;

    const result = await register(name, email, password);
    if (!result.success) {
      setGeneralError(result.error || 'Đăng ký không thành công.');
      Alert.alert('Đăng ký thất bại', result.error || 'Vui lòng thử lại.');
    } else {
      Alert.alert('Thành công', 'Đăng ký tài khoản thành công!');
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <ScrollView
            contentContainerStyle={styles.scroll}
            keyboardShouldPersistTaps="handled">
            <View style={styles.header}>
              <TouchableOpacity
                onPress={() => navigation.goBack()}
                style={styles.backBtn}
                activeOpacity={0.7}>
                <AntDesign name="arrow-left" size={22} color={Colors.primary} />
              </TouchableOpacity>
              <Text style={styles.title}>Tạo tài khoản</Text>
            </View>

            <Text style={styles.subtitle}>
              Đăng ký để kết nối và trò chuyện realtime cùng bạn bè.
            </Text>

            <View style={styles.form}>
              {generalError ? (
                <View style={styles.errorBox}>
                  <AntDesign name="close-circle" size={16} color={Colors.error} />
                  <Text style={styles.generalErrorText}>{generalError}</Text>
                </View>
              ) : null}

              <AppInput
                label="Họ và tên"
                placeholder="Nguyễn Văn A"
                value={name}
                onChangeText={t => {
                  setName(t);
                  if (nameError) setNameError('');
                  if (generalError) setGeneralError('');
                }}
                errorText={nameError}
                autoCorrect={false}
                returnKeyType="next"
                containerStyle={styles.inputContainer}
                leftIcon={<AntDesign name="user" size={18} color={Colors.textSecondary} />}
              />

              <AppInput
                label="Email"
                placeholder="vidu@gmail.com"
                value={email}
                onChangeText={t => {
                  setEmail(t);
                  if (emailError) setEmailError('');
                  if (generalError) setGeneralError('');
                }}
                errorText={emailError}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                returnKeyType="next"
                containerStyle={styles.inputContainer}
                leftIcon={<AntDesign name="mail" size={18} color={Colors.textSecondary} />}
              />

              <AppInput
                label="Mật khẩu"
                placeholder="Tối thiểu 6 ký tự"
                value={password}
                onChangeText={t => {
                  setPassword(t);
                  if (passwordError) setPasswordError('');
                  if (generalError) setGeneralError('');
                }}
                errorText={passwordError}
                secureTextEntry
                returnKeyType="next"
                containerStyle={styles.inputContainer}
                leftIcon={<AntDesign name="lock" size={18} color={Colors.textSecondary} />}
              />

              <AppInput
                label="Nhập lại mật khẩu"
                placeholder="Xác nhận lại mật khẩu"
                value={confirmPassword}
                onChangeText={t => {
                  setConfirmPassword(t);
                  if (confirmPasswordError) setConfirmPasswordError('');
                  if (generalError) setGeneralError('');
                }}
                errorText={confirmPasswordError}
                secureTextEntry
                returnKeyType="done"
                onSubmitEditing={handleRegister}
                containerStyle={styles.inputContainer}
                leftIcon={<AntDesign name="lock" size={18} color={Colors.textSecondary} />}
              />

              <AppButton
                label="Đăng ký tài khoản"
                onPress={handleRegister}
                loading={isLoading}
                style={styles.registerBtn}
              />

              <View style={styles.footerRow}>
                <Text style={styles.footerText}>Đã có tài khoản? </Text>
                <TouchableOpacity
                  onPress={() => navigation.navigate('Login')}
                  activeOpacity={0.7}>
                  <Text style={styles.linkText}>Đăng nhập</Text>
                </TouchableOpacity>
              </View>
            </View>
          </ScrollView>
        </TouchableWithoutFeedback>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  flex: {
    flex: 1,
  },
  scroll: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingVertical: 20,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  backBtn: {
    padding: 8,
    marginRight: 8,
    marginLeft: -8,
  },
  title: {
    fontSize: 26,
    fontWeight: '700',
    color: Colors.textMain,
  },
  subtitle: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginBottom: 24,
    lineHeight: 20,
  },
  form: {
    width: '100%',
  },
  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    borderWidth: 1,
    borderColor: Colors.error,
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
    gap: 8,
  },
  generalErrorText: {
    color: Colors.error,
    fontSize: 13,
    flex: 1,
  },
  inputContainer: {
    marginBottom: 16,
  },
  registerBtn: {
    marginTop: 8,
    width: '100%',
  },
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 24,
    marginBottom: 16,
  },
  footerText: {
    color: Colors.textSecondary,
    fontSize: 14,
  },
  linkText: {
    color: Colors.primary,
    fontSize: 14,
    fontWeight: '600',
  },
});
