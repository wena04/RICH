import { useRouter } from 'expo-router';
import { SafeAreaView, ScrollView, StatusBar, StyleSheet, Text, View } from 'react-native';

import { ScreenHeader } from '@/components/rich';
import { PRIMARY_GREEN, TEXT_PRIMARY, TEXT_SECONDARY } from '@/constants/Colors';

const ITEMS = [
  ['本地存储', '账户、分类、预算和交易默认保存在本设备的 SQLite 数据库中。'],
  ['不需要账户', '当前版本没有登录、云同步或远程分析服务。'],
  ['导出与分享', '只有在您主动导出时，应用才会把 CSV 或数据库文件交给系统分享面板。之后的存储位置由您选择。'],
  ['导入数据', '导入完整数据库会覆盖本设备现有数据；操作前应先导出一份数据库备份。'],
  ['设备安全', '导出文件可能包含敏感财务信息，请使用设备锁和可信的存储位置保护文件。'],
] as const;

export default function PrivacyScreen() {
  const router = useRouter();

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={PRIMARY_GREEN} />
      <ScreenHeader title="隐私政策" onBack={() => router.back()} backgroundColor={PRIMARY_GREEN} />
      <ScrollView contentContainerStyle={styles.content}>
        {ITEMS.map(([title, body], index) => (
          <View key={title} style={[styles.row, index > 0 && styles.divider]}>
            <Text style={styles.title}>{title}</Text>
            <Text style={styles.body}>{body}</Text>
          </View>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFFFFF' },
  content: { paddingHorizontal: 18, paddingBottom: 40 },
  row: { paddingVertical: 18 },
  divider: { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: '#DDDDDD' },
  title: { marginBottom: 6, fontSize: 14, fontWeight: '600', color: TEXT_PRIMARY },
  body: { fontSize: 13, lineHeight: 21, color: TEXT_SECONDARY },
});
