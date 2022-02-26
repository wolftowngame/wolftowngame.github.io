import { BigNumber } from 'ethers';

export interface Wolf {
  attributes: Array<{ trait_type: string; value: string }>;
  description: string;
  image: string;
  imageSmall: string;
  name: string;
}

export interface TokenStolenEvent {
  tx: string;
  key: string;
  event: 'TokenStolen';
  tokenId: BigNumber;
  address: string;
  timestamp: BigNumber;
  blockNumber: number;
}

export interface TransferEvent {
  tx: string;
  key: string;
  event: 'Transfer';
  from: string;
  to: string;
  tokenId: BigNumber;
  blockNumber: number;
  emiter: string;
}
