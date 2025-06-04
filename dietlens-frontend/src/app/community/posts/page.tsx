'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/hooks/useAuth';
import { communityService } from '@/lib/api';
import Image from 'next/image';
import { getImageUrl, formatDate } from '@/lib/utils';
import Link from 'next/link';
import { Search, Filter, BookOpen, Star } from 'lucide-react';

export default function CommunityPosts() {
  const router = useRouter();
  const { user, isAuthenticated } = useAuth();
  const [posts, setPosts] = useState<any[]>([]);
  const [pagination, setPagination] = useState({ total: 0, totalPages: 0, currentPage: 1 });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState({
    category: '',
    tag: '',
    expertOnly: false
  });
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    const fetchPosts = async () => {
      try {
        const response = await communityService.getPosts({
          page: currentPage,
          limit: 10,
          category: filters.category || undefined,
          tag: filters.tag || undefined,
          expertOnly: filters.expertOnly || undefined
        });
        
        setPosts(response.data.posts || []);
        setPagination({
          total: response.data.total || 0,
          totalPages: response.data.totalPages || 0,
          currentPage: response.data.currentPage || 1
        });
        console.log('Posts response:', response.data);
      } catch (err: any) {
        console.error('Failed to fetch posts:', err);
        setError(err.response?.data?.message || '获取帖子列表失败');
      } finally {
        setIsLoading(false);
      }
    };

    fetchPosts();
  }, [currentPage, filters]);

  const handleFilterChange = (key: string, value: any) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    setCurrentPage(1);
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    setIsLoading(true);
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-emerald-500"></div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">DietLens社区</h1>
        {isAuthenticated && (
          <Link
            href="/community/create"
            className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700"
          >
            发布帖子
          </Link>
        )}
      </div>

      {posts.length === 0 ? (
        <div className="bg-white rounded-lg shadow-md p-8 text-center">
          <div className="flex justify-center mb-4">
            <BookOpen className="h-16 w-16 text-gray-300" />
          </div>
          <h2 className="text-xl font-medium mb-2">暂无帖子</h2>
          <p className="text-gray-500 mb-6">
            {filters.category || filters.tag || filters.expertOnly
              ? '没有符合当前筛选条件的帖子'
              : '社区暂时没有任何帖子'}
          </p>
          {isAuthenticated && (
            <Link
              href="/community/create"
              className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700"
            >
              发布第一篇帖子
            </Link>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          {posts.map((post, index) => {
            // 确保每个帖子都有唯一的 key
            const uniqueKey = post.postId || post.id || `post-${index}`;
            
            return (
              <Link
                key={uniqueKey}
                href={`/community/${post.postId || post.id}`}
                className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow"
              >
                {post.coverImage && (
                  <div className="relative w-full h-48">
                    <Image
                      src={getImageUrl(post.coverImage)}
                      alt={post.title}
                      fill
                      className="object-cover"
                    />
                  </div>
                )}
                <div className="p-4">
                  <div className="flex items-center mb-2">
                    <div className="w-8 h-8 bg-gray-200 rounded-full overflow-hidden mr-2">
                      {post.author?.avatar ? (
                        <Image
                          src={getImageUrl(post.author.avatar)}
                          alt={post.author.username || '用户'}
                          width={32}
                          height={32}
                          className="object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-emerald-100 text-emerald-600">
                          {post.author?.username?.charAt(0)?.toUpperCase() || '?'}
                        </div>
                      )}
                    </div>
                    <div>
                      <div className="text-sm font-medium flex items-center">
                        {post.author?.name || '匿名用户'}
                        {post.author?.isExpert && (
                          <span className="ml-1 text-xs bg-emerald-100 text-emerald-800 px-1.5 py-0.5 rounded">
                            专家
                          </span>
                        )}
                      </div>
                      <div className="text-xs text-gray-500">
                        {formatDate(post.createdAt)}
                      </div>
                    </div>
                  </div>
                  <h3 className="font-medium text-lg mb-2">{post.title || '无标题'}</h3>
                  <p className="text-gray-600 text-sm mb-3 line-clamp-2">{post.summary || ''}</p>
                  <div className="flex flex-wrap gap-1 mb-3">
                    <span className="bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded text-xs">
                      {post.category === 'nutrition' && '营养知识'}
                      {post.category === 'recipe' && '食谱分享'}
                      {post.category === 'weight-loss' && '减重经验'}
                      {post.category === 'fitness' && '健身饮食'}
                      {post.category === 'other' && '其他'}
                      {!post.category && '未分类'}
                    </span>
                    {post.tags && Array.isArray(post.tags) && post.tags.slice(0, 2).map((tag: string, tagIndex: number) => (
                      <span 
                        key={`${uniqueKey}-tag-${tagIndex}`} 
                        className="bg-gray-100 text-gray-800 px-2 py-0.5 rounded text-xs"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                  <div className="flex items-center text-sm text-gray-500">
                    <div className="flex items-center mr-4">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                      </svg>
                      {post.likeCount || 0}
                    </div>
                    <div className="flex items-center">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                      </svg>
                      {post.commentCount || 0}
                    </div>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}

      {/* 分页 */}
      {pagination.totalPages > 1 && (
        <div className="flex justify-center items-center space-x-2 my-8">
          <button
            onClick={() => handlePageChange(Math.max(1, currentPage - 1))}
            disabled={currentPage === 1}
            className="px-3 py-2 border rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
          >
            上一页
          </button>
          
          {/* 智能分页显示 */}
          {(() => {
            const pages = [];
            const showPages = 5;
            let start = Math.max(1, currentPage - Math.floor(showPages / 2));
            let end = Math.min(pagination.totalPages, start + showPages - 1);
            
            if (end - start < showPages - 1) {
              start = Math.max(1, end - showPages + 1);
            }
            
            if (start > 1) {
              pages.push(
                <button
                  key="page-1"
                  onClick={() => handlePageChange(1)}
                  className="px-3 py-2 border rounded-lg hover:bg-gray-50"
                >
                  1
                </button>
              );
              if (start > 2) {
                pages.push(<span key="ellipsis-1" className="px-2">...</span>);
              }
            }
            
            for (let i = start; i <= end; i++) {
              pages.push(
                <button
                  key={`page-${i}`}
                  onClick={() => handlePageChange(i)}
                  className={`px-3 py-2 border rounded-lg ${
                    i === currentPage
                      ? 'bg-emerald-600 text-white border-emerald-600'
                      : 'hover:bg-gray-50'
                  }`}
                >
                  {i}
                </button>
              );
            }
            
            if (end < pagination.totalPages) {
              if (end < pagination.totalPages - 1) {
                pages.push(<span key="ellipsis-2" className="px-2">...</span>);
              }
              pages.push(
                <button
                  key={`page-${pagination.totalPages}`}
                  onClick={() => handlePageChange(pagination.totalPages)}
                  className="px-3 py-2 border rounded-lg hover:bg-gray-50"
                >
                  {pagination.totalPages}
                </button>
              );
            }
            
            return pages;
          })()}
          
          <button
            onClick={() => handlePageChange(Math.min(pagination.totalPages, currentPage + 1))}
            disabled={currentPage === pagination.totalPages}
            className="px-3 py-2 border rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
          >
            下一页
          </button>
        </div>
      )}
    </div>
  );
}