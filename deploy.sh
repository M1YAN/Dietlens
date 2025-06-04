#!/bin/bash

# 创建部署目录
mkdir -p dietlens-deploy
cp -r dietlens/* dietlens-deploy/

# 安装前端依赖
echo "正在安装前端依赖..."
cd dietlens-deploy/dietlens-frontend
npm install

# 构建前端项目
echo "正在构建前端项目..."
npm run build

# 将前端构建结果复制到后端静态目录
echo "正在复制前端构建结果到后端静态目录..."
mkdir -p ../dietlens-backend/src/static
cp -r out/* ../dietlens-backend/src/static/

echo "部署准备完成!"
echo "可以通过运行 dietlens-deploy/dietlens-backend/src/main.py 启动完整应用"
echo "应用将在 http://localhost:5000 上运行"
