'use client';

import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { toast } from 'react-hot-toast';
import communityService from '@/lib/api/communityService';
import { useAuth } from '@/lib/hooks/useAuth'; // 添加这个导入

interface ImagePreview {
  file: File;
  url: string;
  caption: string;
}

export default function CreatePostPage() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { user, isAuthenticated } = useAuth(); // 添加用户认证

  console.log('User:', user);
  
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    tags: [] as string[],
    currentTag: ''
  });
  
  const [images, setImages] = useState<ImagePreview[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // 热门标签建议（实际应从 API 获取）
  const popularTags = [
    '减肥', '健身', '营养', '食谱', '健康饮食',
    '素食', '蛋白质', '维生素', '运动', '瘦身'
  ];

  // 表单验证
  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.title.trim()) {
      newErrors.title = '标题不能为空';
    } else if (formData.title.length < 5) {
      newErrors.title = '标题至少需要5个字符';
    } else if (formData.title.length > 100) {
      newErrors.title = '标题不能超过100个字符';
    }

    if (!formData.content.trim()) {
      newErrors.content = '内容不能为空';
    } else if (formData.content.length < 20) {
      newErrors.content = '内容至少需要20个字符';
    } else if (formData.content.length > 10000) {
      newErrors.content = '内容不能超过10000个字符';
    }

    if (formData.tags.length > 5) {
      newErrors.tags = '标签数量不能超过5个';
    }

    if (images.length > 5) {
      newErrors.images = '图片数量不能超过5张';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // 处理输入变化
  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    
    // 清除对应字段的错误
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: ''
      }));
    }
  };

  // 添加标签
  const addTag = () => {
    const tag = formData.currentTag.trim();
    if (tag && !formData.tags.includes(tag) && formData.tags.length < 5) {
      setFormData(prev => ({
        ...prev,
        tags: [...prev.tags, tag],
        currentTag: ''
      }));
    }
  };

  // 移除标签
  const removeTag = (tagToRemove: string) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.filter(tag => tag !== tagToRemove)
    }));
  };

  // 添加热门标签
  const addPopularTag = (tag: string) => {
    if (!formData.tags.includes(tag) && formData.tags.length < 5) {
      setFormData(prev => ({
        ...prev,
        tags: [...prev.tags, tag]
      }));
    }
  };

  // 处理图片选择
  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    
    if (images.length + files.length > 5) {
      toast.error('最多只能上传5张图片');
      return;
    }

    files.forEach(file => {
      // 检查文件大小（5MB）
      if (file.size > 5 * 1024 * 1024) {
        toast.error('图片大小不能超过5MB');
        return;
      }

      // 检查文件类型
      if (!file.type.startsWith('image/')) {
        toast.error('只能上传图片文件');
        return;
      }

      const reader = new FileReader();
      reader.onload = (e) => {
        const newImage: ImagePreview = {
          file,
          url: e.target?.result as string,
          caption: ''
        };
        
        setImages(prev => [...prev, newImage]);
      };
      reader.readAsDataURL(file);
    });

    // 重置文件输入
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // 更新图片说明
  const updateImageCaption = (index: number, caption: string) => {
    setImages(prev => prev.map((img, i) => 
      i === index ? { ...img, caption } : img
    ));
  };

  // 移除图片
  const removeImage = (index: number) => {
    setImages(prev => prev.filter((_, i) => i !== index));
  };

  // 提交表单
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // 检查用户是否登录
    if (!isAuthenticated || !user) {
      toast.error('请先登录后再发布帖子');
      router.push('/login'); // 跳转到登录页面
      return;
    }
    
    if (!validateForm()) {
      return;
    }
    
    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);

    try {
      // 构建 FormData
      const submitData = new FormData();
      submitData.append('title', formData.title);
      submitData.append('content', formData.content);
      submitData.append('author_id', user.userId); // 临时硬编码，实际应从用户认证获取

      // 添加标签
      formData.tags.forEach(tag => {
        submitData.append('tags[]', tag);
      });

      // 添加图片
      images.forEach((image, index) => {
        submitData.append('images[]', image.file);
        submitData.append('imageCaptions[]', image.caption);
      });

      const response = await communityService.createPost(submitData);

      console.log('Post creation response:', response);
      
      if (response.status === 201) {
        toast.success('帖子发布成功！');
        router.push('/community/posts');
      } else {
        throw new Error(response.message || '发布失败');
      }
    } catch (error: any) {
      console.error('Error creating post:', error);
      toast.error(error.message || '发布失败，请重试');
    } finally {
      setIsSubmitting(false);
    }
  };

  // 如果用户未登录，显示登录提示
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-50 py-8 flex items-center justify-center">
        <div className="max-w-md mx-auto text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">请先登录</h2>
          <p className="text-gray-600 mb-6">发布帖子需要先登录您的账户</p>
          <button
            onClick={() => router.push('/login')}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            前往登录
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        {/* 页面标题 */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">发布新帖子</h1>
          <p className="text-gray-600">分享你的健康饮食经验和心得</p>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* 标题输入 */}
            <div>
              <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-2">
                标题 *
              </label>
              <input
                type="text"
                id="title"
                value={formData.title}
                onChange={(e) => handleInputChange('title', e.target.value)}
                placeholder="请输入帖子标题（5-100字符）"
                className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                  errors.title ? 'border-red-500' : 'border-gray-300'
                }`}
                maxLength={100}
              />
              {errors.title && (
                <p className="mt-1 text-sm text-red-600">{errors.title}</p>
              )}
              <p className="mt-1 text-sm text-gray-500">
                {formData.title.length}/100 字符
              </p>
            </div>

            {/* 内容输入 */}
            <div>
              <label htmlFor="content" className="block text-sm font-medium text-gray-700 mb-2">
                内容 *
              </label>
              <textarea
                id="content"
                value={formData.content}
                onChange={(e) => handleInputChange('content', e.target.value)}
                placeholder="分享你的健康饮食经验、食谱或心得体会..."
                rows={12}
                className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none ${
                  errors.content ? 'border-red-500' : 'border-gray-300'
                }`}
                maxLength={10000}
              />
              {errors.content && (
                <p className="mt-1 text-sm text-red-600">{errors.content}</p>
              )}
              <p className="mt-1 text-sm text-gray-500">
                {formData.content.length}/10000 字符
              </p>
            </div>

            {/* 标签输入 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                标签（最多5个）
              </label>
              
              {/* 当前标签显示 */}
              {formData.tags.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-3">
                  {formData.tags.map((tag, index) => (
                    <span
                      key={index}
                      className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-blue-100 text-blue-800"
                    >
                      #{tag}
                      <button
                        type="button"
                        onClick={() => removeTag(tag)}
                        className="ml-2 text-blue-600 hover:text-blue-800"
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
              )}

              {/* 标签输入框 */}
              <div className="flex gap-2 mb-3">
                <input
                  type="text"
                  value={formData.currentTag}
                  onChange={(e) => handleInputChange('currentTag', e.target.value)}
                  placeholder="输入标签"
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      addTag();
                    }
                  }}
                />
                <button
                  type="button"
                  onClick={addTag}
                  disabled={!formData.currentTag.trim() || formData.tags.length >= 5}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
                >
                  添加
                </button>
              </div>

              {/* 热门标签建议 */}
              <div>
                <p className="text-sm text-gray-600 mb-2">热门标签建议：</p>
                <div className="flex flex-wrap gap-2">
                  {popularTags.map((tag) => (
                    <button
                      key={tag}
                      type="button"
                      onClick={() => addPopularTag(tag)}
                      disabled={formData.tags.includes(tag) || formData.tags.length >= 5}
                      className="px-3 py-1 text-sm border border-gray-300 rounded-full hover:bg-gray-50 disabled:bg-gray-100 disabled:cursor-not-allowed"
                    >
                      #{tag}
                    </button>
                  ))}
                </div>
              </div>

              {errors.tags && (
                <p className="mt-1 text-sm text-red-600">{errors.tags}</p>
              )}
            </div>

            {/* 图片上传 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                图片（最多5张，每张不超过5MB）
              </label>
              
              {/* 图片预览 */}
              {images.length > 0 && (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
                  {images.map((image, index) => (
                    <div key={index} className="relative border border-gray-200 rounded-lg p-3">
                      <div className="relative aspect-video mb-2">
                        <Image
                          src={image.url}
                          alt={`预览图片 ${index + 1}`}
                          fill
                          className="object-cover rounded"
                        />
                        <button
                          type="button"
                          onClick={() => removeImage(index)}
                          className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600"
                        >
                          ×
                        </button>
                      </div>
                      <input
                        type="text"
                        value={image.caption}
                        onChange={(e) => updateImageCaption(index, e.target.value)}
                        placeholder="图片说明（可选）"
                        className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                  ))}
                </div>
              )}

              {/* 上传按钮 */}
              {images.length < 5 && (
                <div>
                  <input
                    ref={fileInputRef}
                    type="file"
                    multiple
                    accept="image/*"
                    onChange={handleImageSelect}
                    className="hidden"
                  />
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="w-full h-32 border-2 border-dashed border-gray-300 rounded-lg flex flex-col items-center justify-center hover:border-gray-400 hover:bg-gray-50"
                  >
                    <svg className="w-8 h-8 text-gray-400 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                    <p className="text-sm text-gray-600">点击选择图片</p>
                    <p className="text-xs text-gray-500">支持 JPG、PNG 格式，单张不超过5MB</p>
                  </button>
                </div>
              )}

              {errors.images && (
                <p className="mt-1 text-sm text-red-600">{errors.images}</p>
              )}
            </div>

            {/* 提交按钮 */}
            <div className="flex gap-4 pt-6">
              <button
                type="button"
                onClick={() => router.back()}
                className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                disabled={isSubmitting}
              >
                取消
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
              >
                {isSubmitting ? '发布中...' : '发布帖子'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}