import { Button, Card, Col, Collapse, Input, Layout, List, Row, Statistic, Tag, Timeline } from 'antd';
import { Content, Footer, Header } from 'antd/lib/layout/layout';
import axios from 'axios';
import { Contract, ethers, utils } from 'ethers';
import { useCallback, useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { TokenIdOfURI } from 'src/lib/Animal';
import { downloadJSON, getAniJSON } from 'src/lib/getList';
import { MyURICache } from 'src/lib/LocalDB';
import { ErrTxDto, MyErrTxDB } from 'src/lib/ErrTxDB';
import { sleep } from 'src/Config';
import { StaticWeb3Read } from 'src/lib/ethereum';

const Wolf = new Contract('0xE686133662190070c4A4Bea477fCF48dF35F5b2c', require('src/abi/Wolf.json'), StaticWeb3Read);
const ids = new Array(6000).fill('').map((i, v) => v + '');
const CacheTx: Record<string, boolean> = {};
export const PageDebug = () => {
  const [last, setLast] = useState(0);
  const [ErrTx, setErrTx] = useState<ErrTxDto[]>([]);
  const queryAllWolf = async (id: string) => {
    const key = id;
    const uri = await getAniJSON(`https://app.wolftown.world/animals/${id.toString()}`);
    MyURICache.setItem(uri);
    TokenIdOfURI[key] = uri;
  };
  const query = async () => {
    const LocalKeys = MyURICache.keys();
    const dbKeys = (await LocalKeys).map((i) => i.replace(/(.*)\#/, ''));
    console.log(dbKeys);
    for (const key of ids) {
      if (dbKeys.includes(key)) continue;
      await queryAllWolf(key);
    }
  };

  const getLog = async (fromBlock: number, toBlock: number) => {
    let address = Wolf.address; // Wolf
    let topic0 = '0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef'; // Transfer
    const res = await axios.get(
      `https://api.bscscan.com/api?module=logs&action=getLogs&fromBlock=${fromBlock}&toBlock=${toBlock}&address=${address}&topic0=${topic0}&topic0_1_opr=and&topic1=0x0000000000000000000000000000000000000000000000000000000000000000&apikey=YourApiKeyToken`
    );
    console.log(res.data);
    if (res.data.status !== '1') {
      return fromBlock;
    }
    for (const evt of res.data.result) {
      const tx = evt.transactionHash;
      if (CacheTx[tx]) continue;
      CacheTx[tx] = true;
      fromBlock = parseInt(evt.blockNumber);
      setLast(fromBlock);
      const txs = await Promise.all([StaticWeb3Read.getTransaction(tx), StaticWeb3Read.getTransactionReceipt(tx)]);
      const tokenIds: string[] = [];
      txs[1].logs.forEach((it) => {
        if (it.address !== Wolf.address) return; // Other
        const log = Wolf.interface.parseLog(it);
        if (log.args.tokenId) {
          const id = log.args.tokenId.toString();
          if (!tokenIds.includes(id)) tokenIds.push(id);
        }
        if (log.args._tokenId) {
          const id = log.args._tokenId.toString();
          if (!tokenIds.includes(id)) tokenIds.push(id);
        }
      });
      const errtx = {
        from: txs[0].from,
        to: txs[0].to!,
        tokenIds,
        tx,
        blockNumber: txs[0].blockNumber!,
      };
      MyErrTxDB.setItem(errtx);
      setErrTx((v) => [...v, errtx]);
    }
    return fromBlock;
  };
  const queryLog = async () => {
    const LocalKeys = MyErrTxDB.keys();
    const dbKeys = await LocalKeys;
    const lastBlockNum = 15360283 - 1; // 15680503;
    let fromBlock = 15167768;
    const txs = await Promise.all(dbKeys.map(async (tx) => (await MyErrTxDB.getItem(tx))!));
    setErrTx((v) => {
      return txs;
    });
    txs.forEach((v) => {
      fromBlock = Math.max(fromBlock, v.blockNumber);
    });
    while (fromBlock < lastBlockNum) {
      fromBlock = await getLog(fromBlock, lastBlockNum);
      await sleep(6000);
    }
  };
  useEffect(() => {
    // query();
    queryLog();
  }, []);
  const list = [Wolf.address, '0xA40e34F4b933D33874Db73c427CdE0Eb53fe28eF'];
  const errtx = ErrTx.filter((tx) => !list.includes(tx.to)).sort((a, b) => a.blockNumber - b.blockNumber);
  return (
    <Layout>
      <Header style={{ color: '#fff' }}>{last}</Header>
      <Content style={{ backgroundColor: '#fff', paddingTop: '20px' }}>
        <Row>
          <Col onClick={() => downloadJSON(JSON.stringify(errtx), 'wolf')}>Download</Col>
        </Row>
        <Row>
          <Col span={24}>
            {errtx.map((err) => {
              return (
                <div key={err.tx}>
                  from: {err.from}, to: {err.to}, 【#{err.tokenIds.join(' #')}】
                  <a href={`https://bscscan.com/tx/${err.tx}`} target="_blank">
                    tx
                  </a>
                </div>
              );
            })}
          </Col>
        </Row>
      </Content>
      <Footer></Footer>
    </Layout>
  );
};
