import { useLocalSearchParams, useRouter } from "expo-router";
import { useState } from "react";
import {
  Image,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
  Pressable,
  ScrollView,
  StyleSheet,
  useWindowDimensions,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { Text, View } from "@/components/Themed";
import {
  CONTROL_BACKGROUND,
  PRIMARY_GREEN,
  TEXT_PRIMARY,
  TEXT_SECONDARY,
} from "@/constants/Colors";

// Original Rich 1.1.0 help artwork: four example people and how they split budgets / plans.
const TOPICS = {
  budget: {
    title: "预算示例",
    intro:
      "每个预算是一个用途明确的信封，把支出归入预算，就知道这笔钱还剩多少。",
    aspectRatio: 915 / 1355,
    pages: [
      require("../../assets/images/budget/icon_budget_help01.png"),
      require("../../assets/images/budget/icon_budget_help02.png"),
      require("../../assets/images/budget/icon_budget_help03.png"),
      require("../../assets/images/budget/icon_budget_help04.png"),
    ],
  },
  plan: {
    title: "计划示例",
    intro: "计划每月从一个预算中冻结固定金额，直到攒够目标。",
    aspectRatio: 915 / 1041,
    pages: [
      require("../../assets/images/budget/icon_plan_help01.png"),
      require("../../assets/images/budget/icon_plan_help02.png"),
      require("../../assets/images/budget/icon_plan_help03.png"),
      require("../../assets/images/budget/icon_plan_help04.png"),
    ],
  },
} as const;

export default function BudgetHelpScreen() {
  const router = useRouter();
  const { topic: topicParam } = useLocalSearchParams<{ topic?: string }>();
  const topic = TOPICS[topicParam === "plan" ? "plan" : "budget"];
  const { width } = useWindowDimensions();
  const pageWidth = Math.min(width, 430);
  const imageWidth = pageWidth - 48;
  const [page, setPage] = useState(0);

  function onScroll(event: NativeSyntheticEvent<NativeScrollEvent>) {
    const next = Math.round(event.nativeEvent.contentOffset.x / pageWidth);
    if (next !== page) setPage(next);
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.head}>
        <Pressable
          onPress={() => router.back()}
          style={({ pressed }) => [
            styles.headerAction,
            styles.backAction,
            pressed && styles.headerActionPressed,
          ]}
          accessibilityRole="button"
          accessibilityLabel="返回"
        >
          <Image source={require("../../assets/images/ui/nav_icon_back_black.png")} style={styles.backIcon} accessible={false} />
        </Pressable>
        <Text style={styles.title}>{topic.title}</Text>
        <View style={styles.headerAction} />
      </View>

      <ScrollView contentContainerStyle={styles.body}>
        <Text style={styles.intro}>{topic.intro}</Text>

        <ScrollView
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          onMomentumScrollEnd={onScroll}
          style={{ width: pageWidth, alignSelf: "center", flexGrow: 0 }}
        >
          {topic.pages.map((source, index) => (
            <View key={index} style={[styles.page, { width: pageWidth }]}>
              <Image
                source={source}
                resizeMode="contain"
                style={{
                  width: imageWidth,
                  height: imageWidth / topic.aspectRatio,
                }}
                accessibilityLabel={`${topic.title} ${index + 1}/${topic.pages.length}`}
              />
            </View>
          ))}
        </ScrollView>

        <View
          style={styles.dots}
          accessibilityLabel={`第 ${page + 1} 页，共 ${topic.pages.length} 页`}
        >
          {topic.pages.map((_, index) => (
            <View
              key={index}
              style={[styles.dot, index === page && styles.dotActive]}
            />
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#FFFFFF" },
  head: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    minHeight: 44,
    borderBottomWidth: 1,
    borderBottomColor: "#F0F0F0",
  },
  headerAction: {
    width: 44,
    height: 44,
    alignItems: "center",
    justifyContent: "center",
  },
  headerActionPressed: { backgroundColor: CONTROL_BACKGROUND },
  // Original back chevron: nav_icon_back_black, 16pt from the screen edge.
  backAction: { alignItems: "flex-start" },
  backIcon: { width: 16, height: 16 },
  title: { fontSize: 17, fontWeight: "600", color: TEXT_PRIMARY },
  intro: {
    marginHorizontal: 24,
    marginVertical: 16,
    fontSize: 12.5,
    lineHeight: 19,
    color: TEXT_SECONDARY,
  },
  body: { paddingBottom: 24 },
  page: { alignItems: "center" },
  dots: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 6,
    marginTop: 14,
  },
  dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: "#D8D8D8" },
  dotActive: { width: 16, backgroundColor: PRIMARY_GREEN },
});
