# Original RICH — full icon / category catalog

Cataloged from the 添加自定义类目 (icon picker) screenshots in the reference set. Drives the
hand-drawn SVG icon set. Line-art style: thin (~1.7px) rounded strokes, mostly monochrome gray
with occasional mint (#3ECDA5) accent detail.

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

## Build plan (incremental, hand-drawn SVG)

Full set is ~120 icons — too many to author at once, and renders must be eyeballed. So:

1. **Batch 1 (style check)** — done in `docs/mockups.html` sprite: 衣服(t-shirt), 买菜(carrot),
   付费会员(gem), 美妆(lipstick), 水电煤(drop), 其他(grid). Confirm stroke weight/proportions.
2. **Batch 2** — the rest of the 22 add-screen default categories (most visible).
3. **Batches 3+** — the picker library section by section.
4. Port the approved SVG set to code as a `react-native-svg` `<CategoryIcon name=…>` component.
