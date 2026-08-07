import FontAwesome from '@expo/vector-icons/FontAwesome';
import type { ReactNode } from 'react';
import {
  Pressable,
  StyleSheet,
  Text,
  type TextStyle,
  View,
  type ViewStyle,
  type StyleProp,
} from 'react-native';

import { TEXT_PRIMARY } from '@/constants/Colors';
import { RICH_SIZE, RICH_SPACING, RICH_TYPE } from '@/constants/Design';

type ScreenHeaderProps = {
  title: string;
  onBack?: () => void;
  right?: ReactNode;
  subtitle?: string;
  backgroundColor?: string;
  borderBottom?: boolean;
  style?: StyleProp<ViewStyle>;
  titleStyle?: StyleProp<TextStyle>;
  actionWidth?: number;
};

export function ScreenHeader({
  title,
  onBack,
  right,
  subtitle,
  backgroundColor = '#FFFFFF',
  borderBottom = false,
  style,
  titleStyle,
  actionWidth = RICH_SIZE.headerAction,
}: ScreenHeaderProps) {
  return (
    <View
      style={[
        styles.header,
        { backgroundColor },
        borderBottom && styles.borderBottom,
        style,
      ]}
    >
      {onBack ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="返回"
          hitSlop={8}
          onPress={onBack}
          style={[styles.action, { width: actionWidth }]}
        >
          <FontAwesome name="chevron-left" size={18} color={TEXT_PRIMARY} />
        </Pressable>
      ) : (
        <View style={[styles.action, { width: actionWidth }]} />
      )}

      <View
        pointerEvents="none"
        style={[styles.copy, { left: actionWidth + RICH_SPACING.md, right: actionWidth + RICH_SPACING.md }]}
      >
        <Text numberOfLines={1} style={[styles.title, titleStyle]}>
          {title}
        </Text>
        {subtitle ? (
          <Text numberOfLines={1} style={styles.subtitle}>
            {subtitle}
          </Text>
        ) : null}
      </View>

      <View style={[styles.action, { width: actionWidth }]}>{right}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    minHeight: RICH_SIZE.screenHeader,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: RICH_SPACING.md,
  },
  borderBottom: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#E5E5E5',
  },
  action: {
    height: RICH_SIZE.headerAction,
    alignItems: 'center',
    justifyContent: 'center',
  },
  copy: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    ...RICH_TYPE.screenTitle,
    color: TEXT_PRIMARY,
    textAlign: 'center',
  },
  subtitle: {
    marginTop: 2,
    fontSize: 10.5,
    color: '#666666',
    textAlign: 'center',
  },
});
