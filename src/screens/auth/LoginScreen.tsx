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

type Props = AuthScreenProps<'Login'>;

export default function LoginScreen({ navigation }: Props) {
  const { login, isLoading } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [generalError, setGeneralError] = useState('');

  const validate = (): boolean => {
    let valid = true;
    setEmailError('');
    setPasswordError('');
    setGeneralError('');

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
      setPasswordError('Mật khẩu phải có tối thiểu 6 ký tự.');
      valid = false;
    }

    return valid;
  };

  const handleLogin = async () => {
    Keyboard.dismiss();
    if (!validate()) return;

    const result = await login(email, password);
    if (!result.success) {
      setGeneralError(result.error || 'Đăng nhập không thành công.');
      Alert.alert('Đăng nhập thất bại', result.error || 'Vui lòng kiểm tra lại thông tin.');
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
            <View style={styles.logoContainer}>
              <View style={styles.logoCircle}>
                <AntDesign name="message" size={40} color={Colors.white} />
              </View>
              <Text style={styles.appName}>BlueTalk</Text>
              <Text style={styles.tagline}>Ứng dụng chat realtime với Firebase</Text>
            </View>

            <View style={styles.form}>
              {generalError ? (
                <View style={styles.errorBox}>
                  <AntDesign name="close-circle" size={16} color={Colors.error} />
                  <Text style={styles.generalErrorText}>{generalError}</Text>
                </View>
              ) : null}

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
                returnKeyType="done"
                onSubmitEditing={handleLogin}
                containerStyle={styles.inputContainer}
                leftIcon={<AntDesign name="lock" size={18} color={Colors.textSecondary} />}
              />

              <AppButton
                label="Đăng nhập"
                onPress={handleLogin}
                loading={isLoading}
                style={styles.loginBtn}
              />

              <View style={styles.footerRow}>
                <Text style={styles.footerText}>Chưa có tài khoản? </Text>
                <TouchableOpacity
                  onPress={() => navigation.navigate('Register')}
                  activeOpacity={0.7}>
                  <Text style={styles.linkText}>Đăng ký ngay</Text>
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
    justifyContent: 'center',
    paddingHorizontal: 24,
    paddingVertical: 32,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 36,
  },
  logoCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  appName: {
    fontSize: 32,
    fontWeight: '700',
    color: Colors.textMain,
    letterSpacing: 1,
    marginBottom: 8,
  },
  tagline: {
    fontSize: 14,
    color: Colors.textSecondary,
    textAlign: 'center',
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
  loginBtn: {
    marginTop: 8,
    width: '100%',
  },
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 24,
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
