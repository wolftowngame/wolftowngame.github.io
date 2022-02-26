import { BigNumber, Contract, providers, utils } from 'ethers';
import { useEffect, useState } from 'react';
import { AbiConf, Config } from 'src/Config';
import { AppEvent } from './useAppData';

let first = true;
export const _isMetaMaskInstalled = () => {
  if (typeof window === 'undefined') return;
  const { ethereum } = window;
  const res = Boolean(ethereum && ethereum.isMetaMask);
  if (res && first) {
    first = false;
    window.ethereum.on('accountsChanged', (address: string[]) => {
      CurrentWalletEnv.wallet = address[0] || '';
      AppEvent.emit('accountsChanged', address);
    });
    window.ethereum.on('chainChanged', (_chain: string) => {
      CurrentWalletEnv.chain = parseInt(_chain);
      AppEvent.emit('chainChanged', _chain);
    });
  }
  return res;
};

export const StaticWeb3Read = new providers.JsonRpcProvider(Config.ChainLink);

export const _getProvider = () => {
  if (!_isMetaMaskInstalled()) return StaticWeb3Read;
  return window.ethereum ? new providers.Web3Provider(window.ethereum) : StaticWeb3Read;
};

export const _getChain = async () => {
  const provider = _getProvider();
  if (!provider) {
    CurrentWalletEnv.chain = -1;
    return;
  }
  CurrentWalletEnv.chain = (await provider.getNetwork()).chainId;
};

export const _getAddress = async () => {
  const provider = _getProvider();
  if (!provider) {
    CurrentWalletEnv.wallet = ``;
    return;
  }
  try {
    const accounts = await provider.listAccounts();
    CurrentWalletEnv.wallet = accounts.length > 0 ? accounts[0] : '';
  } catch (e) {
    CurrentWalletEnv.wallet = '';
  }
};

export const CurrentWalletEnv = {
  wallet: '',
  chain: -1,
};
export const useWallet = () => {
  const [env, setState] = useState(CurrentWalletEnv);

  useEffect(() => {
    AppEvent.on('accountsChanged', accChange);
    AppEvent.on('chainChanged', _onChainChanged);
    load();
    return () => {
      AppEvent.off('accountsChanged', accChange);
      AppEvent.off('chainChanged', _onChainChanged);
    };
    function _onChainChanged(_chain: any) {
      if (!_chain) return;
      setState((v) => ({ ...CurrentWalletEnv }));
    }
    async function load() {
      try {
        await Promise.all([_getAddress(), _getChain()]);
        setState((v) => ({ ...CurrentWalletEnv }));
      } catch (error) {
        return error;
      }
    }
    function accChange() {
      setState((v) => ({ ...CurrentWalletEnv }));
    }
  }, []);

  return env;
};

export const connectMetamask = async () => {
  if (!_isMetaMaskInstalled()) return false;
  try {
    await window.ethereum.request({ method: 'eth_requestAccounts' });
    return true;
  } catch (e) {
    return false;
  }
};

export const switchToMainnet = async () => {
  if (!_isMetaMaskInstalled()) return false;
  try {
    await window.ethereum.request({
      method: 'wallet_switchEthereumChain',
      params: [{ chainId: `0x${Config.ChainId.toString(16)}` }],
    });
    return true;
  } catch (e) {
    return false;
  }
};

/**
 * 等待tx结算
 */
export const watchTransaction = (req: any) => {
  const provider = _getProvider();
  if (!provider) return;
  return new Promise<any>((resolve) => provider.once(req.hash, resolve));
};

export async function postChainAction(con: Contract, name: string, args: any[], end: any, gasrec = true) {
  if (!CurrentWalletEnv.wallet || !CurrentWalletEnv.chain) {
    await connectMetamask();
    return alert(`env error`);
  }
  if (CurrentWalletEnv.chain !== Config.ChainId) {
    const res = confirm(`ChainId error, switch first!`);
    if (res) switchToMainnet();
    return;
  }

  try {
    const postEnd = { gasPrice: Config.gasPrice, ...end };
    if (gasrec) {
      const gasEstimate = await con.estimateGas[name](...args, end);
      postEnd.gasLimit = gasEstimate.mul(BigNumber.from(12)).div(BigNumber.from(10));
    }
    return con[name](...args, { gasPrice: Config.gasPrice, ...end });
  } catch (e) {
    const msg = ContractActionError(e);
    if (msg) alert(msg);
  }
}

export const getContractHandler = (type: keyof typeof Config.Contract, signerd: boolean = true, address = '') => {
  if (!address) address = Config.Contract[type];
  if (signerd !== true) {
    return new Contract(address, AbiConf[type], StaticWeb3Read);
  }
  const provider = _getProvider();
  if (!provider) throw new Error('Unable to connect to wallet');
  if (provider === StaticWeb3Read) throw new Error('Unable to connect to wallet post');
  const signer = provider.getSigner();
  return new Contract(address, AbiConf[type], signer);
};

export const ContractActionError = (e: any) => {
  if (!e) return '';
  if (typeof e === 'string') return e;
  if (typeof e !== 'object') return String(e);
  if (e.code === 4001) return ''; // 用户拒绝
  let message = e.message || '';
  if (e.data && typeof e.data === 'object') {
    if (e.data.message) message = message + ' : ' + e.data.message;
  }
  return message;
};
