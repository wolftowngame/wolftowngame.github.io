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
import { WolfItem } from 'src/components/Wolftem';

const lastBlockNum = 15680503;
// const Wolf = new Contract('0xE686133662190070c4A4Bea477fCF48dF35F5b2c', require('src/abi/Wolf.json'), StaticWeb3Read);
// const V1AnimalTransfer = new Contract('0xCe487D0Ab195D28FE18D5279B042498f84eb051F', require('src/abi/V1AnimalTransfer.json'), StaticWeb3Read);

// const target = '576';
// const query = async () => {
//   let startblock = 0;
//   let offset = 10000;
//   let page = 1;
//   const res = await axios.get(
//     `https://api.bscscan.com/api?module=account&action=txlist&address=${V1AnimalTransfer.address}&startblock=${startblock}&endblock=99999999&page=${page}&offset=${offset}&sort=asc&apikey=YourApiKeyToken`
//   );
//   console.log(res.data);
//   if (res.data.status !== '1') {
//     return;
//   }
//   res.data.result.forEach(async (log: any) => {
//     const res = await StaticWeb3Read.getTransaction(log.hash);
//     const trans = V1AnimalTransfer.interface.parseTransaction({ data: res.data });
//     trans.args._tokenIds.forEach((it: any) => {
//       console.log(it);
//       if (it.toString() === target) {
//         console.log(trans, log);
//         debugger;
//       }
//     });
//   });
// };
// query();

const CacheTx: Record<string, boolean> = {};
export const PageDebugTransfer = () => {
  const [last, setLast] = useState(lastBlockNum);
  const [ErrTx, setErrTx] = useState<ErrTxDto[]>(() => {
    return require('src/abi/Illegal-wolf-tx.json');
  });

  // const list = [Wolf.address, '0xA40e34F4b933D33874Db73c427CdE0Eb53fe28eF'];
  // const errtx = ErrTx.filter((tx) => !list.includes(tx.to)).sort((a, b) => a.blockNumber - b.blockNumber);
  return (
    <Layout>
      <Header style={{ color: '#fff' }}>
        {last} {last >= lastBlockNum ? 'end' : ''}
      </Header>
      <Content style={{ backgroundColor: '#fff', paddingTop: '20px' }}>
        <Row>
          <Col onClick={() => downloadJSON(JSON.stringify(ErrTx), 'wolf')}>Download</Col>
        </Row>
        <Row>
          <Col span={24}>
            {ErrTx.map((err) => {
              return (
                <div key={err.tx}>
                  from: {err.from}, to: {err.to},{' '}
                  {/* {err.tokenIds.map((id) => (
                    <WolfItem key={id} id={id}></WolfItem>
                  ))} */}
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
