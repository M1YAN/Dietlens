import os

class Config:
    SECRET_KEY = os.getenv('SECRET_KEY', 'dietlens_secret_key_change_in_production')
    
    # 数据库配置
    # SQLALCHEMY_DATABASE_URI = f"mysql+pymysql://{os.getenv('DB_USERNAME', 'root')}:{os.getenv('DB_PASSWORD', 'password')}@{os.getenv('DB_HOST', 'localhost')}:{os.getenv('DB_PORT', '3306')}/{os.getenv('DB_NAME', 'db')}"
    SQLALCHEMY_DATABASE_URI = f"mysql+pymysql://dietlens:dietlens@localhost:3306/dietlens?charset=utf8&autocommit=true"
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    
    # 文件上传配置
    UPLOAD_FOLDER = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), 'src/static/uploads')
    MAX_CONTENT_LENGTH = 10 * 1024 * 1024  # 10MB 最大上传限制
    ALLOWED_IMAGE_EXTENSIONS = {'jpg', 'jpeg', 'png'}
    
    # OpenAI API配置
    OPENAI_API_KEY = os.getenv('OPENAI_API_KEY', 'your_openai_api_key_here')
    OPENAI_API_MODEL = os.getenv('OPENAI_API_MODEL', 'gpt-4o-mini')
    
    # JWT配置
    JWT_SECRET_KEY = os.getenv('JWT_SECRET_KEY', 'jwt_secret_key_change_in_production')
    JWT_ACCESS_TOKEN_EXPIRES = 3600  # 1小时
    
    # 分页配置
    DEFAULT_PAGE_SIZE = 20
    MAX_PAGE_SIZE = 100
    
    # 社区模块配置
    MAX_TAGS_PER_POST = 5
    MAX_IMAGES_PER_POST = 5
    MAX_IMAGE_SIZE = 5 * 1024 * 1024  # 5MB
    
    # 食物识别配置
    RECOGNITION_HISTORY_DAYS = 30  # 识别历史保存天数
    
    # 营养目标默认值
    DEFAULT_CALORIES = 2000
    DEFAULT_PROTEIN = 75  # 克
    DEFAULT_CARBS = 250  # 克
    DEFAULT_FAT = 65  # 克
    DEFAULT_FIBER = 25  # 克


class DevelopmentConfig(Config):
    DEBUG = True
    TESTING = False


class TestingConfig(Config):
    DEBUG = False
    TESTING = True
    SQLALCHEMY_DATABASE_URI = "sqlite:///:memory:"


class ProductionConfig(Config):
    DEBUG = False
    TESTING = False
    # 生产环境应使用环境变量设置敏感信息


config = {
    'development': DevelopmentConfig,
    'testing': TestingConfig,
    'production': ProductionConfig,
    'default': DevelopmentConfig
}
