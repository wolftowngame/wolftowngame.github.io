import { BigNumber, Contract } from 'ethers';
import { useEffect, useState } from 'react';
import { Wolf } from 'src/types/wolf';
import { getContractHandler } from './ethereum';
import { getAniJSON } from './getList';
import { MyURICache } from './LocalDB';
import { AppEvent } from './useAppData';

/**
 * cache all erc20/erc721 tokens balance
 */
const BalanceCache: Record<string, { value?: BigNumber; req?: Promise<any> }> = {};
const getERC20Balances = async (user: string, tokens: string[]): Promise<any> => {
  const reqTokens = tokens.filter((token, idx) => {
    const key = `ERC20Balance:${user}:${token}`;
    BalanceCache[key] = BalanceCache[key] || {};
    // 已经在请求过程
    // Already in the request process
    if (BalanceCache[key].req) return false;
    return true;
  });
  if (reqTokens.length !== tokens.length) return getERC20Balances(user, reqTokens);
  const contract = getContractHandler('ERC20API', false);
  const req = new Promise(async (resolve) => {
    const res: BigNumber[] = await contract.ERC20Balances(user, tokens);
    // update cache
    tokens.forEach((token, idx) => {
      const key = `ERC20Balance:${user}:${token}`;
      // Out of date
      if (req !== BalanceCache[key].req) return;
      BalanceCache[key].value = res[idx];
      delete BalanceCache[key].req;
      AppEvent.emit(key);
    });
    resolve(null);
  });
  tokens.forEach((token) => {
    const key = `ERC20Balance:${user}:${token}`;
    BalanceCache[key].req = req;
  });
  return req;
};

export const useERC20Balances = (user: string, tokens: string[]) => {
  console.log('useERC20Balances', user);
  const [balances, setBalances] = useState<(BigNumber | null)[]>(() => {
    return tokens.map((token) => {
      const key = `ERC20Balance:${user}:${token}`;
      BalanceCache[key] = BalanceCache[key] || {};
      return BalanceCache[key].value || null;
    });
  });
  useEffect(() => {
    setBalances(
      tokens.map((token) => {
        const key = `ERC20Balance:${user}:${token}`;
        BalanceCache[key] = BalanceCache[key] || {};
        return BalanceCache[key].value || null;
      })
    );
    console.log('useEffect', user);
    const updateBalance = () => {
      setBalances((v) => {
        return v.map((value, idx) => {
          const token = tokens[idx];
          const key = `ERC20Balance:${user}:${token}`;
          const newValue = BalanceCache[key].value || null;
          if (!newValue) return newValue; // null
          if (!value) return newValue;
          if (newValue.eq(value)) return value;
          return newValue;
        });
      });
    };
    tokens.forEach((token) => {
      const key = `ERC20Balance:${user}:${token}`;
      AppEvent.on(key, updateBalance);
    });
    getERC20Balances(user, tokens);
    return () => {
      console.log('end', user);
      tokens.forEach((token) => {
        const key = `ERC20Balance:${user}:${token}`;
        AppEvent.off(key, updateBalance);
      });
    };
  }, [user]);
  return balances;
};

const LocalKeys = MyURICache.keys();
export const TokenIdOfURI: Record<string, Wolf> = {};
export const updateNFTs = async (TokenIds: string[]) => {
  const dbKeys = await LocalKeys;
  console.log('updateNFTs', TokenIds, dbKeys);
  const query = TokenIds.filter((id) => {
    const key = `${id}`;
    // 优先使用本地缓存数据
    if (dbKeys.includes(id)) {
      MyURICache.getItem(id).then((res) => {
        if (!res) return;
        TokenIdOfURI[key] = res;
        AppEvent.emit(`URI:${key}`, TokenIdOfURI[key]);
      });
      return false;
    }
    return true;
  });
  if (query.length === 0) return [];
  while (query.length > 0) {
    await getData(query.splice(0, 50));
  }
  return TokenIds.map((id) => TokenIdOfURI[`${id}`]);
  async function getData(data: typeof query) {
    try {
      const list = await Promise.all(TokenIds.map((id) => getAniJSON(`https://app.wolftown.world/animals/${id.toString()}`)));
      console.log('list', list);
      data.forEach((it, i) => {
        const key = `${it}`;
        const uriData = list[i];
        if (uriData) MyURICache.setItem(uriData);
        TokenIdOfURI[key] = uriData;
        AppEvent.emit(`URI:${key}`, TokenIdOfURI[key]);
      });
    } catch (e) {
      console.error('e', e, data);
    }
  }
};

export const useWolfItem = (id: string) => {
  const [meta, setMeta] = useState(() => {
    return TokenIdOfURI[`${id}`] || null;
  });
  useEffect(() => {
    if (!id) return;
    const key = `${id}`;
    AppEvent.on(`URI:${key}`, metaUpdate);
    updateNFTs([id]);
    return () => {
      AppEvent.off(`URI:${key}`, metaUpdate);
    };
    function metaUpdate(data: Wolf) {
      setMeta({ ...data });
    }
  }, []);
  return meta;
};
