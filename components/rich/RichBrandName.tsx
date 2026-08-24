import { Platform, StyleProp, Text, TextStyle } from 'react-native';

import { TEXT_PRIMARY } from '@/constants/Colors';

interface RichBrandNameProps {
  color?: string;
  size?: number;
  style?: StyleProp<TextStyle>;
}

/** Original Rich记账 header treatment: Avenir Next Bold + smaller PingFang SC Semibold. */
export function RichBrandName({ color = TEXT_PRIMARY, size = 28, style }: RichBrandNameProps) {
  return (
    <Text accessibilityLabel="Rich记账" style={[{ color }, style]}>
      <Text
        style={{
          color,
          fontFamily: Platform.select({ ios: 'AvenirNext-Bold', web: 'Avenir Next' }),
          fontSize: size,
          fontWeight: '700',
        }}>
        Rich
      </Text>
      <Text
        style={{
          color,
          fontFamily: Platform.select({ ios: 'PingFangSC-Semibold', web: 'PingFang SC' }),
          fontSize: size * (11 / 12),
          fontWeight: '600',
        }}>
        记账
      </Text>
    </Text>
  );
}
