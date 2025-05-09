import {Fragment} from 'react';
import {useTheme} from '@emotion/react';

import type {SVGIconProps} from './svgIcon';
import {SvgIcon} from './svgIcon';

interface IconAddProps extends SVGIconProps {
  /**
   * @deprecated circled variant will be removed.
   */
  isCircled?: boolean;
}

export function IconAdd({ref, isCircled = false, ...props}: IconAddProps) {
  const theme = useTheme();
  return (
    <SvgIcon
      {...props}
      ref={ref}
      data-test-id="icon-add"
      kind={theme.isChonk ? 'stroke' : 'path'}
    >
      {theme.isChonk ? (
        <Fragment>
          <line x1="13.25" y1="8.01" x2="2.74" y2="8.01" />
          <line x1="7.99" y1="13.26" x2="7.99" y2="2.75" />
        </Fragment>
      ) : isCircled ? (
        <Fragment>
          <path d="M11.28,8.75H4.72a.75.75,0,1,1,0-1.5h6.56a.75.75,0,1,1,0,1.5Z" />
          <path d="M8,12a.76.76,0,0,1-.75-.75V4.72a.75.75,0,0,1,1.5,0v6.56A.76.76,0,0,1,8,12Z" />
          <path d="M8,16a8,8,0,1,1,8-8A8,8,0,0,1,8,16ZM8,1.53A6.47,6.47,0,1,0,14.47,8,6.47,6.47,0,0,0,8,1.53Z" />
        </Fragment>
      ) : (
        <Fragment>
          <path d="M8.75,7.25V2a.75.75,0,0,0-1.5,0V7.25H2a.75.75,0,0,0,0,1.5H7.25V14a.75.75,0,0,0,1.5,0V8.75H14a.75.75,0,0,0,0-1.5Z" />
        </Fragment>
      )}
    </SvgIcon>
  );
}

IconAdd.displayName = 'IconAdd';
