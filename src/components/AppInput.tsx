import React from 'react';
import {
  TextInput,
  View,
  Text,
  StyleSheet,
  TextInputProps,
  ViewStyle,
} from 'react-native';
import { Colors } from '../constants/colors';

interface AppInputProps extends TextInputProps {
  label?: string;
  errorText?: string;
  containerStyle?: ViewStyle;
  leftIcon?: React.ReactNode;
}

export default function AppInput({
  label,
  errorText,
  containerStyle,
  leftIcon,
  ...rest
}: AppInputProps) {
  return (
    <View style={containerStyle}>
      {label ? <Text style={styles.label}>{label}</Text> : null}
      <View style={[styles.inputWrapper, errorText ? styles.inputWrapperError : null]}>
        {leftIcon ? <View style={styles.iconContainer}>{leftIcon}</View> : null}
        <TextInput
          style={[styles.input, leftIcon ? styles.inputWithIcon : null]}
          placeholderTextColor={Colors.textSecondary}
          selectionColor={Colors.primary}
          {...rest}
        />
      </View>
      {errorText ? <Text style={styles.errorText}>{errorText}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  label: {
    color: Colors.textSecondary,
    fontSize: 13,
    marginBottom: 6,
    fontWeight: '500',
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: Colors.border,
    height: 48,
  },
  inputWrapperError: {
    borderColor: Colors.error,
  },
  iconContainer: {
    paddingLeft: 12,
    paddingRight: 6,
  },
  input: {
    flex: 1,
    color: Colors.textMain,
    fontSize: 15,
    paddingHorizontal: 14,
    height: '100%',
  },
  inputWithIcon: {
    paddingLeft: 4,
  },
  errorText: {
    color: Colors.error,
    fontSize: 12,
    marginTop: 4,
  },
});
