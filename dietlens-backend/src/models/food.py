from src.models.user import db
import datetime
import uuid

class Food(db.Model):
    __tablename__ = 'foods'
    
    id = db.Column(db.String(36), primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    category = db.Column(db.String(50), nullable=False)
    category_name = db.Column(db.String(100))
    description = db.Column(db.Text)
    image_url = db.Column(db.String(255))
    is_custom = db.Column(db.Boolean, default=False)
    creator_id = db.Column(db.String(36), db.ForeignKey('users.id'), nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.datetime.utcnow)
    popularity = db.Column(db.Integer, default=0)
    
    # 关系
    nutrition = db.relationship('FoodNutrition', backref='food', lazy=True, uselist=False)
    serving_sizes = db.relationship('FoodServingSize', backref='food', lazy=True)
    tags = db.relationship('FoodTag', secondary='food_tag_association', lazy='subquery',
                          backref=db.backref('foods', lazy=True))
    
    def __init__(self, name, category, **kwargs):
        self.id = kwargs.get('id', f"food_{str(uuid.uuid4())[:8]}")
        self.name = name
        self.category = category
        self.category_name = kwargs.get('category_name')
        self.description = kwargs.get('description')
        self.image_url = kwargs.get('image_url')
        self.is_custom = kwargs.get('is_custom', False)
        self.creator_id = kwargs.get('creator_id')
        
    def __repr__(self):
        return f'<Food {self.name}>'


class FoodNutrition(db.Model):
    __tablename__ = 'food_nutrition'
    
    food_id = db.Column(db.String(36), db.ForeignKey('foods.id'), primary_key=True)
    calories = db.Column(db.Float, nullable=False)
    protein = db.Column(db.Float, nullable=False)
    carbs = db.Column(db.Float, nullable=False)
    fat = db.Column(db.Float, nullable=False)
    fiber = db.Column(db.Float)
    sugar = db.Column(db.Float)
    sodium = db.Column(db.Float)
    potassium = db.Column(db.Float)
    vitamin_a = db.Column(db.Float)
    vitamin_c = db.Column(db.Float)
    calcium = db.Column(db.Float)
    iron = db.Column(db.Float)
    
    def __repr__(self):
        return f'<FoodNutrition for {self.food_id}>'


class FoodServingSize(db.Model):
    __tablename__ = 'food_serving_sizes'
    
    id = db.Column(db.Integer, primary_key=True)
    food_id = db.Column(db.String(36), db.ForeignKey('foods.id'), nullable=False)
    name = db.Column(db.String(50), nullable=False)
    weight = db.Column(db.Float, nullable=False)  # 克
    is_default = db.Column(db.Boolean, default=False)
    
    def __repr__(self):
        return f'<FoodServingSize {self.name} for {self.food_id}>'


class FoodTag(db.Model):
    __tablename__ = 'food_tags'
    
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(50), unique=True, nullable=False)
    
    def __repr__(self):
        return f'<FoodTag {self.name}>'


class FoodTagAssociation(db.Model):
    __tablename__ = 'food_tag_association'
    
    food_id = db.Column(db.String(36), db.ForeignKey('foods.id'), primary_key=True)
    tag_id = db.Column(db.Integer, db.ForeignKey('food_tags.id'), primary_key=True)


class FoodCategory(db.Model):
    __tablename__ = 'food_categories'
    
    id = db.Column(db.String(50), primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    description = db.Column(db.Text)
    image_url = db.Column(db.String(255))
    
    def __repr__(self):
        return f'<FoodCategory {self.name}>'


class FavoriteFood(db.Model):
    __tablename__ = 'favorite_foods'
    
    user_id = db.Column(db.String(36), db.ForeignKey('users.id'), primary_key=True)
    food_id = db.Column(db.String(36), db.ForeignKey('foods.id'), primary_key=True)
    added_at = db.Column(db.DateTime, default=datetime.datetime.utcnow)
    
    food = db.relationship('Food', backref=db.backref('favorited_by', lazy=True))
    
    def __repr__(self):
        return f'<FavoriteFood {self.food_id} for {self.user_id}>'


class RecentViewedFood(db.Model):
    __tablename__ = 'recent_viewed_foods'
    
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.String(36), db.ForeignKey('users.id'), nullable=False)
    food_id = db.Column(db.String(36), db.ForeignKey('foods.id'), nullable=False)
    viewed_at = db.Column(db.DateTime, default=datetime.datetime.utcnow)
    
    food = db.relationship('Food')
    
    def __repr__(self):
        return f'<RecentViewedFood {self.food_id} for {self.user_id}>'
