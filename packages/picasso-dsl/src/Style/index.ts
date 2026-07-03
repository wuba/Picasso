import { TextStyle }  from './TextStyle';
import { Background  }  from './Background';
import { BoxShadow  }  from './BoxShadow';
import { TextShadow  }  from './TextShadow';
import { Transform  }  from './Transform';
import { BorderRadius  }  from './BorderRadius';

export * from './TextStyle';
export * from './Background';
export * from './BoxShadow';
export * from './TextShadow';
export * from './Transform';
export * from './BorderRadius';

export type Style = {
    textStyle?: TextStyle
    background?: Background
    boxShadow?: BoxShadow
    textShadow?: TextShadow
    transform?: Transform
    borderRadius?: BorderRadius
    opacity?: number
    lineHeight?: number
}
