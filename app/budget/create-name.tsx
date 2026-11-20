import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import {
  AccessibilityInfo,
  Image,
  Pressable,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ScreenHeader } from '@/components/rich/ScreenHeader';
import { PRIMARY_GREEN, TEXT_PRIMARY } from '@/constants/Colors';
import {
  BUDGET_EMOJI,
  DEFAULT_BUDGET_EMOJI,
  ENVELOPE_NAME_MAX,
  characterCount,
} from '@/src/features/budgets/envelopeForm';

/** Creating a budget, step 2 of 3 (original 输入预算名称): an emoji and a name. */
export default function CreateBudgetNameScreen() {
  const router = useRouter();
  const { kind } = useLocalSearchParams<{ kind: 'monthly' | 'special' }>();
  const [icon, setIcon] = useState<string>(DEFAULT_BUDGET_EMOJI);
  const [name, setName] = useState('');
  const [hint, setHint] = useState<string | null>(null);

  function next() {
    const trimmed = name.trim();
    if (!trimmed) {
      setHint('请输入预算名称');
      AccessibilityInfo.announceForAccessibility?.('请输入预算名称');
      return;
    }
    router.push({ pathname: '/budget/create-amount', params: { kind, name: trimmed, icon } });
  }

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <StatusBar barStyle="dark-content" backgroundColor={PRIMARY_GREEN} />
      <ScreenHeader
        title="输入预算名称"
        titleStyle={styles.navTitle}
        onBack={() => router.back()}
        backgroundColor={PRIMARY_GREEN}
        actionWidth={64}
        right={
          <Pressable onPress={next} hitSlop={8} style={styles.headerActionSlot} accessibilityRole="button">
            <Text style={styles.headerAction}>下一步</Text>
          </Pressable>
        }
      />

      <View style={styles.top}>
        <View style={styles.field}>
          <View style={styles.iconDisc}>
            <Text style={styles.iconEmoji}>{icon}</Text>
          </View>
          <TextInput
            value={name}
            onChangeText={(value) => {
              // Keep at most ENVELOPE_NAME_MAX characters (a Chinese character counts once).
              setName(characterCount(value) > ENVELOPE_NAME_MAX ? Array.from(value).slice(0, ENVELOPE_NAME_MAX).join('') : value);
              setHint(null);
            }}
            placeholder="输入预算名称"
            placeholderTextColor="#AAAAAA"
            autoFocus
            returnKeyType="next"
            onSubmitEditing={next}
            style={styles.input}
            accessibilityLabel="预算名称"
          />
          <Image source={require('../../assets/images/ui/icon_describe.png')} style={styles.editIcon} accessible={false} />
        </View>
        {hint ? <Text style={styles.hint}>{hint}</Text> : null}
      </View>

      <ScrollView style={styles.grid} contentContainerStyle={styles.gridContent} keyboardShouldPersistTaps="handled">
        {BUDGET_EMOJI.map((emoji) => {
          const selected = emoji === icon;
          return (
            <Pressable
              key={emoji}
              onPress={() => setIcon(emoji)}
              style={styles.cell}
              accessibilityRole="button"
              accessibilityLabel={`选择图标 ${emoji}`}
              accessibilityState={{ selected }}
            >
              <View style={[styles.cellDisc, selected && styles.cellDiscOn]}>
                <Text style={styles.cellEmoji}>{emoji}</Text>
              </View>
            </Pressable>
          );
        })}
      </ScrollView>
    </SafeAreaView>
  );
}

// Measured from the original capture (402pt iPhone, 3x): a 352.6 × 56.6pt white field 50pt below
// the title's centre on a green band ending 43.7pt below it; emoji on a 5-column, 61.8pt grid, the
// chosen one on a 34.3pt #F6F7F8 disc.
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFFFFF' },
  navTitle: { fontSize: 18 },
  headerActionSlot: { alignSelf: 'stretch', alignItems: 'flex-end', justifyContent: 'center' },
  headerAction: { fontSize: 17, color: TEXT_PRIMARY },
  top: { paddingTop: 28.2, paddingBottom: 43.7, paddingHorizontal: 24.7, backgroundColor: PRIMARY_GREEN },
  field: {
    height: 56.6,
    paddingLeft: 11.7,
    paddingRight: 14,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
  },
  iconDisc: {
    width: 33,
    height: 33,
    borderRadius: 16.5,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F6F7F8',
  },
  iconEmoji: { fontSize: 22 },
  // No browser focus ring (web preview); the caret shows focus, as on iOS.
  input: { flex: 1, marginLeft: 16.3, fontSize: 17, color: TEXT_PRIMARY, paddingVertical: 0, outlineStyle: 'none' } as object,
  editIcon: { width: 24, height: 24, tintColor: '#999999' },
  hint: { position: 'absolute', left: 24, bottom: 14, fontSize: 13, color: TEXT_PRIMARY },
  grid: { flex: 1 },
  gridContent: { paddingTop: 26.3, paddingHorizontal: 16, paddingBottom: 40, flexDirection: 'row', flexWrap: 'wrap' },
  cell: { width: '20%', height: 61.8, alignItems: 'center', justifyContent: 'center' },
  cellDisc: { width: 34.3, height: 34.3, borderRadius: 17.15, alignItems: 'center', justifyContent: 'center' },
  cellDiscOn: { backgroundColor: '#F6F7F8' },
  cellEmoji: { fontSize: 23 },
});
