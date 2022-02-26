import '@nomiclabs/hardhat-waffle';
import fs from 'fs';
import { HardhatUserConfig, task } from 'hardhat/config';
const mnemonic = fs.existsSync('.secret') ? fs.readFileSync('.secret').toString().trim() : '';

const config: HardhatUserConfig = {
  solidity: '0.8.2',
  networks: {
    bsc: {
      url: `https://bsc-dataseed.binance.org`,
      accounts: [`0x${mnemonic}`],
      chainId: 56,
    },
    bsctest: {
      url: `https://data-seed-prebsc-1-s1.binance.org:8545`,
      accounts: [`0x${mnemonic}`],
      chainId: 97,
    }
  },
};

export default config;
