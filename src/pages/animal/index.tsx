import { Button, Card, Col, Input, Layout, List, Row, Tag } from 'antd';
import { Content, Footer, Header } from 'antd/lib/layout/layout';
import { ethers } from 'ethers';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { WolfItem } from 'src/components/Wolftem';
import { connectMetamask, getContractHandler, _getAddress } from 'src/lib/ethereum';
import { Wolf } from 'src/types/wolf';

const App = () => {
  const navigate = useNavigate();
  const loc = useLocation();
  const urls = new URLSearchParams(loc.search);
  const ids = urls.get('ids') || '';
  const userInput = useRef(ids);
  const [showList, setShowList] = useState<string[]>(ids.split(','));

  const setIds = (u: string) => {
    urls.set('ids', u);
    userInput.current = u;
    navigate({ search: urls.toString() }, { replace: true });
    setShowList((v) => {
      const last = v.join(',');
      if (last === u) return v;
      const result = new Set(u.split(','));
      return [...result.values()];
    });
  };
  const onUserChange = useCallback((e) => {
    userInput.current = e.target.value || '';
    setIds(userInput.current.trim());
  }, []);

  const RenderList = () => {
    return (
      <List
        dataSource={showList}
        renderItem={(item) => (
          <Card key={item}>
            <WolfItem detail={true} id={item} />
          </Card>
        )}
      />
    );
  };

  return (
    <Layout>
      <Header style={{ color: '#fff' }}>BY: 0x10febDB47De894026b91D639049E482f7E8C7e2e</Header>
      <Content style={{ backgroundColor: '#fff', paddingTop: '20px' }}>
        <Row>
          <Col span={2}></Col>
          <Col span={20}>
            <Tag>Input the tokenID of wolf/sheep, for example: 6909,6934,326</Tag>
            <Input value={userInput.current} onChange={onUserChange} addonBefore="tokenIds" />
          </Col>
          <Col span={2}></Col>
        </Row>
        <Row>
          <Col span={2}></Col>
          <Col span={20}>{RenderList()}</Col>
          <Col span={2}></Col>
        </Row>
      </Content>
      <Footer></Footer>
    </Layout>
  );
};

export default App;
