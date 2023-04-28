const path = require('path');

module.exports = {
  mode: 'development',
  devtool: 'inline-source-map',
  entry: {
    main: './src/index.ts',
  },
  output: {
    path: path.resolve(__dirname, './dist'),
    filename: 'index.js'
  },
  resolve: {
    extensions: ['.ts', '.tsx', '.js'],
    fallback: {
      'path': false,
      'os': false,
      'url': false,
      'http': false,
      'https': false,
      'assert': false,
      'util': false,
      'fs': false,
      'net': false,
      'tls': false,
    }
  },
  module: {
    rules: [
      { 
        test: /\.tsx?$/,
        loader: 'ts-loader'
      }
    ]
  }
};
