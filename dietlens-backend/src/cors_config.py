from flask_cors import CORS

def configure_cors(app):
    """配置CORS跨域支持"""
    CORS(app, resources={r"/api/*": {
    "origins": "http://localhost:3000",
    "allow_headers": ["Content-Type", "Authorization"],
    "methods": ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    "supports_credentials": True
    }} )

# from flask_cors import CORS

# app = Flask(__name__)
# # 配置CORS，允许前端域名访问
# CORS(app, resources={r"/api/*": {"origins": "*", "supports_credentials": True}})

# from flask_cors import CORS

# app = Flask(__name__)
# # 添加CORS支持
# CORS(app)

# 或者允许所有源（仅用于开发环境）
# CORS(app)

# from flask_cors import CORS

# app = Flask(__name__)
# # 更新CORS配置，允许content-type请求头
# CORS(app, resources={r"/api/*": {
#     "origins": "http://localhost:3000",
#     "allow_headers": ["Content-Type", "Authorization"],
#     "methods": ["GET", "POST", "PUT", "DELETE", "OPTIONS"]
# }} )

# 或者更简单的配置（允许所有头和方法）
# CORS(app, resources={r"/api/*": {"origins": "http://localhost:3000"}}, supports_credentials=True )


