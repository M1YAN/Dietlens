from flask import Blueprint, request, jsonify
import os
import uuid
from datetime import datetime
from werkzeug.utils import secure_filename
import json

from src.config.config import config
from src.models import db, FoodRecognition, RecognizedFood, Food, User

food_recognition_bp = Blueprint('food_recognition', __name__)

# 辅助函数：检查文件扩展名是否允许
def allowed_file(filename):
    return '.' in filename and \
           filename.rsplit('.', 1)[1].lower() in config['default'].ALLOWED_IMAGE_EXTENSIONS

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

# 辅助函数：调用OpenAI API进行食物识别
def recognize_food_with_openai(image_path):
    """
    使用OpenAI API识别图片中的食物
    这里是一个示例实现，实际项目中需要根据OpenAI API的具体要求进行调整
    """
    import requests
    import base64
    import os
    
    # 读取图片并转为base64
    with open(image_path, "rb") as image_file:
        base64_image = base64.b64encode(image_file.read()).decode('utf-8')
    
    # 构建API请求
    headers = {
        "Content-Type": "application/json",
        "Authorization": f"Bearer {config['default'].OPENAI_API_KEY}"
    }
    
    payload = {
        "model": config['default'].OPENAI_API_MODEL,
        "messages": [
            {
                "role": "system",
                "content": "你是一个专业的食物识别助手，能够精确识别图片中的食物，并提供详细的营养成分信息。"
            },
            {
                "role": "user",
                "content": [
                    {"type": "text", "text": "请识别这张图片中的食物，并提供以下信息：\n1. 食物名称\n2. 大致份量（如1碗、2片等）\n3. 估计重量（克）\n4. 热量（千卡）\n5. 蛋白质（克）\n6. 碳水化合物（克）\n7. 脂肪（克）\n8. 膳食纤维（克）\n9. 识别置信度（0-1之间的小数）\n\n请以JSON格式返回，格式如下：\n{\"foods\": [{\"name\": \"食物名称\", \"amount\": \"份量描述\", \"weight\": 重量, \"calories\": 热量, \"protein\": 蛋白质, \"carbs\": 碳水, \"fat\": 脂肪, \"fiber\": 纤维, \"confidence\": 置信度}]}"},
                    {"type": "image_url", "image_url": {"url": f"data:image/jpeg;base64,{base64_image}"}}
                    # {"type": "image_url", "image_url": {"url": f"{image_path}"}}
                ]
            }
        ],
        "max_tokens": 300
    }
    
    # 发送请求到OpenAI API
    response = requests.post("https://api.openai.com/v1/chat/completions", headers=headers, json=payload)
    
    if response.status_code == 200:
        result = response.json()
        # 提取JSON响应
        content = result["choices"][0]["message"]["content"]
        
        # 从文本中提取JSON部分
        try:
            # 尝试直接解析整个内容
            food_data = json.loads(content)
        except json.JSONDecodeError:
            # 如果失败，尝试从文本中提取JSON部分
            import re
            json_match = re.search(r'```json\n(.*?)\n```', content, re.DOTALL)
            if json_match:
                json_str = json_match.group(1)
            else:
                # 尝试找到 { 和 } 之间的内容
                json_match = re.search(r'{.*}', content, re.DOTALL)
                if json_match:
                    json_str = json_match.group(0)
                else:
                    return {"error": "无法从响应中提取JSON数据"}
            
            try:
                food_data = json.loads(json_str)
            except json.JSONDecodeError:
                return {"error": "无法解析提取的JSON数据"}
        return food_data
    else:
        return {"error": f"API请求失败: {response.status_code} - {response.text}"}

@food_recognition_bp.route('/analyze', methods=['POST'])
def analyze_food():
    """上传食物图片并识别"""
    # 检查请求参数
    if 'image' not in request.files:
        return make_response(400, "缺少图片文件", error="INVALID_IMAGE")
    
    if 'userId' not in request.form:
        return make_response(400, "缺少用户ID", error="USER_NOT_FOUND")
    
    file = request.files['image']
    user_id = request.form['userId']
    meal_type = request.form.get('mealType')
    
    # 检查文件是否有效
    if file.filename == '':
        return make_response(400, "未选择文件", error="INVALID_IMAGE")
    
    if not allowed_file(file.filename):
        return make_response(400, "图片格式不支持", error="UNSUPPORTED_FORMAT")
    
    # 检查用户是否存在
    user = User.query.get(user_id)
    # if not user:
    #     return make_response(404, "用户不存在", error="USER_NOT_FOUND")
    
    try:
        # 保存上传的图片
        filename = secure_filename(file.filename)
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        new_filename = f"{user_id}_{timestamp}_{filename}"
        
        # 确保上传目录存在
        upload_folder = os.path.join(config['default'].UPLOAD_FOLDER, 'recognition')
        os.makedirs(upload_folder, exist_ok=True)
        
        file_path = os.path.join(upload_folder, new_filename)
        file.save(file_path)
        
        # 调用OpenAI API进行食物识别
        recognition_result = recognize_food_with_openai(file_path)
        
        if "error" in recognition_result:
            return make_response(500, f"识别服务暂时不可用{recognition_result}", error="RECOGNITION_FAILED")
        
        # 创建识别记录
        image_url = f"/static/uploads/recognition/{new_filename}"  # 相对URL路径
        recognition = FoodRecognition(
            user_id=user_id,
            image_url=image_url,
            meal_type=meal_type
        )
        db.session.add(recognition)
        
        # 添加识别到的食物
        total_nutrition = {
            "calories": 0,
            "protein": 0,
            "carbs": 0,
            "fat": 0,
            "fiber": 0
        }
        
        foods_data = []
        
        for food_item in recognition_result.get("foods", []):
            # 查找数据库中是否有匹配的食物
            food_name = food_item.get("name")
            food = Food.query.filter_by(name=food_name).first()
            
            recognized_food = RecognizedFood(
                recognition_id=recognition.id,
                food_id=food.id if food else None,
                name=food_name,
                amount=food_item.get("amount"),
                weight=food_item.get("weight"),
                unit="g",
                calories=food_item.get("calories"),
                protein=food_item.get("protein"),
                carbs=food_item.get("carbs"),
                fat=food_item.get("fat"),
                fiber=food_item.get("fiber"),
                confidence=food_item.get("confidence")
            )
            db.session.add(recognized_food)
            
            # 累加营养成分
            total_nutrition["calories"] += food_item.get("calories", 0)
            total_nutrition["protein"] += food_item.get("protein", 0)
            total_nutrition["carbs"] += food_item.get("carbs", 0)
            total_nutrition["fat"] += food_item.get("fat", 0)
            total_nutrition["fiber"] += food_item.get("fiber", 0)
            
            # 构建响应数据
            foods_data.append({
                "id": food.id if food else None,
                "name": food_name,
                "amount": food_item.get("amount"),
                "weight": food_item.get("weight"),
                "unit": "g",
                "calories": food_item.get("calories"),
                "protein": food_item.get("protein"),
                "carbs": food_item.get("carbs"),
                "fat": food_item.get("fat"),
                "fiber": food_item.get("fiber"),
                "confidence": food_item.get("confidence")
            })
        
        db.session.commit()
        
        # 构建响应
        response_data = {
            "recognitionId": recognition.id,
            "foods": foods_data,
            "totalNutrition": total_nutrition,
            "imageUrl": image_url
        }
        
        return make_response(200, "识别成功", data=response_data)
        
    except Exception as e:
        db.session.rollback()
        print(f"Error in food recognition: {str(e)}")
        return make_response(500, f"识别过程失败{str(e)}", error="RECOGNITION_FAILED")


@food_recognition_bp.route('/adjust', methods=['PUT'])
def adjust_recognition():
    """调整识别结果"""
    data = request.json
    
    if not data or 'recognitionId' not in data or 'adjustments' not in data:
        return make_response(400, "请求参数不完整", error="INVALID_REQUEST")
    
    recognition_id = data['recognitionId']
    adjustments = data['adjustments']
    
    # 检查识别记录是否存在
    with db.session.no_autoflush:
        recognition = FoodRecognition.query.get(recognition_id)
    if not recognition:
        return make_response(404, "识别记录不存在", error="RECOGNITION_NOT_FOUND")
    
    try:
        # 处理调整
        for adjustment in adjustments:
            action = adjustment.get('action')
            
            if action == 'update':
                food_id = adjustment.get('foodId')
                with db.session.no_autoflush:
                    recognized_food = RecognizedFood.query.filter_by(recognition_id=recognition_id, food_id=food_id).first()
                
                if recognized_food:
                    # 更新属性
                    if 'amount' in adjustment:
                        recognized_food.amount = adjustment['amount']
                    if 'weight' in adjustment:
                        recognized_food.weight = adjustment['weight']
                        
                        # 根据重量调整营养成分
                        if recognized_food.weight > 0:
                            weight_ratio = adjustment['weight'] / recognized_food.weight
                            recognized_food.calories *= weight_ratio
                            recognized_food.protein *= weight_ratio
                            recognized_food.carbs *= weight_ratio
                            recognized_food.fat *= weight_ratio
                            recognized_food.fiber *= weight_ratio
            
            elif action == 'remove':
                food_id = adjustment.get('foodId')
                with db.session.no_autoflush:
                    recognized_food = RecognizedFood.query.filter_by(recognition_id=recognition_id, food_id=food_id).first()
                
                if recognized_food:
                    with db.session.no_autoflush:
                        db.session.delete(recognized_food)
            
            elif action == 'add':
                food_id = adjustment.get('foodId')
                with db.session.no_autoflush:
                    food = Food.query.get(food_id)
                
                if food:
                    # 获取食物的营养信息
                    nutrition = food.nutrition
                    
                    # 计算基于重量的营养成分
                    weight = adjustment.get('weight', 100)  # 默认100g
                    weight_ratio = weight / 100  # 假设营养信息基于100g
                    
                    new_food = RecognizedFood(
                        recognition_id=recognition_id,
                        food_id=food_id,
                        name=food.name,
                        amount=adjustment.get('amount', '1份'),
                        weight=weight,
                        unit="g",
                        calories=nutrition.calories * weight_ratio if nutrition else 0,
                        protein=nutrition.protein * weight_ratio if nutrition else 0,
                        carbs=nutrition.carbs * weight_ratio if nutrition else 0,
                        fat=nutrition.fat * weight_ratio if nutrition else 0,
                        fiber=nutrition.fiber * weight_ratio if nutrition else 0,
                        confidence=1.0  # 手动添加的食物置信度为1
                    )
                    with db.session.no_autoflush:
                        db.session.add(new_food)
        with db.session.no_autoflush:
            db.session.commit()
        
        # 重新计算总营养成分
        with db.session.no_autoflush:
            recognized_foods = RecognizedFood.query.filter_by(recognition_id=recognition_id).all()
        
        total_nutrition = {
            "calories": sum(food.calories or 0 for food in recognized_foods),
            "protein": sum(food.protein or 0 for food in recognized_foods),
            "carbs": sum(food.carbs or 0 for food in recognized_foods),
            "fat": sum(food.fat or 0 for food in recognized_foods),
            "fiber": sum(food.fiber or 0 for food in recognized_foods)
        }
        
        # 构建响应数据
        foods_data = []
        for food in recognized_foods:
            foods_data.append({
                "id": food.food_id,
                "name": food.name,
                "amount": food.amount,
                "weight": food.weight,
                "unit": food.unit,
                "calories": food.calories,
                "protein": food.protein,
                "carbs": food.carbs,
                "fat": food.fat,
                "fiber": food.fiber
            })
        
        response_data = {
            "recognitionId": recognition_id,
            "foods": foods_data,
            "totalNutrition": total_nutrition
        }
        print(response_data)
        
        return make_response(200, "调整成功", data=response_data)
        
    except Exception as e:
        db.session.rollback()
        print(f"Error in adjusting recognition: {str(e)}")
        return make_response(500, "调整过程失败", error="ADJUSTMENT_FAILED")

@food_recognition_bp.route('/save-to-diary', methods=['POST'])
def save_to_diary():
    """添加识别结果到用户日记"""
    from src.models import DailyIntake, Meal, FoodEntry
    
    data = request.json
    
    if not data or 'userId' not in data or 'recognitionId' not in data or 'date' not in data or 'mealType' not in data:
        return make_response(400, "请求参数不完整", error="INVALID_REQUEST")
    
    user_id = data['userId']
    recognition_id = data['recognitionId']
    date_str = data['date']
    meal_type = data['mealType']
    note = data.get('note', '')
    
    # 检查用户是否存在
    user = User.query.get(user_id)
    if not user:
        return make_response(404, "用户不存在", error="USER_NOT_FOUND")
    
    # 检查识别记录是否存在
    recognition = FoodRecognition.query.get(recognition_id)
    if not recognition:
        return make_response(404, "识别记录不存在", error="RECOGNITION_NOT_FOUND")
    
    try:
        # 解析日期
        date_obj = datetime.strptime(date_str, '%Y-%m-%d').date()
        
        # 查找或创建当日摄入记录
        daily_intake = DailyIntake.query.filter_by(user_id=user_id, date=date_obj).first()
        if not daily_intake:
            daily_intake = DailyIntake(user_id=user_id, date=date_obj)
            db.session.add(daily_intake)
            db.session.flush()  # 获取ID但不提交
        
        # 查找或创建餐次
        meal_names = {
            'breakfast': '早餐',
            'lunch': '午餐',
            'dinner': '晚餐',
            'snack': '零食'
        }
        
        meal_name = meal_names.get(meal_type, meal_type)
        meal = Meal.query.filter_by(daily_intake_id=daily_intake.id, name=meal_name).first()
        
        if not meal:
            # 根据餐次类型设置默认时间
            default_times = {
                'breakfast': '08:00',
                'lunch': '12:00',
                'dinner': '18:00',
                'snack': '15:00'
            }
            
            meal = Meal(
                daily_intake_id=daily_intake.id,
                name=meal_name,
                time=default_times.get(meal_type, '12:00')
            )
            db.session.add(meal)
            db.session.flush()  # 获取ID但不提交
        
        # 将识别到的食物添加到餐次中
        recognized_foods = RecognizedFood.query.filter_by(recognition_id=recognition_id).all()
        
        food_entries = []
        total_calories = 0
        
        for recognized_food in recognized_foods:
            food_entry = FoodEntry(
                meal_id=meal.id,
                food_id=recognized_food.food_id or 'unknown',  # 如果没有匹配到食物ID，使用占位符
                amount=recognized_food.amount,
                weight=recognized_food.weight,
                calories=recognized_food.calories,
                protein=recognized_food.protein,
                carbs=recognized_food.carbs,
                fat=recognized_food.fat,
                fiber=recognized_food.fiber
            )
            db.session.add(food_entry)
            
            food_entries.append({
                "id": recognized_food.food_id,
                "name": recognized_food.name,
                "amount": recognized_food.amount,
                "calories": recognized_food.calories
            })
            
            total_calories += recognized_food.calories or 0
        
        # 标记识别记录已保存到日记
        recognition.saved_to_diary = True
        
        db.session.commit()
        
        # 构建响应
        response_data = {
            "diaryEntryId": f"entry_{daily_intake.id}_{meal.id}",
            "date": date_str,
            "mealType": meal_type,
            "foods": food_entries,
            "totalCalories": total_calories
        }
        
        return make_response(200, "已添加到饮食日记", data=response_data)
        
    except ValueError:
        return make_response(400, "日期格式无效", error="INVALID_DATE_FORMAT")
    except Exception as e:
        db.session.rollback()
        print(f"Error in saving to diary: {str(e)}")
        return make_response(500, "保存过程失败", error="SAVE_FAILED")



@food_recognition_bp.route('/<recognition_id>', methods=['GET'])
def get_recognition_detail(recognition_id):
    """获取识别详情"""
    try:
        # 检查识别记录是否存在
        recognition = FoodRecognition.query.get(recognition_id)

        if not recognition:
            return make_response(404, "识别记录不存在", error="RECOGNITION_NOT_FOUND")
        
        # 获取识别到的食物
        recognized_foods = RecognizedFood.query.filter_by(recognition_id=recognition_id).all()
        
        # 构建食物数据
        foods_data = []
        total_nutrition = {
            "calories": 0,
            "protein": 0,
            "carbs": 0,
            "fat": 0,
            "fiber": 0
        }
        
        for food in recognized_foods:
            food_data = {
                "id": food.food_id,
                "name": food.name,
                "amount": food.amount,
                "weight": food.weight,
                "unit": food.unit,
                "calories": food.calories,
                "protein": food.protein,
                "carbs": food.carbs,
                "fat": food.fat,
                "fiber": food.fiber,
                "confidence": food.confidence
            }
            foods_data.append(food_data)
            
            # 累加营养成分
            total_nutrition["calories"] += food.calories or 0
            total_nutrition["protein"] += food.protein or 0
            total_nutrition["carbs"] += food.carbs or 0
            total_nutrition["fat"] += food.fat or 0
            total_nutrition["fiber"] += food.fiber or 0
        
        # 构建响应数据
        response_data = {
            "recognitionId": recognition.id,
            "timestamp": recognition.created_at.isoformat(),
            "imageUrl": recognition.image_url,  # 返回文件名而不是完整路径
            "mealType": recognition.meal_type,
            "foods": foods_data,
            "totalNutrition": total_nutrition,
            "savedToDiary": recognition.saved_to_diary
        }
        return make_response(200, "获取成功", data=response_data)
        
    except Exception as e:
        print(f"Error in getting recognition detail: {str(e)}")
        return make_response(500, "获取识别详情失败", error="FETCH_FAILED")



@food_recognition_bp.route('/history', methods=['GET'])
def get_history():
    """获取用户识别历史"""
    user_id = request.args.get('userId')
    limit = int(request.args.get('limit', 10))
    offset = int(request.args.get('offset', 0))
    
    if not user_id:
        return make_response(400, "缺少用户ID", error="INVALID_REQUEST")
    
    # 检查用户是否存在
    user = User.query.get(user_id)
    if not user:
        return make_response(404, "用户不存在", error="USER_NOT_FOUND")
    
    try:
        # 查询用户的识别历史
        recognitions = FoodRecognition.query.filter_by(user_id=user_id) \
                                         .order_by(FoodRecognition.created_at.desc()) \
                                         .offset(offset).limit(limit).all()
        
        total_count = FoodRecognition.query.filter_by(user_id=user_id).count()
        
        history_items = []
        
        for recognition in recognitions:
            # 获取识别到的食物
            recognized_foods = RecognizedFood.query.filter_by(recognition_id=recognition.id).all()
            
            foods_data = []
            total_calories = 0
            
            for food in recognized_foods:
                foods_data.append({
                    "id": food.food_id,
                    "name": food.name,
                    "amount": food.amount
                })
                
                total_calories += food.calories or 0
            
            history_items.append({
                "recognitionId": recognition.id,
                "date": recognition.created_at.isoformat(),
                "imageUrl": recognition.image_url,
                "foods": foods_data,
                "totalCalories": total_calories,
                "savedToDiary": recognition.saved_to_diary,
                "mealType": recognition.meal_type
            })
        
        response_data = {
            "total": total_count,
            "items": history_items
        }
        
        return make_response(200, "获取成功", data=response_data)
        
    except Exception as e:
        print(f"Error in getting history: {str(e)}")
        return make_response(500, "获取历史记录失败", error="FETCH_FAILED")
