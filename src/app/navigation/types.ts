import type { NativeStackScreenProps } from '@react-navigation/native-stack';

export type RootStackParamList = {
  Home: undefined;
  MomentForm: { momentId?: string };
  MomentDetail: { momentId: string };
};

export type HomeScreenProps = NativeStackScreenProps<RootStackParamList, 'Home'>;
export type MomentFormScreenProps = NativeStackScreenProps<RootStackParamList, 'MomentForm'>;
export type MomentDetailScreenProps = NativeStackScreenProps<RootStackParamList, 'MomentDetail'>;
