from flask import Flask
import os
import sys
# DON'T CHANGE THIS !!!
sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))

from flask import Flask, send_from_directory
from src.models import db
from src.routes.auth import auth_bp
from src.routes.food_recognition import food_recognition_bp
from src.routes.community import community_bp
from src.routes.food_search import food_search_bp
from src.routes.nutrition_goals import nutrition_goals_bp
from src.routes.openai_api import openai_api_bp
from src.config.config import config

def create_app(config_name='default'):
    app = Flask(__name__, static_folder=os.path.join(os.path.dirname(__file__), 'static'))
    
    # 加载配置
    app.config.from_object(config[config_name])
    
    # 确保上传目录存在
    os.makedirs(app.config['UPLOAD_FOLDER'], exist_ok=True)
    
    # 初始化数据库
    app.config['SQLALCHEMY_DATABASE_URI'] = config[config_name].SQLALCHEMY_DATABASE_URI
    app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = config[config_name].SQLALCHEMY_TRACK_MODIFICATIONS
    db.init_app(app)


    
    # 静态文件路由
    @app.route('/', defaults={'path': ''})
    @app.route('/<path:path>')
    def serve(path):
        static_folder_path = app.static_folder
        if static_folder_path is None:
            return "Static folder not configured", 404

        if path != "" and os.path.exists(os.path.join(static_folder_path, path)):
            return send_from_directory(static_folder_path, path)
        else:
            index_path = os.path.join(static_folder_path, 'index.html')
            if os.path.exists(index_path):
                return send_from_directory(static_folder_path, 'index.html')
            else:
                return "index.html not found", 404
            
    # 添加静态文件路由
    # @app.route('/uploads/recognition/<filename>')
    # def uploaded_file(filename):
    #     """服务上传的文件"""
    #     try:
    #         return send_from_directory(app.config['UPLOAD_FOLDER'], filename)
    #     except FileNotFoundError:
    #         return "File not found", 404
        # 替换现有的上传文件路由
    @app.route('/static/uploads/recognition/<filename>')
    def uploaded_file(filename):
        """服务上传的文件"""
        try:
            # 首先在根上传目录查找
            root_file = os.path.join(app.config['UPLOAD_FOLDER'], filename)
            if os.path.exists(root_file):
                return send_from_directory(app.config['UPLOAD_FOLDER'], filename)
            
            # 然后在 recognition 子目录查找
            recognition_file = os.path.join(app.config['UPLOAD_FOLDER'], 'recognition', filename)
            if os.path.exists(recognition_file):
                return send_from_directory(
                    os.path.join(app.config['UPLOAD_FOLDER'], 'recognition'), 
                    filename
                )
            return "File not found", 404
            
        except Exception as e:
            print(f"Error serving file {filename}: {str(e)}")
            return "Internal server error", 500
        
    @app.route('/static/uploads/community/<filename>')
    def community_uploaded_file(filename):
        """服务社区上传的文件"""
        try:
            community_folder = os.path.join(app.config['UPLOAD_FOLDER'], 'community')
            if os.path.exists(community_folder):
                return send_from_directory(community_folder, filename)
            return "File not found", 404
        except Exception as e:
            print(f"Error serving community file {filename}: {str(e)}")
            return "Internal server error", 500

    # 注册蓝图
    app.register_blueprint(auth_bp, url_prefix='/api/auth')
    app.register_blueprint(food_recognition_bp, url_prefix='/api/food-recognition')
    app.register_blueprint(community_bp, url_prefix='/api/community')
    app.register_blueprint(food_search_bp, url_prefix='/api/food-search')
    app.register_blueprint(nutrition_goals_bp, url_prefix='/api/nutrition-goals')
    app.register_blueprint(openai_api_bp, url_prefix='/api/openai')
    
    # 创建数据库表
    with app.app_context():
        db.create_all()
    
    return app

app = create_app()

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)
