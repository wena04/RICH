import { ActivityIndicator, Image, Pressable, SafeAreaView, StyleSheet, Text, View } from 'react-native';

import { CARD_BACKGROUND, TEXT_PRIMARY, TEXT_SECONDARY } from '@/constants/Colors';

type StartupErrorProps = {
  retrying: boolean;
  onRetry: () => void;
};

/**
 * Shown instead of the app when the local database cannot be opened or migrated.
 * Reuses the launch artwork so the transition from the splash screen stays calm.
 */
export function StartupError({ retrying, onRetry }: StartupErrorProps) {
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.body}>
        <Image
          source={require('../../assets/images/rich-start.png')}
          style={styles.art}
          resizeMode="contain"
          accessible={false}
        />
        <Text style={styles.title} accessibilityRole="header">
          账本没有打开
        </Text>
        <Text style={styles.message}>
          本地数据暂时无法读取，已有记录不会因此删除。请重新打开；如果一直失败，可以完全退出后再启动 App。
        </Text>
        <Pressable
          onPress={onRetry}
          disabled={retrying}
          style={({ pressed }) => [styles.button, (pressed || retrying) && styles.buttonPressed]}
          accessibilityRole="button"
          accessibilityState={{ disabled: retrying, busy: retrying }}
        >
          {retrying ? <ActivityIndicator size="small" color="#FFFFFF" /> : null}
          <Text style={styles.buttonText}>{retrying ? '正在打开' : '重新打开'}</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: CARD_BACKGROUND },
  body: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 32 },
  art: { width: 174, height: 156 },
  title: { marginTop: 28, fontSize: 18, fontWeight: '700', color: TEXT_PRIMARY },
  message: {
    marginTop: 10,
    fontSize: 13,
    lineHeight: 20,
    color: TEXT_SECONDARY,
    textAlign: 'center',
  },
  button: {
    marginTop: 28,
    alignSelf: 'stretch',
    minHeight: 50,
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#111111',
  },
  buttonPressed: { opacity: 0.8 },
  buttonText: { color: '#FFFFFF', fontSize: 15, fontWeight: '600' },
});
