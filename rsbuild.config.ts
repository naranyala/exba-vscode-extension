import { defineConfig } from '@rsbuild/core';
import path from 'path';

export default defineConfig({
  source: {
    entry: {
      index: './src/webview/app-component.ts',
    },
  },
  output: {
    distPath: {
      root: path.join(__dirname, 'dist/webview'),
    },
    filename: {
      js: 'bundle.js',
      css: 'index.css',
    },
    assetPrefix: './',
  },
  html: {
    template: './src/webview/index.html',
  },
});
