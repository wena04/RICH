/**
 * Category icons: the original Rich 1.1.0 artwork (vector glyphs in assets/icons/categories/) and
 * how a category's stored icon id and name resolve to one of them.
 *
 * `catalog.json` is the original 添加自定义类目 library (TallyTypeinfo.plist from the app bundle):
 * 18 sections of label → original icon name. It drives the icon picker and the name lookup.
 */
import catalog from './catalog.json';
import { type CategoryIconName, isCategoryIconName } from './names.generated';

export { CATEGORY_ICON_NAMES, isCategoryIconName, type CategoryIconName } from './names.generated';

type CatalogSection = { title: string; typeItems: { name: string; iconName: string }[] };

export type CategoryIconCatalogItem = readonly [label: string, iconName: CategoryIconName];

export type CategoryIconCatalogSection = Readonly<{
  title: string;
  items: readonly CategoryIconCatalogItem[];
}>;

function asIconName(value: string): CategoryIconName {
  if (!isCategoryIconName(value)) throw new Error(`Category catalog references missing art ${value}`);
  return value;
}

/** The full original 添加自定义类目 library, in its original section order. */
export const CATEGORY_ICON_SECTIONS: readonly CategoryIconCatalogSection[] = (catalog as CatalogSection[]).map(
  (section) => ({
    title: section.title,
    items: section.typeItems.map((item) => [item.name, asIconName(item.iconName)] as const),
  }),
);

export const CATEGORY_ICON_CATALOG_ITEMS = CATEGORY_ICON_SECTIONS.flatMap(({ title, items }) =>
  items.map(([label, iconName]) => ({ section: title, label, iconName })),
);

export const FALLBACK_CATEGORY_ICON: CategoryIconName = 'icon_qita';

/**
 * Names the original library doesn't list: the default income names, starter subcategories, and a
 * few renamed defaults. Each maps to the closest original artwork.
 */
const NAME_ALIASES: Record<string, CategoryIconName> = {
  工资: 'icon_gongzixinshui',
  兼职: 'icon_jianzhiwaikuai',
  理财: 'icon_touzilicai',
  退款: 'icon_tuikuanfankuan',
  其他收入: 'icon_qitashouyi',
  还钱: 'icon_huankuan',
  '人情/借钱': 'icon_renqing',
  '汽车/加油': 'icon_qichejiayou',
  汽车加油: 'icon_qichejiayou',
  校园餐饮: 'icon_sancan',
  聚餐: 'icon_juhui',
  公交地铁: 'icon_ditie',
  油费: 'icon_qichejiayou',
  停车: 'icon_tingchefei',
  水电网: 'icon_shuidianmei',
  看诊: 'icon_jiuzhen',
  健身: 'icon_yundong',
  住宿: 'icon_jiudian',
  活动门票: 'icon_jingqumenpiao',
  学费: 'icon_peixun',
  软件: 'icon_goumaiapp',
  效率工具: 'icon_dianzichanpin',
  视频: 'icon_dianying',
  音乐: 'icon_kge',
  云存储: 'icon_wangluotongxun',
};

/** Category name → original icon. The first catalog occurrence wins; aliases fill the gaps. */
export const ICON_BY_CATEGORY_NAME: Readonly<Record<string, CategoryIconName>> = (() => {
  const byName: Record<string, CategoryIconName> = {};
  for (const { label, iconName } of CATEGORY_ICON_CATALOG_ITEMS) byName[label] ??= iconName;
  return { ...byName, ...NAME_ALIASES };
})();

/**
 * Icon ids written by earlier builds, which used a hand-drawn set with semantic names. Databases
 * and CSV exports may still hold them, so they keep resolving to the matching original artwork.
 */
export const LEGACY_ICON_IDS: Readonly<Record<string, CategoryIconName>> = {
  apple: 'icon_shuiguo', appstore: 'icon_goumaiapp', baby: 'icon_haizi', babybottle: 'icon_naiping',
  babyfood: 'icon_fushi', bag: 'icon_gouwu', bathtub: 'icon_xizao', bell: 'icon_yanqingzhaodai',
  bike: 'icon_zixingche', book: 'icon_xuexi', bottles: 'icon_chaimiyouyan', bowl: 'icon_sancan',
  box: 'icon_kuaidi', boxstack: 'icon_cailiaofei', bread: 'icon_zaocan', briefcase: 'icon_gongzuo',
  briefcaseyen: 'icon_jiangjin', broom: 'icon_qingjie', buildingyen: 'icon_changdizujin',
  bulb: 'icon_zaojiao', burger: 'icon_waimai', bus: 'icon_jiaotong', cable: 'icon_3cpeijian',
  camera: 'icon_dianqishuma', car: 'icon_qiche', carparts: 'icon_peijian', carrot: 'icon_maicai',
  carsearch: 'icon_chejian', carshield: 'icon_chexian', cartbox: 'icon_jinhuofei',
  carwash: 'icon_xiche', caryen: 'icon_chedai', chart: 'icon_touzilicai', clipplus: 'icon_jiuzhen',
  clockyen: 'icon_jianzhiwaikuai', coffee: 'icon_kafei', coins: 'icon_lixi',
  diaper: 'icon_zhiniaoku', drink: 'icon_yinliao', drop: 'icon_shuidianmei',
  drumstick: 'icon_wancan', dumbbell: 'icon_yundong', envmoney: 'icon_lijin', exam: 'icon_kaoshi',
  family: 'icon_jiaren', film: 'icon_dianying', flag: 'icon_yuangongtuanjian', food: 'icon_canyin',
  fuel: 'icon_qichejiayou', gamepad: 'icon_yule', gear: 'icon_qita', gem: 'icon_fufeihuiyuan',
  gift: 'icon_qingkesongli', grad: 'icon_peixun', grid: 'icon_qita', handcoin: 'icon_dashang',
  handheart: 'icon_juanzeng', handshake: 'icon_renqing', heartpulse: 'icon_baojianpin',
  hospbed: 'icon_zhuyuan', hotel: 'icon_jiudian', house: 'icon_zhufang', houseloan: 'icon_fangdai',
  houseyen: 'icon_fangzu', jug: 'icon_riyong', laptop: 'icon_dianzichanpin',
  lipstick: 'icon_meizhuang', love: 'icon_lianai', medkit: 'icon_yiliao', metro: 'icon_ditie',
  mic: 'icon_kge', milkcan: 'icon_naifen', minuscircle: 'icon_qichefakuan',
  moneybag: 'icon_shenghuofei', necklace: 'icon_shipin', noodles: 'icon_wucan', parent: 'icon_fumu',
  parentchild: 'icon_qinziyou', parkpin: 'icon_tingchefei', party: 'icon_juhui', paw: 'icon_chongwu',
  phone: 'icon_wfhf', piggy: 'icon_qitashouyi', pill: 'icon_yaopin', pinwheel: 'icon_wanju',
  pizza: 'icon_xiaoye', plane: 'icon_feiji', printer: 'icon_bangongyongpin',
  redpacket: 'icon_fahongbao', refund: 'icon_tuikuanfankuan', regbox: 'icon_guahaofei',
  ruler: 'icon_wenju', scissors: 'icon_lifa', ship: 'icon_lunchuan', shoe: 'icon_xiezi',
  signal: 'icon_wangluotongxun', snack: 'icon_lingshi', sofa: 'icon_jiaju', steering: 'icon_peijian',
  suitcase: 'icon_lvxing', syringe: 'icon_yimiaokanbing', taxi: 'icon_dache',
  ticket: 'icon_jingqumenpiao', ticketyen: 'icon_chailvfei', toll: 'icon_guolufei',
  train: 'icon_huoche', trophyyen: 'icon_yuangongjiangjin', truck: 'icon_wuliufei',
  tshirt: 'icon_yifu', umbrella: 'icon_baoxian', wallet: 'icon_yuangonggongzi',
  washer: 'icon_dianqi', wine: 'icon_yanjiu', wrench: 'icon_weixiubaoyang',
};

/**
 * Which artwork to draw for a category or subcategory:
 * 1. an original icon the person chose (stored id),
 * 2. the original icon for a known category name,
 * 3. a legacy stored id from an earlier build,
 * 4. the original 其他 icon.
 */
export function resolveCategoryIconName(id?: string | null, name?: string | null): CategoryIconName {
  if (isCategoryIconName(id)) return id;
  const byName = name ? ICON_BY_CATEGORY_NAME[name.trim()] : undefined;
  if (byName) return byName;
  const legacy = id ? LEGACY_ICON_IDS[id] : undefined;
  return legacy ?? FALLBACK_CATEGORY_ICON;
}
