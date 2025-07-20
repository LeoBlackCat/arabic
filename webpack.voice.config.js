const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const CopyWebpackPlugin = require('copy-webpack-plugin');
const webpack = require('webpack');

module.exports = {
  entry: './src/voice.js',
  output: {
    path: path.resolve(__dirname, 'dist-voice'),
    filename: 'voice-bundle.js',
    publicPath: '/',
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
        test: /\.(png|jpg|jpeg|gif|mp4|webm|ogg)$/i,
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
      template: './voice.html',
    }),
    new CopyWebpackPlugin({
      patterns: [
        { from: path.resolve(__dirname, 'sounds'), to: 'sounds' },
        { from: path.resolve(__dirname, 'pictures'), to: 'pictures' },
        { from: path.resolve(__dirname, 'logic.json'), to: 'logic.json' },
        { from: path.resolve(__dirname, 'sentences.json'), to: 'sentences.json' },
      ]
    }),
  ],
  devServer: {
    static: [
      { directory: path.join(__dirname, 'dist-voice') },
      { directory: path.join(__dirname, 'pictures'), publicPath: '/pictures' },
      { directory: path.join(__dirname, 'sounds'), publicPath: '/sounds' },
      { directory: path.join(__dirname, '.'), publicPath: '/' }
    ],
    hot: true,
    port: 3001,
  },
};