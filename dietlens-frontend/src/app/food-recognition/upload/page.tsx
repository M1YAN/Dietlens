'use client';

import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/hooks/useAuth';
import { Camera, Upload, Image as ImageIcon } from 'lucide-react';
import { foodRecognitionService } from '@/lib/api';
import Image from 'next/image';

export default function FoodRecognitionUpload() {
  const { user, isAuthenticated } = useAuth();
  const router = useRouter();
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [mealType, setMealType] = useState<string>('lunch'); // 默认为午餐
  const fileInputRef = useRef<HTMLInputElement>(null);

  // 处理文件选择
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.type.startsWith('image/')) {
        setSelectedImage(file);
        setPreviewUrl(URL.createObjectURL(file));
        setError(null);
      } else {
        setError('请选择图片文件（JPEG, PNG, WebP等）');
      }
    }
  };

  // 处理拖放
  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file) {
      if (file.type.startsWith('image/')) {
        setSelectedImage(file);
        setPreviewUrl(URL.createObjectURL(file));
        setError(null);
      } else {
        setError('请选择图片文件（JPEG, PNG, WebP等）');
      }
    }
  };

  // 处理拖放区域的事件
  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
  };

  // 处理上传按钮点击
  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  // 处理识别提交
  const handleRecognize = async () => {
    if (!selectedImage) {
      setError('请先选择一张食物图片');
      return;
    }

    if (!user?.userId) {
      setError('请先登录');
      return;
    }

    setIsUploading(true);
    setError(null);

    try {
      const response = await foodRecognitionService.recognizeFood(
        selectedImage,
        user.userId,
        mealType
      );

      // 识别成功，跳转到结果页面
      console.log('识别结果:', response);
      router.push(`/food-recognition/${response.data.recognitionId}`);
    } catch (err: any) {
      console.error('Recognition error:', err);
      setError(err.response?.data?.message || '识别过程中出错，请重试');
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">食物识别</h1>

      <div className="bg-white rounded-lg shadow-md p-6">
        <div
          className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center cursor-pointer hover:border-emerald-500 transition-colors"
          onClick={handleUploadClick}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
        >
          {previewUrl ? (
            <div className="relative w-full max-w-md mx-auto">
              <Image
                src={previewUrl}
                alt="食物预览"
                width={400}
                height={300}
                className="mx-auto rounded-lg max-h-80 object-contain"
              />
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setSelectedImage(null);
                  setPreviewUrl(null);
                }}
                className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </button>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-12">
              <div className="bg-emerald-100 rounded-full p-4 mb-4">
                <Camera className="h-10 w-10 text-emerald-600" />
              </div>
              <h3 className="text-lg font-medium mb-2">上传食物图片</h3>
              <p className="text-gray-500 mb-4">点击或拖放图片到此处</p>
              <div className="flex items-center space-x-2 text-sm text-gray-500">
                <ImageIcon className="h-4 w-4" />
                <span>支持 JPEG, PNG, WebP 等格式</span>
              </div>
            </div>
          )}
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            accept="image/*"
            className="hidden"
          />
        </div>

        {/* 餐次选择 */}
        <div className="mt-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">选择餐次</label>
          <select
            value={mealType}
            onChange={(e) => setMealType(e.target.value)}
            className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500"
          >
            <option value="breakfast">早餐</option>
            <option value="lunch">午餐</option>
            <option value="dinner">晚餐</option>
            <option value="snack">零食</option>
          </select>
        </div>

        {error && (
          <div className="mt-4 p-3 bg-red-50 text-red-600 rounded-md">
            {error}
          </div>
        )}

        <div className="mt-6 flex justify-center">
          <button
            onClick={handleRecognize}
            disabled={!selectedImage || isUploading}
            className="bg-emerald-600 text-white px-6 py-3 rounded-lg hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-opacity-50 disabled:opacity-50 flex items-center"
          >
            {isUploading ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-white mr-2"></div>
                识别中...
              </>
            ) : (
              <>
                <Camera className="mr-2 h-5 w-5" />
                开始识别
              </>
            )}
          </button>
        </div>

        <div className="mt-8">
          <h3 className="text-lg font-medium mb-3">使用提示</h3>
          <ul className="list-disc pl-5 space-y-2 text-gray-600">
            <li>尽量拍摄清晰的食物照片，避免过暗或过亮</li>
            <li>尽可能包含完整的食物，以便更准确地识别</li>
            <li>如果一餐有多种食物，可以分别拍摄识别</li>
            <li>识别结果可能需要手动调整数量和份量</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
