# BambooAI 实验项目启动手册

本项目包含多个模块（英语、物理、化学、科学等），采用统一的前后端分离架构。

## 统一启动方法 (推荐)

最简单的方法是在项目根目录下同时启动前端和后端服务。

### 1. 启动后端服务 (API)
```bash
npm run server
```
- **端口**: 4000
- **功能**: 处理数据存储、用户统计、排行榜等。

### 2. 启动前端服务 (UI)
```bash
npm install  # 仅首次需要
npm run dev
```
- **端口**: 3000
- **功能**: 提供所有模块的交互界面。
- **内容清单**: [http://localhost:3000/list.html](http://localhost:3000/list.html)

---

## 模块访问地址 (开发环境)

启动前端服务后，可以通过以下路径访问不同模块：

- **英语 (Word Master)**: [http://localhost:3000/english/](http://localhost:3000/english/)
- **物理 (Physics Labs)**: 
  - 光学实验室: [http://localhost:3000/physics/optics-lab/](http://localhost:3000/physics/optics-lab/)
  - 折射实验室: [http://localhost:3000/physics/refraction-lab/](http://localhost:3000/physics/refraction-lab/)
- **化学 (Chemistry Labs)**:
  - 分子查看器: [http://localhost:3000/chemistry/molecule-viewer/](http://localhost:3000/chemistry/molecule-viewer/)
  - 火焰反应测试: [http://localhost:3000/chemistry/flame-test/](http://localhost:3000/chemistry/flame-test/)

---

## 协作说明

- **多页面架构**: 本项目使用 Vite 的多页面 (MPA) 模式。每个模块在 `src` 目录下都有自己的文件夹和 `index.html`。
- **配置**: 如果需要调整端口或扫描路径，请修改根目录下的 `vite.config.js`。
- **生产构建**: 运行 `npm run build` 将所有模块打包到 `dist` 目录。
