import { Button, Card, Col, Collapse, Input, Layout, List, Row, Statistic, Tag, Timeline } from 'antd';
import { Content, Footer, Header } from 'antd/lib/layout/layout';
import { ethers, utils } from 'ethers';
import { useCallback, useEffect, useRef, useState } from 'react';
import { WolfItem } from 'src/components/Wolftem';
import { Config, sleep } from 'src/Config';
import { updateNFTs, useERC20Balances } from 'src/lib/Animal';
import { connectMetamask, CurrentWalletEnv, getContractHandler, _getAddress } from 'src/lib/ethereum';
import { loadWalletAnimalList, stakedSheepsForWTMilk, stakedSheepsForWTWool, stakedWolves } from 'src/lib/getList';
import { Wolf, TokenStolenEvent, TransferEvent } from 'src/types/wolf';

const txCache: Record<string, boolean> = {};

const OldMint = '0xA40e34F4b933D33874Db73c427CdE0Eb53fe28eF';

export const PageInfo = () => {
  const [user, setUser] = useState('0x10febDB47De894026b91D639049E482f7E8C7e2e');
  const userInput = useRef(user);
  const [milk, wool] = useERC20Balances(user, [Config.Contract.Milk, Config.Contract.Wool]);

  const [nftList, set_nftList] = useState<Awaited<ReturnType<typeof loadWalletAnimalList>>>([]);
  const [stakedForMilk, set_stakedForMilk] = useState<Awaited<ReturnType<typeof stakedSheepsForWTMilk>>>([]);
  const [stakedForWool, set_stakedForWool] = useState<Awaited<ReturnType<typeof stakedSheepsForWTWool>>>([]);
  const [stakedWolve, set_stakedWolve] = useState<Awaited<ReturnType<typeof stakedWolves>>>([]);

  const [lastEvts, set_lastEvts] = useState<{ lastBlock: number; data: Array<TransferEvent | TokenStolenEvent> }>({
    data: [],
    lastBlock: 0,
  });

  // totalStakesOf

  useEffect(() => {
    loadWalletAnimalList(user).then(set_nftList);
    stakedSheepsForWTMilk(user).then(set_stakedForMilk);
    stakedSheepsForWTWool(user).then(set_stakedForWool);
    stakedWolves(user).then(set_stakedWolve);
  }, [user]);

  useEffect(() => {
    const Wolf = getContractHandler('Wolf', false);
    const query = async () => {
      const res = await Wolf.queryFilter({}, (-60 * 60) / 3, 'latest').catch((e) => {
        console.error('事件获取异常', e);
        return Promise.resolve([] as ethers.Event[]);
      });
      console.log(res);
      set_lastEvts((v) => {
        const adds: typeof v.data = [];
        let lastBlock = v.lastBlock;
        res.forEach((item) => {
          if (item.blockNumber > lastBlock) lastBlock = item.blockNumber;
          const key = item.transactionHash + item.logIndex;
          if (txCache[key]) return;
          txCache[key] = true;
          if (item.event === 'Transfer') {
            // 折扣mint的中转，忽略
            if (item.args?.from === OldMint) return;
            let to = item.args?.to;
            adds.push({
              tx: item.transactionHash,
              key,
              event: 'Transfer',
              blockNumber: item.blockNumber,
              tokenId: item.args?.tokenId,
              from: item.args?.from,
              to,
              emiter: item.address,
            });
          } else if (item.event === 'TokenStolen') {
            adds.push({
              tx: item.transactionHash,
              key,
              event: 'TokenStolen',
              blockNumber: item.blockNumber,
              tokenId: item.args?._tokenId,
              address: item.args?._address,
              timestamp: item.args?._timestamp,
            });
          }
        });
        if (adds.length > 0) {
          v.data.push(...adds);
          updateNFTs(adds.map((it) => it.tokenId.toString()));
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

  const onUserChange = useCallback((e) => {
    userInput.current = e.target.value;
    if (userInput.current.length !== ethers.constants.AddressZero.length) return;
    setUser(userInput.current);
  }, []);

  const onClickMetaMask = useCallback(async () => {
    await connectMetamask();
    await _getAddress();
    if (CurrentWalletEnv.wallet) {
      userInput.current = CurrentWalletEnv.wallet;
      setUser(CurrentWalletEnv.wallet);
    }
    console.log(CurrentWalletEnv.wallet);
  }, []);

  const renderEvent = (evt: typeof lastEvts.data[0]) => {
    if (evt.event === 'TokenStolen') return renderEventTokenStolen(evt);
    if (evt.event === 'Transfer') return renderEventTransfer(evt);
    return null;
  };
  const renderEventTransfer = (evt: TransferEvent) => {
    let color = 'default';
    let event: string = evt.event;
    let to = evt.to;
    if (evt.from === ethers.constants.AddressZero) {
      color = 'cyan';
      event = 'Mint';
      if (evt.emiter !== evt.to) {
        event = 'Lose';
        color = 'error';
      }
    }
    if (evt.from === Config.Contract.Barn) {
      event = 'Leave Barn';
      color = 'pink';
      to = evt.emiter;
    } else if (evt.to === Config.Contract.Barn) {
      event = 'Staked Barn';
      color = 'lime';
      to = evt.from;
    } else if (evt.to === OldMint) {
      event = 'Discount Mint';
      color = 'green';
      to = evt.emiter;
    }
    return (
      <div>
        {evt.blockNumber}
        <Tag color={color}>
          <a href={`${Config.ChainTX}${evt.tx}`} target="_blank">
            {event}
          </a>
        </Tag>
        {event === evt.event && <Tag color={color}>{evt.from}</Tag>}
        <Tag color={color}>{to}</Tag>
        <WolfItem id={evt.tokenId.toString()}></WolfItem>
      </div>
    );
  };
  const renderEventTokenStolen = (evt: TokenStolenEvent) => {
    return (
      <div>
        {evt.blockNumber}
        <Tag color="lime">
          <a href={`${Config.ChainTX}${evt.tx}`} target="_blank">
            {evt.event}
          </a>
        </Tag>
        <Tag color="geekblue">{evt.address}</Tag>
        <WolfItem id={evt.tokenId.toString()}></WolfItem>
      </div>
    );
  };

  const RenderList = (data: Wolf[], title: string) => {
    console.log(data);
    return (
      <Collapse.Panel header={`${title} (${data.length})`} key={title}>
        <List
          grid={{ gutter: 16, xs: 1, sm: 2, md: 4, lg: 4, xl: 6, xxl: 3 }}
          dataSource={data}
          renderItem={(item) => (
            <List.Item>
              <Card title={item.name}>
                <img src={item.imageSmall} />
                {/* {item.attributes.map((a) => (
                  <Tag key={a.trait_type}>
                    {a.trait_type}:{a.value}
                  </Tag>
                ))} */}
              </Card>
            </List.Item>
          )}
        />
      </Collapse.Panel>
    );
  };
  return (
    <Layout>
      <Header></Header>
      <Content style={{ backgroundColor: '#fff', paddingTop: '20px' }}>
        <Row>
          <Col span={2}></Col>
          <Col span={20}>
            <Input
              value={userInput.current}
              onChange={onUserChange}
              addonAfter={
                <Button type="primary" ghost onClick={onClickMetaMask}>
                  Connect MetaMask
                </Button>
              }
              addonBefore="address"
            />
          </Col>
          <Col span={2}></Col>
        </Row>
        <Row>
          <Col span={2}></Col>
          <Col span={10}>
            <Statistic title="Wool" loading={!wool} value={wool ? utils.formatEther(wool) : '...'} />
          </Col>
          <Col span={10}>
            <Statistic title="Milk" loading={!milk} value={milk ? utils.formatEther(milk) : '...'} />
          </Col>
          <Col span={2}></Col>
        </Row>
        <Row>
          <Col span={2}></Col>
          <Col span={20}>
            <Collapse defaultActiveKey={['1', '2', '3', '4']}>
              {RenderList(nftList, 'unstaked')}
              {RenderList(stakedForMilk, 'stakedForMilk')}
              {RenderList(stakedForWool, 'stakedForWool')}
              {RenderList(stakedWolve, 'stakedWolves')}
            </Collapse>
          </Col>
          <Col span={2}></Col>
        </Row>
        <Row>
          <Col span={2}></Col>
          <Col span={20}>
            <Timeline pending={`Loading...`} reverse={true}>
              {lastEvts.data.map((evt) => (
                <Timeline.Item key={evt.key}>{renderEvent(evt)}</Timeline.Item>
              ))}
            </Timeline>
          </Col>
          <Col span={2}></Col>
        </Row>
      </Content>
      <Footer></Footer>
    </Layout>
  );
};
