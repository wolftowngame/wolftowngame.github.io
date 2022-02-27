import { BigNumber, ethers } from 'ethers';

export interface Wolf {
  attributes: Array<{ trait_type: string; value: string }>;
  description: string;
  image: string;
  imageSmall: string;
  name: string;
}

export interface TransferEvent {
  tx: string;
  key: string;
  data: Array<{
    event: string;
    from: string;
    to: string;
    tokenId: BigNumber;
  }>;
  blockNumber: number;
  res?: ethers.providers.TransactionResponse;
  req: Promise<ethers.providers.TransactionResponse>;
}
