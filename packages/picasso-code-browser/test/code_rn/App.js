import React, { Component } from 'react';
import {
    Image,
    View,
    Text,
    ImageBackground,
    ScrollView,
    Dimensions,
    StyleSheet,
    SafeAreaView,
    Platform,
    StatusBar,
} from 'react-native';


const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

const scaleSize = (size) => size * (SCREEN_WIDTH / 375);

const isIphoneX = () => {
    return Platform.OS === 'ios' &&
        !Platform.isPad &&
        !Platform.isTVOS &&
        (SCREEN_HEIGHT === 812 || SCREEN_WIDTH === 812 || SCREEN_WIDTH === 896 || SCREEN_HEIGHT === 896);
}
  
const STATUSBAR_HEIGHT = Platform.select({
    ios: isIphoneX() ? 44 : 20,
    android: StatusBar.currentHeight,
})

export default class PicasoPage extends Component {
    constructor(props) {
        super(props);
    }

    componentDidMount() {}

    componentWillUnmount() {}

    render() {
        return (
            <ScrollView style={{ flex: 1, width: SCREEN_WIDTH, height: SCREEN_HEIGHT }}>
                <View style={styles.rat}>
<View style={styles.valley}>
<Text style={[styles.pence, { height: undefined, lineHeight: undefined }]}>
1:20
</Text>
<View style={styles.unconditional}>
<View style={styles.feather}>
<View style={styles.zoo}>

</View>
<View style={styles.build}>

</View>
<View style={styles.field}>

</View>
<View style={styles.nationality}>

</View>
</View>
</View>
<View style={styles.salad}>
<View style={styles.ferry}>
<View style={styles.building}>
<Image style={styles.limit} source={{uri: "https://wos.58cdn.com.cn/cDazYxWcDHJ/picasso/f142478de24730f7f09659bfe6b10ef3ddd532ac.png"}} resizeMode={"stretch"} />
<Image style={styles.stewardess} source={{uri: "https://wos.58cdn.com.cn/cDazYxWcDHJ/picasso/f142478de24730f7f09659bfe6b10ef3ddd532ac.png"}} resizeMode={"stretch"} />
</View>
<Image style={styles.water} source={{uri: "https://wos.58cdn.com.cn/cDazYxWcDHJ/picasso/f142478de24730f7f09659bfe6b10ef3ddd532ac.png"}} resizeMode={"stretch"} />
</View>
</View>
<View style={styles.manage}>
<View style={styles.path}>
<View style={styles.example}>
<View style={styles.purple}>
<Image style={styles.valid} source={{uri: "https://wos.58cdn.com.cn/cDazYxWcDHJ/picasso/b77502565a455aba61dca95a61fd4c1eba81db77.png"}} resizeMode={"stretch"} />
</View>
</View>
<Image style={styles.hurry} source={{uri: "https://wos.58cdn.com.cn/cDazYxWcDHJ/picasso/7f3e4f22e615a5395dfe1e570efe48cf390ef8eb.png"}} resizeMode={"stretch"} />
</View>
</View>
</View>
<View style={styles.argue}>
<Image style={styles.accommodation} source={{uri: "https://wos.58cdn.com.cn/cDazYxWcDHJ/picasso/0520ff859fda9883586768c6c62597f102e72082.png"}} resizeMode={"stretch"} />
<View style={styles.mixture}>
<Text style={[styles.time, { height: undefined, lineHeight: undefined }]}>
58阿姨-到家精选服务人员端
</Text>
<View style={styles.picnic}>
<Text style={[styles.consensus, { height: undefined, lineHeight: undefined }]}>
工具
</Text>
<Text style={[styles.smoke, { height: undefined, lineHeight: undefined }]}>
免费
</Text>
</View>
</View>
</View>
<View style={styles.protection}>
<Image style={styles.conscience} source={{uri: "https://wos.58cdn.com.cn/cDazYxWcDHJ/picasso/e2d05447e6f02dfa7cae7a8c4a4ebaffabf8321a.png"}} resizeMode={"stretch"} />
<Image style={styles.sense} source={{uri: "https://wos.58cdn.com.cn/cDazYxWcDHJ/picasso/329d4acf7bf2cf26f8be3477aa6122e5dd551f82.png"}} resizeMode={"stretch"} />
</View>
<Text style={[styles.owe, { height: undefined, lineHeight: undefined }]}>
应用介绍
</Text>
<Text style={[styles.chant, { height: undefined, lineHeight: undefined }]}>
【产品简介】\n-58同城到家精选维提供家政服务的服务人员提供高效的订单管理工具——58阿姨。\n-58同城到家精选业务覆盖全国128个城市，58阿姨是广大服务人员高效服务的第一选择。
</Text>
<Text style={[styles.term, { height: undefined, lineHeight: undefined }]}>
【产品特点】\n-服务流程规范明了\n-订单处理高效便捷\n-联系客户一键拨打\n-服务地址一键导航\n-优质服务一键记录\n-服务推广一触即达
</Text>
<Text style={[styles.urban, { height: undefined, lineHeight: undefined }]}>
【适用范围】\n-北京、上海、广州、深圳、成都、重庆、武汉、长沙、青岛等全国128个城市。
</Text>
<View style={styles.considerate}>
<View style={styles.afraid}>

</View>
<View style={styles.bandage}>
<Image style={styles.table} source={{uri: "https://wos.58cdn.com.cn/cDazYxWcDHJ/picasso/cf42eee452df730b5139f3f3374dbbe88605c67e.png"}} resizeMode={"stretch"} />
<Text style={[styles.tennis, { height: undefined, lineHeight: undefined }]}>
iPhone&nbsp;下载
</Text>
</View>
<View style={styles.candidate}>
<Image style={styles.combine} source={{uri: "https://wos.58cdn.com.cn/cDazYxWcDHJ/picasso/4b95de63caff6a339915bfd349197af2373d9c1b.png"}} resizeMode={"stretch"} />
<Text style={[styles.hurricane, { height: undefined, lineHeight: undefined }]}>
Android&nbsp;下载
</Text>
</View>
</View>
<View style={styles.independent}>
<View style={styles.cancer}>

</View>
</View>
</View>
            </ScrollView>
        )
    }
}

const styles = StyleSheet.create({
  "rat": {
    "zIndex": 1,
    "width": scaleSize(750),
    "height": scaleSize(1971)
  },
  "valley": {
    "zIndex": 2,
    "width": scaleSize(750),
    "height": scaleSize(88)
  },
  "pence": {
    "zIndex": 20,
    "height": scaleSize(20),
    "textAlign": "left",
    "textAlignVertical": "center"
  },
  "unconditional": {
    "zIndex": 9,
    "width": scaleSize(40),
    "height": scaleSize(40)
  },
  "feather": {
    "zIndex": 15,
    "width": scaleSize(35),
    "height": scaleSize(21)
  },
  "zoo": {
    "zIndex": 19,
    "width": scaleSize(6),
    "height": scaleSize(21)
  },
  "build": {
    "zIndex": 18,
    "width": scaleSize(6),
    "height": scaleSize(17)
  },
  "field": {
    "zIndex": 17,
    "width": scaleSize(6),
    "height": scaleSize(12)
  },
  "nationality": {
    "zIndex": 16,
    "width": scaleSize(6),
    "height": scaleSize(8)
  },
  "salad": {
    "zIndex": 10,
    "width": scaleSize(40),
    "height": scaleSize(40)
  },
  "ferry": {
    "zIndex": 11,
    "width": scaleSize(30),
    "height": scaleSize(21)
  },
  "building": {
    "zIndex": 14,
    "width": scaleSize(30),
    "height": scaleSize(14)
  },
  "limit": {
    "zIndex": 14,
    "width": scaleSize(30),
    "height": scaleSize(9)
  },
  "stewardess": {
    "zIndex": 13,
    "width": scaleSize(19),
    "height": scaleSize(6)
  },
  "water": {
    "zIndex": 12,
    "width": scaleSize(9),
    "height": scaleSize(6)
  },
  "manage": {
    "zIndex": 3,
    "width": scaleSize(54),
    "height": scaleSize(40)
  },
  "path": {
    "zIndex": 4,
    "width": scaleSize(49),
    "height": scaleSize(23)
  },
  "example": {
    "zIndex": 5,
    "width": scaleSize(44),
    "height": scaleSize(23)
  },
  "purple": {
    "zIndex": 6,
    "width": scaleSize(40),
    "height": scaleSize(19)
  },
  "valid": {
    "zIndex": 8,
    "width": scaleSize(36),
    "height": scaleSize(15)
  },
  "hurry": {
    "zIndex": 7,
    "width": scaleSize(3),
    "height": scaleSize(9)
  },
  "argue": {
    "zIndex": 26,
    "width": scaleSize(643),
    "height": scaleSize(126)
  },
  "accommodation": {
    "zIndex": 23,
    "width": scaleSize(126),
    "height": scaleSize(126)
  },
  "mixture": {
    "zIndex": 26,
    "width": scaleSize(487),
    "height": scaleSize(98)
  },
  "time": {
    "zIndex": 24,
    "height": scaleSize(53),
    "textAlign": "left",
    "textAlignVertical": "center"
  },
  "picnic": {
    "zIndex": 26,
    "width": scaleSize(126),
    "height": scaleSize(37)
  },
  "consensus": {
    "zIndex": 25,
    "height": scaleSize(37),
    "textAlign": "left",
    "textAlignVertical": "center"
  },
  "smoke": {
    "zIndex": 26,
    "height": scaleSize(37),
    "textAlign": "left",
    "textAlignVertical": "center"
  },
  "protection": {
    "zIndex": 32,
    "width": scaleSize(540),
    "height": scaleSize(462)
  },
  "conscience": {
    "zIndex": 31,
    "width": scaleSize(260),
    "height": scaleSize(462)
  },
  "sense": {
    "zIndex": 32,
    "width": scaleSize(260),
    "height": scaleSize(462)
  },
  "owe": {
    "zIndex": 27,
    "height": scaleSize(50),
    "textAlign": "left",
    "textAlignVertical": "center"
  },
  "chant": {
    "zIndex": 28,
    "width": scaleSize(670),
    "height": scaleSize(230),
    "textAlignVertical": "center"
  },
  "term": {
    "zIndex": 29,
    "width": scaleSize(670),
    "height": scaleSize(322),
    "textAlignVertical": "center"
  },
  "urban": {
    "zIndex": 30,
    "width": scaleSize(670),
    "height": scaleSize(138),
    "textAlignVertical": "center"
  },
  "considerate": {
    "zIndex": 33,
    "width": scaleSize(750),
    "height": scaleSize(240)
  },
  "afraid": {
    "zIndex": 40,
    "width": scaleSize(750),
    "height": scaleSize(1)
  },
  "bandage": {
    "zIndex": 34,
    "width": scaleSize(615),
    "height": scaleSize(90)
  },
  "table": {
    "zIndex": 37,
    "width": scaleSize(48),
    "height": scaleSize(48)
  },
  "tennis": {
    "zIndex": 36,
    "width": scaleSize(201),
    "height": scaleSize(34),
    "textAlignVertical": "center"
  },
  "candidate": {
    "zIndex": 35,
    "width": scaleSize(615),
    "height": scaleSize(90)
  },
  "combine": {
    "zIndex": 39,
    "width": scaleSize(48),
    "height": scaleSize(48)
  },
  "hurricane": {
    "zIndex": 38,
    "width": scaleSize(217),
    "height": scaleSize(34),
    "textAlignVertical": "center"
  },
  "independent": {
    "zIndex": 21,
    "width": scaleSize(750),
    "height": scaleSize(68)
  },
  "cancer": {
    "zIndex": 22,
    "width": scaleSize(268),
    "height": scaleSize(10)
  }
})
