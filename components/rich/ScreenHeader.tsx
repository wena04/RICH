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

import {
  BORDER_COLOR,
  CARD_BACKGROUND,
  TEXT_PRIMARY,
  TEXT_SECONDARY,
} from '@/constants/Colors';
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
  backgroundColor = CARD_BACKGROUND,
  borderBottom = false,
  style,
  titleStyle,
  actionWidth = RICH_SIZE.headerAction,
}: ScreenHeaderProps) {
  const actionSlotWidth = Math.max(actionWidth, RICH_SIZE.minimumTouchTarget);

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
          style={[styles.action, { width: actionSlotWidth }]}
        >
          <FontAwesome name="chevron-left" size={18} color={TEXT_PRIMARY} />
        </Pressable>
      ) : (
        <View style={[styles.action, { width: actionSlotWidth }]} />
      )}

      <View
        pointerEvents="none"
        style={[
          styles.copy,
          {
            left: actionSlotWidth + RICH_SPACING.md,
            right: actionSlotWidth + RICH_SPACING.md,
          },
        ]}
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

      <View style={[styles.action, { width: actionSlotWidth }]}>{right}</View>
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
    borderBottomColor: BORDER_COLOR,
  },
  action: {
    height: RICH_SIZE.minimumTouchTarget,
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
    ...RICH_TYPE.caption,
    color: TEXT_SECONDARY,
    textAlign: 'center',
  },
});
