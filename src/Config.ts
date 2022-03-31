import classNames from 'classnames';

export const Config = {
  ChainId: 56,
  ChainView: 'https://bscscan.com',
  ChainLink: 'https://bsc-dataseed.binance.org/',
  ChainAddressView: 'https://bscscan.com/address/',
  ChainTX: 'https://bscscan.com/tx/',
  gasPrice: 0,
  Contract: {
    Wolf: '0x14f112d437271e01664bb3680BcbAe2f6A3Fb5fB',
    ERC20API: '0x21843eA51595F470b7ff456248f1FF6b3a02DC87',
    Barn: '0x10A6DC9fb8F8794d1Dc7D16B035c40923B148AA4',
    Wool: '0xAA15535fd352F60B937B4e59D8a2D52110A419dD',
    Milk: '0x60Ca032Ba8057FedB98F6A5D9ba0242AD2182177',
    BuildingGameManager: '0xbA58c345cA328F8bfA6A5607a15C2128CC6fBE61',
  },
};
export const AbiConf: Record<keyof typeof Config.Contract, any> = {
  Wolf: require('src/abi/Wolf.json'),
  ERC20API: require('src/abi/WoolfTownAPI.abi.json'),
  Barn: require('src/abi/wtBarn.abi.json'),
  Wool: require('src/abi/ERC20.json'),
  Milk: require('src/abi/ERC20.json'),
  BuildingGameManager: require('src/abi/BuildingGameManager.json'),
};

export function sleep(t = 100) {
  return new Promise((resolve) => setTimeout(resolve, t));
}

export const cn = classNames.bind({});
