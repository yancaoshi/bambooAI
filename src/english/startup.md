# Word Master 项目启动说明

## 后端服务 (Backend)

后端负责数据库操作和 API 提供。

1. **进入服务器目录**
   ```bash
   cd server
   ```

2. **启动服务**
   ```bash
   node index.js
   ```
   *或者在根目录运行：`npm run server`*

## 前端界面 (Frontend)

前端负责 UI 显示和交互。

1. **进入根目录**
   ```bash
   cd .. # 如果当前在 server 或 src 目录
   ```

2. **安装依赖** (仅首次启动需要)
   ```bash
   npm install
   ```

3. **启动开发服务器**
   ```bash
   npm run dev
   ```
   启动后，访问：[http://localhost:3000/english/](http://localhost:3000/english/)

## 协作说明

- **开发模式**: 需要同时运行后端服务 (Port 4000) 和前端开发服务器 (Port 3000)。
- **生产环境**: 运行 `npm run build` 后，后端会自动托管 `dist` 目录下的静态文件。

## 配置说明

- **默认端口**: 服务默认运行在 [http://localhost:4000](http://localhost:4000)。
- **环境变量**: 可以在 `server/.env` 文件中配置 `PORT`、`DB_PATH`、`ADMIN_USER` 和 `ADMIN_PASS` 等参数。
- **数据库**: 使用 SQLite 数据库，默认存储在 `server/db/english.sqlite`。

## 故障排除

如果遇到 `ReferenceError: apiRouter is not defined` 错误，请确保 `server/index.js` 中已正确定义 `apiRouter`：
```javascript
const apiRouter = express.Router();
```
(注：该问题已在本次操作中修复)
