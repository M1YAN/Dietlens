# DietLens 后端使用文档

## 目录

1. [项目概述](#项目概述)
2. [环境要求](#环境要求)
3. [项目结构](#项目结构)
4. [安装与配置](#安装与配置)
5. [数据库初始化](#数据库初始化)
6. [API接口文档](#API接口文档)
   - [用户认证](#用户认证)
   - [食物识别](#食物识别)
   - [社区功能](#社区功能)
   - [食物搜索](#食物搜索)
   - [营养目标管理](#营养目标管理)
7. [OpenAI API集成](#OpenAI-API集成)
8. [文件上传与存储](#文件上传与存储)
9. [测试数据说明](#测试数据说明)
10. [常见问题](#常见问题)
11. [部署指南](#部署指南)

## 项目概述

DietLens是一个智能食物识别和营养管理平台，主要功能包括：

- **智能食物识别**：上传食物图片，使用OpenAI多模态API分析图片中食物的营养和能量
- **DietLens社区**：用户和营养专家能够在社区中发表图文帖子
- **手动搜索食物**：通过食物名称查询食物的营养成分和能量等信息
- **查看今日营养目标**：为用户维护营养数据库，将每日摄入情况展示出来

本文档详细介绍了DietLens后端的安装、配置和使用方法，以及各API接口的详细说明。

## 环境要求

- Python 3.8+
- MySQL 5.7+
- Flask 2.0+
- 其他依赖见`requirements.txt`

## 项目结构

```
dietlens/
├── src/                      # 源代码目录
│   ├── config/               # 配置文件
│   ├── models/               # 数据库模型
│   ├── routes/               # API路由
│   ├── static/               # 静态文件
│   ├── utils/                # 工具类
│   └── main.py               # 应用入口
├── venv/                     # 虚拟环境
├── init_db.py                # 数据库初始化脚本
├── requirements.txt          # 项目依赖
└── README.md                 # 项目说明
```

## 安装与配置

1. 克隆项目并进入项目目录

```bash
git clone https://github.com/your-repo/dietlens.git
cd dietlens
```

2. 创建并激活虚拟环境

```bash
python -m venv venv
source venv/bin/activate  # Linux/Mac
# 或
venv\Scripts\activate     # Windows
```

3. 安装依赖

```bash
pip install -r requirements.txt
```

4. 配置环境变量

创建`.env`文件，并设置以下环境变量：

```
DB_USERNAME=your_db_username
DB_PASSWORD=your_db_password
DB_HOST=localhost
DB_PORT=3306
DB_NAME=dietlens
OPENAI_API_KEY=your_openai_api_key
JWT_SECRET_KEY=your_jwt_secret_key
```

## 数据库初始化

1. 确保MySQL服务已启动，并创建数据库

```sql
CREATE DATABASE dietlens CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

2. 运行初始化脚本

```bash
python init_db.py
```

该脚本将：
- 创建所有数据库表
- 创建必要的上传目录
- 生成测试数据（包括测试用户、食物分类、食物数据等）

## API接口文档

### 用户认证

#### 注册用户

- **URL**: `/api/auth/register`
- **方法**: `POST`
- **请求体**:
  ```json
  {
    "username": "testuser",
    "email": "test@example.com",
    "password": "password123"
  }
  ```
- **成功响应** (201):
  ```json
  {
    "status": 201,
    "message": "注册成功",
    "data": {
      "userId": "user_abc123",
      "username": "testuser",
      "email": "test@example.com",
      "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
    }
  }
  ```

#### 用户登录

- **URL**: `/api/auth/login`
- **方法**: `POST`
- **请求体**:
  ```json
  {
    "username": "testuser",
    "password": "password123"
  }
  ```
- **成功响应** (200):
  ```json
  {
    "status": 200,
    "message": "登录成功",
    "data": {
      "userId": "user_abc123",
      "username": "testuser",
      "email": "test@example.com",
      "isExpert": false,
      "avatar": "https://example.com/avatar.jpg",
      "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
    }
  }
  ```

#### 获取用户个人资料

- **URL**: `/api/auth/profile`
- **方法**: `GET`
- **请求头**: `Authorization: Bearer {token}`
- **成功响应** (200):
  ```json
  {
    "status": 200,
    "message": "获取成功",
    "data": {
      "userId": "user_abc123",
      "username": "testuser",
      "email": "test@example.com",
      "avatar": "https://example.com/avatar.jpg",
      "isExpert": false,
      "bio": "这是我的个人简介",
      "joinDate": "2023-01-01T12:00:00Z",
      "lastLogin": "2023-05-15T08:30:00Z"
    }
  }
  ```

#### 更新用户个人资料

- **URL**: `/api/auth/profile`
- **方法**: `PUT`
- **请求头**: `Authorization: Bearer {token}`
- **请求体**:
  ```json
  {
    "username": "newusername",
    "email": "newemail@example.com",
    "avatar": "https://example.com/new-avatar.jpg",
    "bio": "这是我更新后的个人简介"
  }
  ```
- **成功响应** (200):
  ```json
  {
    "status": 200,
    "message": "更新成功",
    "data": {
      "userId": "user_abc123",
      "username": "newusername",
      "email": "newemail@example.com",
      "avatar": "https://example.com/new-avatar.jpg",
      "isExpert": false,
      "bio": "这是我更新后的个人简介"
    }
  }
  ```

#### 修改密码

- **URL**: `/api/auth/change-password`
- **方法**: `POST`
- **请求头**: `Authorization: Bearer {token}`
- **请求体**:
  ```json
  {
    "oldPassword": "password123",
    "newPassword": "newpassword456"
  }
  ```
- **成功响应** (200):
  ```json
  {
    "status": 200,
    "message": "密码修改成功"
  }
  ```

### 食物识别

#### 上传并识别食物图片

- **URL**: `/api/food-recognition/recognize`
- **方法**: `POST`
- **请求头**: `Content-Type: multipart/form-data`
- **请求参数**:
  - `image`: 食物图片文件
  - `userId`: 用户ID (可选)
- **成功响应** (200):
  ```json
  {
    "status": 200,
    "message": "识别成功",
    "data": {
      "recognitionId": "rec_abc123",
      "foods": [
        {
          "name": "苹果",
          "amount": "1个",
          "weight": 182,
          "calories": 95,
          "protein": 0.5,
          "carbs": 25.1,
          "fat": 0.3,
          "fiber": 4.4,
          "confidence": 0.95,
          "foodId": "food_3001"
        }
      ],
      "imageUrl": "/uploads/recognition/food_image_123.jpg",
      "timestamp": "2023-05-15T08:30:00Z"
    }
  }
  ```

#### 获取历史识别记录

- **URL**: `/api/food-recognition/history`
- **方法**: `GET`
- **请求参数**:
  - `userId`: 用户ID
  - `page`: 页码 (默认1)
  - `limit`: 每页数量 (默认10)
- **成功响应** (200):
  ```json
  {
    "status": 200,
    "message": "获取成功",
    "data": {
      "total": 25,
      "totalPages": 3,
      "currentPage": 1,
      "records": [
        {
          "recognitionId": "rec_abc123",
          "foods": [
            {
              "name": "苹果",
              "amount": "1个",
              "calories": 95
            }
          ],
          "imageUrl": "/uploads/recognition/food_image_123.jpg",
          "timestamp": "2023-05-15T08:30:00Z"
        },
        // 更多记录...
      ]
    }
  }
  ```

#### 获取识别详情

- **URL**: `/api/food-recognition/detail/{recognitionId}`
- **方法**: `GET`
- **成功响应** (200):
  ```json
  {
    "status": 200,
    "message": "获取成功",
    "data": {
      "recognitionId": "rec_abc123",
      "userId": "user_abc123",
      "foods": [
        {
          "name": "苹果",
          "amount": "1个",
          "weight": 182,
          "calories": 95,
          "protein": 0.5,
          "carbs": 25.1,
          "fat": 0.3,
          "fiber": 4.4,
          "confidence": 0.95,
          "foodId": "food_3001"
        }
      ],
      "imageUrl": "/uploads/recognition/food_image_123.jpg",
      "timestamp": "2023-05-15T08:30:00Z"
    }
  }
  ```

### 社区功能

#### 获取帖子列表

- **URL**: `/api/community/posts`
- **方法**: `GET`
- **请求参数**:
  - `page`: 页码 (默认1)
  - `limit`: 每页数量 (默认10)
  - `category`: 分类 (可选)
  - `tag`: 标签 (可选)
  - `userId`: 用户ID (可选，获取特定用户的帖子)
  - `expertOnly`: 是否只显示专家帖子 (可选，默认false)
- **成功响应** (200):
  ```json
  {
    "status": 200,
    "message": "获取成功",
    "data": {
      "total": 50,
      "totalPages": 5,
      "currentPage": 1,
      "posts": [
        {
          "postId": "post_abc123",
          "title": "健康早餐的5个建议",
          "summary": "本文介绍了5个健康早餐的建议...",
          "coverImage": "/uploads/community/cover_123.jpg",
          "author": {
            "userId": "user_expert001",
            "username": "expertuser",
            "isExpert": true,
            "expertTitle": "注册营养师",
            "avatar": "https://example.com/avatar.jpg"
          },
          "category": "nutrition",
          "tags": ["早餐", "健康饮食"],
          "likes": 120,
          "comments": 15,
          "createdAt": "2023-05-10T08:30:00Z"
        },
        // 更多帖子...
      ]
    }
  }
  ```

#### 获取帖子详情

- **URL**: `/api/community/posts/{postId}`
- **方法**: `GET`
- **成功响应** (200):
  ```json
  {
    "status": 200,
    "message": "获取成功",
    "data": {
      "postId": "post_abc123",
      "title": "健康早餐的5个建议",
      "content": "# 健康早餐的5个建议\n\n早餐是一天中最重要的一餐...",
      "contentHtml": "<h1>健康早餐的5个建议</h1><p>早餐是一天中最重要的一餐...</p>",
      "images": [
        "/uploads/community/image1_123.jpg",
        "/uploads/community/image2_123.jpg"
      ],
      "author": {
        "userId": "user_expert001",
        "username": "expertuser",
        "isExpert": true,
        "expertTitle": "注册营养师",
        "avatar": "https://example.com/avatar.jpg",
        "bio": "拥有10年临床营养咨询经验"
      },
      "category": "nutrition",
      "tags": ["早餐", "健康饮食"],
      "likes": 120,
      "isLiked": false,
      "createdAt": "2023-05-10T08:30:00Z",
      "updatedAt": "2023-05-11T10:15:00Z"
    }
  }
  ```

#### 创建帖子

- **URL**: `/api/community/posts`
- **方法**: `POST`
- **请求头**: 
  - `Content-Type: multipart/form-data`
  - `Authorization: Bearer {token}`
- **请求参数**:
  - `title`: 帖子标题
  - `content`: 帖子内容 (Markdown格式)
  - `category`: 分类
  - `tags`: 标签 (JSON数组字符串)
  - `coverImage`: 封面图片文件 (可选)
  - `images[]`: 内容图片文件 (可选，可多个)
- **成功响应** (201):
  ```json
  {
    "status": 201,
    "message": "创建成功",
    "data": {
      "postId": "post_def456",
      "title": "我的减肥经历分享",
      "summary": "本文分享了我的减肥经历和一些实用技巧...",
      "coverImage": "/uploads/community/cover_456.jpg",
      "author": {
        "userId": "user_abc123",
        "username": "testuser",
        "isExpert": false,
        "avatar": "https://example.com/avatar.jpg"
      },
      "category": "weight-loss",
      "tags": ["减肥", "经验分享"],
      "createdAt": "2023-05-15T14:20:00Z"
    }
  }
  ```

#### 获取评论列表

- **URL**: `/api/community/posts/{postId}/comments`
- **方法**: `GET`
- **请求参数**:
  - `page`: 页码 (默认1)
  - `limit`: 每页数量 (默认20)
- **成功响应** (200):
  ```json
  {
    "status": 200,
    "message": "获取成功",
    "data": {
      "total": 15,
      "totalPages": 1,
      "currentPage": 1,
      "comments": [
        {
          "commentId": "comment_abc123",
          "content": "非常实用的建议，谢谢分享！",
          "author": {
            "userId": "user_xyz789",
            "username": "user123",
            "isExpert": false,
            "avatar": "https://example.com/avatar2.jpg"
          },
          "likes": 5,
          "isLiked": false,
          "createdAt": "2023-05-12T09:45:00Z"
        },
        // 更多评论...
      ]
    }
  }
  ```

#### 添加评论

- **URL**: `/api/community/posts/{postId}/comments`
- **方法**: `POST`
- **请求头**: `Authorization: Bearer {token}`
- **请求体**:
  ```json
  {
    "content": "这篇文章很有帮助，感谢分享！"
  }
  ```
- **成功响应** (201):
  ```json
  {
    "status": 201,
    "message": "评论成功",
    "data": {
      "commentId": "comment_ghi789",
      "content": "这篇文章很有帮助，感谢分享！",
      "author": {
        "userId": "user_abc123",
        "username": "testuser",
        "isExpert": false,
        "avatar": "https://example.com/avatar.jpg"
      },
      "createdAt": "2023-05-15T15:30:00Z"
    }
  }
  ```

#### 点赞/取消点赞帖子

- **URL**: `/api/community/posts/{postId}/like`
- **方法**: `POST`
- **请求头**: `Authorization: Bearer {token}`
- **请求体**:
  ```json
  {
    "action": "like"  // 或 "unlike"
  }
  ```
- **成功响应** (200):
  ```json
  {
    "status": 200,
    "message": "操作成功",
    "data": {
      "postId": "post_abc123",
      "likes": 121,
      "isLiked": true
    }
  }
  ```

### 食物搜索

#### 搜索食物

- **URL**: `/api/food-search/search`
- **方法**: `GET`
- **请求参数**:
  - `query`: 搜索关键词 (可选)
  - `category`: 分类 (可选)
  - `page`: 页码 (默认1)
  - `limit`: 每页数量 (默认20)
  - `sort`: 排序方式 (可选，默认relevance，可选值：relevance, calories_asc, calories_desc, name_asc, name_desc)
  - `userId`: 用户ID (可选)
- **成功响应** (200):
  ```json
  {
    "status": 200,
    "message": "搜索成功",
    "data": {
      "total": 150,
      "totalPages": 8,
      "currentPage": 1,
      "foods": [
        {
          "id": "food_3001",
          "name": "苹果",
          "category": "fruits",
          "categoryName": "水果类",
          "calories": 52,
          "protein": 0.3,
          "carbs": 13.8,
          "fat": 0.2,
          "fiber": 2.4,
          "servingSize": "100克",
          "imageUrl": "https://example.com/apple.jpg",
          "isFavorite": false
        },
        // 更多食物...
      ]
    }
  }
  ```

#### 获取食物详情

- **URL**: `/api/food-search/foods/{foodId}`
- **方法**: `GET`
- **请求参数**:
  - `userId`: 用户ID (可选)
- **成功响应** (200):
  ```json
  {
    "status": 200,
    "message": "获取成功",
    "data": {
      "id": "food_3001",
      "name": "苹果",
      "category": "fruits",
      "categoryName": "水果类",
      "description": "苹果是常见水果，富含膳食纤维、维生素C和抗氧化物质。",
      "nutrition": {
        "calories": 52,
        "protein": 0.3,
        "carbs": 13.8,
        "fat": 0.2,
        "fiber": 2.4,
        "sugar": 10.4,
        "sodium": 1,
        "potassium": 107,
        "vitaminA": 3,
        "vitaminC": 4.6,
        "calcium": 6,
        "iron": 0.1
      },
      "servingSizes": [
        {
          "name": "100克",
          "weight": 100,
          "isDefault": true
        },
        {
          "name": "1个中等大小",
          "weight": 182,
          "isDefault": false
        }
      ],
      "imageUrl": "https://example.com/apple.jpg",
      "tags": ["水果", "低热量", "高纤维"],
      "popularity": 85,
      "isFavorite": false
    }
  }
  ```

#### 获取食物分类列表

- **URL**: `/api/food-search/categories`
- **方法**: `GET`
- **请求参数**:
  - `includeCount`: 是否包含食物数量 (可选，默认false)
- **成功响应** (200):
  ```json
  {
    "status": 200,
    "message": "获取成功",
    "data": {
      "categories": [
        {
          "id": "grains",
          "name": "谷物类",
          "description": "包括各种米、面、麦等谷物及其制品",
          "imageUrl": "https://example.com/grains.jpg",
          "count": 45
        },
        // 更多分类...
      ]
    }
  }
  ```

#### 获取分类下的食物

- **URL**: `/api/food-search/categories/{categoryId}/foods`
- **方法**: `GET`
- **请求参数**:
  - `page`: 页码 (默认1)
  - `limit`: 每页数量 (默认20)
  - `sort`: 排序方式 (可选，默认name_asc，可选值：name_asc, name_desc, calories_asc, calories_desc, popularity)
  - `userId`: 用户ID (可选)
- **成功响应** (200):
  ```json
  {
    "status": 200,
    "message": "获取成功",
    "data": {
      "category": {
        "id": "fruits",
        "name": "水果类",
        "description": "各种新鲜或加工的水果"
      },
      "total": 35,
      "totalPages": 2,
      "currentPage": 1,
      "foods": [
        {
          "id": "food_3001",
          "name": "苹果",
          "calories": 52,
          "protein": 0.3,
          "carbs": 13.8,
          "fat": 0.2,
          "fiber": 2.4,
          "servingSize": "100克",
          "imageUrl": "https://example.com/apple.jpg"
        },
        // 更多食物...
      ]
    }
  }
  ```

#### 获取热门食物

- **URL**: `/api/food-search/popular`
- **方法**: `GET`
- **请求参数**:
  - `limit`: 数量 (默认10)
  - `userId`: 用户ID (可选)
- **成功响应** (200):
  ```json
  {
    "status": 200,
    "message": "获取成功",
    "data": {
      "foods": [
        {
          "id": "food_4001",
          "name": "鸡胸肉",
          "category": "protein",
          "categoryName": "蛋白质类",
          "calories": 165,
          "protein": 31,
          "carbs": 0,
          "fat": 3.6,
          "servingSize": "100克",
          "imageUrl": "https://example.com/chicken_breast.jpg",
          "isFavorite": true
        },
        // 更多食物...
      ]
    }
  }
  ```

#### 添加/移除收藏食物

- **URL**: `/api/food-search/favorites`
- **方法**: `POST`
- **请求体**:
  ```json
  {
    "userId": "user_abc123",
    "foodId": "food_3001",
    "action": "add"  // 或 "remove"
  }
  ```
- **成功响应** (200):
  ```json
  {
    "status": 200,
    "message": "操作成功",
    "data": {
      "foodId": "food_3001",
      "isFavorite": true
    }
  }
  ```

#### 获取收藏的食物

- **URL**: `/api/food-search/favorites`
- **方法**: `GET`
- **请求参数**:
  - `userId`: 用户ID
  - `page`: 页码 (默认1)
  - `limit`: 每页数量 (默认20)
- **成功响应** (200):
  ```json
  {
    "status": 200,
    "message": "获取成功",
    "data": {
      "total": 12,
      "totalPages": 1,
      "currentPage": 1,
      "foods": [
        {
          "id": "food_4001",
          "name": "鸡胸肉",
          "category": "protein",
          "categoryName": "蛋白质类",
          "calories": 165,
          "protein": 31,
          "carbs": 0,
          "fat": 3.6,
          "fiber": 0,
          "servingSize": "100克",
          "imageUrl": "https://example.com/chicken_breast.jpg",
          "addedAt": "2023-05-01T10:30:00Z"
        },
        // 更多食物...
      ]
    }
  }
  ```

#### 添加自定义食物

- **URL**: `/api/food-search/custom`
- **方法**: `POST`
- **请求头**: `Content-Type: multipart/form-data`
- **请求参数**:
  - `name`: 食物名称
  - `category`: 分类ID
  - `calories`: 热量
  - `protein`: 蛋白质 (可选)
  - `carbs`: 碳水化合物 (可选)
  - `fat`: 脂肪 (可选)
  - `fiber`: 膳食纤维 (可选)
  - `sugar`: 糖 (可选)
  - `sodium`: 钠 (可选)
  - `servingSize`: 份量名称
  - `servingWeight`: 份量重量
  - `description`: 描述 (可选)
  - `image`: 图片文件 (可选)
  - `userId`: 用户ID
- **成功响应** (201):
  ```json
  {
    "status": 201,
    "message": "创建成功",
    "data": {
      "id": "custom_user_abc123_12345678",
      "name": "自制沙拉",
      "category": "vegetables",
      "categoryName": "蔬菜类",
      "isCustom": true,
      "nutrition": {
        "calories": 120,
        "protein": 3,
        "carbs": 15,
        "fat": 5,
        "fiber": 4,
        "sugar": 3,
        "sodium": 50
      },
      "servingSizes": [
        {
          "name": "1碗",
          "weight": 200,
          "isDefault": true
        }
      ],
      "imageUrl": "/uploads/custom/custom_user_abc123_12345678_salad.jpg",
      "createdAt": "2023-05-15T16:45:00Z"
    }
  }
  ```

### 营养目标管理

#### 获取用户营养目标

- **URL**: `/api/nutrition-goals/goals`
- **方法**: `GET`
- **请求参数**:
  - `userId`: 用户ID
- **成功响应** (200):
  ```json
  {
    "status": 200,
    "message": "获取成功",
    "data": {
      "userId": "user_abc123",
      "goals": {
        "calories": 2000,
        "protein": 75,
        "carbs": 250,
        "fat": 65,
        "fiber": 25,
        "sugar": 50,
        "sodium": 2300
      },
      "macroRatio": {
        "protein": 15.0,
        "carbs": 50.0,
        "fat": 35.0
      },
      "lastUpdated": "2023-05-01T10:30:00Z"
    }
  }
  ```

#### 更新用户营养目标

- **URL**: `/api/nutrition-goals/goals`
- **方法**: `PUT`
- **请求体**:
  ```json
  {
    "userId": "user_abc123",
    "goals": {
      "calories": 1800,
      "protein": 90,
      "carbs": 200,
      "fat": 60,
      "fiber": 30,
      "sugar": 40,
      "sodium": 2000
    }
  }
  ```
- **成功响应** (200):
  ```json
  {
    "status": 200,
    "message": "更新成功",
    "data": {
      "userId": "user_abc123",
      "goals": {
        "calories": 1800,
        "protein": 90,
        "carbs": 200,
        "fat": 60,
        "fiber": 30,
        "sugar": 40,
        "sodium": 2000
      },
      "macroRatio": {
        "protein": 20.0,
        "carbs": 44.4,
        "fat": 35.6
      },
      "lastUpdated": "2023-05-15T17:00:00Z"
    }
  }
  ```

#### 获取用户个人信息

- **URL**: `/api/nutrition-goals/profile`
- **方法**: `GET`
- **请求参数**:
  - `userId`: 用户ID
- **成功响应** (200):
  ```json
  {
    "status": 200,
    "message": "获取成功",
    "data": {
      "userId": "user_abc123",
      "gender": "male",
      "age": 30,
      "height": 175,
      "weight": 70,
      "activityLevel": "moderate",
      "goal": "maintain",
      "dietaryRestrictions": ["none"],
      "lastUpdated": "2023-05-01T10:30:00Z"
    }
  }
  ```

#### 更新用户个人信息

- **URL**: `/api/nutrition-goals/profile`
- **方法**: `PUT`
- **请求体**:
  ```json
  {
    "userId": "user_abc123",
    "gender": "male",
    "age": 31,
    "height": 175,
    "weight": 68,
    "activityLevel": "active",
    "goal": "lose_weight",
    "dietaryRestrictions": ["vegetarian"]
  }
  ```
- **成功响应** (200):
  ```json
  {
    "status": 200,
    "message": "更新成功",
    "data": {
      "userId": "user_abc123",
      "gender": "male",
      "age": 31,
      "height": 175,
      "weight": 68,
      "activityLevel": "active",
      "goal": "lose_weight",
      "dietaryRestrictions": ["vegetarian"],
      "lastUpdated": "2023-05-15T17:15:00Z",
      "recommendedGoals": {
        "calories": 2200,
        "protein": 110,
        "carbs": 220,
        "fat": 73
      }
    }
  }
  ```

#### 获取每日营养摄入

- **URL**: `/api/nutrition-goals/daily-intake`
- **方法**: `GET`
- **请求参数**:
  - `userId`: 用户ID
  - `date`: 日期 (格式：YYYY-MM-DD，默认今天)
- **成功响应** (200):
  ```json
  {
    "status": 200,
    "message": "获取成功",
    "data": {
      "userId": "user_abc123",
      "date": "2023-05-15",
      "meals": [
        {
          "id": "meal_abc123",
          "name": "早餐",
          "time": "08:00",
          "foods": [
            {
              "id": "entry_abc123",
              "foodId": "food_3001",
              "name": "苹果",
              "amount": "1个",
              "weight": 182,
              "calories": 95,
              "protein": 0.5,
              "carbs": 25.1,
              "fat": 0.3,
              "fiber": 4.4
            },
            // 更多食物...
          ],
          "totals": {
            "calories": 350,
            "protein": 15,
            "carbs": 45,
            "fat": 10,
            "fiber": 6
          }
        },
        // 更多餐次...
      ],
      "totals": {
        "calories": 1650,
        "protein": 85,
        "carbs": 180,
        "fat": 55,
        "fiber": 22
      },
      "goals": {
        "calories": 1800,
        "protein": 90,
        "carbs": 200,
        "fat": 60,
        "fiber": 30
      },
      "percentages": {
        "calories": 91.7,
        "protein": 94.4,
        "carbs": 90.0,
        "fat": 91.7,
        "fiber": 73.3
      }
    }
  }
  ```

#### 添加食物到每日记录

- **URL**: `/api/nutrition-goals/daily-intake/add-food`
- **方法**: `POST`
- **请求体**:
  ```json
  {
    "userId": "user_abc123",
    "date": "2023-05-15",
    "mealId": "meal_abc123",
    "food": {
      "foodId": "food_4001",
      "weight": 120,
      "amount": "1块"
    }
  }
  ```
- **成功响应** (200):
  ```json
  {
    "status": 200,
    "message": "添加成功",
    "data": {
      "foodEntry": {
        "id": "entry_def456",
        "foodId": "food_4001",
        "name": "鸡胸肉",
        "amount": "1块",
        "weight": 120,
        "calories": 198,
        "protein": 37.2,
        "carbs": 0,
        "fat": 4.3,
        "fiber": 0
      },
      "mealTotals": {
        "calories": 548,
        "protein": 52.2,
        "carbs": 45,
        "fat": 14.3,
        "fiber": 6
      },
      "dailyTotals": {
        "calories": 1848,
        "protein": 122.2,
        "carbs": 180,
        "fat": 59.3,
        "fiber": 22
      },
      "percentages": {
        "calories": 102.7,
        "protein": 135.8,
        "carbs": 90.0,
        "fat": 98.8,
        "fiber": 73.3
      }
    }
  }
  ```

#### 创建新餐次

- **URL**: `/api/nutrition-goals/daily-intake/add-meal`
- **方法**: `POST`
- **请求体**:
  ```json
  {
    "userId": "user_abc123",
    "date": "2023-05-15",
    "meal": {
      "name": "下午茶",
      "time": "15:30"
    }
  }
  ```
- **成功响应** (201):
  ```json
  {
    "status": 201,
    "message": "创建成功",
    "data": {
      "meal": {
        "id": "meal_ghi789",
        "name": "下午茶",
        "time": "15:30",
        "foods": [],
        "totals": {
          "calories": 0,
          "protein": 0,
          "carbs": 0,
          "fat": 0,
          "fiber": 0
        }
      }
    }
  }
  ```

#### 删除食物记录

- **URL**: `/api/nutrition-goals/daily-intake/food/{foodEntryId}`
- **方法**: `DELETE`
- **请求参数**:
  - `userId`: 用户ID
- **成功响应** (200):
  ```json
  {
    "status": 200,
    "message": "删除成功",
    "data": {
      "mealId": "meal_abc123",
      "mealTotals": {
        "calories": 350,
        "protein": 15,
        "carbs": 45,
        "fat": 10,
        "fiber": 6
      },
      "dailyTotals": {
        "calories": 1650,
        "protein": 85,
        "carbs": 180,
        "fat": 55,
        "fiber": 22
      }
    }
  }
  ```

#### 获取营养摄入历史数据

- **URL**: `/api/nutrition-goals/history`
- **方法**: `GET`
- **请求参数**:
  - `userId`: 用户ID
  - `startDate`: 开始日期 (格式：YYYY-MM-DD)
  - `endDate`: 结束日期 (格式：YYYY-MM-DD)
  - `nutrient`: 营养素 (可选，默认所有)
- **成功响应** (200):
  ```json
  {
    "status": 200,
    "message": "获取成功",
    "data": {
      "userId": "user_abc123",
      "startDate": "2023-05-01",
      "endDate": "2023-05-15",
      "daily": [
        {
          "date": "2023-05-01",
          "calories": 1750,
          "protein": 88,
          "carbs": 190,
          "fat": 58,
          "goalAchieved": true
        },
        // 更多日期...
      ],
      "averages": {
        "calories": 1780,
        "protein": 87.5,
        "carbs": 195.2,
        "fat": 59.1
      },
      "goals": {
        "calories": 1800,
        "protein": 90,
        "carbs": 200,
        "fat": 60
      },
      "goalAchievementRate": {
        "calories": 86.7,
        "protein": 80.0,
        "carbs": 93.3,
        "fat": 86.7
      }
    }
  }
  ```

#### 获取营养建议

- **URL**: `/api/nutrition-goals/recommendations`
- **方法**: `GET`
- **请求参数**:
  - `userId`: 用户ID
  - `date`: 日期 (格式：YYYY-MM-DD，默认今天)
- **成功响应** (200):
  ```json
  {
    "status": 200,
    "message": "获取成功",
    "data": {
      "userId": "user_abc123",
      "date": "2023-05-15",
      "currentIntake": {
        "calories": 1650,
        "protein": 85,
        "carbs": 180,
        "fat": 55,
        "fiber": 22
      },
      "goals": {
        "calories": 1800,
        "protein": 90,
        "carbs": 200,
        "fat": 60,
        "fiber": 30
      },
      "gaps": {
        "calories": 150,
        "protein": 5,
        "carbs": 20,
        "fat": 5,
        "fiber": 8
      },
      "recommendations": [
        {
          "type": "protein",
          "message": "您的蛋白质摄入不足，建议增加瘦肉、鱼类、豆类或蛋类的摄入。",
          "suggestedFoods": [
            {
              "id": "food_4001",
              "name": "鸡胸肉",
              "servingSize": "100克",
              "protein": 31,
              "calories": 165
            },
            {
              "id": "food_4002",
              "name": "金枪鱼",
              "servingSize": "100克",
              "protein": 29,
              "calories": 184
            }
          ]
        },
        // 更多建议...
      ],
      "mealSuggestions": {
        "dinner": {
          "name": "建议晚餐",
          "foods": [
            {
              "id": "food_4001",
              "name": "鸡胸肉",
              "amount": "150克",
              "calories": 247.5,
              "protein": 46.5
            },
            // 更多食物...
          ],
          "totals": {
            "calories": 450,
            "protein": 30,
            "carbs": 45,
            "fat": 15,
            "fiber": 8
          }
        }
      }
    }
  }
  ```

## OpenAI API集成

DietLens使用OpenAI的多模态API来分析食物图片，识别图片中的食物并提供营养信息。

### 配置OpenAI API

1. 在`.env`文件中设置OpenAI API密钥：

```
OPENAI_API_KEY=your_openai_api_key
```

2. 在`src/config/config.py`中配置OpenAI API模型：

```python
OPENAI_API_MODEL = "gpt-4-vision-preview"  # 或其他支持多模态的模型
```

### 食物识别流程

1. 用户上传食物图片到`/api/food-recognition/recognize`端点
2. 后端保存图片并调用OpenAI API进行分析
3. OpenAI API返回识别结果，包括食物名称、份量、重量和营养成分
4. 后端将结果保存到数据库并返回给前端

### 自定义OpenAI提示词

可以在`src/routes/openai_api.py`中修改提示词以优化识别效果：

```python
prompt = "请识别这张图片中的食物，并提供以下信息：\n1. 食物名称\n2. 大致份量（如1碗、2片等）\n3. 估计重量（克）\n4. 热量（千卡）\n5. 蛋白质（克）\n6. 碳水化合物（克）\n7. 脂肪（克）\n8. 膳食纤维（克）\n9. 识别置信度（0-1之间的小数）\n\n请以JSON格式返回"
```

## 文件上传与存储

DietLens支持多种文件上传功能，包括食物图片、社区帖子图片和自定义食物图片。

### 上传目录结构

```
uploads/
├── recognition/  # 食物识别图片
├── community/    # 社区帖子图片
├── custom/       # 自定义食物图片
└── temp/         # 临时文件
```

### 文件命名规则

- 食物识别图片：`recognition_{timestamp}_{userId}_{filename}`
- 社区帖子图片：`post_{postId}_{index}_{filename}`
- 自定义食物图片：`custom_{userId}_{foodId}_{filename}`

### 文件大小限制

- 食物图片：最大2MB
- 社区帖子封面图：最大2MB
- 社区帖子内容图：最大5MB，每篇帖子最多10张图片

## 测试数据说明

初始化脚本`init_db.py`会生成以下测试数据：

### 测试用户

1. 普通用户
   - 用户名：testuser
   - 密码：password123
   - 邮箱：test@example.com

2. 专家用户
   - 用户名：expertuser
   - 密码：password123
   - 邮箱：expert@example.com
   - 专家头衔：注册营养师

### 食物分类

- 谷物类 (grains)
- 蔬菜类 (vegetables)
- 水果类 (fruits)
- 蛋白质类 (protein)
- 乳制品类 (dairy)
- 油脂类 (fats)

### 基础食物

- 白米饭 (food_1001)
- 西兰花 (food_2001)
- 苹果 (food_3001)
- 鸡胸肉 (food_4001)
- 全脂牛奶 (food_5001)
- 橄榄油 (food_6001)

## 常见问题

### 1. 如何修改数据库连接信息？

在`.env`文件中修改以下环境变量：

```
DB_USERNAME=your_db_username
DB_PASSWORD=your_db_password
DB_HOST=localhost
DB_PORT=3306
DB_NAME=dietlens
```

### 2. 如何更新OpenAI API模型？

在`src/config/config.py`中修改`OPENAI_API_MODEL`变量：

```python
OPENAI_API_MODEL = "gpt-4-vision-preview"  # 或其他支持多模态的模型
```

### 3. 如何添加新的食物分类？

使用以下SQL语句添加新的食物分类：

```sql
INSERT INTO food_category (id, name, description, image_url) 
VALUES ('new_category_id', '新分类名称', '分类描述', 'https://example.com/category_image.jpg');
```

### 4. 如何修改JWT令牌过期时间？

在`src/routes/auth.py`中修改JWT令牌生成部分：

```python
token = jwt.encode(
    {
        'user_id': user.id,
        'exp': datetime.datetime.utcnow() + datetime.timedelta(hours=24)  # 修改这里的小时数
    },
    config['default'].JWT_SECRET_KEY,
    algorithm="HS256"
)
```

### 5. 上传图片失败怎么办？

检查以下几点：
- 确保上传目录存在且有写入权限
- 检查图片大小是否超过限制
- 确保图片格式为JPG、JPEG或PNG
- 检查服务器磁盘空间是否充足

## 部署指南

### 开发环境

1. 克隆项目并安装依赖
2. 配置`.env`文件
3. 初始化数据库：`python init_db.py`
4. 启动开发服务器：`python src/main.py`

### 生产环境

1. 使用Gunicorn作为WSGI服务器：

```bash
pip install gunicorn
gunicorn -w 4 -b 0.0.0.0:5000 src.main:app
```

2. 使用Nginx作为反向代理：

```nginx
server {
    listen 80;
    server_name your-domain.com;

    location / {
        proxy_pass http://127.0.0.1:5000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }

    location /uploads/ {
        alias /path/to/dietlens/uploads/;
    }
}
```

3. 使用Supervisor管理进程：

```ini
[program:dietlens]
command=/path/to/venv/bin/gunicorn -w 4 -b 0.0.0.0:5000 src.main:app
directory=/path/to/dietlens
user=www-data
autostart=true
autorestart=true
stderr_logfile=/var/log/dietlens/error.log
stdout_logfile=/var/log/dietlens/access.log
```

4. 设置定时备份：

```bash
# 添加到crontab
0 2 * * * /path/to/backup_script.sh
```

备份脚本示例：

```bash
#!/bin/bash
DATE=$(date +%Y%m%d)
BACKUP_DIR=/path/to/backups
mysqldump -u username -p password dietlens > $BACKUP_DIR/dietlens_$DATE.sql
tar -czf $BACKUP_DIR/uploads_$DATE.tar.gz /path/to/dietlens/uploads
```
