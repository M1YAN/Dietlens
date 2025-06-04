'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/lib/hooks/useAuth';
import { nutritionService, foodSearchService } from '@/lib/api';
import { PieChart, Plus, Trash2, Clock, Search, Edit, Calendar, TrendingUp, ChevronLeft, ChevronRight } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { getImageUrl, formatDate } from '@/lib/utils';
import type { DailyIntake, Meal, FoodEntry } from '@/lib/api/nutritionService';

export default function DailyNutrition() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, isAuthenticated } = useAuth();
  
  // 总是从今天开始，而不是从 URL 参数
  const [selectedDate, setSelectedDate] = useState<string>(() => {
    const today = new Date();
    return today.toISOString().split('T')[0];
  });
  
  const [dailyIntake, setDailyIntake] = useState<DailyIntake | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showAddMealForm, setShowAddMealForm] = useState(false);
  const [newMeal, setNewMeal] = useState({ name: '', time: '12:00' });
  const [showAddFoodModal, setShowAddFoodModal] = useState(false);
  const [selectedMealId, setSelectedMealId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [selectedFood, setSelectedFood] = useState<any | null>(null);
  const [foodAmount, setFoodAmount] = useState('1份');
  const [foodWeight, setFoodWeight] = useState(100);
  const [isAddingFood, setIsAddingFood] = useState(false);
  const [isDeletingFood, setIsDeletingFood] = useState(false);
  const [isDeletingMeal, setIsDeletingMeal] = useState(false);
  const [mealToDelete, setMealToDelete] = useState<string | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // 检查是否是今天
  const isToday = (date: string) => {
    const today = new Date().toISOString().split('T')[0];
    return date === today;
  };

  // 获取日期显示文本
  const getDateDisplayText = (date: string) => {
    const today = new Date().toISOString().split('T')[0];
    const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    const tomorrow = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    
    if (date === today) return '今天';
    if (date === yesterday) return '昨天';
    if (date === tomorrow) return '明天';
    
    return new Date(date).toLocaleDateString('zh-CN', {
      month: 'long',
      day: 'numeric',
      weekday: 'long'
    });
  };

  // 删除餐次
  const handleDeleteMeal = async (mealId: string) => {
    if (!user?.userId) return;
    
    setIsDeletingMeal(true);
    try {
      await nutritionService.deleteMeal(mealId, user.userId);
      fetchDailyIntake();
      setShowDeleteConfirm(false);
      setMealToDelete(null);
    } catch (err: any) {
      console.error('Failed to delete meal:', err);
      setError(err.response?.data?.message || '删除餐次失败');
    } finally {
      setIsDeletingMeal(false);
    }
  };

  // 确认删除餐次
  const confirmDeleteMeal = (mealId: string, mealName: string) => {
    setMealToDelete(mealId);
    setShowDeleteConfirm(true);
  };

  // 取消删除
  const cancelDeleteMeal = () => {
    setMealToDelete(null);
    setShowDeleteConfirm(false);
  };

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/auth/login');
      return;
    }

    // 检查 URL 参数中是否有要添加的食物
    const addFoodId = searchParams.get('addFood');
    if (addFoodId && user?.userId) {
      handleQuickAddFood(addFoodId);
    }

    fetchDailyIntake();
  }, [isAuthenticated, user, router, selectedDate]);

  // 快速添加食物（从其他页面跳转过来）
  const handleQuickAddFood = async (foodId: string) => {
    try {
      // 如果今天还没有餐次，先创建一个默认餐次
      if (!dailyIntake || dailyIntake.meals.length === 0) {
        const currentHour = new Date().getHours();
        let mealName = '早餐';
        let mealTime = '08:00';
        
        if (currentHour >= 11 && currentHour < 16) {
          mealName = '午餐';
          mealTime = '12:00';
        } else if (currentHour >= 16) {
          mealName = '晚餐';
          mealTime = '18:00';
        }
        
        await nutritionService.createMeal(user!.userId, selectedDate, {
          name: mealName,
          time: mealTime
        });
        
        // 重新获取数据
        await fetchDailyIntake();
      }
      
      // 获取食物详情并打开添加模态框
      const foodResponse = await foodSearchService.getFoodDetail(foodId);
      if (foodResponse.status === 200) {
        setSelectedFood(foodResponse.data);
        // 选择最近的餐次
        const latestMeal = dailyIntake?.meals[dailyIntake.meals.length - 1];
        if (latestMeal) {
          setSelectedMealId(latestMeal.id);
          setShowAddFoodModal(true);
        }
      }
    } catch (error) {
      console.error('Failed to quick add food:', error);
    }
  };

  const fetchDailyIntake = async () => {
    if (!user?.userId) return;
    
    setIsLoading(true);
    setError(null);
    try {
      const response = await nutritionService.getDailyIntake(user.userId, selectedDate);
      setDailyIntake(response.data);
    } catch (err: any) {
      console.error('Failed to fetch daily intake:', err);
      setError(err.response?.data?.message || '获取每日营养摄入数据失败');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSelectedDate(e.target.value);
    // 清除 URL 参数
    if (searchParams.get('addFood')) {
      router.replace('/nutrition/daily');
    }
  };

  // 快速日期导航
  const navigateDate = (direction: 'prev' | 'next') => {
    const currentDate = new Date(selectedDate);
    const newDate = new Date(currentDate);
    
    if (direction === 'prev') {
      newDate.setDate(currentDate.getDate() - 1);
    } else {
      newDate.setDate(currentDate.getDate() + 1);
    }
    
    setSelectedDate(newDate.toISOString().split('T')[0]);
  };

  // 快速跳转到今天
  const goToToday = () => {
    const today = new Date().toISOString().split('T')[0];
    setSelectedDate(today);
  };

  const handleAddMeal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?.userId) return;
    
    try {
      await nutritionService.createMeal(user.userId, selectedDate, newMeal);
      setNewMeal({ name: '', time: '12:00' });
      setShowAddMealForm(false);
      fetchDailyIntake();
    } catch (err: any) {
      console.error('Failed to add meal:', err);
      setError(err.response?.data?.message || '添加餐次失败');
    }
  };

  // 快速添加常用餐次
  const addQuickMeal = async (mealType: 'breakfast' | 'lunch' | 'dinner' | 'snack') => {
    if (!user?.userId) return;
    
    const mealData = {
      breakfast: { name: '早餐', time: '08:00' },
      lunch: { name: '午餐', time: '12:00' },
      dinner: { name: '晚餐', time: '18:00' },
      snack: { name: '加餐', time: '15:00' }
    };
    
    try {
      await nutritionService.createMeal(user.userId, selectedDate, mealData[mealType]);
      fetchDailyIntake();
    } catch (err: any) {
      console.error('Failed to add quick meal:', err);
      setError(err.response?.data?.message || '添加餐次失败');
    }
  };

  const handleSearchFood = async () => {
    if (!searchQuery.trim()) return;
    
    setIsSearching(true);
    try {
      const response = await foodSearchService.searchFoods({query: searchQuery});
      setSearchResults(response.data.foods || []);
      console.log('Search results:', response.data.foods);
    } catch (err: any) {
      console.error('Failed to search foods:', err);
      setError(err.response?.data?.message || '搜索食物失败');
    } finally {
      setIsSearching(false);
    }
  };

  const handleSelectFood = (food: any) => {
    setSelectedFood(food);
    if (food.servingSizes && food.servingSizes.length > 0) {
      setFoodAmount(food.servingSizes[0].description);
      setFoodWeight(food.servingSizes[0].weight);
    } else {
      setFoodAmount('1份');
      setFoodWeight(100);
    }
  };

  const handleAddFoodToMeal = async () => {
    if (!user?.userId || !selectedMealId || !selectedFood) return;
    setIsAddingFood(true);
    try {
      await nutritionService.addFoodToDailyIntake(user.userId, selectedDate, selectedMealId, {
        foodId: selectedFood.id,
        weight: foodWeight,
        amount: foodAmount
      });
      setShowAddFoodModal(false);
      setSelectedFood(null);
      setSearchQuery('');
      setSearchResults([]);
      fetchDailyIntake();
      
      // 清除 URL 参数
      if (searchParams.get('addFood')) {
        router.replace('/nutrition/daily');
      }
    } catch (err: any) {
      console.error('Failed to add food:', err);
      setError(err.response?.data?.message || '添加食物失败');
    } finally {
      setIsAddingFood(false);
    }
  };

  const handleDeleteFood = async (foodEntryId: string) => {
    if (!user?.userId) return;
    
    setIsDeletingFood(true);
    try {
      await nutritionService.deleteFoodEntry(foodEntryId, user.userId);
      fetchDailyIntake();
    } catch (err: any) {
      console.error('Failed to delete food:', err);
      setError(err.response?.data?.message || '删除食物失败');
    } finally {
      setIsDeletingFood(false);
    }
  };

  const openAddFoodModal = (mealId: string) => {
    setSelectedMealId(mealId);
    setShowAddFoodModal(true);
  };

  const closeAddFoodModal = () => {
    setShowAddFoodModal(false);
    setSelectedFood(null);
    setSearchQuery('');
    setSearchResults([]);
    
    // 清除 URL 参数
    if (searchParams.get('addFood')) {
      router.replace('/nutrition/daily');
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-emerald-500"></div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-6">
      {/* 页面标题和日期导航 */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold mb-4">每日营养记录</h1>
        
        {/* 日期导航栏 */}
        <div className="bg-white rounded-lg shadow-sm border p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => navigateDate('prev')}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <ChevronLeft className="h-5 w-5 text-gray-600" />
              </button>
              
              <div className="text-center">
                <div className="text-lg font-semibold text-gray-900">
                  {getDateDisplayText(selectedDate)}
                </div>
                <div className="text-sm text-gray-500">
                  {new Date(selectedDate).toLocaleDateString('zh-CN', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })}
                </div>
              </div>
              
              <button
                onClick={() => navigateDate('next')}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <ChevronRight className="h-5 w-5 text-gray-600" />
              </button>
            </div>
            
            <div className="flex items-center space-x-3">
              {!isToday(selectedDate) && (
                <button
                  onClick={goToToday}
                  className="px-3 py-1 text-sm text-emerald-600 border border-emerald-600 rounded-lg hover:bg-emerald-50 transition-colors"
                >
                  回到今天
                </button>
              )}
              
              <input
                type="date"
                value={selectedDate}
                onChange={handleDateChange}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="md:col-span-2">
          <div className="bg-white rounded-lg shadow-md p-6 mb-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-medium">
                {isToday(selectedDate) ? '今日摄入' : `${getDateDisplayText(selectedDate)}摄入`}
              </h2>
              
              {/* 今日提示 */}
              {isToday(selectedDate) && (
                <div className="flex items-center text-sm text-emerald-600 bg-emerald-50 px-3 py-1 rounded-full">
                  <div className="w-2 h-2 bg-emerald-500 rounded-full mr-2 animate-pulse"></div>
                  当前日期
                </div>
              )}
            </div>

            {error && (
              <div className="mb-4 p-3 bg-red-50 text-red-600 rounded-md">
                {error}
              </div>
            )}

            {dailyIntake && (
              <div className="mb-6">
                {/* 营养概览 */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                  <div className="bg-emerald-50 p-3 rounded-lg">
                    <div className="text-sm text-gray-500 mb-1">热量</div>
                    <div className="font-bold text-lg">
                      {parseFloat(dailyIntake.totals.calories).toFixed(0)} / {dailyIntake.goals.calories} 千卡
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                      <div
                        className="bg-emerald-500 h-2 rounded-full transition-all duration-500"
                        style={{ width: `${Math.min(100, (dailyIntake.totals.calories / dailyIntake.goals.calories) * 100)}%` }}
                      ></div>
                    </div>
                  </div>
                  <div className="bg-blue-50 p-3 rounded-lg">
                    <div className="text-sm text-gray-500 mb-1">蛋白质</div>
                    <div className="font-bold text-lg">
                      {parseFloat(dailyIntake.totals.protein).toFixed(1)} / {dailyIntake.goals.protein} 克
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                      <div
                        className="bg-blue-500 h-2 rounded-full transition-all duration-500"
                        style={{ width: `${Math.min(100, (dailyIntake.totals.protein / dailyIntake.goals.protein) * 100)}%` }}
                      ></div>
                    </div>
                  </div>
                  <div className="bg-yellow-50 p-3 rounded-lg">
                    <div className="text-sm text-gray-500 mb-1">碳水化合物</div>
                    <div className="font-bold text-lg">
                      {parseFloat(dailyIntake.totals.carbs).toFixed(1)} / {dailyIntake.goals.carbs} 克
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                      <div
                        className="bg-yellow-500 h-2 rounded-full transition-all duration-500"
                        style={{ width: `${Math.min(100, (dailyIntake.totals.carbs / dailyIntake.goals.carbs) * 100)}%` }}
                      ></div>
                    </div>
                  </div>
                  <div className="bg-red-50 p-3 rounded-lg">
                    <div className="text-sm text-gray-500 mb-1">脂肪</div>
                    <div className="font-bold text-lg">
                      {parseFloat(dailyIntake.totals.fat).toFixed(2)} / {dailyIntake.goals.fat} 克
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                      <div
                        className="bg-red-500 h-2 rounded-full transition-all duration-500"
                        style={{ width: `${Math.min(100, (dailyIntake.totals.fat / dailyIntake.goals.fat) * 100)}%` }}
                      ></div>
                    </div>
                  </div>
                </div>

                {/* 餐次管理 */}
                <div className="flex justify-between items-center mb-4">
                  <h3 className="font-medium">餐次记录</h3>
                  <div className="flex items-center space-x-2">
                    {/* 快速添加餐次按钮 */}
                    <div className="flex space-x-1">
                      <button
                        onClick={() => addQuickMeal('breakfast')}
                        className="px-2 py-1 text-xs bg-orange-100 text-orange-700 rounded hover:bg-orange-200 transition-colors"
                      >
                        早餐
                      </button>
                      <button
                        onClick={() => addQuickMeal('lunch')}
                        className="px-2 py-1 text-xs bg-green-100 text-green-700 rounded hover:bg-green-200 transition-colors"
                      >
                        午餐
                      </button>
                      <button
                        onClick={() => addQuickMeal('dinner')}
                        className="px-2 py-1 text-xs bg-blue-100 text-blue-700 rounded hover:bg-blue-200 transition-colors"
                      >
                        晚餐
                      </button>
                      <button
                        onClick={() => addQuickMeal('snack')}
                        className="px-2 py-1 text-xs bg-purple-100 text-purple-700 rounded hover:bg-purple-200 transition-colors"
                      >
                        加餐
                      </button>
                    </div>
                    <button
                      onClick={() => setShowAddMealForm(!showAddMealForm)}
                      className="flex items-center text-sm text-emerald-600 hover:text-emerald-700 px-2 py-1 border border-emerald-600 rounded hover:bg-emerald-50 transition-colors"
                    >
                      <Plus className="h-4 w-4 mr-1" />
                      自定义餐次
                    </button>
                  </div>
                </div>

                {showAddMealForm && (
                  <form onSubmit={handleAddMeal} className="mb-6 p-4 bg-gray-50 rounded-lg">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                      <div>
                        <label htmlFor="mealName" className="block text-gray-700 mb-1 text-sm">
                          餐次名称
                        </label>
                        <input
                          type="text"
                          id="mealName"
                          value={newMeal.name}
                          onChange={(e) => setNewMeal({ ...newMeal, name: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-emerald-500"
                          placeholder="早餐、午餐、晚餐..."
                          required
                        />
                      </div>
                      <div>
                        <label htmlFor="mealTime" className="block text-gray-700 mb-1 text-sm">
                          用餐时间
                        </label>
                        <input
                          type="time"
                          id="mealTime"
                          value={newMeal.time}
                          onChange={(e) => setNewMeal({ ...newMeal, time: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-emerald-500"
                          required
                        />
                      </div>
                    </div>
                    <div className="flex justify-end">
                      <button
                        type="button"
                        onClick={() => setShowAddMealForm(false)}
                        className="px-3 py-1.5 mr-2 border border-gray-300 text-gray-700 rounded hover:bg-gray-100"
                      >
                        取消
                      </button>
                      <button
                        type="submit"
                        className="px-3 py-1.5 bg-emerald-600 text-white rounded hover:bg-emerald-700"
                      >
                        添加
                      </button>
                    </div>
                  </form>
                )}

                {/* 餐次列表 */}
                {dailyIntake.meals.length === 0 ? (
                  <div className="text-center py-8 bg-gray-50 rounded-lg">
                    <div className="text-gray-400 mb-4">
                      {isToday(selectedDate) ? '今日' : getDateDisplayText(selectedDate)}暂无餐次记录
                    </div>
                    <div className="space-x-2">
                      <button
                        onClick={() => addQuickMeal('breakfast')}
                        className="px-3 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors"
                      >
                        添加早餐
                      </button>
                      <button
                        onClick={() => addQuickMeal('lunch')}
                        className="px-3 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
                      >
                        添加午餐
                      </button>
                      <button
                        onClick={() => addQuickMeal('dinner')}
                        className="px-3 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                      >
                        添加晚餐
                      </button>
                    </div>
                  </div>
                ) : (
                  dailyIntake.meals.map((meal) => (
                    <div key={meal.id} className="mb-6 border border-gray-200 rounded-lg overflow-hidden">
                      <div className="flex justify-between items-center bg-gray-50 p-4 border-b">
                        <div className="flex items-center">
                          <Clock className="h-5 w-5 text-gray-500 mr-2" />
                          <div>
                            <h4 className="font-medium">{meal.name}</h4>
                            <div className="text-sm text-gray-500">{meal.time}</div>
                          </div>
                        </div>
                        <div className="flex items-center space-x-3">
                          <div className="text-sm">
                            <span className="font-medium">{meal.totals.calories}</span> 千卡
                          </div>
                          {/* 餐次操作按钮 */}
                          <div className="flex items-center space-x-1">
                            <button
                              onClick={() => openAddFoodModal(meal.id)}
                              className="p-1.5 text-emerald-600 hover:bg-emerald-50 rounded transition-colors"
                              title="添加食物"
                            >
                              <Plus className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => confirmDeleteMeal(meal.id, meal.name)}
                              disabled={isDeletingMeal}
                              className="p-1.5 text-red-600 hover:bg-red-50 rounded transition-colors disabled:opacity-50"
                              title="删除餐次"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </div>
                      </div>
                      
                      <div className="p-4">
                        {meal.foods.length === 0 ? (
                          <div className="text-center py-4">
                            <div className="text-gray-400 mb-2">暂无食物记录</div>
                            <button
                              onClick={() => openAddFoodModal(meal.id)}
                              className="px-3 py-1.5 bg-emerald-600 text-white rounded hover:bg-emerald-700"
                            >
                              添加食物
                            </button>
                          </div>
                        ) : (
                          <>
                            <div className="overflow-x-auto">
                              <table className="w-full text-sm">
                                <thead>
                                  <tr className="border-b">
                                    <th className="text-left py-2 font-medium">食物</th>
                                    <th className="text-right py-2 font-medium">数量</th>
                                    <th className="text-right py-2 font-medium">热量</th>
                                    <th className="text-right py-2 font-medium">蛋白质</th>
                                    <th className="text-right py-2 font-medium">碳水</th>
                                    <th className="text-right py-2 font-medium">脂肪</th>
                                    <th className="text-right py-2 font-medium">操作</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {meal.foods.map((food) => (
                                    <tr key={food.id} className="border-b last:border-b-0">
                                      <td className="py-2">{food.name}</td>
                                      <td className="text-right py-2">{food.amount}</td>
                                      <td className="text-right py-2">{parseFloat(food.calories).toFixed(1)} 千卡</td>
                                      <td className="text-right py-2">{parseFloat(food.protein).toFixed(1)} 克</td>
                                      <td className="text-right py-2">{parseFloat(food.carbs).toFixed(1)} 克</td>
                                      <td className="text-right py-2">{parseFloat(food.fat).toFixed(1)} 克</td>
                                      <td className="text-right py-2">
                                        <button
                                          onClick={() => handleDeleteFood(food.id)}
                                          disabled={isDeletingFood}
                                          className="text-red-500 hover:text-red-700 disabled:opacity-50"
                                          title="删除食物"
                                        >
                                          <Trash2 className="h-4 w-4" />
                                        </button>
                                      </td>
                                    </tr>
                                  ))}
                                </tbody>
                                <tfoot>
                                  <tr className="bg-gray-50">
                                    <td className="py-2 font-medium">总计</td>
                                    <td className="text-right py-2"></td>
                                    <td className="text-right py-2 font-medium">{parseFloat(meal.totals.calories).toFixed(1)} 千卡</td>
                                    <td className="text-right py-2 font-medium">{parseFloat(meal.totals.protein).toFixed(1)} 克</td>
                                    <td className="text-right py-2 font-medium">{parseFloat(meal.totals.carbs).toFixed(1)} 克</td>
                                    <td className="text-right py-2 font-medium">{parseFloat(meal.totals.fat).toFixed(1)} 克</td>
                                    <td className="text-right py-2"></td>
                                  </tr>
                                </tfoot>
                              </table>
                            </div>
                            <div className="mt-3 text-right">
                              <button
                                onClick={() => openAddFoodModal(meal.id)}
                                className="px-3 py-1.5 text-sm bg-emerald-600 text-white rounded hover:bg-emerald-700"
                              >
                                添加更多食物
                              </button>
                            </div>
                          </>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        </div>

        {/* 右侧边栏 */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-medium mb-4">营养摄入分析</h2>
          
          {dailyIntake && (
            <div className="mb-6">
              <h3 className="font-medium mb-2">宏量营养素比例</h3>
              <div className="relative pt-1">
                <div className="flex mb-2 items-center justify-between">
                  <div>
                    <span className="text-xs font-semibold inline-block py-1 px-2 uppercase rounded-full bg-blue-200 text-blue-800">
                      蛋白质
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="text-xs font-semibold inline-block">
                      {Math.round((dailyIntake.totals.protein * 4 / dailyIntake.totals.calories) * 100 || 0)}%
                    </span>
                  </div>
                </div>
                <div className="flex mb-2 items-center justify-between">
                  <div>
                    <span className="text-xs font-semibold inline-block py-1 px-2 uppercase rounded-full bg-yellow-200 text-yellow-800">
                      碳水化合物
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="text-xs font-semibold inline-block">
                      {Math.round((dailyIntake.totals.carbs * 4 / dailyIntake.totals.calories) * 100 || 0)}%
                    </span>
                  </div>
                </div>
                <div className="flex mb-2 items-center justify-between">
                  <div>
                    <span className="text-xs font-semibold inline-block py-1 px-2 uppercase rounded-full bg-red-200 text-red-800">
                      脂肪
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="text-xs font-semibold inline-block">
                      {Math.round((dailyIntake.totals.fat * 9 / dailyIntake.totals.calories) * 100 || 0)}%
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          <div className="space-y-4">
            <Link
              href="/nutrition/goals"
              className="flex items-center p-3 bg-emerald-50 rounded-lg hover:bg-emerald-100"
            >
              <PieChart className="h-5 w-5 text-emerald-600 mr-3" />
              <span>营养目标设置</span>
            </Link>
            <Link
              href="/nutrition/history"
              className="flex items-center p-3 bg-blue-50 rounded-lg hover:bg-blue-100"
            >
              <TrendingUp className="h-5 w-5 text-blue-600 mr-3" />
              <span>历史数据分析</span>
            </Link>
            <Link
              href="/food-search/categories"
              className="flex items-center p-3 bg-purple-50 rounded-lg hover:bg-purple-100"
            >
              <Search className="h-5 w-5 text-purple-600 mr-3" />
              <span>浏览食物数据库</span>
            </Link>
          </div>
        </div>
      </div>

      {/* 删除餐次确认模态框 */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg w-full max-w-md mx-4">
            <div className="p-6">
              <div className="flex items-center mb-4">
                <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mr-4">
                  <Trash2 className="h-6 w-6 text-red-600" />
                </div>
                <div>
                  <h3 className="text-lg font-medium text-gray-900">删除餐次</h3>
                  <p className="text-sm text-gray-500">此操作无法撤销</p>
                </div>
              </div>
              
              <div className="mb-6">
                <p className="text-gray-700">
                  确定要删除这个餐次吗？删除后，该餐次下的所有食物记录也将被删除。
                </p>
                <div className="mt-2 p-3 bg-gray-50 rounded border">
                  <div className="text-sm">
                    <div className="font-medium">
                      {dailyIntake?.meals.find(m => m.id === mealToDelete)?.name}
                    </div>
                    <div className="text-gray-500">
                      {dailyIntake?.meals.find(m => m.id === mealToDelete)?.time}
                    </div>
                    <div className="text-gray-500">
                      包含 {dailyIntake?.meals.find(m => m.id === mealToDelete)?.foods.length || 0} 种食物
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="flex justify-end space-x-3">
                <button
                  onClick={cancelDeleteMeal}
                  disabled={isDeletingMeal}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 disabled:opacity-50"
                >
                  取消
                </button>
                <button
                  onClick={() => mealToDelete && handleDeleteMeal(mealToDelete)}
                  disabled={isDeletingMeal}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 flex items-center"
                >
                  {isDeletingMeal ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      删除中...
                    </>
                  ) : (
                    '确认删除'
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 添加食物模态框 */}
      {showAddFoodModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="p-4 border-b">
              <h3 className="text-lg font-medium">添加食物</h3>
            </div>
            
            <div className="p-4">
              <div className="flex mb-4">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="搜索食物..."
                  className="flex-grow px-3 py-2 border border-gray-300 rounded-l focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  onKeyPress={(e) => e.key === 'Enter' && handleSearchFood()}
                />
                <button
                  onClick={handleSearchFood}
                  disabled={isSearching}
                  className="px-4 py-2 bg-emerald-600 text-white rounded-r hover:bg-emerald-700 disabled:opacity-50"
                >
                  {isSearching ? '搜索中...' : '搜索'}
                </button>
              </div>
              
              {searchResults.length > 0 && !selectedFood && (
                <div className="mb-4 max-h-60 overflow-y-auto border rounded">
                  {searchResults.map((food) => (
                    <div
                      key={food.foodId || food.id}
                      onClick={() => handleSelectFood(food)}
                      className="p-3 border-b last:border-b-0 hover:bg-gray-50 cursor-pointer"
                    >
                      <div className="flex items-center">
                        {food.imageUrl && (
                          <div className="w-12 h-12 mr-3 rounded overflow-hidden">
                            <Image
                              src={getImageUrl(food.imageUrl)}
                              alt={food.name}
                              width={48}
                              height={48}
                              className="object-cover"
                            />
                          </div>
                        )}
                        <div>
                          <div className="font-medium">{food.name}</div>
                          <div className="text-sm text-gray-500">
                            {food.calories} 千卡 / 100克
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
              
              {selectedFood && (
                <div className="mb-4 p-4 border rounded">
                  <div className="flex items-center mb-4">
                    {selectedFood.imageUrl && (
                      <div className="w-16 h-16 mr-4 rounded overflow-hidden">
                        <Image
                          src={getImageUrl(selectedFood.imageUrl)}
                          alt={selectedFood.name}
                          width={64}
                          height={64}
                          className="object-cover"
                        />
                      </div>
                    )}
                    <div>
                      <h4 className="font-medium text-lg">{selectedFood.name}</h4>
                      <div className="text-sm text-gray-500">
                        {selectedFood.calories} 千卡 / 100克
                      </div>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    <div>
                      <label className="block text-gray-700 mb-1 text-sm">
                        份量描述
                      </label>
                      <input
                        type="text"
                        value={foodAmount}
                        onChange={(e) => setFoodAmount(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-emerald-500"
                        placeholder="例如：1份、1碗、2片..."
                      />
                    </div>
                    <div>
                      <label className="block text-gray-700 mb-1 text-sm">
                        重量 (克)
                      </label>
                      <input
                        type="number"
                        value={foodWeight}
                        onChange={(e) => setFoodWeight(parseInt(e.target.value) || 0)}
                        className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-emerald-500"
                        min="1"
                      />
                    </div>
                  </div>
                  
                  {selectedFood.servingSizes && selectedFood.servingSizes.length > 0 && (
                    <div className="mb-4">
                      <label className="block text-gray-700 mb-1 text-sm">
                        选择常用份量
                      </label>
                      <div className="flex flex-wrap gap-2">
                        {selectedFood.servingSizes.map((serving: any, index: number) => (
                          <button
                            key={index}
                            type="button"
                            onClick={() => {
                              setFoodAmount(serving.description);
                              setFoodWeight(serving.weight);
                            }}
                            className="px-2 py-1 text-sm border rounded hover:bg-gray-50"
                          >
                            {serving.description} ({serving.weight}克)
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  <div className="bg-gray-50 p-3 rounded">
                    <div className="text-sm font-medium mb-2">营养成分 (按当前份量)</div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm">
                      <div>
                        <span className="text-gray-500">热量:</span>{' '}
                        {Math.round((selectedFood.calories * foodWeight) / 100)} 千卡
                      </div>
                      <div>
                        <span className="text-gray-500">蛋白质:</span>{' '}
                        {Math.round((selectedFood.protein * foodWeight) / 100)} 克
                      </div>
                      <div>
                        <span className="text-gray-500">碳水:</span>{' '}
                        {Math.round((selectedFood.carbs * foodWeight) / 100)} 克
                      </div>
                      <div>
                        <span className="text-gray-500">脂肪:</span>{' '}
                        {Math.round((selectedFood.fat * foodWeight) / 100)} 克
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
            
            <div className="p-4 border-t flex justify-end">
              <button
                type="button"
                onClick={closeAddFoodModal}
                className="px-4 py-2 mr-2 border border-gray-300 text-gray-700 rounded hover:bg-gray-100"
              >
                取消
              </button>
              <button
                type="button"
                onClick={handleAddFoodToMeal}
                disabled={!selectedFood || isAddingFood}
                className="px-4 py-2 bg-emerald-600 text-white rounded hover:bg-emerald-700 disabled:opacity-50"
              >
                {isAddingFood ? '添加中...' : '添加到餐次'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}