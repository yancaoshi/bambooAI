import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';
import fs from 'fs';

// 自动扫描 src 下的所有目录，查找 index.html 作为多页面入口
const getEntries = () => {
  const entries = {};
  const srcPath = resolve(__dirname, 'src');
  const items = fs.readdirSync(srcPath);

  items.forEach(item => {
    const itemPath = resolve(srcPath, item);
    const htmlPath = resolve(itemPath, 'index.html');
    if (fs.statSync(itemPath).isDirectory() && fs.existsSync(htmlPath)) {
      entries[item] = htmlPath;
    }
  });

  return entries;
};

export default defineConfig({
  plugins: [react()],
  root: 'src',
  base: './',
  build: {
    outDir: '../dist',
    rollupOptions: {
      input: getEntries(),
    },
  },
  server: {
    port: 3000,
    open: true,
  },
});
