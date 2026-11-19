import { useRouter } from 'expo-router';
import {
  Image,
  type ImageSourcePropType,
  StyleSheet,
  Pressable,
  StatusBar,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { RichBrandName, ScreenHeader } from '@/components/rich';
import { Text, View } from '@/components/Themed';
import { PRIMARY_GREEN, TEXT_PRIMARY, TEXT_SECONDARY } from '@/constants/Colors';
import { RichChevron } from '@/components/rich/RichChevron';

interface MenuItemProps {
  icon: ImageSourcePropType;
  label: string;
  onPress: () => void;
}

function MenuItem({ icon, label, onPress }: MenuItemProps) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      style={({ pressed }) => [styles.menuItem, pressed && styles.menuItemPressed]}
      onPress={onPress}
    >
      <Image source={icon} style={styles.menuIcon} accessible={false} />
      <Text style={styles.menuLabel}>{label}</Text>
      <RichChevron tone="muted" />
    </Pressable>
  );
}

export default function MoreScreen() {
  const router = useRouter();

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={PRIMARY_GREEN} />
      
      <ScreenHeader title="我的" onBack={() => router.back()} backgroundColor={PRIMARY_GREEN} />

      <ScrollView style={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Settings Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>设置</Text>
          
          <View style={styles.menuGroup}>
            <MenuItem
              icon={require('../../assets/images/ui/icon_clipboard_list.png')}
              label="全部账单"
              onPress={() => router.push('/transactions')}
            />
            <MenuItem 
              icon={require('../../assets/images/ui/icon_asset_management.png')}
              label="账户管理" 
              onPress={() => router.push('/accounts')} 
            />
            <MenuItem 
              icon={require('../../assets/images/ui/icon_sort.png')}
              label="分类管理" 
              onPress={() => router.push('/categories')} 
            />
          </View>
        </View>

        {/* Data Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>数据</Text>
          
          <View style={styles.menuGroup}>
            <MenuItem 
              icon={require('../../assets/images/ui/icon_data_export.png')}
              label="导出数据" 
              onPress={() => router.push('/import-export')} 
            />
            <MenuItem 
              icon={require('../../assets/images/ui/icon_clipboard.png')}
              label="导入数据" 
              onPress={() => router.push('/import-export')} 
            />
          </View>
        </View>

        {/* About Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>关于</Text>
          
          <View style={styles.menuGroup}>
            <MenuItem 
              icon={require('../../assets/images/ui/icon_help_center.png')}
              label="关于应用" 
              onPress={() => router.push('/about')}
            />
            <MenuItem 
              icon={require('../../assets/images/ui/icon_agreement.png')}
              label="隐私政策" 
              onPress={() => router.push('/privacy')}
            />
          </View>
        </View>

        {/* App Info */}
        <View style={styles.appInfo}>
          <RichBrandName size={16} />
          <Text style={styles.appVersion}>本地存储 · 隐私优先</Text>
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: PRIMARY_GREEN,
  },
  scrollContent: {
    flex: 1,
    backgroundColor: '#F5F5F5',
    paddingTop: 24,
  },
  section: {
    marginBottom: 24,
    backgroundColor: 'transparent',
  },
  sectionTitle: {
    fontSize: 13,
    color: TEXT_SECONDARY,
    paddingHorizontal: 20,
    marginBottom: 8,
  },
  menuGroup: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 16,
    borderRadius: 3,
    overflow: 'hidden',
  },
  menuItem: {
    minHeight: 56,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F5F5F5',
  },
  menuItemPressed: { backgroundColor: '#F2F5F3' },
  menuIcon: {
    width: 24,
    height: 24,
    marginRight: 12,
  },
  menuLabel: {
    flex: 1,
    fontSize: 16,
    color: TEXT_PRIMARY,
  },
  appInfo: {
    alignItems: 'center',
    paddingVertical: 32,
    backgroundColor: 'transparent',
  },
  appVersion: {
    fontSize: 12,
    color: TEXT_SECONDARY,
    marginTop: 4,
  },
});
