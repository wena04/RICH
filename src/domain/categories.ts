/** Default expense/income categories matching the original RICH app order. */
export const DEFAULT_CATEGORIES: Array<{ name: string; icon: string }> = [
  { name: '餐饮', icon: 'icon_canyin' },
  { name: '衣服', icon: 'icon_yifu' },
  { name: '交通', icon: 'icon_jiaotong' },
  { name: '网费话费', icon: 'icon_wfhf' },
  { name: '学习', icon: 'icon_xuexi' },
  { name: '日用', icon: 'icon_riyong' },
  { name: '住房', icon: 'icon_zhufang' },
  { name: '医疗', icon: 'icon_yiliao' },
  { name: '发红包', icon: 'icon_fahongbao' },
  { name: '汽车/加油', icon: 'icon_qichejiayou' },
  { name: '娱乐', icon: 'icon_yule' },
  { name: '请客送礼', icon: 'icon_qingkesongli' },
  { name: '电器数码', icon: 'icon_dianqishuma' },
  { name: '运动', icon: 'icon_yundong' },
  { name: '理发', icon: 'icon_lifa' },
  { name: '付费会员', icon: 'icon_fufeihuiyuan' },
  { name: '还钱', icon: 'icon_huankuan' },
  { name: '工作', icon: 'icon_gongzuo' },
  { name: '购物', icon: 'icon_gouwu' },
  { name: '旅行', icon: 'icon_lvxing' },
  { name: '人情/借钱', icon: 'icon_renqing' },
  { name: '买菜', icon: 'icon_maicai' },
];

/** Default income categories matching the original RICH app order. */
export const DEFAULT_INCOME_CATEGORIES: Array<{ name: string; icon: string }> = [
  { name: '工资', icon: 'icon_gongzixinshui' },
  { name: '兼职', icon: 'icon_jianzhiwaikuai' },
  { name: '理财', icon: 'icon_touzilicai' },
  { name: '奖金', icon: 'icon_jiangjin' },
  { name: '报销', icon: 'icon_baoxiao' },
  { name: '退款', icon: 'icon_tuikuanfankuan' },
  { name: '收红包', icon: 'icon_shouhongbao' },
  { name: '其他收入', icon: 'icon_qitashouyi' },
];

/**
 * The order categories are shown in on every screen (记一笔, 编辑, 分类管理): the starter
 * categories in the original order, then the person's own by name. `list` picks whose starter order
 * applies; 'all' puts the expense starters before the income ones.
 */
export function sortCategoriesForDisplay<T extends { name: string }>(
  categories: readonly T[],
  list: 'expense' | 'income' | 'all' = 'all',
): T[] {
  const starters =
    list === 'expense'
      ? DEFAULT_CATEGORIES
      : list === 'income'
        ? DEFAULT_INCOME_CATEGORIES
        : [...DEFAULT_CATEGORIES, ...DEFAULT_INCOME_CATEGORIES];
  const order = new Map(starters.map((category, index) => [category.name, index]));
  return [...categories].sort((a, b) => {
    const aOrder = order.get(a.name) ?? Number.MAX_SAFE_INTEGER;
    const bOrder = order.get(b.name) ?? Number.MAX_SAFE_INTEGER;
    return aOrder === bOrder ? a.name.localeCompare(b.name, 'zh-CN') : aOrder - bOrder;
  });
}
