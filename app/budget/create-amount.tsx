import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import { AccessibilityInfo, Image, Pressable, StatusBar, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ScreenHeader } from '@/components/rich/ScreenHeader';
import { PRIMARY_GREEN, TEXT_PRIMARY } from '@/constants/Colors';
import { RICH_NUMERAL_FONT } from '@/constants/Design';
import { getDb } from '@/src/db/db';
import { createEnvelope } from '@/src/db/repo/envelopes';
import type { BudgetEnvelopeKind } from '@/src/domain/types';
import { validateEnvelopeForm } from '@/src/features/budgets/envelopeForm';
import { backspaceAmount, pressAmountKey } from '@/src/utils/amountInput';
import { currentMonth } from '@/src/utils/month';
import { useScaledStyles } from '@/components/rich/useScaledStyles';

const KEYS = ['1', '2', '3', '4', '5', '6', '7', '8', '9', 'delete', '0', '.'] as const;

/** Creating a budget, step 3 of 3 (original 设置预算金额): the amount on a green keypad. */
export default function CreateBudgetAmountScreen() {
  const styles = useScaledStyles(baseStyles, { measuredAt: 402, keep: FIXED });
  const router = useRouter();
  const params = useLocalSearchParams<{ kind: BudgetEnvelopeKind; name: string; icon: string }>();
  const kind: BudgetEnvelopeKind = params.kind === 'special' ? 'special' : 'monthly';
  const [amount, setAmount] = useState('');
  const [saving, setSaving] = useState(false);
  const [hint, setHint] = useState<string | null>(null);

  function press(key: (typeof KEYS)[number]) {
    setHint(null);
    setAmount((current) => (key === 'delete' ? backspaceAmount(current) : pressAmountKey(current, key)));
  }

  async function finish() {
    if (saving) return;
    const result = validateEnvelopeForm(kind, {
      name: params.name ?? '',
      icon: params.icon ?? null,
      amountText: amount.endsWith('.') ? amount.slice(0, -1) : amount,
      description: '',
    });
    if (!result.ok) {
      setHint(result.message);
      AccessibilityInfo.announceForAccessibility?.(result.message);
      return;
    }
    setSaving(true);
    try {
      const db = await getDb();
      await createEnvelope(db, {
        kind,
        name: result.value.name,
        icon: result.value.icon,
        description: null,
        amountCents: result.value.amountCents,
        startPeriod: currentMonth(),
      });
      // Close the three wizard steps and land back where 创建预算 was tapped.
      router.dismiss(3);
    } catch (error) {
      console.error('Failed to create budget:', error);
      setHint('预算没有保存，请稍后再试');
      setSaving(false);
    }
  }

  const label = kind === 'special' ? '请输入专项预算金额' : '请输入月度预算金额';

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={PRIMARY_GREEN} />
      <ScreenHeader
        title="设置预算金额"
        titleStyle={styles.navTitle}
        onBack={() => router.back()}
        backgroundColor={PRIMARY_GREEN}
        right={
          <Pressable onPress={() => void finish()} disabled={saving} hitSlop={8} style={styles.headerActionSlot} accessibilityRole="button">
            <Text style={styles.headerAction}>完成</Text>
          </Pressable>
        }
      />

      <View style={styles.display} accessible accessibilityLabel={`${label}，当前 ${amount || '0'} 元`}>
        <Text style={styles.amount} numberOfLines={1} adjustsFontSizeToFit>
          ¥{amount || '0.00'}
        </Text>
        <Text style={styles.label}>{hint ?? label}</Text>
      </View>

      <View style={styles.keypad}>
        {KEYS.map((key) => (
          <Pressable
            key={key}
            onPress={() => press(key)}
            style={({ pressed }) => [styles.key, pressed && styles.keyPressed]}
            accessibilityRole="button"
            accessibilityLabel={key === 'delete' ? '退格' : key === '.' ? '小数点' : key}
          >
            {key === 'delete' ? (
              <Image source={require('../../assets/images/ui/icon_keyboard_delete.png')} style={styles.deleteArt} accessible={false} />
            ) : (
              <Text style={styles.keyText}>{key}</Text>
            )}
          </Pressable>
        ))}
      </View>
    </SafeAreaView>
  );
}

// Measured from the original capture (402pt iPhone, 3x): the amount's digits start 249.7pt below
// the title's centre (32pt tall), the prompt 25.7pt under them; three keypad columns across the
// width less 11.6pt, on 59.6pt rows ending at the home indicator.
/** Measured on a 402pt phone and scaled with the width; the nav bar and keypad stay fixed. */
const FIXED = {
  navTitle: true,
  headerActionSlot: true,
  headerAction: true,
  keypad: true,
  key: true,
  keyText: true,
  deleteArt: true,
} as const;

const baseStyles = StyleSheet.create({
  container: { flex: 1, backgroundColor: PRIMARY_GREEN },
  navTitle: { fontSize: 18 },
  headerActionSlot: { alignSelf: 'stretch', alignItems: 'flex-end', justifyContent: 'center' },
  headerAction: { fontSize: 17, color: TEXT_PRIMARY },
  display: { flex: 1, alignItems: 'center', paddingTop: 218.8, paddingHorizontal: 24 },
  amount: { fontFamily: RICH_NUMERAL_FONT, fontSize: 42, lineHeight: 51, letterSpacing: 0.5, color: TEXT_PRIMARY },
  label: { marginTop: 13, fontSize: 15.6, color: TEXT_PRIMARY },
  keypad: { flexDirection: 'row', flexWrap: 'wrap', marginRight: 11.6 },
  key: { width: '33.333%', height: 59.6, alignItems: 'center', justifyContent: 'center' },
  keyPressed: { backgroundColor: 'rgba(0,0,0,0.06)' },
  keyText: { fontFamily: RICH_NUMERAL_FONT, fontSize: 20.3, color: TEXT_PRIMARY },
  deleteArt: { width: 40, height: 40 },
});
