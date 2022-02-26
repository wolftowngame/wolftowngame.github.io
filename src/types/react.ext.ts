import React from 'react';

export const withDefaultProps = <P extends object, DP extends Partial<P> = Partial<P>>(defaultProps: DP, Cmp: React.ComponentType<P>) => {
  type RequiredProps = Omit<P, keyof DP>;
  type Props = Partial<DP> & Required<RequiredProps>;
  Cmp.defaultProps = defaultProps;
  return React.memo(Cmp) as React.ComponentType<any> as React.ComponentType<Props>;
};
