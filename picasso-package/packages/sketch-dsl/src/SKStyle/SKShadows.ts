import { SKColor } from '../SKColor';
import { SKContextSettings } from './SKContextSettings';

export type SKShadowItem = {
    _class: string
    isEnabled: boolean  // 是否生效
    blurRadius: number
    spread: number
    color: SKColor
    offsetX: number
    offsetY: number
    contextSettings: SKContextSettings
}

export type SKShadows = SKShadowItem[];
