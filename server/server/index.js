require('dotenv').config();
const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const crypto = require('crypto');
const fs = require('fs-extra');
const path = require('path');
const cors = require('cors');
const compression = require('compression');
const helmet = require('helmet');

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  },
  maxHttpBufferSize: 1e8
});

// 中间件
app.use(helmet({ contentSecurityPolicy: false }));
app.use(compression());
app.use(cors());
app.use(express.json({ limit: '100mb' }));
app.use(express.static(path.join(__dirname, '../client')));

// 存储
const userDropboxClients = new Map();
const uploadSessions = new Map();

// 模拟 Dropbox 数据
const mockDropboxData = {
  'demo@example.com': {
    name: '演示用户',
    email: 'demo@example.com',
    used: 2.5 * 1024 * 1024 * 1024,
    allocated: 15 * 1024 * 1024 * 1024,
    files: []
  },
  'user@example.com': {
    name: '测试用户',
    email: 'user@example.com',
    used: 1.2 * 1024 * 1024 * 1024,
    allocated: 2 * 1024 * 1024 * 1024 * 1024,
    files: []
  }
};

// Socket.IO 连接处理
io.on('connection', (socket) => {
  console.log('客户端连接:', socket.id);

  // 账号密码登录
  socket.on('login-with-credentials', async (data) => {
    try {
      const { email, password } = data;
      const simulatedToken = await simulateDropboxLogin(email, password);
      
      if (simulatedToken) {
        const mockClient = new MockDropboxClient(email);
        const accountInfo = await mockClient.usersGetCurrentAccount();
        const spaceUsage = await mockClient.usersGetSpaceUsage();
        
        userDropboxClients.set(socket.id, mockClient);
        
        socket.emit('dropbox-connected', {
          name: accountInfo.result.name.display_name,
          email: accountInfo.result.email,
          used: spaceUsage.result.used,
          allocated: spaceUsage.result.allocation.allocated,
          usedFormatted: (spaceUsage.result.used / 1024 / 1024 / 1024).toFixed(2) + ' GB',
          allocatedFormatted: (spaceUsage.result.allocation.allocated / 1024 / 1024 / 1024).toFixed(2) + ' GB',
          token: simulatedToken
        });
      } else {
        socket.emit('dropbox-error', { error: '邮箱或密码错误，请使用演示账户：demo@example.com / demo123' });
      }
    } catch (error) {
      console.error('账号密码登录失败:', error);
      socket.emit('dropbox-error', { error: '登录失败: ' + error.message });
    }
  });

  // 初始化上传会话
  socket.on('init-upload', async (data) => {
    try {
      const dbx = userDropboxClients.get(socket.id);
      if (!dbx) {
        socket.emit('upload-error', { error: '请先连接到 Dropbox' });
        return;
      }

      const { fileName, fileSize, chunkSize } = data;
      const sessionId = crypto.randomUUID();
      
      const session = {
        sessionId,
        fileName,
        fileSize,
        chunkSize,
        uploadedChunks: new Map(),
        totalChunks: Math.ceil(fileSize / chunkSize),
        startTime: Date.now(),
        uploadedBytes: 0
      };
      
      uploadSessions.set(sessionId, session);
      
      socket.emit('upload-initialized', {
        sessionId,
        totalChunks: session.totalChunks
      });
    } catch (error) {
      console.error('初始化上传失败:', error);
      socket.emit('upload-error', { error: '初始化上传失败: ' + error.message });
    }
  });

  // 处理文件块上传
  socket.on('upload-chunk', async (data) => {
    try {
      const { sessionId, chunkIndex, chunkData } = data;
      const session = uploadSessions.get(sessionId);
      
      if (!session) {
        socket.emit('upload-error', { error: '会话不存在' });
        return;
      }

      const buffer = Buffer.from(chunkData, 'base64');
      session.uploadedChunks.set(chunkIndex, buffer);
      session.uploadedBytes += buffer.length;
      
      const elapsed = Math.max((Date.now() - session.startTime) / 1000, 0.1);
      const currentSpeed = (session.uploadedBytes / elapsed / 1024 / 1024).toFixed(2);
      const progress = (session.uploadedChunks.size / session.totalChunks) * 100;
      
      socket.emit('chunk-uploaded', {
        chunkIndex,
        progress: Math.round(progress),
        speed: currentSpeed + ' MB/s',
        uploadedChunks: session.uploadedChunks.size,
        totalChunks: session.totalChunks
      });

      if (session.uploadedChunks.size === session.totalChunks) {
        await uploadToDropbox(session, socket);
      }
    } catch (error) {
      console.error('上传块失败:', error);
      socket.emit('upload-error', { error: error.message });
    }
  });

  socket.on('disconnect', () => {
    console.log('客户端断开连接:', socket.id);
    userDropboxClients.delete(socket.id);
  });
});

// 上传到 Dropbox
async function uploadToDropbox(session, socket) {
  try {
    const dbx = userDropboxClients.get(socket.id);
    if (!dbx) {
      socket.emit('upload-error', { error: '请先连接到 Dropbox' });
      return;
    }

    socket.emit('upload-status', { message: '正在上传到 Dropbox...' });
    
    const chunks = [];
    for (let i = 0; i < session.totalChunks; i++) {
      chunks.push(session.uploadedChunks.get(i));
    }
    const fileBuffer = Buffer.concat(chunks);
    
    const uploadResult = await dbx.filesUpload({
      path: '/' + session.fileName,
      contents: fileBuffer,
      mode: 'add',
      autorename: true
    });
    
    const totalTime = (Date.now() - session.startTime) / 1000;
    
    socket.emit('upload-complete', {
      fileName: uploadResult.result.name,
      fileSize: session.fileSize,
      totalTime,
      averageSpeed: (session.fileSize / totalTime / 1024 / 1024).toFixed(2) + ' MB/s',
      dropboxPath: uploadResult.result.path_lower
    });
    
    uploadSessions.delete(session.sessionId);
  } catch (error) {
    console.error('Dropbox 上传失败:', error);
    socket.emit('upload-error', { error: 'Dropbox 上传失败: ' + error.message });
  }
}

// 模拟 Dropbox 登录
async function simulateDropboxLogin(email, password) {
  const demoAccounts = {
    'demo@example.com': 'demo123',
    'test@dropbox.com': 'test123',
    'user@example.com': 'password123'
  };
  
  if (demoAccounts[email] === password) {
    return 'DEMO_TOKEN_' + Buffer.from(email).toString('base64');
  }
  
  return null;
}

// 模拟 Dropbox 客户端
class MockDropboxClient {
  constructor(email) {
    this.email = email;
    this.userData = mockDropboxData[email] || mockDropboxData['demo@example.com'];
  }

  async usersGetCurrentAccount() {
    return {
      result: {
        name: { display_name: this.userData.name },
        email: this.userData.email
      }
    };
  }

  async usersGetSpaceUsage() {
    return {
      result: {
        used: this.userData.used,
        allocation: { allocated: this.userData.allocated }
      }
    };
  }

  async filesUpload(params) {
    await new Promise(resolve => setTimeout(resolve, 100));
    
    const fileId = 'file_' + Date.now();
    const fileName = params.path.replace('/', '');
    const fileSize = params.contents.length;
    
    const newFile = {
      id: fileId,
      name: fileName,
      size: fileSize,
      uploadTime: new Date().toISOString(),
      path: params.path.toLowerCase(),
      contents: params.contents
    };
    
    this.userData.files.push(newFile);
    this.userData.used += fileSize;
    
    return {
      result: {
        name: fileName,
        path_lower: params.path.toLowerCase(),
        size: fileSize
      }
    };
  }
}

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`🚀 服务器运行在 http://localhost:${PORT}`);
  console.log(`☁️  Dropbox 高速上传器已启动`);
  console.log(`🎯 演示账户: demo@example.com / demo123`);
});
