`<html lang="en">
  <head>
    <meta charset="utf-8">
    <meta http-equiv="X-UA-Compatible" content="IE=edge">
    <meta name="viewport" content="width=device-width,initial-scale=1.0">
    <link rel="icon" href="<%= BASE_URL %>favicon.ico">
    <title><%= htmlWebpackPlugin.options.title %></title>
  </head>
  <body>
    <noscript>
      <strong><%= htmlWebpackPlugin.options.title %>无法打开，请使用现代浏览器</strong>
    </noscript>
    <div id="app"></div>
    <script src="<%= BASE_URL %>static/libs/jsts/jsts.min.js"></script>
    <script src="<%= BASE_URL %>static/libs/echarts/echarts.min.js"></script>
    <script src="<%= BASE_URL %>static/libs/echarts-gl/echarts-gl.min.js"></script>
    <script src="<%= BASE_URL %>static/libs/Cesium/Cesium.js"></script>
  </body>
</html>`

## config.js

`{assetsDir: "static",
    devServer:{
        proxy: {
      [process.env.VUE_APP_BASE_API]: {
        target: 'http://192.168.1.10:8090',
        changeOrigin: true,
        pathRewrite: {
          ['^' + process.env.VUE_APP_BASE_API]: ''
        }
      },
    }
    }

}`