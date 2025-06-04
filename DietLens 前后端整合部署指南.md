# DietLens 前后端整合部署指南

## 项目概述

DietLens是一个智能饮食管理应用，主要功能包括：
- 智能食物识别：上传图片，使用大模型API分析图片中食物的营养和能量
- DietLens社区：用户和营养专家能够在社区中发表图文帖子
- 手动搜索食物：通过食物名称查询食物的营养成分和能量等信息
- 查看今日营养目标：为用户维护数据库，将每日摄入情况展示出来

本文档详细说明如何将前端和后端代码整合并部署运行。

## 系统要求

### 基本环境
- 操作系统：Linux, macOS 或 Windows
- Node.js: v16.0.0 或更高版本
- Python: 3.8 或更高版本
- MySQL: 5.7 或更高版本

### 后端依赖
- Flask 2.2.5
- SQLAlchemy 2.0.9
- Flask-SQLAlchemy 3.1.1
- PyJWT 2.6.0
- flask-cors 4.0.0
- 其他依赖详见 `requirements.txt`

### 前端依赖
- React 19.0.0
- Next.js 15.1.8
- 其他依赖详见 `package.json`

## 快速启动

我们提供了几个脚本来简化部署和运行过程：

1. **数据库初始化**：运行 `setup_db.sh` 脚本创建必要的数据库和用户
   ```bash
   ./setup_db.sh
   ```

2. **开发环境启动**：运行 `start.sh` 脚本同时启动前端和后端服务
   ```bash
   ./start.sh
   ```

3. **生产环境部署**：运行 `deploy.sh` 脚本构建前端并将其集成到后端
   ```bash
   ./deploy.sh
   ```

## 手动部署步骤

如果您需要手动部署，请按照以下步骤操作：

### 1. 数据库配置

```bash
# 创建数据库
mysql -u root -p
CREATE DATABASE dietlens;
CREATE USER 'dietlens'@'localhost' IDENTIFIED BY 'dietlens';
GRANT ALL PRIVILEGES ON dietlens.* TO 'dietlens'@'localhost';
FLUSH PRIVILEGES;
EXIT;
```

### 2. 后端配置

```bash
# 进入后端目录
cd dietlens-backend

# 创建虚拟环境
python -m venv venv
source venv/bin/activate  # Linux/macOS
# 或
venv\Scripts\activate  # Windows

# 安装依赖
pip install -r requirements.txt

# 初始化数据库
python init_db.py

# 启动后端服务
cd src
python main.py
```

后端服务将在 http://localhost:5000 上运行。

### 3. 前端配置

```bash
# 进入前端目录
cd dietlens-frontend

# 安装依赖
npm install

# 开发模式启动
npm run dev

# 或构建生产版本
npm run build
```

开发模式下，前端服务将在 http://localhost:3000 上运行。

## 整合说明

我们已经完成了前后端的整合工作，主要包括：

1. **前端API代理配置**：
   - 在 `next.config.js` 中配置了API代理，将所有 `/api/*` 请求转发到后端服务
   - 这样前端可以直接使用相对路径（如 `/api/food-recognition/analyze`）发起请求

2. **后端CORS配置**：
   - 在后端添加了CORS支持，允许前端跨域访问API
   - 通过 `flask-cors` 包实现，确保API请求不会被浏览器拦截

3. **统一启动脚本**：
   - 提供了 `start.sh` 脚本同时启动前后端服务
   - 提供了 `deploy.sh` 脚本用于生产环境部署

## 生产环境部署

对于生产环境，我们建议：

1. 使用 `deploy.sh` 脚本构建前端并集成到后端
2. 配置反向代理（如Nginx）指向后端服务
3. 使用生产级数据库（如MySQL）而非SQLite
4. 配置HTTPS以确保安全性
5. 使用进程管理工具（如Supervisor或PM2）管理后端服务

示例Nginx配置：

```nginx
server {
    listen 80;
    server_name yourdomain.com;

    location / {
        proxy_pass http://localhost:5000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

## 常见问题

### 1. 数据库连接失败

检查：
- MySQL服务是否运行
- 数据库用户名和密码是否正确
- 数据库名称是否正确

解决方案：
- 确认MySQL服务已启动
- 检查 `.env` 文件中的数据库配置
- 手动运行 `setup_db.sh` 脚本重新配置数据库

### 2. 前端无法连接后端API

检查：
- 后端服务是否正常运行
- 前端API代理配置是否正确
- 浏览器控制台是否有CORS错误

解决方案：
- 确认后端服务已启动并监听在正确端口
- 检查 `next.config.js` 中的代理配置
- 确认后端CORS配置正确

### 3. 图片上传失败

检查：
- 上传目录权限是否正确
- 文件大小是否超过限制

解决方案：
- 确保上传目录存在且有写入权限
- 检查后端配置中的文件大小限制

