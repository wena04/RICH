import { Image, type ImageStyle, type StyleProp } from 'react-native';

interface RichBrandNameProps {
  size?: number;
  style?: StyleProp<ImageStyle>;
}

/** Exact Rich记账 title artwork from the supplied Rich 1.1.0 application. */
export function RichBrandName({ size = 28, style }: RichBrandNameProps) {
  const height = size * 1.35;

  return (
    <Image
      accessibilityLabel="Rich记账"
      accessibilityRole="image"
      resizeMode="contain"
      source={require('../../assets/images/rich-title.png')}
      style={[{ width: height * (498 / 162), height }, style]}
    />
  );
}
