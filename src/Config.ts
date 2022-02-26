import classNames from 'classnames';

export const Config = {
  ChainId: 56,
  ChainView: 'https://bscscan.com',
  ChainLink: 'https://bsc-dataseed.binance.org/',
  ChainAddressView: 'https://bscscan.com/address/',
  ChainTX: 'https://bscscan.com/tx/',
  gasPrice: 0,
  Contract: {
    Wolf: '0xE686133662190070c4A4Bea477fCF48dF35F5b2c',
    ERC20API: '0x3AF9283827A36Eac379b10f603A340fd34a481aB',
    Barn: '0x58eaBB38cc9D68bEA8E645B0f5Ec741C82f2871B',
    Wool: '0xAA15535fd352F60B937B4e59D8a2D52110A419dD',
    Milk: '0x60Ca032Ba8057FedB98F6A5D9ba0242AD2182177',
  },
};
export const AbiConf: Record<keyof typeof Config.Contract, any> = {
  Wolf: require('src/abi/Wolf.json'),
  ERC20API: require('src/abi/WoolfTownAPI.abi.json'),
  Barn: require('src/abi/wtBarn.abi.json'),
  Wool: require('src/abi/ERC20.json'),
  Milk: require('src/abi/ERC20.json'),
};

export function sleep(t = 100) {
  return new Promise((resolve) => setTimeout(resolve, t));
}

export const cn = classNames.bind({});
