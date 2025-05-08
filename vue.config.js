module.exports = {
  publicPath: '/',
  outputDir: 'dist',
  assetsDir: 'assets',
  lintOnSave: false,
  devServer: {
    proxy: {
      '/api': {
        target: 'http://115.235.191.234:3000',  // 后端服务器的地址
        changeOrigin: true,
        pathRewrite: {
          '^/api': ''  // 移除路径中的 /api 前缀
        }
      },
      '/socket.io': {
        target: 'http://115.235.191.234:3000',  // 后端服务器的地址
        ws: true,  // 启用 WebSocket 代理
        changeOrigin: true
      }
    }
  }
};