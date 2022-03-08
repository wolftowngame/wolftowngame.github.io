import { Tag } from 'antd';
import { BigNumber, utils } from 'ethers';
import React, { HTMLProps, useCallback, useContext, useEffect } from 'react';
import { cn } from 'src/Config';
import { useWolfItem } from 'src/lib/Animal';
import { withDefaultProps } from 'src/types/react.ext';

const defaultProps = {
  detail: false,
};
type CptTypes = {
  id: string;
} & typeof defaultProps;

const Cpt: React.FC<CptTypes> = (props) => {
  const Pet = useWolfItem(props.id);
  if (!Pet) return <Tag>#{props.id}</Tag>;
  const typeAttr = Pet.attributes.find((it) => it.trait_type === 'type');
  const renderTag = () => {
    if (!typeAttr) return null;
    if (typeAttr.value === 'Sheep') return <Tag color="purple">{Pet.name}</Tag>;
    if (typeAttr.value === 'Wolf') return <Tag color="purple">{Pet.name}</Tag>;
    return null;
  };
  return (
    <div style={{ display: 'inline-block' }}>
      <img className="img" src={Pet.imageSmall} />
      {renderTag()}
      {props.detail && Pet.attributes
        ? Pet.attributes.map((it) => (
            <Tag key={it.trait_type}>
              {it.trait_type}: {it.value}
            </Tag>
          ))
        : null}
    </div>
  );
};

export const WolfItem = withDefaultProps(defaultProps, Cpt);
