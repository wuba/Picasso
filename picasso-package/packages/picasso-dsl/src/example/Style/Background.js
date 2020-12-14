const Color = require('./Color');
module.exports ={
  color:Color,
  image:{
    url:'./images/image_2_1.png'
  },
  position:{
    left: 10,
    top: 10
  },
  size:{
    width: 10,
    height: 10
  },
  repeat:'no-repeat',
  linearGradient:{
    gAngle:'90deg',
    gList:[{
      color:Color,
      position:0
    },{
      color:Color,
      position:0.5
    },{
      color:Color,
      position:1
    }]
  },
  radialGradient:{
    smallRadius:10,
    largeRadius:20,
    position:{
      left:10,
      top:10
    },
    gList:[{
      color:Color,
      position:0
    },{
      color:Color,
      position:0.5
    },{
      color:Color,
      position:1
    }]
  }
}