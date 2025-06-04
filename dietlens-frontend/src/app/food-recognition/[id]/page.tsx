'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/lib/hooks/useAuth';
import { foodRecognitionService } from '@/lib/api';
import Image from 'next/image';
import { getImageUrl } from '@/lib/utils';
import { ArrowLeft, Info } from 'lucide-react';
import Link from 'next/link';

export default function RecognitionDetail() {
  const { id } = useParams();
  const router = useRouter();
  const { isAuthenticated, user } = useAuth();
  const [recognition, setRecognition] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    const fetchRecognitionDetail = async () => {
      try {
        const response = await foodRecognitionService.getRecognitionDetail(id as string);
        setRecognition(response.data);
        console.log('Recogn:', recognition);
        console.log('Recognition detail:', response.data);
      } catch (err: any) {
        console.error('Failed to fetch recognition detail:', err);
        setError(err.response?.data?.message || '获取识别结果失败');
      } finally {
        setIsLoading(false);
      }
    };

    if (id) {
      fetchRecognitionDetail();
    }
  }, [id]);

  const handleSaveToDiary = async () => {
    if (!user?.userId || !recognition) return;
    
    setIsSaving(true);
    try {
      const today = new Date().toISOString().split('T')[0];
      await foodRecognitionService.saveToDiary(
        recognition.recognitionId,
        user.userId,
        today,
        recognition.mealType || 'lunch'
      );
      router.push('/nutrition/daily');
    } catch (err: any) {
      console.error('Failed to save to diary:', err);
      setError(err.response?.data?.message || '保存到日记失败');
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

  if (error) {
    return (
      <div className="max-w-3xl mx-auto">
        <div className="bg-red-50 p-6 rounded-lg text-center">
          <h2 className="text-xl font-bold text-red-600 mb-2">出错了</h2>
          <p className="text-red-600 mb-4">{error}</p>
          <Link
            href="/food-recognition/upload"
            className="inline-flex items-center text-emerald-600 hover:text-emerald-700"
          >
            <ArrowLeft className="mr-1 h-4 w-4" />
            返回上传页面
          </Link>
        </div>
      </div>
    );
  }
  
  if (!recognition) {
    return (
      <div className="max-w-3xl mx-auto">
        <div className="bg-yellow-50 p-6 rounded-lg text-center">
          <h2 className="text-xl font-bold text-yellow-600 mb-2">未找到识别结果</h2>
          <p className="text-yellow-600 mb-4">该识别记录可能不存在或已被删除</p>
          <Link
            href="/food-recognition/upload"
            className="inline-flex items-center text-emerald-600 hover:text-emerald-700"
          >
            <ArrowLeft className="mr-1 h-4 w-4" />
            返回上传页面
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto">
      <div className="mb-6">
        <Link
          href="/food-recognition/history"
          className="inline-flex items-center text-emerald-600 hover:text-emerald-700"
        >
          <ArrowLeft className="mr-1 h-4 w-4" />
          返回识别历史
        </Link>
      </div>

      <h1 className="text-2xl font-bold mb-6">食物识别结果</h1>

      <div className="bg-white rounded-lg shadow-md overflow-hidden mb-6">
        <div className="relative w-full h-64">
          <img
            src={getImageUrl(recognition.imageUrl)}
            alt="食物图片"
            className="w-full h-full object-cover"
          />
        </div>

        <div className="p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold">识别到的食物</h2>
            <span className="text-gray-500 text-sm">
              {new Date(recognition.timestamp).toLocaleString('zh-CN')}
            </span>
          </div>

          <div className="bg-emerald-50 p-4 rounded-lg mb-6">
            <div className="flex justify-between items-center">
              <span className="text-emerald-800 font-medium">总热量</span>
              <span className="text-emerald-800 font-bold text-xl">{recognition.totalNutrition.calories} 千卡</span>
            </div>
          </div>

          <div className="space-y-4">
            {recognition.foods.map((food: any, index: number) => (
              <div key={index} className="border-b border-gray-100 pb-4 last:border-0 last:pb-0">
                <div className="flex justify-between items-center mb-2">
                  <h3 className="font-medium">{food.name}</h3>
                  <span className="bg-emerald-100 text-emerald-800 px-2 py-1 rounded text-sm">
                    {food.calories} 千卡
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-4 text-sm text-gray-600">
                  <div>
                    <span className="text-gray-500">数量：</span>
                    {food.amount}
                  </div>
                  {food.weight && (
                    <div>
                      <span className="text-gray-500">重量：</span>
                      {food.weight} {food.unit || '克'}
                    </div>
                  )}
                  {food.protein && (
                    <div>
                      <span className="text-gray-500">蛋白质：</span>
                      {food.protein} 克
                    </div>
                  )}
                  {food.carbs && (
                    <div>
                      <span className="text-gray-500">碳水：</span>
                      {food.carbs} 克
                    </div>
                  )}
                  {food.fat && (
                    <div>
                      <span className="text-gray-500">脂肪：</span>
                      {food.fat} 克
                    </div>
                  )}
                  {food.fiber && (
                    <div>
                      <span className="text-gray-500">纤维：</span>
                      {food.fiber} 克
                    </div>
                  )}
                </div>
                {food.id && (
                  <div className="mt-2">
                    <Link
                      href={`/food-search/${food.id}`}
                      className="text-sm text-emerald-600 hover:text-emerald-700 inline-flex items-center"
                    >
                      <Info className="h-3 w-3 mr-1" />
                      查看详细营养信息
                    </Link>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="flex justify-center space-x-4">
        <Link
          href="/food-recognition/upload"
          className="px-4 py-2 border border-emerald-600 text-emerald-600 rounded-lg hover:bg-emerald-50"
        >
          继续识别
        </Link>
        {!recognition.savedToDiary ? (
          <button
            onClick={handleSaveToDiary}
            disabled={isSaving}
            className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:opacity-50"
          >
            {isSaving ? '保存中...' : '添加到今日记录'}
          </button>
        ) : (
          <Link
            href="/nutrition/daily"
            className="px-4 py-2 bg-gray-500 text-white rounded-lg"
          >
            已添加到日记
          </Link>
        )}
      </div>
    </div>
  );
}
