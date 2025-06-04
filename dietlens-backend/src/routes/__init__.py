from src.routes import auth, food_recognition, community, food_search, nutrition_goals, openai_api

# 导出所有蓝图
auth_bp = auth.auth_bp
food_recognition_bp = food_recognition.food_recognition_bp
community_bp = community.community_bp
food_search_bp = food_search.food_search_bp
nutrition_goals_bp = nutrition_goals.nutrition_goals_bp
openai_api_bp = openai_api.openai_api_bp
