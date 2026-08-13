export type CategoryIconCatalogItem = readonly [label: string, iconId: string];

export type CategoryIconCatalogSection = Readonly<{
  title: string;
  items: readonly CategoryIconCatalogItem[];
}>;

/**
 * The full 添加自定义类目 library, transcribed from the local reference set.
 * Repeated ideas intentionally reuse one icon so the visual vocabulary stays
 * consistent across sections; every distinct idea has its own semantic glyph.
 */
export const CATEGORY_ICON_SECTIONS: readonly CategoryIconCatalogSection[] = [
  { title: '默认', items: [['餐饮','food'],['零食','snack'],['衣服','tshirt'],['交通','bus'],['旅行','suitcase'],['孩子','baby'],['宠物','paw'],['网费话费','phone'],['烟酒','wine'],['学习','book'],['日用','jug'],['住房','house'],['美妆','lipstick'],['医疗','medkit'],['发红包','redpacket'],['汽车/加油','fuel'],['娱乐','gamepad'],['请客送礼','gift'],['电器数码','camera'],['运动','dumbbell'],['水电煤','drop'],['其他','grid']] },
  { title: '餐饮零食', items: [['早餐','bread'],['午餐','noodles'],['晚餐','drumstick'],['三餐','bowl'],['宵夜','pizza'],['水果','apple'],['饮料','drink'],['咖啡','coffee'],['买菜','carrot'],['外卖','burger']] },
  { title: '日常家用', items: [['柴米油盐','bottles'],['清洁','broom'],['理发','scissors'],['洗澡','bathtub'],['快递','box']] },
  { title: '购物相关', items: [['购物','bag'],['饰品','necklace'],['鞋子','shoe'],['电子产品','laptop'],['电器','washer'],['家具','sofa']] },
  { title: '电子产品', items: [['手机','phone'],['3c配件','cable'],['购买app','appstore'],['付费会员','gem'],['相机','camera']] },
  { title: '娱乐', items: [['游戏','gamepad'],['聚会','party'],['电影','film'],['k歌','mic'],['打赏','handcoin'],['运动','dumbbell'],['旅行','suitcase'],['景区门票','ticket']] },
  { title: '家庭相关', items: [['家人','family'],['父母','parent'],['恋爱','love'],['孩子','baby'],['宠物','paw']] },
  { title: '育儿相关', items: [['育儿','baby'],['奶粉','milkcan'],['奶瓶','babybottle'],['辅食','babyfood'],['纸尿裤','diaper'],['玩具','pinwheel'],['早教','bulb'],['亲子游','parentchild'],['疫苗看病','syringe']] },
  { title: '汽车维修', items: [['汽车','car'],['停车费','parkpin'],['洗车','carwash'],['过路费','toll'],['汽车罚款','minuscircle'],['维修保养','wrench'],['车贷','caryen'],['配件','carparts'],['车险','carshield'],['车检','carsearch']] },
  { title: '人情往来', items: [['人情','handshake'],['请客送礼','gift'],['发红包','redpacket'],['礼金','envmoney']] },
  { title: '交通', items: [['公交','bus'],['飞机','plane'],['火车','train'],['地铁','metro'],['打车','taxi'],['自行车','bike'],['轮船','ship']] },
  { title: '住房', items: [['酒店','hotel'],['房租','houseyen'],['房贷','houseloan']] },
  { title: '医疗相关', items: [['挂号费','regbox'],['就诊','clipplus'],['药品','pill'],['住院','hospbed'],['保健品','heartpulse']] },
  { title: '学习提升', items: [['书籍','book'],['考试','exam'],['文具','ruler'],['培训','grad']] },
  { title: '出差', items: [['交通','bus'],['酒店住宿','hotel'],['宴请招待','bell'],['差旅费','ticketyen']] },
  { title: '办公相关', items: [['员工工资','wallet'],['水电杂费','drop'],['网络通讯','signal'],['办公用品','printer'],['场地租金','buildingyen'],['进货费','cartbox'],['维修费','wrench'],['清洁费','broom'],['材料费','boxstack'],['物流费','truck'],['员工奖金','trophyyen'],['员工团建','flag']] },
  { title: '其他分类', items: [['工作','briefcase'],['保险','umbrella'],['捐赠','handheart'],['利息','coins'],['其他','grid']] },
  { title: '收入相关', items: [['工资薪水','wallet'],['生活费','moneybag'],['收红包','redpacket'],['兼职外快','clockyen'],['奖金','briefcaseyen'],['投资理财','chart'],['报销','ticketyen'],['退款返款','refund'],['保险','umbrella'],['其他收益','piggy']] },
] as const;

export const CATEGORY_ICON_CATALOG_ITEMS = CATEGORY_ICON_SECTIONS.flatMap(
  ({ title, items }) => items.map(([label, iconId]) => ({ section: title, label, iconId })),
);
