'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/lib/hooks/useAuth';
import { foodSearchService, nutritionService } from '@/lib/api';
import Image from 'next/image';
import { getImageUrl } from '@/lib/utils';
import Link from 'next/link';
import { ArrowLeft, Heart, Plus, Info } from 'lucide-react';

export default function FoodDetail() {
  const { id } = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const [food, setFood] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedServing, setSelectedServing] = useState<any>(null);
  const [isFavorite, setIsFavorite] = useState(false);
  const [dailyIntake, setDailyIntake] = useState<any>(null);
  const [selectedMeal, setSelectedMeal] = useState<string>('');
  const [isAddingToMeal, setIsAddingToMeal] = useState(false);
  const [addSuccess, setAddSuccess] = useState(false);

  useEffect(() => {
    const fetchFoodDetail = async () => {
      try {
        const response = await foodSearchService.getFoodDetail(
          id as string,
          user?.userId
        );
        
        const foodData = response.data;
        setFood(foodData);
        setIsFavorite(foodData.isFavorite || false);
        
        // 设置默认选中的份量
        const defaultServing = foodData.servingSizes.find((s: any) => s.isDefault) || foodData.servingSizes[0];
        setSelectedServing(defaultServing);
        
        // 如果用户已登录，获取今日营养摄入数据
        if (user?.userId) {
          try {
            const intakeResponse = await nutritionService.getDailyIntake(user.userId);
            setDailyIntake(intakeResponse.data);
            if (intakeResponse.data.meals && intakeResponse.data.meals.length > 0) {
              setSelectedMeal(intakeResponse.data.meals[0].id);
            }
            console.log('Daily intake fetched:', intakeResponse.data);
          } catch (err) {
            console.error('Failed to fetch daily intake:', err);
          }
        }
      } catch (err: any) {
        console.error('Failed to fetch food detail:', err);
        setError(err.response?.data?.message || '获取食物详情失败');
      } finally {
        setIsLoading(false);
      }
    };

    if (id) {
      fetchFoodDetail();
    }
  }, [id, user]);

  const handleToggleFavorite = async () => {
    if (!user?.userId || !food) return;
    
    try {
      await foodSearchService.toggleFavoriteFood(
        user.userId,
        food.id,
        "add"
      );
      
      setIsFavorite(!isFavorite);
    } catch (err) {
      console.error('Failed to toggle favorite:', err);
    }
  };

  const handleAddToMeal = async () => {
    if (!user?.userId || !food || !selectedMeal || !selectedServing) return;
    
    setIsAddingToMeal(true);
    setAddSuccess(false);
    
    try {
      const today = new Date().toISOString().split('T')[0]; // 今天的日期，格式：YYYY-MM-DD
      await nutritionService.addFoodToDailyIntake(
        user.userId,
        today,
        selectedMeal,
        {
          foodId: food.id,
          weight: selectedServing.weight,
          amount: selectedServing.name
        }
      );

      console.log('Food added to meal successfully');
      
      setAddSuccess(true);
      setTimeout(() => setAddSuccess(false), 3000);
    } catch (err) {
      console.error('Failed to add food to meal:', err);
    } finally {
      setIsAddingToMeal(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-emerald-500"></div>
      </div>
    );
  }

  if (error || !food) {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="bg-red-50 p-6 rounded-lg text-center">
          <h2 className="text-xl font-bold text-red-600 mb-2">出错了</h2>
          <p className="text-red-600 mb-4">{error || '未找到食物信息'}</p>
          <Link
            href="/food-search/categories"
            className="inline-flex items-center text-emerald-600 hover:text-emerald-700"
          >
            <ArrowLeft className="mr-1 h-4 w-4" />
            返回食物分类
          </Link>
        </div>
      </div>
    );
  }

  // 计算选中份量的营养素
  const calculateNutrition = (nutrient: string) => {
    if (!selectedServing || !food.nutrition) return 0;
    const baseValue = food.nutrition[nutrient] || 0;
    const ratio = selectedServing.weight / 100; // 假设基础营养数据是基于100g计算的
    return Math.round(baseValue * ratio * 10) / 10; // 保留一位小数
  };

  return (
    <div className="max-w-6xl mx-auto">
      <div className="mb-6">
        <Link
          href={`/food-search/categories/${food.category}`}
          className="inline-flex items-center text-emerald-600 hover:text-emerald-700"
        >
          <ArrowLeft className="mr-1 h-4 w-4" />
          返回{food.categoryName}
        </Link>
      </div>

      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="md:flex">
          <div className="md:w-1/3">
            <div className="relative w-full h-64 md:h-full">
              {food.imageUrl ? (
                <Image
                  src={getImageUrl(food.imageUrl)}
                  alt={food.name}
                  fill
                  className="object-cover"
                />
              ) : (
                <div className="w-full h-full bg-emerald-50 flex items-center justify-center">
                  <span className="text-emerald-600 text-4xl">{food.name.charAt(0)}</span>
                </div>
              )}
            </div>
          </div>
          
          <div className="md:w-2/3 p-6">
            <div className="flex justify-between items-start">
              <h1 className="text-2xl font-bold">{food.name}</h1>
              {user && (
                <button
                  onClick={handleToggleFavorite}
                  className="text-gray-400 hover:text-red-500"
                >
                  {isFavorite ? (
                    <Heart className="h-6 w-6 fill-red-500 text-red-500" />
                  ) : (
                    <Heart className="h-6 w-6" />
                  )}
                </button>
              )}
            </div>
            
            <div className="mt-2 text-gray-500">
              <span className="bg-emerald-100 text-emerald-800 px-2 py-1 rounded text-sm mr-2">
                {food.categoryName}
              </span>
              {food.tags && food.tags.map((tag: string) => (
                <span key={tag} className="bg-gray-100 text-gray-800 px-2 py-1 rounded text-sm mr-2">
                  {tag}
                </span>
              ))}
            </div>
            
            {food.description && (
              <p className="mt-4 text-gray-600">{food.description}</p>
            )}
            
            <div className="mt-6">
              <h2 className="text-lg font-medium mb-3">份量选择</h2>
              <div className="flex flex-wrap gap-2">
                {food.servingSizes.map((serving: any) => (
                  <button
                    key={serving.name}
                    onClick={() => setSelectedServing(serving)}
                    className={`px-3 py-2 rounded-lg border ${
                      selectedServing?.name === serving.name
                        ? 'border-emerald-600 bg-emerald-50 text-emerald-800'
                        : 'border-gray-300 hover:border-emerald-300'
                    }`}
                  >
                    {serving.name} ({serving.weight}g)
                  </button>
                ))}
              </div>
            </div>
            
            <div className="mt-6">
              <h2 className="text-lg font-medium mb-3">营养成分</h2>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <div className="bg-emerald-50 p-3 rounded-lg">
                  <div className="text-sm text-gray-500">热量</div>
                  <div className="text-xl font-bold">{calculateNutrition('calories')} 千卡</div>
                </div>
                <div className="bg-blue-50 p-3 rounded-lg">
                  <div className="text-sm text-gray-500">蛋白质</div>
                  <div className="text-xl font-bold">{calculateNutrition('protein')} 克</div>
                </div>
                <div className="bg-yellow-50 p-3 rounded-lg">
                  <div className="text-sm text-gray-500">碳水化合物</div>
                  <div className="text-xl font-bold">{calculateNutrition('carbs')} 克</div>
                </div>
                <div className="bg-red-50 p-3 rounded-lg">
                  <div className="text-sm text-gray-500">脂肪</div>
                  <div className="text-xl font-bold">{calculateNutrition('fat')} 克</div>
                </div>
                <div className="bg-green-50 p-3 rounded-lg">
                  <div className="text-sm text-gray-500">膳食纤维</div>
                  <div className="text-xl font-bold">{calculateNutrition('fiber')} 克</div>
                </div>
                {food.nutrition.sugar !== undefined && (
                  <div className="bg-purple-50 p-3 rounded-lg">
                    <div className="text-sm text-gray-500">糖</div>
                    <div className="text-xl font-bold">{calculateNutrition('sugar')} 克</div>
                  </div>
                )}
              </div>
              
              {/* 更多营养素信息 */}
              <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                {food.nutrition.sodium !== undefined && (
                  <div>
                    <span className="text-gray-500">钠: </span>
                    {calculateNutrition('sodium')} 毫克
                  </div>
                )}
                {food.nutrition.potassium !== undefined && (
                  <div>
                    <span className="text-gray-500">钾: </span>
                    {calculateNutrition('potassium')} 毫克
                  </div>
                )}
                {food.nutrition.vitaminA !== undefined && (
                  <div>
                    <span className="text-gray-500">维生素A: </span>
                    {calculateNutrition('vitaminA')} %
                  </div>
                )}
                {food.nutrition.vitaminC !== undefined && (
                  <div>
                    <span className="text-gray-500">维生素C: </span>
                    {calculateNutrition('vitaminC')} %
                  </div>
                )}
                {food.nutrition.calcium !== undefined && (
                  <div>
                    <span className="text-gray-500">钙: </span>
                    {calculateNutrition('calcium')} %
                  </div>
                )}
                {food.nutrition.iron !== undefined && (
                  <div>
                    <span className="text-gray-500">铁: </span>
                    {calculateNutrition('iron')} %
                  </div>
                )}
              </div>
            </div>
            
            {user && dailyIntake && dailyIntake.meals && dailyIntake.meals.length > 0 && (
              <div className="mt-6">
                <h2 className="text-lg font-medium mb-3">添加到今日记录</h2>
                <div className="flex flex-col sm:flex-row gap-3">
                  <select
                    value={selectedMeal}
                    onChange={(e) => setSelectedMeal(e.target.value)}
                    className="border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  >
                    {dailyIntake.meals.map((meal: any) => (
                      <option key={meal.id} value={meal.id}>
                        {meal.name} ({meal.time})
                      </option>
                    ))}
                  </select>
                  <button
                    onClick={handleAddToMeal}
                    disabled={isAddingToMeal}
                    className="flex items-center justify-center px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:opacity-50"
                  >
                    {isAddingToMeal ? (
                      <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-white mr-2"></div>
                    ) : (
                      <Plus className="h-5 w-5 mr-2" />
                    )}
                    添加到餐次
                  </button>
                </div>
                {addSuccess && (
                  <div className="mt-2 p-2 bg-green-50 text-green-600 rounded">
                    成功添加到今日记录
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
      
      {/* 相关推荐或营养建议 */}
      <div className="mt-8">
        <h2 className="text-xl font-bold mb-4">相关建议</h2>
        <div className="bg-emerald-50 p-6 rounded-lg">
          <div className="flex items-start">
            <Info className="h-6 w-6 text-emerald-600 mr-3 mt-1" />
            <div>
              <h3 className="font-medium text-lg mb-2">营养小贴士</h3>
              <p className="text-gray-600">
                {food.categoryId === 'fruits' && '水果富含维生素、矿物质和抗氧化物，是健康饮食的重要组成部分。建议每天摄入2-4份水果。'}
                {food.categoryId === 'vegetables' && '蔬菜是膳食纤维、维生素和矿物质的重要来源，有助于维持健康的消化系统。建议每天摄入3-5份蔬菜。'}
                {food.categoryId === 'grains' && '全谷物富含复杂碳水化合物、膳食纤维和B族维生素，是能量的重要来源。选择全麦面包、糙米等全谷物食品更有益健康。'}
                {food.categoryId === 'protein' && '蛋白质是构建和修复身体组织的基本营养素。选择瘦肉、鱼类、豆类和坚果等优质蛋白质来源。'}
                {food.categoryId === 'dairy' && '乳制品富含钙质和蛋白质，有助于骨骼健康。如果您对乳糖不耐受，可以选择无乳糖或植物基替代品。'}
                {!['fruits', 'vegetables', 'grains', 'protein', 'dairy'].includes(food.categoryId) && 
                  '均衡饮食是健康生活的基础。建议每天摄入多样化的食物，包括水果、蔬菜、全谷物、优质蛋白质和健康脂肪。'}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
