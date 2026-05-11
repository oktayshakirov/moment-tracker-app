import React from 'react';
import { Platform, StyleSheet, View, type ViewStyle } from 'react-native';
import { BlurView } from 'expo-blur';
import { useAppTheme } from '@/shared/theme/ThemeContext';
import { radii, shadows } from '@/shared/theme/tokens';

type Props = {
  children: React.ReactNode;
  style?: ViewStyle;
};

export function GlassCard({ children, style }: Props) {
  const theme = useAppTheme();
  const isDark = theme.bg === '#000000';

  if (Platform.OS === 'ios') {
    return (
      <BlurView
        intensity={50}
        tint={isDark ? 'dark' : 'light'}
        style={[
          styles.card,
          shadows.card,
          {
            borderColor: theme.glassBorder,
            backgroundColor: theme.glassFill,
          },
          style,
        ]}
      >
        {children}
      </BlurView>
    );
  }

  return (
    <View
      style={[
        styles.card,
        shadows.card,
        {
          backgroundColor: theme.glassFill,
          borderColor: theme.glassBorder,
        },
        style,
      ]}
    >
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: radii.lg,
    overflow: 'hidden',
    borderWidth: StyleSheet.hairlineWidth,
  },
});
