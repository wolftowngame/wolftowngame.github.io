import { Button, Card, Col, Collapse, Input, Layout, List, Row, Statistic, Tag, Timeline } from 'antd';
import { Content, Footer, Header } from 'antd/lib/layout/layout';
import { ethers, utils } from 'ethers';
import { useCallback, useEffect, useRef, useState } from 'react';
import { WolfItem } from 'src/components/Wolftem';
import { Config, sleep } from 'src/Config';
import { updateNFTs, useERC20Balances } from 'src/lib/Animal';
import { connectMetamask, CurrentWalletEnv, getContractHandler, StaticWeb3Read, _getAddress } from 'src/lib/ethereum';
import { loadWalletAnimalList, stakedSheepsForWTMilk, stakedSheepsForWTWool, stakedWolves } from 'src/lib/getList';
import { Wolf, TransferEventBuilding } from 'src/types/wolf';
import { DownOutlined, LoadingOutlined, RightOutlined } from '@ant-design/icons';
import { MyTimelineItem } from 'src/components/MyTimelineItem';
import { useLocation, useNavigate } from 'react-router-dom';
import { Queue } from 'src/lib/useQueue';

const txCache: Record<string, boolean> = {};

export const PageInfoBuilding = () => {
  const [num, setNum] = useState({ current: 0 });
  const [lastEvts, set_lastEvts] = useState<{ lastBlock: number; data: Array<TransferEventBuilding> }>({
    data: [],
    lastBlock: 0,
  });

  useEffect(() => {
    const Wolf = getContractHandler('Wolf', false);
    const BuildingGameManager = getContractHandler('BuildingGameManager', false);
    const query = async () => {
      const res = await BuildingGameManager.queryFilter({}, (-30 * 60) / 3, 'latest').catch((e) => {
        console.error('事件获取异常', e);
        return Promise.resolve([] as ethers.Event[]);
      });
      console.log(res);
      set_lastEvts((v) => {
        const adds: typeof v.data = [];
        let lastBlock = v.lastBlock;
        const txCacheMap: Record<string, TransferEventBuilding> = {};
        res.forEach((item) => {
          if (item.blockNumber > lastBlock) lastBlock = item.blockNumber;
          const key = item.transactionHash + item.logIndex;
          if (txCache[key]) return;
          txCache[key] = true;
          if (!['Participate', 'MatchResult'].includes(item.event!)) return;
          if (!txCacheMap[item.transactionHash]) {
            txCacheMap[item.transactionHash] = {
              tx: item.transactionHash,
              key,
              data: [],
              blockNumber: item.blockNumber,
              req: item.getTransaction(),
            };
            txCacheMap[item.transactionHash].req.then((res) => {
              txCacheMap[item.transactionHash].res = res;
            });
            // Participate(gameId, participant, uint256[] tokenIds, uint256 timestamp);
            // MatchResult(gameId, participant, tokenId, PlayingAction action, PlayingResult result, uint256 earnedPoints, uint256 timestamp);
            txCacheMap[item.transactionHash].data.push({
              event: item.event!,
              participant: item.args!.participant,
              gameId: item.args!.gameId.toString(),
              tokenIds: item.event === 'Participate' ? item.args!.tokenIds.map((it: any) => it.toString()) : [item.args!.tokenId.toString()],
              action: item.event === 'Participate' ? '' : item.args!.action.toString(),
              result: item.event === 'Participate' ? '' : item.args!.result.toString(),
              earnedPoints: item.event === 'Participate' ? '' : item.args!.earnedPoints.toString(),
            });
            adds.push(txCacheMap[item.transactionHash]);
          }
        });
        if (adds.length > 0) {
          v.data.push(...adds);
        }
        return { lastBlock, data: [...v.data] };
      });
    };
    let idx = 1;
    (async () => {
      while (idx > 0) {
        await query();
        await sleep(3000);
      }
    })();
    return () => {
      idx = 0;
    };
  }, []);

  return (
    <Layout>
      <Header style={{ color: '#fff' }}>Barn Animal: {num.current}</Header>
      <Content style={{ backgroundColor: '#fff', paddingTop: '20px' }}>
        <Row>
          <Col span={2}></Col>
          <Col span={20}>
            <Timeline pending={`Loading...`} reverse={true}>
              {lastEvts.data.map((evt) => {
                return (
                  <div key={evt.tx}>
                    blockNumber: {evt.blockNumber}
                    {JSON.stringify(evt.data)}
                  </div>
                );
              })}
            </Timeline>
          </Col>
          <Col span={2}></Col>
        </Row>
      </Content>
      <Footer></Footer>
    </Layout>
  );
};
