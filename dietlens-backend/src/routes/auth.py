from flask import Blueprint, request, jsonify
import jwt
import datetime
from functools import wraps

from src.models import db, User
from src.config.config import config

auth_bp = Blueprint('auth', __name__)

# 辅助函数：生成标准响应格式
def make_response(status, message, data=None, error=None):
    response = {
        "status": status,
        "message": message
    }
    if data is not None:
        response["data"] = data
    if error is not None:
        response["error"] = error
    return jsonify(response)

# 装饰器：验证Token
def token_required(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        token = None
        
        # 从请求头中获取token
        if 'Authorization' in request.headers:
            auth_header = request.headers['Authorization']
            if auth_header.startswith('Bearer '):
                token = auth_header.split(' ')[1]
        
        if not token:
            return make_response(401, "缺少认证Token", error="MISSING_TOKEN")
        
        try:
            # 解码token
            data = jwt.decode(token, config['default'].JWT_SECRET_KEY, algorithms=["HS256"])
            current_user = User.query.get(data['user_id'])
            
            if not current_user:
                return make_response(401, "无效的用户", error="INVALID_USER")
            
        except jwt.ExpiredSignatureError:
            return make_response(401, "Token已过期", error="TOKEN_EXPIRED")
        except jwt.InvalidTokenError:
            return make_response(401, "无效的Token", error="INVALID_TOKEN")
        
        return f(current_user, *args, **kwargs)
    
    return decorated

@auth_bp.route('/register', methods=['POST'])
def register():
    """用户注册"""
    data = request.json
    
    if not data or 'username' not in data or 'email' not in data or 'password' not in data:
        return make_response(400, "请求参数不完整", error="INVALID_REQUEST")
    
    username = data['username']
    email = data['email']
    password = data['password']
    
    # 检查用户名是否已存在
    if User.query.filter_by(username=username).first():
        return make_response(400, "用户名已存在", error="USERNAME_EXISTS")
    
    # 检查邮箱是否已存在
    if User.query.filter_by(email=email).first():
        return make_response(400, "邮箱已存在", error="EMAIL_EXISTS")
    
    try:
        # 创建新用户
        import uuid
        from werkzeug.security import generate_password_hash
        
        user = User(
            id=f"user_{str(uuid.uuid4())[:8]}",
            username=username,
            email=email,
            password_hash=generate_password_hash(password),
            join_date=datetime.datetime.utcnow()
        )
        db.session.add(user)
        db.session.commit()
        
        # 生成Token
        token = jwt.encode(
            {
                'user_id': user.id,
                'exp': datetime.datetime.utcnow() + datetime.timedelta(hours=24)
            },
            config['default'].JWT_SECRET_KEY,
            algorithm="HS256"
        )
        
        # 构建响应数据
        response_data = {
            "userId": user.id,
            "username": user.username,
            "email": user.email,
            "token": token
        }
        
        return make_response(201, "注册成功", data=response_data)
        
    except Exception as e:
        db.session.rollback()
        print(f"Error in user registration: {str(e)}")
        return make_response(500, "注册失败", error="REGISTRATION_FAILED")

@auth_bp.route('/login', methods=['POST'])
def login():
    """用户登录"""
    data = request.json
    
    if not data or 'username' not in data or 'password' not in data:
        return make_response(400, "请求参数不完整", error="INVALID_REQUEST")
    
    username = data['username']
    password = data['password']
    
    try:
        # 查找用户
        user = User.query.filter_by(username=username).first()
        
        if not user:
            return make_response(401, "用户名或密码错误", error="INVALID_CREDENTIALS")
        
        # 验证密码
        from werkzeug.security import check_password_hash
        
        if not check_password_hash(user.password_hash, password):
            return make_response(401, "用户名或密码错误", error="INVALID_CREDENTIALS")
        
        # 更新最后登录时间
        user.last_login = datetime.datetime.utcnow()
        db.session.commit()
        
        # 生成Token
        token = jwt.encode(
            {
                'user_id': user.id,
                'exp': datetime.datetime.utcnow() + datetime.timedelta(hours=24)
            },
            config['default'].JWT_SECRET_KEY,
            algorithm="HS256"
        )
        
        # 构建响应数据
        response_data = {
            "userId": user.id,
            "username": user.username,
            "email": user.email,
            "isExpert": user.is_expert,
            "avatar": user.avatar,
            "token": token
        }
        
        return make_response(200, "登录成功", data=response_data)
        
    except Exception as e:
        print(f"Error in user login: {str(e)}")
        return make_response(500, "登录失败", error="LOGIN_FAILED")

@auth_bp.route('/profile', methods=['GET'])
@token_required
def get_profile(current_user):
    """获取用户个人资料"""
    try:
        # 构建响应数据
        response_data = {
            "userId": current_user.id,
            "username": current_user.username,
            "email": current_user.email,
            "avatar": current_user.avatar,
            "isExpert": current_user.is_expert,
            "expertTitle": current_user.expert_title if current_user.is_expert else None,
            "bio": current_user.bio,
            "joinDate": current_user.join_date.isoformat() if current_user.join_date else None,
            "lastLogin": current_user.last_login.isoformat() if current_user.last_login else None
        }
        
        return make_response(200, "获取成功", data=response_data)
        
    except Exception as e:
        print(f"Error in getting user profile: {str(e)}")
        return make_response(500, "获取个人资料失败", error="FETCH_FAILED")

@auth_bp.route('/profile', methods=['PUT'])
@token_required
def update_profile(current_user):
    """更新用户个人资料"""
    data = request.json
    
    if not data:
        return make_response(400, "请求参数不完整", error="INVALID_REQUEST")
    
    try:
        # 更新用户资料
        if 'username' in data and data['username'] != current_user.username:
            # 检查用户名是否已存在
            if User.query.filter_by(username=data['username']).first():
                return make_response(400, "用户名已存在", error="USERNAME_EXISTS")
            current_user.username = data['username']
        
        if 'email' in data and data['email'] != current_user.email:
            # 检查邮箱是否已存在
            if User.query.filter_by(email=data['email']).first():
                return make_response(400, "邮箱已存在", error="EMAIL_EXISTS")
            current_user.email = data['email']
        
        if 'avatar' in data:
            current_user.avatar = data['avatar']
        
        if 'bio' in data:
            current_user.bio = data['bio']
        
        db.session.commit()
        
        # 构建响应数据
        response_data = {
            "userId": current_user.id,
            "username": current_user.username,
            "email": current_user.email,
            "avatar": current_user.avatar,
            "isExpert": current_user.is_expert,
            "expertTitle": current_user.expert_title if current_user.is_expert else None,
            "bio": current_user.bio
        }
        
        return make_response(200, "更新成功", data=response_data)
        
    except Exception as e:
        db.session.rollback()
        print(f"Error in updating user profile: {str(e)}")
        return make_response(500, "更新个人资料失败", error="UPDATE_FAILED")

@auth_bp.route('/change-password', methods=['POST'])
@token_required
def change_password(current_user):
    """修改密码"""
    data = request.json
    
    if not data or 'oldPassword' not in data or 'newPassword' not in data:
        return make_response(400, "请求参数不完整", error="INVALID_REQUEST")
    
    old_password = data['oldPassword']
    new_password = data['newPassword']
    
    try:
        # 验证旧密码
        from werkzeug.security import check_password_hash, generate_password_hash
        
        if not check_password_hash(current_user.password_hash, old_password):
            return make_response(401, "旧密码错误", error="INVALID_PASSWORD")
        
        # 更新密码
        current_user.password_hash = generate_password_hash(new_password)
        db.session.commit()
        
        return make_response(200, "密码修改成功")
        
    except Exception as e:
        db.session.rollback()
        print(f"Error in changing password: {str(e)}")
        return make_response(500, "密码修改失败", error="PASSWORD_CHANGE_FAILED")
