// 'use client';

// import { useEffect, useState } from 'react';
// import { useRouter } from 'next/navigation';
// import { useAuth } from '@/lib/hooks/useAuth';
// import { nutritionService } from '@/lib/api';
// import { PieChart, BarChart, Calendar, TrendingUp } from 'lucide-react';
// import Link from 'next/link';

// export default function NutritionGoals() {
//   const router = useRouter();
//   const { user, isAuthenticated } = useAuth();
//   const [goals, setGoals] = useState<any>(null);
//   const [profile, setProfile] = useState<any>(null);
//   const [isLoading, setIsLoading] = useState(true);
//   const [error, setError] = useState<string | null>(null);
//   const [formData, setFormData] = useState({
//     calories: 0,
//     protein: 0,
//     carbs: 0,
//     fat: 0,
//     fiber: 0,
//     sugar: 0,
//     sodium: 0
//   });
//   const [isSaving, setIsSaving] = useState(false);
//   const [saveSuccess, setSaveSuccess] = useState(false);

//   useEffect(() => {
//     if (!isAuthenticated) {
//       router.push('/auth/login');
//       return;
//     }

//     const fetchNutritionData = async () => {
//       try {
//         if (user?.userId) {
//           // 获取用户营养目标
//           const goalsResponse = await nutritionService.getUserGoals(user.userId);
//           setGoals(goalsResponse.data);
//           setFormData(goalsResponse.data.goals || goalsResponse.data);

//           // 获取用户个人信息
//           const profileResponse = await nutritionService.getUserProfile(user.userId);
//           setProfile(profileResponse.data);
//         }
//       } catch (err: any) {
//         console.error('Failed to fetch nutrition data:', err);
//         setError(err.response?.data?.message || '获取营养目标数据失败');
//       } finally {
//         setIsLoading(false);
//       }
//     };

//     fetchNutritionData();
//   }, [isAuthenticated, user, router]);

//   const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
//     const { name, value } = e.target;
//     setFormData({
//       ...formData,
//       [name]: parseInt(value) || 0
//     });
//   };

//   const handleSubmit = async (e: React.FormEvent) => {
//     e.preventDefault();
    
//     if (!user?.userId) return;
    
//     setIsSaving(true);
//     setSaveSuccess(false);
    
//     try {
//       const response = await nutritionService.updateUserGoals(user.userId, formData);
//       setGoals(response.data);
//       setSaveSuccess(true);
//       setTimeout(() => setSaveSuccess(false), 3000);
//     } catch (err: any) {
//       console.error('Failed to update goals:', err);
//       setError(err.response?.data?.message || '更新营养目标失败');
//     } finally {
//       setIsSaving(false);
//     }
//   };

//   if (isLoading) {
//     return (
//       <div className="flex justify-center items-center min-h-[60vh]">
//         <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-emerald-500"></div>
//       </div>
//     );
//   }

//   return (
//     <div className="max-w-4xl mx-auto">
//       <h1 className="text-2xl font-bold mb-6">营养目标设置</h1>

//       <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
//         <div className="md:col-span-2 bg-white rounded-lg shadow-md p-6">
//           <h2 className="text-xl font-medium mb-4">设置每日营养目标</h2>
          
//           {error && (
//             <div className="mb-4 p-3 bg-red-50 text-red-600 rounded-md">
//               {error}
//             </div>
//           )}
          
//           {saveSuccess && (
//             <div className="mb-4 p-3 bg-green-50 text-green-600 rounded-md">
//               营养目标更新成功
//             </div>
//           )}
          
//           <form onSubmit={handleSubmit}>
//             <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
//               <div>
//                 <label htmlFor="calories" className="block text-gray-700 mb-1">
//                   每日热量 (千卡)
//                 </label>
//                 <input
//                   type="number"
//                   id="calories"
//                   name="calories"
//                   value={formData.calories}
//                   onChange={handleInputChange}
//                   className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-emerald-500"
//                   min="0"
//                   required
//                 />
//               </div>
//               <div>
//                 <label htmlFor="protein" className="block text-gray-700 mb-1">
//                   蛋白质 (克)
//                 </label>
//                 <input
//                   type="number"
//                   id="protein"
//                   name="protein"
//                   value={formData.protein}
//                   onChange={handleInputChange}
//                   className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-emerald-500"
//                   min="0"
//                   required
//                 />
//               </div>
//               <div>
//                 <label htmlFor="carbs" className="block text-gray-700 mb-1">
//                   碳水化合物 (克)
//                 </label>
//                 <input
//                   type="number"
//                   id="carbs"
//                   name="carbs"
//                   value={formData.carbs}
//                   onChange={handleInputChange}
//                   className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-emerald-500"
//                   min="0"
//                   required
//                 />
//               </div>
//               <div>
//                 <label htmlFor="fat" className="block text-gray-700 mb-1">
//                   脂肪 (克)
//                 </label>
//                 <input
//                   type="number"
//                   id="fat"
//                   name="fat"
//                   value={formData.fat}
//                   onChange={handleInputChange}
//                   className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-emerald-500"
//                   min="0"
//                   required
//                 />
//               </div>
//               <div>
//                 <label htmlFor="fiber" className="block text-gray-700 mb-1">
//                   膳食纤维 (克)
//                 </label>
//                 <input
//                   type="number"
//                   id="fiber"
//                   name="fiber"
//                   value={formData.fiber}
//                   onChange={handleInputChange}
//                   className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-emerald-500"
//                   min="0"
//                   required
//                 />
//               </div>
//               <div>
//                 <label htmlFor="sugar" className="block text-gray-700 mb-1">
//                   糖 (克)
//                 </label>
//                 <input
//                   type="number"
//                   id="sugar"
//                   name="sugar"
//                   value={formData.sugar}
//                   onChange={handleInputChange}
//                   className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-emerald-500"
//                   min="0"
//                 />
//               </div>
//               <div>
//                 <label htmlFor="sodium" className="block text-gray-700 mb-1">
//                   钠 (毫克)
//                 </label>
//                 <input
//                   type="number"
//                   id="sodium"
//                   name="sodium"
//                   value={formData.sodium}
//                   onChange={handleInputChange}
//                   className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-emerald-500"
//                   min="0"
//                 />
//               </div>
//             </div>
            
//             <div className="flex justify-end">
//               <button
//                 type="submit"
//                 disabled={isSaving}
//                 className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:opacity-50"
//               >
//                 {isSaving ? '保存中...' : '保存目标'}
//               </button>
//             </div>
//           </form>
          
//           {goals && goals.macroRatio && (
//             <div className="mt-6">
//               <h3 className="text-lg font-medium mb-2">宏量营养素比例</h3>
//               <div className="bg-gray-50 p-4 rounded-lg">
//                 <div className="flex justify-between mb-2">
//                   <span className="text-gray-600">蛋白质</span>
//                   <span className="font-medium">{goals.macroRatio.protein}%</span>
//                 </div>
//                 <div className="w-full bg-gray-200 rounded-full h-2.5 mb-4">
//                   <div 
//                     className="bg-blue-500 h-2.5 rounded-full" 
//                     style={{ width: `${goals.macroRatio.protein}%` }}
//                   ></div>
//                 </div>
                
//                 <div className="flex justify-between mb-2">
//                   <span className="text-gray-600">碳水化合物</span>
//                   <span className="font-medium">{goals.macroRatio.carbs}%</span>
//                 </div>
//                 <div className="w-full bg-gray-200 rounded-full h-2.5 mb-4">
//                   <div 
//                     className="bg-yellow-500 h-2.5 rounded-full" 
//                     style={{ width: `${goals.macroRatio.carbs}%` }}
//                   ></div>
//                 </div>
                
//                 <div className="flex justify-between mb-2">
//                   <span className="text-gray-600">脂肪</span>
//                   <span className="font-medium">{goals.macroRatio.fat}%</span>
//                 </div>
//                 <div className="w-full bg-gray-200 rounded-full h-2.5">
//                   <div 
//                     className="bg-red-500 h-2.5 rounded-full" 
//                     style={{ width: `${goals.macroRatio.fat}%` }}
//                   ></div>
//                 </div>
//               </div>
//             </div>
//           )}
//         </div>
        
//         <div className="bg-white rounded-lg shadow-md p-6">
//           <h2 className="text-xl font-medium mb-4">快速导航</h2>
//           <div className="space-y-4">
//             <Link
//               href="/nutrition/daily"
//               className="flex items-center p-3 bg-emerald-50 rounded-lg hover:bg-emerald-100"
//             >
//               <Calendar className="h-5 w-5 text-emerald-600 mr-3" />
//               <span>今日营养记录</span>
//             </Link>
//             <Link
//               href="/nutrition/history"
//               className="flex items-center p-3 bg-blue-50 rounded-lg hover:bg-blue-100"
//             >
//               <TrendingUp className="h-5 w-5 text-blue-600 mr-3" />
//               <span>历史数据分析</span>
//             </Link>
//             <Link
//               href="/profile"
//               className="flex items-center p-3 bg-purple-50 rounded-lg hover:bg-purple-100"
//             >
//               <PieChart className="h-5 w-5 text-purple-600 mr-3" />
//               <span>个人资料设置</span>
//             </Link>
//             <Link
//               href="/food-search/categories"
//               className="flex items-center p-3 bg-yellow-50 rounded-lg hover:bg-yellow-100"
//             >
//               <BarChart className="h-5 w-5 text-yellow-600 mr-3" />
//               <span>浏览食物数据库</span>
//             </Link>
//           </div>
          
//           {profile && (
//             <div className="mt-6 p-4 bg-gray-50 rounded-lg">
//               <h3 className="font-medium mb-2">个人信息</h3>
//               <div className="text-sm space-y-2">
//                 <div className="flex justify-between">
//                   <span className="text-gray-500">性别:</span>
//                   <span>{profile.gender === 'male' ? '男' : '女'}</span>
//                 </div>
//                 <div className="flex justify-between">
//                   <span className="text-gray-500">年龄:</span>
//                   <span>{profile.age} 岁</span>
//                 </div>
//                 <div className="flex justify-between">
//                   <span className="text-gray-500">身高:</span>
//                   <span>{profile.height} 厘米</span>
//                 </div>
//                 <div className="flex justify-between">
//                   <span className="text-gray-500">体重:</span>
//                   <span>{profile.weight} 公斤</span>
//                 </div>
//                 <div className="flex justify-between">
//                   <span className="text-gray-500">活动水平:</span>
//                   <span>
//                     {profile.activityLevel === 'sedentary' && '久坐'}
//                     {profile.activityLevel === 'light' && '轻度活动'}
//                     {profile.activityLevel === 'moderate' && '中度活动'}
//                     {profile.activityLevel === 'active' && '活跃'}
//                     {profile.activityLevel === 'very_active' && '非常活跃'}
//                   </span>
//                 </div>
//                 <div className="flex justify-between">
//                   <span className="text-gray-500">目标:</span>
//                   <span>
//                     {profile.goal === 'lose_weight' && '减重'}
//                     {profile.goal === 'maintain' && '维持体重'}
//                     {profile.goal === 'gain_weight' && '增重'}
//                     {profile.goal === 'build_muscle' && '增肌'}
//                   </span>
//                 </div>
//               </div>
//               <div className="mt-3 text-center">
//                 <Link
//                   href="/profile"
//                   className="text-sm text-emerald-600 hover:text-emerald-700"
//                 >
//                   更新个人信息
//                 </Link>
//               </div>
//             </div>
//           )}
//         </div>
//       </div>
//     </div>
//   );
// }

'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/hooks/useAuth';
import { nutritionService } from '@/lib/api';
import { PieChart, BarChart, Calendar, TrendingUp, AlertCircle, CheckCircle, Info } from 'lucide-react';
import Link from 'next/link';

export default function NutritionGoals() {
  const router = useRouter();
  const { user, isAuthenticated } = useAuth();
  const [goals, setGoals] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    calories: 0,
    protein: 0,
    carbs: 0,
    fat: 0,
    fiber: 0,
    sugar: 0,
    sodium: 0
  });
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [isNewUser, setIsNewUser] = useState(false);
  const [welcomeMessage, setWelcomeMessage] = useState<string | null>(null);
  const [suggestions, setSuggestions] = useState<string[]>([]);

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/auth/login');
      return;
    }

    const fetchNutritionData = async () => {
      try {
        if (user?.userId) {
          // 先尝试获取用户营养目标
          try {
            const goalsResponse = await nutritionService.getUserGoals(user.userId);
            
            if (goalsResponse.status === 200) {
              setGoals(goalsResponse.data);
              setFormData(goalsResponse.data.goals || goalsResponse.data);
            }
          } catch (goalsError: any) {
            if (goalsError.response?.status === 404) {
              // 用户没有营养目标，尝试初始化
              console.log('用户没有营养目标，正在初始化...');
              await initializeUserGoals();
            } else {
              throw goalsError;
            }
          }

          // 获取用户个人信息
          try {
            const profileResponse = await nutritionService.getUserProfile(user.userId);
            if (profileResponse.status === 200) {
              setProfile(profileResponse.data);
            }
          } catch (profileError: any) {
            // 个人信息不存在不影响主要功能
            console.log('用户个人信息不存在');
          }
        }
      } catch (err: any) {
        console.error('Failed to fetch nutrition data:', err);
        setError(err.response?.data?.message || '获取营养目标数据失败');
      } finally {
        setIsLoading(false);
      }
    };

    fetchNutritionData();
  }, [isAuthenticated, user, router]);

  const initializeUserGoals = async () => {
    try {
      if (!user?.userId) return;

      // 检查用户是否有个人信息来决定是否使用基于个人信息的初始化
      let useProfileBased = false;
      try {
        const profileResponse = await nutritionService.getUserProfile(user.userId);
        useProfileBased = profileResponse.status === 200;
      } catch (error) {
        useProfileBased = false;
      }

      const response = await nutritionService.initializeUserGoals(user.userId, useProfileBased);
      
      if (response.status === 201) {
        setGoals(response.data);
        setFormData(response.data.goals);
        setIsNewUser(true);
        
        // 显示欢迎信息
        if (response.data.nextSteps) {
          setSuggestions(response.data.nextSteps);
        }
        
        console.log('营养目标初始化成功');
      }
    } catch (error: any) {
      console.error('初始化营养目标失败:', error);
      setError(error.response?.data?.message || '初始化营养目标失败');
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: parseFloat(value) || 0
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user?.userId) return;
    
    setIsSaving(true);
    setSaveSuccess(false);
    setError(null);
    
    try {
      const response = await nutritionService.updateUserGoals(user.userId, formData);
      
      if (response.status === 200 || response.status === 201) {
        setGoals(response.data);
        setSaveSuccess(true);
        
        // 如果是新用户，显示欢迎信息
        if (response.data.isNewUser) {
          setIsNewUser(true);
          setWelcomeMessage(response.data.welcomeMessage);
          if (response.data.suggestions) {
            setSuggestions(response.data.suggestions);
          }
        }
        
        setTimeout(() => {
          setSaveSuccess(false);
          setWelcomeMessage(null);
        }, 5000);
      }
    } catch (err: any) {
      console.error('Failed to update goals:', err);
      setError(err.response?.data?.message || '更新营养目标失败');
    } finally {
      setIsSaving(false);
    }
  };

  const handleGenerateRecommendedGoals = async () => {
    try {
      if (!user?.userId) return;
      
      setIsSaving(true);
      
      // 重新初始化目标（基于个人信息）
      const response = await nutritionService.initializeUserGoals(user.userId, true);

      console.log('生成推荐目标:', response.data);
      
      if (response.status === 201) {
        setFormData(response.data.goals);
        setSaveSuccess(true);
        setTimeout(() => setSaveSuccess(false), 3000);
      }
    } catch (error: any) {
      console.error('生成推荐目标失败:', error);
      setError(error.response?.data?.message || '生成推荐目标失败');
    } finally {
      setIsSaving(false);
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
    <div className="max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">营养目标设置</h1>

      {/* 新用户欢迎信息 */}
      {isNewUser && welcomeMessage && (
        <div className="mb-6 p-4 bg-emerald-50 border border-emerald-200 rounded-lg">
          <div className="flex items-start">
            <CheckCircle className="h-5 w-5 text-emerald-600 mr-2 mt-0.5 flex-shrink-0" />
            <div>
              <h3 className="font-medium text-emerald-800 mb-2">欢迎使用 DietLens！</h3>
              <p className="text-emerald-700 mb-3">{welcomeMessage}</p>
              {suggestions.length > 0 && (
                <div>
                  <p className="text-emerald-700 font-medium mb-2">建议您：</p>
                  <ul className="text-emerald-600 text-sm space-y-1">
                    {suggestions.map((suggestion, index) => (
                      <li key={index} className="flex items-center">
                        <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full mr-2"></span>
                        {suggestion}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="md:col-span-2 bg-white rounded-lg shadow-md p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-medium">设置每日营养目标</h2>
            {profile && (
              <button
                onClick={handleGenerateRecommendedGoals}
                disabled={isSaving}
                className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
              >
                {isSaving ? '生成中...' : '生成推荐目标'}
              </button>
            )}
          </div>

          {/* 提示信息 */}
          {!profile && (
            <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-md">
              <div className="flex items-start">
                <Info className="h-4 w-4 text-blue-600 mr-2 mt-0.5 flex-shrink-0" />
                <div className="text-blue-700 text-sm">
                  <p>建议先
                    <Link href="/profile" className="text-blue-600 hover:text-blue-800 underline">
                      完善个人信息
                    </Link>
                    以获得更准确的营养目标推荐。
                  </p>
                </div>
              </div>
            </div>
          )}
          
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
              <div className="flex items-start">
                <AlertCircle className="h-4 w-4 text-red-600 mr-2 mt-0.5 flex-shrink-0" />
                <span className="text-red-700 text-sm">{error}</span>
              </div>
            </div>
          )}
          
          {saveSuccess && (
            <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-md">
              <div className="flex items-start">
                <CheckCircle className="h-4 w-4 text-green-600 mr-2 mt-0.5 flex-shrink-0" />
                <span className="text-green-700 text-sm">营养目标更新成功！</span>
              </div>
            </div>
          )}
          
          <form onSubmit={handleSubmit}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              <div>
                <label htmlFor="calories" className="block text-gray-700 mb-1">
                  每日热量 (千卡) *
                </label>
                <input
                  type="number"
                  id="calories"
                  name="calories"
                  value={formData.calories}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  min="0"
                  step="1"
                  required
                />
              </div>
              <div>
                <label htmlFor="protein" className="block text-gray-700 mb-1">
                  蛋白质 (克) *
                </label>
                <input
                  type="number"
                  id="protein"
                  name="protein"
                  value={formData.protein}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  min="0"
                  step="0.1"
                  required
                />
              </div>
              <div>
                <label htmlFor="carbs" className="block text-gray-700 mb-1">
                  碳水化合物 (克) *
                </label>
                <input
                  type="number"
                  id="carbs"
                  name="carbs"
                  value={formData.carbs}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  min="0"
                  step="0.1"
                  required
                />
              </div>
              <div>
                <label htmlFor="fat" className="block text-gray-700 mb-1">
                  脂肪 (克) *
                </label>
                <input
                  type="number"
                  id="fat"
                  name="fat"
                  value={formData.fat}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  min="0"
                  step="0.1"
                  required
                />
              </div>
              <div>
                <label htmlFor="fiber" className="block text-gray-700 mb-1">
                  膳食纤维 (克) *
                </label>
                <input
                  type="number"
                  id="fiber"
                  name="fiber"
                  value={formData.fiber}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  min="0"
                  step="0.1"
                  required
                />
              </div>
              <div>
                <label htmlFor="sugar" className="block text-gray-700 mb-1">
                  糖 (克)
                </label>
                <input
                  type="number"
                  id="sugar"
                  name="sugar"
                  value={formData.sugar}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  min="0"
                  step="0.1"
                />
              </div>
              <div className="md:col-span-2">
                <label htmlFor="sodium" className="block text-gray-700 mb-1">
                  钠 (毫克)
                </label>
                <input
                  type="number"
                  id="sodium"
                  name="sodium"
                  value={formData.sodium}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  min="0"
                  step="1"
                />
              </div>
            </div>
            
            <div className="flex justify-end">
              <button
                type="submit"
                disabled={isSaving}
                className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSaving ? '保存中...' : '保存目标'}
              </button>
            </div>
          </form>
          
          {goals && goals.macroRatio && (
            <div className="mt-6">
              <h3 className="text-lg font-medium mb-2">宏量营养素比例</h3>
              <div className="bg-gray-50 p-4 rounded-lg">
                <div className="flex justify-between mb-2">
                  <span className="text-gray-600">蛋白质</span>
                  <span className="font-medium">{goals.macroRatio.protein}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2.5 mb-4">
                  <div 
                    className="bg-blue-500 h-2.5 rounded-full transition-all duration-300" 
                    style={{ width: `${goals.macroRatio.protein}%` }}
                  ></div>
                </div>
                
                <div className="flex justify-between mb-2">
                  <span className="text-gray-600">碳水化合物</span>
                  <span className="font-medium">{goals.macroRatio.carbs}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2.5 mb-4">
                  <div 
                    className="bg-yellow-500 h-2.5 rounded-full transition-all duration-300" 
                    style={{ width: `${goals.macroRatio.carbs}%` }}
                  ></div>
                </div>
                
                <div className="flex justify-between mb-2">
                  <span className="text-gray-600">脂肪</span>
                  <span className="font-medium">{goals.macroRatio.fat}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2.5">
                  <div 
                    className="bg-red-500 h-2.5 rounded-full transition-all duration-300" 
                    style={{ width: `${goals.macroRatio.fat}%` }}
                  ></div>
                </div>
              </div>
            </div>
          )}
        </div>
        
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-medium mb-4">快速导航</h2>
          <div className="space-y-4">
            <Link
              href="/nutrition/daily"
              className="flex items-center p-3 bg-emerald-50 rounded-lg hover:bg-emerald-100 transition-colors"
            >
              <Calendar className="h-5 w-5 text-emerald-600 mr-3" />
              <span>今日营养记录</span>
            </Link>
            <Link
              href="/nutrition/history"
              className="flex items-center p-3 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors"
            >
              <TrendingUp className="h-5 w-5 text-blue-600 mr-3" />
              <span>历史数据分析</span>
            </Link>
            <Link
              href="/profile"
              className="flex items-center p-3 bg-purple-50 rounded-lg hover:bg-purple-100 transition-colors"
            >
              <PieChart className="h-5 w-5 text-purple-600 mr-3" />
              <span>个人资料设置</span>
            </Link>
            <Link
              href="/food-search/categories"
              className="flex items-center p-3 bg-yellow-50 rounded-lg hover:bg-yellow-100 transition-colors"
            >
              <BarChart className="h-5 w-5 text-yellow-600 mr-3" />
              <span>浏览食物数据库</span>
            </Link>
          </div>
          
          {profile && (
            <div className="mt-6 p-4 bg-gray-50 rounded-lg">
              <h3 className="font-medium mb-2">个人信息</h3>
              <div className="text-sm space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-500">性别:</span>
                  <span>{profile.gender === 'male' ? '男' : '女'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">年龄:</span>
                  <span>{profile.age} 岁</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">身高:</span>
                  <span>{profile.height} 厘米</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">体重:</span>
                  <span>{profile.weight} 公斤</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">活动水平:</span>
                  <span>
                    {profile.activityLevel === 'sedentary' && '久坐'}
                    {profile.activityLevel === 'light' && '轻度活动'}
                    {profile.activityLevel === 'moderate' && '中度活动'}
                    {profile.activityLevel === 'active' && '活跃'}
                    {profile.activityLevel === 'very_active' && '非常活跃'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">目标:</span>
                  <span>
                    {profile.goal === 'lose_weight' && '减重'}
                    {profile.goal === 'maintain' && '维持体重'}
                    {profile.goal === 'gain_weight' && '增重'}
                    {profile.goal === 'gain_muscle' && '增肌'}
                  </span>
                </div>
              </div>
              <div className="mt-3 text-center">
                <Link
                  href="/profile"
                  className="text-sm text-emerald-600 hover:text-emerald-700"
                >
                  更新个人信息
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}