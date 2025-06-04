from datetime import datetime
import os

class DatabaseUtils:
    """数据库工具类，提供数据库初始化和测试数据生成功能"""
    
    @staticmethod
    def initialize_database(db, app):
        """初始化数据库，创建所有表"""
        with app.app_context():
            db.create_all()
            print("数据库表已创建")
    
    @staticmethod
    def generate_test_data(db, app, force=False):
        """生成测试数据，force=True 时会先清空现有数据再重新生成"""
        from src.models import User, Food, FoodCategory, FoodNutrition, FoodServingSize, NutritionGoal, UserProfile
        from werkzeug.security import generate_password_hash
        from sqlalchemy import text
        
        with app.app_context():
            # 检查是否已有数据，如果不强制则跳过
            if not force and User.query.first() is not None:
                print("数据库中已有测试数据，跳过生成。使用 force=True 参数可强制重新生成数据。")
                return
            
            print("开始生成测试数据...")
            
            # 如果强制更新，先清除现有数据
            if force:
                print("强制更新模式：清除现有数据...")

                db.session.execute(text('SET FOREIGN_KEY_CHECKS=0'))

                # 按依赖关系顺序删除数据
                db.session.query(FoodServingSize).delete()
                db.session.query(FoodNutrition).delete()
                db.session.query(Food).delete()
                db.session.query(FoodCategory).delete()
                db.session.query(NutritionGoal).delete()
                db.session.query(UserProfile).delete()
                # 如果确实需要清除用户数据，取消下面的注释
                # db.session.query(User).delete()
                db.session.commit()
                print("现有数据已清除")

            
            # 创建测试用户
            test_user = User(
                id="user_test001",
                username="testuser",
                email="test@example.com",
                password_hash=generate_password_hash("password123"),
                avatar="https://via.placeholder.com/150",
                is_expert=False,
                join_date=datetime.utcnow()
            )
            
            expert_user = User(
                id="user_expert001",
                username="expertuser",
                email="expert@example.com",
                password_hash=generate_password_hash("password123"),
                avatar="https://via.placeholder.com/150",
                is_expert=True,
                expert_title="注册营养师",
                bio="拥有10年临床营养咨询经验，专注于免疫系统营养支持和慢性疾病饮食管理。",
                join_date=datetime.utcnow()
            )
            
            # db.session.add(test_user)
            # db.session.add(expert_user)
            # 使用 merge 而不是 add，以处理可能存在的用户
            db.session.merge(test_user)
            db.session.merge(expert_user)
            db.session.flush()  # 立即执行以获取ID
            
            # 创建食物分类
            # TODO: 这里的URL需要替换为实际的图片链接，放在图床里，替换链接
            categories = [
                {"id": "grains", "name": "谷物类", "description": "包括各种米、面、麦等谷物及其制品", "url": "https://1.z.wiki/autoupload/20250527/uG8M/600X600/%E7%99%BD%E7%B1%B3%E9%A5%AD.jpg"},
                {"id": "vegetables", "name": "蔬菜类", "description": "各种新鲜或加工的蔬菜", "url": "https://1.z.wiki/autoupload/20250527/H3KI/600X600/%E8%A5%BF%E5%85%B0%E8%8A%B1.jpg"},
                {"id": "fruits", "name": "水果类", "description": "各种新鲜或加工的水果", "url": "https://1.z.wiki/autoupload/20250527/iJrU/600X600/%E8%8D%89%E8%8E%93.jpg"},
                {"id": "protein", "name": "蛋白质类", "description": "肉类、鱼类、豆类、蛋类等富含蛋白质的食物", "url": "https://1.z.wiki/autoupload/20250527/pz8N/600X600/%E7%89%9B%E8%82%89.jpg"},
                {"id": "dairy", "name": "乳制品类", "description": "牛奶、奶酪、酸奶等乳制品", "url": "https://2.z.wiki/autoupload/20250527/pH1I/600X600/%E9%85%B8%E5%A5%B6.jpg"},
                {"id": "fats", "name": "油脂类", "description": "各种油脂、坚果等", "url": "https://2.z.wiki/autoupload/20250527/aNkP/600X600/%E8%8A%B1%E7%94%9F%E9%85%B1.jpg"}
            ]
            
            for category_data in categories:
                category = FoodCategory(
                    id=category_data["id"],
                    name=category_data["name"],
                    description=category_data["description"],
                    # image_url=f"https://via.placeholder.com/150?text={category_data['id']}"
                    image_url=category_data["url"]
                )
                db.session.add(category)
            
            # 创建一些基础食物
            with open(os.path.join(app.root_path, 'utils', 'food_data.json'), 'r', encoding='utf-8') as f:
                import json
                foods = json.load(f) 
            
            for food_data in foods:
                food = Food(
                    id=food_data["id"],
                    name=food_data["name"],
                    category=food_data["category"],
                    category_name=food_data["category_name"],
                    description=food_data["description"],
                    image_url=food_data["image_url"],
                    popularity=50  # 默认人气值
                )
                db.session.add(food)
                
                # 添加营养信息
                nutrition_data = food_data["nutrition"]
                nutrition = FoodNutrition(
                    food_id=food_data["id"],
                    calories=nutrition_data["calories"],
                    protein=nutrition_data["protein"],
                    carbs=nutrition_data["carbs"],
                    fat=nutrition_data["fat"],
                    fiber=nutrition_data["fiber"],
                    sugar=nutrition_data["sugar"],
                    sodium=nutrition_data["sodium"]
                )
                db.session.add(nutrition)
                
                # 添加份量信息
                for serving_data in food_data["serving_sizes"]:
                    serving = FoodServingSize(
                        food_id=food_data["id"],
                        name=serving_data["name"],
                        weight=serving_data["weight"],
                        is_default=serving_data["is_default"]
                    )
                    db.session.add(serving)
            
            # 为测试用户创建营养目标
            test_user_goal = NutritionGoal(
                user_id=test_user.id,
                calories=2000,
                protein=75,
                carbs=250,
                fat=65,
                fiber=25,
                sugar=50,
                sodium=2300,
                last_updated=datetime.utcnow()
            )
            db.session.add(test_user_goal)
            
            # 为测试用户创建个人信息
            test_user_profile = UserProfile(
                user_id=test_user.id,
                gender="male",
                age=30,
                height=175,
                weight=70,
                activity_level="moderate",
                goal="maintain",
                dietary_restrictions="none",
                last_updated=datetime.utcnow()
            )
            db.session.add(test_user_profile)
            
            # 提交所有更改
            db.session.commit()

            db.session.execute(text('SET FOREIGN_KEY_CHECKS=1'))

            print("测试数据生成完成")
    
    @staticmethod
    def create_upload_directories(app):
        """创建上传目录"""
        upload_folder = app.config['UPLOAD_FOLDER']
        subdirs = ['recognition', 'community', 'custom', 'temp']
        
        for subdir in subdirs:
            dir_path = os.path.join(upload_folder, subdir)
            os.makedirs(dir_path, exist_ok=True)
            print(f"创建目录: {dir_path}")
