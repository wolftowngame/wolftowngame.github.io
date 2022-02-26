import { Tag } from 'antd';
import { BigNumber, utils } from 'ethers';
import React, { HTMLProps, useCallback, useContext, useEffect } from 'react';
import { cn } from 'src/Config';
import { useWolfItem } from 'src/lib/Animal';
import { withDefaultProps } from 'src/types/react.ext';

const defaultProps = {};
type CptTypes = {
  id: string;
} & typeof defaultProps;

const Cpt: React.FC<CptTypes> = (props) => {
  const Pet = useWolfItem(props.id);
  if (!Pet) return <Tag>#{props.id}</Tag>;
  const isWolf = Pet.attributes.find((it) => it.trait_type === 'type' && it.value !== 'Sheep');
  return (
    <div style={{ display: 'inline-block' }}>
      <img className="img" src={Pet.imageSmall} />
      <Tag>#{props.id}</Tag>
      {isWolf ? <Tag color="red">Wolf</Tag> : <Tag color="purple">Sheep</Tag>}
    </div>
  );
};

export const WolfItem = withDefaultProps(defaultProps, Cpt);
