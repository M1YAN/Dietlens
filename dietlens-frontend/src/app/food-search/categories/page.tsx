'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/hooks/useAuth';
import { foodSearchService } from '@/lib/api';
import Image from 'next/image';
import { getImageUrl } from '@/lib/utils';
import Link from 'next/link';
import { Search, Filter } from 'lucide-react';

export default function FoodCategories() {
  const router = useRouter();
  const { isAuthenticated } = useAuth();
  const [categories, setCategories] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await foodSearchService.getCategories();
        console.log('Categories response:', response.data); // 调试日志
        setCategories(response.data.categories || []);
      } catch (err: any) {
        console.error('Failed to fetch categories:', err);
        setError(err.response?.data?.message || '获取食物分类失败');
      } finally {
        setIsLoading(false);
      }
    };

    fetchCategories();
  }, []);

  // // 搜索处理函数
  // const handleSearch = () => {
  //   if (searchQuery.trim()) {
  //     router.push(`/food-search/search?query=${encodeURIComponent(searchQuery.trim())}`);
  //   }
  // };

  // // 处理搜索输入
  // const handleSearchInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
  //   setSearchQuery(e.target.value);
  // };

  // // 处理键盘事件
  // const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
  //   if (e.key === 'Enter') {
  //     e.preventDefault();
  //     handleSearch();
  //   }
  // };

  // // 处理搜索按钮点击
  // const handleSearchButtonClick = () => {
  //   handleSearch();
  // };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-emerald-500"></div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">食物分类</h1>


      {/* 空数据状态 */}
      {categories.length === 0 && !isLoading && !error && (
        <div className="text-center py-12 bg-gray-50 rounded-lg">
          <div className="flex justify-center mb-4">
            <Filter className="h-16 w-16 text-gray-300" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">暂无食物分类数据</h3>
          <p className="text-gray-500 mb-4">系统中还没有任何食物分类信息</p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700"
          >
            重新加载
          </button>
        </div>
      )}

      {/* 分类网格 */}
      {categories.length > 0 && (
        <>
          <div className="mb-6">
            <p className="text-gray-600">浏览不同类别的食物，找到您需要的营养信息</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {categories.map((category, index) => {
              // 使用多个备选方案确保 key 的唯一性
              const uniqueKey = category.categoryId || category.id || category.name || `category-${index}`;
              
              return (
                <Link
                  key={uniqueKey}
                  href={`/food-search/categories/${category.categoryId || category.id}`}
                  className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-all duration-200 transform hover:-translate-y-1"
                >
                  <div className="relative w-full h-40">
                    {category.imageUrl ? (
                      <Image
                        src={getImageUrl(category.imageUrl)}
                        alt={category.name || '食物分类'}
                        fill
                        className="object-cover"
                        onError={(e) => {
                          console.error('Category image load error:', e);
                        }}
                      />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-emerald-100 to-emerald-200 flex items-center justify-center">
                        <span className="text-emerald-600 text-4xl font-bold">
                          {category.name ? category.name.charAt(0) : '?'}
                        </span>
                      </div>
                    )}
                    
                    {/* 悬浮遮罩 */}
                    <div className="absolute inset-0 bg-black bg-opacity-0 hover:bg-opacity-20 transition-all duration-200 flex items-center justify-center">
                      <span className="text-white font-medium opacity-0 hover:opacity-100 transition-opacity duration-200">
                        点击查看
                      </span>
                    </div>
                  </div>
                  
                  <div className="p-4">
                    <h3 className="font-medium text-lg mb-1 text-gray-900 line-clamp-1">
                      {category.name || '未知分类'}
                    </h3>
                    {category.description && (
                      <p className="text-gray-500 text-sm mb-3 line-clamp-2">
                        {category.description}
                      </p>
                    )}
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-emerald-600 font-medium">
                        {category.count || 0} 种食物
                      </span>
                      <span className="text-sm text-gray-400 group-hover:text-emerald-600 transition-colors">
                        查看详情 →
                      </span>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        </>
      )}

      {/* 底部操作区域 */}
      <div className="mt-12 bg-gradient-to-r from-emerald-50 to-blue-50 rounded-lg p-6 border border-emerald-100">
        <div className="flex flex-col md:flex-row items-center justify-between">
          <div className="mb-4 md:mb-0">
            <h2 className="text-xl font-bold text-gray-900 mb-2">找不到您要的食物？</h2>
            <p className="text-gray-600">
              您可以添加自定义食物到我们的数据库，方便您和其他用户使用。
            </p>
          </div>
          <div className="flex space-x-3">
            <Link
              href="/food-search/custom"
              className="px-6 py-3 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors font-medium"
            >
              添加自定义食物
            </Link>
            <Link
              href="/food-search/search"
              className="px-6 py-3 bg-white text-emerald-600 border border-emerald-600 rounded-lg hover:bg-emerald-50 transition-colors font-medium"
            >
              高级搜索
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}