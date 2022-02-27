import { LoadingOutlined } from '@ant-design/icons';
import { Tag, Timeline } from 'antd';
import { BigNumber, ethers, utils } from 'ethers';
import React, { HTMLProps, useCallback, useContext, useEffect, useState } from 'react';
import { Config } from 'src/Config';
import { withDefaultProps } from 'src/types/react.ext';
import { TransferEvent } from 'src/types/wolf';
import { WolfItem } from './Wolftem';

export const OldMint = '0xA40e34F4b933D33874Db73c427CdE0Eb53fe28eF';
const defaultProps = {};
type CptTypes = {
  evt: TransferEvent;
  updateUser: (user: string) => any;
} & typeof defaultProps;

const Cpt: React.FC<CptTypes> = (props) => {
  const { evt, updateUser } = props;
  const [res, setRes] = useState(evt.res);
  useEffect(() => {
    evt.req.then(setRes);
  }, []);
  const data = evt.data
    .filter((it) => {
      // 半价折扣的中转
      if (it.from === ethers.constants.AddressZero && it.to === OldMint) return false;
      return true;
    })
    .map((it) => {
      const ress: Array<{ color: string; ctType: number; content: string }> = [];
      if (it.from === ethers.constants.AddressZero) {
        if (res && res.from !== it.to) {
          ress.push({ content: 'Lose', color: 'red', ctType: 2 });
          ress.push({ content: res.from, color: 'red', ctType: 1 });
        } else {
          ress.push({ content: 'Mint', color: 'cyan', ctType: 2 });
          ress.push({ content: it.to, color: 'cyan', ctType: 1 });
        }
      } else if (it.from === Config.Contract.Barn) {
        ress.push({ content: 'Leave Barn', color: 'pink', ctType: 2 });
        ress.push({ content: it.to, color: 'pink', ctType: 1 });
      } else if (it.to === Config.Contract.Barn) {
        ress.push({ content: 'Staked Barn', color: 'lime', ctType: 2 });
        ress.push({ content: it.from, color: 'lime', ctType: 1 });
      } else if (it.from === OldMint) {
        ress.push({ content: 'Discount Mint', color: 'green', ctType: 2 });
        ress.push({ content: it.to, color: 'green', ctType: 1 });
      } else if (it.event === 'TokenStolen') {
        ress.push({ content: it.event, color: 'geekblue', ctType: 2 });
        ress.push({ content: it.to, color: 'geekblue', ctType: 1 });
      } else {
        ress.push({ content: it.event, color: 'default', ctType: 2 });
        ress.push({ content: it.from, color: 'default', ctType: 1 });
        ress.push({ content: it.to, color: 'default', ctType: 1 });
      }
      return { tokenId: it.tokenId.toString(), ress };
    });
  return (
    <Timeline.Item dot={res ? null : <LoadingOutlined />} key={evt.key}>
      <div>
        <div className="page-index-panel-block">
          {evt.blockNumber}
          {res && (
            <Tag className="g-cursor-pointer" onClick={() => updateUser(res.from)}>
              from: {res.from}
            </Tag>
          )}
        </div>
        <div className="page-index-panel-content">
          {data.map((item, idx) => (
            <div className="page-index-panel-item" key={idx}>
              {item.ress.map((tag) => {
                if (tag.ctType === 2) {
                  return (
                    <Tag color={tag.color} key={tag.content}>
                      <a href={`${Config.ChainTX}${evt.tx}`} target="_blank">
                        {tag.content}
                      </a>
                    </Tag>
                  );
                } else if (tag.ctType === 1) {
                  return (
                    <Tag color={tag.color} key={tag.content} className="g-cursor-pointer" onClick={() => updateUser(tag.content)}>
                      {tag.content}
                    </Tag>
                  );
                }
              })}
              <WolfItem id={item.tokenId}></WolfItem>
            </div>
          ))}
        </div>
      </div>
    </Timeline.Item>
  );
};

export const MyTimelineItem = withDefaultProps(defaultProps, Cpt);
