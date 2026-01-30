import { Link } from 'expo-router';
import { StyleSheet } from 'react-native';

import { Text, View } from '@/components/Themed';

export default function MoreScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>More</Text>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Setup</Text>
        <View style={styles.links}>
          <Link href="/accounts">Accounts</Link>
          <Link href="/categories">Categories</Link>
        </View>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Portability</Text>
        <View style={styles.links}>
          <Link href="/import-export">Import / Export</Link>
        </View>
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
    fontSize: 22,
    fontWeight: '700',
  },
  card: {
    padding: 16,
    borderRadius: 12,
    gap: 10,
  },
  cardTitle: {
    fontWeight: '600',
  },
  links: {
    gap: 10,
  },
});

