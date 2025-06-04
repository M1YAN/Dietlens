'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/hooks/useAuth';
import { Calendar, TrendingUp, Target, ChevronLeft, ChevronRight, Activity, BarChart3 } from 'lucide-react';
import { nutritionService } from '@/lib/api';
import { formatDate } from '@/lib/utils';

interface DailyData {
  date: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  goalAchieved: boolean;
}

interface HistoryData {
  userId: string;
  startDate: string;
  endDate: string;
  daily: DailyData[];
  averages: {
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
  };
  goals: {
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
    fiber: number;
    sugar: number;
    sodium: number;
  };
  goalAchievementRate: {
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
  };
}

export default function NutritionHistoryPage() {
  const router = useRouter();
  const { user, isAuthenticated, isLoading } = useAuth();
  
  const [historyData, setHistoryData] = useState<HistoryData | null>(null);
  const [isDataLoading, setIsDataLoading] = useState(true);
  const [dateRange, setDateRange] = useState({
    startDate: '',
    endDate: ''
  });
  const [selectedNutrient, setSelectedNutrient] = useState<'calories' | 'protein' | 'carbs' | 'fat'>('calories');
  const [error, setError] = useState<string | null>(null);

  // 初始化日期范围（最近7天）
  useEffect(() => {
    const today = new Date();
    const lastWeek = new Date(today);
    lastWeek.setDate(today.getDate() - 6);
    
    setDateRange({
      startDate: lastWeek.toISOString().split('T')[0],
      endDate: today.toISOString().split('T')[0]
    });
  }, []);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/auth/login');
      return;
    }

    if (isAuthenticated && user && dateRange.startDate && dateRange.endDate) {
      fetchHistoryData();
    }
  }, [isAuthenticated, isLoading, user, router, dateRange]);

  const fetchHistoryData = async () => {
    if (!user) return;
    
    setIsDataLoading(true);
    setError(null);
    
    try {
      const response = await nutritionService.getNutritionHistory(
        user.userId,
        dateRange.startDate,
        dateRange.endDate
      );
      
      if (response.status === 200) {
        setHistoryData(response.data);
      }

    console.log('Fetched history data:', response.data);
    } catch (error: any) {
      console.error('Failed to fetch history data:', error);
      setError('获取历史数据失败，请稍后重试');
    } finally {
      setIsDataLoading(false);
    }
  };

  const adjustDateRange = (days: number) => {
    const start = new Date(dateRange.startDate);
    const end = new Date(dateRange.endDate);
    
    start.setDate(start.getDate() + days);
    end.setDate(end.getDate() + days);
    
    // 不能超过今天
    const today = new Date();
    if (end > today) {
      end.setTime(today.getTime());
      start.setDate(end.getDate() - 6);
    }
    
    setDateRange({
      startDate: start.toISOString().split('T')[0],
      endDate: end.toISOString().split('T')[0]
    });
  };

  const getNutrientColor = (nutrient: string) => {
    switch (nutrient) {
      case 'calories': return 'bg-emerald-500';
      case 'protein': return 'bg-blue-500';
      case 'carbs': return 'bg-yellow-500';
      case 'fat': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  const getNutrientLabel = (nutrient: string) => {
    switch (nutrient) {
      case 'calories': return '热量 (kcal)';
      case 'protein': return '蛋白质 (g)';
      case 'carbs': return '碳水化合物 (g)';
      case 'fat': return '脂肪 (g)';
      default: return '';
    }
  };

  const getMaxValue = (data: DailyData[], nutrient: string) => {
    if (!data || data.length === 0) return 100;
    
    const values = data.map(day => day[nutrient as keyof DailyData] as number);
    const goal = historyData?.goals[nutrient as keyof typeof historyData.goals] || 100;

    console.log('Calculating max value for nutrient:', nutrient, 'Values:', values, 'Goal:', goal);
    
    return Math.max(Math.max(...values), goal) * 1.1;
  };

  if (isLoading || isDataLoading) {
    return (
      <div className="flex justify-center items-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-emerald-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="text-center">
          <div className="text-red-600 mb-4">{error}</div>
          <button
            onClick={() => fetchHistoryData()}
            className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700"
          >
            重新加载
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      {/* 页面标题 */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center">
          <Calendar className="h-6 w-6 text-emerald-600 mr-2" />
          <h1 className="text-2xl font-bold">营养历史</h1>
        </div>
        
        {/* 日期范围选择器 */}
        <div className="flex items-center space-x-2">
          <button
            onClick={() => adjustDateRange(-7)}
            className="p-2 text-gray-500 hover:text-gray-700"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          
          <div className="text-sm text-gray-600 px-4 py-2 bg-gray-100 rounded-lg">
            {formatDate(dateRange.startDate)} - {formatDate(dateRange.endDate)}
          </div>
          
          <button
            onClick={() => adjustDateRange(7)}
            className="p-2 text-gray-500 hover:text-gray-700"
            disabled={new Date(dateRange.endDate) >= new Date()}
          >
            <ChevronRight className="h-5 w-5" />
          </button>
        </div>
      </div>

      {historyData && (
        <>
          {/* 统计概览 */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            {/* 平均热量 */}
            <div className="bg-white rounded-lg p-6 shadow-sm border">
              <div className="flex items-center justify-between mb-2">
                <div className="text-sm text-gray-500">平均热量</div>
                <div className="text-emerald-600">
                  <TrendingUp className="h-4 w-4" />
                </div>
              </div>
              <div className="text-2xl font-bold text-gray-900">
                {historyData.averages.calories}
              </div>
              <div className="text-xs text-gray-500">kcal/天</div>
              <div className="mt-2">
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-emerald-500 h-2 rounded-full"
                    style={{ 
                      width: `${Math.min(100, (historyData.averages.calories / historyData.goals.calories) * 100)}%` 
                    }}
                  ></div>
                </div>
                <div className="text-xs text-gray-500 mt-1">
                  目标: {historyData.goals.calories} kcal
                </div>
              </div>
            </div>

            {/* 平均蛋白质 */}
            <div className="bg-white rounded-lg p-6 shadow-sm border">
              <div className="flex items-center justify-between mb-2">
                <div className="text-sm text-gray-500">平均蛋白质</div>
                <div className="text-blue-600">
                  <Activity className="h-4 w-4" />
                </div>
              </div>
              <div className="text-2xl font-bold text-gray-900">
                {historyData.averages.protein}
              </div>
              <div className="text-xs text-gray-500">g/天</div>
              <div className="mt-2">
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-blue-500 h-2 rounded-full"
                    style={{ 
                      width: `${Math.min(100, (historyData.averages.protein / historyData.goals.protein) * 100)}%` 
                    }}
                  ></div>
                </div>
                <div className="text-xs text-gray-500 mt-1">
                  目标: {historyData.goals.protein} g
                </div>
              </div>
            </div>

            {/* 目标达成率 */}
            <div className="bg-white rounded-lg p-6 shadow-sm border">
              <div className="flex items-center justify-between mb-2">
                <div className="text-sm text-gray-500">目标达成率</div>
                <div className="text-green-600">
                  <Target className="h-4 w-4" />
                </div>
              </div>
              <div className="text-2xl font-bold text-gray-900">
                {historyData.goalAchievementRate.calories.toFixed(0)}%
              </div>
              <div className="text-xs text-gray-500">热量目标</div>
              <div className="mt-2 space-y-1">
                <div className="flex justify-between text-xs">
                  <span>蛋白质</span>
                  <span>{historyData.goalAchievementRate.protein.toFixed(0)}%</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span>碳水</span>
                  <span>{historyData.goalAchievementRate.carbs.toFixed(0)}%</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span>脂肪</span>
                  <span>{historyData.goalAchievementRate.fat.toFixed(0)}%</span>
                </div>
              </div>
            </div>

            {/* 记录天数 */}
            <div className="bg-white rounded-lg p-6 shadow-sm border">
              <div className="flex items-center justify-between mb-2">
                <div className="text-sm text-gray-500">记录天数</div>
                <div className="text-purple-600">
                  <BarChart3 className="h-4 w-4" />
                </div>
              </div>
              <div className="text-2xl font-bold text-gray-900">
                {historyData.daily.filter(day => day.calories > 0).length}
              </div>
              <div className="text-xs text-gray-500">
                / {historyData.daily.length} 天
              </div>
              <div className="mt-2">
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-purple-500 h-2 rounded-full"
                    style={{ 
                      width: `${(historyData.daily.filter(day => day.calories > 0).length / historyData.daily.length) * 100}%` 
                    }}
                  ></div>
                </div>
                <div className="text-xs text-gray-500 mt-1">
                  记录完整度
                </div>
              </div>
            </div>
          </div>

          {/* 营养素选择器 */}
          <div className="bg-white rounded-lg p-6 shadow-sm border mb-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold">营养趋势</h3>
              <div className="flex space-x-2">
                {(['calories', 'protein', 'carbs', 'fat'] as const).map(nutrient => (
                  <button
                    key={nutrient}
                    onClick={() => setSelectedNutrient(nutrient)}
                    className={`px-3 py-1 text-sm rounded-lg transition-colors ${
                      selectedNutrient === nutrient
                        ? 'bg-emerald-600 text-white'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    {getNutrientLabel(nutrient)}
                  </button>
                ))}
              </div>
            </div>

            {/* 当前营养素信息 */}
            <div className="mb-4 p-3 bg-gray-50 rounded-lg flex justify-between items-center">
              <div>
                <span className="text-sm text-gray-600">当前查看: </span>
                <span className="font-medium">{getNutrientLabel(selectedNutrient)}</span>
              </div>
              <div>
                <span className="text-sm text-gray-600">目标: </span>
                <span className="font-medium text-emerald-600">
                  {historyData.goals[selectedNutrient]} {selectedNutrient === 'calories' ? 'kcal' : 'g'}
                </span>
              </div>
            </div>

            {/* 简化的卡片式图表 */}
            <div className="space-y-4">
              {historyData.daily.map((day, index) => {
                const value = day[selectedNutrient] as number;
                const goal = historyData.goals[selectedNutrient];
                const percentage = Math.min(100, (value / goal) * 100);
                const isAchieved = value >= goal;
                
                return (
                  <div key={index} className="bg-gray-50 rounded-lg p-4 hover:bg-gray-100 transition-colors">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center space-x-3">
                        <div className="text-sm font-medium text-gray-900">
                          {formatDate(day.date)}
                        </div>
                        <div className="text-xs text-gray-500">
                          {new Date(day.date).toLocaleDateString('zh-CN', { weekday: 'short' })}
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <span className="text-lg font-bold text-gray-900">
                          {value.toFixed(selectedNutrient === 'calories' ? 0 : 1)}
                        </span>
                        <span className="text-sm text-gray-500">
                          {selectedNutrient === 'calories' ? 'kcal' : 'g'}
                        </span>
                        {isAchieved && (
                          <span className="text-green-500 text-sm">✓</span>
                        )}
                      </div>
                    </div>
                    
                    {/* 进度条 */}
                    <div className="relative">
                      <div className="w-full bg-gray-200 rounded-full h-3">
                        <div 
                          className={`h-3 rounded-full transition-all duration-500 ${
                            isAchieved ? 'bg-green-500' : getNutrientColor(selectedNutrient)
                          }`}
                          style={{ width: `${percentage}%` }}
                        ></div>
                      </div>
                      <div className="flex justify-between text-xs text-gray-500 mt-1">
                        <span>0</span>
                        <span className="font-medium">{percentage.toFixed(0)}%</span>
                        <span>{goal} {selectedNutrient === 'calories' ? 'kcal' : 'g'}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* 统计汇总 */}
            <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-4 p-4 bg-gray-50 rounded-lg">
              <div className="text-center">
                <div className="text-xl font-bold text-gray-900">
                  {historyData.averages[selectedNutrient]?.toFixed(selectedNutrient === 'calories' ? 0 : 1)}
                </div>
                <div className="text-xs text-gray-500">平均值</div>
              </div>
              <div className="text-center">
                <div className="text-xl font-bold text-emerald-600">
                  {historyData.goals[selectedNutrient]}
                </div>
                <div className="text-xs text-gray-500">目标值</div>
              </div>
              <div className="text-center">
                <div className="text-xl font-bold text-blue-600">
                  {Math.max(...historyData.daily.map(d => d[selectedNutrient])).toFixed(selectedNutrient === 'calories' ? 0 : 1)}
                </div>
                <div className="text-xs text-gray-500">最高值</div>
              </div>
              <div className="text-center">
                <div className="text-xl font-bold text-purple-600">
                  {historyData.goalAchievementRate[selectedNutrient]?.toFixed(0)}%
                </div>
                <div className="text-xs text-gray-500">完成率</div>
              </div>
            </div>

            {/* 趋势分析 */}
            <div className="mt-6 p-4 bg-blue-50 rounded-lg">
              <h4 className="font-medium text-blue-900 mb-2">趋势分析</h4>
              <div className="space-y-2 text-sm text-blue-800">
                {(() => {
                  const values = historyData.daily.map(d => d[selectedNutrient] as number);
                  const average = values.reduce((sum, val) => sum + val, 0) / values.length;
                  const goal = historyData.goals[selectedNutrient];
                  const achievedDays = values.filter(val => val >= goal).length;
                  
                  return (
                    <>
                      <div>
                        • 过去 {historyData.daily.length} 天平均摄入 {average.toFixed(selectedNutrient === 'calories' ? 0 : 1)} {selectedNutrient === 'calories' ? 'kcal' : 'g'}
                      </div>
                      <div>
                        • 达成目标天数: {achievedDays} 天 ({((achievedDays / historyData.daily.length) * 100).toFixed(0)}%)
                      </div>
                      <div>
                        • {average >= goal 
                          ? '平均摄入已达到目标，保持良好习惯！' 
                          : `距离目标还需增加 ${(goal - average).toFixed(selectedNutrient === 'calories' ? 0 : 1)} ${selectedNutrient === 'calories' ? 'kcal' : 'g'}`
                        }
                      </div>
                    </>
                  );
                })()}
              </div>
            </div>
          </div>

          {/* 周对比图表 - 简化版本 */}
          <div className="bg-white rounded-lg p-6 shadow-sm border mb-6">
            <h3 className="text-lg font-semibold mb-4">每日对比</h3>
            
            <div className="grid grid-cols-7 gap-2">
              {historyData.daily.map((day, index) => {
                const value = day[selectedNutrient] as number;
                const goal = historyData.goals[selectedNutrient];
                const percentage = (value / goal) * 100;
                const maxHeight = 120; // 最大高度 120px
                const height = Math.max(20, (percentage / 100) * maxHeight);
                
                return (
                  <div key={index} className="flex flex-col items-center space-y-2">
                    {/* 数值显示 */}
                    <div className="text-xs text-gray-600 font-medium">
                      {value.toFixed(selectedNutrient === 'calories' ? 0 : 1)}
                    </div>
                    
                    {/* 柱状图 */}
                    <div 
                      className="relative flex flex-col justify-end bg-gray-100 rounded-t-lg w-12"
                      style={{ height: `${maxHeight}px` }}
                    >
                      {/* 目标线 */}
                      <div 
                        className="absolute w-full border-t-2 border-dashed border-emerald-400"
                        style={{ bottom: `${Math.min(100, (goal / (goal * 1.2)) * 100)}%` }}
                      ></div>
                      
                      {/* 数据柱 */}
                      <div
                        className={`w-full rounded-t-lg transition-all duration-500 ${
                          value >= goal ? 'bg-green-500' : getNutrientColor(selectedNutrient)
                        }`}
                        style={{ height: `${Math.min(100, (value / (goal * 1.2)) * 100)}%` }}
                      ></div>
                    </div>
                    
                    {/* 日期 */}
                    <div className="text-xs text-gray-500 text-center">
                      {new Date(day.date).getDate()}
                    </div>
                    
                    {/* 星期 */}
                    <div className="text-xs text-gray-400">
                      {new Date(day.date).toLocaleDateString('zh-CN', { weekday: 'narrow' })}
                    </div>
                  </div>
                );
              })}
            </div>
            
            {/* 图例 */}
            <div className="flex items-center justify-center mt-4 space-x-4 text-xs">
              <div className="flex items-center">
                <div className={`w-3 h-3 ${getNutrientColor(selectedNutrient)} rounded mr-1`}></div>
                <span>实际摄入</span>
              </div>
              <div className="flex items-center">
                <div className="w-3 h-0 border-t-2 border-dashed border-emerald-400 mr-1"></div>
                <span>目标线</span>
              </div>
              <div className="flex items-center">
                <div className="w-3 h-3 bg-green-500 rounded mr-1"></div>
                <span>已达标</span>
              </div>
            </div>
          </div>

          {/* 详细数据表格 */}
          <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
            <div className="px-6 py-4 border-b">
              <h3 className="text-lg font-semibold">详细数据</h3>
            </div>
            
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      日期
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      热量 (kcal)
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      蛋白质 (g)
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      碳水 (g)
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      脂肪 (g)
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      目标达成
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {historyData.daily.map((day, index) => (
                    <tr key={index} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {formatDate(day.date)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {day.calories}
                        <div className="text-xs text-gray-500">
                          {((day.calories / historyData.goals.calories) * 100).toFixed(0)}%
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {day.protein}
                        <div className="text-xs text-gray-500">
                          {((day.protein / historyData.goals.protein) * 100).toFixed(0)}%
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {day.carbs}
                        <div className="text-xs text-gray-500">
                          {((day.carbs / historyData.goals.carbs) * 100).toFixed(0)}%
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {day.fat}
                        <div className="text-xs text-gray-500">
                          {((day.fat / historyData.goals.fat) * 100).toFixed(0)}%
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {day.goalAchieved ? (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                            ✓ 已达成
                          </span>
                        ) : day.calories === 0 ? (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                            - 无记录
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                            未达成
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
}