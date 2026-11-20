import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Image, Pressable, StatusBar, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ScreenHeader } from '@/components/rich/ScreenHeader';
import { PRIMARY_GREEN, TEXT_PRIMARY } from '@/constants/Colors';
import type { BudgetEnvelopeKind } from '@/src/domain/types';

const CHECK_OFF = require('../../assets/images/budget/icon_check_button_gray.png');
const CHECK_ON = require('../../assets/images/budget/icon_check_button_black.png');
const EXAMPLES_TAG = require('../../assets/images/budget/icon_examples.png');

/** The original card copy, special budget first. */
const TYPES: { kind: BudgetEnvelopeKind; title: string; body: string; examples: [string, string] }[] = [
  { kind: 'special', title: '专项预算', body: '为实现某些计划的一次性专门预算', examples: ['🎮 游戏装备', '📖 学习基金'] },
  { kind: 'monthly', title: '月度预算', body: '用于生活的高频支出，每月循环的预算', examples: ['📅 日常开销', '💰 消费升级'] },
];

/** Creating a budget, step 1 of 3 (original 选择你想创建的预算类型). */
export default function CreateBudgetTypeScreen() {
  const router = useRouter();
  const [kind, setKind] = useState<BudgetEnvelopeKind | null>(null);

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={PRIMARY_GREEN} />
      <ScreenHeader
        title="选择你想创建的预算类型"
        titleStyle={styles.navTitle}
        onBack={() => router.back()}
        backgroundColor={PRIMARY_GREEN}
      />

      <View style={styles.cards}>
        {TYPES.map((type) => {
          const selected = kind === type.kind;
          return (
            <Pressable
              key={type.kind}
              onPress={() => setKind(type.kind)}
              style={({ pressed }) => [styles.card, pressed && styles.pressed]}
              accessibilityRole="radio"
              accessibilityState={{ checked: selected }}
              aria-checked={selected}
              accessibilityLabel={`${type.title}，${type.body}，示例：${type.examples.join('、')}`}
            >
              <View style={styles.cardBody}>
                <Text style={styles.cardText}>{type.body}</Text>
              </View>
              <View style={styles.cardHead}>
                <Image
                  source={selected ? CHECK_ON : CHECK_OFF}
                  style={selected ? styles.checkOn : styles.checkOff}
                  accessible={false}
                />
                <Text style={styles.cardTitle}>{type.title}</Text>
              </View>
              <Image source={EXAMPLES_TAG} style={styles.examplesTag} accessible={false} />
              <View style={styles.examples}>
                {type.examples.map((example) => (
                  <Text key={example} style={styles.example}>
                    {example}
                  </Text>
                ))}
              </View>
            </Pressable>
          );
        })}
      </View>

      <Pressable
        disabled={!kind}
        onPress={() => kind && router.push({ pathname: '/budget/create-name', params: { kind } })}
        style={({ pressed }) => [styles.next, kind ? styles.nextOn : styles.nextOff, pressed && styles.pressed]}
        accessibilityRole="button"
        accessibilityState={{ disabled: !kind }}
      >
        <Text style={[styles.nextText, kind ? styles.nextTextOn : styles.nextTextOff]}>下一步</Text>
      </Pressable>
    </SafeAreaView>
  );
}

// Measured from the original capture (402pt iPhone, 3x): 171.3 × 395.4pt cards 152.7pt below the
// title's centre, 24.7pt margins and a 10pt gap; a 290.6 × 45.3pt 下一步 bar 19.7pt above the home
// indicator.
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: PRIMARY_GREEN },
  navTitle: { fontSize: 18 },
  cards: { marginTop: 130.7, marginHorizontal: 24.7, flexDirection: 'row', gap: 10 },
  card: { flex: 1, height: 395.4, backgroundColor: '#FFFFFF' },
  pressed: { opacity: 0.85 },
  cardHead: { height: 53.7, flexDirection: 'row', alignItems: 'center' },
  checkOff: { width: 53.7, height: 53.7 },
  // The selected art is drawn 57pt; anchor it to the same corner.
  checkOn: { width: 58.8, height: 58.8, marginRight: -5.1, alignSelf: 'flex-start' },
  cardTitle: { flex: 1, fontSize: 20.5, fontWeight: '700', color: TEXT_PRIMARY, textAlign: 'center' },
  // The text is centred on the whole card, 10 characters a line.
  cardBody: { ...StyleSheet.absoluteFillObject, justifyContent: 'center', paddingHorizontal: 15 },
  cardText: { fontSize: 13.5, lineHeight: 18.7, color: TEXT_PRIMARY, textAlign: 'center' },
  examplesTag: { position: 'absolute', left: 24.3, bottom: 70.4, width: 38.3, height: 18.3 },
  examples: {
    position: 'absolute',
    left: 24.3,
    right: 24.7,
    bottom: 20.7,
    height: 49.7,
    justifyContent: 'center',
    backgroundColor: '#F7F7F7',
  },
  example: { fontSize: 12.5, lineHeight: 17.6, color: TEXT_PRIMARY, textAlign: 'center' },
  next: {
    position: 'absolute',
    bottom: 19.7,
    alignSelf: 'center',
    width: 290.6,
    maxWidth: '88%',
    height: 45.3,
    alignItems: 'center',
    justifyContent: 'center',
  },
  // Until a type is chosen the bar is a dark green with light green text, as captured.
  nextOff: { backgroundColor: '#1F6E56' },
  nextOn: { backgroundColor: TEXT_PRIMARY },
  nextText: { fontSize: 16.5 },
  nextTextOff: { color: '#9FEED6' },
  nextTextOn: { color: '#FFFFFF' },
});
