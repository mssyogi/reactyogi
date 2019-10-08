const path = require('path');
const webpack = require('webpack');
const { BundleAnalyzerPlugin } = require('webpack-bundle-analyzer');
const CleanPlugin = require('clean-webpack-plugin');
const CompressionPlugin = require('compression-webpack-plugin');
const HtmlPlugin = require('html-webpack-plugin');
const UglifyJsPlugin = require('uglifyjs-webpack-plugin');
const ExtractTextPlugin = require('extract-text-webpack-plugin');
const pkg = require('./package.json');
const {
  CAPTCHA_SITE_KEY, URL_LOGIN_SERVICE, PORT,
} = require('./config');

const VERSION = pkg.version;
const NAME = pkg.name;
const environment = process.env.NODE_ENV || 'development';

const getDevTools = () => (environment === 'development' ? 'cheap-module-eval-source-map' : 'source-map');

const getPlugins = () => {
  const plugins = [
    new CleanPlugin(['./dist'], {
      root: path.resolve('./'),
      verbose: true,
    }),
    new HtmlPlugin({
      filename: environment === 'development' ? './index.html' : `${NAME}-${VERSION}.html`,
      template: path.resolve('./index.html'),
      title: NAME,
    }),
    new BundleAnalyzerPlugin({
      analyzerMode: 'static',
      defaultSizes: 'gzip',
      openAnalyzer: process.env.NODE_ENV === 'production',
    }),
    new webpack.EnvironmentPlugin({ NODE_ENV: 'development' }),
    new ExtractTextPlugin({ filename: `${NAME}-${VERSION}.css` }),
  ];

  if (process.env.NODE_ENV === 'production') {
    plugins.push(
      new CompressionPlugin(),
      new UglifyJsPlugin({
        parallel: true,
        sourceMap: true,
        uglifyOptions: {
          compress: true,
          ecma: 6,
        },
      })
    );
  }

  // Allow env variable in dev mode
  if (process.env.NODE_ENV !== 'production') {
    plugins.push(
      new webpack.DefinePlugin({
        process: {
          env: {
            CAPTCHA_SITE_KEY: JSON.stringify(CAPTCHA_SITE_KEY),
            URL_LOGIN_SERVICE: JSON.stringify(URL_LOGIN_SERVICE),
          },
        },
      })
    );
  }

  return plugins;
};

module.exports = {
  devServer: {
    historyApiFallback: true,
    port: PORT,
  },
  devtool: getDevTools(),
  entry: ['babel-polyfill', './src/index.js', './style/core.scss'],
  module: {
    rules: [
      {
        exclude: /node_modules/,
        test: /\.(js|jsx)$/i,
        use: [
          {
            loader: 'babel-loader',
            options: {
              cacheDirectory: true,
              presets: ['env', 'react', 'stage-2'],
            },
          },
        ],
      },
      {
        loaders: ['style-loader', 'css-loader'],
        test: /\.css$/,
      },
      {
        test: /\.scss$/,
        use: ExtractTextPlugin.extract({
          fallback: 'style-loader',
          use: ['css-loader', 'resolve-url-loader', 'sass-loader?sourceMap'],
        }),
      },
      {
        loader: 'url-loader?limit=100000',
        test: /\.(png|jpe?g|woff|woff2|eot|ttf|svg)$/i,
      },
    ],
  },
  output: {
    filename: `${NAME}-${VERSION}.js`,
    path: path.resolve(__dirname, 'dist'),
    publicPath: '/',
  },
  plugins: getPlugins(),
  profile: true,
};