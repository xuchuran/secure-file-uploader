require('dotenv').config();
const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

// 静态文件服务
app.use(express.static(path.join(__dirname, '../client')));

// 基本路由
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '../client/index.html'));
});

// Socket.IO 连接处理
io.on('connection', (socket) => {
    console.log('客户端连接:', socket.id);
    
    socket.on('disconnect', () => {
        console.log('客户端断开连接:', socket.id);
    });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`🚀 服务器运行在 http://localhost:${PORT}`);
});
