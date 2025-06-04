from flask import Blueprint, request, jsonify
from datetime import datetime, timedelta, date

from src.models import db, NutritionGoal, UserProfile, DailyIntake, Meal, FoodEntry, User, Food, FoodNutrition

import logging

nutrition_goals_bp = Blueprint('nutrition_goals', __name__)

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

# ADD
# @nutrition_goals_bp.route('/goals/initialize', methods=['POST'])
# def initialize_nutrition_goals():
#     """为新用户初始化营养目标"""
#     data = request.json
    
#     if not data or 'userId' not in data:
#         return make_response(400, "缺少用户ID", error="INVALID_REQUEST")
    
#     user_id = data['userId']
#     use_profile_based = data.get('useProfileBased', False)
    
#     # 检查用户是否存在
#     user = User.query.get(user_id)
#     if not user:
#         return make_response(404, "用户不存在", error="USER_NOT_FOUND")
    
#     # 检查是否已有营养目标
#     existing_goals = NutritionGoal.query.filter_by(user_id=user_id).first()
#     if existing_goals:
#         return make_response(409, "用户已有营养目标，请使用更新接口", error="GOALS_ALREADY_EXISTS")
    
#     try:
#         # 创建新的营养目标
#         goals = NutritionGoal(user_id=user_id)
        
#         if use_profile_based:
#             # 基于用户个人信息计算推荐目标
#             profile = UserProfile.query.filter_by(user_id=user_id).first()
            
#             if profile:
#                 recommended_goals = calculate_recommended_goals(profile)
#                 goals.calories = recommended_goals['calories']
#                 goals.protein = recommended_goals['protein']
#                 goals.carbs = recommended_goals['carbs']
#                 goals.fat = recommended_goals['fat']
#             else:
#                 # 如果没有个人信息，使用默认值
#                 goals.calories = 2000
#                 goals.protein = 75
#                 goals.carbs = 250
#                 goals.fat = 65
#         else:
#             # 使用标准默认值
#             goals.calories = 2000
#             goals.protein = 75
#             goals.carbs = 250
#             goals.fat = 65
        
#         # 设置其他营养素的默认值
#         goals.fiber = 25
#         goals.sugar = 50
#         goals.sodium = 2300
#         goals.created_at = datetime.utcnow()
#         goals.last_updated = datetime.utcnow()
        
#         db.session.add(goals)
#         db.session.commit()
        
#         # 计算宏量营养素比例
#         total_calories_from_macros = (goals.protein * 4) + (goals.carbs * 4) + (goals.fat * 9)
        
#         if total_calories_from_macros > 0:
#             protein_ratio = round((goals.protein * 4 / total_calories_from_macros) * 100, 1)
#             carbs_ratio = round((goals.carbs * 4 / total_calories_from_macros) * 100, 1)
#             fat_ratio = round((goals.fat * 9 / total_calories_from_macros) * 100, 1)
#         else:
#             protein_ratio = 25
#             carbs_ratio = 45
#             fat_ratio = 30
        
#         # 构建响应数据
#         response_data = {
#             "userId": user_id,
#             "goals": {
#                 "calories": goals.calories,
#                 "protein": goals.protein,
#                 "carbs": goals.carbs,
#                 "fat": goals.fat,
#                 "fiber": goals.fiber,
#                 "sugar": goals.sugar,
#                 "sodium": goals.sodium
#             },
#             "macroRatio": {
#                 "protein": protein_ratio,
#                 "carbs": carbs_ratio,
#                 "fat": fat_ratio
#             },
#             "isProfileBased": use_profile_based,
#             "createdAt": goals.created_at.isoformat(),
#             "nextSteps": [
#                 "开始记录您的饮食",
#                 "查看每日营养摄入进度",
#                 "根据需要调整营养目标"
#             ]
#         }
        
#         return make_response(201, "营养目标初始化成功", data=response_data)
        
#     except Exception as e:
#         db.session.rollback()
#         print(f"Error in initializing nutrition goals: {str(e)}")
#         return make_response(500, "初始化营养目标失败", error="INITIALIZATION_FAILED")

@nutrition_goals_bp.route('/goals/initialize', methods=['POST'])
def initialize_nutrition_goals():
    """为用户初始化营养目标或根据个人信息重新计算推荐目标"""
    data = request.json
    
    if not data or 'userId' not in data:
        return make_response(400, "缺少用户ID", error="INVALID_REQUEST")
    
    user_id = data['userId']
    use_profile_based = data.get('useProfileBased', False)
    
    # 检查用户是否存在
    user = User.query.get(user_id)
    if not user:
        return make_response(404, "用户不存在", error="USER_NOT_FOUND")
    
    try:
        # 查找现有的营养目标
        existing_goals = NutritionGoal.query.filter_by(user_id=user_id).first()
        
        # 初始化标志
        is_new_user = False
        
        if not existing_goals:
            # 如果不存在，创建新的营养目标
            goals = NutritionGoal(user_id=user_id)
            is_new_user = True
        else:
            # 如果已存在，重用现有的记录
            goals = existing_goals
        
        if use_profile_based:
            # 基于用户个人信息计算推荐目标
            profile = UserProfile.query.filter_by(user_id=user_id).first()
            
            if profile:
                recommended_goals = calculate_recommended_goals(profile)
                goals.calories = recommended_goals['calories']
                goals.protein = recommended_goals['protein']
                goals.carbs = recommended_goals['carbs']
                goals.fat = recommended_goals['fat']
            else:
                # 如果没有个人信息，使用默认值
                goals.calories = 2000
                goals.protein = 75
                goals.carbs = 250
                goals.fat = 65
        else:
            # 使用标准默认值
            goals.calories = 2000
            goals.protein = 75
            goals.carbs = 250
            goals.fat = 65
        
        # 设置其他营养素的默认值（如果是新用户或值为None）
        if is_new_user or goals.fiber is None:
            goals.fiber = 25
        if is_new_user or goals.sugar is None:
            goals.sugar = 50
        if is_new_user or goals.sodium is None:
            goals.sodium = 2300
        
        # 更新时间戳
        if is_new_user:
            goals.created_at = datetime.utcnow()
            db.session.add(goals)
        goals.last_updated = datetime.utcnow()
        
        db.session.commit()
        
        # 计算宏量营养素比例
        total_calories_from_macros = (goals.protein * 4) + (goals.carbs * 4) + (goals.fat * 9)
        
        if total_calories_from_macros > 0:
            protein_ratio = round((goals.protein * 4 / total_calories_from_macros) * 100, 1)
            carbs_ratio = round((goals.carbs * 4 / total_calories_from_macros) * 100, 1)
            fat_ratio = round((goals.fat * 9 / total_calories_from_macros) * 100, 1)
        else:
            protein_ratio = 25
            carbs_ratio = 45
            fat_ratio = 30
        
        # 构建响应数据
        response_data = {
            "userId": user_id,
            "goals": {
                "calories": goals.calories,
                "protein": goals.protein,
                "carbs": goals.carbs,
                "fat": goals.fat,
                "fiber": goals.fiber,
                "sugar": goals.sugar,
                "sodium": goals.sodium
            },
            "macroRatio": {
                "protein": protein_ratio,
                "carbs": carbs_ratio,
                "fat": fat_ratio
            },
            "isProfileBased": use_profile_based,
            "isNewUser": is_new_user,
            "lastUpdated": goals.last_updated.isoformat()
        }
        
        # 为新用户添加引导信息
        if is_new_user:
            response_data["createdAt"] = goals.created_at.isoformat()
            response_data["nextSteps"] = [
                "开始记录您的饮食",
                "查看每日营养摄入进度",
                "根据需要调整营养目标"
            ]
        
        success_message = "营养目标初始化成功" if is_new_user else "营养目标推荐更新成功"
        return make_response(201, success_message, data=response_data)
        
    except Exception as e:
        db.session.rollback()
        print(f"Error in initializing/updating nutrition goals: {str(e)}")
        return make_response(500, "处理营养目标失败", error="OPERATION_FAILED")

@nutrition_goals_bp.route('/goals', methods=['GET'])
def get_nutrition_goals():
    """获取用户营养目标"""
    user_id = request.args.get('userId')
    
    if not user_id:
        return make_response(400, "缺少用户ID", error="INVALID_REQUEST")
    
    # 检查用户是否存在
    user = User.query.get(user_id)
    if not user:
        return make_response(404, "用户不存在", error="USER_NOT_FOUND")
    
    # 查询用户的营养目标
    goals = NutritionGoal.query.filter_by(user_id=user_id).first()
    
    if not goals:
        return make_response(404, "未找到用户营养目标", error="GOALS_NOT_FOUND")
    
    try:
        # 计算宏量营养素比例
        total_calories_from_macros = (goals.protein * 4) + (goals.carbs * 4) + (goals.fat * 9)
        
        if total_calories_from_macros > 0:
            protein_ratio = round((goals.protein * 4 / total_calories_from_macros) * 100, 1)
            carbs_ratio = round((goals.carbs * 4 / total_calories_from_macros) * 100, 1)
            fat_ratio = round((goals.fat * 9 / total_calories_from_macros) * 100, 1)
        else:
            protein_ratio = 0
            carbs_ratio = 0
            fat_ratio = 0
        
        # 构建响应数据
        response_data = {
            "userId": user_id,
            "goals": {
                "calories": goals.calories,
                "protein": goals.protein,
                "carbs": goals.carbs,
                "fat": goals.fat,
                "fiber": goals.fiber,
                "sugar": goals.sugar,
                "sodium": goals.sodium
            },
            "macroRatio": {
                "protein": protein_ratio,
                "carbs": carbs_ratio,
                "fat": fat_ratio
            },
            "lastUpdated": goals.last_updated.isoformat()
        }
        
        return make_response(200, "获取成功", data=response_data)
        
    except Exception as e:
        print(f"Error in getting nutrition goals: {str(e)}")
        return make_response(500, "获取营养目标失败", error="FETCH_FAILED")

@nutrition_goals_bp.route('/goals', methods=['PUT'])
def update_nutrition_goals():
    """更新用户营养目标"""
    data = request.json
    
    if not data or 'userId' not in data or 'goals' not in data:
        return make_response(400, "请求参数不完整", error="INVALID_REQUEST")
    
    user_id = data['userId']
    goals_data = data['goals']
    
    # 检查用户是否存在
    user = User.query.get(user_id)
    if not user:
        return make_response(404, "用户不存在", error="USER_NOT_FOUND")
    
    # 验证营养目标值
    for key, value in goals_data.items():
        if value <= 0:
            return make_response(400, "营养目标值必须为正数", error="INVALID_GOAL_VALUE")
    
    try:
        # 查找或创建用户的营养目标
        goals = NutritionGoal.query.filter_by(user_id=user_id).first()
        
        if not goals:
            goals = NutritionGoal(user_id=user_id)
            db.session.add(goals)
        
        # 更新营养目标
        goals.calories = goals_data.get('calories', goals.calories)
        goals.protein = goals_data.get('protein', goals.protein)
        goals.carbs = goals_data.get('carbs', goals.carbs)
        goals.fat = goals_data.get('fat', goals.fat)
        goals.fiber = goals_data.get('fiber', goals.fiber)
        goals.sugar = goals_data.get('sugar', goals.sugar)
        goals.sodium = goals_data.get('sodium', goals.sodium)
        goals.last_updated = datetime.utcnow()
        
        db.session.commit()
        
        # 计算宏量营养素比例
        total_calories_from_macros = (goals.protein * 4) + (goals.carbs * 4) + (goals.fat * 9)
        
        if total_calories_from_macros > 0:
            protein_ratio = round((goals.protein * 4 / total_calories_from_macros) * 100, 1)
            carbs_ratio = round((goals.carbs * 4 / total_calories_from_macros) * 100, 1)
            fat_ratio = round((goals.fat * 9 / total_calories_from_macros) * 100, 1)
        else:
            protein_ratio = 0
            carbs_ratio = 0
            fat_ratio = 0
        
        # 构建响应数据
        response_data = {
            "userId": user_id,
            "goals": {
                "calories": goals.calories,
                "protein": goals.protein,
                "carbs": goals.carbs,
                "fat": goals.fat,
                "fiber": goals.fiber,
                "sugar": goals.sugar,
                "sodium": goals.sodium
            },
            "macroRatio": {
                "protein": protein_ratio,
                "carbs": carbs_ratio,
                "fat": fat_ratio
            },
            "lastUpdated": goals.last_updated.isoformat()
        }
        
        return make_response(200, "更新成功", data=response_data)
        
    except Exception as e:
        db.session.rollback()
        print(f"Error in updating nutrition goals: {str(e)}")
        return make_response(500, "更新营养目标失败", error="UPDATE_FAILED")

@nutrition_goals_bp.route('/profile', methods=['GET'])
def get_user_profile():
    """获取用户个人信息"""
    user_id = request.args.get('userId')
    
    if not user_id:
        return make_response(400, "缺少用户ID", error="INVALID_REQUEST")
    
    # 检查用户是否存在
    user = User.query.get(user_id)
    if not user:
        return make_response(404, "用户不存在", error="USER_NOT_FOUND")
    
    # 查询用户的个人信息
    profile = UserProfile.query.filter_by(user_id=user_id).first()
    
    if not profile:
        return make_response(404, "未找到用户个人信息", error="PROFILE_NOT_FOUND")
    
    try:
        # 解析饮食限制
        dietary_restrictions = profile.dietary_restrictions.split(',') if profile.dietary_restrictions else ["none"]
        
        # 构建响应数据
        response_data = {
            "userId": user_id,
            "gender": profile.gender,
            "age": profile.age,
            "height": profile.height,
            "weight": profile.weight,
            "activityLevel": profile.activity_level,
            "goal": profile.goal,
            "dietaryRestrictions": dietary_restrictions,
            "lastUpdated": profile.last_updated.isoformat()
        }
        
        return make_response(200, "获取成功", data=response_data)
        
    except Exception as e:
        print(f"Error in getting user profile: {str(e)}")
        return make_response(500, "获取用户个人信息失败", error="FETCH_FAILED")

@nutrition_goals_bp.route('/profile', methods=['PUT'])
def update_user_profile():
    """更新用户个人信息"""
    data = request.json
    
    if not data or 'userId' not in data:
        return make_response(400, "请求参数不完整", error="INVALID_REQUEST")
    
    user_id = data['userId']
    
    # 检查用户是否存在
    user = User.query.get(user_id)
    if not user:
        return make_response(404, "用户不存在", error="USER_NOT_FOUND")
    
    # 验证活动水平
    valid_activity_levels = ['sedentary', 'light', 'moderate', 'active', 'very_active']
    if 'activityLevel' in data and data['activityLevel'] not in valid_activity_levels:
        return make_response(400, "无效的活动水平值", error="INVALID_ACTIVITY_LEVEL")
    
    # 验证目标
    valid_goals = ['maintain', 'lose_weight', 'gain_weight', 'gain_muscle']
    if 'goal' in data and data['goal'] not in valid_goals:
        return make_response(400, "无效的目标值", error="INVALID_GOAL")
    
    try:
        # 查找或创建用户的个人信息
        profile = UserProfile.query.filter_by(user_id=user_id).first()
        
        if not profile:
            profile = UserProfile(user_id=user_id)
            db.session.add(profile)
        
        # 更新个人信息
        if 'gender' in data:
            profile.gender = data['gender']
        if 'age' in data:
            profile.age = data['age']
        if 'height' in data:
            profile.height = data['height']
        if 'weight' in data:
            profile.weight = data['weight']
        if 'activityLevel' in data:
            profile.activity_level = data['activityLevel']
        if 'goal' in data:
            profile.goal = data['goal']
        if 'dietaryRestrictions' in data:
            profile.dietary_restrictions = ','.join(data['dietaryRestrictions'])
        
        profile.last_updated = datetime.utcnow()
        
        db.session.commit()
        
        # 计算推荐的营养目标
        recommended_goals = calculate_recommended_goals(profile)
        
        # 解析饮食限制
        dietary_restrictions = profile.dietary_restrictions.split(',') if profile.dietary_restrictions else ["none"]
        
        # 构建响应数据
        response_data = {
            "userId": user_id,
            "gender": profile.gender,
            "age": profile.age,
            "height": profile.height,
            "weight": profile.weight,
            "activityLevel": profile.activity_level,
            "goal": profile.goal,
            "dietaryRestrictions": dietary_restrictions,
            "lastUpdated": profile.last_updated.isoformat(),
            "recommendedGoals": recommended_goals
        }
        
        return make_response(200, "更新成功", data=response_data)
        
    except Exception as e:
        db.session.rollback()
        print(f"Error in updating user profile: {str(e)}")
        return make_response(500, "更新用户个人信息失败", error="UPDATE_FAILED")

def calculate_recommended_goals(profile):
    """根据用户个人信息计算推荐的营养目标"""
    # 基础代谢率(BMR)计算 - 使用Harris-Benedict公式
    if profile.gender == 'male':
        bmr = 88.362 + (13.397 * profile.weight) + (4.799 * profile.height) - (5.677 * profile.age)
    else:  # female
        bmr = 447.593 + (9.247 * profile.weight) + (3.098 * profile.height) - (4.330 * profile.age)
    
    # 根据活动水平调整
    activity_multipliers = {
        'sedentary': 1.2,      # 久坐不动
        'light': 1.375,        # 轻度活动（每周1-3天）
        'moderate': 1.55,      # 中度活动（每周3-5天）
        'active': 1.725,       # 积极活动（每周6-7天）
        'very_active': 1.9     # 非常积极活动（每天2次）
    }
    
    tdee = bmr * activity_multipliers.get(profile.activity_level, 1.2)
    
    # 根据目标调整卡路里
    goal_adjustments = {
        'maintain': 0,          # 维持体重
        'lose_weight': -500,    # 减重（每周减约0.5kg）
        'gain_weight': 500,     # 增重（每周增约0.5kg）
        'gain_muscle': 300      # 增肌（适度热量盈余）
    }
    
    calories = tdee + goal_adjustments.get(profile.goal, 0)
    calories = max(1200, round(calories))  # 确保最低卡路里
    
    # 计算宏量营养素
    if profile.goal == 'gain_muscle':
        # 增肌：高蛋白
        protein_ratio = 0.3  # 30%
        fat_ratio = 0.25     # 25%
        carbs_ratio = 0.45   # 45%
    elif profile.goal == 'lose_weight':
        # 减重：适度高蛋白，低碳水
        protein_ratio = 0.35  # 35%
        fat_ratio = 0.3      # 30%
        carbs_ratio = 0.35   # 35%
    else:
        # 维持/增重：平衡配比
        protein_ratio = 0.25  # 25%
        fat_ratio = 0.3      # 30%
        carbs_ratio = 0.45   # 45%
    
    # 计算各宏量营养素的卡路里
    protein_calories = calories * protein_ratio
    fat_calories = calories * fat_ratio
    carbs_calories = calories * carbs_ratio
    
    # 转换为克数
    protein = round(protein_calories / 4)  # 1g蛋白质 = 4卡路里
    fat = round(fat_calories / 9)          # 1g脂肪 = 9卡路里
    carbs = round(carbs_calories / 4)      # 1g碳水 = 4卡路里
    
    return {
        "calories": calories,
        "protein": protein,
        "carbs": carbs,
        "fat": fat
    }

@nutrition_goals_bp.route('/daily-intake', methods=['GET'])
def get_daily_intake():
    """获取今日营养摄入"""
    user_id = request.args.get('userId')
    date_str = request.args.get('date')
    
    if not user_id:
        return make_response(400, "缺少用户ID", error="INVALID_REQUEST")
    
    # 检查用户是否存在
    user = User.query.get(user_id)
    if not user:
        return make_response(404, "用户不存在", error="USER_NOT_FOUND")
    
    try:
        # 解析日期，默认为今天
        if date_str:
            date_obj = datetime.strptime(date_str, '%Y-%m-%d').date()
        else:
            date_obj = date.today()
        
        # 查询当日摄入记录
        daily_intake = DailyIntake.query.filter_by(user_id=user_id, date=date_obj).first()
        
        # 获取用户的营养目标
        goals = NutritionGoal.query.filter_by(user_id=user_id).first()
        
        if not goals:
            # 使用默认目标
            goals_data = {
                "calories": 2000,
                "protein": 75,
                "carbs": 250,
                "fat": 65,
                "fiber": 25,
                "sugar": 50,
                "sodium": 2300
            }
        else:
            goals_data = {
                "calories": goals.calories,
                "protein": goals.protein,
                "carbs": goals.carbs,
                "fat": goals.fat,
                "fiber": goals.fiber,
                "sugar": goals.sugar,
                "sodium": goals.sodium
            }
        
        # 初始化总计
        totals = {
            "calories": 0,
            "protein": 0,
            "carbs": 0,
            "fat": 0,
            "fiber": 0,
            "sugar": 0,
            "sodium": 0
        }
        
        meals_data = []
        
        if daily_intake:
            # 获取当日的所有餐次
            meals = Meal.query.filter_by(daily_intake_id=daily_intake.id).all()
            
            for meal in meals:
                # 获取餐次中的所有食物
                food_entries = FoodEntry.query.filter_by(meal_id=meal.id).all()
                
                meal_totals = {
                    "calories": 0,
                    "protein": 0,
                    "carbs": 0,
                    "fat": 0,
                    "fiber": 0,
                    "sugar": 0,
                    "sodium": 0
                }
                
                foods_data = []
                
                for entry in food_entries:
                    # 获取食物信息
                    food = Food.query.get(entry.food_id)
                    
                    food_data = {
                        "id": entry.id,
                        "foodId": entry.food_id,
                        "name": food.name if food else "未知食物",
                        "amount": entry.amount,
                        "weight": entry.weight,
                        "calories": entry.calories,
                        "protein": entry.protein,
                        "carbs": entry.carbs,
                        "fat": entry.fat,
                        "fiber": entry.fiber,
                        "sugar": entry.sugar,
                        "sodium": entry.sodium
                    }
                    
                    foods_data.append(food_data)
                    
                    # 累加营养成分
                    meal_totals["calories"] += entry.calories or 0
                    meal_totals["protein"] += entry.protein or 0
                    meal_totals["carbs"] += entry.carbs or 0
                    meal_totals["fat"] += entry.fat or 0
                    meal_totals["fiber"] += entry.fiber or 0
                    meal_totals["sugar"] += entry.sugar or 0
                    meal_totals["sodium"] += entry.sodium or 0
                
                # 累加到总计
                for key in totals:
                    totals[key] += meal_totals[key]
                
                meal_data = {
                    "id": meal.id,
                    "name": meal.name,
                    "time": meal.time,
                    "foods": foods_data,
                    "totals": meal_totals
                }
                
                meals_data.append(meal_data)
        
        # 计算目标完成百分比
        percentages = {}
        for key in totals:
            if goals_data[key] > 0:
                percentages[key] = round((totals[key] / goals_data[key]) * 100, 1)
            else:
                percentages[key] = 0
        
        # 构建响应数据
        response_data = {
            "userId": user_id,
            "date": date_obj.strftime('%Y-%m-%d'),
            "meals": meals_data,
            "totals": totals,
            "goals": goals_data,
            "percentages": percentages
        }
        
        return make_response(200, "获取成功", data=response_data)
        
    except ValueError:
        return make_response(400, "无效的日期格式", error="INVALID_DATE_FORMAT")
    except Exception as e:
        print(f"Error in getting daily intake: {str(e)}")
        return make_response(500, "获取每日摄入失败", error="FETCH_FAILED")
    
@nutrition_goals_bp.route('/daily-intake/meal/<meal_id>', methods=['DELETE'])
def delete_meal(meal_id):
    """删除餐次及其所有食物记录"""
    user_id = request.args.get('userId')
    
    if not user_id:
        return make_response(400, "缺少用户ID", error="INVALID_REQUEST")
    
    # 检查用户是否存在
    user = User.query.get(user_id)
    if not user:
        return make_response(404, "用户不存在", error="USER_NOT_FOUND")
    
    # 查找餐次
    meal = Meal.query.get(meal_id)
    if not meal:
        return make_response(404, "未找到指定的餐次", error="MEAL_NOT_FOUND")
    
    try:
        # 验证餐次属于当前用户
        daily_intake = DailyIntake.query.filter_by(
            id=meal.daily_intake_id, 
            user_id=user_id
        ).first()
        
        if not daily_intake:
            return make_response(403, "无权限删除此餐次", error="PERMISSION_DENIED")
        
        # 记录删除信息
        meal_name = meal.name
        food_count = len(FoodEntry.query.filter_by(meal_id=meal_id).all())
        
        # 删除餐次中的所有食物记录
        FoodEntry.query.filter_by(meal_id=meal_id).delete()
        
        # 删除餐次
        db.session.delete(meal)
        db.session.commit()
        
        # 构建响应数据
        response_data = {
            "deletedMealId": meal_id,
            "deletedMealName": meal_name,
            "deletedFoodCount": food_count
        }
        
        return make_response(200, f"餐次 \"{meal_name}\" 已删除", data=response_data)
        
    except Exception as e:
        db.session.rollback()
        print(f"Error in deleting meal: {str(e)}")
        return make_response(500, "删除餐次失败", error="DELETE_FAILED")

@nutrition_goals_bp.route('/daily-intake/food/<food_entry_id>', methods=['DELETE'])  
def delete_food_entry_updated(food_entry_id):
    """删除单个食物记录"""
    user_id = request.args.get('userId')
    
    if not user_id:
        return make_response(400, "缺少用户ID", error="INVALID_REQUEST")
    
    # 检查用户是否存在
    user = User.query.get(user_id)
    if not user:
        return make_response(404, "用户不存在", error="USER_NOT_FOUND")
    
    # 查找食物记录
    food_entry = FoodEntry.query.get(food_entry_id)
    if not food_entry:
        return make_response(404, "未找到指定的食物记录", error="FOOD_ENTRY_NOT_FOUND")
    
    try:
        # 验证食物记录属于当前用户
        meal = Meal.query.get(food_entry.meal_id)
        if not meal:
            return make_response(404, "餐次不存在", error="MEAL_NOT_FOUND")
            
        daily_intake = DailyIntake.query.filter_by(
            id=meal.daily_intake_id, 
            user_id=user_id
        ).first()
        
        if not daily_intake:
            return make_response(403, "无权限删除此食物记录", error="PERMISSION_DENIED")
        
        # 获取食物信息
        food = Food.query.get(food_entry.food_id)
        food_name = food.name if food else "未知食物"
        
        # 获取餐次ID（用于重新计算）
        meal_id = food_entry.meal_id
        
        # 删除食物记录
        db.session.delete(food_entry)
        db.session.commit()
        
        # 重新计算餐次总计
        remaining_entries = FoodEntry.query.filter_by(meal_id=meal_id).all()
        
        meal_totals = {
            "calories": sum(entry.calories or 0 for entry in remaining_entries),
            "protein": sum(entry.protein or 0 for entry in remaining_entries),
            "carbs": sum(entry.carbs or 0 for entry in remaining_entries),
            "fat": sum(entry.fat or 0 for entry in remaining_entries),
            "fiber": sum(entry.fiber or 0 for entry in remaining_entries),
            "sugar": sum(entry.sugar or 0 for entry in remaining_entries),
            "sodium": sum(entry.sodium or 0 for entry in remaining_entries)
        }
        
        # 重新计算当日总计
        all_meals = Meal.query.filter_by(daily_intake_id=daily_intake.id).all()
        all_entries = []
        
        for m in all_meals:
            entries = FoodEntry.query.filter_by(meal_id=m.id).all()
            all_entries.extend(entries)
        
        daily_totals = {
            "calories": sum(entry.calories or 0 for entry in all_entries),
            "protein": sum(entry.protein or 0 for entry in all_entries),
            "carbs": sum(entry.carbs or 0 for entry in all_entries),
            "fat": sum(entry.fat or 0 for entry in all_entries),
            "fiber": sum(entry.fiber or 0 for entry in all_entries),
            "sugar": sum(entry.sugar or 0 for entry in all_entries),
            "sodium": sum(entry.sodium or 0 for entry in all_entries)
        }
        
        # 构建响应数据
        response_data = {
            "deletedFoodEntryId": food_entry_id,
            "deletedFoodName": food_name,
            "mealId": meal_id,
            "mealTotals": meal_totals,
            "dailyTotals": daily_totals
        }
        
        return make_response(200, f"食物记录 \"{food_name}\" 已删除", data=response_data)
        
    except Exception as e:
        db.session.rollback()
        print(f"Error in deleting food entry: {str(e)}")
        return make_response(500, "删除食物记录失败", error="DELETE_FAILED")

@nutrition_goals_bp.route('/daily-intake/add-food', methods=['POST'])
def add_food_to_daily_intake():
    """添加食物到每日记录"""
    data = request.json
    
    if not data or 'userId' not in data or 'date' not in data or 'mealId' not in data or 'food' not in data:
        return make_response(400, "请求参数不完整", error="INVALID_REQUEST")
    
    user_id = data['userId']
    date_str = data['date']
    meal_id = data['mealId']
    food_data = data['food']
    
    # 检查用户是否存在
    user = User.query.get(user_id)
    if not user:
        return make_response(404, "用户不存在", error="USER_NOT_FOUND")
    
    # 检查食物是否存在
    food_id = food_data.get('foodId')
    food = Food.query.get(food_id)
    if not food:
        return make_response(404, "未找到指定的食物", error="FOOD_NOT_FOUND")
    
    try:
        # 解析日期
        date_obj = datetime.strptime(date_str, '%Y-%m-%d').date()
        
        # 查找或创建当日摄入记录
        daily_intake = DailyIntake.query.filter_by(user_id=user_id, date=date_obj).first()
        if not daily_intake:
            daily_intake = DailyIntake(user_id=user_id, date=date_obj)
            db.session.add(daily_intake)
            db.session.flush()  # 获取ID但不提交
        
        # 查找指定的餐次
        meal = Meal.query.get(meal_id)
        if not meal:
            logging.warning(f"meal_id {meal_id}, daily_intake_id {daily_intake.id}")
            return make_response(404, "未找到指定的餐次", error="MEAL_NOT_FOUND")
        # 验证餐
        
        # 获取食物的营养信息
        nutrition = food.nutrition
        
        # 计算基于重量的营养成分
        weight = food_data.get('weight', 100)  # 默认100g
        amount = food_data.get('amount', '1份')
        
        if nutrition:
            # 假设营养信息基于100g
            weight_ratio = weight / 100
            
            calories = nutrition.calories * weight_ratio if nutrition.calories else 0
            protein = nutrition.protein * weight_ratio if nutrition.protein else 0
            carbs = nutrition.carbs * weight_ratio if nutrition.carbs else 0
            fat = nutrition.fat * weight_ratio if nutrition.fat else 0
            fiber = nutrition.fiber * weight_ratio if nutrition.fiber else 0
            sugar = nutrition.sugar * weight_ratio if nutrition.sugar else 0
            sodium = nutrition.sodium * weight_ratio if nutrition.sodium else 0
        else:
            # 如果没有营养信息，使用默认值或0
            calories = 0
            protein = 0
            carbs = 0
            fat = 0
            fiber = 0
            sugar = 0
            sodium = 0
        
        # 创建食物记录
        food_entry = FoodEntry(
            meal_id=meal.id,
            food_id=food_id,
            amount=amount,
            weight=weight,
            calories=calories,
            protein=protein,
            carbs=carbs,
            fat=fat,
            fiber=fiber,
            sugar=sugar,
            sodium=sodium
        )
        db.session.add(food_entry)
        db.session.flush()  # 获取ID但不提交
        
        # 计算餐次总计
        meal_entries = FoodEntry.query.filter_by(meal_id=meal.id).all()
        meal_entries.append(food_entry)  # 添加新记录
        
        meal_totals = {
            "calories": sum(entry.calories or 0 for entry in meal_entries),
            "protein": sum(entry.protein or 0 for entry in meal_entries),
            "carbs": sum(entry.carbs or 0 for entry in meal_entries),
            "fat": sum(entry.fat or 0 for entry in meal_entries),
            "fiber": sum(entry.fiber or 0 for entry in meal_entries),
            "sugar": sum(entry.sugar or 0 for entry in meal_entries),
            "sodium": sum(entry.sodium or 0 for entry in meal_entries)
        }
        
        # 计算每日总计
        all_meals = Meal.query.filter_by(daily_intake_id=daily_intake.id).all()
        all_entries = []
        
        for m in all_meals:
            entries = FoodEntry.query.filter_by(meal_id=m.id).all()
            all_entries.extend(entries)
        
        daily_totals = {
            "calories": sum(entry.calories or 0 for entry in all_entries) + calories,
            "protein": sum(entry.protein or 0 for entry in all_entries) + protein,
            "carbs": sum(entry.carbs or 0 for entry in all_entries) + carbs,
            "fat": sum(entry.fat or 0 for entry in all_entries) + fat,
            "fiber": sum(entry.fiber or 0 for entry in all_entries) + fiber,
            "sugar": sum(entry.sugar or 0 for entry in all_entries) + sugar,
            "sodium": sum(entry.sodium or 0 for entry in all_entries) + sodium
        }
        
        # 获取用户的营养目标
        goals = NutritionGoal.query.filter_by(user_id=user_id).first()
        
        # 计算目标完成百分比
        percentages = {}
        if goals:
            for key in daily_totals:
                goal_value = getattr(goals, key, 0)
                if goal_value > 0:
                    percentages[key] = round((daily_totals[key] / goal_value) * 100, 1)
                else:
                    percentages[key] = 0
        else:
            # 使用默认目标
            default_goals = {
                "calories": 2000,
                "protein": 75,
                "carbs": 250,
                "fat": 65,
                "fiber": 25,
                "sugar": 50,
                "sodium": 2300
            }
            
            for key in daily_totals:
                if default_goals.get(key, 0) > 0:
                    percentages[key] = round((daily_totals[key] / default_goals[key]) * 100, 1)
                else:
                    percentages[key] = 0
        
        db.session.commit()
        
        # 构建响应数据
        response_data = {
            "foodEntry": {
                "id": food_entry.id,
                "foodId": food_id,
                "name": food.name,
                "amount": amount,
                "weight": weight,
                "calories": calories,
                "protein": protein,
                "carbs": carbs,
                "fat": fat,
                "fiber": fiber,
                "sugar": sugar,
                "sodium": sodium
            },
            "mealTotals": meal_totals,
            "dailyTotals": daily_totals,
            "percentages": percentages
        }
        
        return make_response(200, "添加成功", data=response_data)
        
    except ValueError:
        return make_response(400, "无效的日期格式", error="INVALID_DATE_FORMAT")
    except Exception as e:
        db.session.rollback()
        print(f"Error in adding food to daily intake: {str(e)}")
        return make_response(500, "添加食物失败", error="ADD_FAILED")

@nutrition_goals_bp.route('/daily-intake/add-meal', methods=['POST'])
def add_meal():
    """创建新餐次"""
    data = request.json
    
    if not data or 'userId' not in data or 'date' not in data or 'meal' not in data:
        return make_response(400, "请求参数不完整", error="INVALID_REQUEST")
    
    user_id = data['userId']
    date_str = data['date']
    meal_data = data['meal']
    
    # 检查用户是否存在
    user = User.query.get(user_id)
    if not user:
        return make_response(404, "用户不存在", error="USER_NOT_FOUND")
    
    # 验证餐次名称
    if 'name' not in meal_data or not meal_data['name']:
        return make_response(400, "餐次名称不能为空", error="INVALID_MEAL_NAME")
    
    try:
        # 解析日期
        date_obj = datetime.strptime(date_str, '%Y-%m-%d').date()
        
        # 查找或创建当日摄入记录
        daily_intake = DailyIntake.query.filter_by(user_id=user_id, date=date_obj).first()
        if not daily_intake:
            daily_intake = DailyIntake(user_id=user_id, date=date_obj)
            db.session.add(daily_intake)
            db.session.flush()  # 获取ID但不提交
        
        # 创建新餐次
        meal = Meal(
            daily_intake_id=daily_intake.id,
            name=meal_data['name'],
            time=meal_data.get('time')
        )
        db.session.add(meal)
        db.session.commit()
        
        # 构建响应数据
        response_data = {
            "meal": {
                "id": meal.id,
                "name": meal.name,
                "time": meal.time,
                "foods": [],
                "totals": {
                    "calories": 0,
                    "protein": 0,
                    "carbs": 0,
                    "fat": 0,
                    "fiber": 0,
                    "sugar": 0,
                    "sodium": 0
                }
            }
        }
        
        return make_response(201, "创建成功", data=response_data)
        
    except ValueError:
        return make_response(400, "无效的日期格式", error="INVALID_DATE_FORMAT")
    except Exception as e:
        db.session.rollback()
        print(f"Error in adding meal: {str(e)}")
        return make_response(500, "创建餐次失败", error="CREATE_FAILED")

@nutrition_goals_bp.route('/daily-intake/food/<food_entry_id>', methods=['DELETE'])
def delete_food_entry(food_entry_id):
    """删除食物记录"""
    user_id = request.args.get('userId')
    
    if not user_id:
        return make_response(400, "缺少用户ID", error="INVALID_REQUEST")
    
    # 检查用户是否存在
    user = User.query.get(user_id)
    if not user:
        return make_response(404, "用户不存在", error="USER_NOT_FOUND")
    
    # 查找食物记录
    food_entry = FoodEntry.query.get(food_entry_id)
    if not food_entry:
        return make_response(404, "未找到指定的食物记录", error="FOOD_ENTRY_NOT_FOUND")
    
    try:
        # 获取餐次ID
        meal_id = food_entry.meal_id
        
        # 删除食物记录
        db.session.delete(food_entry)
        db.session.commit()
        
        # 重新计算餐次总计
        meal_entries = FoodEntry.query.filter_by(meal_id=meal_id).all()
        
        meal_totals = {
            "calories": sum(entry.calories or 0 for entry in meal_entries),
            "protein": sum(entry.protein or 0 for entry in meal_entries),
            "carbs": sum(entry.carbs or 0 for entry in meal_entries),
            "fat": sum(entry.fat or 0 for entry in meal_entries),
            "fiber": sum(entry.fiber or 0 for entry in meal_entries),
            "sugar": sum(entry.sugar or 0 for entry in meal_entries),
            "sodium": sum(entry.sodium or 0 for entry in meal_entries)
        }
        
        # 获取餐次所属的每日摄入记录
        meal = Meal.query.get(meal_id)
        daily_intake_id = meal.daily_intake_id
        
        # 计算每日总计
        all_meals = Meal.query.filter_by(daily_intake_id=daily_intake_id).all()
        all_entries = []
        
        for m in all_meals:
            entries = FoodEntry.query.filter_by(meal_id=m.id).all()
            all_entries.extend(entries)
        
        daily_totals = {
            "calories": sum(entry.calories or 0 for entry in all_entries),
            "protein": sum(entry.protein or 0 for entry in all_entries),
            "carbs": sum(entry.carbs or 0 for entry in all_entries),
            "fat": sum(entry.fat or 0 for entry in all_entries),
            "fiber": sum(entry.fiber or 0 for entry in all_entries),
            "sugar": sum(entry.sugar or 0 for entry in all_entries),
            "sodium": sum(entry.sodium or 0 for entry in all_entries)
        }
        
        # 构建响应数据
        response_data = {
            "mealId": meal_id,
            "mealTotals": meal_totals,
            "dailyTotals": daily_totals
        }
        
        return make_response(200, "删除成功", data=response_data)
        
    except Exception as e:
        db.session.rollback()
        print(f"Error in deleting food entry: {str(e)}")
        return make_response(500, "删除食物记录失败", error="DELETE_FAILED")

@nutrition_goals_bp.route('/history', methods=['GET'])
def get_nutrition_history():
    """获取营养摄入历史数据"""
    user_id = request.args.get('userId')
    start_date_str = request.args.get('startDate')
    end_date_str = request.args.get('endDate')
    nutrient = request.args.get('nutrient')
    
    if not user_id or not start_date_str or not end_date_str:
        return make_response(400, "缺少必要参数", error="INVALID_REQUEST")
    
    # 检查用户是否存在
    user = User.query.get(user_id)
    if not user:
        return make_response(404, "用户不存在", error="USER_NOT_FOUND")
    
    try:
        # 解析日期
        start_date = datetime.strptime(start_date_str, '%Y-%m-%d').date()
        end_date = datetime.strptime(end_date_str, '%Y-%m-%d').date()
        
        # 检查日期范围
        date_range = (end_date - start_date).days + 1
        if date_range > 31:
            return make_response(400, "日期范围不能超过31天", error="INVALID_DATE_RANGE")
        
        # 获取用户的营养目标
        goals = NutritionGoal.query.filter_by(user_id=user_id).first()
        
        if not goals:
            # 使用默认目标
            goals_data = {
                "calories": 2000,
                "protein": 75,
                "carbs": 250,
                "fat": 60,
                "fiber": 25,
                "sugar": 50,
                "sodium": 2300
            }
        else:
            goals_data = {
                "calories": goals.calories,
                "protein": goals.protein,
                "carbs": goals.carbs,
                "fat": goals.fat,
                "fiber": goals.fiber,
                "sugar": goals.sugar,
                "sodium": goals.sodium,
            }
        
        # 查询日期范围内的每日摄入记录
        daily_intakes = DailyIntake.query.filter(
            DailyIntake.user_id == user_id,
            DailyIntake.date >= start_date,
            DailyIntake.date <= end_date
        ).order_by(DailyIntake.date).all()
        
        # 创建日期范围内的所有日期的字典
        date_range_dict = {}
        current_date = start_date
        while current_date <= end_date:
            date_str = current_date.strftime('%Y-%m-%d')
            date_range_dict[date_str] = {
                "date": date_str,
                "calories": 0,
                "protein": 0,
                "carbs": 0,
                "fat": 0,
                "fiber": 0,
                "sugar": 0,
                "sodium": 0,
                "goalAchieved": False
            }
            current_date += timedelta(days=1)
        
        # 填充实际数据
        for intake in daily_intakes:
            date_str = intake.date.strftime('%Y-%m-%d')
            
            # 获取该日所有餐次
            meals = Meal.query.filter_by(daily_intake_id=intake.id).all()
            
            # 计算该日总营养摄入
            daily_totals = {
                "calories": 0,
                "protein": 0,
                "carbs": 0,
                "fat": 0,
                "fiber": 0,
                "sugar": 0,
                "sodium": 0
            }
            
            for meal in meals:
                # 获取餐次中的所有食物
                food_entries = FoodEntry.query.filter_by(meal_id=meal.id).all()
                
                for entry in food_entries:
                    daily_totals["calories"] += entry.calories or 0
                    daily_totals["protein"] += entry.protein or 0
                    daily_totals["carbs"] += entry.carbs or 0
                    daily_totals["fat"] += entry.fat or 0
                    daily_totals["fiber"] += entry.fiber or 0
                    daily_totals["sugar"] += entry.sugar or 0
                    daily_totals["sodium"] += entry.sodium or 0
            
            # 判断是否达成目标
            goal_achieved = (
                daily_totals["calories"] <= goals_data["calories"] * 2 and
                daily_totals["calories"] >= goals_data["calories"] * 0.8 and
                daily_totals["protein"] >= goals_data["protein"] * 0.8 and
                daily_totals["carbs"] >= goals_data["carbs"] * 0.8
            )
            
            # 更新日期字典
            date_range_dict[date_str] = {
                "date": date_str,
                "calories": round(daily_totals["calories"]),
                "protein": round(daily_totals["protein"]),
                "carbs": round(daily_totals["carbs"]),
                "fat": round(daily_totals["fat"]),
                "goalAchieved": goal_achieved
            }
        
        # 转换为列表
        daily_data = list(date_range_dict.values())
        
        # 计算平均值
        if daily_data:
            averages = {
                "calories": round(sum(day["calories"] for day in daily_data) / len(daily_data)),
                "protein": round(sum(day["protein"] for day in daily_data) / len(daily_data), 1),
                "carbs": round(sum(day["carbs"] for day in daily_data) / len(daily_data), 1),
                "fat": round(sum(day["fat"] for day in daily_data) / len(daily_data), 1)
            }
        else:
            averages = {
                "calories": 0,
                "protein": 0,
                "carbs": 0,
                "fat": 0
            }
        
        # 计算目标达成率
        goal_achievement_rate = {
            "calories": round(sum(1 for day in daily_data if day["goalAchieved"]) / len(daily_data) * 100, 1) if daily_data else 0,
            "protein": round(sum(1 for day in daily_data if day["protein"] >= goals_data["protein"] * 0.9) / len(daily_data) * 100, 1) if daily_data else 0,
            "carbs": round(sum(1 for day in daily_data if day["carbs"] >= goals_data["carbs"] * 1.1) / len(daily_data) * 100, 1) if daily_data else 0,
            "fat": round(sum(1 for day in daily_data if day["fat"] >= goals_data["fat"] * 1.1) / len(daily_data) * 100, 1) if daily_data else 0
        }
        
        # 构建响应数据
        response_data = {
            "userId": user_id,
            "startDate": start_date_str,
            "endDate": end_date_str,
            "daily": daily_data,
            "averages": averages,
            "goals": goals_data,
            "goalAchievementRate": goal_achievement_rate
        }
        
        return make_response(200, "获取成功", data=response_data)
        
    except ValueError:
        return make_response(400, "无效的日期格式", error="INVALID_DATE_FORMAT")
    except Exception as e:
        print(f"Error in getting nutrition history: {str(e)}")
        return make_response(500, "获取营养历史数据失败", error="FETCH_FAILED")

@nutrition_goals_bp.route('/recommendations', methods=['GET'])
def get_recommendations():
    """获取营养建议"""
    user_id = request.args.get('userId')
    date_str = request.args.get('date')
    
    if not user_id:
        return make_response(400, "缺少用户ID", error="INVALID_REQUEST")
    
    # 检查用户是否存在
    user = User.query.get(user_id)
    if not user:
        return make_response(404, "用户不存在", error="USER_NOT_FOUND")
    
    try:
        # 解析日期，默认为今天
        if date_str:
            date_obj = datetime.strptime(date_str, '%Y-%m-%d').date()
        else:
            date_obj = date.today()
        
        # 查询当日摄入记录
        daily_intake = DailyIntake.query.filter_by(user_id=user_id, date=date_obj).first()
        
        if not daily_intake:
            return make_response(404, "未找到当日摄入记录", error="INTAKE_NOT_FOUND")
        
        # 获取用户的营养目标
        goals = NutritionGoal.query.filter_by(user_id=user_id).first()
        
        if not goals:
            # 使用默认目标
            goals_data = {
                "calories": 2000,
                "protein": 75,
                "carbs": 250,
                "fat": 65,
                "fiber": 25
            }
        else:
            goals_data = {
                "calories": goals.calories,
                "protein": goals.protein,
                "carbs": goals.carbs,
                "fat": goals.fat,
                "fiber": goals.fiber
            }
        
        # 计算当前摄入
        current_intake = {
            "calories": 0,
            "protein": 0,
            "carbs": 0,
            "fat": 0,
            "fiber": 0
        }
        
        # 获取当日的所有餐次
        meals = Meal.query.filter_by(daily_intake_id=daily_intake.id).all()
        
        for meal in meals:
            # 获取餐次中的所有食物
            food_entries = FoodEntry.query.filter_by(meal_id=meal.id).all()
            
            for entry in food_entries:
                current_intake["calories"] += entry.calories or 0
                current_intake["protein"] += entry.protein or 0
                current_intake["carbs"] += entry.carbs or 0
                current_intake["fat"] += entry.fat or 0
                current_intake["fiber"] += entry.fiber or 0
        
        # 计算差距
        gaps = {
            "calories": max(0, goals_data["calories"] - current_intake["calories"]),
            "protein": max(0, goals_data["protein"] - current_intake["protein"]),
            "carbs": max(0, goals_data["carbs"] - current_intake["carbs"]),
            "fat": max(0, goals_data["fat"] - current_intake["fat"]),
            "fiber": max(0, goals_data["fiber"] - current_intake["fiber"])
        }
        
        # 生成建议
        recommendations = []
        
        # 蛋白质建议
        if gaps["protein"] > 10:  # 如果蛋白质差距超过10g
            protein_foods = Food.query.join(FoodNutrition).filter(
                FoodNutrition.protein > 10
            ).order_by(FoodNutrition.protein.desc()).limit(2).all()
            
            protein_foods_data = []
            for food in protein_foods:
                nutrition = food.nutrition
                protein_foods_data.append({
                    "id": food.id,
                    "name": food.name,
                    "servingSize": "100克",
                    "protein": nutrition.protein,
                    "calories": nutrition.calories
                })
            
            recommendations.append({
                "type": "protein",
                "message": "您的蛋白质摄入不足，建议增加瘦肉、鱼类、豆类或蛋类的摄入。",
                "suggestedFoods": protein_foods_data
            })
        
        # 膳食纤维建议
        if gaps["fiber"] > 5:  # 如果膳食纤维差距超过5g
            fiber_foods = Food.query.join(FoodNutrition).filter(
                FoodNutrition.fiber > 2
            ).order_by(FoodNutrition.fiber.desc()).limit(2).all()
            
            fiber_foods_data = []
            for food in fiber_foods:
                nutrition = food.nutrition
                fiber_foods_data.append({
                    "id": food.id,
                    "name": food.name,
                    "servingSize": "100克",
                    "fiber": nutrition.fiber,
                    "calories": nutrition.calories
                })
            
            recommendations.append({
                "type": "fiber",
                "message": "您的膳食纤维摄入不足，建议增加蔬菜、水果、全谷物和豆类的摄入。",
                "suggestedFoods": fiber_foods_data
            })
        
        # 健康脂肪建议
        if gaps["fat"] > 15:  # 如果脂肪差距超过15g
            fat_foods = Food.query.join(FoodNutrition).filter(
                FoodNutrition.fat > 10
            ).order_by(FoodNutrition.fat.desc()).limit(2).all()
            
            fat_foods_data = []
            for food in fat_foods:
                nutrition = food.nutrition
                fat_foods_data.append({
                    "id": food.id,
                    "name": food.name,
                    "servingSize": "30克",
                    "fat": nutrition.fat,
                    "calories": nutrition.calories
                })
            
            recommendations.append({
                "type": "fat",
                "message": "您的健康脂肪摄入不足，建议适量增加坚果、橄榄油或牛油果等健康脂肪来源。",
                "suggestedFoods": fat_foods_data
            })
        
        # 生成晚餐建议
        dinner_suggestion = None
        
        # 检查是否已有晚餐
        dinner = next((m for m in meals if m.name == "晚餐"), None)
        
        if not dinner and gaps["calories"] > 400:
            # 构建晚餐建议
            suggested_foods = []
            
            # 添加蛋白质来源
            if gaps["protein"] > 10:
                protein_food = Food.query.join(FoodNutrition).filter(
                    FoodNutrition.protein > 20
                ).first()
                
                if protein_food:
                    nutrition = protein_food.nutrition
                    suggested_foods.append({
                        "id": protein_food.id,
                        "name": protein_food.name,
                        "amount": "150克",
                        "calories": nutrition.calories * 1.5,
                        "protein": nutrition.protein * 1.5
                    })
            
            # 添加碳水来源
            if gaps["carbs"] > 20:
                carb_food = Food.query.join(FoodNutrition).filter(
                    FoodNutrition.carbs > 20
                ).first()
                
                if carb_food:
                    nutrition = carb_food.nutrition
                    suggested_foods.append({
                        "id": carb_food.id,
                        "name": carb_food.name,
                        "amount": "1碗",
                        "calories": nutrition.calories * 1.5,
                        "carbs": nutrition.carbs * 1.5,
                        "fiber": nutrition.fiber * 1.5 if nutrition.fiber else 0
                    })
            
            # 添加蔬菜
            vegetable_food = Food.query.join(FoodNutrition).filter(
                Food.category == "vegetables"
            ).first()
            
            if vegetable_food:
                nutrition = vegetable_food.nutrition
                suggested_foods.append({
                    "id": vegetable_food.id,
                    "name": vegetable_food.name,
                    "amount": "200克",
                    "calories": nutrition.calories * 2,
                    "fiber": nutrition.fiber * 2 if nutrition.fiber else 0,
                    "carbs": nutrition.carbs * 2 if nutrition.carbs else 0
                })
            
            # 添加健康脂肪
            if gaps["fat"] > 10:
                fat_food = Food.query.join(FoodNutrition).filter(
                    FoodNutrition.fat > 10
                ).first()
                
                if fat_food:
                    nutrition = fat_food.nutrition
                    suggested_foods.append({
                        "id": fat_food.id,
                        "name": fat_food.name,
                        "amount": "15克",
                        "calories": nutrition.calories * 0.5,
                        "fat": nutrition.fat * 0.5
                    })
            
            # 计算总计
            dinner_totals = {
                "calories": sum(food.get("calories", 0) for food in suggested_foods),
                "protein": sum(food.get("protein", 0) for food in suggested_foods),
                "carbs": sum(food.get("carbs", 0) for food in suggested_foods),
                "fat": sum(food.get("fat", 0) for food in suggested_foods),
                "fiber": sum(food.get("fiber", 0) for food in suggested_foods)
            }
            
            dinner_suggestion = {
                "name": "建议晚餐",
                "foods": suggested_foods,
                "totals": dinner_totals
            }
        
        # 构建响应数据
        response_data = {
            "userId": user_id,
            "date": date_obj.strftime('%Y-%m-%d'),
            "currentIntake": current_intake,
            "goals": goals_data,
            "gaps": gaps,
            "recommendations": recommendations
        }
        
        if dinner_suggestion:
            response_data["mealSuggestions"] = {
                "dinner": dinner_suggestion
            }
        
        return make_response(200, "获取成功", data=response_data)
        
    except ValueError:
        return make_response(400, "无效的日期格式", error="INVALID_DATE_FORMAT")
    except Exception as e:
        print(f"Error in getting recommendations: {str(e)}")
        return make_response(500, "获取营养建议失败", error="FETCH_FAILED")

@nutrition_goals_bp.route('/export', methods=['GET'])
def export_nutrition_data():
    """导出营养数据"""
    user_id = request.args.get('userId')
    start_date_str = request.args.get('startDate')
    end_date_str = request.args.get('endDate')
    format_type = request.args.get('format', 'csv')
    
    if not user_id or not start_date_str or not end_date_str:
        return make_response(400, "缺少必要参数", error="INVALID_REQUEST")
    
    # 检查用户是否存在
    user = User.query.get(user_id)
    if not user:
        return make_response(404, "用户不存在", error="USER_NOT_FOUND")
    
    # 验证导出格式
    valid_formats = ['csv', 'json', 'pdf']
    if format_type not in valid_formats:
        return make_response(400, "不支持的导出格式", error="UNSUPPORTED_FORMAT")
    
    try:
        # 解析日期
        start_date = datetime.strptime(start_date_str, '%Y-%m-%d').date()
        end_date = datetime.strptime(end_date_str, '%Y-%m-%d').date()
        
        # 生成文件名
        file_name = f"nutrition_{start_date_str}_{end_date_str}"
        
        # 模拟导出过程（实际项目中应生成并上传文件到云存储）
        if format_type == 'pdf':
            download_url = f"https://storage.dietlens.com/exports/{user_id}/nutrition_report_{start_date_str}_{end_date_str}.pdf"
        else:
            download_url = f"https://storage.dietlens.com/exports/{user_id}/{file_name}.{format_type}"
        
        # 设置过期时间（7天后）
        expires_at = (datetime.utcnow() + timedelta(days=7)).isoformat()
        
        # 构建响应数据
        response_data = {
            "downloadUrl": download_url,
            "expiresAt": expires_at
        }
        
        return make_response(200, "导出成功", data=response_data)
        
    except ValueError:
        return make_response(400, "无效的日期格式", error="INVALID_DATE_FORMAT")
    except Exception as e:
        print(f"Error in exporting nutrition data: {str(e)}")
        return make_response(500, "导出营养数据失败", error="EXPORT_FAILED")
