import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import type { Moment } from '../domain/moment';

type Props = {
  moment: Moment;
  style?: object;
};

export function MomentBackground({ moment, style }: Props) {
  const v = moment.backgroundValue;

  if (v.kind === 'image') {
    return (
      <Image
        source={{ uri: v.uri }}
        style={[StyleSheet.absoluteFill, style]}
        contentFit="cover"
        transition={200}
      />
    );
  }

  if (v.kind === 'gradient') {
    return (
      <LinearGradient
        colors={v.colors as [string, string, ...string[]]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[StyleSheet.absoluteFill, style]}
      />
    );
  }

  return <View style={[StyleSheet.absoluteFill, { backgroundColor: v.color }, style]} />;
}
