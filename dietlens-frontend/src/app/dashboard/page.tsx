'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/hooks/useAuth';
import { BentoGrid, BentoCard } from '@/components/bento/BentoGrid';
import { Camera, Search, BookOpen, PieChart, TrendingUp, Star, User, Calendar, BarChart } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { foodRecognitionService, nutritionService, foodSearchService, communityService } from '@/lib/api';
import { getImageUrl, formatDate } from '@/lib/utils';

export default function Dashboard() {
  const router = useRouter();
  const { user, isAuthenticated, isLoading } = useAuth();
  const [nutritionData, setNutritionData] = useState<any>(null);
  const [recentRecognitions, setRecentRecognitions] = useState<any[]>([]);
  const [recommendedFoods, setRecommendedFoods] = useState<any[]>([]);
  const [popularPosts, setPopularPosts] = useState<any[]>([]);
  const [isDataLoading, setIsDataLoading] = useState(true);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/auth/login');
      return;
    }

    if (isAuthenticated && user) {
      fetchDashboardData();
    }
  }, [isAuthenticated, isLoading, user, router]);

  const fetchDashboardData = async () => {
    setIsDataLoading(true);
    try {
      // 获取今日营养数据
      const nutritionResponse = await nutritionService.getDailyIntake(user.userId);
      setNutritionData(nutritionResponse.data);
      console.log('Nutrition data:', nutritionResponse.data);

      // 获取最近识别记录
      const recognitionsResponse = await foodRecognitionService.getHistory({
        userId: user.userId,
        limit: 3
      });
      setRecentRecognitions(recognitionsResponse.data.items || []);
      console.log('Recent recognitions:', recognitionsResponse.data.items);

      // 获取推荐食物
      const recommendedResponse = await foodSearchService.getPopularFoods(3, user.userId);
      setRecommendedFoods(recommendedResponse.data.foods || []);

      // 获取热门帖子
      const postsResponse = await communityService.getPosts({
        filter: 'popular',
        limit: 3
      });
      setPopularPosts(postsResponse.data.posts || []);
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error);
    } finally {
      setIsDataLoading(false);
    }
  };

  if (isLoading || isDataLoading) {
    return (
      <div className="flex justify-center items-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-emerald-500"></div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">欢迎回来，{user?.username || '用户'}</h1>
      
      <BentoGrid className="mb-8">
        {/* 今日营养摄入 */}
        <BentoCard 
          size="2x2" 
          title="今日营养摄入" 
          icon={<PieChart className="h-5 w-5" />}
        >
          {nutritionData ? (
            <div className="h-full flex flex-col">
              {/* 主要营养素：热量和蛋白质 */}
              <div className="grid grid-cols-2 gap-4 mb-3">
                <div className="bg-emerald-50 rounded-lg p-3">
                  <div className="text-sm text-gray-500 mb-1">已摄入热量</div>
                  <div className="text-xl font-semibold">
                    {nutritionData.totals.calories} / {nutritionData.goals.calories} 千卡
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2.5 mt-2">
                    <div 
                      className="bg-emerald-500 h-2.5 rounded-full" 
                      style={{ width: `${Math.min(100, nutritionData.percentages.calories)}%` }}
                    ></div>
                  </div>
                </div>
                <div className="bg-blue-50 rounded-lg p-3">
                  <div className="text-sm text-gray-500 mb-1">已摄入蛋白质</div>
                  <div className="text-xl font-semibold">
                    {parseFloat(nutritionData.totals.protein).toFixed(2)} / {nutritionData.goals.protein} 克
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2.5 mt-2">
                    <div 
                      className="bg-blue-500 h-2.5 rounded-full" 
                      style={{ width: `${Math.min(100, nutritionData.percentages.protein)}%` }}
                    ></div>
                  </div>
                </div>
              </div>
              
              {/* 次要营养素：碳水、脂肪、纤维 */}
              <div className="grid grid-cols-3 gap-2 mb-2">
                <div className="bg-gray-50 rounded-lg p-2">
                  <div className="text-xs text-gray-500 mb-1">碳水</div>
                  <div className="text-sm font-medium">
                    {parseFloat(nutritionData.totals.carbs).toFixed(2)} / {nutritionData.goals.carbs}g
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-1.5 mt-1">
                    <div 
                      className="bg-yellow-500 h-1.5 rounded-full" 
                      style={{ width: `${Math.min(100, nutritionData.percentages.carbs)}%` }}
                    ></div>
                  </div>
                </div>
                <div className="bg-gray-50 rounded-lg p-2">
                  <div className="text-xs text-gray-500 mb-1">脂肪</div>
                  <div className="text-sm font-medium">
                    {parseFloat(nutritionData.totals.fat).toFixed(2)} / {nutritionData.goals.fat}g
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-1.5 mt-1">
                    <div 
                      className="bg-red-500 h-1.5 rounded-full" 
                      style={{ width: `${Math.min(100, nutritionData.percentages.fat)}%` }}
                    ></div>
                  </div>
                </div>
                <div className="bg-gray-50 rounded-lg p-2">
                  <div className="text-xs text-gray-500 mb-1">纤维</div>
                  <div className="text-sm font-medium">
                    {parseFloat(nutritionData.totals.fiber).toFixed(2)} / {nutritionData.goals.fiber}g
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-1.5 mt-1">
                    <div 
                      className="bg-green-500 h-1.5 rounded-full" 
                      style={{ width: `${Math.min(100, nutritionData.percentages.fiber)}%` }}
                    ></div>
                  </div>
                </div>
              </div>
              
              {/* 新增营养素：糖和钠 */}
              {/* <div className="grid grid-cols-2 gap-2">
                <div className="bg-gray-50 rounded-lg p-2">
                  <div className="text-xs text-gray-500 mb-1">糖</div>
                  <div className="text-sm font-medium">
                    {nutritionData.totals.sugar} / {nutritionData.goals.sugar}g
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-1.5 mt-1">
                    <div 
                      className="bg-purple-500 h-1.5 rounded-full" 
                      style={{ width: `${Math.min(100, nutritionData.percentages.sugar)}%` }}
                    ></div>
                  </div>
                </div>
                <div className="bg-gray-50 rounded-lg p-2">
                  <div className="text-xs text-gray-500 mb-1">钠</div>
                  <div className="text-sm font-medium">
                    {nutritionData.totals.sodium} / {nutritionData.goals.sodium}mg
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-1.5 mt-1">
                    <div 
                      className="bg-orange-500 h-1.5 rounded-full" 
                      style={{ width: `${Math.min(100, nutritionData.percentages.sodium)}%` }}
                    ></div>
                  </div>
                </div>
              </div> */}
              
              {/* 保留详细记录链接 */}
              <div className="mt-auto pt-3">
                <Link 
                  href="/nutrition/daily" 
                  className="text-emerald-600 hover:text-emerald-700 text-sm font-medium flex items-center"
                >
                  查看详细营养记录
                  <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </Link>
              </div>
            </div>
           ) : (
            <div className="h-full flex flex-col items-center justify-center">
              <div className="text-gray-400 mb-4">暂无今日营养数据</div>
              <Link 
                href="/nutrition/goals" 
                className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700"
              >
                设置营养目标
              </Link>
            </div>
          )}
        </BentoCard>
        
        {/* 个人资料 */}
        <BentoCard 
          size="1x1" 
          title="个人资料" 
          icon={<User className="h-5 w-5" />}
        >
          <div className="flex flex-col items-center">
            <div className="w-16 h-16 rounded-full bg-gray-200 overflow-hidden mb-2">
              {user?.avatar ? (
                <Image 
                  src={getImageUrl(user.avatar)} 
                  alt={user.username} 
                  width={64} 
                  height={64} 
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-emerald-100 text-emerald-600 text-xl font-bold">
                  {user?.username?.charAt(0).toUpperCase() || 'U'}
                </div>
              )}
            </div>
            <div className="font-medium">{user?.username || '用户'}</div>
            {user?.isExpert && (
              <div className="text-xs px-2 py-0.5 bg-yellow-100 text-yellow-800 rounded-full mt-1">
                营养专家
              </div>
            )}
            <Link 
              href="/profile" 
              className="mt-3 text-sm text-emerald-600 hover:text-emerald-700"
            >
              编辑资料
            </Link>
          </div>
        </BentoCard>
        
        {/* 快速操作 */}
        <BentoCard 
          size="1x1" 
          title="快速操作" 
          icon={<Star className="h-5 w-5" />}
        >
          <div className="space-y-3">
            <Link 
              href="/food-recognition/upload" 
              className="flex items-center p-2 bg-emerald-50 rounded-lg hover:bg-emerald-100"
            >
              <Camera className="h-4 w-4 text-emerald-600 mr-2" />
              <span className="text-sm">识别食物</span>
            </Link>
            <Link 
              href="/food-search/categories" 
              className="flex items-center p-2 bg-blue-50 rounded-lg hover:bg-blue-100"
            >
              <Search className="h-4 w-4 text-blue-600 mr-2" />
              <span className="text-sm">食物分类</span>
            </Link>
            <Link 
              href="/community/posts" 
              className="flex items-center p-2 bg-purple-50 rounded-lg hover:bg-purple-100"
            >
              <BookOpen className="h-4 w-4 text-purple-600 mr-2" />
              <span className="text-sm">浏览社区</span>
            </Link>
          </div>
        </BentoCard>
        
        {/* 营养目标 */}
        <BentoCard 
          size="1x1" 
          title="营养目标" 
          icon={<TrendingUp className="h-5 w-5" />}
        >
          {nutritionData?.goals ? (
            <div className="space-y-3">
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-gray-500">每日热量目标</span>
                  <span className="font-medium">{nutritionData.goals.calories} 千卡</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-1.5">
                  <div 
                    className="bg-emerald-500 h-1.5 rounded-full" 
                    style={{ width: '100%' }}
                  ></div>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="bg-gray-50 p-2 rounded">
                  <span className="text-gray-500">蛋白质</span>
                  <div className="font-medium">{nutritionData.goals.protein}g</div>
                </div>
                <div className="bg-gray-50 p-2 rounded">
                  <span className="text-gray-500">碳水</span>
                  <div className="font-medium">{nutritionData.goals.carbs}g</div>
                </div>
              </div>
              
              <Link 
                href="/nutrition/goals" 
                className="text-emerald-600 hover:text-emerald-700 text-sm flex items-center"
              >
                调整目标
                <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </Link>
            </div>
           ) : (
            <div className="h-full flex flex-col items-center justify-center">
              <div className="text-gray-400 mb-2 text-sm">未设置营养目标</div>
              <Link 
                href="/nutrition/goals" 
                className="px-3 py-1 bg-emerald-600 text-white text-sm rounded-lg hover:bg-emerald-700"
              >
                立即设置
              </Link>
            </div>
          )}
        </BentoCard>
        
        {/* 最近识别记录 */}
        <BentoCard 
          size="2x1" 
          title="最近识别记录" 
          icon={<Calendar className="h-5 w-5" />}
        >
          {recentRecognitions.length > 0 ? (
            <div className="grid grid-cols-3 gap-3">
              {recentRecognitions.slice(0, 3).map((record) => (
                <Link 
                  key={record.recognitionId} 
                  href={`/food-recognition/${record.recognitionId}`}
                  className="block bg-gray-50 rounded-lg overflow-hidden hover:bg-gray-100"
                >
                  <div className="h-24 bg-gray-200 relative">
                    {record.imageUrl && (
                      <Image 
                        src={getImageUrl(record.imageUrl)} 
                        alt="Food" 
                        fill
                        className="object-cover"
                      />
                    )}
                  </div>
                  <div className="p-2">
                    <div className="text-sm font-medium truncate">
                      {record.foods && record.foods.length > 0 
                        ? record.foods.map(f => f.name).join(', ') 
                        : '未识别食物'}
                    </div>
                    <div className="text-xs text-gray-500 mt-1">
                      {formatDate(record.timestamp)}
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="h-full flex flex-col items-center justify-center">
              <div className="text-gray-400 mb-3">暂无识别记录</div>
              <Link 
                href="/food-recognition/upload" 
                className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700"
              >
                开始识别食物
              </Link>
            </div>
          )}
        </BentoCard>
        
        {/* 推荐食物 */}
        <BentoCard 
          size="2x1" 
          title="推荐食物" 
          icon={<BarChart className="h-5 w-5" />}
        >
          {recommendedFoods.length > 0 ? (
            <div className="grid grid-cols-3 gap-3">
              {recommendedFoods.slice(0, 3).map((food) => (
                <Link 
                  key={food.id} 
                  href={`/food-search/${food.id}`}
                  className="block bg-gray-50 rounded-lg overflow-hidden hover:bg-gray-100"
                >
                  <div className="h-24 bg-gray-200 relative">
                    {food.imageUrl && (
                      <Image 
                        src={getImageUrl(food.imageUrl)} 
                        alt={food.name} 
                        fill
                        className="object-cover"
                      />
                    )}
                  </div>
                  <div className="p-2">
                    <div className="text-sm font-medium truncate">{food.name}</div>
                    <div className="text-xs text-gray-500 mt-1">
                      {food.calories} 千卡 / {food.servingSize}
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="h-full flex flex-col items-center justify-center">
              <div className="text-gray-400 mb-3">暂无推荐食物</div>
              <Link 
                href="/food-search/categories" 
                className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700"
              >
                浏览食物库
              </Link>
            </div>
          )}
        </BentoCard>
        
        {/* 社区热门 */}
        <BentoCard 
          size="2x1" 
          title="社区热门" 
          icon={<BookOpen className="h-5 w-5" />}
        >
          {popularPosts.length > 0 ? (
            <div className="grid grid-cols-3 gap-3">
              {popularPosts.slice(0, 3).map((post) => (
                <Link 
                  key={post.id} 
                  href={`/community/${post.id}`}
                  className="block bg-gray-50 rounded-lg overflow-hidden hover:bg-gray-100"
                >
                  <div className="h-24 bg-gray-200 relative">
                    {post.images && post.images.length > 0 && (
                      <Image 
                        src={getImageUrl(post.images[0].url)} 
                        alt={post.title} 
                        fill
                        className="object-cover"
                      />
                    )}
                  </div>
                  <div className="p-2">
                    <div className="text-sm font-medium truncate">{post.title}</div>
                    <div className="text-xs text-gray-500 mt-1 flex items-center">
                      <span className="truncate">{post.author.name}</span>
                      {post.author.isExpert && (
                        <span className="ml-1 text-yellow-500">✓</span>
                      )}
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="h-full flex flex-col items-center justify-center">
              <div className="text-gray-400 mb-3">暂无热门帖子</div>
              <Link 
                href="/community/posts" 
                className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700"
              >
                浏览社区
              </Link>
            </div>
          )}
        </BentoCard>
      </BentoGrid>
    </div>
  );
}
