export default `@charset "UTF-8";

  * {
    user-select: none;
  }

  input,
  textarea {
    user-select: text;
  }

  /* 去除手机默认添加的黄色背景 */
input {
  -webkit-appearance: none;
  -webkit-tap-highlight-color: transparent;
}

  input {
    background: none;
    outline: none;
    border: 0px;
    border-radius: 0;
  }

  html,
  body,
  div,
  span,
  object,
  iframe,
  h1,
  h2,
  h3,
  h4,
  h5,
  h6,
  p,
  blockquote,
  pre,
  abbr,
  address,
  cite,
  code,
  del,
  dfn,
  em,
  img,
  ins,
  kbd,
  q,
  samp,
  small,
  strong,
  sub,
  sup,
  var,
  b,
  i,
  dl,
  dt,
  dd,
  ol,
  ul,
  li,
  fieldset,
  form,
  label,
  legend,
  table,
  caption,
  tbody,
  tfoot,
  thead,
  tr,
  th,
  td,
  article,
  aside,
  canvas,
  details,
  figcaption,
  figure,
  footer,
  header,
  hgroup,
  menu,
  nav,
  section,
  summary,
  time,
  mark,
  audio,
  video,
  select {
    margin: 0;
    padding: 0;
    border: 0;
    outline: 0;
    font-size: 100%;
    vertical-align: baseline;
    background: transparent;
    font-family: PingFangSC-Regular,Microsoft YaHei;

  }
  article,
  aside,
  details,
  figcaption,
  figure,
  footer,
  header,
  hgroup,
  menu,
  nav,
  section {
    display: block;
  }

  audio,
  canvas,
  video {
    display: inline-block;
    *display: inline;
    *zoom: 1;
  }

  audio:not([controls]) {
    display: none;
  }

  :hover,
  :focus,
  :active {
    outline: none;
  }

  html,
  button,
  input,
  select,
  textarea {
    font-family: PingFangSC-Regular,Microsoft YaHei;
  }

  input,
  select,
  img {
    vertical-align: middle;
    border: 0px;
    font-size: 100%;
  }

  ol,
  ul {
    list-style: none;
  }

  table {
    border-collapse: collapse;
    border-spacing: 0;
  }

  fieldset,
  img {
    border: 0;
  }

  a {
    color: #0099cc;
    cursor: pointer;
    text-decoration: none;
  }

  a:hover {
    color: #0383ae;
    text-decoration: none;
  }
  i,
  em {
    font-style: normal;
  }

  select,
  input[type="text"],
  input[type="submit"],
  input[type="reset"],
  input[type="button"],
  button {
    -webkit-appearance: none;
  }

  input {
    -webkit-appearance: none;
  }

img {
    display: block;
}

*{
    box-sizing: border-box;
}
`
