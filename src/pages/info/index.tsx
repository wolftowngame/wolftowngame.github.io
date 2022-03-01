import { Button, Card, Col, Collapse, Input, Layout, List, Row, Statistic, Tag, Timeline } from 'antd';
import { Content, Footer, Header } from 'antd/lib/layout/layout';
import { ethers, utils } from 'ethers';
import { useCallback, useEffect, useRef, useState } from 'react';
import { WolfItem } from 'src/components/Wolftem';
import { Config, sleep } from 'src/Config';
import { updateNFTs, useERC20Balances } from 'src/lib/Animal';
import { connectMetamask, CurrentWalletEnv, getContractHandler, StaticWeb3Read, _getAddress } from 'src/lib/ethereum';
import { loadWalletAnimalList, stakedSheepsForWTMilk, stakedSheepsForWTMilk2, stakedSheepsForWTWool, stakedSheepsForWTWool2, stakedWolves, stakedWolves2 } from 'src/lib/getList';
import { Wolf, TransferEvent } from 'src/types/wolf';
import { DownOutlined, LoadingOutlined, RightOutlined } from '@ant-design/icons';
import { MyTimelineItem } from 'src/components/MyTimelineItem';
import { useLocation, useNavigate } from 'react-router-dom';
import { Queue } from 'src/lib/useQueue';

const txCache: Record<string, boolean> = {};

export const PageInfo = () => {
  const navigate = useNavigate();
  const loc = useLocation();
  const urls = new URLSearchParams(loc.search);
  const user = urls.get('user') || '0x10febDB47De894026b91D639049E482f7E8C7e2e';

  const setUser = (u: string) => {
    urls.set('user', u);
    userInput.current = u;
    navigate({ search: urls.toString() }, { replace: true });
  };
  const queue = useRef(new Queue());

  const userInput = useRef(user);
  const [milk, wool, bnbWoolLp, bnbMilkLp] = useERC20Balances(user, [
    Config.Contract.Milk,
    Config.Contract.Wool,
    '0xe9C7bc98901d1B71d63902602Bff6E37dCdE79fC',
    '0xa0290C4c4e7AdE8a2e9BDF5daF859F98737D14ec',
  ]);

  const [num, setNum] = useState({ current: 0, old: 0 });

  const [nftList, set_nftList] = useState<Awaited<ReturnType<typeof loadWalletAnimalList>> | null>(null);
  const [stakedForMilk, set_stakedForMilk] = useState<Awaited<ReturnType<typeof stakedSheepsForWTMilk>> | null>(null);
  const [stakedForWool, set_stakedForWool] = useState<Awaited<ReturnType<typeof stakedSheepsForWTWool>> | null>(null);
  const [stakedWolve, set_stakedWolve] = useState<Awaited<ReturnType<typeof stakedWolves>> | null>(null);

  const [stakedForMilk2, set_stakedForMilk2] = useState<Awaited<ReturnType<typeof stakedSheepsForWTMilk>> | null>(null);
  const [stakedForWool2, set_stakedForWool2] = useState<Awaited<ReturnType<typeof stakedSheepsForWTWool>> | null>(null);
  const [stakedWolve2, set_stakedWolve2] = useState<Awaited<ReturnType<typeof stakedWolves>> | null>(null);

  const [lastEvts, set_lastEvts] = useState<{ lastBlock: number; data: Array<TransferEvent> }>({
    data: [],
    lastBlock: 0,
  });

  // totalStakesOf

  useEffect(() => {
    const q = queue.current.get();
    set_nftList(null);
    set_stakedForMilk(null);
    set_stakedForWool(null);
    set_stakedWolve(null);
    loadWalletAnimalList(user).then((r) => queue.current.is(q) && set_nftList(r));
    stakedSheepsForWTMilk(user).then((r) => queue.current.is(q) && set_stakedForMilk(r));
    stakedSheepsForWTWool(user).then((r) => queue.current.is(q) && set_stakedForWool(r));
    stakedWolves(user).then((r) => queue.current.is(q) && set_stakedWolve(r));

    stakedSheepsForWTMilk2(user).then((r) => queue.current.is(q) && set_stakedForMilk2(r));
    stakedSheepsForWTWool2(user).then((r) => queue.current.is(q) && set_stakedForWool2(r));
    stakedWolves2(user).then((r) => queue.current.is(q) && set_stakedWolve2(r));
  }, [user]);

  useEffect(() => {
    const Wolf = getContractHandler('Wolf', false);
    const Barn = getContractHandler('Barn', false);

    Promise.all([Wolf.balanceOf(Config.Contract.Barn), Wolf.balanceOf(Config.Contract.BarnBUG)]).then((res: any) => {
      setNum({
        current: res[0].toNumber(),
        old: res[1].toNumber(),
      });
    });
    const query = async () => {
      const res = await Wolf.queryFilter({}, (-60 * 60) / 3, 'latest').catch((e) => {
        console.error('事件获取异常', e);
        return Promise.resolve([] as ethers.Event[]);
      });
      console.log(res);
      set_lastEvts((v) => {
        const adds: typeof v.data = [];
        let lastBlock = v.lastBlock;
        const txCacheMap: Record<string, TransferEvent> = {};
        res.forEach((item) => {
          if (item.blockNumber > lastBlock) lastBlock = item.blockNumber;
          const key = item.transactionHash + item.logIndex;
          if (txCache[key]) return;
          txCache[key] = true;
          if (item.event === 'Transfer' || item.event === 'TokenStolen') {
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
              adds.push(txCacheMap[item.transactionHash]);
            }
            const transferData = txCacheMap[item.transactionHash];
            let to = item.args?.to;
            if (item.event === 'TokenStolen') {
              transferData.data.push({
                event: item.event,
                tokenId: item.args?._tokenId,
                from: item.args?._address,
                to: item.args?._address,
              });
            } else {
              transferData.data.push({
                event: item.event,
                tokenId: item.args?.tokenId,
                from: item.args?.from,
                to,
              });
            }
          }
        });
        if (adds.length > 0) {
          v.data.push(...adds);
          const tokenIdList: string[] = [];
          adds.forEach((it) => {
            it.data.forEach((sit) => {
              tokenIdList.push(sit.tokenId.toString());
            });
          });
          updateNFTs(tokenIdList);
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
      setUser(CurrentWalletEnv.wallet);
    }
    console.log(CurrentWalletEnv.wallet);
  }, []);

  const RenderList = (data: Wolf[] | null, title: string) => {
    console.log(data);
    const show = data || [];
    return (
      <Collapse.Panel className={`panel-id-${title}`} header={`${title} (${show.length})`} key={title}>
        <List
          grid={{ gutter: 16, xs: 1, sm: 2, md: 4, lg: 4, xl: 6, xxl: 3 }}
          dataSource={show}
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
      <Header style={{ color: '#fff' }}>
        Barn Animal: {num.current} ------- Barn(BUG) Animal: {num.old}
      </Header>
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
        {/* {bnbWoolLp && bnbMilkLp && (
          <Row>
            <Col span={2}></Col>
            <Col span={10}>
              <Statistic title="BNB-WOOL-LP" loading={!bnbWoolLp} value={bnbWoolLp ? utils.formatEther(bnbWoolLp) : '...'} />
            </Col>
            <Col span={10}>
              <Statistic title="BNB-MILK-LP" loading={!bnbMilkLp} value={bnbMilkLp ? utils.formatEther(bnbMilkLp) : '...'} />
            </Col>
            <Col span={2}></Col>
          </Row>
        )} */}
        <Row>
          <Col span={2}></Col>
          <Col span={20}>
            <Collapse
              defaultActiveKey={['1', '2', '3', '4']}
              expandIcon={(props) => {
                console.log(props.className);
                if (props.className === `panel-id-unstaked` && !nftList) return <LoadingOutlined />;
                if (props.className === `panel-id-stakedForMilk` && !stakedForMilk) return <LoadingOutlined />;
                if (props.className === `panel-id-stakedForWool` && !stakedForWool) return <LoadingOutlined />;
                if (props.className === `panel-id-stakedWolves` && !stakedWolve) return <LoadingOutlined />;

                if (props.className === `panel-id-stakedForMilk-OLD` && !stakedForMilk2) return <LoadingOutlined />;
                if (props.className === `panel-id-stakedForWool-OLD` && !stakedForWool2) return <LoadingOutlined />;
                if (props.className === `panel-id-stakedWolves-OLD` && !stakedWolve2) return <LoadingOutlined />;
                if (props.isActive) return <DownOutlined />;
                return <RightOutlined />;
              }}>
              {RenderList(nftList, 'unstaked')}
              {RenderList(stakedForMilk, 'stakedForMilk')}
              {RenderList(stakedForWool, 'stakedForWool')}
              {RenderList(stakedWolve, 'stakedWolves')}

              {RenderList(stakedForMilk2, 'stakedForMilk-OLD')}
              {RenderList(stakedForWool2, 'stakedForWool-OLD')}
              {RenderList(stakedWolve2, 'stakedWolves-OLD')}
            </Collapse>
          </Col>
          <Col span={2}></Col>
        </Row>
        <Row>
          <Col span={2}></Col>
          <Col span={20}>
            <Timeline pending={`Loading...`} reverse={true}>
              {lastEvts.data.map((evt) => (
                <MyTimelineItem key={evt.key} evt={evt} updateUser={setUser}></MyTimelineItem>
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
