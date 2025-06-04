'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/hooks/useAuth';
import { BentoGrid, BentoCard } from '@/components/bento/BentoGrid';
import { User, Settings, Save, TrendingUp, Target, Calendar, BookOpen, Loader2, AlertCircle, CheckCircle } from 'lucide-react';
import Link from 'next/link';
import { nutritionService } from '@/lib/api';
import { getImageUrl, formatDate } from '@/lib/utils';

export default function ProfilePage() {
  const router = useRouter();
  const { user, isAuthenticated, isLoading } = useAuth();
  
  const [profile, setProfile] = useState<any>(null);
  const [nutritionData, setNutritionData] = useState<any>(null);
  const [recommendations, setRecommendations] = useState<any>(null);
  const [formData, setFormData] = useState({
    gender: '',
    age: '',
    height: '',
    weight: '',
    activityLevel: '',
    goal: '',
    dietaryRestrictions: [] as string[]
  });
  const [isDataLoading, setIsDataLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [isEditing, setIsEditing] = useState(false);

  // 活动水平选项
  const activityLevels = [
    { value: 'sedentary', label: '久坐不动' },
    { value: 'light', label: '轻度活动' },
    { value: 'moderate', label: '中度活动' },
    { value: 'active', label: '积极活动' },
    { value: 'very_active', label: '非常积极' }
  ];

  // 目标选项
  const goals = [
    { value: 'maintain', label: '维持体重' },
    { value: 'lose_weight', label: '减重' },
    { value: 'gain_weight', label: '增重' },
    { value: 'gain_muscle', label: '增肌' }
  ];

  // 饮食限制选项
  const dietaryOptions = [
    { value: 'none', label: '无特殊限制' },
    { value: 'vegetarian', label: '素食主义' },
    { value: 'vegan', label: '纯素食主义' },
    { value: 'gluten_free', label: '无麸质' },
    { value: 'dairy_free', label: '无乳制品' },
    { value: 'low_carb', label: '低碳水' }
  ];

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/auth/login');
      return;
    }

    if (isAuthenticated && user) {
      fetchProfileData();
    }
  }, [isAuthenticated, isLoading, user, router]);

  const fetchProfileData = async () => {
    setIsDataLoading(true);
    try {
      // 并行获取数据
      const [profileResponse, nutritionResponse, recommendationsResponse] = await Promise.allSettled([
        nutritionService.getUserProfile(user.userId),
        nutritionService.getDailyIntake(user.userId),
        nutritionService.getNutritionRecommendations(user.userId)
      ]);

      // 处理个人信息
      if (profileResponse.status === 'fulfilled' && profileResponse.value.status === 200) {
        const profileData = profileResponse.value.data;
        setProfile(profileData);
        setFormData({
          gender: profileData.gender || '',
          age: profileData.age?.toString() || '',
          height: profileData.height?.toString() || '',
          weight: profileData.weight?.toString() || '',
          activityLevel: profileData.activityLevel || '',
          goal: profileData.goal || '',
          dietaryRestrictions: profileData.dietaryRestrictions || ['none']
        });
      }

      // 处理营养数据
      if (nutritionResponse.status === 'fulfilled' && nutritionResponse.value.status === 200) {
        setNutritionData(nutritionResponse.value.data);
      }

      // 处理推荐数据
      if (recommendationsResponse.status === 'fulfilled' && recommendationsResponse.value.status === 200) {
        setRecommendations(recommendationsResponse.value.data);
        console.log('Recommendations:', recommendationsResponse.value.data);
      }
    } catch (error) {
      console.error('Failed to fetch profile data:', error);
    } finally {
      setIsDataLoading(false);
    }
  };

  const handleInputChange = (field: string, value: string | string[]) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    
    if (message) {
      setMessage(null);
    }
  };

  const handleDietaryRestrictionChange = (value: string, checked: boolean) => {
    let newRestrictions = [...formData.dietaryRestrictions];
    
    if (value === 'none') {
      newRestrictions = checked ? ['none'] : [];
    } else {
      newRestrictions = newRestrictions.filter(r => r !== 'none');
      
      if (checked) {
        if (!newRestrictions.includes(value)) {
          newRestrictions.push(value);
        }
      } else {
        newRestrictions = newRestrictions.filter(r => r !== value);
      }
      
      if (newRestrictions.length === 0) {
        newRestrictions = ['none'];
      }
    }
    
    setFormData(prev => ({
      ...prev,
      dietaryRestrictions: newRestrictions
    }));
  };

  const handleSubmit = async () => {
    const { gender, age, height, weight, activityLevel, goal } = formData;
    
    if (!gender || !age || !height || !weight || !activityLevel || !goal) {
      setMessage({ type: 'error', text: '请填写所有必填字段' });
      return;
    }
    
    try {
      setIsSaving(true);
      setMessage(null);
      
      const profileData = {
        gender: formData.gender,
        age: parseInt(formData.age),
        height: parseFloat(formData.height),
        weight: parseFloat(formData.weight),
        activityLevel: formData.activityLevel,
        goal: formData.goal,
        dietaryRestrictions: formData.dietaryRestrictions
      };
      
      const response = await nutritionService.updateUserProfile(user.userId, profileData);
      
      if (response.status === 200) {
        setMessage({ type: 'success', text: '个人信息更新成功！' });
        setProfile(response.data);
        setIsEditing(false);
        
        // 重新获取推荐数据
        const recommendationsResponse = await nutritionService.getNutritionRecommendations(user.userId);
        if (recommendationsResponse.status === 200) {
          setRecommendations(recommendationsResponse.data);
        }
      }
    } catch (error: any) {
      setMessage({
        type: 'error',
        text: error.response?.data?.message || '更新失败，请稍后重试'
      });
    } finally {
      setIsSaving(false);
    }
  };

  const formatNutrition = (value: number) => {
    return parseFloat(value.toString()).toFixed(0);
  };

  const getActivityLevelLabel = (value: string) => {
    return activityLevels.find(level => level.value === value)?.label || value;
  };

  const getGoalLabel = (value: string) => {
    return goals.find(goal => goal.value === value)?.label || value;
  };

  const getDietaryRestrictionsLabels = (restrictions: string[]) => {
    return restrictions.map(r => 
      dietaryOptions.find(option => option.value === r)?.label || r
    ).join(', ');
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
      <h1 className="text-2xl font-bold mb-6">个人中心</h1>

      {/* 消息提示 */}
      {message && (
        <div className={`mb-6 p-4 rounded-lg flex items-start ${
          message.type === 'success' 
            ? 'bg-green-50 text-green-800 border border-green-200' 
            : 'bg-red-50 text-red-800 border border-red-200'
        }`}>
          {message.type === 'success' ? (
            <CheckCircle className="h-5 w-5 mr-2 mt-0.5 flex-shrink-0" />
          ) : (
            <AlertCircle className="h-5 w-5 mr-2 mt-0.5 flex-shrink-0" />
          )}
          <span>{message.text}</span>
        </div>
      )}
      
      <BentoGrid className="mb-8">
        {/* 基本信息 */}
        <BentoCard 
          size="2x2" 
          title="基本信息" 
          icon={<User className="h-5 w-5" />}
        >
          {!isEditing ? (
            <div className="h-full flex flex-col">
              {profile ? (
                <>
                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div>
                      <div className="text-sm text-gray-500 mb-1">性别</div>
                      <div className="font-medium">{profile.gender === 'male' ? '男' : '女'}</div>
                    </div>
                    <div>
                      <div className="text-sm text-gray-500 mb-1">年龄</div>
                      <div className="font-medium">{profile.age} 岁</div>
                    </div>
                    <div>
                      <div className="text-sm text-gray-500 mb-1">身高</div>
                      <div className="font-medium">{profile.height} cm</div>
                    </div>
                    <div>
                      <div className="text-sm text-gray-500 mb-1">体重</div>
                      <div className="font-medium">{profile.weight} kg</div>
                    </div>
                  </div>
                  
                  <div className="space-y-3 mb-4">
                    <div>
                      <div className="text-sm text-gray-500 mb-1">活动水平</div>
                      <div className="font-medium">{getActivityLevelLabel(profile.activityLevel)}</div>
                    </div>
                    <div>
                      <div className="text-sm text-gray-500 mb-1">健康目标</div>
                      <div className="font-medium">{getGoalLabel(profile.goal)}</div>
                    </div>
                    <div>
                      <div className="text-sm text-gray-500 mb-1">饮食限制</div>
                      <div className="font-medium text-sm">{getDietaryRestrictionsLabels(profile.dietaryRestrictions)}</div>
                    </div>
                  </div>
                  
                  <div className="mt-auto">
                    <button
                      onClick={() => setIsEditing(true)}
                      className="w-full px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 flex items-center justify-center"
                    >
                      <Settings className="h-4 w-4 mr-2" />
                      编辑信息
                    </button>
                  </div>
                </>
              ) : (
                <div className="h-full flex flex-col items-center justify-center">
                  <div className="text-gray-400 mb-4">暂无个人信息</div>
                  <button
                    onClick={() => setIsEditing(true)}
                    className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700"
                  >
                    完善信息
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="h-full flex flex-col space-y-4">
              {/* 编辑表单 */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-gray-500 mb-1">性别</label>
                  <div className="flex space-x-2">
                    <label className="flex items-center text-sm">
                      <input
                        type="radio"
                        name="gender"
                        value="male"
                        checked={formData.gender === 'male'}
                        onChange={(e) => handleInputChange('gender', e.target.value)}
                        className="text-emerald-600 focus:ring-emerald-500"
                      />
                      <span className="ml-1">男</span>
                    </label>
                    <label className="flex items-center text-sm">
                      <input
                        type="radio"
                        name="gender"
                        value="female"
                        checked={formData.gender === 'female'}
                        onChange={(e) => handleInputChange('gender', e.target.value)}
                        className="text-emerald-600 focus:ring-emerald-500"
                      />
                      <span className="ml-1">女</span>
                    </label>
                  </div>
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">年龄</label>
                  <input
                    type="number"
                    value={formData.age}
                    onChange={(e) => handleInputChange('age', e.target.value)}
                    className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-emerald-500"
                    placeholder="岁"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">身高</label>
                  <input
                    type="number"
                    value={formData.height}
                    onChange={(e) => handleInputChange('height', e.target.value)}
                    className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-emerald-500"
                    placeholder="cm"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">体重</label>
                  <input
                    type="number"
                    value={formData.weight}
                    onChange={(e) => handleInputChange('weight', e.target.value)}
                    className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-emerald-500"
                    placeholder="kg"
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-xs text-gray-500 mb-1">活动水平</label>
                <select
                  value={formData.activityLevel}
                  onChange={(e) => handleInputChange('activityLevel', e.target.value)}
                  className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-emerald-500"
                >
                  <option value="">请选择</option>
                  {activityLevels.map(level => (
                    <option key={level.value} value={level.value}>{level.label}</option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-xs text-gray-500 mb-1">健康目标</label>
                <select
                  value={formData.goal}
                  onChange={(e) => handleInputChange('goal', e.target.value)}
                  className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-emerald-500"
                >
                  <option value="">请选择</option>
                  {goals.map(goal => (
                    <option key={goal.value} value={goal.value}>{goal.label}</option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-xs text-gray-500 mb-1">饮食限制</label>
                <div className="grid grid-cols-2 gap-1 text-xs">
                  {dietaryOptions.slice(0, 4).map(option => (
                    <label key={option.value} className="flex items-center">
                      <input
                        type="checkbox"
                        checked={formData.dietaryRestrictions.includes(option.value)}
                        onChange={(e) => handleDietaryRestrictionChange(option.value, e.target.checked)}
                        className="text-emerald-600 focus:ring-emerald-500 rounded"
                      />
                      <span className="ml-1">{option.label}</span>
                    </label>
                  ))}
                </div>
              </div>
              
              <div className="flex space-x-2 mt-auto">
                <button
                  onClick={handleSubmit}
                  disabled={isSaving}
                  className="flex-1 px-3 py-2 bg-emerald-600 text-white text-sm rounded hover:bg-emerald-700 disabled:opacity-50 flex items-center justify-center"
                >
                  {isSaving ? (
                    <Loader2 className="h-3 w-3 animate-spin mr-1" />
                  ) : (
                    <Save className="h-3 w-3 mr-1" />
                  )}
                  {isSaving ? '保存中' : '保存'}
                </button>
                <button
                  onClick={() => setIsEditing(false)}
                  className="px-3 py-2 bg-gray-200 text-gray-700 text-sm rounded hover:bg-gray-300"
                >
                  取消
                </button>
              </div>
            </div>
          )}
        </BentoCard>

        {/* 今日营养情况 */}
        <BentoCard 
          size="2x1" 
          title="今日营养情况" 
          icon={<TrendingUp className="h-5 w-5" />}
        >
          {nutritionData ? (
            <div className="grid grid-cols-4 gap-3">
              <div className="text-center">
                <div className="text-lg font-bold text-emerald-600">
                  {parseFloat(nutritionData.totals.calories).toFixed(0)}
                </div>
                <div className="text-xs text-gray-500">千卡</div>
                <div className="w-full bg-gray-200 rounded-full h-1 mt-1">
                  <div 
                    className="bg-emerald-500 h-1 rounded-full" 
                    style={{ width: `${Math.min(100, nutritionData.percentages.calories)}%` }}
                  ></div>
                </div>
              </div>
              <div className="text-center">
                <div className="text-lg font-bold text-blue-600">
                  {parseFloat(nutritionData.totals.protein).toFixed(0)}
                </div>
                <div className="text-xs text-gray-500">蛋白质(g)</div>
                <div className="w-full bg-gray-200 rounded-full h-1 mt-1">
                  <div 
                    className="bg-blue-500 h-1 rounded-full" 
                    style={{ width: `${Math.min(100, nutritionData.percentages.protein)}%` }}
                  ></div>
                </div>
              </div>
              <div className="text-center">
                <div className="text-lg font-bold text-yellow-600">
                  {parseFloat(nutritionData.totals.carbs).toFixed(0)}
                </div>
                <div className="text-xs text-gray-500">碳水(g)</div>
                <div className="w-full bg-gray-200 rounded-full h-1 mt-1">
                  <div 
                    className="bg-yellow-500 h-1 rounded-full" 
                    style={{ width: `${Math.min(100, nutritionData.percentages.carbs)}%` }}
                  ></div>
                </div>
              </div>
              <div className="text-center">
                <div className="text-lg font-bold text-red-600">
                  {parseFloat(nutritionData.totals.fat).toFixed(0)}
                </div>
                <div className="text-xs text-gray-500">脂肪(g)</div>
                <div className="w-full bg-gray-200 rounded-full h-1 mt-1">
                  <div 
                    className="bg-red-500 h-1 rounded-full" 
                    style={{ width: `${Math.min(100, nutritionData.percentages.fat)}%` }}
                  ></div>
                </div>
              </div>
            </div>
          ) : (
            <div className="h-full flex flex-col items-center justify-center">
              <div className="text-gray-400 mb-2">暂无今日数据</div>
              <Link 
                href="/food-recognition/upload" 
                className="text-emerald-600 hover:text-emerald-700 text-sm"
              >
                开始记录饮食
              </Link>
            </div>
          )}
        </BentoCard>

        {/* 营养目标 */}
        <BentoCard 
          size="1x1" 
          title="营养目标" 
          icon={<Target className="h-5 w-5" />}
        >
          {nutritionData?.goals ? (
            <div className="space-y-2">
              <div className="text-center mb-3">
                <div className="text-xl font-bold text-emerald-600">
                  {formatNutrition(nutritionData.goals.calories)}
                </div>
                <div className="text-xs text-gray-500">每日热量目标(千卡)</div>
              </div>
              
              <div className="grid grid-cols-3 gap-2 text-xs">
                <div className="text-center">
                  <div className="font-medium">{formatNutrition(nutritionData.goals.protein)}</div>
                  <div className="text-gray-500">蛋白质(g)</div>
                </div>
                <div className="text-center">
                  <div className="font-medium">{formatNutrition(nutritionData.goals.carbs)}</div>
                  <div className="text-gray-500">碳水(g)</div>
                </div>
                <div className="text-center">
                  <div className="font-medium">{formatNutrition(nutritionData.goals.fat)}</div>
                  <div className="text-gray-500">脂肪(g)</div>
                </div>
              </div>
              
              <Link 
                href="/nutrition/goals" 
                className="block text-center text-emerald-600 hover:text-emerald-700 text-xs mt-3"
              >
                调整目标
              </Link>
            </div>
          ) : (
            <div className="h-full flex flex-col items-center justify-center">
              <div className="text-gray-400 mb-2 text-sm">未设置目标</div>
              <Link 
                href="/nutrition/goals" 
                className="px-3 py-1 bg-emerald-600 text-white text-sm rounded hover:bg-emerald-700"
              >
                设置目标
              </Link>
            </div>
          )}
        </BentoCard>

        {/* 推荐饮食 */}
        <BentoCard 
          size="2x1" 
          title="今日推荐" 
          icon={<BookOpen className="h-5 w-5" />}
        >
          {recommendations?.recommendations && recommendations.recommendations.length > 0 ? (
            <div className="space-y-3">
              {recommendations.recommendations.slice(0, 2).map((rec: any, index: number) => (
                <div key={index} className="bg-gray-50 rounded-lg p-3">
                  <div className="text-sm font-medium mb-2">
                    {rec.type === 'protein' && '🥩 蛋白质补充'}
                    {rec.type === 'fiber' && '🥬 膳食纤维'}
                    {rec.type === 'fat' && '🥑 健康脂肪'}
                  </div>
                  <div className="text-xs text-gray-600 mb-2">{rec.message}</div>
                  {rec.suggestedFoods && rec.suggestedFoods.length > 0 && (
                    <div className="text-xs">
                      <span className="text-gray-500">推荐：</span>
                      <span className="text-emerald-600">
                        {rec.suggestedFoods.map((food: any) => food.name).join('、')}
                      </span>
                    </div>
                  )}
                </div>
              ))}
              
              {/* <Link 
                href="/nutrition/recommendations" 
                className="block text-center text-emerald-600 hover:text-emerald-700 text-xs"
              >
                查看更多建议
              </Link> */}
            </div>
          ) : (
            <div className="h-full flex flex-col items-center justify-center">
              <div className="text-gray-400 mb-2 text-sm">暂无推荐</div>
              <div className="text-xs text-gray-500 text-center">
                完善今日饮食情况后获取个性化推荐
              </div>
            </div>
          )}
        </BentoCard>

        {/* 饮食记录 */}
        <BentoCard 
          size="1x1" 
          title="饮食记录" 
          icon={<Calendar className="h-5 w-5" />}
        >
          {nutritionData?.meals && nutritionData.meals.length > 0 ? (
            <div className="space-y-3">
              <div className="text-center">
                <div className="text-xl font-bold text-gray-900">
                  {nutritionData.meals.length}
                </div>
                <div className="text-xs text-gray-500">今日餐次</div>
              </div>
              
              <div className="space-y-2">
                {nutritionData.meals.slice(0, 2).map((meal: any) => (
                  <div key={meal.id} className="bg-gray-50 rounded p-2">
                    <div className="text-sm font-medium">{meal.name}</div>
                    <div className="text-xs text-gray-500">
                      {meal.foods.length} 种食物 · {parseFloat(meal.totals.calories).toFixed(0)} 千卡
                    </div>
                  </div>
                ))}
              </div>
              
              <Link 
                href="/nutrition/daily" 
                className="block text-center text-emerald-600 hover:text-emerald-700 text-xs"
              >
                查看详细记录
              </Link>
            </div>
          ) : (
            <div className="h-full flex flex-col items-center justify-center">
              <div className="text-gray-400 mb-2 text-sm">暂无记录</div>
              <Link 
                href="/nutrition/daily" 
                className="px-3 py-1 bg-emerald-600 text-white text-sm rounded hover:bg-emerald-700"
              >
                开始记录
              </Link>
            </div>
          )}
        </BentoCard>
      </BentoGrid>
    </div>
  );
}