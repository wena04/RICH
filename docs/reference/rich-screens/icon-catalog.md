# Original RICH — full icon / category catalog

Cataloged from the 添加自定义类目 (icon picker) screenshots in the reference set. Drives the
hand-drawn SVG icon set. Line-art style: thin (~1.7px) rounded strokes, mostly monochrome gray
with occasional mint (#3FDEAE) accent detail.

## Add-screen default categories (22 + 管理分类)
餐饮, 衣服, 交通, 网费话费, 学习, 日用, 住房, 医疗, 发红包, 汽车/加油, 娱乐, 请客送礼,
电器数码, 运动, 理发, 付费会员, 还钱, 工作, 购物, 旅行, 人情/借钱, 买菜 → then **管理分类** (green gear tile).

"…" subcategory badges on: 餐饮, 住房, 汽车/加油, 娱乐, 请客送礼, 还钱, 购物.

## Icon picker (添加自定义类目) — sectioned library

- **默认**: 餐饮, 零食, 衣服, 交通, 旅行, 孩子, 宠物, 网费话费, 烟酒, 学习, 日用, 住房, 美妆, 医疗, 发红包, 汽车/加油, 娱乐, 请客送礼, 电器数码, 运动, 水电煤, 其他
- **餐饮零食**: 早餐, 午餐, 晚餐, 三餐, 宵夜, 水果, 饮料, 咖啡, 买菜, 外卖
- **日常家用**: 柴米油盐, 清洁, 理发, 洗澡, 快递
- **购物相关**: 购物, 饰品, 鞋子, 电子产品, 电器, 家具
- **电子产品**: 手机, 3c配件, 购买app, 付费会员, 相机
- **娱乐**: 游戏, 聚会, 电影, k歌, 打赏, 运动, 旅行, 景区门票
- **家庭相关**: 家人, 父母, 恋爱, 孩子, 宠物
- **育儿相关**: 育儿, 奶粉, 奶瓶, 辅食, 纸尿裤, 玩具, 早教, 亲子游, 疫苗看病
- **汽车维修**: 汽车, 停车费, 洗车, 过路费, 汽车罚款, 维修保养, 车贷, 配件, 车险, 车检
- **人情往来**: 人情, 请客送礼, 发红包, 礼金
- **交通**: 公交, 飞机, 火车, 地铁, 打车, 自行车, 轮船
- **住房**: 酒店, 房租, 房贷
- **医疗相关**: 挂号费, 就诊, 药品, 住院, 保健品
- **学习提升**: 书籍, 考试, 文具, 培训
- **出差**: 交通, 酒店住宿, 宴请招待, 差旅费
- **办公相关**: 员工工资, 水电杂费, 网络通讯, 办公用品, 场地租金, 进货费, 维修费, 清洁费, 材料费, 物流费, 员工奖金, 员工团建
- **其他分类**: 工作, 保险, 捐赠, 利息, 其他
- **收入相关**: 工资薪水, 生活费, 收红包, 兼职外快, 奖金, 投资理财, 报销, 退款返款, 保险, 其他收益

## Current implementation (November 19, 2026)

Category art is the original Rich 1.1.0 artwork, converted to vectors with the disc separated:

- `assets/icons/categories/icon_*.svg` — 123 original glyphs (black `#000000` + accent `#02B17B`,
  48-unit viewBox, no background). These are the editable masters. They were traced from the
  original 3× rasters by `npm run icons:trace <dir>` (`scripts/icons/trace-original-category-icons.mjs`):
  the #F7F7F7 disc is removed exactly (colour-to-alpha), the two inks are traced separately at 4×,
  and the black layer extends under touching accent pixels so the junctions don't seam. Measured
  against the originals at 3×: mean IoU 0.955, mean colour difference 1.4/255 over the disc (the
  differences are anti-aliasing at stroke edges). `icon_huankuan` was a 34pt original that the app
  scaled to the 48pt tile; it is stored at that scaled size, as the original drew it.
- The disc, selection ring, and dimming are drawn in code: #F7F7F7 circle, a 1.7pt black ring
  inside the disc when selected (the interior stays #F7F7F7, as measured), and 50% opacity for the
  other categories once one is selected.
- `npm run icons:generate` writes `components/icons/categoryArt.generated.ts` (SVG markup),
  `src/domain/categoryIcons/names.generated.ts` (valid names) and `assets/icons/gallery.html`
  (idle / dimmed / selected QA sheet); `npm run icons:check` fails when they are stale.
- `src/domain/categoryIcons/catalog.json` is the original 18-section, 134-item 添加自定义类目 library
  (`TallyTypeinfo.plist`). The picker stores the original `icon_*` name.
- `src/domain/categoryIcons/index.ts` resolves what to draw: the stored original icon, else the
  original icon for a known category name (catalog + aliases for starter/income names), else a
  legacy semantic id written by earlier builds (`food`, `bus`, …), else 其他.
- The original rasters (and the retired hand-drawn SVG set, recoverable from git history before
  this change) are no longer in the app. The rasters are kept off-repo in
  `~/Desktop/RICH-reference/original-category-rasters/`; `scripts/icons/extract-assets-car.swift`
  documents how they were pulled from `Assets.car`.
- UI artwork that is not a category glyph (`icon_setting` for 管理分类, `icon_three_dot` badges,
  tab bar, chevrons, keypad) stays as original 3× PNGs in `assets/images/ui/`.
