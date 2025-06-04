'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/lib/hooks/useAuth';
import communityService from '@/lib/api/communityService';
import Image from 'next/image';
import { getImageUrl, formatDateTime } from '@/lib/utils';
import Link from 'next/link';
import { ArrowLeft, Heart, MessageSquare, User, Share2 } from 'lucide-react';
import { toast } from 'react-hot-toast';

interface PostDetail {
  id: string;
  postId: string;
  title: string;
  content: string;
  contentHtml?: string;
  author: {
    id: string;
    username: string;
    avatar?: string;
    isExpert: boolean;
    expertTitle?: string;
  };
  createdAt: string;
  updatedAt: string;
  likes: number;
  comments: number;
  category: string;
  tags: string[];
  images: string[];
  isLiked: boolean;
}

interface Comment {
  commentId: string;
  content: string;
  author: {
    id: string;
    username: string;
    avatar?: string;
    isExpert: boolean;
  };
  createdAt: string;
  likes: number;
  isLiked: boolean;
}

export default function PostDetail() {
  const { id } = useParams();
  const router = useRouter();
  const { user, isAuthenticated } = useAuth();
  
  const [post, setPost] = useState<PostDetail | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [commentText, setCommentText] = useState('');
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);
  const [isLiking, setIsLiking] = useState(false);

  // 获取帖子详情和评论
  useEffect(() => {
    const fetchData = async () => {
      if (!id) return;

      try {
        setIsLoading(true);
        setError(null);

        // 获取帖子详情
        const postResponse = await communityService.getPostDetail(id as string);
        
        if (postResponse.status === 200 && postResponse.data) {
          setPost(postResponse.data);
          console.log('Post detail:', postResponse.data);
          
          // 如果返回数据包含评论，直接使用
          if (postResponse.data.comments) {
            setComments(postResponse.data.comments);
          }
        } else {
          throw new Error(postResponse.message || '获取帖子详情失败');
        }
      } catch (err: any) {
        console.error('Failed to fetch post detail:', err);
        setError(err.response?.data?.message || err.message || '获取帖子详情失败');
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [id]);

  // 点赞/取消点赞
  const handleLikePost = async () => {
    if (!isAuthenticated) {
      toast.error('请先登录');
      router.push('/auth/login');
      return;
    }

    if (isLiking || !post) return;
    
    setIsLiking(true);
    try {
      const action = post.isLiked ? 'unlike' : 'like';
      const response = await communityService.toggleLikePost(
        post.id,
        user?.id || '',
        action
      );
      
      if (response.status === 200) {
        setPost(prev => prev ? {
          ...prev,
          likes: response.data.likes,
          isLiked: response.data.isLiked
        } : null);
        
        toast.success(post.isLiked ? '已取消点赞' : '点赞成功');
      }
    } catch (err: any) {
      console.error('Failed to like post:', err);
      toast.error('操作失败，请重试');
    } finally {
      setIsLiking(false);
    }
  };

  // 提交评论
  const handleSubmitComment = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!isAuthenticated) {
      toast.error('请先登录');
      router.push('/auth/login');
      return;
    }

    if (!commentText.trim()) {
      toast.error('评论内容不能为空');
      return;
    }

    if (isSubmittingComment) return;
    
    setIsSubmittingComment(true);
    try {
      const response = await communityService.addComment(
        id as string, 
        commentText,
        user?.id || ''
      );
      
      if (response.status === 201) {
        // 添加新评论到列表顶部
        setComments(prev => [response.data, ...prev]);
        setCommentText('');
        
        // 更新帖子评论数
        setPost(prev => prev ? {
          ...prev,
          comments: prev.comments + 1
        } : null);
        
        toast.success('评论发表成功');
      } else {
        throw new Error(response.message || '评论发表失败');
      }
    } catch (err: any) {
      console.error('Failed to submit comment:', err);
      toast.error(err.response?.data?.message || '评论发表失败');
    } finally {
      setIsSubmittingComment(false);
    }
  };

  // 格式化内容（处理换行等）
  const formatContent = (content: string) => {
    return content.split('\n').map((line, index) => (
      <p key={index} className="mb-4 last:mb-0">
        {line || '\u00A0'} {/* 空行显示为不间断空格 */}
      </p>
    ));
  };

  // 分享功能
  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: post?.title,
          text: post?.content,
          url: window.location.href
        });
      } catch (err) {
        console.log('分享取消');
      }
    } else {
      // 复制链接到剪贴板
      navigator.clipboard.writeText(window.location.href);
      toast.success('链接已复制到剪贴板');
    }
  };

  // 加载状态
  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-center items-center min-h-[60vh]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-emerald-500 mx-auto mb-4"></div>
            <p className="text-gray-600">加载中...</p>
          </div>
        </div>
      </div>
    );
  }

  // 错误状态
  if (error || !post) {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="bg-red-50 p-6 rounded-lg text-center">
          <h2 className="text-xl font-bold text-red-600 mb-2">出错了</h2>
          <p className="text-red-600 mb-4">{error || '未找到帖子'}</p>
          <div className="space-x-4">
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
            >
              重新加载
            </button>
            <Link
              href="/community/posts"
              className="inline-flex items-center text-emerald-600 hover:text-emerald-700"
            >
              <ArrowLeft className="mr-1 h-4 w-4" />
              返回社区
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* 返回按钮 */}
      <div>
        <Link
          href="/community/posts"
          className="inline-flex items-center text-emerald-600 hover:text-emerald-700 transition-colors"
        >
          <ArrowLeft className="mr-1 h-4 w-4" />
          返回社区
        </Link>
      </div>

      {/* 帖子详情 */}
      <article className="bg-white rounded-lg shadow-sm border overflow-hidden">
        {/* 帖子头部 */}
        <div className="p-6 border-b">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">{post.title}</h1>
          
          {/* 作者信息 */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center">
              <div className="w-12 h-12 bg-gray-200 rounded-full overflow-hidden mr-3">
                {post.author?.avatar ? (
                  <Image
                    src={getImageUrl(post.author.avatar)}
                    alt={post.author?.username || '用户'}
                    width={48}
                    height={48}
                    className="object-cover w-full h-full"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-emerald-100 text-emerald-600">
                    <User className="h-6 w-6" />
                  </div>
                )}
              </div>
              <div>
                <div className="font-semibold flex items-center">
                  {post.author?.name || '未知用户'}
                  {/* {post.author?.isExpert && (
                    <span className="ml-2 text-xs bg-emerald-100 text-emerald-800 px-2 py-1 rounded-full">
                      {post.author.expertTitle || '专家'}
                    </span>
                  )} */}
                </div>
                <div className="text-sm text-gray-500">
                  {formatDateTime(post.createdAt)}
                  {post.updatedAt !== post.createdAt && ' (已编辑)'}
                </div>
              </div>
            </div>
            
            {/* 分享按钮 */}
            <button
              onClick={handleShare}
              className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
              title="分享"
            >
              <Share2 className="h-5 w-5" />
            </button>
          </div>
          
          {/* 标签 */}
          <div className="flex flex-wrap gap-2">
            <span className="bg-emerald-100 text-emerald-800 px-3 py-1 rounded-full text-sm font-medium">
              {post.category === 'nutrition' && '营养知识'}
              {post.category === 'recipe' && '食谱分享'}
              {post.category === 'weight-loss' && '减重经验'}
              {post.category === 'fitness' && '健身饮食'}
              {post.category === 'other' && '其他'}
            </span>
            {post.tags?.map((tag: string) => (
              <span key={tag} className="bg-gray-100 text-gray-700 px-3 py-1 rounded-full text-sm">
                #{tag}
              </span>
            ))}
          </div>
        </div>
        
        {/* 帖子内容 */}
        <div className="p-6">
          <div className="prose max-w-none text-gray-800 leading-relaxed">
            {post.contentHtml ? (
              <div dangerouslySetInnerHTML={{ __html: post.contentHtml }} />
            ) : (
              <div className="whitespace-pre-wrap">{post.content}</div>
            )}
          </div>
          
          {/* 帖子图片 */}
          {post.images && post.images.length > 0 && (
            <div className="mt-8">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {post.images.map((image, index) => {
                  console.log('Image URL:', getImageUrl(image.url)); // 调试用
                  return (
                    <div key={index} className="relative aspect-video rounded-lg overflow-hidden bg-gray-100">
                      <Image
                        src={getImageUrl(image.url)}
                        alt={`帖子图片 ${index + 1}`}
                        fill
                        className="object-cover hover:scale-105 transition-transform duration-300"
                      />
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
        
        {/* 帖子底部操作 */}
        <div className="px-6 py-4 border-t bg-gray-50">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-6">
              <button
                onClick={handleLikePost}
                disabled={isLiking}
                className={`flex items-center space-x-2 transition-colors ${
                  post.isLiked 
                    ? 'text-red-500' 
                    : 'text-gray-500 hover:text-red-500'
                } ${isLiking ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                <Heart className={`h-5 w-5 ${post.isLiked ? 'fill-current' : ''}`} />
                <span className="font-medium">{post.likes}</span>
              </button>
              
              <div className="flex items-center space-x-2 text-gray-500">
                <MessageSquare className="h-5 w-5" />
                <span className="font-medium">{post.comments}</span>
              </div>
            </div>
          </div>
        </div>
      </article>

      {/* 评论区 */}
    </div>
  );
}