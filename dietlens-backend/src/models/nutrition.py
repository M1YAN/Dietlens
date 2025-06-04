from src.models.user import db
import datetime
import uuid

class FoodRecognition(db.Model):
    __tablename__ = 'food_recognitions'
    
    id = db.Column(db.String(36), primary_key=True)
    user_id = db.Column(db.String(36), db.ForeignKey('users.id'), nullable=False)
    image_url = db.Column(db.String(255), nullable=False)
    meal_type = db.Column(db.String(20))
    created_at = db.Column(db.DateTime, default=datetime.datetime.utcnow)
    saved_to_diary = db.Column(db.Boolean, default=False)
    
    # 关系
    recognized_foods = db.relationship('RecognizedFood', backref='recognition', lazy=True, cascade="all, delete-orphan")
    
    def __init__(self, user_id, image_url, **kwargs):
        self.id = kwargs.get('id', f"rec_{str(uuid.uuid4())[:8]}")
        self.user_id = user_id
        self.image_url = image_url
        self.meal_type = kwargs.get('meal_type')
    
    def __repr__(self):
        return f'<FoodRecognition {self.id}>'


class RecognizedFood(db.Model):
    __tablename__ = 'recognized_foods'
    
    id = db.Column(db.Integer, primary_key=True)
    recognition_id = db.Column(db.String(36), db.ForeignKey('food_recognitions.id'), nullable=False)
    food_id = db.Column(db.String(36), db.ForeignKey('foods.id'), nullable=True)
    name = db.Column(db.String(100), nullable=False)
    amount = db.Column(db.String(50))
    weight = db.Column(db.Float)  # 克
    unit = db.Column(db.String(10), default='g')
    calories = db.Column(db.Float)
    protein = db.Column(db.Float)
    carbs = db.Column(db.Float)
    fat = db.Column(db.Float)
    fiber = db.Column(db.Float)
    confidence = db.Column(db.Float)
    
    # 关系
    food = db.relationship('Food', backref=db.backref('recognitions', lazy=True))
    
    def __repr__(self):
        return f'<RecognizedFood {self.name} in {self.recognition_id}>'


class NutritionGoal(db.Model):
    __tablename__ = 'nutrition_goals'
    
    user_id = db.Column(db.String(36), db.ForeignKey('users.id'), primary_key=True)
    calories = db.Column(db.Float, nullable=False)
    protein = db.Column(db.Float, nullable=False)
    carbs = db.Column(db.Float, nullable=False)
    fat = db.Column(db.Float, nullable=False)
    fiber = db.Column(db.Float)
    sugar = db.Column(db.Float)
    sodium = db.Column(db.Float)
    last_updated = db.Column(db.DateTime, default=datetime.datetime.utcnow)
    
    def __repr__(self):
        return f'<NutritionGoal for {self.user_id}>'


class UserProfile(db.Model):
    __tablename__ = 'user_profiles'
    
    user_id = db.Column(db.String(36), db.ForeignKey('users.id'), primary_key=True)
    gender = db.Column(db.String(10))
    age = db.Column(db.Integer)
    height = db.Column(db.Float)  # 厘米
    weight = db.Column(db.Float)  # 千克
    activity_level = db.Column(db.String(20))
    goal = db.Column(db.String(20))
    dietary_restrictions = db.Column(db.String(255))  # 存储为逗号分隔的字符串
    last_updated = db.Column(db.DateTime, default=datetime.datetime.utcnow)
    
    def __repr__(self):
        return f'<UserProfile for {self.user_id}>'


class DailyIntake(db.Model):
    __tablename__ = 'daily_intakes'
    
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.String(36), db.ForeignKey('users.id'), nullable=False)
    date = db.Column(db.Date, nullable=False)
    
    # 关系
    meals = db.relationship('Meal', backref='daily_intake', lazy=True, cascade="all, delete-orphan")
    
    def __repr__(self):
        return f'<DailyIntake for {self.user_id} on {self.date}>'


class Meal(db.Model):
    __tablename__ = 'meals'
    
    id = db.Column(db.String(36), primary_key=True)
    daily_intake_id = db.Column(db.Integer, db.ForeignKey('daily_intakes.id'), nullable=False)
    name = db.Column(db.String(50), nullable=False)
    time = db.Column(db.String(5))  # 格式: "HH:MM"
    
    # 关系
    food_entries = db.relationship('FoodEntry', backref='meal', lazy=True, cascade="all, delete-orphan")
    
    def __init__(self, daily_intake_id, name, **kwargs):
        self.id = kwargs.get('id', f"meal_{str(uuid.uuid4())[:8]}")
        self.daily_intake_id = daily_intake_id
        self.name = name
        self.time = kwargs.get('time')
    
    def __repr__(self):
        return f'<Meal {self.name} in {self.daily_intake_id}>'


class FoodEntry(db.Model):
    __tablename__ = 'food_entries'
    
    id = db.Column(db.String(36), primary_key=True)
    meal_id = db.Column(db.String(36), db.ForeignKey('meals.id'), nullable=False)
    food_id = db.Column(db.String(36), db.ForeignKey('foods.id'), nullable=False)
    amount = db.Column(db.String(50))
    weight = db.Column(db.Float)  # 克
    calories = db.Column(db.Float)
    protein = db.Column(db.Float)
    carbs = db.Column(db.Float)
    fat = db.Column(db.Float)
    fiber = db.Column(db.Float)
    sugar = db.Column(db.Float)
    sodium = db.Column(db.Float)
    
    # 关系
    food = db.relationship('Food')
    
    def __init__(self, meal_id, food_id, **kwargs):
        self.id = kwargs.get('id', f"food_entry_{str(uuid.uuid4())[:8]}")
        self.meal_id = meal_id
        self.food_id = food_id
        self.amount = kwargs.get('amount')
        self.weight = kwargs.get('weight')
        self.calories = kwargs.get('calories')
        self.protein = kwargs.get('protein')
        self.carbs = kwargs.get('carbs')
        self.fat = kwargs.get('fat')
        self.fiber = kwargs.get('fiber')
    
    def __repr__(self):
        return f'<FoodEntry {self.id}>'
