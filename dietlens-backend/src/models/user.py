from flask_sqlalchemy import SQLAlchemy

db = SQLAlchemy()



class User(db.Model):
    __tablename__ = 'users'
    
    id = db.Column(db.String(36), primary_key=True)
    username = db.Column(db.String(50), unique=True, nullable=False)
    email = db.Column(db.String(100), unique=True, nullable=False)
    password_hash = db.Column(db.String(255), nullable=False)
    avatar = db.Column(db.String(255))
    is_expert = db.Column(db.Boolean, default=False)
    expert_title = db.Column(db.String(100))
    bio = db.Column(db.Text)
    join_date = db.Column(db.DateTime, nullable=False)
    last_login = db.Column(db.DateTime)
    
    # 关系
    posts = db.relationship('Post', backref='author', lazy=True)
    comments = db.relationship('Comment', backref='author', lazy=True)
    food_recognitions = db.relationship('FoodRecognition', backref='user', lazy=True)
    nutrition_goals = db.relationship('NutritionGoal', backref='user', lazy=True, uselist=False)
    user_profile = db.relationship('UserProfile', backref='user', lazy=True, uselist=False)
    daily_intakes = db.relationship('DailyIntake', backref='user', lazy=True)
    favorite_foods = db.relationship('FavoriteFood', backref='user', lazy=True)
    
    def __repr__(self):
        return f'<User {self.username}>'


class UserFollowing(db.Model):
    __tablename__ = 'user_followings'
    
    follower_id = db.Column(db.String(36), db.ForeignKey('users.id'), primary_key=True)
    followed_id = db.Column(db.String(36), db.ForeignKey('users.id'), primary_key=True)
    created_at = db.Column(db.DateTime, nullable=False)
    
    follower = db.relationship('User', foreign_keys=[follower_id], backref=db.backref('following', lazy=True))
    followed = db.relationship('User', foreign_keys=[followed_id], backref=db.backref('followers', lazy=True))
