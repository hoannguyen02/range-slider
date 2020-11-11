const merge = require('webpack-merge');
const common = require('./webpack.common');
const path = require('path');
const {
  prefixName,
  libraryName,
  fileNames,
  target,
} = require('./build-settings');
const HtmlWebpackPlugin = require('html-webpack-plugin');

module.exports = merge(common, {
  mode: 'production',
  plugins: htmlWebpackPlugins(),
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: prefixName + '.min.js',
    library: libraryName,
    libraryTarget: target,
    globalObject: 'this',
  },
});

function htmlWebpackPlugins() {
  return fileNames.map(
    fileName =>
      new HtmlWebpackPlugin({
        filename: `${fileName}.html`,
        template: `./src/${fileName}.html`,
        inject: false,
      })
  );
}
