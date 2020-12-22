export default `@charset "UTF-8";

page,
view,
input,
text,
form,
navigator,
rich-text,
picker,
scroll-view,
cover-view,
open-data {
    box-sizing: border-box;
}
rich-text,
open-data,
form {
    display: block;
}
del {
    color: #999;
    text-decoration: line-through;
}
image {
    display: block;
}
cover-view {
    line-height: 1.5;
    white-space: normal;
}
page {
    font-size: 28rpx;
    font-weight: 300;
    line-height: 1.5;
    color: #404040;
    background: #f8f8f8;
}

/* 隐藏默认滚动条 */
::-webkit-scrollbar {
    width: 0;
    height: 0;
    color: transparent;
}
`