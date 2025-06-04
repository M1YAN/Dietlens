import os
import sys
sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))

from src.utils.database_utils import DatabaseUtils
from src.models import db
from src.main import app

if __name__ == '__main__':
    # 初始化数据库
    DatabaseUtils.initialize_database(db, app)
    
    # 创建上传目录
    DatabaseUtils.create_upload_directories(app)
    
    # 生成测试数据
    DatabaseUtils.generate_test_data(db, app, force=True)
    
    print("数据库初始化和测试数据生成完成")
