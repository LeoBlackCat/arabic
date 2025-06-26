const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const CopyWebpackPlugin = require('copy-webpack-plugin');
const webpack = require('webpack');

module.exports = {
  entry: './src/index.js',
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: 'bundle.js',
  },
  module: {
    rules: [
      {
        test: /\.(js|jsx)$/,
        exclude: /node_modules/,
        use: {
          loader: 'babel-loader',
        },
      },
      {
        test: /\.(png|jpg|jpeg|gif)$/i,
        type: 'asset/resource',
      },
      {
        test: /\.css$/i,
        use: [
          "style-loader",
          "css-loader",
          "postcss-loader"
        ],
      }
    ],
  },
  resolve: {
    extensions: ['.js', '.jsx'],
  },
  plugins: [
    new HtmlWebpackPlugin({
      template: './src/index.html',
    }),
    new CopyWebpackPlugin({
      patterns: [
        { from: path.resolve(__dirname, 'sounds'), to: 'sounds' },
        { from: path.resolve(__dirname, 'pictures'), to: 'pictures' },
        { from: path.resolve(__dirname, 'public/characters'), to: 'characters' },
        { from: path.resolve(__dirname, 'public/backgrounds'), to: 'backgrounds' },
      ]
    }),
    new webpack.DefinePlugin({
      'process.env.PUBLIC_URL': JSON.stringify(process.env.PUBLIC_URL || ''),
    }),
  ],
  devServer: {
    static: [
      { directory: path.join(__dirname, 'dist') },
      { directory: path.join(__dirname, 'pictures'), publicPath: '/pictures' },
      { directory: path.join(__dirname, 'sounds'), publicPath: '/sounds' },
      { directory: path.join(__dirname, 'public/characters'), publicPath: '/characters' },
      { directory: path.join(__dirname, 'public/backgrounds'), publicPath: '/backgrounds' }
    ],
    hot: true,
  },
};
