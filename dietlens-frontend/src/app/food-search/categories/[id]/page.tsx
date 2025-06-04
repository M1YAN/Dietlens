'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/lib/hooks/useAuth';
import { foodSearchService } from '@/lib/api';
import Image from 'next/image';
import { getImageUrl } from '@/lib/utils';
import Link from 'next/link';
import { ArrowLeft, Search, SortAsc, SortDesc, Heart, HeartOff, Plus, Grid, List, Filter } from 'lucide-react';

export default function CategoryFoods() {
  const { id } = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const [category, setCategory] = useState<any>(null);
  const [foods, setFoods] = useState<any[]>([]);
  const [pagination, setPagination] = useState({ total: 0, totalPages: 0, currentPage: 1 });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sortOption, setSortOption] = useState('name_asc');
  const [currentPage, setCurrentPage] = useState(1);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [searchQuery, setSearchQuery] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({
    caloriesMin: '',
    caloriesMax: '',
    proteinMin: '',
    proteinMax: '',
    showFavoritesOnly: false
  });

  useEffect(() => {
    const fetchCategoryFoods = async () => {
      try {
        const response = await foodSearchService.getCategoryFoods(id as string, {
          page: currentPage,
          limit: 20,
          sort: sortOption as any,
          userId: user?.userId,
          search: searchQuery || undefined,
          ...filters
        });
        
        if (response.status === 200) {
          setCategory(response.data.category);
          setFoods(response.data.foods || []);
          setPagination({
            total: response.data.total || 0,
            totalPages: response.data.totalPages || 0,
            currentPage: response.data.currentPage || 1
          });
        } else {
          setError('获取食物列表失败');
        }
      } catch (err: any) {
        console.error('Failed to fetch category foods:', err);
        setError(err.response?.data?.message || '获取食物列表失败');
      } finally {
        setIsLoading(false);
      }
    };

    if (id) {
      fetchCategoryFoods();
    }
  }, [id, currentPage, sortOption, user, searchQuery, filters]);

  const handleSortChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSortOption(e.target.value);
    setCurrentPage(1);
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    setIsLoading(true);
  };

  const handleToggleFavorite = async (foodId: string, isFavorite: boolean) => {
    if (!user?.userId) return;
    
    try {
      await foodSearchService.toggleFavoriteFood(
        user.userId,
        foodId,
        isFavorite ? 'remove' : 'add'
      );
      
      setFoods(foods.map(food => 
        food.id === foodId ? { ...food, isFavorite: !isFavorite } : food
      ));
    } catch (err) {
      console.error('Failed to toggle favorite:', err);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setCurrentPage(1);
  };

  const handleAddToMeal = (food: any) => {
    // 这里可以添加快速添加到餐食的功能
    router.push(`/nutrition/daily?addFood=${food.id}`);
  };

  const clearFilters = () => {
    setFilters({
      caloriesMin: '',
      caloriesMax: '',
      proteinMin: '',
      proteinMax: '',
      showFavoritesOnly: false
    });
    setSearchQuery('');
    setCurrentPage(1);
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-emerald-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="bg-red-50 p-6 rounded-lg text-center">
          <h2 className="text-xl font-bold text-red-600 mb-2">出错了</h2>
          <p className="text-red-600 mb-4">{error}</p>
          <Link
            href="/food-search/categories"
            className="inline-flex items-center text-emerald-600 hover:text-emerald-700"
          >
            <ArrowLeft className="mr-1 h-4 w-4" />
            返回分类列表
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      {/* 面包屑导航 */}
      <div className="mb-6">
        <Link
          href="/food-search/categories"
          className="inline-flex items-center text-emerald-600 hover:text-emerald-700"
        >
          <ArrowLeft className="mr-1 h-4 w-4" />
          返回分类列表
        </Link>
      </div>

      {/* 页面标题 */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">{category?.name || '食物分类'}</h1>
          {category?.description && (
            <p className="text-gray-600 mt-2">{category.description}</p>
          )}
          <div className="text-sm text-gray-500 mt-1">
            共 {pagination.total} 种食物
          </div>
        </div>
      </div>

      {/* 搜索和工具栏 */}
      <div className="bg-white rounded-lg shadow-sm border p-4 mb-6">
        <div className="flex flex-col lg:flex-row gap-4">
          {/* 搜索框 */}
          <form onSubmit={handleSearch} className="flex-1">
            <div className="relative">
              <input
                type="text"
                placeholder="搜索食物名称..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full px-4 py-2 pl-10 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            </div>
          </form>

          {/* 工具按钮 */}
          <div className="flex items-center space-x-2">
            {/* 视图切换 */}
            <div className="flex border border-gray-300 rounded-lg">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-2 ${viewMode === 'grid' ? 'bg-emerald-100 text-emerald-600' : 'text-gray-400'}`}
              >
                <Grid className="h-4 w-4" />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-2 ${viewMode === 'list' ? 'bg-emerald-100 text-emerald-600' : 'text-gray-400'}`}
              >
                <List className="h-4 w-4" />
              </button>
            </div>

            {/* 筛选按钮 */}
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`flex items-center px-3 py-2 border rounded-lg ${
                showFilters ? 'bg-emerald-100 text-emerald-600 border-emerald-300' : 'border-gray-300'
              }`}
            >
              <Filter className="h-4 w-4 mr-1" />
              筛选
            </button>

            {/* 排序 */}
            <select
              value={sortOption}
              onChange={handleSortChange}
              className="border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            >
              <option value="name_asc">名称 ↑</option>
              <option value="name_desc">名称 ↓</option>
              <option value="calories_asc">热量 ↑</option>
              <option value="calories_desc">热量 ↓</option>
              <option value="popularity">热门程度</option>
            </select>
          </div>
        </div>

        {/* 筛选面板 */}
        {showFilters && (
          <div className="mt-4 pt-4 border-t border-gray-200">
            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
              <div>
                <label className="block text-sm text-gray-600 mb-1">最低热量</label>
                <input
                  type="number"
                  placeholder="kcal"
                  value={filters.caloriesMin}
                  onChange={(e) => setFilters({...filters, caloriesMin: e.target.value})}
                  className="w-full px-3 py-1 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-600 mb-1">最高热量</label>
                <input
                  type="number"
                  placeholder="kcal"
                  value={filters.caloriesMax}
                  onChange={(e) => setFilters({...filters, caloriesMax: e.target.value})}
                  className="w-full px-3 py-1 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-600 mb-1">最低蛋白质</label>
                <input
                  type="number"
                  placeholder="g"
                  value={filters.proteinMin}
                  onChange={(e) => setFilters({...filters, proteinMin: e.target.value})}
                  className="w-full px-3 py-1 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
              <div className="flex items-end">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={filters.showFavoritesOnly}
                    onChange={(e) => setFilters({...filters, showFavoritesOnly: e.target.checked})}
                    className="mr-2"
                  />
                  <span className="text-sm text-gray-600">仅显示收藏</span>
                </label>
              </div>
              <div className="flex items-end">
                <button
                  onClick={clearFilters}
                  className="px-3 py-1 text-sm text-gray-600 border border-gray-300 rounded hover:bg-gray-50"
                >
                  清空筛选
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 食物列表 */}
      {foods.length === 0 ? (
        <div className="bg-white rounded-lg shadow-sm border p-12 text-center">
          <div className="text-gray-400 mb-4">
            <Search className="h-12 w-12 mx-auto" />
          </div>
          <h3 className="text-xl font-medium text-gray-900 mb-2">暂无食物</h3>
          <p className="text-gray-500 mb-4">
            {searchQuery ? '未找到匹配的食物，请尝试其他关键词' : '该分类下暂时没有食物'}
          </p>
          {searchQuery && (
            <button
              onClick={clearFilters}
              className="text-emerald-600 hover:text-emerald-700"
            >
              清空搜索条件
            </button>
          )}
        </div>
      ) : (
        <>
          {viewMode === 'grid' ? (
            // 网格视图
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mb-8">
              {foods.map((food) => (
                <div
                  key={food.id}
                  className="bg-white rounded-lg shadow-sm border overflow-hidden hover:shadow-md transition-all duration-200 group"
                >
                  <div className="relative">
                    <Link href={`/food-search/${food.id}`}>
                      <div className="relative w-full h-48">
                        {food.imageUrl ? (
                          <Image
                            src={getImageUrl(food.imageUrl)}
                            alt={food.name}
                            fill
                            className="object-cover group-hover:scale-105 transition-transform duration-200"
                          />
                        ) : (
                          <div className="w-full h-full bg-gradient-to-br from-emerald-50 to-emerald-100 flex items-center justify-center">
                            <span className="text-emerald-600 text-3xl font-bold">
                              {food.name.charAt(0)}
                            </span>
                          </div>
                        )}
                      </div>
                    </Link>
                    
                    {/* 悬浮工具栏 */}
                    <div className="absolute top-2 right-2 flex space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      {user && (
                        <button
                          onClick={() => handleToggleFavorite(food.id, food.isFavorite)}
                          className="p-2 bg-white rounded-full shadow-md hover:shadow-lg transition-shadow"
                        >
                          {food.isFavorite ? (
                            <Heart className="h-4 w-4 fill-red-500 text-red-500" />
                          ) : (
                            <Heart className="h-4 w-4 text-gray-600" />
                          )}
                        </button>
                      )}
                      <button
                        onClick={() => handleAddToMeal(food)}
                        className="p-2 bg-emerald-600 text-white rounded-full shadow-md hover:shadow-lg hover:bg-emerald-700 transition-all"
                      >
                        <Plus className="h-4 w-4" />
                      </button>
                    </div>
                  </div>

                  <div className="p-4">
                    <Link href={`/food-search/${food.id}`}>
                      <h3 className="font-semibold text-lg mb-1 hover:text-emerald-600 transition-colors line-clamp-1">
                        {food.name}
                      </h3>
                    </Link>
                    <p className="text-sm text-gray-500 mb-3">{food.servingSize}</p>
                    
                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="bg-emerald-100 text-emerald-800 px-2 py-1 rounded-full text-sm font-medium">
                          {food.calories} 千卡
                        </span>
                        {food.isFavorite && (
                          <span className="text-red-500 text-xs">
                            <Heart className="h-3 w-3 fill-current inline" />
                          </span>
                        )}
                      </div>
                      
                      <div className="grid grid-cols-3 gap-1 text-xs text-gray-600">
                        <div className="text-center">
                          <div className="font-medium">{food.protein}g</div>
                          <div>蛋白质</div>
                        </div>
                        <div className="text-center">
                          <div className="font-medium">{food.carbs}g</div>
                          <div>碳水</div>
                        </div>
                        <div className="text-center">
                          <div className="font-medium">{food.fat}g</div>
                          <div>脂肪</div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            // 列表视图
            <div className="space-y-4 mb-8">
              {foods.map((food) => (
                <div
                  key={food.id}
                  className="bg-white rounded-lg shadow-sm border p-4 hover:shadow-md transition-shadow"
                >
                  <div className="flex items-center space-x-4">
                    <Link href={`/food-search/${food.id}`}>
                      <div className="relative w-16 h-16 flex-shrink-0">
                        {food.imageUrl ? (
                          <Image
                            src={getImageUrl(food.imageUrl)}
                            alt={food.name}
                            fill
                            className="object-cover rounded-lg"
                          />
                        ) : (
                          <div className="w-full h-full bg-emerald-50 rounded-lg flex items-center justify-center">
                            <span className="text-emerald-600 text-lg font-bold">
                              {food.name.charAt(0)}
                            </span>
                          </div>
                        )}
                      </div>
                    </Link>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between">
                        <div>
                          <Link href={`/food-search/${food.id}`}>
                            <h3 className="font-semibold text-lg hover:text-emerald-600 transition-colors">
                              {food.name}
                            </h3>
                          </Link>
                          <p className="text-sm text-gray-500">{food.servingSize}</p>
                        </div>
                        
                        <div className="flex items-center space-x-2">
                          {user && (
                            <button
                              onClick={() => handleToggleFavorite(food.id, food.isFavorite)}
                              className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                            >
                              {food.isFavorite ? (
                                <Heart className="h-5 w-5 fill-red-500 text-red-500" />
                              ) : (
                                <Heart className="h-5 w-5 text-gray-400" />
                              )}
                            </button>
                          )}
                          <button
                            onClick={() => handleAddToMeal(food)}
                            className="px-3 py-1 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors text-sm"
                          >
                            添加
                          </button>
                        </div>
                      </div>
                      
                      <div className="mt-2 flex items-center space-x-4 text-sm">
                        <span className="bg-emerald-100 text-emerald-800 px-2 py-1 rounded text-sm">
                          {food.calories} 千卡
                        </span>
                        <span className="text-gray-600">蛋白质: {food.protein}g</span>
                        <span className="text-gray-600">碳水: {food.carbs}g</span>
                        <span className="text-gray-600">脂肪: {food.fat}g</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {/* 分页 */}
      {pagination.totalPages > 1 && (
        <div className="flex justify-center items-center space-x-2">
          <button
            onClick={() => handlePageChange(Math.max(1, currentPage - 1))}
            disabled={currentPage === 1}
            className="px-4 py-2 border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
          >
            上一页
          </button>
          
          <div className="flex space-x-1">
            {Array.from({ length: Math.min(5, pagination.totalPages) }, (_, i) => {
              let pageNum;
              if (pagination.totalPages <= 5) {
                pageNum = i + 1;
              } else if (currentPage <= 3) {
                pageNum = i + 1;
              } else if (currentPage >= pagination.totalPages - 2) {
                pageNum = pagination.totalPages - 4 + i;
              } else {
                pageNum = currentPage - 2 + i;
              }
              
              return (
                <button
                  key={pageNum}
                  onClick={() => handlePageChange(pageNum)}
                  className={`px-3 py-2 border rounded-lg ${
                    pageNum === currentPage
                      ? 'bg-emerald-600 text-white border-emerald-600'
                      : 'border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  {pageNum}
                </button>
              );
            })}
          </div>
          
          <button
            onClick={() => handlePageChange(Math.min(pagination.totalPages, currentPage + 1))}
            disabled={currentPage === pagination.totalPages}
            className="px-4 py-2 border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
          >
            下一页
          </button>
        </div>
      )}
    </div>
  );
}