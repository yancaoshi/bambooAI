import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path, { resolve } from 'path';
import fs from 'fs';

// 递归扫描 src 下的所有目录，查找 index.html 作为多页面入口
const getEntries = (dir = resolve(__dirname, 'src')) => {
  const entries = {};
  const items = fs.readdirSync(dir);

  items.forEach(item => {
    const itemPath = resolve(dir, item);
    const stat = fs.statSync(itemPath);

    if (stat.isDirectory()) {
      // 递归扫描子目录中的 index.html
      const subEntries = getEntries(itemPath);
      Object.assign(entries, subEntries);
      
      const htmlPath = resolve(itemPath, 'index.html');
      if (fs.existsSync(htmlPath)) {
        const relativeKey = path.relative(resolve(__dirname, 'src'), itemPath);
        entries[relativeKey] = htmlPath;
      }
    } else if (item.endsWith('.html')) {
      // 处理 src 根目录下的 HTML 文件 (如 list.html)
      const name = item.replace(/\.html$/, '');
      entries[name] = itemPath;
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
