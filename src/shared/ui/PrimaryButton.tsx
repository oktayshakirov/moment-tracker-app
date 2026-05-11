import React from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { useAppTheme } from '@/shared/theme/ThemeContext';
import { radii, typography } from '@/shared/theme/tokens';

type Props = {
  label: string;
  onPress: () => void;
  variant?: 'filled' | 'ghost' | 'danger';
  disabled?: boolean;
  loading?: boolean;
  style?: StyleProp<ViewStyle>;
};

export function PrimaryButton({
  label,
  onPress,
  variant = 'filled',
  disabled,
  loading,
  style,
}: Props) {
  const theme = useAppTheme();

  return (
    <Pressable
      accessibilityRole="button"
      disabled={disabled || loading}
      onPress={() => {
        void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        onPress();
      }}
      style={({ pressed }) => [
        styles.base,
        variant === 'filled' && { backgroundColor: theme.accent },
        variant === 'ghost' && {
          backgroundColor: 'transparent',
          borderWidth: StyleSheet.hairlineWidth,
          borderColor: theme.separator,
        },
        variant === 'danger' && { backgroundColor: theme.danger },
        pressed && { opacity: 0.88 },
        (disabled || loading) && { opacity: 0.45 },
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={variant === 'ghost' ? theme.text : '#fff'} />
      ) : (
        <Text
          style={[
            styles.label,
            {
              color:
                variant === 'ghost' ? theme.text : variant === 'danger' ? '#fff' : '#fff',
            },
          ]}
        >
          {label}
        </Text>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: radii.md,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 48,
  },
  label: {
    fontSize: typography.body,
    fontWeight: '600',
  },
});
