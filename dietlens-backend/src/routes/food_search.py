from flask import Blueprint, request, jsonify
from datetime import datetime

from src.models import db, Food, FoodNutrition, FoodServingSize, FoodCategory, FavoriteFood, RecentViewedFood, User, FoodTag, FoodTagAssociation

food_search_bp = Blueprint('food_search', __name__)

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

@food_search_bp.route('/search', methods=['GET'])
def search_foods():
    """搜索食物"""
    query = request.args.get('query', '')
    category = request.args.get('category', '')
    page = int(request.args.get('page', 1))
    limit = int(request.args.get('limit', 20))
    sort = request.args.get('sort', 'relevance')
    user_id = request.args.get('userId')  # 实际应从认证信息中获取
    
    # 验证排序方式
    valid_sort_options = ['relevance', 'calories_asc', 'calories_desc', 'name_asc', 'name_desc']
    if sort not in valid_sort_options:
        return make_response(400, "无效的排序方式", error="INVALID_SORT")
    
    try:
        # 构建查询
        food_query = db.session.query(Food).join(FoodNutrition, Food.id == FoodNutrition.food_id)
        
        # 应用搜索条件
        if query:
            search_term = f"%{query}%"
            food_query = food_query.filter(Food.name.like(search_term))
        
        # 应用分类筛选
        if category:
            food_query = food_query.filter(Food.category == category)
        
        # 应用排序
        if sort == 'calories_asc':
            food_query = food_query.order_by(FoodNutrition.calories.asc())
        elif sort == 'calories_desc':
            food_query = food_query.order_by(FoodNutrition.calories.desc())
        elif sort == 'name_asc':
            food_query = food_query.order_by(Food.name.asc())
        elif sort == 'name_desc':
            food_query = food_query.order_by(Food.name.desc())
        else:  # relevance
            if query:
                # 相关性排序（简化版）
                food_query = food_query.order_by(Food.popularity.desc())
            else:
                food_query = food_query.order_by(Food.name.asc())
        
        # 计算总数和分页
        total = food_query.count()
        total_pages = (total + limit - 1) // limit
        
        foods = food_query.offset((page - 1) * limit).limit(limit).all()
        
        # 构建响应数据
        foods_data = []
        for food in foods:
            nutrition = food.nutrition
            
            # 获取默认份量
            default_serving = next((s for s in food.serving_sizes if s.is_default), None)
            serving_size = default_serving.name if default_serving else "100克"
            
            # 检查是否是收藏食物
            is_favorite = False
            if user_id:
                favorite = FavoriteFood.query.filter_by(user_id=user_id, food_id=food.id).first()
                is_favorite = favorite is not None
            
            # 记录最近查看
            if user_id:
                recent_view = RecentViewedFood.query.filter_by(user_id=user_id, food_id=food.id).first()
                if recent_view:
                    recent_view.viewed_at = datetime.utcnow()
                else:
                    new_view = RecentViewedFood(user_id=user_id, food_id=food.id)
                    db.session.add(new_view)
                db.session.commit()
            
            food_data = {
                "id": food.id,
                "name": food.name,
                "category": food.category,
                "categoryName": food.category_name,
                "calories": nutrition.calories if nutrition else 0,
                "protein": nutrition.protein if nutrition else 0,
                "carbs": nutrition.carbs if nutrition else 0,
                "fat": nutrition.fat if nutrition else 0,
                "fiber": nutrition.fiber if nutrition else 0,
                "servingSize": serving_size,
                "imageUrl": food.image_url,
                "isFavorite": is_favorite
            }
            
            foods_data.append(food_data)
        
        response_data = {
            "total": total,
            "totalPages": total_pages,
            "currentPage": page,
            "foods": foods_data
        }
        
        return make_response(200, "搜索成功", data=response_data)
        
    except Exception as e:
        print(f"Error in searching foods: {str(e)}")
        return make_response(500, "搜索失败", error="SEARCH_FAILED")

@food_search_bp.route('/foods/<food_id>', methods=['GET'])
def get_food_detail(food_id):
    """获取食物详情"""
    user_id = request.args.get('userId')  # 实际应从认证信息中获取
    
    food = Food.query.get(food_id)
    
    if not food:
        return make_response(404, "食物不存在", error="FOOD_NOT_FOUND")
    
    try:
        nutrition = food.nutrition
        serving_sizes = food.serving_sizes
        
        # 获取食物标签
        food_tags = db.session.query(FoodTag).join(FoodTagAssociation).filter(
            FoodTagAssociation.food_id == food.id
        ).all()
        
        # 检查是否是收藏食物
        is_favorite = False
        if user_id:
            favorite = FavoriteFood.query.filter_by(user_id=user_id, food_id=food.id).first()
            is_favorite = favorite is not None
            
            # 记录最近查看
            recent_view = RecentViewedFood.query.filter_by(user_id=user_id, food_id=food.id).first()
            if recent_view:
                recent_view.viewed_at = datetime.utcnow()
            else:
                new_view = RecentViewedFood(user_id=user_id, food_id=food.id)
                db.session.add(new_view)
            db.session.commit()
        
        # 构建响应数据
        serving_sizes_data = []
        for serving in serving_sizes:
            serving_data = {
                "name": serving.name,
                "weight": serving.weight,
                "isDefault": serving.is_default
            }
            serving_sizes_data.append(serving_data)
        
        nutrition_data = {}
        if nutrition:
            nutrition_data = {
                "calories": nutrition.calories,
                "protein": nutrition.protein,
                "carbs": nutrition.carbs,
                "fat": nutrition.fat,
                "fiber": nutrition.fiber,
                "sugar": nutrition.sugar,
                "sodium": nutrition.sodium,
                "potassium": nutrition.potassium,
                "vitaminA": nutrition.vitamin_a,
                "vitaminC": nutrition.vitamin_c,
                "calcium": nutrition.calcium,
                "iron": nutrition.iron
            }
        
        food_data = {
            "id": food.id,
            "name": food.name,
            "category": food.category,
            "categoryName": food.category_name,
            "description": food.description,
            "nutrition": nutrition_data,
            "servingSizes": serving_sizes_data,
            "imageUrl": food.image_url,
            "tags": [tag.name for tag in food_tags],
            "popularity": food.popularity,
            "isFavorite": is_favorite
        }
        
        return make_response(200, "获取成功", data=food_data)
        
    except Exception as e:
        print(f"Error in getting food detail: {str(e)}")
        return make_response(500, "获取食物详情失败", error="FETCH_FAILED")

@food_search_bp.route('/categories', methods=['GET'])
def get_categories():
    """获取食物分类列表"""
    # include_count = request.args.get('includeCount', 'false').lower() == 'true'
    
    try:
        categories = FoodCategory.query.all()
        
        categories_data = []
        for category in categories:
            category_data = {
                "id": category.id,
                "name": category.name,
                "description": category.description,
                "imageUrl": category.image_url
            }
            
            # if include_count:
                # 计算该分类下的食物数量
            count = Food.query.filter_by(category=category.id).count()
            category_data["count"] = count
            
            categories_data.append(category_data)
        
        response_data = {
            "categories": categories_data,
        }
        
        return make_response(200, "获取成功", data=response_data)
        
    except Exception as e:
        print(f"Error in getting categories: {str(e)}")
        return make_response(500, "获取分类列表失败", error="FETCH_FAILED")

@food_search_bp.route('/categories/<category_id>/foods', methods=['GET'])
def get_category_foods(category_id):
    """获取分类下的食物"""
    page = int(request.args.get('page', 1))
    limit = int(request.args.get('limit', 20))
    sort = request.args.get('sort', 'name_asc')
    user_id = request.args.get('userId')  # 实际应从认证信息中获取
    
    # 验证排序方式
    valid_sort_options = ['name_asc', 'name_desc', 'calories_asc', 'calories_desc', 'popularity']
    if sort not in valid_sort_options:
        return make_response(400, "无效的排序方式", error="INVALID_SORT")
    
    # 检查分类是否存在
    category = FoodCategory.query.get(category_id)
    if not category:
        return make_response(404, "分类不存在", error="CATEGORY_NOT_FOUND")
    
    try:
        # 构建查询
        food_query = db.session.query(Food).join(FoodNutrition, Food.id == FoodNutrition.food_id).filter(Food.category == category_id)
        
        # 应用排序
        if sort == 'name_asc':
            food_query = food_query.order_by(Food.name.asc())
        elif sort == 'name_desc':
            food_query = food_query.order_by(Food.name.desc())
        elif sort == 'calories_asc':
            food_query = food_query.order_by(FoodNutrition.calories.asc())
        elif sort == 'calories_desc':
            food_query = food_query.order_by(FoodNutrition.calories.desc())
        elif sort == 'popularity':
            food_query = food_query.order_by(Food.popularity.desc())
        
        # 计算总数和分页
        total = food_query.count()
        total_pages = (total + limit - 1) // limit
        
        foods = food_query.offset((page - 1) * limit).limit(limit).all()
        
        # 构建响应数据
        foods_data = []
        for food in foods:
            nutrition = food.nutrition
            
            # 获取默认份量
            default_serving = next((s for s in food.serving_sizes if s.is_default), None)
            serving_size = default_serving.name if default_serving else "100克"
            
            food_data = {
                "id": food.id,
                "name": food.name,
                "calories": nutrition.calories if nutrition else 0,
                "protein": nutrition.protein if nutrition else 0,
                "carbs": nutrition.carbs if nutrition else 0,
                "fat": nutrition.fat if nutrition else 0,
                "fiber": nutrition.fiber if nutrition else 0,
                "servingSize": serving_size,
                "imageUrl": food.image_url
            }
            
            foods_data.append(food_data)
        
        response_data = {
            "category": {
                "id": category.id,
                "name": category.name,
                "description": category.description
            },
            "total": total,
            "totalPages": total_pages,
            "currentPage": page,
            "foods": foods_data
        }
        
        return make_response(200, "获取成功", data=response_data)
        
    except Exception as e:
        print(f"Error in getting category foods: {str(e)}")
        return make_response(500, "获取分类食物失败", error="FETCH_FAILED")

@food_search_bp.route('/popular', methods=['GET'])
def get_popular_foods():
    """获取常见/热门食物"""
    limit = int(request.args.get('limit', 10))
    user_id = request.args.get('userId')  # 实际应从认证信息中获取
    
    try:
        # 查询热门食物
        foods = Food.query.order_by(Food.popularity.desc()).limit(limit).all()
        
        # 构建响应数据
        foods_data = []
        for food in foods:
            nutrition = food.nutrition
            
            # 获取默认份量
            default_serving = next((s for s in food.serving_sizes if s.is_default), None)
            serving_size = default_serving.name if default_serving else "100克"
            
            # 检查是否是收藏食物
            is_favorite = False
            if user_id:
                favorite = FavoriteFood.query.filter_by(user_id=user_id, food_id=food.id).first()
                is_favorite = favorite is not None
            
            food_data = {
                "id": food.id,
                "name": food.name,
                "category": food.category,
                "categoryName": food.category_name,
                "calories": nutrition.calories if nutrition else 0,
                "protein": nutrition.protein if nutrition else 0,
                "carbs": nutrition.carbs if nutrition else 0,
                "fat": nutrition.fat if nutrition else 0,
                "servingSize": serving_size,
                "imageUrl": food.image_url,
                "isFavorite": is_favorite
            }
            
            foods_data.append(food_data)
        
        response_data = {
            "foods": foods_data
        }
        
        return make_response(200, "获取成功", data=response_data)
        
    except Exception as e:
        print(f"Error in getting popular foods: {str(e)}")
        return make_response(500, "获取热门食物失败", error="FETCH_FAILED")

@food_search_bp.route('/favorites', methods=['POST'])
def manage_favorite_food():
    """添加/移除收藏食物"""
    data = request.json
    
    if not data or 'foodId' not in data or 'action' not in data:
        return make_response(400, "请求参数不完整", error="INVALID_REQUEST")
    
    food_id = data['foodId']
    action = data['action']
    user_id = data.get('userId')  # 实际应从认证信息中获取
    
    # 检查食物是否存在
    food = Food.query.get(food_id)
    if not food:
        return make_response(404, "食物不存在", error="FOOD_NOT_FOUND")
    
    # 检查用户是否存在
    user = User.query.get(user_id)
    if not user:
        return make_response(404, "用户不存在", error="USER_NOT_FOUND")
    
    try:
        # 查找现有收藏记录
        favorite = FavoriteFood.query.filter_by(user_id=user_id, food_id=food_id).first()
        
        if action == 'add' and not favorite:
            # 添加收藏
            new_favorite = FavoriteFood(user_id=user_id, food_id=food_id)
            db.session.add(new_favorite)
            is_favorite = True
            
        elif action == 'remove' and favorite:
            # 移除收藏
            db.session.delete(favorite)
            is_favorite = False
            
        else:
            # 操作无效（已收藏再收藏或未收藏取消收藏）
            is_favorite = True if favorite else False
        
        db.session.commit()
        
        # 构建响应数据
        response_data = {
            "foodId": food_id,
            "isFavorite": is_favorite
        }
        
        return make_response(200, "操作成功", data=response_data)
        
    except Exception as e:
        db.session.rollback()
        print(f"Error in managing favorite food: {str(e)}")
        return make_response(500, "操作失败", error="OPERATION_FAILED")

@food_search_bp.route('/favorites', methods=['GET'])
def get_favorite_foods():
    """获取用户收藏的食物"""
    user_id = request.args.get('userId')  # 实际应从认证信息中获取
    page = int(request.args.get('page', 1))
    limit = int(request.args.get('limit', 20))
    
    # 检查用户是否存在
    user = User.query.get(user_id)
    if not user:
        return make_response(404, "用户不存在", error="USER_NOT_FOUND")
    
    try:
        # 查询用户收藏的食物
        favorites_query = db.session.query(FavoriteFood, Food, FoodNutrition) \
            .join(Food, FavoriteFood.food_id == Food.id) \
            .join(FoodNutrition, Food.id == FoodNutrition.food_id) \
            .filter(FavoriteFood.user_id == user_id) \
            .order_by(FavoriteFood.added_at.desc())
        
        # 计算总数和分页
        total = favorites_query.count()
        total_pages = (total + limit - 1) // limit
        
        favorites = favorites_query.offset((page - 1) * limit).limit(limit).all()
        
        # 构建响应数据
        foods_data = []
        for favorite, food, nutrition in favorites:
            # 获取默认份量
            default_serving = next((s for s in food.serving_sizes if s.is_default), None)
            serving_size = default_serving.name if default_serving else "100克"
            
            food_data = {
                "id": food.id,
                "name": food.name,
                "category": food.category,
                "categoryName": food.category_name,
                "calories": nutrition.calories,
                "protein": nutrition.protein,
                "carbs": nutrition.carbs,
                "fat": nutrition.fat,
                "fiber": nutrition.fiber,
                "servingSize": serving_size,
                "imageUrl": food.image_url,
                "addedAt": favorite.added_at.isoformat()
            }
            
            foods_data.append(food_data)
        
        response_data = {
            "total": total,
            "totalPages": total_pages,
            "currentPage": page,
            "foods": foods_data
        }
        
        return make_response(200, "获取成功", data=response_data)
        
    except Exception as e:
        print(f"Error in getting favorite foods: {str(e)}")
        return make_response(500, "获取收藏食物失败", error="FETCH_FAILED")

@food_search_bp.route('/recent', methods=['GET'])
def get_recent_foods():
    """获取用户最近查看的食物"""
    user_id = request.args.get('userId')  # 实际应从认证信息中获取
    limit = int(request.args.get('limit', 10))
    
    # 检查用户是否存在
    user = User.query.get(user_id)
    if not user:
        return make_response(404, "用户不存在", error="USER_NOT_FOUND")
    
    try:
        # 查询用户最近查看的食物
        recent_query = db.session.query(RecentViewedFood, Food, FoodNutrition) \
            .join(Food, RecentViewedFood.food_id == Food.id) \
            .join(FoodNutrition, Food.id == FoodNutrition.food_id) \
            .filter(RecentViewedFood.user_id == user_id) \
            .order_by(RecentViewedFood.viewed_at.desc()) \
            .limit(limit)
        
        recent_foods = recent_query.all()
        
        # 构建响应数据
        foods_data = []
        for recent, food, nutrition in recent_foods:
            # 获取默认份量
            default_serving = next((s for s in food.serving_sizes if s.is_default), None)
            serving_size = default_serving.name if default_serving else "100克"
            
            food_data = {
                "id": food.id,
                "name": food.name,
                "category": food.category,
                "categoryName": food.category_name,
                "calories": nutrition.calories,
                "protein": nutrition.protein,
                "carbs": nutrition.carbs,
                "fat": nutrition.fat,
                "servingSize": serving_size,
                "imageUrl": food.image_url,
                "viewedAt": recent.viewed_at.isoformat()
            }
            
            foods_data.append(food_data)
        
        response_data = {
            "foods": foods_data
        }
        
        return make_response(200, "获取成功", data=response_data)
        
    except Exception as e:
        print(f"Error in getting recent foods: {str(e)}")
        return make_response(500, "获取最近查看食物失败", error="FETCH_FAILED")

@food_search_bp.route('/custom', methods=['POST'])
def add_custom_food():
    """添加自定义食物"""
    import os
    import uuid
    from werkzeug.utils import secure_filename
    from src.config.config import config
    
    # 检查请求参数
    if 'name' not in request.form:
        return make_response(400, "食物名称不能为空", error="INVALID_REQUEST")
    
    if 'category' not in request.form:
        return make_response(400, "食物分类不能为空", error="INVALID_REQUEST")
    
    if 'calories' not in request.form:
        return make_response(400, "热量不能为空", error="INVALID_REQUEST")
    
    name = request.form['name']
    category = request.form['category']
    calories = float(request.form['calories'])
    protein = float(request.form.get('protein', 0))
    carbs = float(request.form.get('carbs', 0))
    fat = float(request.form.get('fat', 0))
    fiber = float(request.form.get('fiber', 0)) if 'fiber' in request.form else None
    sugar = float(request.form.get('sugar', 0)) if 'sugar' in request.form else None
    sodium = float(request.form.get('sodium', 0)) if 'sodium' in request.form else None
    serving_size = request.form['servingSize']
    serving_weight = float(request.form['servingWeight'])
    description = request.form.get('description', '')
    user_id = request.form.get('userId')  # 实际应从认证信息中获取
    
    # 检查用户是否存在
    user = User.query.get(user_id)
    if not user:
        return make_response(404, "用户不存在", error="USER_NOT_FOUND")
    
    # 检查分类是否存在
    category_obj = FoodCategory.query.get(category)
    if not category_obj:
        return make_response(404, "分类不存在", error="CATEGORY_NOT_FOUND")
    
    # 验证营养数值
    if calories < 0 or protein < 0 or carbs < 0 or fat < 0:
        return make_response(400, "营养数值必须为非负数", error="INVALID_NUTRITION_VALUE")
    
    if fiber is not None and fiber < 0:
        return make_response(400, "膳食纤维必须为非负数", error="INVALID_NUTRITION_VALUE")
    
    if sugar is not None and sugar < 0:
        return make_response(400, "糖必须为非负数", error="INVALID_NUTRITION_VALUE")
    
    if sodium is not None and sodium < 0:
        return make_response(400, "钠必须为非负数", error="INVALID_NUTRITION_VALUE")
    
    try:
        # 生成自定义食物ID
        food_id = f"custom_{user_id}_{str(uuid.uuid4())[:8]}"
        
        # 处理上传的图片
        image_url = None
        if 'image' in request.files:
            image_file = request.files['image']
            
            if image_file and image_file.filename:
                # 检查图片大小
                if len(image_file.read()) > 2 * 1024 * 1024:  # 2MB
                    return make_response(413, "图片大小不能超过2MB", error="IMAGE_TOO_LARGE")
                
                image_file.seek(0)  # 重置文件指针
                
                # 保存图片（实际项目中应上传到云存储）
                filename = secure_filename(image_file.filename)
                new_filename = f"{food_id}_{filename}"
                
                # 确保上传目录存在
                upload_folder = os.path.join(config['default'].UPLOAD_FOLDER, 'custom')
                os.makedirs(upload_folder, exist_ok=True)
                
                file_path = os.path.join(upload_folder, new_filename)
                image_file.save(file_path)
                
                image_url = f"/uploads/custom/{new_filename}"  # 相对URL路径
        
        # 创建食物记录
        food = Food(
            id=food_id,
            name=name,
            category=category,
            category_name=category_obj.name,
            description=description,
            image_url=image_url,
            is_custom=True,
            creator_id=user_id
        )
        db.session.add(food)
        db.session.flush()  # 获取ID但不提交
        
        # 创建营养信息
        nutrition = FoodNutrition(
            food_id=food.id,
            calories=calories,
            protein=protein,
            carbs=carbs,
            fat=fat,
            fiber=fiber,
            sugar=sugar,
            sodium=sodium
        )
        db.session.add(nutrition)
        
        # 创建份量信息
        serving = FoodServingSize(
            food_id=food.id,
            name=serving_size,
            weight=serving_weight,
            is_default=True
        )
        db.session.add(serving)
        
        db.session.commit()
        
        # 构建响应数据
        response_data = {
            "id": food.id,
            "name": food.name,
            "category": food.category,
            "categoryName": food.category_name,
            "isCustom": True,
            "nutrition": {
                "calories": nutrition.calories,
                "protein": nutrition.protein,
                "carbs": nutrition.carbs,
                "fat": nutrition.fat,
                "fiber": nutrition.fiber,
                "sugar": nutrition.sugar,
                "sodium": nutrition.sodium
            },
            "servingSizes": [
                {
                    "name": serving.name,
                    "weight": serving.weight,
                    "isDefault": serving.is_default
                }
            ],
            "imageUrl": food.image_url,
            "createdAt": food.created_at.isoformat()
        }
        
        return make_response(201, "创建成功", data=response_data)
        
    except Exception as e:
        db.session.rollback()
        print(f"Error in adding custom food: {str(e)}")
        return make_response(500, "创建自定义食物失败", error="CREATE_FAILED")
