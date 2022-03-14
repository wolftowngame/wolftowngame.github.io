import { Button, Card, Col, Collapse, Input, Layout, List, Row, Statistic, Tag, Timeline } from 'antd';
import { Content, Footer, Header } from 'antd/lib/layout/layout';
import axios from 'axios';
import { Contract, ethers, utils } from 'ethers';
import { useCallback, useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { TokenIdOfURI } from 'src/lib/Animal';
import { downloadJSON, getAniJSON } from 'src/lib/getList';
import { MyURICache } from 'src/lib/LocalDB';
import { Config, sleep } from 'src/Config';
import { getContractHandler, StaticWeb3Read } from 'src/lib/ethereum';
import { AddressWolfDto, MyAddressWolfDB } from 'src/lib/addressWolf';
import { addressTokenIdDto, MyaddressTokenIdDB } from 'src/lib/addressTokenId';
import { WolfItem } from 'src/components/Wolftem';

const Wolf = new Contract(Config.Contract.Wolf, require('src/abi/Wolf.json'), StaticWeb3Read);
const CacheTx: Record<string, boolean> = {};
const fullAddress: AddressWolfDto[] = [];
const fullTokens: addressTokenIdDto[] = [];

export const Evt0312 = () => {
  /**
   * 合约暂停 区块高度
   * https://bscscan.com/tx/0x3bf4c49bdb36e1b9bb20d5c2dce858ed9e31d880d33e0eef2570a3fd5acbee68
   */
  const [lastBlockNum, set_lastBlockNum] = useState(15993493);
  const [last, setLast] = useState(() => parseInt(localStorage.getItem('lastBlockSync') || '0'));
  const [addresses, setAddresses] = useState<AddressWolfDto[]>([]);
  const [tokens, setTokens] = useState<addressTokenIdDto[]>([]);

  const getLog = async (fromBlock: number, toBlock: number) => {
    const address = Wolf.address; // Wolf
    const topic0 = '0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef'; // Transfer
    const res = await axios.get(
      `https://api.bscscan.com/api?module=logs&action=getLogs&fromBlock=${fromBlock}&toBlock=${toBlock}&address=${address}&topic0=${topic0}&topic0_1_opr=and&topic1=0x0000000000000000000000000000000000000000000000000000000000000000&apikey=YourApiKeyToken`
    );
    console.log(res.data);
    if (res.data.status !== '1') {
      return fromBlock;
    }
    // ended
    if (res.data.result.length < 100) fromBlock = toBlock;
    for (const evt of res.data.result) {
      const tx = evt.transactionHash;
      if (CacheTx[tx]) continue;
      CacheTx[tx] = true;
      const txs = await Promise.all([StaticWeb3Read.getTransaction(tx), StaticWeb3Read.getTransactionReceipt(tx)]);
      if (txs[0].to !== Wolf.address) {
        fromBlock = Math.max(parseInt(evt.blockNumber), fromBlock);
        localStorage.setItem('lastBlockSync', fromBlock.toString());
        setLast(fromBlock);
        continue; // old transfer
      }

      let user = fullAddress.find((ad) => ad.from === txs[0].from)!;
      if (!user) {
        user = { from: txs[0].from, tokenIds: [], wolf: 0, sheep: 0 };
      }
      txs[1].logs.forEach((it) => {
        if (it.address !== Wolf.address) return; // Other
        const log = Wolf.interface.parseLog(it);
        if (log.args.tokenId) {
          const id = log.args.tokenId.toString();
          if (!fullTokens.find((token) => token.tokenId === id)) {
            const tokenData = { tokenId: id, tx, from: txs[0].from, type: 'Unknow' as 'Unknow' };
            fullTokens.push(tokenData);
            user.tokenIds.push(id);
            MyAddressWolfDB.setItem(user);
            MyaddressTokenIdDB.setItem(tokenData);
          }
        }
        // if (log.args._tokenId) {
        //   const id = log.args._tokenId.toString();
        //   if (!tokenIds.includes(id)) tokenIds.push(id);
        // }
      });
      fromBlock = Math.max(parseInt(evt.blockNumber), fromBlock);
      localStorage.setItem('lastBlockSync', fromBlock.toString());
      setLast(fromBlock);
    }
    return fromBlock;
  };
  const queryLog = async () => {
    // 获取已经缓存的地址列表
    const adds = await MyAddressWolfDB.keys();
    const items = await Promise.all(adds.map((key) => MyAddressWolfDB.getItem(key)));
    fullAddress.push(...items);
    setAddresses([...fullAddress]);

    // 获取已经缓存的动物ID
    const tks = await MyaddressTokenIdDB.keys();
    const tksItems = await Promise.all(tks.map((key) => MyaddressTokenIdDB.getItem(key)));
    fullTokens.push(...tksItems);
    setTokens([...fullTokens]);

    let fromBlock = last;
    while (fromBlock < lastBlockNum) {
      fromBlock = await getLog(fromBlock, lastBlockNum);
      await sleep(6000);
    }

    // 批量获取动物属性
    const tksList: Array<typeof fullTokens> = [];
    const tempTokenList = fullTokens.filter((it) => it.type === 'Unknow');
    while (tempTokenList.length > 0) {
      tksList.push(tempTokenList.splice(0, 200));
    }
    const ERC20API = getContractHandler('ERC20API', false);
    for (let i = 0; i < tksList.length; i++) {
      const list = await ERC20API.WTAnimalURIs(
        tksList[i].map((d) => d.tokenId),
        Wolf.address
      );
      tksList[i].forEach((item, idx) => {
        item.type = list[idx].isSheep ? 'Sheep' : 'Wolf';
        MyaddressTokenIdDB.setItem(item);
      });
      setTokens([...fullTokens]);
    }

    fullAddress.forEach((user) => {
      user.sheep = user.tokenIds.filter((it) => {
        const ani = fullTokens.find((to) => to.tokenId === it)!;
        return ani.type === 'Sheep';
      }).length;
      user.wolf = user.tokenIds.filter((it) => {
        const ani = fullTokens.find((to) => to.tokenId === it)!;
        return ani.type === 'Wolf';
      }).length;
    });
    setAddresses([...fullAddress]);
  };
  useEffect(() => {
    // query();
    queryLog();
  }, []);

  const showList = fullAddress
    .map((user) => {
      const unready = !!user.tokenIds.find((it) => {
        const ani = fullTokens.find((to) => to.tokenId === it)!;
        return !ani || ani.type === 'Unknow';
      });
      const weight = parseFloat(((user.wolf / user.tokenIds.length) * 100).toFixed(0));
      let str = `(${user.wolf}/${user.tokenIds.length} = ${weight}%)`;
      if (unready) str = '';
      return { ...user, weight, str };
    })
    .sort((a, b) => b.weight - a.weight);
  return (
    <Layout>
      <Header style={{ color: '#fff' }}>
        {last} {last >= lastBlockNum ? 'end' : ''}
      </Header>
      <Content style={{ backgroundColor: '#fff', paddingTop: '20px' }}>
        <Row>
          <Col onClick={() => downloadJSON(JSON.stringify(showList), 'addresses')}>Download addresses</Col>
          <Col span={4}></Col>
          <Col onClick={() => downloadJSON(JSON.stringify(tokens), 'tokens')}>Download tokens</Col>
        </Row>
        <Row>
          <Col span={24}>
            <Collapse>
              {showList.map((user) => (
                <Collapse.Panel header={`${user.from}${user.str}`} key={user.from}>
                  {user.tokenIds.map((id) => {
                    return <WolfItem key={id} id={id}></WolfItem>;
                  })}
                </Collapse.Panel>
              ))}
            </Collapse>
          </Col>
        </Row>
      </Content>
      <Footer></Footer>
    </Layout>
  );
};
