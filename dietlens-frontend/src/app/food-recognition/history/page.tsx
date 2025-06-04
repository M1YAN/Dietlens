'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/hooks/useAuth';
import { foodRecognitionService } from '@/lib/api';
import Image from 'next/image';
import { getImageUrl, formatDate } from '@/lib/utils';
import Link from 'next/link';
import { ArrowLeft, Calendar } from 'lucide-react';

export default function RecognitionHistory() {
  const router = useRouter();
  const { user, isAuthenticated } = useAuth();
  const [history, setHistory] = useState<any>({ 
    records: [], 
    total: 0, 
    totalPages: 0, 
    currentPage: 1 
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/auth/login');
      return;
    }

    const fetchHistory = async () => {
      try {
        if (user?.userId) {
          console.log('Fetching history for user:', user.userId, 'page:', currentPage);
          const response = await foodRecognitionService.getHistory({
            userId: user.userId,
            page: currentPage,
            limit: 10
          });
          
          console.log('History response page:', response.data);
          
          // 确保数据结构正确
          const historyData = {
            records: response.data.items || [],
            total: response.data.total || 0,
            totalPages: response.data.totalPages || 0,
            currentPage: response.data.currentPage || 1
          };
          
          setHistory(historyData);
        }
      } catch (err: any) {
        console.error('Failed to fetch history:', err);
        setError(err.response?.data?.message || '获取历史记录失败');
      } finally {
        setIsLoading(false);
      }
    };

    fetchHistory();
  }, [isAuthenticated, user, currentPage, router]);

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

  // 安全检查 records 数组
  const records = history?.records || [];
  const totalPages = history?.totalPages || 0;

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="mb-6">
        <Link
          href="/dashboard"
          className="inline-flex items-center text-emerald-600 hover:text-emerald-700"
        >
          <ArrowLeft className="mr-1 h-4 w-4" />
          返回仪表盘
        </Link>
      </div>

      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">食物识别历史</h1>
        <Link
          href="/food-recognition/upload"
          className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700"
        >
          新建识别
        </Link>
      </div>

      {error && (
        <div className="bg-red-50 p-4 rounded-lg text-red-600 mb-6">
          {error}
        </div>
      )}

      {records.length === 0 ? (
        <div className="bg-white rounded-lg shadow-md p-8 text-center">
          <div className="flex justify-center mb-4">
            <Calendar className="h-16 w-16 text-gray-300" />
          </div>
          <h2 className="text-xl font-medium mb-2">暂无识别记录</h2>
          <p className="text-gray-500 mb-6">您还没有进行过食物识别</p>
          <Link
            href="/food-recognition/upload"
            className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700"
          >
            开始第一次识别
          </Link>
        </div>
      ) : (
        <>
          {/* 显示统计信息 */}
          <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-600">
                共找到 <span className="font-medium text-gray-900">{history.total}</span> 条记录
              </div>
              <div className="text-sm text-gray-600">
                第 {currentPage} 页，共 {totalPages} 页
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            {records.map((record: any) => (
              <Link
                key={record.recognitionId}
                href={`/food-recognition/${record.recognitionId}`}
                className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow"
              >
                <div className="relative w-full h-40">
                  <Image
                    src={getImageUrl(record.imageUrl)}
                    alt="食物图片"
                    fill
                    className="object-cover"
                    onError={(e) => {
                      console.error('Image load error:', e);
                      // 可以设置一个默认图片
                      // e.currentTarget.src = '/default-food-image.jpg';
                    }}
                  />
                </div>
                <div className="p-4">
                  <div className="flex justify-between items-center mb-2">
                    <div className="font-medium">
                      {record.foods && Array.isArray(record.foods) && record.foods.length > 0 
                        ? record.foods.map((food: any) => food.name || '未知食物').join(', ') 
                        : '未识别食物'}
                    </div>
                    <div className="bg-emerald-100 text-emerald-800 px-2 py-1 rounded text-sm">
                      {record.totalCalories || 0} 千卡
                    </div>
                  </div>
                  <div className="text-sm text-gray-500">
                    {formatDate(record.timestamp)}
                  </div>
                  
                  {/* 显示营养信息预览 */}
                  {record.totalNutrition && (
                    <div className="mt-2 grid grid-cols-3 gap-2 text-xs text-gray-600">
                      <div>蛋白质: {parseFloat(record.totalNutrition.protein || 0).toFixed(1)}g</div>
                      <div>碳水: {parseFloat(record.totalNutrition.carbs || 0).toFixed(1)}g</div>
                      <div>脂肪: {parseFloat(record.totalNutrition.fat || 0).toFixed(1)}g</div>
                    </div>
                  )}
                </div>
              </Link>
            ))}
          </div>

          {/* 分页 */}
          {totalPages > 1 && (
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
                const showPages = 5; // 显示的页码数量
                let start = Math.max(1, currentPage - Math.floor(showPages / 2));
                let end = Math.min(totalPages, start + showPages - 1);
                
                // 调整起始页
                if (end - start < showPages - 1) {
                  start = Math.max(1, end - showPages + 1);
                }
                
                // 显示第一页和省略号
                if (start > 1) {
                  pages.push(
                    <button
                      key={1}
                      onClick={() => handlePageChange(1)}
                      className="px-3 py-2 border rounded-lg hover:bg-gray-50"
                    >
                      1
                    </button>
                  );
                  if (start > 2) {
                    pages.push(<span key="ellipsis1" className="px-2">...</span>);
                  }
                }
                
                // 显示中间页码
                for (let i = start; i <= end; i++) {
                  pages.push(
                    <button
                      key={i}
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
                
                // 显示最后一页和省略号
                if (end < totalPages) {
                  if (end < totalPages - 1) {
                    pages.push(<span key="ellipsis2" className="px-2">...</span>);
                  }
                  pages.push(
                    <button
                      key={totalPages}
                      onClick={() => handlePageChange(totalPages)}
                      className="px-3 py-2 border rounded-lg hover:bg-gray-50"
                    >
                      {totalPages}
                    </button>
                  );
                }
                
                return pages;
              })()}
              
              <button
                onClick={() => handlePageChange(Math.min(totalPages, currentPage + 1))}
                disabled={currentPage === totalPages}
                className="px-3 py-2 border rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
              >
                下一页
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}