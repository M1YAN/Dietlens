#!/bin/bash

# 检查MySQL是否安装
if ! command -v mysql &> /dev/null; then
    echo "MySQL未安装，正在安装..."
    sudo apt-get update
    sudo apt-get install -y mysql-server
    sudo systemctl start mysql
    sudo systemctl enable mysql
fi

# 创建MySQL数据库
echo "正在创建MySQL数据库..."
sudo mysql -e "CREATE DATABASE IF NOT EXISTS dietlens;"
sudo mysql -e "CREATE USER IF NOT EXISTS 'dietlens'@'localhost' IDENTIFIED BY 'dietlens';"
sudo mysql -e "GRANT ALL PRIVILEGES ON dietlens.* TO 'dietlens'@'localhost';"
sudo mysql -e "FLUSH PRIVILEGES;"

echo "数据库创建完成!"
