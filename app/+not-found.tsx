import { Link, Stack } from 'expo-router';
import { StyleSheet } from 'react-native';

import { Text, View } from '@/components/Themed';
import { ACTION_BACKGROUND, ACTION_FOREGROUND, TEXT_PRIMARY, TEXT_SECONDARY } from '@/constants/Colors';

export default function NotFoundScreen() {
  return (
    <>
      <Stack.Screen options={{ title: '页面不存在' }} />
      <View style={styles.container}>
        <Text style={styles.title}>找不到这个页面</Text>
        <Text style={styles.body}>它可能已经移动，或者链接输入有误。</Text>

        <Link href="/" style={styles.link}>
          <Text style={styles.linkText}>返回首页</Text>
        </Link>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
    backgroundColor: '#FFFFFF',
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
    color: TEXT_PRIMARY,
  },
  body: {
    marginTop: 8,
    fontSize: 13,
    color: TEXT_SECONDARY,
  },
  link: {
    minWidth: 132,
    minHeight: 44,
    marginTop: 24,
    paddingHorizontal: 20,
    borderRadius: 3,
    backgroundColor: ACTION_BACKGROUND,
    textAlign: 'center',
    justifyContent: 'center',
  },
  linkText: {
    fontSize: 13,
    fontWeight: '600',
    color: ACTION_FOREGROUND,
  },
});
