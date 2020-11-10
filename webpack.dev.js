const merge = require('webpack-merge');
const common = require('./webpack.common');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const path = require('path');
const { prefixName, libraryName, target } = require('./build-settings');

module.exports = merge(common, {
  mode: 'development',
  devtool: 'source-map',
  plugins: [
    new HtmlWebpackPlugin({
      filename: 'index.html',
      template: './src/index.html',
      inject: false,
    }),
  ],
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: prefixName + '.[hash].js',
    library: libraryName,
    libraryTarget: target,
  },
  module: {
    rules: [
      {
        test: /\.js$/,
        use: ['source-map-loader'],
        enforce: 'pre',
      },
    ],
  },
});
