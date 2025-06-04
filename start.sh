#!/bin/bash

# 创建虚拟环境并安装后端依赖
echo "正在配置后端环境..."
cd "$(dirname "$0")/dietlens-backend"
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt

# 初始化数据库
echo "正在初始化数据库..."
python init_db.py

# 启动后端服务
echo "正在启动后端服务..."
cd src
python main.py &
BACKEND_PID=$!
cd ..

# 等待后端服务启动
echo "等待后端服务启动..."
sleep 5

# 安装前端依赖并启动前端服务
echo "正在配置前端环境..."
cd ../dietlens-frontend
npm install

# 启动前端服务
echo "正在启动前端服务..."
npm run dev &
FRONTEND_PID=$!

echo "DietLens 应用已启动!"
echo "前端服务运行在: http://localhost:3000"
echo "后端服务运行在: http://localhost:5000"
echo "按 Ctrl+C 停止所有服务"

# 捕获中断信号，清理进程
trap "kill $BACKEND_PID $FRONTEND_PID; exit" INT
wait
