import { Color } from '../common';

/**
 * 字体粗细
 */
export type FontWeight = 100|200|300|400|500|600|700|800|900;

/**
 * 文本样式
 */
export type TextStyle = {
  wordBreak?: 'break-all'
  lineHeight? : number
  fontSize? : number
  textAlign? : 'left'|'right'|'center'|'justify'
  color? : Color
  fontFamily? : string // 字体
  fontWeight? : FontWeight
  textIndent?: number 
  letterSpacing? : number
  textDecoration? : string
  textTransform? : string
  paragraphSpacing?: number
}
