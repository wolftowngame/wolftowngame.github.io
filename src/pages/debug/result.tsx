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
const Wolf = new Contract('0xE686133662190070c4A4Bea477fCF48dF35F5b2c', require('src/abi/Wolf.json'), StaticWeb3Read);
const CacheTx: Record<string, boolean> = {};
export const PageDebugResult = () => {
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
