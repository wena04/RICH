import { Link } from 'expo-router';
import { StyleSheet } from 'react-native';

import { Text, View } from '@/components/Themed';

export default function HomeScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>RICH (MVP)</Text>
      <Text style={styles.subtitle}>Offline-first personal finance (local-only)</Text>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>This month (placeholder)</Text>
        <Text>Expense: ¥0.00</Text>
        <Text>Income: ¥0.00</Text>
      </View>

      <View style={styles.links}>
        <Link href="/(tabs)/transactions">Go to Transactions</Link>
        <Link href="/(tabs)/charts">Go to Charts</Link>
        <Link href="/(tabs)/more">Go to More</Link>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    gap: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
  },
  subtitle: {
    opacity: 0.8,
  },
  card: {
    padding: 16,
    borderRadius: 12,
    gap: 6,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '600',
  },
  links: {
    gap: 12,
  },
});
