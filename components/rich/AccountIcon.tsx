import { Image } from 'react-native';

import type { AccountType } from '@/src/domain/types';

// Original Rich account artwork (Assets.car), one per account kind.
const ACCOUNT_ICONS: Record<AccountType, number> = {
  cash: require('../../assets/images/accounts/xianjin.png'),
  bank: require('../../assets/images/accounts/yinhangka.png'),
  credit: require('../../assets/images/accounts/qtxinyongka.png'),
  stored_value: require('../../assets/images/accounts/qtchuzhi.png'),
  investment: require('../../assets/images/accounts/qtlicai.png'),
};

export function AccountIcon({ type, size = 22 }: { type: AccountType; size?: number }) {
  return (
    <Image
      source={ACCOUNT_ICONS[type] ?? ACCOUNT_ICONS.cash}
      style={{ width: size, height: size }}
      resizeMode="contain"
      accessible={false}
    />
  );
}
