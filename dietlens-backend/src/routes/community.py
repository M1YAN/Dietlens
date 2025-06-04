from flask import Blueprint, request, jsonify
from datetime import datetime
import uuid

from src.models import db, Post, PostImage, PostTag, PostTagAssociation, Comment, PostLike, CommentLike, User

community_bp = Blueprint('community', __name__)

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

@community_bp.route('/posts', methods=['GET'])
def get_posts():
    """获取帖子列表"""
    page = int(request.args.get('page', 1))
    limit = int(request.args.get('limit', 10))
    filter_type = request.args.get('filter', 'all')
    tag = request.args.get('tag')
    search = request.args.get('search')
    
    # 构建查询
    query = db.session.query(Post)
    
    # 应用筛选条件
    if filter_type == 'experts':
        query = query.join(User, Post.author_id == User.id).filter(User.is_expert == True)
    elif filter_type == 'popular':
        query = query.order_by(Post.likes_count.desc())
    elif filter_type == 'latest':
        query = query.order_by(Post.created_at.desc())
    
    # 按标签筛选
    if tag:
        query = query.join(PostTagAssociation).join(PostTag).filter(PostTag.name == tag)
    
    # 搜索关键词
    if search:
        search_term = f"%{search}%"
        query = query.filter(db.or_(
            Post.title.like(search_term),
            Post.content.like(search_term)
        ))
    
    # 默认排序（如果没有指定popular或latest）
    if filter_type not in ['popular', 'latest']:
        query = query.order_by(Post.created_at.desc())
    
    # 计算总数和分页
    total = query.count()
    total_pages = (total + limit - 1) // limit
    
    posts = query.offset((page - 1) * limit).limit(limit).all()
    
    # 构建响应数据
    posts_data = []
    for post in posts:
        # 获取作者信息
        author = User.query.get(post.author_id)
        
        # 获取帖子标签
        post_tags = db.session.query(PostTag).join(PostTagAssociation).filter(
            PostTagAssociation.post_id == post.id
        ).all()
        
        # 获取帖子图片
        post_images = PostImage.query.filter_by(post_id=post.id).all()
        
        # 构建帖子数据
        post_data = {
            "id": post.id,
            "title": post.title,
            "content": post.content,
            "contentPreview": post.content[:100] + "..." if len(post.content) > 100 else post.content,
            "author": {
                "id": author.id,
                "name": author.username,
                "avatar": author.avatar,
                "isExpert": author.is_expert,
                "expertTitle": author.expert_title if author.is_expert else None
            },
            "createdAt": post.created_at.isoformat(),
            "updatedAt": post.updated_at.isoformat(),
            "likes": post.likes_count,
            "comments": post.comments_count,
            "tags": [tag.name for tag in post_tags],
            "images": [
                {
                    "url": image.url,
                    "caption": image.caption
                } for image in post_images
            ],
            "isLiked": False  # 默认未点赞，实际应根据当前用户判断
        }
        
        posts_data.append(post_data)
    
    response_data = {
        "total": total,
        "totalPages": total_pages,
        "currentPage": page,
        "posts": posts_data
    }
    
    return make_response(200, "获取成功", data=response_data)

@community_bp.route('/posts/<post_id>', methods=['GET'])
def get_post_detail(post_id):
    """获取帖子详情"""
    post = Post.query.get(post_id)
    
    if not post:
        return make_response(404, "帖子不存在", error="POST_NOT_FOUND")
    
    # 获取作者信息
    author = User.query.get(post.author_id)
    
    # 获取帖子标签
    post_tags = db.session.query(PostTag).join(PostTagAssociation).filter(
        PostTagAssociation.post_id == post.id
    ).all()
    
    # 获取帖子图片
    post_images = PostImage.query.filter_by(post_id=post.id).all()
    
    # 获取评论
    comments = Comment.query.filter_by(post_id=post.id).order_by(Comment.created_at.desc()).all()
    
    comments_data = []
    for comment in comments:
        comment_author = User.query.get(comment.author_id)
        
        comment_data = {
            "id": comment.id,
            "content": comment.content,
            "author": {
                "id": comment_author.id,
                "name": comment_author.username,
                "avatar": comment_author.avatar,
                "isExpert": comment_author.is_expert
            },
            "createdAt": comment.created_at.isoformat(),
            "likes": comment.likes_count,
            "isLiked": False  # 默认未点赞，实际应根据当前用户判断
        }
        
        comments_data.append(comment_data)
    
    # 获取相关帖子（同一作者的其他帖子）
    related_posts = Post.query.filter(
        Post.author_id == post.author_id,
        Post.id != post.id
    ).order_by(Post.created_at.desc()).limit(3).all()
    
    related_posts_data = []
    for related_post in related_posts:
        related_post_data = {
            "id": related_post.id,
            "title": related_post.title,
            "contentPreview": related_post.content[:100] + "..." if len(related_post.content) > 100 else related_post.content,
            "author": {
                "name": author.username,
                "isExpert": author.is_expert
            }
        }
        
        related_posts_data.append(related_post_data)
    
    # 构建响应数据
    post_data = {
        "id": post.id,
        "title": post.title,
        "content": post.content,
        "author": {
            "id": author.id,
            "name": author.username,
            "avatar": author.avatar,
            "isExpert": author.is_expert,
            "expertTitle": author.expert_title if author.is_expert else None,
            "bio": author.bio,
            "followersCount": len(author.followers) if hasattr(author, 'followers') else 0
        },
        "createdAt": post.created_at.isoformat(),
        "updatedAt": post.updated_at.isoformat(),
        "likes": post.likes_count,
        "isLiked": False,  # 默认未点赞，实际应根据当前用户判断
        "tags": [tag.name for tag in post_tags],
        "images": [
            {
                "url": image.url,
                "caption": image.caption
            } for image in post_images
        ],
        "comments": comments_data,
        "relatedPosts": related_posts_data
    }
    
    return make_response(200, "获取成功", data=post_data)

@community_bp.route('/posts', methods=['POST'])
def create_post():
    """发布新帖子"""
    # 检查请求参数
    if 'title' not in request.form:
        return make_response(400, "标题不能为空", error="INVALID_TITLE_LENGTH")
    
    if 'content' not in request.form:
        return make_response(400, "内容不能为空", error="EMPTY_CONTENT")
    
    title = request.form['title']
    content = request.form['content']
    author_id = request.form.get('author_id')  # 实际应从认证信息中获取
    
    # 验证标题长度
    if len(title) < 5 or len(title) > 100:
        return make_response(400, "标题长度应在5-100字符之间", error="INVALID_TITLE_LENGTH")
    
    # 验证内容长度
    if len(content) < 20 or len(content) > 10000:
        return make_response(400, "内容长度应在20-10000字符之间", error="INVALID_CONTENT_LENGTH")
    
    # 验证用户是否存在
    author = User.query.get(author_id)
    if not author:
        return make_response(404, "用户不存在", error="USER_NOT_FOUND")
    
    try:
        # 创建帖子
        post = Post(
            title=title,
            content=content,
            author_id=author_id
        )
        db.session.add(post)
        db.session.flush()  # 获取ID但不提交
        
        # 处理标签
        tags = request.form.getlist('tags[]')
        if tags and len(tags) > 5:
            return make_response(400, "标签数量不能超过5个", error="TOO_MANY_TAGS")
        
        for tag_name in tags:
            # 查找或创建标签
            tag = PostTag.query.filter_by(name=tag_name).first()
            if not tag:
                tag = PostTag(name=tag_name)
                db.session.add(tag)
                db.session.flush()
            
            # 增加标签计数
            tag.count += 1
            
            # 关联帖子和标签
            association = PostTagAssociation(post_id=post.id, tag_id=tag.id)
            db.session.add(association)
        
        # 处理图片
        images = request.files.getlist('images[]')
        image_captions = request.form.getlist('imageCaptions[]')
        
        if images and len(images) > 5:
            return make_response(413, "图片数量不能超过5张", error="TOO_MANY_IMAGES")
        
        for i, image_file in enumerate(images):
            if image_file:
                # 检查图片大小
                if len(image_file.read()) > 5 * 1024 * 1024:  # 5MB
                    return make_response(413, "图片大小不能超过5MB", error="IMAGE_TOO_LARGE")
                
                image_file.seek(0)  # 重置文件指针
                
                # 保存图片（实际项目中应上传到云存储）
                filename = f"{post.id}_{i}_{image_file.filename}"
                image_path = f"src/static/uploads/community/{filename}"  # 相对路径
                image_file.save(image_path)
                
                # 获取对应的说明文字
                caption = image_captions[i] if i < len(image_captions) else None
                
                # 创建图片记录
                post_image = PostImage(
                    post_id=post.id,
                    url=f"/static/uploads/community/{filename}",  # 返回相对路径
                    caption=caption,
                    order=i
                )
                db.session.add(post_image)
        
        db.session.commit()
        
        # 构建响应数据
        post_data = {
            "id": post.id,
            "title": post.title,
            "content": post.content,
            "author": {
                "id": author.id,
                "name": author.username,
                "avatar": author.avatar,
                "isExpert": author.is_expert
            },
            "createdAt": post.created_at.isoformat(),
            "tags": tags,
            "images": [
                {
                    "url": image.url,
                    "caption": image.caption
                } for image in PostImage.query.filter_by(post_id=post.id).all()
            ]
        }
        
        return make_response(201, "发布成功", data=post_data)
        
    except Exception as e:
        db.session.rollback()
        print(f"Error in creating post: {str(e)}")
        return make_response(500, "发布失败", error="CREATE_FAILED")

@community_bp.route('/posts/<post_id>/comments', methods=['POST'])
def comment_post(post_id):
    """评论帖子"""
    data = request.json
    
    if not data or 'content' not in data:
        return make_response(400, "评论内容不能为空", error="EMPTY_COMMENT")
    
    content = data['content']
    author_id = data.get('author_id')  # 实际应从认证信息中获取
    
    # 检查帖子是否存在
    post = Post.query.get(post_id)
    if not post:
        return make_response(404, "帖子不存在", error="POST_NOT_FOUND")
    
    # 检查用户是否存在
    author = User.query.get(author_id)
    if not author:
        return make_response(404, "用户不存在", error="USER_NOT_FOUND")
    
    try:
        # 创建评论
        comment = Comment(
            content=content,
            post_id=post_id,
            author_id=author_id
        )
        db.session.add(comment)
        
        # 更新帖子评论计数
        post.comments_count += 1
        
        db.session.commit()
        
        # 构建响应数据
        comment_data = {
            "id": comment.id,
            "content": comment.content,
            "author": {
                "id": author.id,
                "name": author.username,
                "avatar": author.avatar,
                "isExpert": author.is_expert
            },
            "createdAt": comment.created_at.isoformat(),
            "likes": 0,
            "isLiked": False
        }
        
        return make_response(201, "评论成功", data=comment_data)
        
    except Exception as e:
        db.session.rollback()
        print(f"Error in commenting post: {str(e)}")
        return make_response(500, "评论失败", error="COMMENT_FAILED")

@community_bp.route('/posts/<post_id>/like', methods=['POST'])
def like_post(post_id):
    """点赞/取消点赞帖子"""
    data = request.json
    
    if not data or 'action' not in data:
        return make_response(400, "缺少操作类型", error="INVALID_REQUEST")
    
    action = data['action']
    user_id = data.get('user_id')  # 实际应从认证信息中获取
    
    # 检查帖子是否存在
    post = Post.query.get(post_id)
    if not post:
        return make_response(404, "帖子不存在", error="POST_NOT_FOUND")
    
    # 检查用户是否存在
    user = User.query.get(user_id)
    if not user:
        return make_response(404, "用户不存在", error="USER_NOT_FOUND")
    
    try:
        # 查找现有点赞记录
        like = PostLike.query.filter_by(user_id=user_id, post_id=post_id).first()
        
        if action == 'like' and not like:
            # 添加点赞
            new_like = PostLike(user_id=user_id, post_id=post_id)
            db.session.add(new_like)
            
            # 更新帖子点赞计数
            post.likes_count += 1
            
            is_liked = True
            
        elif action == 'unlike' and like:
            # 取消点赞
            db.session.delete(like)
            
            # 更新帖子点赞计数
            post.likes_count = max(0, post.likes_count - 1)
            
            is_liked = False
            
        else:
            # 操作无效（已点赞再点赞或未点赞取消点赞）
            is_liked = True if like else False
        
        db.session.commit()
        
        # 构建响应数据
        response_data = {
            "postId": post_id,
            "likes": post.likes_count,
            "isLiked": is_liked
        }
        
        return make_response(200, "操作成功", data=response_data)
        
    except Exception as e:
        db.session.rollback()
        print(f"Error in liking post: {str(e)}")
        return make_response(500, "操作失败", error="LIKE_FAILED")

@community_bp.route('/users/<user_id>', methods=['GET'])
def get_user_profile(user_id):
    """获取用户资料"""
    user = User.query.get(user_id)
    
    if not user:
        return make_response(404, "用户不存在", error="USER_NOT_FOUND")
    
    try:
        # 获取用户发布的帖子
        posts = Post.query.filter_by(author_id=user_id).order_by(Post.created_at.desc()).limit(5).all()
        
        posts_data = []
        for post in posts:
            post_data = {
                "id": post.id,
                "title": post.title,
                "contentPreview": post.content[:100] + "..." if len(post.content) > 100 else post.content,
                "createdAt": post.created_at.isoformat(),
                "likes": post.likes_count,
                "comments": post.comments_count
            }
            
            posts_data.append(post_data)
        
        # 获取关注者数量
        followers_count = len(user.followers) if hasattr(user, 'followers') else 0
        
        # 获取关注的用户数量
        following_count = len(user.following) if hasattr(user, 'following') else 0
        
        # 获取帖子数量
        posts_count = Post.query.filter_by(author_id=user_id).count()
        
        # 构建响应数据
        user_data = {
            "id": user.id,
            "name": user.username,
            "avatar": user.avatar,
            "isExpert": user.is_expert,
            "expertTitle": user.expert_title if user.is_expert else None,
            "bio": user.bio,
            "joinDate": user.join_date.isoformat() if user.join_date else None,
            "followersCount": followers_count,
            "followingCount": following_count,
            "postsCount": posts_count,
            "isFollowing": False,  # 默认未关注，实际应根据当前用户判断
            "recentPosts": posts_data
        }
        
        return make_response(200, "获取成功", data=user_data)
        
    except Exception as e:
        print(f"Error in getting user profile: {str(e)}")
        return make_response(500, "获取用户资料失败", error="FETCH_FAILED")

@community_bp.route('/users/<user_id>/follow', methods=['POST'])
def follow_user(user_id):
    """关注/取消关注用户"""
    from src.models import UserFollowing
    
    data = request.json
    
    if not data or 'action' not in data:
        return make_response(400, "缺少操作类型", error="INVALID_REQUEST")
    
    action = data['action']
    follower_id = data.get('follower_id')  # 实际应从认证信息中获取
    
    # 检查目标用户是否存在
    followed_user = User.query.get(user_id)
    if not followed_user:
        return make_response(404, "用户不存在", error="USER_NOT_FOUND")
    
    # 检查关注者是否存在
    follower_user = User.query.get(follower_id)
    if not follower_user:
        return make_response(404, "关注者不存在", error="USER_NOT_FOUND")
    
    # 不能关注自己
    if follower_id == user_id:
        return make_response(400, "不能关注自己", error="INVALID_REQUEST")
    
    try:
        # 查找现有关注记录
        following = UserFollowing.query.filter_by(follower_id=follower_id, followed_id=user_id).first()
        
        if action == 'follow' and not following:
            # 添加关注
            new_following = UserFollowing(
                follower_id=follower_id,
                followed_id=user_id,
                created_at=datetime.utcnow()
            )
            db.session.add(new_following)
            is_following = True
            
        elif action == 'unfollow' and following:
            # 取消关注
            db.session.delete(following)
            is_following = False
            
        else:
            # 操作无效（已关注再关注或未关注取消关注）
            is_following = True if following else False
        
        db.session.commit()
        
        # 获取关注者数量
        followers_count = UserFollowing.query.filter_by(followed_id=user_id).count()
        
        # 构建响应数据
        response_data = {
            "userId": user_id,
            "followersCount": followers_count,
            "isFollowing": is_following
        }
        
        return make_response(200, "操作成功", data=response_data)
        
    except Exception as e:
        db.session.rollback()
        print(f"Error in following user: {str(e)}")
        return make_response(500, "操作失败", error="FOLLOW_FAILED")

@community_bp.route('/tags/popular', methods=['GET'])
def get_popular_tags():
    """获取热门标签"""
    limit = int(request.args.get('limit', 20))
    
    try:
        # 查询热门标签
        tags = PostTag.query.order_by(PostTag.count.desc()).limit(limit).all()
        
        tags_data = []
        for tag in tags:
            tag_data = {
                "name": tag.name,
                "count": tag.count
            }
            
            tags_data.append(tag_data)
        
        response_data = {
            "tags": tags_data
        }
        
        return make_response(200, "获取成功", data=response_data)
        
    except Exception as e:
        print(f"Error in getting popular tags: {str(e)}")
        return make_response(500, "获取热门标签失败", error="FETCH_FAILED")
