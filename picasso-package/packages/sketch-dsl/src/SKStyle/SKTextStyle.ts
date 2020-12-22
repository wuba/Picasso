import { SKColor } from '../SKColor';

export type SKTextStyle = {
    _class: 'textStyle'
    encodedAttributes: {
        MSAttributedStringFontAttribute: {
            _class: 'fontDescriptor'
            attributes: {
                name: string
                size: number
            }
        }
        MSAttributedStringColorAttribute: SKColor
        textStyleVerticalAlignmentKey: number
        paragraphStyle: {
            _class: 'paragraphStyle'
            alignment: number
            paragraphSpacing: number
            allowsDefaultTighteningForTruncation: number
        }
        kerning: number
    }
    verticalAlignment: number
}
