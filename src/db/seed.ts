import type { AppDb } from "./db";
import { newId } from "../utils/id";

/**
 * Seed data for demo/testing purposes.
 * Only runs if database is empty (no transactions).
 */
export async function seedDemoData(db: AppDb): Promise<void> {
  // Check if already seeded
  const existing = await db.getFirstAsync<{ count: number }>(
    "SELECT COUNT(*) as count FROM transactions",
  );
  if (existing && existing.count > 0) {
    return; // Already has data
  }

  const now = new Date().toISOString();
  const today = new Date();

  // Create accounts
  const accounts = [
    { id: newId("acc"), name: "现金", type: "cash" },
    { id: newId("acc"), name: "Chase", type: "bank" },
    { id: newId("acc"), name: "微信", type: "stored_value" },
  ];

  for (const acc of accounts) {
    await db.runAsync(
      "INSERT INTO accounts (id, name, type, created_at, updated_at) VALUES (?, ?, ?, ?, ?)",
      [acc.id, acc.name, acc.type, now, now],
    );
  }

  // Create categories
  const categories = [
    { id: newId("cat"), name: "餐饮" },
    { id: newId("cat"), name: "交通" },
    { id: newId("cat"), name: "购物" },
    { id: newId("cat"), name: "娱乐" },
    { id: newId("cat"), name: "日用" },
    { id: newId("cat"), name: "医疗" },
    { id: newId("cat"), name: "工资" },
    { id: newId("cat"), name: "兼职" },
  ];

  for (const cat of categories) {
    await db.runAsync(
      "INSERT INTO categories (id, name, created_at, updated_at) VALUES (?, ?, ?, ?)",
      [cat.id, cat.name, now, now],
    );
  }

  // Create subcategories (two-level taxonomy → richer charts + entry tagging)
  const subcategoryDefs: Record<string, string[]> = {
    餐饮: ["早餐", "午餐", "晚餐", "外卖", "咖啡", "聚餐"],
    交通: ["地铁", "公交", "打车"],
    购物: ["衣服", "数码", "书籍"],
    娱乐: ["电影", "游戏", "KTV", "演唱会"],
    日用: ["洗护", "日杂"],
    医疗: ["买药", "看病"],
  };

  const subcategories: Array<{ id: string; categoryId: string; name: string }> =
    [];
  for (const [catName, subNames] of Object.entries(subcategoryDefs)) {
    const parent = categories.find((c) => c.name === catName);
    if (!parent) continue;
    for (const subName of subNames) {
      const id = newId("sub");
      subcategories.push({ id, categoryId: parent.id, name: subName });
      await db.runAsync(
        "INSERT INTO subcategories (id, category_id, name, created_at, updated_at) VALUES (?, ?, ?, ?, ?)",
        [id, parent.id, subName, now, now],
      );
    }
  }

  // Map a sample transaction's note to one of its category's subcategories.
  const noteToSub: Record<string, string> = {
    午餐: "午餐", 早餐: "早餐", 晚餐: "晚餐", 外卖: "外卖", 咖啡: "咖啡",
    下午茶: "咖啡", 聚餐: "聚餐",
    地铁: "地铁", 公交: "公交", 公交卡充值: "公交", 打车: "打车",
    衣服: "衣服", 鞋子: "衣服", 数码配件: "数码", 书籍: "书籍",
    电影票: "电影", 游戏: "游戏", KTV: "KTV", 演唱会: "演唱会",
    感冒药: "买药",
  };

  // Helper to get random item
  const pick = <T>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)];

  // Helper to format date
  const formatDate = (d: Date): string => {
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  };

  // Helper to get date N days ago
  const daysAgo = (n: number): Date => {
    const d = new Date(today);
    d.setDate(d.getDate() - n);
    return d;
  };

  // Sample transactions (37 entries)
  const expenseCategories = categories.filter(
    (c) => !["工资", "兼职"].includes(c.name),
  );
  const incomeCategories = categories.filter((c) =>
    ["工资", "兼职"].includes(c.name),
  );

  const sampleTransactions = [
    // Today
    {
      type: "expense",
      amount: 2580,
      date: formatDate(today),
      cat: "餐饮",
      note: "午餐",
    },
    {
      type: "expense",
      amount: 1500,
      date: formatDate(today),
      cat: "交通",
      note: "地铁",
    },

    // Yesterday
    {
      type: "expense",
      amount: 3200,
      date: formatDate(daysAgo(1)),
      cat: "餐饮",
      note: "晚餐",
    },
    {
      type: "expense",
      amount: 850,
      date: formatDate(daysAgo(1)),
      cat: "日用",
      note: "纸巾",
    },
    {
      type: "expense",
      amount: 4500,
      date: formatDate(daysAgo(1)),
      cat: "娱乐",
      note: "电影票",
    },

    // 2 days ago
    {
      type: "expense",
      amount: 1280,
      date: formatDate(daysAgo(2)),
      cat: "餐饮",
      note: "早餐",
    },
    {
      type: "expense",
      amount: 2100,
      date: formatDate(daysAgo(2)),
      cat: "餐饮",
      note: "咖啡",
    },
    {
      type: "expense",
      amount: 3500,
      date: formatDate(daysAgo(2)),
      cat: "交通",
      note: "打车",
    },

    // 3 days ago
    {
      type: "expense",
      amount: 8900,
      date: formatDate(daysAgo(3)),
      cat: "购物",
      note: "衣服",
    },
    {
      type: "expense",
      amount: 2200,
      date: formatDate(daysAgo(3)),
      cat: "餐饮",
      note: "午餐",
    },
    {
      type: "income",
      amount: 1500000,
      date: formatDate(daysAgo(3)),
      cat: "工资",
      note: "月薪",
    },

    // 5 days ago
    {
      type: "expense",
      amount: 5600,
      date: formatDate(daysAgo(5)),
      cat: "餐饮",
      note: "聚餐",
    },
    {
      type: "expense",
      amount: 1200,
      date: formatDate(daysAgo(5)),
      cat: "日用",
      note: "洗衣液",
    },
    {
      type: "expense",
      amount: 3800,
      date: formatDate(daysAgo(5)),
      cat: "交通",
      note: "公交卡充值",
    },

    // 7 days ago
    {
      type: "expense",
      amount: 15000,
      date: formatDate(daysAgo(7)),
      cat: "医疗",
      note: "感冒药",
    },
    {
      type: "expense",
      amount: 2500,
      date: formatDate(daysAgo(7)),
      cat: "餐饮",
      note: "外卖",
    },
    {
      type: "expense",
      amount: 6800,
      date: formatDate(daysAgo(7)),
      cat: "娱乐",
      note: "游戏",
    },

    // 10 days ago
    {
      type: "expense",
      amount: 4200,
      date: formatDate(daysAgo(10)),
      cat: "餐饮",
      note: "下午茶",
    },
    {
      type: "expense",
      amount: 18500,
      date: formatDate(daysAgo(10)),
      cat: "购物",
      note: "数码配件",
    },
    {
      type: "income",
      amount: 80000,
      date: formatDate(daysAgo(10)),
      cat: "兼职",
      note: "外快",
    },

    // 14 days ago
    {
      type: "expense",
      amount: 3100,
      date: formatDate(daysAgo(14)),
      cat: "餐饮",
      note: "早餐",
    },
    {
      type: "expense",
      amount: 2800,
      date: formatDate(daysAgo(14)),
      cat: "餐饮",
      note: "午餐",
    },
    {
      type: "expense",
      amount: 4500,
      date: formatDate(daysAgo(14)),
      cat: "餐饮",
      note: "晚餐",
    },
    {
      type: "expense",
      amount: 1500,
      date: formatDate(daysAgo(14)),
      cat: "交通",
      note: "地铁",
    },

    // 18 days ago
    {
      type: "expense",
      amount: 25000,
      date: formatDate(daysAgo(18)),
      cat: "购物",
      note: "鞋子",
    },
    {
      type: "expense",
      amount: 3200,
      date: formatDate(daysAgo(18)),
      cat: "娱乐",
      note: "KTV",
    },

    // 21 days ago
    {
      type: "expense",
      amount: 2100,
      date: formatDate(daysAgo(21)),
      cat: "餐饮",
      note: "午餐",
    },
    {
      type: "expense",
      amount: 8500,
      date: formatDate(daysAgo(21)),
      cat: "日用",
      note: "生活用品",
    },
    {
      type: "expense",
      amount: 1800,
      date: formatDate(daysAgo(21)),
      cat: "交通",
      note: "公交",
    },

    // 25 days ago
    {
      type: "expense",
      amount: 12000,
      date: formatDate(daysAgo(25)),
      cat: "娱乐",
      note: "演唱会",
    },
    {
      type: "expense",
      amount: 3500,
      date: formatDate(daysAgo(25)),
      cat: "餐饮",
      note: "聚餐",
    },

    // 28 days ago
    {
      type: "expense",
      amount: 2200,
      date: formatDate(daysAgo(28)),
      cat: "餐饮",
      note: "外卖",
    },
    {
      type: "expense",
      amount: 4800,
      date: formatDate(daysAgo(28)),
      cat: "交通",
      note: "打车",
    },
    {
      type: "income",
      amount: 1500000,
      date: formatDate(daysAgo(28)),
      cat: "工资",
      note: "月薪",
    },

    // 30 days ago
    {
      type: "expense",
      amount: 6500,
      date: formatDate(daysAgo(30)),
      cat: "购物",
      note: "书籍",
    },
    {
      type: "expense",
      amount: 2800,
      date: formatDate(daysAgo(30)),
      cat: "餐饮",
      note: "午餐",
    },
    {
      type: "expense",
      amount: 9200,
      date: formatDate(daysAgo(30)),
      cat: "日用",
      note: "护肤品",
    },
  ];

  // Insert transactions
  for (const tx of sampleTransactions) {
    const cat = categories.find((c) => c.name === tx.cat);
    const acc = pick(accounts);
    const subName = noteToSub[tx.note ?? ""];
    const sub = subName
      ? subcategories.find((s) => s.categoryId === cat?.id && s.name === subName)
      : undefined;

    await db.runAsync(
      `INSERT INTO transactions (id, type, amount_cents, date, account_id, category_id, subcategory_id, note, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        newId("txn"),
        tx.type,
        tx.amount,
        tx.date,
        acc.id,
        cat?.id ?? null,
        sub?.id ?? null,
        tx.note,
        now,
        now,
      ],
    );
  }

  console.log(`Seeded ${sampleTransactions.length} demo transactions`);
}
