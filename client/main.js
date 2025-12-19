class FileUploader {
    constructor() {
        this.socket = io();
        this.initializeElements();
        this.setupEventListeners();
    }

    initializeElements() {
        this.dropZone = document.getElementById('dropZone');
        this.fileInput = document.getElementById('fileInput');
        this.progressContainer = document.getElementById('progressContainer');
        this.progressFill = document.getElementById('progressFill');
        this.progressText = document.getElementById('progressText');
        this.successMessage = document.getElementById('successMessage');
    }

    setupEventListeners() {
        // 拖拽事件
        this.dropZone.addEventListener('dragover', (e) => {
            e.preventDefault();
            this.dropZone.style.borderColor = '#764ba2';
        });

        this.dropZone.addEventListener('dragleave', () => {
            this.dropZone.style.borderColor = '#667eea';
        });

        this.dropZone.addEventListener('drop', (e) => {
            e.preventDefault();
            this.dropZone.style.borderColor = '#667eea';
            const files = Array.from(e.dataTransfer.files);
            if (files.length > 0) {
                this.handleFile(files[0]);
            }
        });

        // 点击选择文件
        this.dropZone.addEventListener('click', () => {
            this.fileInput.click();
        });

        this.fileInput.addEventListener('change', (e) => {
            if (e.target.files.length > 0) {
                this.handleFile(e.target.files[0]);
            }
        });
    }

    handleFile(file) {
        console.log('选择文件:', file.name, file.size);
        
        this.progressContainer.style.display = 'block';
        this.successMessage.style.display = 'none';
        
        // 模拟上传进度
        let progress = 0;
        const interval = setInterval(() => {
            progress += 10;
            this.progressFill.style.width = progress + '%';
            this.progressText.textContent = `上传中... ${progress}%`;
            
            if (progress >= 100) {
                clearInterval(interval);
                this.showSuccess(file);
            }
        }, 200);
    }

    showSuccess(file) {
        this.progressContainer.style.display = 'none';
        this.successMessage.innerHTML = `
            <h3>✅ 上传成功！</h3>
            <p>文件: ${file.name}</p>
            <p>大小: ${this.formatFileSize(file.size)}</p>
        `;
        this.successMessage.style.display = 'block';
    }

    formatFileSize(bytes) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }
}

// 初始化
document.addEventListener('DOMContentLoaded', () => {
    new FileUploader();
});
