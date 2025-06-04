from src.models.user import db
import datetime
import uuid

class Post(db.Model):
    __tablename__ = 'posts'
    
    id = db.Column(db.String(36), primary_key=True)
    title = db.Column(db.String(100), nullable=False)
    content = db.Column(db.Text, nullable=False)
    author_id = db.Column(db.String(36), db.ForeignKey('users.id'), nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)
    likes_count = db.Column(db.Integer, default=0)
    comments_count = db.Column(db.Integer, default=0)
    
    # 关系
    images = db.relationship('PostImage', backref='post', lazy=True, cascade="all, delete-orphan")
    comments = db.relationship('Comment', backref='post', lazy=True, cascade="all, delete-orphan")
    tags = db.relationship('PostTag', secondary='post_tag_association', lazy='subquery',
                          backref=db.backref('posts', lazy=True))
    
    def __init__(self, title, content, author_id, **kwargs):
        self.id = kwargs.get('id', f"post_{str(uuid.uuid4())[:8]}")
        self.title = title
        self.content = content
        self.author_id = author_id
    
    def __repr__(self):
        return f'<Post {self.title}>'


class PostImage(db.Model):
    __tablename__ = 'post_images'
    
    id = db.Column(db.Integer, primary_key=True)
    post_id = db.Column(db.String(36), db.ForeignKey('posts.id'), nullable=False)
    url = db.Column(db.String(255), nullable=False)
    caption = db.Column(db.String(255))
    order = db.Column(db.Integer, default=0)
    
    def __repr__(self):
        return f'<PostImage {self.id} for {self.post_id}>'


class PostTag(db.Model):
    __tablename__ = 'post_tags'
    
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(50), unique=True, nullable=False)
    count = db.Column(db.Integer, default=0)
    
    def __repr__(self):
        return f'<PostTag {self.name}>'


class PostTagAssociation(db.Model):
    __tablename__ = 'post_tag_association'
    
    post_id = db.Column(db.String(36), db.ForeignKey('posts.id'), primary_key=True)
    tag_id = db.Column(db.Integer, db.ForeignKey('post_tags.id'), primary_key=True)


class Comment(db.Model):
    __tablename__ = 'comments'
    
    id = db.Column(db.String(36), primary_key=True)
    content = db.Column(db.Text, nullable=False)
    post_id = db.Column(db.String(36), db.ForeignKey('posts.id'), nullable=False)
    author_id = db.Column(db.String(36), db.ForeignKey('users.id'), nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.datetime.utcnow)
    likes_count = db.Column(db.Integer, default=0)
    
    def __init__(self, content, post_id, author_id, **kwargs):
        self.id = kwargs.get('id', f"comment_{str(uuid.uuid4())[:8]}")
        self.content = content
        self.post_id = post_id
        self.author_id = author_id
    
    def __repr__(self):
        return f'<Comment {self.id}>'


class PostLike(db.Model):
    __tablename__ = 'post_likes'
    
    user_id = db.Column(db.String(36), db.ForeignKey('users.id'), primary_key=True)
    post_id = db.Column(db.String(36), db.ForeignKey('posts.id'), primary_key=True)
    created_at = db.Column(db.DateTime, default=datetime.datetime.utcnow)
    
    user = db.relationship('User', backref=db.backref('liked_posts', lazy=True))
    post = db.relationship('Post', backref=db.backref('likes', lazy=True))
    
    def __repr__(self):
        return f'<PostLike {self.user_id} -> {self.post_id}>'


class CommentLike(db.Model):
    __tablename__ = 'comment_likes'
    
    user_id = db.Column(db.String(36), db.ForeignKey('users.id'), primary_key=True)
    comment_id = db.Column(db.String(36), db.ForeignKey('comments.id'), primary_key=True)
    created_at = db.Column(db.DateTime, default=datetime.datetime.utcnow)
    
    user = db.relationship('User', backref=db.backref('liked_comments', lazy=True))
    comment = db.relationship('Comment', backref=db.backref('likes', lazy=True))
    
    def __repr__(self):
        return f'<CommentLike {self.user_id} -> {self.comment_id}>'
