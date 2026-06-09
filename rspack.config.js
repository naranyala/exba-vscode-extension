const path = require('path');

module.exports = {
  entry: {
    extension: './src/extension.ts',
  },
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: 'extension.js',
    library: {
      type: 'commonjs',
    },
  },
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        use: {
          loader: 'builtin:swc-loader',
          options: {
            jsc: {
              parser: {
                syntax: 'typescript',
              },
            },
          },
        },
        type: 'javascript/auto',
      },
    ],
  },
  resolve: {
    extensions: ['.ts', '.js'],
    alias: {
      vscode: path.resolve(__dirname, 'node_modules/vscode'), // This is a placeholder, VS Code provides it
    },
  },
  externals: ['vscode'],
  target: 'node',
  mode: 'development',
  devtool: 'source-map',
};
