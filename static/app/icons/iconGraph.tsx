import {IconGraphArea} from './iconGraphArea';
import {IconGraphBar} from './iconGraphBar';
import {IconGraphCircle} from './iconGraphCircle';
import {IconGraphLine} from './iconGraphLine';
import {IconGraphScatter} from './iconGraphScatter';
import type {SVGIconProps} from './svgIcon';

interface Props extends SVGIconProps {
  type?: 'line' | 'circle' | 'bar' | 'area' | 'scatter';
}

function IconGraph({ref, type = 'line', ...props}: Props) {
  switch (type) {
    case 'circle':
      return <IconGraphCircle {...props} ref={ref} />;
    case 'bar':
      return <IconGraphBar {...props} ref={ref} />;
    case 'area':
      return <IconGraphArea {...props} ref={ref} />;
    case 'scatter':
      return <IconGraphScatter {...props} ref={ref} />;
    default:
      return <IconGraphLine {...props} ref={ref} />;
  }
}

IconGraph.displayName = 'IconGraph';

export {IconGraph};
