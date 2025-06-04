from flask import Blueprint, request, jsonify
import os
import base64
import requests
import json
from werkzeug.utils import secure_filename

from src.config.config import config

openai_api_bp = Blueprint('openai_api', __name__)

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

def analyze_food_image(image_path):
    """
    使用OpenAI API分析食物图片
    
    Args:
        image_path: 图片文件路径
        
    Returns:
        dict: 包含识别结果的字典
    """
    try:
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
                    ]
                }
            ],
            "max_tokens": 1000
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
    
    except Exception as e:
        return {"error": f"分析过程中出错: {str(e)}"}

@openai_api_bp.route('/analyze-food', methods=['POST'])
def analyze_food():
    """
    分析食物图片API端点
    """
    # 检查请求参数
    if 'image' not in request.files:
        return make_response(400, "缺少图片文件", error="INVALID_IMAGE")
    
    file = request.files['image']
    
    # 检查文件是否有效
    if file.filename == '':
        return make_response(400, "未选择文件", error="INVALID_IMAGE")
    
    # 检查文件扩展名
    allowed_extensions = {'jpg', 'jpeg', 'png'}
    if '.' not in file.filename or file.filename.rsplit('.', 1)[1].lower() not in allowed_extensions:
        return make_response(400, "图片格式不支持", error="UNSUPPORTED_FORMAT")
    
    try:
        # 保存上传的图片
        filename = secure_filename(file.filename)
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        new_filename = f"temp_{timestamp}_{filename}"
        
        # 确保上传目录存在
        upload_folder = os.path.join(config['default'].UPLOAD_FOLDER, 'temp')
        os.makedirs(upload_folder, exist_ok=True)
        
        file_path = os.path.join(upload_folder, new_filename)
        file.save(file_path)
        
        # 调用OpenAI API分析图片
        result = analyze_food_image(file_path)
        
        # 删除临时文件
        os.remove(file_path)
        
        if "error" in result:
            return make_response(500, "分析失败", error="ANALYSIS_FAILED", data={"details": result["error"]})
        
        return make_response(200, "分析成功", data=result)
        
    except Exception as e:
        return make_response(500, "分析过程中出错", error="ANALYSIS_ERROR", data={"details": str(e)})
