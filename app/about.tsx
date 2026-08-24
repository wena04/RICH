import { useRouter } from 'expo-router';
import { SafeAreaView, ScrollView, StatusBar, StyleSheet, Text, View } from 'react-native';

import { RichBrandName, ScreenHeader } from '@/components/rich';
import { PRIMARY_GREEN, TEXT_PRIMARY, TEXT_SECONDARY } from '@/constants/Colors';

export default function AboutScreen() {
  const router = useRouter();

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={PRIMARY_GREEN} />
      <ScreenHeader title="关于应用" onBack={() => router.back()} backgroundColor={PRIMARY_GREEN} />
      <ScrollView contentContainerStyle={styles.content}>
        <RichBrandName size={24} />
        <Text style={styles.version}>版本 1.0.0</Text>

        <View style={styles.section}>
          <Text style={styles.title}>本地优先的个人记账工具</Text>
          <Text style={styles.body}>
            用于记录收支、管理账户和分类、查看趋势，并按月设置总预算及分类预算。
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.title}>数据归您所有</Text>
          <Text style={styles.body}>
            账目保存在设备上的本地数据库中。您可以通过数据导入/导出页面创建完整数据库备份，或导出 CSV。
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F4F4F4' },
  content: { padding: 20, paddingBottom: 40 },
  version: { marginTop: 4, marginBottom: 24, fontSize: 12, color: TEXT_SECONDARY },
  section: {
    marginBottom: 12,
    padding: 16,
    backgroundColor: '#FFFFFF',
    borderRadius: 3,
  },
  title: { marginBottom: 8, fontSize: 14, fontWeight: '600', color: TEXT_PRIMARY },
  body: { fontSize: 13, lineHeight: 21, color: TEXT_SECONDARY },
});
