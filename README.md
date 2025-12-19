# 🚀 雷速云传 - Dropbox 高速文件上传器

一个基于 Node.js + Socket.IO 的高速文件上传应用，支持大文件上传、断点续传、多线程加速等功能。

## ✨ 特性

- 🔐 **安全加密**: 端到端加密传输
- ⚡ **高速传输**: 多线程并发上传，速度比传统方式快数倍
- 📦 **大文件支持**: 支持 GB 级别大文件上传
- 🎯 **断点续传**: 网络中断后可继续上传
- 📊 **实时监控**: 显示上传速度、进度、剩余时间
- 🗂️ **文件管理**: 查看、分享、删除已上传文件
- 📱 **响应式设计**: 支持桌面和移动设备

## 🛠️ 技术栈

- **后端**: Node.js, Express, Socket.IO
- **前端**: HTML5, CSS3, JavaScript (ES6+)
- **存储**: Dropbox API (模拟环境)
- **实时通信**: WebSocket

## 📦 安装

1. 克隆项目
```bash
git clone https://github.com/your-username/secure-file-uploader.git
cd secure-file-uploader
```

2. 安装依赖
```bash
npm install
```

3. 启动服务器
```bash
npm run server
```

4. 访问应用
```
http://localhost:3000
```

## 🎮 使用方法

### 登录账户
应用提供了模拟的 Dropbox 环境，支持以下测试账户：

- **演示账户**: `demo@example.com` / `demo123`
- **测试账户**: `user@example.com` / `password123`

### 上传文件
1. 登录后会显示上传区域
2. 拖拽文件到上传区域或点击选择文件
3. 文件会自动开始上传，显示实时进度
4. 支持取消上传和查看上传历史

### 测试页面
- **主应用**: `http://localhost:3000` (完整功能)
- **简化测试**: `http://localhost:3000/simple-test.html`
- **功能测试**: `http://localhost:3000/test-upload.html`

## ⚙️ 配置

### 传输设置
- **并发线程**: 4-12 线程可选
- **块大小**: 10MB-100MB 可选
- **传输模式**: 标准/极速/稳定模式

### 环境变量
```bash
PORT=3000                    # 服务器端口
DROPBOX_APP_KEY=your_key     # Dropbox 应用密钥 (可选)
DROPBOX_APP_SECRET=your_secret # Dropbox 应用密钥 (可选)
```

## 🔧 开发

### 项目结构
```
secure-file-uploader/
├── server/
│   └── index.js          # 服务器端代码
├── client/
│   ├── index.html        # 主界面
│   └── main.js          # 前端逻辑
├── package.json         # 项目配置
├── simple-test.html     # 简化测试页面
└── test-upload.html     # 功能测试页面
```

### 启动开发服务器
```bash
npm run server
```

### 调试
- 服务器日志会显示在控制台
- 浏览器开发者工具可查看客户端日志
- Socket.IO 连接状态和数据传输日志

## 🚀 部署

### 本地部署
```bash
npm install
npm run server
```

### Docker 部署 (可选)
```dockerfile
FROM node:18
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
EXPOSE 3000
CMD ["npm", "run", "server"]
```

## 🔒 安全说明

- 本项目使用模拟的 Dropbox 环境，不会连接到真实的 Dropbox 服务
- 所有上传的文件都存储在本地服务器
- 测试账户仅用于演示，不包含真实用户数据
- 生产环境使用时请配置真实的 Dropbox API 密钥

## 📝 许可证

MIT License - 详见 [LICENSE](LICENSE) 文件

## 🤝 贡献

欢迎提交 Issue 和 Pull Request！

## 📞 联系

如有问题请提交 Issue 或联系开发者。

---

⚡ **享受高速传输的乐趣！**