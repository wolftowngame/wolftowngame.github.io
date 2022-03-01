import axios, { Axios } from 'axios';
import { BigNumber } from 'ethers';
import { Config } from 'src/Config';
import { Wolf } from 'src/types/wolf';
import { getContractHandler } from './ethereum';
const ERC20API = getContractHandler('ERC20API', false);

export const loadWalletAnimalList = async (address: string, from = 0, end = 50, list: any[] = []): Promise<Wolf[]> => {
  try {
    const tks: { ids: BigNumber[]; balance: BigNumber } = await ERC20API.ERC721TokenIds(address, Config.Contract.Wolf, from, end);
    const res = await ERC20API.ERC721TokenURIs(tks.ids, Config.Contract.Wolf);
    const List = await Promise.all(res.map(getAniJSON));
    List.unshift(...list);
    const Balance = tks.balance.toNumber();
    if (Balance > end) return loadWalletAnimalList(address, end, end + 50, List);
    return List;
  } catch (e) {
    return list;
  }
};

export const stakedWolves = async (address: string): Promise<Wolf[]> => {
  const Barn = getContractHandler('Barn', false);
  const ids = await Barn.stakedWolves(address);
  return ERC20API.ERC721TokenURIs(ids, Config.Contract.Wolf).then((res: any) => Promise.all(res.map(getAniJSON)));
};
export const stakedSheepsForWTWool = async (address: string): Promise<Wolf[]> => {
  const Barn = getContractHandler('Barn', false);
  const ids = await Barn.stakedSheepsForWTWool(address);
  return ERC20API.ERC721TokenURIs(ids, Config.Contract.Wolf).then((res: any) => Promise.all(res.map(getAniJSON)));
};
export const stakedSheepsForWTMilk = async (address: string): Promise<Wolf[]> => {
  const Barn = getContractHandler('Barn', false);
  const ids = await Barn.stakedSheepsForWTMilk(address);
  return ERC20API.ERC721TokenURIs(ids, Config.Contract.Wolf).then((res: any) => Promise.all(res.map(getAniJSON)));
};

export const stakedWolves2 = async (address: string): Promise<Wolf[]> => {
  const Barn = getContractHandler('BarnBUG', false);
  const ids = await Barn.stakedWolves(address);
  return ERC20API.ERC721TokenURIs(ids, Config.Contract.Wolf).then((res: any) => Promise.all(res.map(getAniJSON)));
};
export const stakedSheepsForWTWool2 = async (address: string): Promise<Wolf[]> => {
  const Barn = getContractHandler('BarnBUG', false);
  const ids = await Barn.stakedSheepsForWTWool(address);
  return ERC20API.ERC721TokenURIs(ids, Config.Contract.Wolf).then((res: any) => Promise.all(res.map(getAniJSON)));
};
export const stakedSheepsForWTMilk2 = async (address: string): Promise<Wolf[]> => {
  const Barn = getContractHandler('BarnBUG', false);
  const ids = await Barn.stakedSheepsForWTMilk(address);
  return ERC20API.ERC721TokenURIs(ids, Config.Contract.Wolf).then((res: any) => Promise.all(res.map(getAniJSON)));
};

export const getAniJSON = async (uri: string): Promise<Wolf> => {
  const res = await axios.get(uri);
  return res.data;
};

export const downloadJSON = (content: string, name: string) => {
  var Link = document.createElement('a');
  Link.download = name + '.json';
  Link.style.display = 'none';
  // 字符内容转变成blob地址
  var blob = new Blob([content]);
  Link.href = URL.createObjectURL(blob);
  // 触发点击
  document.body.appendChild(Link);
  Link.click();
  // 然后移除
  document.body.removeChild(Link);
};
