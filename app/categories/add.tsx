import { useRouter } from "expo-router";
import { useState } from "react";
import {
  Pressable,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TextInput,
  View,
  Text,
} from "react-native";
import FontAwesome from "@expo/vector-icons/FontAwesome";

import { PRIMARY_GREEN, TEXT_PRIMARY, TEXT_SECONDARY } from "@/constants/Colors";
import { CategoryIcon } from "@/components/CategoryIcon";
import { getDb } from "@/src/db/db";
import { createCategory, getCategoryByName } from "@/src/db/repo/categories";

// [sectionTitle, [ [label, iconId], ... ] ]
const SECTIONS: [string, [string, string][]][] = [
  ["默认", [["餐饮","food"],["零食","snack"],["衣服","tshirt"],["交通","bus"],["旅行","suitcase"],["孩子","baby"],["宠物","paw"],["网费话费","phone"],["烟酒","wine"],["学习","book"],["日用","jug"],["住房","house"],["美妆","lipstick"],["医疗","medkit"],["发红包","redpacket"],["汽车/加油","fuel"],["娱乐","gamepad"],["请客送礼","gift"],["电器数码","camera"],["运动","dumbbell"],["水电煤","drop"],["其他","grid"]]],
  ["餐饮零食", [["早餐","bread"],["午餐","noodles"],["晚餐","drumstick"],["三餐","bowl"],["宵夜","pizza"],["水果","apple"],["饮料","drink"],["咖啡","coffee"],["买菜","carrot"],["外卖","burger"]]],
  ["日常家用", [["柴米油盐","bottles"],["清洁","broom"],["理发","scissors"],["洗澡","bathtub"],["快递","box"]]],
  ["购物相关", [["购物","bag"],["饰品","necklace"],["鞋子","shoe"],["电子产品","laptop"],["电器","washer"],["家具","sofa"]]],
  ["电子产品", [["手机","phone"],["3c配件","cable"],["购买app","appstore"],["付费会员","gem"],["相机","camera"]]],
  ["娱乐", [["游戏","gamepad"],["聚会","party"],["电影","film"],["k歌","mic"],["打赏","handheart"],["运动","dumbbell"],["旅行","suitcase"],["景区门票","ticket"]]],
  ["家庭相关", [["家人","family"],["父母","parent"],["恋爱","love"],["孩子","baby"],["宠物","paw"]]],
  ["育儿相关", [["育儿","baby"],["奶粉","milkcan"],["奶瓶","babybottle"],["辅食","babyfood"],["纸尿裤","diaper"],["玩具","pinwheel"],["早教","bulb"],["亲子游","parentchild"],["疫苗看病","syringe"]]],
  ["汽车维修", [["汽车","car"],["停车费","parkpin"],["洗车","carwash"],["过路费","toll"],["汽车罚款","minuscircle"],["维修保养","wrench"],["车贷","caryen"],["配件","steering"],["车险","carshield"],["车检","carsearch"]]],
  ["人情往来", [["人情","handshake"],["请客送礼","gift"],["发红包","redpacket"],["礼金","envmoney"]]],
  ["交通", [["公交","bus"],["飞机","plane"],["火车","train"],["地铁","metro"],["打车","taxi"],["自行车","bike"],["轮船","ship"]]],
  ["住房", [["酒店","hotel"],["房租","houseyen"],["房贷","houseloan"]]],
  ["医疗相关", [["挂号费","regbox"],["就诊","clipplus"],["药品","pill"],["住院","hospbed"],["保健品","heartpulse"]]],
  ["学习提升", [["书籍","book"],["考试","exam"],["文具","ruler"],["培训","grad"]]],
  ["出差", [["交通","bus"],["酒店住宿","hotel"],["宴请招待","bell"],["差旅费","ticketyen"]]],
  ["办公相关", [["员工工资","wallet"],["水电杂费","drop"],["网络通讯","signal"],["办公用品","printer"],["场地租金","buildingyen"],["进货费","cartbox"],["维修费","wrench"],["清洁费","broom"],["材料费","boxstack"],["物流费","truck"],["员工奖金","trophyyen"],["员工团建","flag"]]],
  ["其他分类", [["工作","briefcase"],["保险","umbrella"],["捐赠","handheart"],["利息","coins"],["其他","grid"]]],
  ["收入相关", [["工资薪水","wallet"],["生活费","moneybag"],["收红包","redpacket"],["兼职外快","clockyen"],["奖金","envmoney"],["投资理财","chart"],["报销","ticketyen"],["退款返款","refund"],["保险","umbrella"],["其他收益","piggy"]]],
];

export default function AddCategoryScreen() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [selected, setSelected] = useState<{ id: string; label: string } | null>(null);
  const [saving, setSaving] = useState(false);

  async function onDone() {
    if (saving || !selected) return;
    const finalName = (name.trim() || selected.label).slice(0, 6);
    setSaving(true);
    try {
      const db = await getDb();
      const existing = await getCategoryByName(db, finalName);
      if (!existing) await createCategory(db, finalName, selected.id);
      router.back();
    } catch (e) {
      console.error("Failed to add category:", e);
    } finally {
      setSaving(false);
    }
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.head}>
        <Pressable onPress={() => router.back()} style={styles.back}>
          <FontAwesome name="chevron-left" size={18} color={TEXT_PRIMARY} />
        </Pressable>
        <Text style={styles.title}>添加自定义类目</Text>
        <Pressable onPress={onDone} disabled={!selected}>
          <Text style={[styles.done, !selected && styles.doneOff]}>完成</Text>
        </Pressable>
      </View>

      <TextInput
        style={styles.nameInput}
        value={name}
        onChangeText={(v) => setName(v.slice(0, 6))}
        placeholder="请输入类目名称（不超过6个字符）"
        placeholderTextColor={TEXT_SECONDARY}
      />

      <ScrollView showsVerticalScrollIndicator={false}>
        {SECTIONS.map(([title, items]) => (
          <View key={title} style={styles.section}>
            <Text style={styles.sectionTitle}>{title}</Text>
            <View style={styles.dash} />
            <View style={styles.grid}>
              {items.map(([label, id], i) => {
                const active = selected?.id === id && selected?.label === label;
                return (
                  <Pressable
                    key={label + i}
                    style={styles.item}
                    onPress={() => setSelected({ id, label })}
                  >
                    <View style={[styles.iconWrap, active && styles.iconWrapActive]}>
                      <CategoryIcon id={id} size={24} />
                    </View>
                    <Text style={[styles.itemLabel, active && styles.itemLabelActive]}>
                      {label}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </View>
        ))}
        <View style={{ height: 40 }} />
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
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#F0F0F0",
  },
  back: { padding: 6 },
  title: { fontSize: 16, fontWeight: "600", color: TEXT_PRIMARY },
  done: { fontSize: 14, fontWeight: "600", color: PRIMARY_GREEN },
  doneOff: { color: "#B8B8B8" },
  nameInput: {
    paddingHorizontal: 18,
    paddingVertical: 14,
    fontSize: 14,
    color: TEXT_PRIMARY,
    borderBottomWidth: 1,
    borderBottomColor: "#F0F0F0",
  },
  section: { paddingHorizontal: 16, paddingTop: 14 },
  sectionTitle: { fontSize: 14, fontWeight: "700", color: TEXT_PRIMARY },
  dash: { borderBottomWidth: 1, borderBottomColor: "#EEE", borderStyle: "dashed", marginTop: 8, marginBottom: 2 },
  grid: { flexDirection: "row", flexWrap: "wrap" },
  item: { width: `${100 / 5}%`, alignItems: "center", paddingVertical: 10 },
  iconWrap: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#F5F5F5",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 5,
  },
  iconWrapActive: { backgroundColor: `${PRIMARY_GREEN}22`, borderWidth: 2, borderColor: PRIMARY_GREEN },
  itemLabel: { fontSize: 10, color: TEXT_SECONDARY },
  itemLabelActive: { color: PRIMARY_GREEN, fontWeight: "600" },
});
